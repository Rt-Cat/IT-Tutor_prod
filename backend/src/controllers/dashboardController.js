const metricsRepository = require('../repositories/metricsRepository');
const userRepository = require('../repositories/userRepository');
const subscriptionRepository = require('../repositories/subscriptionRepository');

// 1. Збір статистики для дашбордів
const getMetrics = async (req, res, next) => {
  try {
    const role = req.user.role;
    
    if (role === 'admin') {
      const stats = await metricsRepository.getGlobalStats();
      const detailedStats = await metricsRepository.getDetailedAdminStats(); // НОВЕ
      return res.json({ basic: stats, detailed: detailedStats }); // Повертаємо об'єднаний об'єкт
    }
    
    if (role === 'moderator') {
      const stats = await metricsRepository.getModeratorDashboardData();
      const modData = await metricsRepository.getModeratorOverview();
      const globalStats = await metricsRepository.getGlobalStats();
      const accounts = await userRepository.getAllUsers(); 
      console.log("DEBUG: Кількість знайдених користувачів:", stats ? stats.pending : "null");
      return res.json({ 
      dashboard: stats,
      subscriptions: modData, 
      activeSessions: globalStats.ACTIVE_AI_SESSIONS,
      users: accounts 
    });
}
    
    res.status(403).json({ error: 'Access denied' });
  } catch (err) { 
    next(err); 
  }
};

const getUsersList = async (req, res, next) => {
  try {
    const { search, role, isActive } = req.query;
    const users = await userRepository.getAllUsers(search, role, isActive);
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({ error: 'Missing target state attribute (isActive).' });
    }
    
    await userRepository.toggleUserStatus(id, isActive);
    res.json({ message: 'User status successfully modified.' });
  } catch (err) { 
    next(err); 
  }
};

const modifyUserAccountState = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;
    
    if (!role || isActive === undefined) {
      return res.status(400).json({ error: 'Missing target state attributes (role or isActive).' });
    }
    
    await userRepository.updateUserManagementState(id, role, parseInt(isActive));
    res.json({ message: 'User access definitions successfully modified.' });
  } catch (err) { 
    next(err); 
  }
};

const getSubscriptionsList = async (req, res, next) => {
  try {
    const subs = await subscriptionRepository.getAllSubscriptionsForModerator();
    const plans = await subscriptionRepository.findAllPlans();
    const rules = await subscriptionRepository.getTaskAccessRules();
    res.json({ subscriptions: subs, plans: plans, rules: rules });
  } catch (err) { next(err); }
};

// Додайте нові методи для CRUD-операцій модератора:
const createSubscriptionPlan = async (req, res, next) => {
  try {
    const payload = { ...req.body, hasFullAccess: req.body.hasFullAccess ? 1 : 0};
    await subscriptionRepository.createPlan(payload);
    res.json({ message: 'План створено' });
  } catch (err) { next(err); }
};

const updateSubscriptionPlan = async (req, res, next) => {
  try {
    const payload = { ...req.body, hasFullAccess: req.body.hasFullAccess ? 1 : 0};
    await subscriptionRepository.updatePlan(req.params.id, payload);
    res.json({ message: 'План оновлено' });
  } catch (err) { next(err); }
};

const manualGrantSubscription = async (req, res, next) => {
  try {
    await subscriptionRepository.grantSubscriptionToUser(req.body);
    res.json({ message: 'Підписку видано' });
  } catch (err) { next(err); }
};

const manualDeleteSubscription = async (req, res, next) => {
  try {
    await subscriptionRepository.deleteSubscription(req.params.id);
    res.json({ message: 'Підписку видалено' });
  } catch (err) { next(err); }
};

const bindTaskToPlan = async (req, res, next) => {
  try {
    const payload = { ...req.body, isAccessible: req.body.isAccessible ? 1 : 0 };
    await subscriptionRepository.upsertTaskAccessRule(payload);
    res.json({ message: 'Правило доступу оновлено' });
  } catch (err) { next(err); }
};

const handleSubscriptionAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, planId } = req.body;
    await subscriptionRepository.updateSubscriptionByModerator(id, status, planId);
    res.json({ message: 'Параметри підписки успішно змінено.' });
  } catch (err) { next(err); }
};

module.exports = {
  getMetrics,
  getUsersList,
  toggleUserStatus,
  getSubscriptionsList,
  handleSubscriptionAction,
  modifyUserAccountState,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  manualGrantSubscription,
  manualDeleteSubscription,
  bindTaskToPlan
};