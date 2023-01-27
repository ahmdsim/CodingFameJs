const shell = require('shelljs')
const minimatch = require('minimatch')
var BlameJS = require("blamejs")
const fg = require('fast-glob')
const Queue = require('bull')
const hash = require('object-hash')
const fs = require('fs');


// function extractFiles (file) {
//   if (file["children"].length === 0) {
//     return [file.path]
//   } else {
//     let files = [];
//     file.children.forEach((child) => {
//       files = files.concat(extractFiles(child));
//     })
//     return files
//   }
// }
function fileExcluded(filepath, ignores) {
  for (let i = 0; i < ignores.length; i++) {
    const ignorePattern = ignores[i]
    if (minimatch(filepath, ignorePattern, { matchBase: true })) {
      return true
    }
  }
  return false
}

function extractFiles (file, ignores) {
  if (file["children"].length === 0) {
    if (fileExcluded(file.path, ignores)) {
      return []
    }
    return [file.path]
  } else {
    let files = [];
    file.children.forEach((child) => {
      files = files.concat(extractFiles(child, ignores));
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

  const persistanceQueue = new Queue('persistance-queue', 'redis://127.0.0.1:6379');

  persistanceQueue.process(async function (jobData, done) {
    let job = jobData.data
    let gitlog = shell.exec(`cd ${job.repopath} && git log --numstat ${job.gitFilterParams}`, { silent: true }).stdout
    fs.writeFileSync(`analyses/persistence_${job.jobHash}`, '')
    done(null)
    const parsegit = require('parse-git-numstat')
    const commits = parsegit(gitlog)
    const firstCommits = commits.map((commit) => commit.sha)

    let lastCommit = 0

    if (commits.length && commits.length > 0) {
      lastCommit = commits[0].sha
    }

    shell.exec(`cd ${job.repopath} && git branch blame_${job.currentTime} ${lastCommit}`, { silent: true })
    shell.exec(`cd ${job.repopath} && git checkout blame_${job.currentTime}`,  { silent: true })

    output = [];

    let files = [];

    const result = await fg([job.repopath + '/**/*'], { dot: true })
    const repotree = parse(result, job.repopath)
    repotree.forEach((file) => {
      files = files.concat(extractFiles(file, job.ignores))
    });

    var blamejs = new BlameJS();
    let authors = new Map();

    const afterDate = new Date(job.after).getTime() / 1000
    const beforeDate = new Date(job.before).getTime() / 1000

    files.forEach((file) => {
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

        if (afterDate > date) {
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

    shell.exec(`cd ${job.repopath} && git checkout ${'development'}`)
    shell.exec(`cd ${job.repopath} && git branch -d blame_${job.currentTime}`)

    let newLog = shell.exec(`cd ${job.repopath} && git log --numstat --before=${job.proof} --after=${job.after}`, { silent: true}).stdout
    let newLateCommits = parsegit(newLog)

    lastCommit = 0

    if (newLateCommits.length && newLateCommits.length > 0) {
      lastCommit = newLateCommits[0].sha
    }

    shell.exec(`cd ${job.repopath} && git branch blame_${job.currentTime} ${lastCommit}`, { silent: true })
    shell.exec(`cd ${job.repopath} && git checkout blame_${job.currentTime}`, { silent: true })

    files = [];

    let newResult = await fg([job.repopath + '/**/*'], { dot: true })
    let newRepotree = parse(newResult, job.repopath)
    newRepotree.forEach((file) => {
      files = files.concat(extractFiles(file, job.ignores))
    });

    let afterAuthors = new Map()

    files.forEach((file) => {
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

        if (afterDate > date || date > beforeDate) {
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

    shell.exec(`cd ${job.repopath} && git checkout ${'development'}`, { silent: true })
    shell.exec(`cd ${job.repopath} && git branch -d blame_${job.currentTime}`, { silent: true })

    for (let author of authors.keys()) {
      authors.set(author, Object.fromEntries(authors.get(author).entries()))
    }
    for (let author of afterAuthors.keys()) {
      afterAuthors.set(author, Object.fromEntries(afterAuthors.get(author).entries()))
    }

    output = {before: JSON.stringify(Object.fromEntries(authors.entries())), after: JSON.stringify(Object.fromEntries(afterAuthors.entries()))};
    fs.writeFileSync(`analyses/persistence_${job.jobHash}`, JSON.stringify(output))
    done(null, output)
  })

  let jobData = {
    repopath: repopath,
    ignores: url.searchParams.get('ignore') ? url.searchParams.get('ignore').split(',') : [],
    after: sinceDate,
    before: url.searchParams.get('before'),
    proof: proofDate,
    gitFilterParams: gitFilterParams,
  }

  persistanceQueue.on('error', (err) => {
    fs.writeFile(`analyses/${jobHash}_error_persistence`, JSON.stringify(err), (erro) => {
      if (erro) {
        // console.log(erro)
      }
    })})

  var jobHash = hash(jobData)

  jobData.currentTime = currentTime
  jobData.jobHash = jobHash

  output = ''

  try {
    output = fs.readFileSync(`analyses/persistence_${jobHash}`)
  } catch {
    persistanceQueue.add(jobData)
  }

  // output = {before: previousImpact, after: proofedImpact}
  res.write(JSON.stringify(output))
  res.end()
  
  // function fileExcluded(filepath) {
  //   for (let i = 0; i < ignores.length; i++) {
  //     const ignorePattern = ignores[i]
  //     if (minimatch(filepath, ignorePattern, { matchBase: true })) {
  //       return true
  //     }
  //   }
  //   return false
  // }
}
