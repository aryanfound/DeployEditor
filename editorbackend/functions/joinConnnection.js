const { connect } = require('mongoose')
const usermodel=require('../models/usermodel')


async function joinConnection({first,second,connectionMap}){
    console.log('joining connection ')
    console.log(first,second)
    try{
        const data1=await usermodel.findOneAndUpdate({username:first},{$addToSet:{connections:second}})
        const data2=await usermodel.findOneAndUpdate({username:second},{$addToSet:{connections:first}})
       
        const accepter=data2._id.toString()
        const sendersocket=connectionMap.get(data2._id.toString())
        console.log(sendersocket)
        sendersocket.emit('requestAcceptance',{
            acceptedby:first
        })
       

        
        console.log('message sent')

        

        //return res.status(200).json({msg:"Sent Successfully"})
    }
    catch(err){
        console.log(err)
        // res.status(500).send({msg:"error in inserting"})
    }
    
}

module.exports=joinConnection