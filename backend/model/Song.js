const mongoose = require('mongoose');

const songSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Song title is required'], trim: true },
    album: { type: mongoose.Schema.Types.ObjectId, ref: 'Album' },
    artist: { type: String, trim: true },
    duration: { type: Number, default: 0 }, // in seconds
    trackNumber: { type: Number },
    audioFile: { type: String, default: '' },
    audioPublicId: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    coverPublicId: { type: String, default: '' },
    lyrics: { type: String, default: '' },
    featuring: [{ type: String }],
    playCount: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Text index for lyrics/title search
songSchema.index({ title: 'text', lyrics: 'text' });
songSchema.index({ album: 1 });
songSchema.index({ playCount: -1 });

// Soft delete
// songSchema.pre(/^find/, function (next) {
//   const filter = this.getFilter();
//   if (filter.isDeleted === undefined) {
//     this.where({ isDeleted: false });
//   }
//   next();
// });

const Song = mongoose.model('Song', songSchema);
module.exports = Song;
