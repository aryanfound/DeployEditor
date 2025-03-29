const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    fileName: { type: String, required: true },
    fileType: { type: String, enum: ['java', 'c++', 'python', 'js'], required: true },
    createdAt: { type: Date, default: Date.now },
    
    fileContent: { type: String, default: '' }, // Current version of code
    currCommitDescription: { type: String, default: '' },
    currCommitFile: { type: String, default: '' },
    currReplacedFiles: { type: String, default: '' },

    lastfileContent: { type: String, default: '' }, // Previous version of code
    lastCommitDescription: { type: String, default: '' },
    lastCommitFile: { type: String, default: '' },
    lastReplacedFiles: { type: String, default: '' }
});

// Prevent model overwriting
const FileModel = mongoose.models.File || mongoose.model('File', fileSchema);
module.exports = FileModel;
