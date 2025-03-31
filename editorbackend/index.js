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
  const userId = socket.userId;
  socket.join(userId);
  if (!userFiles[userId]) {
    userFiles[userId] = { files: [], fileContents: {}, codeSpaceInfo: { spaceId: "default", ownerId: userId } };
  }
  
  console.log(`✅ User connected: ${socket.id} (User ID: ${userId})`);
  socket.emit("updateFiles", (userFiles[userId]));

    socket.on("updateFiles", ({ files, fileContents, codeSpaceInfo }) => {
    console.log(`🔄 Received updateFiles event from ${userId}`);
    console.log("Files:", files);
    console.log("File Contents:", fileContents);
    console.log("CodeSpace Info:", codeSpaceInfo);
    
    try {
      const parsedCodeSpaceInfo = typeof codeSpaceInfo === "string" ? JSON.parse(codeSpaceInfo) : codeSpaceInfo;
      if (userFiles[userId]) {
         updateFile({codeSpaceInfo,files,socket});
      }
    } catch (error) {
      console.error("❌ Error parsing codeSpaceInfo:", error);
    }
  });

  socket.on("addFile", (newFile) => {
    console.log(`➕ Adding file for ${userId}:`, newFile);
    if (userFiles[userId]) {
      userFiles[userId].files.push(newFile);
      userFiles[userId].fileContents[newFile.id] = newFile.content || "";
      socket.emit("updateFiles", userFiles[userId]);
      handle
    }
  });

  socket.on("leaveRoom", () => {
    console.log(`🚪 ${userId} left the room`);
    socket.leave(userId);
  });

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
