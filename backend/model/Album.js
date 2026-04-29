const mongoose = require('mongoose');

const VALID_GENRES = [
  'Pop', 'Rock', 'Jazz', 'Hip-Hop', 'Classical',
  'Electronic', 'R&B', 'Country', 'Folk', 'Metal', 'Other',
];

const albumSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Album title is required'], trim: true },
    artist: { type: String, required: [true, 'Artist is required'], trim: true },
    genre: [{ type: String, enum: VALID_GENRES }],
    releaseYear: {
      type: Number,
      min: [1900, 'Year must be at least 1900'],
      max: [new Date().getFullYear(), 'Year cannot be in the future'],
    },
    coverImage: { type: String, default: '' },
    coverImagePublicId: { type: String, default: '' },
    description: { type: String, maxlength: [500, 'Description cannot exceed 500 characters'] },
    tags: [{ type: String }],
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    totalDuration: { type: Number, default: 0 }, // in seconds
    avgRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Indexes for fast querying
albumSchema.index({ title: 'text', artist: 'text', tags: 'text' });
albumSchema.index({ genre: 1 });
albumSchema.index({ releaseYear: 1 });
albumSchema.index({ avgRating: -1 });
albumSchema.index({ createdAt: -1 });
albumSchema.index({ isDeleted: 1 });

const Album = mongoose.model('Album', albumSchema);
module.exports = Album;
