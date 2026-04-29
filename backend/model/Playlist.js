const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Playlist name is required'], trim: true },
    description: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublic: { type: Boolean, default: true },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    totalDuration: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

playlistSchema.pre(/^find/, function () {
  this.where({ isDeleted: { $ne: true } });
});

const Playlist = mongoose.model('Playlist', playlistSchema);
module.exports = Playlist;
