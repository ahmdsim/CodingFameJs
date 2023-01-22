export class Repository {
  path;
  ignoredFiles = [];
  authors = [];
  commits = 0;
  lines = {};

  constructor (path, ignoredFiles, authors, commits, lines) {
    this.path = path
    this.authors = authors
    this.ignoredFiles = ignoredFiles ?? []
    this.commits = commits
    this.lines = lines
  }
}
