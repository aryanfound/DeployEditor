const codeSpace = require('../models/codespace');
const mongoose = require('mongoose');

async function updatedFile({ codeSpaceInfo, files, socket }) {
    // Debug: Log the incoming ID
    console.log('Received codeSpaceInfo:', codeSpaceInfo, 'Type:', typeof codeSpaceInfo);
    
    // Validate input
    if (!codeSpaceInfo || !files) {
        const errorMsg = 'codeSpaceInfo and files are required';
        console.error(errorMsg);
        if (socket) socket.emit('files-update-error', { error: errorMsg });
        throw new Error(errorMsg);
    }

    // Convert to string if it isn't already
    const idString = String(codeSpaceInfo).trim();
    
    // Validate MongoDB ID format
    if (!mongoose.isValidObjectId(idString)) {
        const errorMsg = `Invalid codeSpace ID format: ${idString}`;
        console.error(errorMsg);
        if (socket) socket.emit('files-update-error', { error: errorMsg });
        throw new Error(errorMsg);
    }

    try {
        const result = await codeSpace.findByIdAndUpdate(
            idString, // Mongoose can handle string IDs
            {
                $set: {
                    Files: JSON.stringify(files),
                    updatedAt: new Date()
                }
            },
            { new: true }
        );

        if (!result) {
            const errorMsg = `CodeSpace not found with ID: ${idString}`;
            console.error(errorMsg);
            if (socket) socket.emit('files-update-error', { error: errorMsg });
            throw new Error(errorMsg);
        }

        console.log('Update successful:', result._id);
        
        if (socket) {
            socket.emit('files-updated', { 
                success: true,
                codeSpaceId: result._id,
                updatedFiles: files 
            });
        }

        return result;
    } catch (err) {
        console.error('Update error:', err.message);
        if (socket) {
            socket.emit('files-update-error', { 
                error: err.message,
                stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
            });
        }
        throw err;
    }
}

module.exports = updatedFile;