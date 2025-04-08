const CodeSpace = require("../models/codespace");
const mongoose = require("mongoose");

async function updateFile({ codeSpaceInfo, files, io }) {
    try {
        const result = await CodeSpace.findOneAndUpdate(
            { codespaceId: codeSpaceInfo },
            { 
                $set: { 
                    Files: JSON.stringify(files),
                    updatedAt: new Date() 
                } 
            },
            { new: true }
        );

        if (!result) {
            throw new Error(`Codespace ${codeSpaceInfo} not found`);
        }

        // Log all active room IDs
        const rooms = io.sockets.adapter.rooms;
        const activeRooms = [...rooms.keys()];
        console.log("📌 Active Rooms:", activeRooms);

        // Emit to all owners of the codespace
        if (result.Owners && io) {
            result.Owners.forEach((owner) => {
                const ownerId = owner.toString(); // Ensure it's a string

                if (activeRooms.includes(ownerId)) {
                    console.log(`✅ Emitting update to owner: ${ownerId}`);
                    io.to(ownerId).emit("filesUpdated", {
                        files: files,
                        codeSpaceId: codeSpaceInfo,
                        updatedAt: new Date()
                    });
                } else {
                    console.error(`❌ Error: Owner ${ownerId} is not connected to the socket`);
                }
            });
        }

        return result;
    } catch (err) {
        console.error("❌ Database update failed:", err);
        throw err;
    }
}

module.exports = updateFile;
