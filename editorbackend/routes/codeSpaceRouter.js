const express=require('express');
const {createCodeSpace,getCodeSpace,getSpaceInfo}=require('../functions/codespace')
const router=express.Router();

router.post('/newCodeSpace',createCodeSpace);

router.post('/getCodeSpace',getCodeSpace);

router.post('/getSpaceInfo',getSpaceInfo)
module.exports=router