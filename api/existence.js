export default function (req, res, _) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.searchParams.get('path') === null || url.searchParams.get('path') === '') {
    res.end(JSON.stringify({ isRepo: false, repos: [] }));
    return;
  }

  const fs = require('fs');
  const path = url.searchParams.get('path');

  function isGitRepository(dirPath) {
    const gitPath = require('path').join(dirPath, '.git');
    return fs.existsSync(gitPath);
  }

  function findGitRepositories(rootPath) {
    const subdirs = fs.readdirSync(rootPath, { withFileTypes: true });
    const gitRepos = [];

    for (const subdir of subdirs) {
      if (subdir.isDirectory()) {
        const subdirPath = require('path').join(rootPath, subdir.name);
        if (isGitRepository(subdirPath)) {
          gitRepos.push(subdirPath);
        }
      }
    }

    return gitRepos;
  }

  const result = { isRepo: false, repos: [] };

  if (fs.existsSync(path)) {
    if (isGitRepository(path)) {
      result.isRepo = true;
    } else {
      const gitRepos = findGitRepositories(path);
      if (gitRepos.length > 0) {
        result.repos = gitRepos;
      }
    }
  }

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(result));
}
