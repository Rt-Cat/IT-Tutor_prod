const metricsRepository = require('../repositories/metricsRepository');
const userRepository = require('../repositories/userRepository');

// 1. Окремо оголошуємо функцію збору аналітики для адміна/модератора
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
    
    res.json({ msg: 'Accessing Student profile data block.' });
  } catch (err) { 
    next(err); 
  }
};

// 2. Окремо оголошуємо функцію зміни стану користувача адміном
const modifyUserAccountState = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;
    
    if (!role || isActive === undefined) {
      return res.status(400).json({ error: 'Missing target state attributes.' });
    }
    
    await userRepository.updateUserManagementState(id, { role, isActive });
    res.json({ message: 'User access definitions successfully modified.' });
  } catch (err) { 
    next(err); 
  }
};

// 3. ПРАВИЛЬНИЙ ЕКСПОРТ: Передаємо функції як властивості об'єкта модуля
module.exports = {
  getMetrics,
  modifyUserAccountState
};