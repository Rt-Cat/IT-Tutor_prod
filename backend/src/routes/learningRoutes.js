const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learningController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Отримання дерева контенту (для відображення на фронтенді)
router.get('/tree', authenticateToken, learningController.getContentTree);

// Domain Configuration Paths (Додано дозвіл для 'instructor')
router.get('/technologies', authenticateToken, learningController.getTechnologies);
router.post('/technologies', authenticateToken, authorizeRoles('admin', 'moderator', 'instructor'), learningController.createTechnology);
router.put('/technologies/:id', authenticateToken, authorizeRoles('admin', 'moderator', 'instructor'), learningController.updateTechnology);

// Course Management Paths
router.get('/courses', authenticateToken, learningController.getCourses);
router.post('/courses', authenticateToken, authorizeRoles('admin', 'instructor'), learningController.createCourse);
router.put('/courses/:id', authenticateToken, authorizeRoles('admin', 'instructor'), learningController.updateCourse);

// Task Generation Paths
router.get('/courses/:courseId/tasks', authenticateToken, learningController.getTasksByCourse);
router.post('/tasks', authenticateToken, authorizeRoles('admin', 'instructor'), learningController.createTask);
router.post('/tasks/:taskId/prompts', authenticateToken, authorizeRoles('admin', 'instructor'), learningController.addTaskPrompt);
router.put('/tasks/:id', authenticateToken, authorizeRoles('admin', 'instructor'), learningController.updateTask);

// Додайте до відповідних блоків роутера
router.post('/courses/approve/:id', authenticateToken, authorizeRoles('admin', 'moderator'), learningController.approveCourse);
router.get('/tasks', authenticateToken, learningController.getTasks);
router.post('/tasks/approve/:id', authenticateToken, authorizeRoles('admin', 'moderator'), learningController.approveTask);
router.post('/tasks/reject/:id', authenticateToken, authorizeRoles('admin', 'moderator'), learningController.rejectTask);

module.exports = router;