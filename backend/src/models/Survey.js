const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Survey Schema
 * Represents a survey in the Survey Management SaaS application
 *
 * Fields:
 * - title: Survey title (required)
 * - description: Survey description
 * - questions: Array of question objects with questionText and type
 * - createdBy: Reference to User who created the survey
 * - status: Draft or Published
 * - shareableLink: Unique link for sharing survey (auto-generated)
 * - createdAt: Timestamp of survey creation (auto-generated)
 */
const surveySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a survey title'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Survey must be created by a user'],
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'published', 'closed'],
        message: 'Status must be draft, published, or closed',
      },
      default: 'draft',
    },
    questions: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          auto: true,
        },
        order: {
          type: Number,
          required: true,
        },
        type: {
          type: String,
          enum: ['multiple_choice', 'short_text', 'long_text', 'rating', 'star_rating', 'ranking'],
          required: [true, 'Question type is required'],
        },
        text: {
          type: String,
          required: [true, 'Question text is required'],
          minlength: [2, 'Question must be at least 2 characters long'],
        },
        description: {
          type: String,
          maxlength: [500, 'Question description cannot exceed 500 characters'],
        },
        required: {
          type: Boolean,
          default: false,
        },
        options: [
          {
            _id: {
              type: mongoose.Schema.Types.ObjectId,
              auto: true,
            },
            text: String,
            value: String,
          },
        ],
        settings: {
          minValue: Number,
          maxValue: Number,
          minLabel: String,
          maxLabel: String,
        },
      },
    ],
    shareableLink: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
      match: [/^[a-zA-Z0-9]{8,}$/, 'Invalid shareable link format'],
    },
    settings: {
      allowAnonymous: {
        type: Boolean,
        default: true,
      },
      allowMultipleResponses: {
        type: Boolean,
        default: false,
      },
      showProgressBar: {
        type: Boolean,
        default: true,
      },
      randomizeQuestions: {
        type: Boolean,
        default: false,
      },
    },
    responseCount: {
      type: Number,
      default: 0,
    },
    publishedAt: Date,
    closedAt: Date,
    expiresAt: Date,
    tags: [String],
    aiAnalysis: {
      summary: { type: String },
      sentiment: {
        type: String,
        enum: ['Positive', 'Neutral', 'Negative'],
      },
      insights: [{ type: String }],
      analyzedAt: { type: Date },
    },
  },
  { timestamps: true }
);

/**
 * Indexes for better query performance
 */
surveySchema.index({ createdBy: 1 });
surveySchema.index({ status: 1 });
surveySchema.index({ shareableLink: 1 });
surveySchema.index({ createdAt: -1 });

/**
 * Pre-save middleware to generate shareableLink on publish
 */
surveySchema.pre('save', async function (next) {
  // Generate shareable link if status is published and link doesn't exist
  if (this.status === 'published' && !this.shareableLink) {
    try {
      let uniqueLink;
      let exists = true;
      let attempts = 0;

      // Generate unique link (max 10 attempts to avoid infinite loop)
      while (exists && attempts < 10) {
        uniqueLink = crypto.randomBytes(6).toString('hex');
        const existing = await this.constructor.findOne({ shareableLink: uniqueLink });
        exists = !!existing;
        attempts++;
      }

      if (!exists) {
        this.shareableLink = uniqueLink;
      }
    } catch (error) {
      console.error('Error generating shareable link:', error);
    }
  }

  next();
});

/**
 * Static method to find survey by shareable link
 * Used for accessing published surveys without authentication
 */
surveySchema.statics.findByShareableLink = function (link) {
  return this.findOne({ shareableLink: link, status: 'published' });
};

/**
 * Static method to get survey with populated creator
 */
surveySchema.statics.findWithCreator = function (surveyId) {
  return this.findById(surveyId).populate('createdBy', 'name email');
};

/**
 * Instance method to check if survey can accept responses
 */
surveySchema.methods.canAcceptResponses = function () {
  return (
    this.status === 'published' &&
    (!this.expiresAt || new Date(this.expiresAt) > new Date())
  );
};

/**
 * Instance method to get survey for respondent (public view)
 */
surveySchema.methods.getPublicView = function () {
  return {
    _id: this._id,
    title: this.title,
    description: this.description,
    questions: this.questions,
    settings: this.settings,
    shareableLink: this.shareableLink,
  };
};

module.exports = mongoose.model('Survey', surveySchema);
