const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    album: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Album',
      required: [true, 'Album reference is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    review: { type: String, maxlength: [1000, 'Review cannot exceed 1000 characters'] },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// One review per user per album
reviewSchema.index({ album: 1, user: 1 }, { unique: true });

// Recalculate album rating after save
reviewSchema.post('save', async function () {
  await calcAlbumRating(this.album);
});

// Recalculate after delete
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) await calcAlbumRating(doc.album);
});

async function calcAlbumRating(albumId) {
  const Album = mongoose.model('Album');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { album: albumId } },
    { $group: { _id: '$album', avgRating: { $avg: '$rating' }, totalRatings: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Album.findByIdAndUpdate(albumId, {
      avgRating: Math.round(stats[0].avgRating * 10) / 10,
      totalRatings: stats[0].totalRatings,
    });
  } else {
    await Album.findByIdAndUpdate(albumId, { avgRating: 0, totalRatings: 0 });
  }
}

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
