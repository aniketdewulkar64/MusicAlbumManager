const Album = require('../model/Album');
const Song = require('../model/Song');
const User = require('../model/User');

// GET /api/search
exports.unifiedSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    res.set('Cache-Control', 'no-store');

    if (!q || q.trim() === '') {
      return res.status(200).json({ 
        success: true, 
        status: 'success', 
        data: { albums: [], songs: [], artists: [] } 
      });
    }

    const query = q.trim();
    const regex = new RegExp(query, 'i');

    const [albums, songs, artists] = await Promise.all([
      Album.find({
        $or: [{ title: regex }, { artist: regex }, { genre: regex }],
        isDeleted: false,
      }).limit(10),
      Song.find({
        $or: [{ title: regex }, { artist: regex }],
        isDeleted: false,
      }).populate('album', 'title coverImage', { strictPopulate: false }).limit(20),
      User.find({
        role: 'artist',
        status: 'approved',
        $or: [{ name: regex }, { artistName: regex }, { genres: regex }],
      }).select('name artistName avatar bio genres followers').limit(10),
    ]);

    res.status(200).json({
      success: true,
      status: 'success',
      data: {
        albums,
        songs,
        artists
      },
    });
  } catch (err) {
    next(err);
  }
};
