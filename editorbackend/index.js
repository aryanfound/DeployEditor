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
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://172.16.0.2:3003", "http://10.0.3.114:3003"],
    methods: ["GET", "POST"],
  },
});

const PORT = 5001;
const MONGO_URL = "mongodb://localhost:27017/Editor";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn("⚠️ Warning: JWT_SECRET is not defined. Ensure you have a .env file with JWT_SECRET.");
}

const connectServer = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  }
};
connectServer();

const corsOptions = {
  origin: ["http://localhost:5173", "http://172.16.0.2:3003", "http://10.0.3.114:3003"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use('/', authMiddleware);
app.get("/getusers", getUser);
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
    next();
  } catch (err) {
    console.log("❌ Invalid Token. Disconnecting...");
    next(new Error("Authentication error"));
  }
};

io.use(authenticateSocket);
io.on("connection", (socket) => {
    
    const { token} = socket.handshake.query;
    console.log(token)

    const decode=jwt.verify(token, JWT_SECRET)
    console.log(decode)
    const userId=decode.userId
    
    // Join user's personal room and initialize files
    socket.join(userId);
    if (!userFiles[userId]) {
      userFiles[userId] = { 
        files: [], 
        fileContents: {}, 
        codeSpaceInfo: { 
          spaceId: "default", 
          ownerId: userId 
        } 
      };
    }
  
    // Send initial files to client
    socket.emit("updateFiles", userFiles[userId]);
  
    // Handle file updates
    socket.on("updateFiles", async ({ files, codeSpaceInfo }) => {

      try {
        console.log(`🔄 Received files update from ${userId} for space ${codeSpaceInfo}`);
        
        // Update local state
        userFiles[userId].files = Array.isArray(files) ? files : JSON.parse(files);
        userFiles[userId].codeSpaceInfo.spaceId = codeSpaceInfo;
  
        // Update database
        await updateFile({
          codeSpaceInfo: codeSpaceInfo,
          files: userFiles[userId].files,
          socket: socket
          ,io:io
        });
  
        // Broadcast to all clients in this codespace
        socket.to(`codespace_${codeSpaceInfo}`).emit("updateFiles", {
          files: userFiles[userId].files,
          codeSpaceInfo: codeSpaceInfo
        });
  
      } catch (err) {
        console.error("❌ File update error:", err);
        socket.emit("updateError", {
          error: "UPDATE_FAILED",
          message: err.message
        });
      }
    });
  
    // Handle new file creation
    socket.on("addFile", async (newFile) => {
      try {
        console.log(`➕ ${userId} adding file:`, newFile.name);
        
        if (userFiles[userId]) {
          // Update local state
          userFiles[userId].files.push(newFile);
          userFiles[userId].fileContents[newFile.id] = newFile.content || "";
          
          // Get current codespace ID
          const spaceId = userFiles[userId].codeSpaceInfo.spaceId;
  
          // Update database
          await updateFile({
            codeSpaceInfo: spaceId,
            files: userFiles[userId].files,
            socket: socket
          });
  
          // Broadcast update
          socket.to(`codespace_${spaceId}`).emit("updateFiles", {
            files: userFiles[userId].files,
            codeSpaceInfo: spaceId
          });
        }
      } catch (err) {
        console.error("❌ Add file error:", err);
        socket.emit("updateError", {
          error: "ADD_FILE_FAILED",
          message: err.message
        });
      }
    });
  
    // Handle room management
    socket.on("joinCodeSpace", (spaceId) => {
      console.log(`🚪 ${userId} joining codespace ${spaceId}`);
      socket.join(`codespace_${spaceId}`);
      userFiles[userId].codeSpaceInfo.spaceId = spaceId;
    });
  
    socket.on("leaveCodeSpace", () => {
      const spaceId = userFiles[userId]?.codeSpaceInfo?.spaceId;
      if (spaceId) {
        console.log(`🚪 ${userId} leaving codespace ${spaceId}`);
        socket.leave(`codespace_${spaceId}`);
      }
    });
  
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${userId} (${socket.id})`);
    });
  });

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
