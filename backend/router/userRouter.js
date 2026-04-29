const express = require('express');
const router = express.Router();
const {
  toggleFavorite, getFavorites, getProfile,
  updateProfile, changePassword, followArtist, getPublicProfile,
} = require('../controller/userController');
const { protect } = require('../middleware/auth');
const { imageUpload } = require('../config/cloudinary');

router.use(protect); // all user routes require auth

router.get('/profile', getProfile);
router.get('/profile/:id', getPublicProfile);
router.put('/profile', imageUpload.single('avatar'), updateProfile);
router.put('/change-password', changePassword);
router.get('/favorites', getFavorites);
router.post('/favorites/:albumId', toggleFavorite);
router.post('/follow/:artistId', followArtist);

module.exports = router;
