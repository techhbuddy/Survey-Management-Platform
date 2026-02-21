const express = require('express');
const { body } = require('express-validator');
const validationErrorHandler = require('../middleware/validation');
const publicController = require('../controllers/publicController');

const router = express.Router();

/**
 * Get Survey by Shareable Link (Public - No Auth)
 * GET /api/public/survey/:link
 * Allows anyone with the link to view survey details
 */
router.get(
  '/survey/:link',
  publicController.getSurveyByLink
);

/**
 * Submit Survey Response via Shareable Link (Public - No Auth)
 * POST /api/public/survey/:link/submit
 * Allows anyone with the link to submit a survey response
 */
router.post(
  '/survey/:link/submit',
  [
    body('respondentName')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters long'),
    body('respondentEmail')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('answers')
      .isArray()
      .withMessage('Answers must be an array'),
  ],
  validationErrorHandler,
  publicController.submitSurveyResponse
);

module.exports = router;
