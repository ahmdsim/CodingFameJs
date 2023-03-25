
export default function (req, res, _) {
    const url = new URL(req.url, `http://${req.headers.host}`)
    if (url.searchParams.get('path') === null || url.searchParams.get('path') === '') {
      res.end('--')
      return
    }

    const fs = require('fs')
    let result = ''
    const path = url.searchParams.get('path')

    try {
      fs.accessSync(path);
      res.write('true')
    } catch (err) {
      res.write('false')
    }

    res.end()
  }
  