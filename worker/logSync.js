const shell = require('shelljs');
const Promise = require('bluebird');
const Logs = require('../models/logs');
const { connectToDatabase, disconnectFromDatabase } = require('./db');

function logSyncTask() {
    async function run() {
        const repo = '__repo_path__';
        let gitFilterParams = '';
        const now = new Date();
        const lastThreeMonth = new Date(now.setDate(now.getDate() - 190)).toISOString().substring(0, 10);
        gitFilterParams += `--after=${lastThreeMonth} `;
        gitFilterParams += `--all `;

        const gitlog = shell.exec(`cd ${repo} && git log --numstat --decorate=full ${gitFilterParams}`, { silent: true }).stdout;
        const parsegit = require('parse-git-numstat');
        const commits = parsegit(gitlog);
        await insertCommits(commits);
    }

    async function insertCommits(commits) {
        try {
            await connectToDatabase();
    
            const concurrency = 5; // Number of concurrent operations
            let successes = 0;
            let skipped = 0;
            let failures = 0;
    
            // Use Promise.map to handle concurrency
            await Promise.map(commits, async commit => {
                try {
                    const result = await Logs.findOneAndUpdate(
                        { sha: commit.sha },
                        commit,
                        { upsert: true }
                    );
                    if (result === null) {
                        successes++; // Inserted
                    } else {
                        skipped++; // Skipped (already exists)
                    }
                } catch (error) {
                    console.error('Failed to insert commit:', commit.sha, error);
                    failures++;
                }
            }, { concurrency });
    
            console.log(`Added: ${successes}\nSkipped: ${skipped}\nFailed: ${failures}`);
    
            await disconnectFromDatabase();
        } catch (error) {
            console.error('Error during insertion:', error);
            await disconnectFromDatabase();
        }
    }
    

    return { run };
}

module.exports = logSyncTask;
