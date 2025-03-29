const fileModel = require('../models/fileModel');
const userModel = require('../models/userModel');

// 1️⃣ Create User (For Testing Purposes)
async function createUser(req, res) {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newUser = new userModel({
            username,
            email,
            password
        });

        await newUser.save();
        res.status(201).json({ message: "User created successfully", user: newUser });

    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// 2️⃣ Post a New File
async function postFile(req, res) {
    try {
        const { email, fileName, fileType, fileContent, currCommitDescription, currCommitFile, currReplacedFiles } = req.body;

        if (!email || !fileName || !fileType || !fileContent) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Check if user exists
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Create new file entry
        const newFile = new fileModel({
            fileName,
            fileType,
            fileContent,  
            currCommitDescription, 
            currCommitFile, 
            currReplacedFiles
        });

        const savedFile = await newFile.save();

        // Link file to user
        await userModel.findOneAndUpdate(
            { email },
            { $push: { files: { name: fileName, docId: savedFile._id } } },
            { new: true }
        );

        res.status(201).json({ message: "File saved and linked successfully", file: savedFile });

    } catch (error) {
        console.error("Error posting file:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// 3️⃣ Push Update to Existing File (Versioning)
async function push(req, res) {
    try {
        const { email, fileName, fileContent, currCommitDescription, currCommitFile, currReplacedFiles } = req.body;

        if (!email || !fileName || !fileContent) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Find the file ID inside user
        const user = await userModel.findOne({ email, "files.name": fileName }, { "files.$": 1 });

        if (!user || !user.files || user.files.length === 0) {
            return res.status(404).json({ error: "File not found" });
        }

        const fileId = user.files[0].docId;

        // Fetch existing file
        const existingFile = await fileModel.findById(fileId);
        if (!existingFile) {
            return res.status(404).json({ error: "File not found" });
        }

        // Move current values to last values
        const updatedFile = await fileModel.findByIdAndUpdate(
            fileId,
            {
                $set: {
                    lastfileContent: existingFile.fileContent,  
                    lastCommitDescription: existingFile.currCommitDescription,  
                    lastCommitFile: existingFile.currCommitFile,
                    lastReplacedFiles: existingFile.currReplacedFiles,

                    fileContent,  
                    currCommitDescription, 
                    currCommitFile, 
                    currReplacedFiles
                }
            },
            { new: true }
        );

        res.status(200).json({ message: "File updated successfully", file: updatedFile });

    } catch (error) {
        console.error("Error updating file:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// 4️⃣ Retrieve a File (Fork Operation)
async function fork(req, res) {
    try {
        const { email, fileName } = req.body;

        const user = await userModel.findOne({ email, "files.name": fileName }, { "files.$": 1 });

        if (!user || !user.files || user.files.length === 0) {
            return res.status(404).json({ error: "File not found" });
        }

        const fileId = user.files[0].docId;
        const fileData = await fileModel.findById(fileId);

        if (!fileData) {
            return res.status(404).json({ error: "File not found" });
        }

        res.status(200).json({ message: "File retrieved successfully", file: fileData });

    } catch (error) {
        console.error("Error retrieving file:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = { createUser, postFile, push, fork };
