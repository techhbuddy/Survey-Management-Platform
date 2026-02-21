const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema(
  {
    survey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Survey',
      required: true,
    },
    respondent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    respondentName: {
      type: String,
      trim: true,
      index: false,
    },
    respondentEmail: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
    },
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        questionText: String,
        questionType: String,
        answer: mongoose.Schema.Types.Mixed,
        timeSpent: Number, // in seconds
      },
    ],
    metadata: {
      userAgent: String,
      ipAddress: String,
      country: String,
      deviceType: String,
    },
    startedAt: Date,
    completedAt: Date,
    timeSpent: Number, // total time spent in seconds
    isCompleted: {
      type: Boolean,
      default: false,
    },
    progress: {
      type: Number,
      default: 0, // 0-100
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Response', responseSchema);
