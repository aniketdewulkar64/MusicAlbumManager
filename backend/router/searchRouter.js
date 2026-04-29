const express = require('express');
const router = express.Router();
const { unifiedSearch } = require('../controller/searchController');

router.get('/', unifiedSearch);

module.exports = router;
