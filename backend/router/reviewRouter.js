const express = require('express');
const router = express.Router();
const { updateReview, deleteReview, toggleLike } = require('../controller/reviewController');
const { protect } = require('../middleware/auth');

router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/like', protect, toggleLike);

module.exports = router;
