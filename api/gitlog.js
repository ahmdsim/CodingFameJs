const shell = require('shelljs')
const minimatch = require('minimatch')

export default function (req, res, _) {
  res.setHeader('Content-Type', 'application/json');
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (url.searchParams.get('repo') == null) {
    res.end()
    return
  }
  let gitFilterParams = ''
  let ignores = []
  const repo = url.searchParams.get('repo')
  if (url.searchParams.get('after') != null) {
    gitFilterParams += `--after=${url.searchParams.get('after')} `
  } else {
    const now = new Date()
    const lastMonth = new Date(now.setDate(now.getDate() - 30)).toISOString().substring(0, 10)
    gitFilterParams += `--after=${lastMonth} `
  }
  if (url.searchParams.get('before') != null) {
    gitFilterParams += `--before=${url.searchParams.get('before')} `
  }

  if (url.searchParams.get('author') != null) {
    gitFilterParams += `--author=${url.searchParams.get('author')} `
  }

  if (url.searchParams.get('ignore') != null) {
    ignores = url.searchParams.get('ignore').replace(/ /g, '').split(',')
  }

  const maxloc = url.searchParams.has('maxloc') && /^\d+$/.test(url.searchParams.get('maxloc')) ? parseInt(url.searchParams.get('maxloc')) : null;

  if (url.searchParams.get('squashed') != null) {
  }
  if (url.searchParams.get('feature') != null) {
    gitFilterParams += `--all `
    if (url.searchParams.get('main') == null) {
      const ref = shell.exec(`cd ${url.searchParams.get('repo')} && cat .git/HEAD`, { silent: true }).stdout
      const parts = ref.split('/');
      const mainBranch = parts[parts.length - 1];
      gitFilterParams += `--not `+mainBranch
    }
  }

  
  const gitlog = shell.exec(`cd ${url.searchParams.get('repo')} && git log --numstat --decorate=full ${gitFilterParams}`, { silent: true }).stdout
  const parsegit = require('parse-git-numstat')
  const commits = parsegit(gitlog)

  const output = {
    authors: {
    },
    lines: {
      added: 0,
      deleted: 0
    },
    commits: 0,
  }

  let parsedCommits = []

  commits.forEach((commit) => {
    let added = 0
    let deleted = 0
    if (commit.stat.length > 0) {
      added = commit.stat.reduce((p, n) => {
        if (fileExcluded(n.filepath)) {
          return p
        } else {
          return p + n.added
        }
      }, 0)
      deleted = commit.stat.reduce((p, n) => {
        if (fileExcluded(n.filepath)) {
          return p
        } else {
          return p + n.deleted
        }
      }, 0)
      if (maxloc) {
        if ((added+deleted) <= maxloc) {
          parsedCommits.push({date: commit.date, stat: [{added: added, deleted: deleted}]})
        }
      } else {
        parsedCommits.push({date: commit.date, stat: [{added: added, deleted: deleted}]})
      }
      if (maxloc === null || (maxloc !== null && (added+deleted) <= maxloc)) {
        if (output.authors[commit.author.email] && output.authors[commit.author.email] != null) {
          output.authors[commit.author.email].lines.added += added;
          output.authors[commit.author.email].lines.deleted += deleted;
  
          output.authors[commit.author.email].details.push([
            commit.sha,
            commit.date.toISOString().substring(0, 10),
            [added, deleted],
            commit.stat.filter((info) => !(fileExcluded(info["filepath"]))),
            repo
          ])
          output.authors[commit.author.email].commits += 1
        } else {
          output.authors[commit.author.email] = {
            lines: {
              added: added,
              deleted: deleted
            },
            commits: 1,
            details: [
              [
                commit.sha,
                commit.date.toISOString().substring(0, 10),
                [added, deleted],
                commit.stat.filter((info) => !(fileExcluded(info["filepath"]))),
                repo
              ]
            ]
          }
        }
      }
     
    }
  })
  output.commits = parsedCommits.length
  output.lines.added = parsedCommits.reduce((p, n) => {return p + n.stat[0].added}, 0)
  output.lines.deleted = parsedCommits.reduce((p, n) => {return p + n.stat[0].deleted}, 0)

  if (url.searchParams.get('raw') != null) {
    res.write(JSON.stringify(parsedCommits))
    res.end()
    return
  }

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
