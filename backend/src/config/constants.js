module.exports = {
  // Authentication
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',

  // User roles
  ROLES: {
    ADMIN: 'admin',
    USER: 'user',
  },

  // Survey status
  SURVEY_STATUS: {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    CLOSED: 'closed',
  },

  // Question types
  QUESTION_TYPES: {
    MULTIPLE_CHOICE: 'multiple_choice',
    SHORT_TEXT: 'short_text',
    LONG_TEXT: 'long_text',
    RATING: 'rating',
    STAR_RATING: 'star_rating',
    RANKING: 'ranking',
  },
};
