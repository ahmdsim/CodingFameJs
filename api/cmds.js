const shell = require("shelljs");
export default function (req, res, _) {
  const [path] = req.url.split("?");
  const [action] = path.split("/").filter(Boolean);
  switch (action) {
    case "clean-checkout":
      cleanCheckout();
      break;
  }

  function cleanCheckout() {
    if (req.method === "POST") {
      let data = "";
      req.on("data", (chunk) => {
        data += chunk;
      });
      req.on("end", () => {
        try {
          const jsonData = JSON.parse(data);
          const { repos } = jsonData;
          if(!repos.length) {
            res.write('No Repos found');
            res.end();
            return;
          }
          let result = [];
          repos.forEach((repo) => {
            result = [...result, `Remove local branches for ${repo}`];
            const clearCmd = shell.exec(
              `cd ${repo} && git branch | grep -v "^\*" | xargs git branch -D && git remote prune origin`,
              { silent: true }
            ).stdout;
            result = [...result, `Checkout all branches for ${repo}`];
            const checkoutCmd = shell.exec(
              `cd ${repo} && for branch in $(git for-each-ref --format="%(refname:short)" refs/remotes/origin/); do git checkout -t "$branch"; done`,
              { silent: true }
            ).stdout;
            result = [...result, checkoutCmd];
          });

          res.write(result.join("\n"));
          res.end();
        } catch (error) {
          res.write(JSON.stringify({ error: "Invalid JSON data" }));
          res.end();
        }
      });
    }
  }
}
