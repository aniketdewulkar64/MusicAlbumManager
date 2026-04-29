const Song = require('../model/Song');
const Album = require('../model/Album');
const { AppError } = require('../middleware/errorHandler');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const logActivity = require('../utils/activityLogger');

// In-memory debounce: userId+songId -> timestamp
const playDebounce = new Map();

// GET /api/songs
exports.getAllSongs = async (req, res, next) => {
  try {
    const songs = await Song.find({ isDeleted: { $ne: true } }).populate('album', 'title coverImage artist').lean();
    res.status(200).json({ status: 'success', results: songs.length, data: songs });
  } catch (err) {
    next(err);
  }
};

// GET /api/songs/top
exports.getTopSongs = async (req, res, next) => {
  try {
    // Sort by likes primarily, then playCount
    const songs = await Song.find({ isDeleted: { $ne: true } })
      .sort('-likes -playCount')
      .limit(10)
      .populate('album', 'title coverImage artist')
      .lean();
    res.status(200).json({ status: 'success', data: songs });
  } catch (err) {
    next(err);
  }
};

// GET /api/songs/:id
exports.getSong = async (req, res, next) => {
  try {
    const song = await Song.findById(req.params.id).populate('album', 'title coverImage artist');
    if (!song) return next(new AppError('Song not found', 404));
    res.status(200).json({ status: 'success', data: song });
  } catch (err) {
    next(err);
  }
};

// POST /api/songs
exports.createSong = async (req, res, next) => {
  try {
    if (req.files) {
      if (req.files.audioFile) {
        const audio = req.files.audioFile[0];
        const isCloudinaryUrl = audio.path && audio.path.startsWith('http');
        req.body.audioFile = isCloudinaryUrl ? audio.path : `/uploads/${audio.filename}`;
        req.body.audioPublicId = isCloudinaryUrl ? audio.filename : audio.filename;
        if (audio.duration) req.body.duration = Math.round(audio.duration);
      }
      if (req.files.coverImage) {
        const cover = req.files.coverImage[0];
        const isCloudinaryUrl = cover.path && cover.path.startsWith('http');
        req.body.coverImage = isCloudinaryUrl ? cover.path : `/uploads/${cover.filename}`;
        req.body.coverPublicId = isCloudinaryUrl ? cover.filename : cover.filename;
      }
    }

    if (req.body.album === '') delete req.body.album;
    
    // Auto-set artist if missing
    if (!req.body.artist) {
      req.body.artist = req.user.artistName || req.user.name;
    }

    const song = await Song.create({ ...req.body, createdBy: req.user._id });

    // Add song ref to album + update totalDuration
    if (song.album) {
      await Album.findByIdAndUpdate(song.album, {
        $push: { songs: song._id },
        $inc: { totalDuration: song.duration || 0 },
      });
    }

    await logActivity(req.user._id, 'create_song', { songId: song._id, title: song.title }, req.ip);
    res.status(201).json({ status: 'success', data: song });
  } catch (err) {
    next(err);
  }
};

// PUT /api/songs/:id
exports.updateSong = async (req, res, next) => {
  try {
    const song = req.resource;

    if (req.files) {
      if (req.files.audioFile) {
        const audio = req.files.audioFile[0];
        const isCloudinary = audio.path.startsWith('http');
        req.body.audioFile = isCloudinary ? audio.path : `/uploads/${audio.filename}`;
        req.body.audioPublicId = audio.filename;
        if (audio.duration) req.body.duration = Math.round(audio.duration);
      }
      if (req.files.coverImage) {
        const cover = req.files.coverImage[0];
        const isCloudinary = cover.path.startsWith('http');
        req.body.coverImage = isCloudinary ? cover.path : `/uploads/${cover.filename}`;
        req.body.coverPublicId = cover.filename;
      }
    }

    const updated = await Song.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/songs/:id
exports.deleteSong = async (req, res, next) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return next(new AppError('Song not found', 404));

    // Only destroy from Cloudinary if properly configured
    if (isCloudinaryConfigured && song.audioPublicId) {
      await cloudinary.uploader.destroy(song.audioPublicId, { resource_type: 'video' }).catch(() => {});
    }
    if (isCloudinaryConfigured && song.coverPublicId) {
      await cloudinary.uploader.destroy(song.coverPublicId).catch(() => {});
    }

    // Remove from album
    if (song.album) {
      await Album.findByIdAndUpdate(song.album, {
        $pull: { songs: song._id },
        $inc: { totalDuration: -(song.duration || 0) },
      });
    }

    // Hard delete
    await Song.findByIdAndDelete(req.params.id);

    res.status(200).json({ status: 'success', message: 'Song deleted' });
  } catch (err) {
    next(err);
  }
};

// POST /api/songs/:id/play
exports.incrementPlayCount = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const songId = req.params.id;
    const debounceKey = `${userId}:${songId}`;
    const now = Date.now();
    const last = playDebounce.get(debounceKey);

    if (last && now - last < 30 * 1000) {
      return res.status(200).json({ status: 'success', message: 'Play already counted recently' });
    }

    playDebounce.set(debounceKey, now);
    const song = await Song.findByIdAndUpdate(songId, { $inc: { playCount: 1 } }, { new: true });

    if (!song) return next(new AppError('Song not found', 404));
    res.status(200).json({ status: 'success', playCount: song.playCount });
  } catch (err) {
    next(err);
  }
};

// POST /api/songs/:id/like
exports.toggleLikeSong = async (req, res, next) => {
  try {
    const songId = req.params.id;
    const userId = req.user._id;

    const song = await Song.findById(songId);
    if (!song) return next(new AppError('Song not found', 404));

    const isLiked = song.likedBy.includes(userId);

    if (isLiked) {
      song.likedBy.pull(userId);
      song.likes = Math.max(0, song.likes - 1);
    } else {
      song.likedBy.push(userId);
      song.likes += 1;
    }

    await song.save();
    res.status(200).json({ status: 'success', liked: !isLiked, likes: song.likes });
  } catch (err) {
    next(err);
  }
};
