const express = require('express');
const router = express.Router();
const { getCreatorStats, getCreatorContent } = require('../controller/creatorController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('artist'));

router.get('/stats', getCreatorStats);
router.get('/content', getCreatorContent);

module.exports = router;
