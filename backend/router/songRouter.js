const express = require('express');
const router = express.Router();
const {
  getAllSongs, getSong, createSong, updateSong,
  deleteSong, incrementPlayCount, getTopSongs,
  toggleLikeSong,
} = require('../controller/songController');
const { protect, authorize, checkOwnership } = require('../middleware/auth');
const { songUpload } = require('../config/cloudinary');
const Song = require('../model/Song');

router.get('/', getAllSongs);
router.get('/top', getTopSongs);
router.get('/:id', getSong);
router.post('/:id/play', protect, incrementPlayCount);
router.post('/:id/like', protect, toggleLikeSong);

router.post('/', protect, authorize('admin', 'artist'), songUpload.fields([{ name: 'audioFile', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), createSong);
router.put('/:id', protect, authorize('admin', 'artist'), checkOwnership(Song), songUpload.fields([{ name: 'audioFile', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), updateSong);
router.delete('/:id', protect, authorize('admin', 'artist'), deleteSong);

module.exports = router;
