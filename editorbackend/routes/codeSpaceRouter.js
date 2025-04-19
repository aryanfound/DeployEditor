const express=require('express');
const {createCodeSpace,getCodeSpace,getSpaceInfo,joinSpace,commitCode}=require('../functions/codespace')
const router=express.Router();

router.post('/newCodeSpace',createCodeSpace);

router.post('/getCodeSpace',getCodeSpace);

router.post('/getSpaceInfo',getSpaceInfo)

router.post('/joinCodeSpace',joinSpace)

router.post('/commit',commitCode)



module.exports=router