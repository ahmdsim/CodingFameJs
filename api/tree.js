
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
  if (url.searchParams.get('repo') === null) {
    res.end()
    return
  }

  const fg = require('fast-glob')

  const repo = url.searchParams.get('repo');
  const result = await fg([repo + '/**/*'], { dot: true })
  const output = parse(result, repo)

  res.write(JSON.stringify(output))
  res.end()
}
