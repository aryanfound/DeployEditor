const mongoose = require('mongoose');
const express = require('express');
const cookieParser = require('cookie-parser'); 
const app = express();
const authRouter=require('./routes/auth')
const createCodeSpace=require('./functions/codespace')

const {authMiddleware}=require('./routes/authmiddleware')
//const updateDatabase=require('./functions/updatamodel')


const cors = require('cors');
const codespaceRouter=require('./routes/codeSpaceRouter')
const PORT = 5001;
const HOST = '127.0.0.1';
const {Server} =require('socket.io')
const url = "mongodb://localhost:27017/Editor";
async function connectServer(){
    await mongoose.connect(url)
   
}
connectServer();




const http = require('http');
const server=http.createServer(app);
const { WebSocketServer } = require('ws');
const { v4: uuid } = require('uuid');
const io=new Server(server);


// ✅ CORS Configuration
const corsOptions = {
    origin: [ 'http://localhost:5173','http://172.16.0.2:3003','http://10.0.3.114:3003'],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true ,

};
app.use(cors(corsOptions));

// ✅ Log payload size
app.use((req, res, next) => {
    console.log(`Payload Size: ${req.headers['content-length']} bytes`);
    next();
});

// ✅ Corrected Payload Limit
app.use(express.json({ limit: "10000mb" }));
app.use(express.urlencoded({ limit: "10000mb", extended: true }));
app.use(cookieParser());


// ✅ Express Middleware & Routes




app.use('/',authMiddleware);








app.use('/',authRouter);


app.use('/auth',authRouter);
app.use('/space',codespaceRouter)







server.listen(PORT,'0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);
});
