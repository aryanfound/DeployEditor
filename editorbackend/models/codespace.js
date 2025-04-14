const mongoose = require('mongoose');



const yjs=mongoose.Schema({

})
const codeSpaceSchema = new mongoose.Schema({
    Name: { type: String, required: true },
    Admin:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    Owners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    Files: { type: String, default: '' },
    accessKey: { type: String, default: '' },
    codespaceId: { type: String, default: '' } ,// Will store ObjectId as a string
    centralyjs:{type:Buffer},
    split:[{name:{type:String},yjs:{type:Buffer}}]
});

// Middleware to automatically set `codespaceId` as a string version of `_id`
codeSpaceSchema.pre('save', function (next) {
    if (!this.codespaceId) {
        this.codespaceId = this._id.toString();
    }
    next();
});

// Prevent model overwriting
const CodeSpace = mongoose.models.CodeSpace || mongoose.model('CodeSpace', codeSpaceSchema);

module.exports = CodeSpace;
