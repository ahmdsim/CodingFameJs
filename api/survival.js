const shell = require('shelljs')
const minimatch = require('minimatch')
var BlameJS = require("blamejs")
const fg = require('fast-glob')


function extractFiles (file) {
  if (file["children"].length === 0) {
    return [file.path]
  } else {
    let files = [];
    file.children.forEach((child) => {
      files = files.concat(extractFiles(child));
    })
    return files
  }
}
  
function createNode (path, tree, fullpath, repo, currentPath = null) {
  const name = path.shift()
  const idx = tree.findIndex(function (e) {
    return e.name == name
  })
  if (currentPath === null) {
    currentPath = `${repo}/${name}`
  } else {
    currentPath += `/${name}`
  }
  if (idx < 0) {
    if (name) {
      tree.push({
        name,
        children: [],
        path: currentPath,
        repo
      })
    }
    if (path.length !== 0) {
      if (name) {
        createNode(path, tree[tree.length - 1].children, fullpath, repo, currentPath)
      }
    }
  } else if (name) {
    createNode(path, tree[idx].children, fullpath, repo, currentPath)
  }
}

function parse (data, repo) {
  const tree = []
  for (let i = 0; i < data.length; i++) {
    const path = data[i]
    const split = path.replace(repo, '').split('/').filter(x => x !== '')
    createNode(split, tree, path, repo)
  }
  return tree
}


export default async function (req, res, _) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (url.searchParams.get('repo') == null) {
    res.end()
    return
  }

  let output = ''
  let gitFilterParams = ''
  let ignores = []

  let currentTime = ''
  const repopath = url.searchParams.get('repo')
  let author = ''
  let sinceDate = ''
  let proofDate = ''

  if (url.searchParams.get('after') != null) {
    gitFilterParams += `--after=${url.searchParams.get('after')} `
    sinceDate = url.searchParams.get('after')
    let now = new Date()
    currentTime = `${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}${now.getHours()}${now.getMinutes()}${now.getSeconds()}`
  } else {
    let now = new Date()
    const lastMonth = new Date(now.setDate(now.getDate() - 30)).toISOString().substring(0, 10)
    gitFilterParams += `--after=${lastMonth} `
  }
  if (url.searchParams.get('date') != null) {
    proofDate = url.searchParams.get('date')
  }

  if (url.searchParams.get('before') != null) {
    gitFilterParams += `--before=${url.searchParams.get('before')} `
  }

  if (url.searchParams.get('author') != null) {
    gitFilterParams += `--author=${url.searchParams.get('author')} `
    author = url.searchParams.get('author')
  }

  if (url.searchParams.get('ignore') != null) {
    ignores = url.searchParams.get('ignore').replace(/ /g, '').split(',')
  }

  let gitlog = shell.exec(`cd ${url.searchParams.get('repo')} && git log --numstat ${gitFilterParams}`, { silent: true }).stdout
  const parsegit = require('parse-git-numstat')
  const commits = parsegit(gitlog)
  const firstCommits = commits.map((commit) => commit.sha)

  let lastCommit = 0

  if (commits.length && commits.length > 0) {
    lastCommit = commits[0].sha
  }

  shell.exec(`cd ${url.searchParams.get('repo')} && git branch blame_${currentTime} ${lastCommit}`, { silent: true })
  shell.exec(`cd ${url.searchParams.get('repo')} && git checkout blame_${currentTime}`,  { silent: true })

  output = [];

  let files = [];

  // shell.exec(`cd ${url.searchParams.get('repo')}`)
  // files = shell.exec(`dir -r  | % { if (!($_.PsIsContainer)) { $_.FullName } }`, { silent: true }).stdout

  const result = await fg([repopath + '/**/*'], { dot: true })
  const repotree = parse(result, repopath)
  repotree.forEach((file) => {
    files = files.concat(extractFiles(file))
  });

  var blamejs = new BlameJS();
  let authors = new Map();
  const beforeDate = new Date(sinceDate).getDate()

  files.filter((file) => !(fileExcluded(file))).forEach((file) => {
    let dirpath = file.split('/');
    const filename = dirpath.pop();
    dirpath = dirpath.join('/');
    let ext = filename.split('.').pop()

    const gitblame = shell.exec(`cd ${dirpath} && git blame ${filename} -p`, { silent: true }).stdout;
    blamejs.parseBlame(gitblame);
    var commitData = blamejs.getCommitData();
    var lineData = blamejs.getLineData();

    for (let ind in lineData) {
      let author = commitData[lineData[ind].hash]["authorMail"];

      let date = commitData[lineData[ind].hash]["authorTime"];
      date = new Date(Number(date) * 1000);

      if (beforeDate > date.getTime()) {
        continue
      }

      if (authors.get(author)) {
        if (authors.get(author).get(ext)) {
          authors.get(author).set(ext, authors.get(author).get(ext) + 1)
        } else {
          authors.get(author).set(ext, 1)
        }
        authors.get(author).set('.all', authors.get(author).get('.all') + 1)
      } else {
        let newAuthor = new Map()
        newAuthor.set(ext, 1)
        newAuthor.set('.all', 1)
        authors.set(author, newAuthor)
      }
    }
  })

  shell.exec(`cd ${url.searchParams.get('repo')} && git checkout ${'development'}`)
  shell.exec(`cd ${url.searchParams.get('repo')} && git branch -d blame_${currentTime}`)

  gitlog = shell.exec(`cd ${url.searchParams.get('repo')} && git log --numstat ${gitFilterParams}`, { silent: true }).stdout
  let lateCommits = parsegit(gitlog)

  lastCommit = 0

  if (lateCommits.length && lateCommits.length > 0) {
    lastCommit = lateCommits[0].sha
  }

  shell.exec(`cd ${url.searchParams.get('repo')} && git branch blame_${currentTime} ${lastCommit}`, { silent: true })
  shell.exec(`cd ${url.searchParams.get('repo')} && git checkout blame_${currentTime}`, { silent: true })

  files = [];

  // shell.exec(`cd ${url.searchParams.get('repo')}`)
  // files = shell.exec(`dir -r  | % { if (!($_.PsIsContainer)) { $_.FullName } }`, { silent: true }).stdout

  let newResult = await fg([repopath + '/**/*'], { dot: true })
  let newRepotree = parse(newResult, repopath)
  newRepotree.forEach((file) => {
    files = files.concat(extractFiles(file))
  });

  let afterAuthors = new Map()
  let afterDate = new Date(url.searchParams.get('before')).getTime()
  files.filter((file) => !(fileExcluded(file))).forEach((file) => {
    let dirpath = file.split('/');
    const filename = dirpath.pop();
    dirpath = dirpath.join('/');
    let ext = filename.split('.').pop()

    const gitblame = shell.exec(`cd ${dirpath} && git blame ${filename} -p`, { silent: true }).stdout;
    blamejs.parseBlame(gitblame);
    var commitData = blamejs.getCommitData();
    var lineData = blamejs.getLineData();

    for (let ind in lineData) {
      let author = commitData[lineData[ind].hash]["authorMail"];

      let date = commitData[lineData[ind].hash]["authorTime"];
      date = new Date(Number(date) * 1000);

      
      if (afterDate < date.getTime() || date.getTime() < beforeDate) {
        continue
      }

      if (afterAuthors.get(author)) {
        if (afterAuthors.get(author).get(ext)) {
          afterAuthors.get(author).set(ext, afterAuthors.get(author).get(ext) + 1)
        } else {
          afterAuthors.get(author).set(ext, 1)
        }
        afterAuthors.get(author).set('.all', afterAuthors.get(author).get('.all') + 1)
      } else {
        let newAuthor = new Map()
        newAuthor.set(ext, 1)
        newAuthor.set('.all', 1)
        afterAuthors.set(author, newAuthor)
      }
    }
  })

  shell.exec(`cd ${url.searchParams.get('repo')} && git checkout ${'development'}`, { silent: true })
  shell.exec(`cd ${url.searchParams.get('repo')} && git branch -d blame_${currentTime}`, { silent: true })

  for (let author of authors.keys()) {
    authors.set(author, Object.fromEntries(authors.get(author).entries()))
  }
  for (let author of afterAuthors.keys()) {
    afterAuthors.set(author, Object.fromEntries(afterAuthors.get(author).entries()))
  }
  
  output = {before: Object.fromEntries(authors.entries()), after: Object.fromEntries(afterAuthors.entries())};
  // output = {before: previousImpact, after: proofedImpact}
  res.write(JSON.stringify(output))
  res.end()
  
  function fileExcluded(filepath) {
    for (let i = 0; i < ignores.length; i++) {
      const ignorePattern = ignores[i]
      if (minimatch(filepath, ignorePattern, { matchBase: true })) {
        return true
      }
    }
    return false
  }
}
