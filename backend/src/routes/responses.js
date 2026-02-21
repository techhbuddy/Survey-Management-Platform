const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const validationErrorHandler = require('../middleware/validation');
const responseController = require('../controllers/responseController');

const router = express.Router();

// Public - submit survey response (optional auth)
router.post(
  '/',
  [
    body('surveyId').notEmpty(),
    body('answers').isArray(),
  ],
  validationErrorHandler,
  responseController.submitResponse
);

// Save partial response
router.post(
  '/draft',
  [
    body('surveyId').notEmpty(),
    body('answers').optional().isArray(),
  ],
  validationErrorHandler,
  responseController.savePartialResponse
);

// Protected routes - require authentication
router.use(authMiddleware);

// Get responses for a survey
router.get('/', responseController.getResponses);

// Get single response
router.get('/:responseId', responseController.getResponseById);

// Get response analytics
router.get('/:surveyId/analytics', responseController.getResponseAnalytics);

// Delete response
router.delete('/:responseId', responseController.deleteResponse);

module.exports = router;
