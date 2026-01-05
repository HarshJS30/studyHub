require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");

const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");

// CORS Configuration - UPDATED
const corsOptions = {
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:3000',
    'https://study-hub-swart.vercel.app', // Add your Vercel URL when deployed
    process.env.FRONTEND_URL // Optional: set in Render environment variables
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const io = new Server(server, {
  cors: {
    origin: corsOptions.origin, // Use same origins as Express
    credentials: true
  }
});

// Apply CORS - BEFORE other middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

connectDB();

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/room", require("./routes/room"));
app.use("/api/notes", require("./routes/notes"));
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Socket.IO
io.on("connection", socket => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", roomId => {
    socket.join(roomId);
  });

  socket.on("chat", data => {
    io.to(data.roomId).emit("chat", data);
  });

  socket.on("draw", data => {
    socket.to(data.roomId).emit("draw", data);
  });

  socket.on("clearBoard", roomId => {
    io.to(roomId).emit("clearBoard");
  });

  socket.on("offer", data => socket.to(data.roomId).emit("offer", data));
  socket.on("answer", data => socket.to(data.roomId).emit("answer", data));
  socket.on("ice", data => socket.to(data.roomId).emit("ice", data));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});