const Album = require('../model/Album');
const Song = require('../model/Song');
const APIFeatures = require('../utils/APIFeatures');
const { AppError } = require('../middleware/errorHandler');
const { cloudinary } = require('../config/cloudinary');
const { invalidateCache } = require('../middleware/cache');
const logActivity = require('../utils/activityLogger');

// GET /api/albums
exports.getAllAlbums = async (req, res, next) => {
  try {
    const features = new APIFeatures(Album.find(), req.query)
      .search()
      .filter()
      .sort()
      .project()
      .paginate();

    const [albums, total] = await Promise.all([
      features.query.lean(),
      Album.countDocuments(),
    ]);

    res.status(200).json({
      status: 'success',
      total,
      page: features.page,
      pages: Math.ceil(total / features.limit),
      limit: features.limit,
      results: albums.length,
      data: albums,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/albums/:id
exports.getAlbum = async (req, res, next) => {
  try {
    const album = await Album.findById(req.params.id)
      .populate({
        path: 'songs',
        populate: { path: 'album', select: 'title artist coverImage' }
      })
      .populate('createdBy', 'name avatar artistName');

    if (!album) return next(new AppError('Album not found', 404));
    res.status(200).json({ status: 'success', data: album });
  } catch (err) {
    next(err);
  }
};

// GET /api/albums/trending
exports.getTrendingAlbums = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const trending = await Song.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, isDeleted: false } },
      { $group: { _id: '$album', totalPlays: { $sum: '$playCount' } } },
      { $sort: { totalPlays: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'albums',
          localField: '_id',
          foreignField: '_id',
          as: 'album',
        },
      },
      { $unwind: '$album' },
      { $replaceRoot: { newRoot: { $mergeObjects: ['$album', { totalPlays: '$totalPlays' }] } } },
    ]);

    res.status(200).json({ status: 'success', data: trending });
  } catch (err) {
    next(err);
  }
};

// POST /api/albums
exports.createAlbum = async (req, res, next) => {
  try {
    if (req.file) {
      const isCloudinary = req.file.path.startsWith('http');
      req.body.coverImage = isCloudinary ? req.file.path : `/uploads/${req.file.filename}`;
      req.body.coverImagePublicId = req.file.filename;
    }

    const album = await Album.create({ ...req.body, createdBy: req.user._id });
    await invalidateCache('/api/albums');
    await logActivity(req.user._id, 'create_album', { albumId: album._id, title: album.title }, req.ip);

    res.status(201).json({ status: 'success', data: album });
  } catch (err) {
    next(err);
  }
};

// PUT /api/albums/:id
exports.updateAlbum = async (req, res, next) => {
  try {
    const album = req.resource; // set by checkOwnership middleware

    if (req.file) {
      // Delete old image from Cloudinary
      if (album.coverImagePublicId) {
        await cloudinary.uploader.destroy(album.coverImagePublicId).catch(() => {});
      }
      const isCloudinary = req.file.path.startsWith('http');
      req.body.coverImage = isCloudinary ? req.file.path : `/uploads/${req.file.filename}`;
      req.body.coverImagePublicId = req.file.filename;
    }

    const updated = await Album.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    await invalidateCache('/api/albums');
    res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/albums/:id (soft delete)
exports.deleteAlbum = async (req, res, next) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return next(new AppError('Album not found', 404));

    // Hard delete Cloudinary assets
    if (album.coverImagePublicId) {
      await cloudinary.uploader.destroy(album.coverImagePublicId).catch(() => {});
    }

    // Soft delete
    album.isDeleted = true;
    await album.save();

    await invalidateCache('/api/albums');
    await logActivity(req.user._id, 'delete_album', { albumId: album._id }, req.ip);

    res.status(200).json({ status: 'success', message: 'Album deleted' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/albums/:id/restore (admin only)
exports.restoreAlbum = async (req, res, next) => {
  try {
    const album = await Album.findOneAndUpdate(
      { _id: req.params.id, isDeleted: true },
      { isDeleted: false },
      { new: true }
    );
    if (!album) return next(new AppError('Album not found or not deleted', 404));
    await invalidateCache('/api/albums');
    res.status(200).json({ status: 'success', data: album });
  } catch (err) {
    next(err);
  }
};
