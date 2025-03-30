const mongoose = require('mongoose');

const codeSpaceSchema = new mongoose.Schema({
    Name: { type: String, required: true },
    Owners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    folder: {
        folderName: { type: String }, // Single folder
        files: [
            {
                name: { type: String, required: true },
                docId: { type: mongoose.Schema.Types.ObjectId } // Reference to File model
            }
        ]
    },

    accessKey: { type: String, default: '' },
    codespaceId: { type: String, default: '' }
});

// Prevent model overwriting
const CodeSpace = mongoose.models.CodeSpace || mongoose.model('CodeSpace', codeSpaceSchema);
module.exports = CodeSpace;
