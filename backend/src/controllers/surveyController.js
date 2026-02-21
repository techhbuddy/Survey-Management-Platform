const Survey = require('../models/Survey');
const Response = require('../models/Response');
const { sendSuccess, sendError } = require('../utils/response');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const { analyzeSurveyResponses } = require('../services/aiAnalysisService');

exports.createSurvey = async (req, res) => {
  try {
    const { title, description, questions, settings, tags } = req.body;

    const survey = new Survey({
      title,
      description,
      questions: questions || [],
      settings: settings || {},
      tags: tags || [],
      createdBy: req.user.userId,
    });

    await survey.save();

    sendSuccess(res, survey, 'Survey created successfully', 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

exports.getSurveys = async (req, res) => {
  try {
    const { status, search, skip = 0, limit = 10 } = req.query;

    const query = { createdBy: req.user.userId };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const surveys = await Survey.find(query)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Survey.countDocuments(query);

    sendSuccess(res, { surveys, total, skip, limit });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

exports.getSurveyById = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return sendError(res, 'Survey not found', 404);
    }

    // Check ownership or if survey is published
    if (survey.createdBy.toString() !== req.user.userId && survey.status !== 'published') {
      return sendError(res, 'Not authorized to access this survey', 403);
    }

    sendSuccess(res, survey);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

exports.updateSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return sendError(res, 'Survey not found', 404);
    }

    if (survey.createdBy.toString() !== req.user.userId) {
      return sendError(res, 'Not authorized to update this survey', 403);
    }

    // Prevent updates if survey is published or closed
    if (survey.status !== 'draft') {
      return sendError(res, 'Cannot update published or closed surveys', 400);
    }

    const { title, description, questions, settings, tags } = req.body;

    if (title) survey.title = title;
    if (description) survey.description = description;
    if (questions) survey.questions = questions;
    if (settings) survey.settings = settings;
    if (tags) survey.tags = tags;

    await survey.save();

    sendSuccess(res, survey, 'Survey updated successfully');
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

exports.publishSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return sendError(res, 'Survey not found', 404);
    }

    if (survey.createdBy.toString() !== req.user.userId) {
      return sendError(res, 'Not authorized', 403);
    }

    if (survey.questions.length === 0) {
      return sendError(res, 'Survey must have at least one question', 400);
    }

    // Set status to published and timestamp
    survey.status = 'published';
    survey.publishedAt = new Date();

    // Save - triggers pre-save middleware to generate shareableLink
    const savedSurvey = await survey.save();

    // Reload to ensure shareableLink was generated
    const publishedSurvey = await Survey.findById(savedSurvey._id);

    // Validate that shareableLink was generated
    if (!publishedSurvey.shareableLink) {
      console.error('Failed to generate shareableLink for survey:', publishedSurvey._id);
      return sendError(res, 'Failed to generate shareable link. Please try again.', 500);
    }

    console.log('Survey published successfully:', {
      id: publishedSurvey._id,
      title: publishedSurvey.title,
      status: publishedSurvey.status,
      shareableLink: publishedSurvey.shareableLink,
    });

    // Return published survey with shareableLink
    sendSuccess(res, publishedSurvey, 'Survey published successfully');
  } catch (error) {
    console.error('Publish error:', error);
    sendError(res, error.message || 'Failed to publish survey', 500);
  }
};

exports.closeSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return sendError(res, 'Survey not found', 404);
    }

    if (survey.createdBy.toString() !== req.user.userId) {
      return sendError(res, 'Not authorized', 403);
    }

    survey.status = 'closed';
    survey.closedAt = new Date();
    await survey.save();

    sendSuccess(res, survey, 'Survey closed successfully');
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

exports.deleteSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return sendError(res, 'Survey not found', 404);
    }

    if (survey.createdBy.toString() !== req.user.userId) {
      return sendError(res, 'Not authorized', 403);
    }

    await Survey.findByIdAndDelete(req.params.id);

    sendSuccess(res, null, 'Survey deleted successfully');
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

exports.addQuestion = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return sendError(res, 'Survey not found', 404);
    }

    if (survey.createdBy.toString() !== req.user.userId) {
      return sendError(res, 'Not authorized', 403);
    }

    const { type, text, description, required, options, settings } = req.body;

    const question = {
      _id: new mongoose.Types.ObjectId(),
      order: survey.questions.length,
      type,
      text,
      description,
      required,
      options: options || [],
      settings: settings || {},
    };

    survey.questions.push(question);
    await survey.save();

    sendSuccess(res, survey, 'Question added successfully');
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const surveyId = req.params.id;
    const survey = await Survey.findById(surveyId);

    if (!survey) {
      return sendError(res, 'Survey not found', 404);
    }

    if (survey.createdBy.toString() !== req.user.userId) {
      return sendError(res, 'Not authorized', 403);
    }

    // Load all responses for this survey (completed + partial)
    const responses = await Response.find({ survey: survey._id }).lean();

    const totals = {
      totalResponses: responses.length,
      completedResponses: 0,
      partialResponses: 0,
      averageCompletionTimeSeconds: 0,
    };

    let completionTimeSum = 0;
    let completionTimeCount = 0;

    // Prebuild question metadata
    const questionMeta = {};
    survey.questions.forEach((q) => {
      const qId = q._id.toString();
      questionMeta[qId] = {
        questionId: qId,
        text: q.text,
        type: q.type,
        order: q.order,
        options: (q.options || []).map((opt) => ({
          value: opt.value ?? opt.text ?? '',
          text: opt.text,
        })),
      };
    });

    // Initialize per-question stats
    const perQuestionStats = {};
    Object.values(questionMeta).forEach((q) => {
      perQuestionStats[q.questionId] = {
        questionId: q.questionId,
        questionText: q.text,
        type: q.type,
        order: q.order,
        reached: 0,
        totalAnswers: 0,
        textCount: 0,
        optionCounts: new Map(),
        ratingCounts: new Map(),
      };
    });

    // Aggregate over all responses
    responses.forEach((r) => {
      const isCompleted = !!r.isCompleted;
      if (isCompleted) {
        totals.completedResponses += 1;
      } else {
        totals.partialResponses += 1;
      }

      if (typeof r.timeSpent === 'number') {
        completionTimeSum += r.timeSpent;
        completionTimeCount += 1;
      }

      const seenQuestionIds = new Set();

      (r.answers || []).forEach((a) => {
        const qId = a.questionId && a.questionId.toString();
        if (!qId || !perQuestionStats[qId]) return;

        seenQuestionIds.add(qId);

        const stats = perQuestionStats[qId];
        const qType = stats.type;
        const answer = a.answer;

        // Count only non-empty answers
        const hasValue =
          answer !== undefined &&
          answer !== null &&
          (typeof answer !== 'string' || answer.trim() !== '');

        if (!hasValue) {
          return;
        }

        stats.totalAnswers += 1;

        if (qType === 'multiple_choice' || qType === 'ranking') {
          const rawValues = Array.isArray(answer) ? answer : [answer];
          rawValues
            .map((v) => String(v))
            .forEach((val) => {
              const prev = stats.optionCounts.get(val) || 0;
              stats.optionCounts.set(val, prev + 1);
            });
        } else if (qType === 'rating' || qType === 'star_rating') {
          const num = Number(answer);
          if (!Number.isNaN(num)) {
            const key = String(num);
            const prev = stats.ratingCounts.get(key) || 0;
            stats.ratingCounts.set(key, prev + 1);
          }
        } else if (qType === 'short_text' || qType === 'long_text') {
          stats.textCount += 1;
        }
      });

      // Funnel: how many users reached each question (appeared in answers)
      seenQuestionIds.forEach((qId) => {
        const stats = perQuestionStats[qId];
        if (stats) {
          stats.reached += 1;
        }
      });
    });

    if (completionTimeCount > 0) {
      totals.averageCompletionTimeSeconds = completionTimeSum / completionTimeCount;
    }

    // Build funnel: one entry per question in order
    const funnel = Object.values(perQuestionStats)
      .sort((a, b) => a.order - b.order)
      .map((stats) => ({
        questionId: stats.questionId,
        questionText: stats.questionText,
        order: stats.order,
        reached: stats.reached,
      }));

    // Build question-wise analytics
    const questionsAnalytics = Object.values(perQuestionStats)
      .sort((a, b) => a.order - b.order)
      .map((stats) => {
        const meta = questionMeta[stats.questionId];
        const base = {
          questionId: stats.questionId,
          questionText: stats.questionText,
          type: stats.type,
          order: stats.order,
          totalAnswers: stats.totalAnswers,
        };

        if (stats.type === 'multiple_choice' || stats.type === 'ranking') {
          const optionMetaByValue = new Map();
          (meta.options || []).forEach((opt) => {
            const key = String(opt.value ?? opt.text ?? '');
            optionMetaByValue.set(key, opt);
          });

          const options = Array.from(stats.optionCounts.entries()).map(([value, count]) => {
            const optMeta = optionMetaByValue.get(value) || { text: value };
            const percentage = stats.totalAnswers
              ? (count / stats.totalAnswers) * 100
              : 0;
            return {
              value,
              label: optMeta.text || value,
              count,
              percentage,
            };
          });

          return {
            ...base,
            kind: 'choice',
            options: options.sort((a, b) => b.count - a.count),
          };
        }

        if (stats.type === 'rating' || stats.type === 'star_rating') {
          const distribution = Array.from(stats.ratingCounts.entries())
            .map(([value, count]) => {
              const percentage = stats.totalAnswers
                ? (count / stats.totalAnswers) * 100
                : 0;
              return { value: Number(value), count, percentage };
            })
            .sort((a, b) => a.value - b.value);

          return {
            ...base,
            kind: 'rating',
            distribution,
          };
        }

        if (stats.type === 'short_text' || stats.type === 'long_text') {
          return {
            ...base,
            kind: 'text',
            textCount: stats.textCount,
          };
        }

        // Fallback for unsupported types
        return {
          ...base,
          kind: 'unknown',
        };
      });

    sendSuccess(res, {
      surveyId: survey._id,
      title: survey.title,
      status: survey.status,
      createdAt: survey.createdAt,
      totals,
      funnel,
      questions: questionsAnalytics,
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

const TEXT_QUESTION_TYPES = new Set(['short_text', 'long_text']);

/**
 * POST /api/surveys/:surveyId/analyze
 * Fetch text-based responses, call OpenAI, store analysis in MongoDB, return result.
 */
exports.analyzeSurvey = async (req, res) => {
  try {
    const surveyId = req.params.id;

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return sendError(res, 'Survey not found', 404);
    }
    if (survey.createdBy.toString() !== req.user.userId) {
      return sendError(res, 'Not authorized to analyze this survey', 403);
    }

    const responses = await Response.find({
      survey: new mongoose.Types.ObjectId(surveyId),
      isCompleted: true,
    }).lean();

    const questionIdToText = {};
    survey.questions.forEach((q) => {
      if (TEXT_QUESTION_TYPES.has(q.type)) {
        questionIdToText[q._id.toString()] = q.text;
      }
    });

    const textByQuestion = {};
    responses.forEach((r) => {
      (r.answers || []).forEach((a) => {
        const qId = a.questionId && a.questionId.toString();
        if (!qId || !questionIdToText[qId]) return;
        const text = a.answer != null ? String(a.answer).trim() : '';
        if (!text) return;
        if (!textByQuestion[qId]) textByQuestion[qId] = { questionText: questionIdToText[qId], answers: [] };
        textByQuestion[qId].answers.push(text);
      });
    });

    const textResponses = Object.values(textByQuestion);

    const analysis = await analyzeSurveyResponses(survey.title, textResponses);

    survey.aiAnalysis = {
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      insights: analysis.insights,
      analyzedAt: new Date(),
    };
    await survey.save();

    sendSuccess(res, {
      surveyId: survey._id,
      analysis: survey.aiAnalysis,
    }, 'Analysis completed and saved', 200);
  } catch (error) {
    if (error.message === 'GOOGLE_API_KEY is not configured') {
      return sendError(res, 'Analysis is not configured. Please set GOOGLE_API_KEY in .env', 503);
    }
    if (error.message?.toLowerCase().includes('api key') || error.status === 401) {
      return sendError(res, 'Invalid or missing Google API key for analysis.', 503);
    }
    console.error('Survey analyze error:', error);
    sendError(res, error.message || 'Analysis failed', 500);
  }
};

/**
 * GET /api/surveys/:surveyId/analysis
 * Return stored AI analysis for the survey (if any).
 */
exports.getSurveyAnalysis = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id).select('aiAnalysis createdBy').lean();

    if (!survey) {
      return sendError(res, 'Survey not found', 404);
    }
    if (survey.createdBy.toString() !== req.user.userId) {
      return sendError(res, 'Not authorized to view this survey analysis', 403);
    }

    if (!survey.aiAnalysis?.analyzedAt) {
      return sendSuccess(res, { surveyId: req.params.id, analysis: null }, 'No analysis yet', 200);
    }

    sendSuccess(res, { surveyId: req.params.id, analysis: survey.aiAnalysis });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

/**
 * GET /api/surveys/:id/qr
 * Generate a PNG QR code for a survey's public URL (owner only)
 */
exports.getSurveyQRCode = async (req, res) => {
  try {
    const surveyId = req.params.id;

    const survey = await Survey.findById(surveyId).lean();
    if (!survey) return sendError(res, 'Survey not found', 404);

    // Only owner can generate QR from dashboard
    if (survey.createdBy.toString() !== req.user.userId) {
      return sendError(res, 'Not authorized to generate QR code for this survey', 403);
    }

    if (survey.status !== 'published') {
      return sendError(res, 'QR code can only be generated for published surveys', 400);
    }

    if (survey.expiresAt && new Date(survey.expiresAt) <= new Date()) {
      return sendError(res, 'Survey link has expired', 400);
    }

    if (!survey.shareableLink) {
      return sendError(res, 'Survey does not have a shareable link', 400);
    }

    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    const surveyUrl = `${frontendBase.replace(/\/+$/, '')}/survey/${survey.shareableLink}`;

    // Generate PNG buffer
    const pngBuffer = await QRCode.toBuffer(surveyUrl, { type: 'png', width: 400, errorCorrectionLevel: 'H' });

    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', `inline; filename="survey-qr-${(survey.title || 'survey').replace(/[^a-z0-9-_\.]/gi, '_')}.png"`);
    return res.send(pngBuffer);
  } catch (error) {
    console.error('QR generation error:', error);
    return sendError(res, error.message || 'Failed to generate QR code', 500);
  }
};

/**
 * GET /api/surveys/share/:shareableLink/qr
 * Generate a PNG QR code for a survey identified by shareableLink (owner only)
 */
exports.getSurveyQRCodeByShareableLink = async (req, res) => {
  try {
    const link = req.params.shareableLink;

    const survey = await Survey.findOne({ shareableLink: link }).lean();
    if (!survey) return sendError(res, 'Survey not found', 404);

    // Only owner may generate QR from publish page
    if (survey.createdBy.toString() !== req.user.userId) {
      return sendError(res, 'Not authorized to generate QR code for this survey', 403);
    }

    if (survey.status !== 'published') {
      return sendError(res, 'QR code can only be generated for published surveys', 400);
    }

    if (survey.expiresAt && new Date(survey.expiresAt) <= new Date()) {
      return sendError(res, 'Survey link has expired', 400);
    }

    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    const surveyUrl = `${frontendBase.replace(/\/+$/, '')}/survey/${survey.shareableLink}`;

    const pngBuffer = await QRCode.toBuffer(surveyUrl, { type: 'png', width: 400, errorCorrectionLevel: 'H' });

    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', `inline; filename="survey-qr-${(survey.title || 'survey').replace(/[^a-z0-9-_\.]/gi, '_')}.png"`);
    return res.send(pngBuffer);
  } catch (error) {
    console.error('QR generation by link error:', error);
    return sendError(res, error.message || 'Failed to generate QR code', 500);
  }
};
