const express = require('express');
const router = express.Router();
const {
  createPlaylist, getPlaylists, getPlaylist,
  updatePlaylist, deletePlaylist, addSong, removeSong, toggleFollow,
} = require('../controller/playlistController');
const { protect, optionalProtect } = require('../middleware/auth');

router.get('/', optionalProtect, getPlaylists);
router.get('/:id', optionalProtect, getPlaylist);
router.post('/', protect, createPlaylist);
router.put('/:id', protect, updatePlaylist);
router.delete('/:id', protect, deletePlaylist);
router.post('/:id/songs', protect, addSong);
router.delete('/:id/songs/:songId', protect, removeSong);
router.post('/:id/follow', protect, toggleFollow);

module.exports = router;
