const shell = require('shelljs')
const minimatch = require('minimatch')

export default function (req, res, _) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (url.searchParams.get('repo') == null) {
    res.end()
    return
  }
  let gitFilterParams = ''
  let ignores = []
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

  const gitlog = shell.exec(`cd ${url.searchParams.get('repo')} && git log --numstat ${gitFilterParams}`, { silent: true }).stdout
  const parsegit = require('parse-git-numstat')
  const commits = parsegit(gitlog)

  if (url.searchParams.get('raw') != null) {
    res.write(JSON.stringify(commits))
    res.end()
    return
  }
  const output = {
    authors: {
    },
    lines: {
      added: 0,
      deleted: 0
    },
    commits: 0,
    files: []
  }
  const files = []
  commits.forEach((commit) => {
    if (output.authors[commit.author.email] && output.authors[commit.author.email] != null) {
      if (commit.stat.length > 0) {
        output.authors[commit.author.email].lines.added += commit.stat.reduce((p, n) => {
          if (fileExcluded(n.filepath)) {
            return p
          } else {
            return p + n.added
          }
        }, 0)
        output.authors[commit.author.email].lines.deleted += commit.stat.reduce((p, n) => {
          if (fileExcluded(n.filepath)) {
            return p
          } else {
            return p + n.deleted
          }
        }, 0)
      }
      output.authors[commit.author.email].commits += 1
    } else {
      output.authors[commit.author.email] = {
        lines: {
          added: commit.stat.reduce((p, n) => {
            if (fileExcluded(n.filepath)) {
              return p
            } else {
              return p + n.added
            }
          }, 0),
          deleted: commit.stat.reduce((p, n) => {
            if (fileExcluded(n.filepath)) {
              return p
            } else {
              return p + n.deleted
            }
          }, 0)
        },
        commits: 1
      }
    }

    output.lines.added += commit.stat.reduce((p, n) => {
      if (fileExcluded(n.filepath)) {
        return p
      } else {
        return p + n.added
      }
    }, 0)

    output.lines.deleted += commit.stat.reduce((p, n) => {
      if (fileExcluded(n.filepath)) {
        return p
      } else {
        return p + n.deleted
      }
    }, 0)
    output.commits += 1
  })

  res.write(JSON.stringify(output))
  res.end()

  function fileExcluded (filepath) {
    for (let i = 0; i < ignores.length; i++) {
      const ignorePattern = ignores[i]
      if (minimatch(filepath, ignorePattern, { matchBase: true })) {
        return true
      }
    }
    return false
  }
}
