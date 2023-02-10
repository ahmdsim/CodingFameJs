export class Author {
    email;
    name;
    commits = 0;
    lines = {};
    details = [];

    constructor (email, name, commits, lines, details) {
      this.email = email
      this.name = name
      this.commits = commits
      this.lines = lines
      this.details = details
    }
}
