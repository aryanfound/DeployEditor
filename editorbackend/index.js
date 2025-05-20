const mongoose = require("mongoose");
const express = require("express");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const authRouter = require("./routes/auth");
const getUser = require("./functions/getUser");
const { authMiddleware } = require("./routes/authmiddleware");
const codespaceRouter = require("./routes/codeSpaceRouter");
const updateFile=require('./socket/updateFile')
require('./socketIndex');

const Rooms=new Map()
const connectionMap=new Map()
const joinConnection=require('./functions/joinConnnection')
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://172.16.0.2:3003", "http://10.0.3.114:3003"],
    methods: ["GET", "POST"],
  },
});

const PORT = 5001;
const MONGO_URL = process.env.MONGO_URL;

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn("⚠️ Warning: JWT_SECRET is not defined. Ensure you have a .env file with JWT_SECRET.");
}

const connectServer = async () => {
  try {
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  }
};

connectServer()

const corsOptions = {
  origin: (origin, callback) => {
    callback(null, true); // Allow all origins
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.get("/getusers", getUser);
const getConnection = require('./functions/getConnection');
app.get('/getConnection', getConnection);
app.use('/', authMiddleware);
app.use("/auth", authRouter);
app.use("/space", codespaceRouter);

const userFiles = {}; 

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) {
    console.log("❌ No token provided. Disconnecting...");
    return next(new Error("Authentication error"));
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    connectionMap.set(socket.userId,socket)
    console.log("✅ User authenticated:", socket.userId);
  } catch (err) {
    console.log("❌ Invalid Token. Disconnecting...");
    next(new Error("Authentication error"));
  }

  
};


io.on('connection',socket=>{
  try{
    authenticateSocket(socket)

    socket.on('addConnection',data=>{
      console.log(data)
        const recipentId=data.recipent
        console.log(connectionMap.keys())
        if(connectionMap.has(recipentId)){
          console.log('recipent there in server')
          const recipentSocket=connectionMap.get(recipentId)
          recipentSocket.emit('requestConnection',data)
          console.log('data sent to recipent')
        }
      
    })

    socket.on('joinConnections',(data)=>{
      console.log(data)
      //const usesocket=connectionMap.get(socket.userId)
      joinConnection({first:data.first,second:data.second,connectionMap})
    })
    
  }
  catch(err){
    return socket.disconnect(true)
  }
})





server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
