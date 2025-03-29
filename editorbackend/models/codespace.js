const mongoose = require('mongoose');

const codeSpaceSchema = new mongoose.Schema({
    Name: { type: String, required: true },
    Owners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    folders: [{
        Name: { type: String, required: true },
        files: [{ 
            name: { type: String, required: true }, 
            docId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' } // Reference to FileModel
        }]
    }],

    accessKey: { type: String, default: '' },
    codespaceId: { type: String, default: '' }
});

// Prevent model overwriting
const CodeSpace = mongoose.models.CodeSpace || mongoose.model('CodeSpace', codeSpaceSchema);
module.exports = CodeSpace;
