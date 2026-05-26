const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require student role (or higher)
router.use(authenticate);
router.use(authorize('student', 'instructor', 'moderator', 'admin'));

// Get enrolled courses
router.get('/courses', studentController.getEnrolledCourses);

// Get course progress
router.get('/progress', studentController.getProgress);

// Submit task solution
router.post('/submit', studentController.submitTask);

// Get submission history
router.get('/submissions', studentController.getSubmissions);

// Get rank/score
router.get('/rank', studentController.getRank);

// Request instructor role
router.post('/request-instructor', studentController.requestInstructorRole);

module.exports = router;