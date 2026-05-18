const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learningController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Domain Configuration Paths
router.get('/technologies', authenticateToken, learningController.getTechnologies);
router.post('/technologies', authenticateToken, authorizeRoles('admin', 'moderator'), learningController.createTechnology);
router.put('/technologies/:id', authenticateToken, authorizeRoles('admin', 'moderator'), learningController.updateTechnology);

// Course Management Paths
router.get('/courses', authenticateToken, learningController.getCourses);
router.post('/courses', authenticateToken, authorizeRoles('admin', 'instructor'), learningController.createCourse);
router.put('/courses/:id', authenticateToken, authorizeRoles('admin', 'instructor'), learningController.updateCourse);

// Task Generation Paths
router.get('/courses/:courseId/tasks', authenticateToken, learningController.getTasksByCourse);
router.post('/tasks', authenticateToken, authorizeRoles('admin', 'instructor'), learningController.createTask);
router.post('/tasks/:taskId/prompts', authenticateToken, authorizeRoles('admin', 'instructor'), learningController.addTaskPrompt);
router.put('/tasks/:id', authenticateToken, authorizeRoles('admin', 'instructor'), learningController.updateTask);

module.exports = router;