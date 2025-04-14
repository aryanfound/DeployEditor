const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  name: String,
  folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  content: Buffer, // Yjs encoded document
  language: { type: String, default: 'javascript' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', FileSchema);