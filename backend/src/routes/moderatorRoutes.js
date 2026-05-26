const express = require('express');
const router = express.Router();
const moderatorController = require('../controllers/moderatorController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require moderator role
router.use(authenticate);
router.use(authorize('moderator', 'admin'));

// Task moderation
router.get('/tasks/pending', moderatorController.getPendingTasks);
router.put('/tasks/:id/approve', moderatorController.approveTask);
router.put('/tasks/:id/reject', moderatorController.rejectTask);

// Role requests
router.get('/role-requests', moderatorController.getRoleRequests);
router.put('/role-requests/:id/approve', moderatorController.approveRoleRequest);
router.put('/role-requests/:id/reject', moderatorController.rejectRoleRequest);

// User management
router.get('/users/banned', moderatorController.getBannedUsers);
router.put('/users/:id/ban', moderatorController.banUser);
router.put('/users/:id/unban', moderatorController.unbanUser);

// Prompt logs
router.get('/prompt-logs', moderatorController.getPromptLogs);

module.exports = router;