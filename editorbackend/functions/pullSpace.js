 
 const {copyCodeSpace}=require('./codespace')
 const codeSpaceModel=require('../models/codespace')

 async function pullSpace(req,res){
    const userid=req.userid
    
    const data=req.body.codespaceId

    const spacedata=await codeSpaceModel.findById(data)

    const spacefolderdata=spacedata.centralyjs

    const name=spacedata.Name

    console.log(spacedata)

    const copydata=await copyCodeSpace({name,req,res,spacefolderdata})

    


    

    
}
module.exports=pullSpace