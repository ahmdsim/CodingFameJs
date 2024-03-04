const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
    title: { type: String, required: true }
});

const repositorySchema = new mongoose.Schema({
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    path: { type: String, required: true }
});

const branchSchema = new mongoose.Schema({
    repository: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository', required: true },
    name: { type: String, required: true },
    isOpen: { type: Boolean, default: true }
});

workspaceSchema.virtual('repositories', {
    ref: 'Repository',
    localField: '_id',
    foreignField: 'workspace'
});

repositorySchema.virtual('branches', {
    ref: 'Branch',
    localField: '_id',
    foreignField: 'repository'
});

const Workspace = mongoose.model('Workspace', workspaceSchema);
const Repository = mongoose.model('Repository', repositorySchema);
const Branch = mongoose.model('Branch', branchSchema);

module.exports = { Workspace, Repository, Branch };
