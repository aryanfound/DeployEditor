const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    notifications: { type: [mongoose.Schema.Types.Mixed], default: [] }, // Store notifications
    files: [{ 
        name: { type: String, required: true }, 
        docId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' } // Reference to FileModel
    }], 

    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Connections to other users
});

// Prevent model overwriting
const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = UserModel;
