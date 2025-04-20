// server.js
const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { setupWSConnection } = require("y-websocket/bin/utils");
const WebSocket = require("ws");
const Y = require("yjs");
const awarenessProtocol = require("y-protocols/awareness");
const setupRoomAwarenessHandler = require("./roomAwareness");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 5003;
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/editorbackend";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET not defined");
  process.exit(1);
}

const corsOptions = {
  origin: ["http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

wss.documents = new Map();
wss.user=new Map()
// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  }
};

// WebSocket logic
wss.on("connection", (ws, req) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    const docName = url.pathname.slice(1) || "default";

    if (!token) throw new Error("Missing token");

    const decoded = jwt.verify(token, JWT_SECRET);
    ws.userId = decoded.userId;

    // Create new document room if it doesn't exist
    if (!wss.documents.has(docName)) {
      const ydoc = new Y.Doc();
      const awareness = new awarenessProtocol.Awareness(ydoc);
      const room = {
        ydoc,
        awareness,
        connections: new Set(),
        name: docName
      };

      wss.documents.set(docName, room);//setting a room
      wss.user.set(ws.userId,connections)//setting a connection


      setupRoomAwarenessHandler(room);
      console.log(`📂 New document room: ${docName}`);
    }

    const doc = wss.documents.get(docName);
    doc.connections.add(ws);

    // Setup WebSocket connection with Yjs
    setupWSConnection(ws, req, {
      docName: docName,
      gc: true,
      awareness: doc.awareness
    });

    // Handle client sync log
    ws.on('message', (msg) => {
    
     
        try {
        const data = JSON.parse(msg);
        console.log(data)
        if (data.type === "yjs-loaded") {
          console.log(`🚀 '${data.username}' fully synced to '${data.docName}'`);
        }
        
      } catch (e) {
        console.error("❌ Invalid message JSON");
      }
    });















    // Cleanup when client disconnects
    ws.on("close", () => {
      doc.connections.delete(ws);
      console.log(`👋 ${ws.userId} left ${docName}`);
      if (doc.connections.size === 0) {
        setTimeout(() => {
          if (doc.connections.size === 0) {
            wss.documents.delete(docName);
            console.log(`♻️ Cleaned room: ${docName}`);
          }
        }, 30000);
      }
    });


    // Keepalive ping/pong
    ws.isAlive = true;
    ws.on("pong", () => { ws.isAlive = true; });

  } catch (err) {
    console.error("❌ WebSocket error:", err.message);
    ws.close(4001, err.message);
  }
});

// Periodic ping
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// Room cleanup every 60s
setInterval(() => {
  wss.documents.forEach((doc, name) => {
    if (doc.connections.size === 0) {
      wss.documents.delete(name);
      console.log(`🧹 Removed inactive room: ${name}`);
    }
  });
}, 60000);

// Debug endpoint
app.get("/debug/rooms", (req, res) => {
  res.json({
    activeRooms: Array.from(wss.documents.keys()),
    stats: {
      totalConnections: wss.clients.size,
      versions: {
        yjs: require("yjs/package.json").version,
        yWebsocket: require("y-websocket/package.json").version,
        node: process.version
      }
    }
  });
});

// Start server
connectDB().then(() => {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running at ws://localhost:${PORT}`);
  });
});
