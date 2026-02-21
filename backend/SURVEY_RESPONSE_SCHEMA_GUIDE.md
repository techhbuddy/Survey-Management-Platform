# Mongoose SurveyResponse Schema Documentation

Complete guide to the SurveyResponse schema for collecting and managing survey responses in the Survey Management SaaS application.

## Table of Contents
1. [Schema Overview](#schema-overview)
2. [Field Specifications](#field-specifications)
3. [Answer Structure](#answer-structure)
4. [Metadata Tracking](#metadata-tracking)
5. [Methods and Queries](#methods-and-queries)
6. [Usage Examples](#usage-examples)
7. [API Endpoints](#api-endpoints)
8. [Response Lifecycle](#response-lifecycle)

---

## Schema Overview

The SurveyResponse schema captures individual responses to surveys. Responses can be submitted anonymously or by authenticated users, supporting both complete and partial submissions.

**File Location:** `backend/src/models/Response.js`

**Key Features:**
- ✅ Anonymous and authenticated responses
- ✅ Partial response support (saves progress)
- ✅ Progress tracking (0-100%)
- ✅ Time spent tracking per question
- ✅ Device and location metadata
- ✅ Automatic timestamps
- ✅ Direct survey reference

---

## Field Specifications

### survey
- **Type:** ObjectId (Reference to Survey)
- **Required:** Yes
- **Purpose:** Link response to its survey
- **Example:** "507f1f77bcf86cd799439011"

```javascript
{
  survey: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011") // ✅ Valid
}
```

**Query with Survey Details:**
```javascript
const response = await Response.findById(responseId).populate('survey');
// Result includes full survey object
```

### respondent
- **Type:** ObjectId (Reference to User)
- **Required:** No (null for anonymous)
- **Purpose:** Link response to user (if authenticated)
- **Default:** null

```javascript
{
  respondent: null // ✅ Anonymous response
}

{
  respondent: userId // ✅ Authenticated response
}
```

**Query by Respondent:**
```javascript
// Get all responses from a user
const userResponses = await Response.find({ respondent: userId });

// Get only anonymous responses
const anonymous = await Response.find({ respondent: null });
```

### answers
- **Type:** Array of Objects
- **Required:** No (can be empty for partial responses)
- **Purpose:** Container for question responses
- **Minimum:** 0 answers (allows saving progress)

Each answer object contains:

#### questionId
- **Type:** ObjectId
- **Purpose:** References question in survey.questions array
- **Example:** "507f1f77bcf86cd799439011"

#### questionText
- **Type:** String
- **Purpose:** Snapshot of question text at response time
- **Reason:** Preserves question even if survey is edited later

```javascript
{
  questionText: "How satisfied are you with our service?"
}
```

#### questionType
- **Type:** String
- **Valid Values:** "multiple_choice", "short_text", "long_text", "rating", "ranking"
- **Purpose:** Question type for proper response formatting
- **Example:** "rating"

#### answer
- **Type:** Mixed (can be String, Number, Array, or Object)
- **Purpose:** The actual response answer
- **Format varies by question type:**

**multiple_choice:**
```javascript
{
  questionType: "multiple_choice",
  answer: "opt_a" // Single selection
  // or
  answer: ["opt_a", "opt_b"] // Multiple selection
}
```

**short_text/long_text:**
```javascript
{
  questionType: "short_text",
  answer: "This is a great product"
}
```

**rating:**
```javascript
{
  questionType: "rating",
  answer: 4 // Number 1-5
}
```

**ranking:**
```javascript
{
  questionType: "ranking",
  answer: ["opt_1", "opt_3", "opt_2"] // Ordered array
}
```

#### timeSpent
- **Type:** Number
- **Unit:** Seconds
- **Purpose:** Track time spent on specific question
- **Example:** 45 (45 seconds on this question)

```javascript
{
  timeSpent: 45 // Spent 45 seconds on this question
}
```

**Full Answer Objects Example:**
```javascript
{
  answers: [
    {
      questionId: ObjectId("..."),
      questionText: "How satisfied are you?",
      questionType: "rating",
      answer: 4,
      timeSpent: 8
    },
    {
      questionId: ObjectId("..."),
      questionText: "What can we improve?",
      questionType: "long_text",
      answer: "Better customer support would help",
      timeSpent: 32
    }
  ]
}
```

### metadata
- **Type:** Object
- **Purpose:** Device and location information for analytics
- **All fields optional** - collected based on availability

**Available Fields:**

#### userAgent
- **Type:** String
- **Source:** Browser request header
- **Example:** "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
- **Use:** Device and browser identification

#### ipAddress
- **Type:** String
- **Source:** Server request object
- **Example:** "192.168.1.1"
- **Use:** Geographic and duplicate response detection
- **Privacy:** Consider GDPR implications

#### country
- **Type:** String
- **Source:** IP geolocation service
- **Example:** "United States"
- **Use:** Response distribution by country

#### deviceType
- **Type:** String
- **Valid Values:** "desktop", "mobile", "tablet"
- **Source:** User agent parsing
- **Use:** Device-specific analysis

#### timestamp
- **Type:** Date
- **Purpose:** When metadata was captured
- **Default:** now

**Full Metadata Example:**
```javascript
{
  metadata: {
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)",
    ipAddress: "203.0.113.42",
    country: "Australia",
    deviceType: "mobile",
    timestamp: new Date()
  }
}
```

**In Response Handler:**
```javascript
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

const ua = new UAParser(req.headers['user-agent']);
const geo = geoip.lookup(req.ip);

response.metadata = {
  userAgent: req.headers['user-agent'],
  ipAddress: req.ip,
  country: geo?.country,
  deviceType: ua.getDevice().type || 'desktop',
  timestamp: new Date()
};
```

### isCompleted
- **Type:** Boolean
- **Default:** false
- **Purpose:** Mark whether response is final or in progress
- **Values:**
  - `false`: Partial response (in progress)
  - `true`: Completed response (final)

```javascript
{
  isCompleted: false // ✅ Saving progress
}

{
  isCompleted: true // ✅ Submitted response
}
```

**Workflow:**
```javascript
// 1. User starts survey
const response = new Response({
  survey: surveyId,
  respondent: userId || null,
  answers: [],
  isCompleted: false,
  progress: 0
});
await response.save();

// 2. User answers first question
response.answers.push({ /* answer */ });
response.progress = 20; // 20% complete (1 of 5 questions)
await response.save();

// 3. User completes survey
response.answers.push({ /* last answer */ });
response.isCompleted = true;
response.progress = 100;
response.completedAt = new Date();
await response.save();
```

### progress
- **Type:** Number (0-100)
- **Purpose:** Completion percentage
- **Default:** 0
- **Update Strategy:**
  - `0`: No answers yet
  - `(answeredQuestion / totalQuestions) * 100`: During completion
  - `100`: Fully answered

```javascript
{
  progress: 0 // Just started
}

{
  progress: 50 // Halfway through
}

{
  progress: 100 // Completed (if isCompleted = true)
}
```

**Calculation Example:**
```javascript
const progress = (response.answers.length / survey.questions.length) * 100;
response.progress = Math.round(progress);
await response.save();
```

### startedAt
- **Type:** Date
- **Purpose:** Timestamp when response was initiated
- **Set:** When response document is created
- **Default:** now

```javascript
{
  startedAt: new Date() // "2024-02-09T10:30:00.000Z"
}
```

**Use:**
```javascript
// Check how long user has been working on survey
const timeElapsed = (new Date() - response.startedAt) / 1000; // in seconds
console.log(`User has been on survey for ${timeElapsed} seconds`);
```

### completedAt
- **Type:** Date
- **Required:** No (null if incomplete)
- **Purpose:** Timestamp when response was fully submitted
- **Set:** When isCompleted changes to true
- **Default:** null

```javascript
{
  completedAt: null // ✅ In progress
}

{
  completedAt: new Date() // ✅ Completed
}
```

**Query Completed Responses:**
```javascript
// Get all completed responses for a survey
const completed = await Response.find({
  survey: surveyId,
  isCompleted: true
});

// Calculate average completion time
completed.forEach(r => {
  const timeToComplete = (r.completedAt - r.startedAt) / 1000; // seconds
  console.log(`Completed in ${timeToComplete} seconds`);
});
```

### createdAt & updatedAt
- **Type:** Date (Auto-generated)
- **Format:** ISO 8601 (UTC)
- **Purpose:** Audit trail
- **Set By:** Mongoose timestamps option

```javascript
{
  createdAt: "2024-02-09T10:30:00.000Z", // Response created
  updatedAt: "2024-02-09T10:45:00.000Z"  // Last update
}
```

---

## Answer Structure

### Question Type → Answer Format

#### multiple_choice
```javascript
// Single selection
{
  questionType: "multiple_choice",
  questionText: "Choose one option",
  answer: "option_1"
}

// Multiple selection (if form allows)
{
  questionType: "multiple_choice",
  answer: ["option_1", "option_3"]
}
```

#### short_text
```javascript
{
  questionType: "short_text",
  questionText: "What is your name?",
  answer: "John Doe",
  timeSpent: 15 // 15 seconds to answer
}
```

#### long_text
```javascript
{
  questionType: "long_text",
  questionText: "What feedback do you have?",
  answer: "Your product is great but customer support needs improvement...",
  timeSpent: 120 // 2 minutes to write
}
```

#### rating
```javascript
{
  questionType: "rating",
  questionText: "How satisfied are you? (1-5)",
  answer: 4, // Number
  timeSpent: 5
}
```

#### ranking
```javascript
{
  questionType: "ranking",
  questionText: "Rank these features by preference",
  answer: ["feat_1", "feat_3", "feat_2"], // Ordered array
  timeSpent: 45
}
```

---

## Metadata Tracking

### Device Detection

**Mobile Devices:**
```javascript
{
  metadata: {
    deviceType: "mobile",
    userAgent: "Mozilla/5.0 (iPhone...)"
  }
}
```

**Tablet Devices:**
```javascript
{
  metadata: {
    deviceType: "tablet",
    userAgent: "Mozilla/5.0 (iPad...)"
  }
}
```

**Desktop:**
```javascript
{
  metadata: {
    deviceType: "desktop",
    userAgent: "Mozilla/5.0 (Windows NT...)"
  }
}
```

### Geographic Tracking

```javascript
{
  metadata: {
    ipAddress: "203.0.113.42",
    country: "United States"
  }
}
```

**Query by Country:**
```javascript
// Get responses from specific country
const usResponses = await Response.find({
  "metadata.country": "United States"
});

// Get response distribution by country
const distribution = await Response.aggregate([
  { $match: { survey: surveyId } },
  { $group: {
    _id: "$metadata.country",
    count: { $sum: 1 }
  }},
  { $sort: { count: -1 }}
]);
```

---

## Methods and Queries

### Common Queries

**Get Responses for a Survey:**
```javascript
const responses = await Response.find({ survey: surveyId });
```

**Get Completed Responses:**
```javascript
const completed = await Response.find({
  survey: surveyId,
  isCompleted: true
});
```

**Get User's Responses:**
```javascript
const userResponses = await Response.find({ respondent: userId });
```

**Get In-Progress Responses:**
```javascript
const inProgress = await Response.find({
  survey: surveyId,
  isCompleted: false
});
```

**Paginated Query:**
```javascript
const page = 1;
const limit = 20;
const responses = await Response.find({ survey: surveyId })
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit);
```

---

## Usage Examples

### Creating a Response

**Start Survey (New Response):**
```javascript
const response = new Response({
  survey: surveyId,
  respondent: req.user._id || null, // null for anonymous
  answers: [],
  isCompleted: false,
  progress: 0,
  startedAt: new Date(),
  metadata: {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
    deviceType: 'mobile'
  }
});

await response.save();

res.json({
  message: 'Survey started',
  responseId: response._id
});
```

### Saving Progress

**Save Partial Answer:**
```javascript
const response = await Response.findById(responseId);

// Add answer for current question
response.answers.push({
  questionId: questionId,
  questionText: questionText,
  questionType: questionType,
  answer: userAnswer,
  timeSpent: timeOnQuestion
});

// Update progress
response.progress = (response.answers.length / totalQuestions) * 100;
response.isCompleted = false;

await response.save();

res.json({
  message: 'Progress saved',
  progress: response.progress
});
```

### Submitting Complete Response

**Mark Response Complete:**
```javascript
const response = await Response.findById(responseId);

// Verify all required questions are answered
const unansweredRequired = survey.questions
  .filter(q => q.required)
  .filter(sq => !response.answers.some(a => a.questionId === sq._id));

if (unansweredRequired.length > 0) {
  return res.status(400).json({
    message: 'Please answer all required questions',
    missing: unansweredRequired.length
  });
}

// Mark complete
response.isCompleted = true;
response.completedAt = new Date();
response.progress = 100;

await response.save();

// Increment survey response count
await Survey.findByIdAndUpdate(
  surveyId,
  { $inc: { responseCount: 1 } }
);

res.json({
  message: 'Response submitted successfully',
  totalResponses: survey.responseCount + 1
});
```

### Analyzing Responses

**Get Survey Statistics:**
```javascript
const survey = await Survey.findById(surveyId);
const responses = await Response.find({
  survey: surveyId,
  isCompleted: true
});

// Calculate statistics
const stats = {
  totalResponses: responses.length,
  completionRate: (responses.length / survey.responseCount) * 100,
  avgTimeToComplete: responses.reduce((sum, r) => {
    return sum + (r.completedAt - r.startedAt);
  }, 0) / responses.length / 1000, // in seconds
  deviceBreakdown: {
    desktop: responses.filter(r => r.metadata?.deviceType === 'desktop').length,
    mobile: responses.filter(r => r.metadata?.deviceType === 'mobile').length,
    tablet: responses.filter(r => r.metadata?.deviceType === 'tablet').length
  }
};

res.json(stats);
```

**Get Question Answer Distribution:**
```javascript
const responses = await Response.find({
  survey: surveyId,
  isCompleted: true
});

const questionId = ObjectId("...");
const answers = responses
  .flatMap(r => r.answers)
  .filter(a => a.questionId.equals(questionId));

// Group by answer value
const distribution = {};
answers.forEach(a => {
  distribution[a.answer] = (distribution[a.answer] || 0) + 1;
});

res.json({
  question: questionId,
  totalAnswers: answers.length,
  distribution
});
```

---

## API Endpoints

### Initialize Survey Response (Public)

**Endpoint:** `POST /api/responses`

**Headers:**
```
Authorization: Bearer <token> (Optional - null for anonymous)
Content-Type: application/json
```

**Request Body:**
```json
{
  "surveyId": "507f1f77bcf86cd799439011"
}
```

**Response (Success 201):**
```json
{
  "success": true,
  "message": "Survey started",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "survey": "507f1f77bcf86cd799439011",
    "respondent": null,
    "answers": [],
    "isCompleted": false,
    "progress": 0,
    "startedAt": "2024-02-09T10:30:00.000Z"
  }
}
```

### Save Response Progress (Public)

**Endpoint:** `PUT /api/responses/:responseId`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "questionId": "507f1f77bcf86cd799439030",
  "questionText": "How satisfied are you?",
  "questionType": "rating",
  "answer": 4,
  "timeSpent": 12
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Answer saved",
  "data": {
    "progress": 50,
    "totalAnswers": 2,
    "totalQuestions": 4
  }
}
```

### Submit Complete Response (Public)

**Endpoint:** `POST /api/responses/:responseId/submit`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "507f...",
      "answer": 4
    }
  ]
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Response submitted successfully",
  "data": {
    "responseId": "507f1f77bcf86cd799439020",
    "isCompleted": true,
    "completedAt": "2024-02-09T10:45:00.000Z",
    "totalTimeSpent": 900
  }
}
```

### Get Survey Statistics (Protected)

**Endpoint:** `GET /api/surveys/:surveyId/statistics`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success 200):**
```json
{
  "success": true,
  "data": {
    "totalResponses": 142,
    "completedResponses": 128,
    "completionRate": 90.14,
    "avgTimeToComplete": 487,
    "deviceBreakdown": {
      "desktop": 78,
      "mobile": 45,
      "tablet": 5
    },
    "geographicDistribution": {
      "United States": 98,
      "Canada": 20,
      "United Kingdom": 10
    }
  }
}
```

### Get Question Analysis (Protected)

**Endpoint:** `GET /api/surveys/:surveyId/questions/:questionId/analysis`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success 200) - Rating Question:**
```json
{
  "success": true,
  "data": {
    "questionText": "How satisfied are you?",
    "questionType": "rating",
    "totalAnswers": 128,
    "answerDistribution": {
      "1": 2,
      "2": 5,
      "3": 15,
      "4": 45,
      "5": 61
    },
    "avgRating": 4.3,
    "avgTimeSpent": 8
  }
}
```

---

## Response Lifecycle

### State Diagram

```
┌──────────────────────┐
│   Response Created   │
│ (User starts survey) │
│                      │
│ isCompleted: false   │
│ progress: 0          │
│ answers: []          │
└──────────┬───────────┘
           │
           │ User answers questions & saves
           │ (PUT /api/responses/:id)
           │
    ┌──────▼──────────────────┐
    │  Response In Progress    │
    │                          │
    │ isCompleted: false       │
    │ progress: 10-90          │
    │ answers: [1..n-1]        │
    └──────┬───────────────────┘
           │
           │ User submits final answer
           │ (POST /api/responses/:id/submit)
           │
    ┌──────▼──────────────────────┐
    │  Response Completed          │
    │                              │
    │ isCompleted: true            │
    │ progress: 100                │
    │ answers: [1..n]              │
    │ completedAt: <timestamp>     │
    └──────────────────────────────┘
```

### Transitions

**Start → In Progress:**
- User opens first question
- First answer is saved
- Progress updates from 0 to calculated percent

**In Progress → Complete:**
- User answers final question
- isCompleted set to true
- completedAt timestamp recorded
- Survey responseCount incremented

**In Progress → Abandoned:**
- User closes browser
- Response remains with isCompleted = false
- Can be resumed later if responseId is stored

---

## Best Practices

```javascript
// ✅ Good: Save progress frequently
// Capture every answer
response.answers.push({ /* answer */ });
await response.save();

// ✅ Good: Track time per question
const timeSpent = (endTime - startTime) / 1000;
answer.timeSpent = timeSpent;

// ✅ Good: Validate before submission
if (requiredUnanswered > 0) {
  return res.status(400).json({ message: 'Complete required questions' });
}

// ✅ Good: Increment survey count on completion
await Survey.findByIdAndUpdate(
  surveyId,
  { $inc: { responseCount: 1 } }
);

// ❌ Bad: Overwriting entire answers array
response.answers = newAnswers; // Loses previous answers

// ✅ Good: Push individual answers
response.answers.push(newAnswer);

// ❌ Bad: Not tracking metadata
// Losing device and location information

// ✅ Good: Capture on response creation
response.metadata = {
  deviceType: detectDevice(req),
  country: getCountryFromIP(req.ip)
};

// ✅ Good: Allow saving in-progress responses
// isCompleted: false lets users resume

// ❌ Bad: Requiring all answers at once
// Doesn't support partial saves
```

---

## Analytics Queries

### Response Distribution Over Time

```javascript
const responses = await Response.aggregate([
  {
    $match: { survey: surveyId, isCompleted: true }
  },
  {
    $group: {
      _id: {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$completedAt"
        }
      },
      count: { $sum: 1 }
    }
  },
  { $sort: { "_id": 1 } }
]);

// Result: Daily response counts
// [
//   { _id: "2024-02-01", count: 10 },
//   { _id: "2024-02-02", count: 15 },
//   { _id: "2024-02-03", count: 8 }
// ]
```

### Average Time to Complete

```javascript
const avgTime = await Response.aggregate([
  {
    $match: { survey: surveyId, isCompleted: true }
  },
  {
    $group: {
      _id: null,
      avgTimeSeconds: {
        $avg: {
          $subtract: ["$completedAt", "$startedAt"]
        }
      }
    }
  }
]);

// Result in milliseconds, divide by 1000 for seconds
const avgSeconds = avgTime[0].avgTimeSeconds / 1000;
```

---

## Summary

The SurveyResponse schema provides:

✅ Flexible response submission (anonymous or authenticated)
✅ Partial response support (save progress)
✅ Comprehensive metadata tracking
✅ Time tracking per question
✅ Progress monitoring
✅ Complete audit trail with timestamps
✅ Built-in support for multiple question types

**Ready for production with enterprise-grade response collection!**

---

**Last Updated:** 2024-02-09
**Status:** Production Ready ✅
**Version:** 1.0.0
