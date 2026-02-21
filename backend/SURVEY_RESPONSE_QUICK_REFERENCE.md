# Survey & Response Schemas - Quick Reference

Quick lookup guide for Survey and SurveyResponse schemas.

## Survey Schema Overview

```javascript
const surveySchema = new mongoose.Schema({
  title: String,                     // Required, 3-200 chars
  description: String,               // Optional, max 1000 chars
  createdBy: ObjectId,              // Reference to User (required)
  status: String,                   // Enum: draft, published, closed
  questions: [{                     // Array of question objects
    order: Number,                  // Display order (required)
    type: String,                   // Enum: multiple_choice, short_text, long_text, rating, ranking
    text: String,                   // Question text (required)
    description: String,            // Optional help text
    required: Boolean,              // Is question mandatory?
    options: [{                     // For multiple_choice, ranking
      text: String,
      value: String
    }],
    settings: {                     // For rating, ranking
      minValue: Number,
      maxValue: Number,
      minLabel: String,
      maxLabel: String
    }
  }],
  shareableLink: String,            // Auto-generated on publish (unique)
  settings: {
    allowAnonymous: Boolean,        // Default: true
    allowMultipleResponses: Boolean,// Default: false
    showProgressBar: Boolean,       // Default: true
    randomizeQuestions: Boolean     // Default: false
  },
  responseCount: Number,            // Default: 0
  publishedAt: Date,               // When published
  closedAt: Date,                  // When closed
  expiresAt: Date,                 // Auto-close time
  tags: [String]                   // Category tags
}, { timestamps: true });
```

## Survey Fields Reference

| Field | Type | Required | Unique | Default | Notes |
|-------|------|----------|--------|---------|-------|
| title | String | ✅ | ❌ | - | 3-200 chars, auto-trimmed |
| description | String | ❌ | ❌ | - | Max 1000 chars, optional |
| createdBy | ObjectId | ✅ | ❌ | - | User reference |
| status | String | ❌ | ❌ | draft | draft, published, closed |
| questions | Array | ❌ | ❌ | [] | Array of question objects |
| shareableLink | String | ❌ | ✅ | null | Auto-generated on publish |
| settings | Object | ❌ | ❌ | {...} | Survey configuration |
| responseCount | Number | ❌ | ❌ | 0 | Auto-incremented |
| publishedAt | Date | ❌ | ❌ | null | Set on publish |
| closedAt | Date | ❌ | ❌ | null | Set on close |
| expiresAt | Date | ❌ | ❌ | null | Auto-close deadline |
| tags | Array | ❌ | ❌ | [] | Category tags |
| createdAt | Date | ✅ | ❌ | now | Auto-generated |
| updatedAt | Date | ✅ | ❌ | now | Auto-updated |

## Survey Methods

### Instance Methods

```javascript
// Check if survey accepts responses
canAcceptResponses(); // Returns: boolean

// Get safe public view
getPublicView(); // Returns: { _id, title, description, questions, shareableLink }
```

### Static Methods

```javascript
// Find by shareable link (public access)
Survey.findByShareableLink(link); // Returns: Promise<Survey|null>

// Find with populated creator
Survey.findWithCreator(surveyId); // Returns: Promise<Survey> with createdBy populated
```

## Survey API Endpoints

### Create Survey (Protected)
```
POST /api/surveys
Authorization: Bearer <token>
{
  "title": "Survey Title",
  "description": "...",
  "questions": [...]
}
Response: 201 Created
```

### Get User's Surveys (Protected)
```
GET /api/surveys
Authorization: Bearer <token>
?status=draft&limit=10&page=1
Response: 200 OK
```

### Get Survey Detail (Protected)
```
GET /api/surveys/:id
Authorization: Bearer <token>
Response: 200 OK
```

### Publish Survey (Protected)
```
POST /api/surveys/:id/publish
Authorization: Bearer <token>
Response: 200 OK with shareableLink
```

### Get Survey by Shareable Link (Public)
```
GET /api/surveys/public/:shareableLink
Response: 200 OK with public view only
```

## Survey Question Types

### multiple_choice
```javascript
{
  type: "multiple_choice",
  text: "Choose an option",
  options: [
    { text: "Option 1", value: "opt_1" },
    { text: "Option 2", value: "opt_2" }
  ]
}
```

### short_text
```javascript
{
  type: "short_text",
  text: "Your short answer (255 chars max)"
}
```

### long_text
```javascript
{
  type: "long_text",
  text: "Your longer text response"
}
```

### rating
```javascript
{
  type: "rating",
  text: "Rate from 1-5",
  settings: {
    minValue: 1,
    maxValue: 5,
    minLabel: "Poor",
    maxLabel: "Excellent"
  }
}
```

### ranking
```javascript
{
  type: "ranking",
  text: "Rank in order",
  options: [
    { text: "Item 1", value: "item_1" },
    { text: "Item 2", value: "item_2" }
  ]
}
```

---

## SurveyResponse Schema Overview

```javascript
const responseSchema = new mongoose.Schema({
  survey: ObjectId,                 // Reference to Survey (required)
  respondent: ObjectId,             // Reference to User (null for anonymous)
  answers: [{                       // Array of answers
    questionId: ObjectId,
    questionText: String,
    questionType: String,
    answer: Mixed,                  // String, Number, Array, or Object
    timeSpent: Number               // Seconds
  }],
  metadata: {
    userAgent: String,
    ipAddress: String,
    country: String,
    deviceType: String,             // desktop, mobile, tablet
    timestamp: Date
  },
  isCompleted: Boolean,             // Default: false
  progress: Number,                 // 0-100 percent
  startedAt: Date,
  completedAt: Date                 // null until completed
}, { timestamps: true });
```

## SurveyResponse Fields Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| survey | ObjectId | ✅ | Survey reference |
| respondent | ObjectId | ❌ | User reference (null for anonymous) |
| answers | Array | ❌ | Can be empty for in-progress |
| metadata | Object | ❌ | Device and location info |
| isCompleted | Boolean | ❌ | Default: false |
| progress | Number | ❌ | Default: 0 (0-100) |
| startedAt | Date | ✅ | Auto-generated |
| completedAt | Date | ❌ | null until submitted |
| createdAt | Date | ✅ | Auto-generated |
| updatedAt | Date | ✅ | Auto-updated |

## Answer Structure by Question Type

### multiple_choice Answer
```javascript
{
  questionType: "multiple_choice",
  answer: "opt_1" // Single value or array
}
```

### short_text/long_text Answer
```javascript
{
  questionType: "short_text",
  answer: "User's text response",
  timeSpent: 15 // seconds
}
```

### rating Answer
```javascript
{
  questionType: "rating",
  answer: 4 // Number 1-5 (or configured range)
}
```

### ranking Answer
```javascript
{
  questionType: "ranking",
  answer: ["item_3", "item_1", "item_2"] // Ordered array
}
```

## Response API Endpoints

### Initialize Survey Response (Public)
```
POST /api/responses
{
  "surveyId": "507f..."
}
Response: 201 Created with responseId
```

### Save Response Progress (Public)
```
PUT /api/responses/:responseId
{
  "questionId": "507f...",
  "questionText": "Question?",
  "questionType": "rating",
  "answer": 4,
  "timeSpent": 12
}
Response: 200 OK
```

### Submit Complete Response (Public)
```
POST /api/responses/:responseId/submit
{
  "answers": [...]
}
Response: 200 OK - marks isCompleted: true
```

### Get Survey Statistics (Protected)
```
GET /api/surveys/:surveyId/statistics
Authorization: Bearer <token>
Response: 200 OK with stats
```

### Get Question Analysis (Protected)
```
GET /api/surveys/:surveyId/questions/:questionId/analysis
Authorization: Bearer <token>
Response: 200 OK with distribution
```

## Response Lifecycle

```
Start → In Progress → Completed
(0%)     (10-90%)      (100%)
```

### Key States:
- **isCompleted: false** → In progress
- **isCompleted: true** → Submitted
- **progress: 0-100** → Completion percentage
- **completedAt: null** → Still working on it
- **completedAt: Date** → Final submission time

## Survey Status Workflows

**Draft → Published:**
```javascript
survey.status = 'published'; // Triggers shareableLink generation
await survey.save();
```

**Published → Closed:**
```javascript
survey.status = 'closed';
survey.closedAt = new Date();
await survey.save();
```

**Resume Closed Survey:**
```javascript
survey.status = 'published'; // Back to accepting responses
await survey.save();
```

## Important Queries

### Get All Responses for Survey
```javascript
const responses = await Response.find({ survey: surveyId });
```

### Get Completed Responses Only
```javascript
const completed = await Response.find({
  survey: surveyId,
  isCompleted: true
});
```

### Get Responses by Device
```javascript
const mobile = await Response.find({
  "metadata.deviceType": "mobile"
});
```

### Get Statistics
```javascript
const stats = {
  total: responses.length,
  completed: responses.filter(r => r.isCompleted).length,
  avgTime: responses.reduce((sum, r) =>
    sum + (r.completedAt - r.startedAt), 0) / responses.length
};
```

## Validation Rules

### Survey Title
- ✅ "Customer Feedback" (3-200 chars)
- ❌ "AB" (too short, min 3)
- ❌ "A".repeat(201) (too long)

### Survey Status
- ✅ "draft", "published", "closed"
- ❌ "active", "pending"

### Question Type
- ✅ "multiple_choice", "short_text", "long_text", "rating", "ranking"
- ❌ "text", "number", "date"

### Response Answers
- ✅ Can be String, Number, Array, or Object
- ✅ Can be null/undefined for optional questions
- Varies by question type

## Common Patterns

### Create Survey
```javascript
const survey = await Survey.create({
  title: "Title",
  description: "...",
  createdBy: userId,
  questions: [...]
});
```

### Publish Survey
```javascript
survey.status = 'published';
await survey.save(); // shareableLink auto-generated
```

### Start Response
```javascript
const response = await Response.create({
  survey: surveyId,
  respondent: userId || null
});
```

### Save Answer
```javascript
response.answers.push({
  questionId, questionText, questionType,
  answer, timeSpent
});
response.progress = calculateProgress();
await response.save();
```

### Complete Response
```javascript
response.isCompleted = true;
response.completedAt = new Date();
response.progress = 100;
await response.save();

await Survey.findByIdAndUpdate(surveyId,
  { $inc: { responseCount: 1 } });
```

---

**Last Updated:** 2024-02-09
**Status:** Production Ready ✅
