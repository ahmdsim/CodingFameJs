const shell = require('shelljs')

export default function (req, res, _) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (url.searchParams.get('repo') == null) {
    res.end()
    return
  }

  const output = []
  shell.exec(`cd ${url.searchParams.get('repo')}`, {silent: true})
  url.searchParams.get('extensions').split(',').forEach((extension) => {
    let lines = shell.exec(`(for /r %f in (*.${extension}) do @type "%f") | find /c /v ""`, { silent: true }).stdout;
    output.push([extension, Number(lines)]);
  });

  res.write(JSON.stringify(output))
  res.end()
}
