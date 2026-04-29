const ActivityLog = require('../model/ActivityLog');

const logActivity = async (userId, action, details = {}, ip = '') => {
  try {
    await ActivityLog.create({ user: userId, action, details, ip });
  } catch (err) {
    console.warn('Activity log failed:', err.message);
  }
};

module.exports = logActivity;
