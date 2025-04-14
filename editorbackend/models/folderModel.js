const mongoose = require('mongoose');

const FolderSchema = new mongoose.Schema({
  name: String,
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  subfolders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }],
  files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }]
});

module.exports = mongoose.model('Folder', FolderSchema);