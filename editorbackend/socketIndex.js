const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { setupWSConnection } = require("y-websocket/bin/utils"); // Yjs WebSocket handler
const WebSocket = require("ws");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });
const PORT = 5003;
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/editorbackend";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn("⚠️ Warning: JWT_SECRET is not defined.");
}

const corsOptions = {
  origin: ["http://localhost:5173", "http://172.16.0.2:3003", "http://10.0.3.114:3003"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

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

// 🔐 Authenticate users on WebSocket upgrade
wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get("token");

  try {
    if (!token) {
      console.log("❌ Missing token in URL.");
      ws.close();
      return;
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    ws.userId = decoded.userId;
    console.log("✅ WebSocket Authenticated:", decoded.userId);

    // Pass control to y-websocket's internal handler
    setupWSConnection(ws, req, { docName: url.pathname.slice(1) }); // e.g. /room123 → docName: 'room123'
  } catch (err) {
    console.log("❌ Invalid token:", err.message);
    ws.close();
  }
});

// ✅ Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Yjs WebSocket server running at ws://localhost:${PORT}`);
});
