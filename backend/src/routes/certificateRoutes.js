const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/certificates/download/:userId
router.get('/download/:userId', authenticateToken, certificateController.downloadUserCertificates);
router.post('/trigger/:userId', authenticateToken, certificateController.triggerGeneration);

module.exports = router;