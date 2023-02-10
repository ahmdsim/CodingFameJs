
export default function (req, res, _) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (url.searchParams.get('file') === null || url.searchParams.get('file') === '') {
    res.end('--')
    return
  }
  const fs = require('fs')
  let result = ''
  const path = url.searchParams.get('file')
  try {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        res.write(err.name)
        res.write(err.message)
        res.end()
        return
      }
      result = data
      res.write(result)
      res.end()
    })
  } catch {
    res.end('--')
  }
}
