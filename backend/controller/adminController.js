const User = require('../model/User');
const Album = require('../model/Album');
const Song = require('../model/Song');
const Playlist = require('../model/Playlist');
const ActivityLog = require('../model/ActivityLog');
const { AppError } = require('../middleware/errorHandler');
const { Parser } = require('json2csv');

// GET /api/admin/stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalAlbums,
      totalSongs,
      totalPlaylists,
      topGenres,
      recentSignups,
      mostPlayedSongs,
      topRatedAlbums,
      albumsPerMonth,
    ] = await Promise.all([
      User.countDocuments(),
      Album.countDocuments(),
      Song.countDocuments(),
      Playlist.countDocuments(),
      Album.aggregate([
        { $unwind: '$genre' },
        { $group: { _id: '$genre', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      User.find().sort('-createdAt').limit(5).select('name email role createdAt'),
      Song.find().sort('-playCount').limit(5).populate('album', 'title coverImage').select('title artist playCount album'),
      Album.find().sort('-avgRating').limit(5).select('title artist coverImage avgRating totalRatings'),
      Album.aggregate([
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        totalAlbums,
        totalSongs,
        totalPlaylists,
        topGenres,
        recentSignups,
        mostPlayedSongs,
        topRatedAlbums,
        albumsPerMonth,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).select('-password -refreshToken'),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      status: 'success',
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:id/role
exports.changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'artist', 'listener'].includes(role)) {
      return next(new AppError('Invalid role', 400));
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return next(new AppError('User not found', 404));
    res.status(200).json({ status: 'success', data: user });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    // Cascade soft delete user content
    await Promise.all([
      Album.updateMany({ createdBy: req.params.id }, { isDeleted: true }),
      Song.updateMany({ createdBy: req.params.id }, { isDeleted: true }),
      Playlist.updateMany({ owner: req.params.id }, { isDeleted: true }),
    ]);

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: 'success', message: 'User and their content deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/activity-logs
exports.getActivityLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const logs = await ActivityLog.find()
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit);
    res.status(200).json({ status: 'success', data: logs });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/export/albums
exports.exportAlbumsCSV = async (req, res, next) => {
  try {
    const albums = await Album.find().lean();
    const fields = ['title', 'artist', 'genre', 'releaseYear', 'avgRating', 'totalRatings', 'isPublic', 'createdAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(albums);
    res.header('Content-Type', 'text/csv');
    res.attachment('albums.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};
// GET /api/admin/creator-applications
exports.getCreatorApplications = async (req, res, next) => {
  try {
    const status = req.query.status || 'pending';
    const applications = await User.find({ role: 'artist', status })
      .select('name email artistName bio genres socialLinks status rejectionReason createdAt avatar');

    const counts = await User.aggregate([
      { $match: { role: 'artist' } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    counts.forEach((c) => {
      if (statusCounts.hasOwnProperty(c._id)) {
        statusCounts[c._id] = c.count;
      }
    });

    res.status(200).json({
      status: 'success',
      data: applications,
      counts: statusCounts,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/creator-applications/:id/approve
exports.approveCreator = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!user) return next(new AppError('User not found', 404));

    // Optional: Send email notification
    res.status(200).json({ status: 'success', data: user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/creator-applications/:id/reject
exports.rejectCreator = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return next(new AppError('Rejection reason is required', 400));

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: reason },
      { new: true }
    );
    if (!user) return next(new AppError('User not found', 404));

    // Optional: Send email notification
    res.status(200).json({ status: 'success', data: user });
  } catch (err) {
    next(err);
  }
};
