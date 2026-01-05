const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  filename: String,
  path: String,

  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room"
  },

  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("Note", noteSchema);
