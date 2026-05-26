const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learningController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

// Technologies (public)
router.get('/technologies', optionalAuth, learningController.getTechnologies);

// Courses
router.get('/courses', optionalAuth, learningController.getCourses);
router.get('/courses/:id', optionalAuth, learningController.getCourseById);
router.post('/courses', authenticate, authorize('instructor', 'admin'), learningController.createCourse);
router.put('/courses/:id', authenticate, authorize('instructor', 'admin'), learningController.updateCourse);
router.delete('/courses/:id', authenticate, authorize('admin'), learningController.deleteCourse);

// Tasks
router.get('/tasks', optionalAuth, learningController.getTasks);
router.get('/tasks/:id', optionalAuth, learningController.getTaskById);
router.post('/tasks', authenticate, authorize('instructor', 'admin'), learningController.createTask);
router.put('/tasks/:id', authenticate, authorize('instructor', 'moderator', 'admin'), learningController.updateTask);
router.delete('/tasks/:id', authenticate, authorize('admin'), learningController.deleteTask);

// Subscriptions
router.get('/subscriptions/plans', learningController.getSubscriptionPlans);
router.get('/subscriptions/my', authenticate, learningController.getMySubscription);

module.exports = router;