const shell = require('shelljs')

export default function (req, res, _) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (url.searchParams.get('file') == null) {
    res.end()
    return
  }

  let dirpath = url.searchParams.get('file').split('/');
  const filename = dirpath.pop();
  dirpath = dirpath.join('/');

  const gitblame = shell.exec(`cd ${dirpath} && git blame ${filename} -p`, { silent: true }).stdout;

  var BlameJS = require("blamejs");
  var blamejs = new BlameJS();
  blamejs.parseBlame(gitblame);
  // Get the commit data
  var commitData = blamejs.getCommitData();
  // Get the line data array, each item containing a reference to
  // commits that can be then referenced in commitData

  var lineData = blamejs.getLineData();

  const output = [];

  for (let ind in lineData) {
    let data = commitData[lineData[ind].hash];
    let author = data["authorMail"];
    let date = data["authorTime"];
    date = new Date(Number(date) * 1000).toISOString().substring(0, 10);
    let description = data["summary"];
    output.push({
      author: author,
      date: date,
      description: description
    });
  }

  res.write(JSON.stringify(output))
  res.end()
}
