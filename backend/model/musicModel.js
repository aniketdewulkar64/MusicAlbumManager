const mongoose = require("mongoose");
const musicSchema = mongoose.Schema({
  albumName: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  artist: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  genre: {
    type: String,
    required: true,
  },
});

const musicModel = mongoose.model("music", musicSchema);
module.exports = musicModel;
