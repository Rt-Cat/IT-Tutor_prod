const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

// Student dashboard
router.get('/student', authenticate, authorize('student', 'instructor', 'moderator', 'admin'), dashboardController.getStudentDashboard);

// Instructor dashboard
router.get('/instructor', authenticate, authorize('instructor', 'admin'), dashboardController.getInstructorDashboard);

// Moderator dashboard
router.get('/moderator', authenticate, authorize('moderator', 'admin'), dashboardController.getModeratorDashboard);

// Admin dashboard
router.get('/admin', authenticate, authorize('admin'), dashboardController.getAdminDashboard);

// General metrics
router.get('/metrics', authenticate, dashboardController.getMetrics);

module.exports = router;