const metricsRepository = require('../repositories/metricsRepository');
const userRepository = require('../repositories/userRepository');
const userRepository = require('../repositories/userRepository');

const getMetrics = async (req, res, next) => {
  try {
    const role = req.user.role;
    
    if (role === 'admin') {
      const globalStats = await metricsRepository.getGlobalAnalytics();
      const accounts = await userRepository.findAllMetrics();
      return res.json({ stats: globalStats, userManagementList: accounts });
    }
    
    if (role === 'moderator') {
      const subscriptionBreakdown = await metricsRepository.getModeratorOverview();
      const globalStats = await metricsRepository.getGlobalAnalytics();
      return res.json({ subscriptions: subscriptionBreakdown, activeSessions: globalStats.ACTIVE_AI_SESSIONS });
    }
    
    // Fallback for standard student account metric responses
    res.json({ msg: 'Accessing Student profile data block.' });
  } catch (err) { next(err); }
};

const modifyUserAccountState = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body; // e.g., changing 'student' to 'instructor' or setting active to 0
    
    if (!role || isActive === undefined) {
      return res.status(400).json({ error: 'Missing target state attributes.' });
    }
    
    await userRepository.updateUserManagementState(id, { role, isActive });
    res.json({ message: 'User access definitions successfully modified.' });
  } catch (err) { next(err); }
};

module.exports = { 
  getMetrics: dashboardController.getMetrics, // Keep your existing dashboard metric handler
  modifyUserAccountState 
};