const codespace=require('../models/codespace')
async function createCodeSpace(req, res) {
    try {
        const { name, email, accessKey } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: "Name and email are required" });
        }

        // Create new CodeSpace
        const userSpace = new CodeSpaceModel({
            Name: name,
            Owners: [email], // Should be ObjectId, change it accordingly
            accessKey: accessKey
        });

        await userSpace.save();

        res.status(201).json({ message: "CodeSpace created successfully", codespace: userSpace });
    } catch (error) {
        console.error("Error creating CodeSpace:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

module.exports=createCodeSpace