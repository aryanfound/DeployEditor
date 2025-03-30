const express=require('express');
const {createCodeSpace,getCodeSpace,getSpaceInfo,joinSpace}=require('../functions/codespace')
const router=express.Router();

router.post('/newCodeSpace',createCodeSpace);

router.post('/getCodeSpace',getCodeSpace);

router.post('/getSpaceInfo',getSpaceInfo)

router.post('/joinCodeSpace',joinSpace)

module.exports=router