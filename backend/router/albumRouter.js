const express = require('express');
const router = express.Router();
const {
  getAllAlbums, getAlbum, createAlbum, updateAlbum,
  deleteAlbum, restoreAlbum, getTrendingAlbums,
} = require('../controller/albumController');
const { createReview, getAlbumReviews } = require('../controller/reviewController');
const { protect, optionalProtect, authorize, checkOwnership } = require('../middleware/auth');
const { imageUpload } = require('../config/cloudinary');
const { cacheMiddleware } = require('../middleware/cache');
const Album = require('../model/Album');

// Public routes
router.get('/', optionalProtect, cacheMiddleware(300), getAllAlbums);  // cache 5 min
router.get('/trending', getTrendingAlbums);
router.get('/:id', optionalProtect, cacheMiddleware(600), getAlbum);   // cache 10 min

// Reviews
router.get('/:id/reviews', getAlbumReviews);
router.post('/:id/reviews', protect, createReview);

// Protected routes
router.post('/', protect, authorize('admin', 'artist'), imageUpload.single('coverImage'), createAlbum);
router.put('/:id', protect, authorize('admin', 'artist'), checkOwnership(Album), imageUpload.single('coverImage'), updateAlbum);
router.delete('/:id', protect, authorize('admin', 'artist'), deleteAlbum);
router.patch('/:id/restore', protect, authorize('admin'), restoreAlbum);

module.exports = router;
