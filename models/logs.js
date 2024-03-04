const mongoose = require("mongoose");

const opt = {
  versionKey: false,
};
const statSchema = new mongoose.Schema(
  {
    added: Number,
    deleted: Number,
    filepath: String,
  },
  { _id: false }
);

const logschema = new mongoose.Schema(
  {
    sha: {
      type: String,
      required: true,
      unique: true,
    },
    author: {
      name: String,
      email: String,
    },
    merge: String,
    date: Date,
    message: String,
    stat: {
      type: [statSchema],
      select: "-_id",
    },
    tags: [String],
    branches: [String],
    repository: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository', required: false },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: false },
  },
  opt
);

module.exports = mongoose.model("Logs", logschema);
