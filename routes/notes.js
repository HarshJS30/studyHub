const express = require("express");
const router = express.Router();
const multer = require("multer");
const Note = require("../models/Note");
const auth = require("../middleware/authMiddleware");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

router.post("/upload/:roomId", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const note = await Note.create({
      filename: req.file.originalname,
      path: req.file.filename, 
      room: req.params.roomId,
      uploadedBy: req.user.id
    });

    res.json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});

router.get("/:roomId", auth, async (req, res) => {
  const notes = await Note.find({ room: req.params.roomId });
  res.json(notes);
});

router.delete("/:noteId", auth, async (req, res) => {
  const note = await Note.findById(req.params.noteId);
  if (!note) return res.status(404).json({ message: "Note not found" });

  if (note.uploadedBy.toString() !== req.user.id) {
    return res.status(403).json({ message: "Only uploader can delete" });
  }

  await note.deleteOne();
  res.json({ message: "Deleted" });
});

module.exports = router;
