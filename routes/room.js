const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const auth = require("../middleware/authMiddleware");

router.post("/create", auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Room name required" });

    const room = await Room.create({
      name,
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      owner: req.user.id,
      members: [req.user.id]
    });

    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Room creation failed" });
  }
});

router.get("/my", auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      members: req.user.id
    });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: "Failed to load rooms" });
  }
});

router.post("/join", auth, async (req, res) => {
  try {
    const { code } = req.body;
    const room = await Room.findOne({ code });

    if (!room) return res.status(404).json({ message: "Room not found" });

    if (!room.members.includes(req.user.id)) {
      room.members.push(req.user.id);
      await room.save();
    }

    res.json(room);
  } catch (err) {
    res.status(500).json({ message: "Join failed" });
  }
});

router.delete("/:roomId", auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (room.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only creator can delete room" });
    }

    await room.deleteOne();
    res.json({ message: "Room deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;
