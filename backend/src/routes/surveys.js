const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const validationErrorHandler = require('../middleware/validation');
const surveyController = require('../controllers/surveyController');

const router = express.Router();

// All survey routes require authentication
router.use(authMiddleware);

// Generate QR code for shareable link (owner only)
router.get('/share/:shareableLink/qr', surveyController.getSurveyQRCodeByShareableLink);

// Create survey
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Title is required'),
  ],
  validationErrorHandler,
  surveyController.createSurvey
);

// Get all surveys
router.get('/', surveyController.getSurveys);

// Get single survey
router.get('/:id', surveyController.getSurveyById);

// Update survey
router.put(
  '/:id',
  [
    body('title').optional().notEmpty(),
  ],
  validationErrorHandler,
  surveyController.updateSurvey
);

// Publish survey
router.put('/:id/publish', surveyController.publishSurvey);

// Close survey
router.put('/:id/close', surveyController.closeSurvey);

// Delete survey
router.delete('/:id', surveyController.deleteSurvey);

// Add question to survey
router.post(
  '/:id/questions',
  [
    body('type').notEmpty(),
    body('text').notEmpty(),
  ],
  validationErrorHandler,
  surveyController.addQuestion
);

// Get analytics
router.get('/:id/analytics', surveyController.getAnalytics);

// Get QR code by survey id (owner only)
router.get('/:id/qr', surveyController.getSurveyQRCode);

// AI analysis: run and store (POST), get stored (GET)
router.post('/:id/analyze', surveyController.analyzeSurvey);
router.get('/:id/analysis', surveyController.getSurveyAnalysis);

module.exports = router;
