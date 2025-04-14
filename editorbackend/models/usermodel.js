const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    notifications: { type: [mongoose.Schema.Types.Mixed], default: [] }, // Store notifications

    // Storing references to the user's CodeSpaces
    codeSpaces: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'CodeSpace' // Reference to CodeSpace model
    }], 
    
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // User connections
});

// Prevent model overwriting
const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = UserModel;
