const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require admin role
router.use(authenticate);
router.use(authorize('admin'));

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Moderator management
router.get('/moderators/pending', adminController.getPendingModerators);
router.put('/moderators/:id/activate', adminController.activateModerator);
router.put('/moderators/:id/deactivate', adminController.deactivateModerator);

// Subscription management
router.get('/subscriptions/stats', adminController.getSubscriptionStats);
router.post('/subscriptions/plans', adminController.createPlan);
router.put('/subscriptions/plans/:id', adminController.updatePlan);

// System metrics
router.get('/metrics', adminController.getSystemMetrics);
router.get('/tokens/usage', adminController.getTokenUsage);

// Technology management
router.post('/technologies', adminController.createTechnology);
router.put('/technologies/:id', adminController.updateTechnology);
router.delete('/technologies/:id', adminController.deleteTechnology);

module.exports = router;