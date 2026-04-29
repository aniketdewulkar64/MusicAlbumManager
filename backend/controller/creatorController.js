const User = require('../model/User');
const Album = require('../model/Album');
const Song = require('../model/Song');
const { AppError } = require('../middleware/errorHandler');

// GET /api/creator/stats
exports.getCreatorStats = async (req, res, next) => {
  try {
    const artistId = req.user._id;

    const [albums, songs, counts] = await Promise.all([
      Album.find({ createdBy: artistId }),
      Song.find({ createdBy: artistId }),
      User.findById(artistId).select('following').lean(),
    ]);

    // In a real app, followers would be users who have this artistId in their following array
    const followerCount = await User.countDocuments({ following: artistId });

    const totalPlays = songs.reduce((acc, song) => acc + (song.playCount || 0), 0);

    res.status(200).json({
      status: 'success',
      data: {
        totalSongs: songs.length,
        totalAlbums: albums.length,
        totalPlays,
        totalFollowers: followerCount,
        artistName: req.user.artistName,
        avatar: req.user.avatar,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/creator/content
exports.getCreatorContent = async (req, res, next) => {
  try {
    const artistId = req.user._id;

    const [albums, songs] = await Promise.all([
      Album.find({ createdBy: artistId }).sort('-createdAt'),
      Song.find({ createdBy: artistId }).populate('album', 'title').sort('-createdAt'),
    ]);

    res.status(200).json({
      status: 'success',
      data: { albums, songs },
    });
  } catch (err) {
    next(err);
  }
};
