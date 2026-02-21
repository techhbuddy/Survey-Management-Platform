const mongoose = require('mongoose');
const Response = require('../models/Response');
const Survey = require('../models/Survey');
const { sendSuccess, sendError } = require('../utils/response');

exports.submitResponse = async (req, res) => {
  try {
    const { surveyId, answers } = req.body;

    // Verify survey exists and is published
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return sendError(res, 'Survey not found', 404);
    }

    if (survey.status !== 'published') {
      return sendError(res, 'Survey is not available', 400);
    }

    const response = new Response({
      survey: surveyId,
      respondent: req.user?.userId || null,
      answers,
      isCompleted: true,
      completedAt: new Date(),
    });

    await response.save();

    // Increment response count
    survey.responseCount += 1;
    await survey.save();

    sendSuccess(res, response, 'Response submitted successfully', 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

exports.savePartialResponse = async (req, res) => {
  try {
    const { surveyId, answers, progress } = req.body;

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return sendError(res, 'Survey not found', 404);
    }

    const response = new Response({
      survey: surveyId,
      respondent: req.user?.userId || null,
      answers,
      progress: progress || 0,
      isCompleted: false,
      startedAt: new Date(),
    });

    await response.save();

    sendSuccess(res, response, 'Response saved', 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

exports.getResponses = async (req, res) => {
  try {
    const { surveyId, skip = 0, limit = 10 } = req.query;

    // Verify survey ownership
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return sendError(res, 'Survey not found', 404);
    }

    if (survey.createdBy.toString() !== req.user.userId) {
      return sendError(res, 'Not authorized', 403);
    }

    const responses = await Response.find({ survey: surveyId, isCompleted: true })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ completedAt: -1 });

    const total = await Response.countDocuments({ survey: surveyId, isCompleted: true });

    sendSuccess(res, { responses, total, skip, limit });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

exports.getResponseById = async (req, res) => {
  try {
    const response = await Response.findById(req.params.responseId).populate('survey');

    if (!response) {
      return sendError(res, 'Response not found', 404);
    }

    // Check authorization
    if (response.survey.createdBy.toString() !== req.user.userId) {
      return sendError(res, 'Not authorized', 403);
    }

    sendSuccess(res, response);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

exports.getResponseAnalytics = async (req, res) => {
  try {
    const { surveyId } = req.params;

    // Verify survey ownership
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return sendError(res, 'Survey not found', 404);
    }

    if (survey.createdBy.toString() !== req.user.userId) {
      return sendError(res, 'Not authorized', 403);
    }

    const completedResponses = await Response.countDocuments({
      survey: surveyId,
      isCompleted: true,
    });

    const partialResponses = await Response.countDocuments({
      survey: surveyId,
      isCompleted: false,
    });

    const avgTimeSpent = await Response.aggregate([
      { $match: { survey: new mongoose.Types.ObjectId(surveyId), isCompleted: true } },
      { $group: { _id: null, avgTime: { $avg: '$timeSpent' } } },
    ]);

    sendSuccess(res, {
      surveyId,
      completedResponses,
      partialResponses,
      totalResponses: completedResponses + partialResponses,
      averageTimeSpent: avgTimeSpent[0]?.avgTime || 0,
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

exports.deleteResponse = async (req, res) => {
  try {
    const response = await Response.findById(req.params.responseId).populate('survey');

    if (!response) {
      return sendError(res, 'Response not found', 404);
    }

    if (response.survey.createdBy.toString() !== req.user.userId) {
      return sendError(res, 'Not authorized', 403);
    }

    await Response.findByIdAndDelete(req.params.responseId);

    // Decrement response count
    const survey = await Survey.findById(response.survey._id);
    if (survey) {
      survey.responseCount = Math.max(0, survey.responseCount - 1);
      await survey.save();
    }

    sendSuccess(res, null, 'Response deleted successfully');
  } catch (error) {
    sendError(res, error.message, 500);
  }
};
