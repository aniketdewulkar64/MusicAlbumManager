const Playlist = require('../model/Playlist');
const Song = require('../model/Song');
const { AppError } = require('../middleware/errorHandler');

// POST /api/playlists
exports.createPlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ status: 'success', data: playlist });
  } catch (err) {
    next(err);
  }
};

// GET /api/playlists
exports.getPlaylists = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const query = userId
      ? { $or: [{ isPublic: true }, { owner: userId }] }
      : { isPublic: true };

    const playlists = await Playlist.find(query)
      .populate({ path: 'owner', select: 'name avatar', strictPopulate: false })
      .sort('-createdAt')
      .lean();

    res.status(200).json({ status: 'success', results: playlists.length, data: playlists });
  } catch (err) {
    console.error('Playlist fetch error:', err.message);
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

// GET /api/playlists/:id
exports.getPlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate({ 
        path: 'songs', 
        strictPopulate: false,
        populate: { path: 'album', select: 'title coverImage', strictPopulate: false } 
      })
      .populate({ path: 'owner', select: 'name avatar', strictPopulate: false });

    if (!playlist) return next(new AppError('Playlist not found', 404));

    // Filter out any null songs (if documents were deleted)
    if (playlist.songs) {
      playlist.songs = playlist.songs.filter(song => song !== null);
    }

    if (!playlist.isPublic) {
      const ownerId = playlist.owner?._id?.toString() || playlist.owner?.toString();
      if (!req.user || (req.user._id.toString() !== ownerId && req.user.role !== 'admin')) {
        return next(new AppError('This playlist is private', 403));
      }
    }

    res.status(200).json({ status: 'success', data: playlist });
  } catch (err) {
    next(err);
  }
};

// PUT /api/playlists/:id
exports.updatePlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return next(new AppError('Playlist not found', 404));

    if (playlist.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Only the owner can update this playlist', 403));
    }

    const updated = await Playlist.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/playlists/:id
exports.deletePlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return next(new AppError('Playlist not found', 404));

    if (playlist.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Not authorized', 403));
    }

    playlist.isDeleted = true;
    await playlist.save();
    res.status(200).json({ status: 'success', message: 'Playlist deleted' });
  } catch (err) {
    next(err);
  }
};

// POST /api/playlists/:id/songs
exports.addSong = async (req, res, next) => {
  try {
    const { songId } = req.body;
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return next(new AppError('Playlist not found', 404));

    if (playlist.owner.toString() !== req.user._id.toString()) {
      return next(new AppError('Only the owner can add songs', 403));
    }

    const song = await Song.findById(songId);
    if (!song) return next(new AppError('Song not found', 404));

    if (playlist.songs.includes(songId)) {
      return next(new AppError('Song already in playlist', 400));
    }

    playlist.songs.push(songId);
    playlist.totalDuration += song.duration || 0;
    await playlist.save();

    res.status(200).json({ status: 'success', data: playlist });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/playlists/:id/songs/:songId
exports.removeSong = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return next(new AppError('Playlist not found', 404));

    if (playlist.owner.toString() !== req.user._id.toString()) {
      return next(new AppError('Only the owner can remove songs', 403));
    }

    const song = await Song.findById(req.params.songId);
    playlist.songs.pull(req.params.songId);
    playlist.totalDuration = Math.max(0, playlist.totalDuration - (song?.duration || 0));
    await playlist.save();

    res.status(200).json({ status: 'success', data: playlist });
  } catch (err) {
    next(err);
  }
};

// POST /api/playlists/:id/follow
exports.toggleFollow = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return next(new AppError('Playlist not found', 404));

    const userId = req.user._id;
    const isFollowing = playlist.followers.includes(userId);

    isFollowing ? playlist.followers.pull(userId) : playlist.followers.push(userId);
    await playlist.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      following: !isFollowing,
      totalFollowers: playlist.followers.length,
    });
  } catch (err) {
    next(err);
  }
};
