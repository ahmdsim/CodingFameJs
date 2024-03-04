const logSyncTask = require('./worker/logSync');

const logSync = logSyncTask();

logSync.run();