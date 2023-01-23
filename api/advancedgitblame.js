const shell = require('shelljs')
var BlameJS = require("blamejs")
const fg = require('fast-glob')
const minimatch = require('minimatch')
const Queue = require('bull')
const fs = require('fs');
const hash = require('object-hash')

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
  if (url.searchParams.get('repopath') == null) {
    res.end()
    return
  }

  const chartQueue = new Queue('gitblame-queue', 'redis://127.0.0.1:6379');

  chartQueue.process(async function (job, done) {
    let repopath = job.data.repopath
    let ignores = job.data.ignores
    let files = [];
    var jobHash = hash(job.data)

    const result = await fg([repopath + '/**/*'], { dot: true })
    const repotree = parse(result, repopath)
    repotree.forEach((file) => {
      files = files.concat(extractFiles(file, ignores))
    });
    fs.writeFile(`analyses/${jobHash}`, JSON.stringify({analysis: '{}', progress: 0}), (err) => {
      if (err) {
        console.log(err)
      }
    });

    const blamejs = new BlameJS();   
    let authors = new Map();
    var step = (files.length - files.length % 10) / 10;

    for (let i = 0; i < files.length; i++) {
      let file = files[i]
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

      if (i % step == 0 && 0 < i % step < 10) {
        let intermediateAuthors = new Map()
        for (let author of authors.keys()) {
          intermediateAuthors.set(author, Object.fromEntries(authors.get(author).entries()))
        }
        let intermediate = JSON.stringify(Object.fromEntries(intermediateAuthors.entries()));
        
        var interProgress = 10 * (i / step)

        fs.writeFile(`analyses/process_${i}_${jobHash}`, JSON.stringify(interProgress), (err) => {
          if (err) {
            console.log(err)
          }
        });
    
        fs.writeFile(`analyses/${jobHash}`, JSON.stringify({analysis: intermediate, progress: interProgress}), (err) => {
          if (err) {
            console.log(err)
          }
        });
      }
    }

    for (let author of authors.keys()) {
      authors.set(author, Object.fromEntries(authors.get(author).entries()))
    }

    let output = JSON.stringify(Object.fromEntries(authors.entries()));

    fs.writeFile(`analyses/${jobHash}`, JSON.stringify({analysis: output, progress: 100}), (err) => {
      if (err) {
        console.log(err)
      }
    });
    done(null, output)
  })

  let jobData = {
    repopath: url.searchParams.get('repopath'),
    ignores: url.searchParams.get('ignores') ? url.searchParams.get('ignores').split(',') : []
  }

  var jobHash = hash(jobData)

  let output = ''
  try {
    let fileData = fs.readFileSync(`analyses/${jobHash}`, {encoding: 'utf8', flag: 'r'})
    output = fileData
  } catch {
    chartQueue.add(jobData)
  }

  chartQueue.on('error', (err) => {
    fs.writeFile(`analyses/${jobHash}_error`, JSON.stringify(err), (erro) => {
      if (erro) {
        console.log(erro)
      }
    })})

  res.write(JSON.stringify(output))
  res.end()
  return
}