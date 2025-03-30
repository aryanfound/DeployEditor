const CodeSpace = require('../models/codespace');
const codespace=require('../models/codespace')
const usermodel=require('../models/usermodel')
const mongoose=require('mongoose');
async function createCodeSpace(req, res) {
    try {
        const { name,  accessKey } = req.body;

        if (!name || !accessKey) {
            return res.status(400).json({ error: "Name and email are required" });
        }

        // Create new CodeSpace
        const userSpace = new codespace({
            Name: name,
            Owners: [req.userid], // Should be ObjectId, change it accordingly
            accessKey: accessKey
        });

        const result=await userSpace.save();
        const spaceid=result._id;
        console.log('user id is');
        console.log(req.userid)
       const user= await usermodel.findByIdAndUpdate(
            req.userid,
            { $push: { codeSpaces:  spaceid  } }, 
            { new: true } // To return updated document (optional)
        );
        console.log(user);

        return res.status(201).json({ message: "CodeSpace created successfully", codespace: userSpace });
    } catch (error) {
        console.error("Error creating CodeSpace:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}


async function getCodeSpace(req, res) {
    console.log('getting code');
    try {
        const userid = req.userid;
        const user = await usermodel.findById(userid).populate('codeSpaces', 'Name Owners'); // Adjust fields as needed
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.json(user.codeSpaces);
    } catch (err) {
        console.error("Error fetching code spaces:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

async function getSpaceInfo(req,res){
    console.log(req.body);
    const {spaceid}=req.body;
    if(!spaceid){
        return res.status(400).json({msg:"Space ID is required"})
    }
    else{
        const space=await codespace.findById(spaceid).populate('Owners','name email')
        if(!space){
            return res.status(404).json({msg:"Codespace not found"})
        }
        console.log(space)
        return res.status(200).json(space)
    }
}

async function joinSpace(req,res){
    console.log(req.body);
    try {
        const spaceid = req.body.accessKey;
        const userid = req.userid;
    
        // Ensure spaceid is a valid ObjectId before using it in the update
        if (!mongoose.Types.ObjectId.isValid(spaceid)) {
            console.log("Invalid spaceid:", spaceid);
            return res.status(400).json({ error: "Invalid CodeSpace ID" });
        }
    
        if (!mongoose.Types.ObjectId.isValid(userid)) {
            console.log("Invalid userid:", userid);
            return res.status(400).json({ error: "Invalid User ID" });
        }
    
        // Push user ID into CodeSpace Owners array
        const result = await CodeSpace.findByIdAndUpdate(
            spaceid,
            { $push: { Owners: userid } }, // Corrected: Pushing the user ID, not the space ID
            { new: true } // Returns the updated document
        );
        console.log("Updated CodeSpace:", result);
    
        // Push CodeSpace ID into the user's codeSpaces array
        const userpush = await usermodel.findByIdAndUpdate(
            userid,
            { $push: { codeSpaces: spaceid } }, // Corrected field name (from codespace → codeSpaces)
            { new: true } // Returns the updated document
        );
        console.log("Updated User:", userpush);
    
        return res.status(200).send();
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
    
}
module.exports={createCodeSpace,getCodeSpace,getSpaceInfo,joinSpace}