const Survey = require('../models/Survey');
const Response = require('../models/Response');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Get Survey by Shareable Link (Public Access)
 * Anyone with the shareable link can view survey details
 */
exports.getSurveyByLink = async (req, res) => {
  try {
    const { link } = req.params;

    // Find survey by shareable link (must be published)
    const survey = await Survey.findByShareableLink(link);

    if (!survey) {
      return sendError(res, 'Survey not found or not published', 404);
    }

    // Check if survey can accept responses
    if (!survey.canAcceptResponses()) {
      return sendError(res, 'This survey is no longer accepting responses', 403);
    }

    // Return public view (excludes creator info for privacy)
    const publicView = survey.getPublicView();

    sendSuccess(
      res,
      publicView,
      'Survey retrieved successfully',
      200
    );
  } catch (error) {
    console.error('Error fetching survey by link:', error);
    sendError(res, 'Failed to retrieve survey', 500);
  }
};

/**
 * Submit Survey Response via Shareable Link (Public Access)
 * Anyone with the shareable link can submit a response
 * Supports both anonymous and authenticated submissions
 */
exports.submitSurveyResponse = async (req, res) => {
  try {
    const { link } = req.params;
    const { answers, respondentName, respondentEmail } = req.body;

    // Find survey by shareable link (must be published)
    const survey = await Survey.findByShareableLink(link);

    if (!survey) {
      return sendError(res, 'Survey not found or not published', 404);
    }

    // Check if survey can accept responses
    if (!survey.canAcceptResponses()) {
      return sendError(
        res,
        'This survey is no longer accepting responses',
        403
      );
    }

    // Validate answers array
    if (!Array.isArray(answers) || answers.length === 0) {
      return sendError(res, 'At least one answer is required', 400);
    }

    // Check if user is authenticated
    const respondentId = req.user?.userId || null;

    // Ensure respondentName and respondentEmail present for public submissions
    if (!respondentId) {
      if (!respondentName || !respondentEmail) {
        return sendError(res, 'Respondent name and email are required', 400);
      }
    }

    // If user is not anonymous and survey doesn't allow multiple responses
    if (respondentId && !survey.settings.allowMultipleResponses) {
      // Check if user already responded
      const existingResponse = await Response.findOne({
        survey: survey._id,
        respondent: respondentId,
      });

      if (existingResponse) {
        return sendError(
          res,
          'You have already submitted a response to this survey',
          400
        );
      }
    }

    // If respondentEmail provided and multiple responses are not allowed, prevent duplicates by email
    if (respondentEmail && !survey.settings.allowMultipleResponses) {
      const existingByEmail = await Response.findOne({ survey: survey._id, respondentEmail: respondentEmail.toLowerCase() });
      if (existingByEmail) {
        return sendError(res, 'This email has already submitted a response to this survey', 400);
      }
    }

    // Validate required questions are answered
    const requiredQuestions = survey.questions.filter(q => q.required);
    const unansweredRequired = requiredQuestions.filter(q => {
      const answerObj = answers.find(a => a.questionId?.toString() === q._id.toString());
      // Question is unanswered if: no answer object provided OR answer value is empty/null/undefined
      return !answerObj || answerObj.answer === undefined || answerObj.answer === null || answerObj.answer === '';
    });

    if (unansweredRequired.length > 0) {
      return sendError(
        res,
        `Please answer ${unansweredRequired.length} required question(s)`,
        400
      );
    }

    // Create response
    const response = new Response({
      survey: survey._id,
      respondent: respondentId, // null for anonymous
      respondentName: respondentName || undefined,
      respondentEmail: respondentEmail || undefined,
      answers: answers,
      isCompleted: true,
      progress: 100,
      startedAt: new Date(),
      completedAt: new Date(),
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.connection.remoteAddress,
        deviceType: getUserDeviceType(req.headers['user-agent']),
        timestamp: new Date(),
      },
    });

    await response.save();

    // Increment response count in survey
    survey.responseCount = (survey.responseCount || 0) + 1;
    await survey.save();

    sendSuccess(
      res,
      {
        responseId: response._id,
        message: 'Thank you! Your response has been submitted.',
      },
      'Response submitted successfully',
      201
    );
  } catch (error) {
    console.error('Error submitting response:', error);
    sendError(res, 'Failed to submit response', 500);
  }
};

/**
 * Helper function to detect device type from user agent
 */
function getUserDeviceType(userAgent = '') {
  if (!userAgent) return 'desktop';

  const userAgentLower = userAgent.toLowerCase();

  if (/mobile|android|iphone|wpphone|windows phone/.test(userAgentLower)) {
    return 'mobile';
  }

  if (/tablet|ipad|playbook|silk/.test(userAgentLower)) {
    return 'tablet';
  }

  return 'desktop';
}
