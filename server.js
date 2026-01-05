require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");

const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

connectDB();

app.use("/api/auth", require("./routes/auth"));
app.use("/api/room", require("./routes/room"));
app.use("/api/notes", require("./routes/notes"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

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
app.use("/uploads", express.static("uploads"));
