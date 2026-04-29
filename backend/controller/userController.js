const User = require('../model/User');
const Album = require('../model/Album');
const { AppError } = require('../middleware/errorHandler');

// POST /api/users/favorites/:albumId
exports.toggleFavorite = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const albumId = req.params.albumId;

    const album = await Album.findById(albumId);
    if (!album) return next(new AppError('Album not found', 404));

    const isFavorited = user.favorites.includes(albumId);

    if (isFavorited) {
      user.favorites.pull(albumId);
    } else {
      user.favorites.push(albumId);
    }

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      favorited: !isFavorited,
      totalFavorites: user.favorites.length,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/favorites
exports.getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favorites',
      select: 'title artist coverImage releaseYear genre avgRating',
    });
    res.status(200).json({ status: 'success', data: user.favorites });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('playlists', 'name coverImage songs totalDuration')
      .populate('following', 'name artistName avatar bio genres')
      .select('-refreshToken');
    res.status(200).json({ status: 'success', data: user });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/profile/:id
exports.getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'name artistName avatar bio genres')
      .populate('followers', 'name avatar')
      .select('-refreshToken -password -email');
    if (!user) return next(new AppError('User not found', 404));
    res.status(200).json({ status: 'success', data: user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, avatar, artistName, bio, genres, socialLinks, currentPassword, newPassword } = req.body;
    
    // Handle password change if provided in the profile update form
    if (currentPassword && newPassword) {
      const userWithPass = await User.findById(req.user._id).select('+password');
      if (!(await userWithPass.comparePassword(currentPassword))) {
        return next(new AppError('Current password is incorrect', 400));
      }
      userWithPass.password = newPassword;
      await userWithPass.save(); // Triggers bcrypt hashing
    }

    const updateData = {};

    if (name) updateData.name = name;
    if (avatar) updateData.avatar = avatar;

    if (req.file) {
      const isCloudinary = req.file.path.startsWith('http');
      updateData.avatar = isCloudinary ? req.file.path : `/uploads/${req.file.filename}`;
    }

    // Allow updating artist fields if user is an artist
    if (req.user.role === 'artist') {
      if (artistName) updateData.artistName = artistName;
      if (bio) updateData.bio = bio;
      if (genres) updateData.genres = typeof genres === 'string' ? JSON.parse(genres) : genres;
      if (socialLinks) updateData.socialLinks = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
    }

    if (Object.keys(updateData).length === 0) {
      return next(new AppError('No data provided to update', 400));
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return next(new AppError('Current password is incorrect', 400));
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ status: 'success', message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};
// POST /api/users/follow/:artistId
exports.followArtist = async (req, res, next) => {
  try {
    const artistId = req.params.artistId;
    const user = await User.findById(req.user._id);

    const artist = await User.findOne({ _id: artistId, role: 'artist', status: 'approved' });
    if (!artist) return next(new AppError('Artist not found or not approved', 404));

    if (user.following.includes(artistId)) {
      user.following.pull(artistId);
      artist.followers.pull(user._id);
    } else {
      user.following.push(artistId);
      artist.followers.push(user._id);
    }

    await user.save({ validateBeforeSave: false });
    await artist.save({ validateBeforeSave: false });
    res.status(200).json({ status: 'success', following: user.following.includes(artistId) });
  } catch (err) {
    next(err);
  }
};
