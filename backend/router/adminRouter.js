const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getUsers, changeUserRole,
  deleteUser, getActivityLogs, exportAlbumsCSV,
  getCreatorApplications, approveCreator, rejectCreator,
} = require('../controller/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin')); // all admin routes require admin role

router.get('/stats', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:id/role', changeUserRole);
router.delete('/users/:id', deleteUser);
router.get('/activity-logs', getActivityLogs);
router.get('/export/albums', exportAlbumsCSV);

// Creator Applications
router.get('/creator-applications', getCreatorApplications);
router.patch('/creator-applications/:id/approve', approveCreator);
router.patch('/creator-applications/:id/reject', rejectCreator);

module.exports = router;
