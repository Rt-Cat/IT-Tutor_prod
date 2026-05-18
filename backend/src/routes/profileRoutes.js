const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Configuration Profiles
router.get('/', authenticateToken, profileController.getProfiles);
router.post('/', authenticateToken, profileController.createProfile);
router.post('/:profileId/technologies', authenticateToken, profileController.linkTechnologyToProfile);

// Subscription Processing
router.post('/subscribe', authenticateToken, authorizeRoles('admin', 'moderator', 'student'), profileController.applySubscription);
// Task Submission
router.post('/tasks/submit', authenticateToken, profileController.evaluateTaskSubmission);
module.exports = router;