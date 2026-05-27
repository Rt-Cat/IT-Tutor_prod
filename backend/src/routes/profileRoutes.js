const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get all profiles for current user
router.get('/', profileController.getProfiles);

// Create new profile
router.post('/', profileController.createProfile);

// Get specific profile
router.get('/:id', profileController.getProfileById);

// Update profile
router.put('/:id', profileController.updateProfile);

// Delete profile
router.delete('/:id', profileController.deleteProfile);

// Set profile as default
router.put('/:id/default', profileController.setDefault);

module.exports = router;
