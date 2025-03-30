const express=require('express');
const {postFile,fork,push}=require('../functions/file')

const router=express.Router();



router.post('/post',postFile)



router.post('/fork',fork)

router.post('/push',push)


module.exports=router