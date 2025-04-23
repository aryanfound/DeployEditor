const  usermodel=require('../models/usermodel')


function getConnection(req,res){
    console.log('getting connections')
    const userid=req.userid
    const part=req.query.part
    try{
        usermodel
    }
}


module.exports=getConnection