const UserModel = require('../models/usermodel'); // Adjust path as needed

async function getUser(req, res) {
    console.log('finding user')
    try {
        const part = req.query.part;
        if (!part) {
            return res.status(400).json({ error: "Search term is required" });
        }

        // Case-insensitive search using regex
        const users = await UserModel.find({
            username: { $regex: part, $options: "i" } // "i" makes it case insensitive
        }).select("username email avatar"); // Select only necessary fields

        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = getUser;
