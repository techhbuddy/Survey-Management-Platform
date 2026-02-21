# Mongoose Survey Schema Documentation

Complete guide to the Survey schema with shareable links and comprehensive question management for the Survey Management SaaS application.

## Table of Contents
1. [Schema Overview](#schema-overview)
2. [Field Specifications](#field-specifications)
3. [Shareable Links](#shareable-links)
4. [Questions Structure](#questions-structure)
5. [Methods and Static Functions](#methods-and-static-functions)
6. [Usage Examples](#usage-examples)
7. [API Endpoints](#api-endpoints)
8. [Survey Status Lifecycle](#survey-status-lifecycle)
9. [Settings and Configuration](#settings-and-configuration)

---

## Schema Overview

The Survey schema represents a survey in the Survey Management SaaS system. Surveys can be created, published, and shared with unique shareable links for collecting responses from any user without authentication.

**File Location:** `backend/src/models/Survey.js`

**Key Features:**
- ✅ Auto-generated shareable links (12+ character hex strings)
- ✅ Multiple survey types support (multiple choice, short text, long text, rating, ranking)
- ✅ Comprehensive question management with ordering
- ✅ Survey status tracking (draft, published, closed)
- ✅ Response counting and analytics readiness
- ✅ Expiration management (time-based survey closing)
- ✅ Public and private view modes
- ✅ Database indexes for performance

---

## Field Specifications

### title
- **Type:** String
- **Required:** Yes
- **Validation:**
  - Minimum 3 characters
  - Maximum 200 characters
  - Automatically trimmed
- **Example:** "Customer Satisfaction Survey", "Product Feedback 2024"

```javascript
{
  title: "Customer Satisfaction Survey" // ✅ Valid
}

{
  title: "AB" // ❌ Too short
}
```

### description
- **Type:** String
- **Required:** No
- **Validation:**
  - Maximum 1000 characters
  - Automatically trimmed
- **Purpose:** Detailed survey instructions or context
- **Example:** "Please provide your honest feedback about our product..."

```javascript
{
  description: "We value your feedback..." // ✅ Valid
}

{
  description: null // ✅ Valid (optional)
}
```

### createdBy
- **Type:** ObjectId (Reference to User)
- **Required:** Yes
- **Format:** Valid MongoDB ObjectId
- **Purpose:** Links survey to its creator
- **Example:** "507f1f77bcf86cd799439011"

```javascript
{
  createdBy: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011") // ✅ Valid
}
```

**Query with Creator:**
```javascript
// Get survey with populated creator
const survey = await Survey.findWithCreator(surveyId);
// Result includes: { ..., createdBy: { _id, name, email } }
```

### status
- **Type:** String (Enum)
- **Default:** "draft"
- **Valid Values:** "draft", "published", "closed"
- **Validation:** Must be one of the enum values
- **Transitions:**
  - draft → published (when ready to collect responses)
  - published → closed (when stopping response collection)
  - draft → closed (can skip published)

```javascript
{
  status: "draft" // ✅ Default status
}

{
  status: "published" // ✅ Ready for responses
}

{
  status: "invalid" // ❌ Invalid status
}
```

**Status Meanings:**
- **draft**: Survey being created/edited, not accessible to others
- **published**: Survey is live and accepting responses
- **closed**: Survey no longer accepts new responses

### questions
- **Type:** Array of Objects
- **Required:** No (can be empty)
- **Purpose:** Contains all survey questions

Each question object contains:

#### _id
- **Type:** ObjectId (auto-generated)
- **Purpose:** Unique identifier for the question

#### order
- **Type:** Number
- **Required:** Yes
- **Purpose:** Display order of questions
- **Example:** 1, 2, 3, etc.

#### type
- **Type:** String (Enum)
- **Required:** Yes
- **Valid Values:**
  - "multiple_choice" - Single or multiple selection
  - "short_text" - Up to 255 characters
  - "long_text" - Extended text response
  - "rating" - 1-5 or custom scale
  - "ranking" - Rank options in order

```javascript
{
  type: "multiple_choice" // ✅ Valid
}

{
  type: "short_text" // ✅ Valid
}

{
  type: "invalid_type" // ❌ Invalid
}
```

#### text
- **Type:** String
- **Required:** Yes
- **Validation:** Minimum 2 characters
- **Purpose:** The actual question text
- **Example:** "How satisfied are you with our service?"

```javascript
{
  text: "How satisfied are you?" // ✅ Valid
}

{
  text: "A" // ❌ Too short
}
```

#### description
- **Type:** String
- **Required:** No
- **Validation:** Maximum 500 characters
- **Purpose:** Additional context or help text for the question
- **Example:** "This helps us understand your experience"

#### required
- **Type:** Boolean
- **Default:** false
- **Purpose:** Whether respondent must answer this question

```javascript
{
  required: true // ✅ Mandatory question
}

{
  required: false // ✅ Optional question
}
```

#### options (for multiple_choice, ranking)
- **Type:** Array of Objects
- **Required:** For multiple_choice and ranking types

Each option object:
```javascript
{
  _id: ObjectId,      // Auto-generated
  text: "Option 1",   // Display text
  value: "opt_1"      // Internal value
}
```

**Example:**
```javascript
{
  type: "multiple_choice",
  text: "Which features do you use?",
  options: [
    { text: "Feature A", value: "feat_a" },
    { text: "Feature B", value: "feat_b" },
    { text: "Feature C", value: "feat_c" }
  ]
}
```

#### settings (for rating, ranking)
- **Type:** Object
- **Purpose:** Type-specific configuration

**For rating questions:**
```javascript
{
  minValue: 1,        // Minimum rating value
  maxValue: 5,        // Maximum rating value
  minLabel: "Poor",   // Label for minimum
  maxLabel: "Excellent" // Label for maximum
}
```

**Full question example:**
```javascript
{
  order: 1,
  type: "rating",
  text: "How satisfied are you with our service?",
  required: true,
  settings: {
    minValue: 1,
    maxValue: 5,
    minLabel: "Not Satisfied",
    maxLabel: "Very Satisfied"
  }
}
```

### shareableLink
- **Type:** String (Unique, Sparse)
- **Auto-generated:** Yes (when status → published)
- **Format:** 8+ alphanumeric characters (hex string)
- **Default:** null
- **Purpose:** Public link for sharing survey
- **Example:** "a1b2c3d4e5f6g7h8"

```javascript
{
  shareableLink: "a1b2c3d4e5" // ✅ Auto-generated on publish
}

{
  shareableLink: null // ✅ Until published
}
```

**Access Pattern:**
```javascript
// Public: Access survey via shareable link (NO authentication needed)
GET /api/surveys/public/:shareableLink

// Result: Public view of survey only
{
  _id: "...",
  title: "...",
  description: "...",
  questions: [...]
}
```

### settings
- **Type:** Object
- **Purpose:** Survey-wide configuration options

**Available Settings:**

#### allowAnonymous
- **Type:** Boolean
- **Default:** true
- **Purpose:** Whether anonymous responses are allowed

#### allowMultipleResponses
- **Type:** Boolean
- **Default:** false
- **Purpose:** Whether same person can respond multiple times

#### showProgressBar
- **Type:** Boolean
- **Default:** true
- **Purpose:** Display progress bar to respondent

#### randomizeQuestions
- **Type:** Boolean
- **Default:** false
- **Purpose:** Show questions in random order

**Example:**
```javascript
{
  settings: {
    allowAnonymous: true,
    allowMultipleResponses: false,
    showProgressBar: true,
    randomizeQuestions: false
  }
}
```

### responseCount
- **Type:** Number
- **Default:** 0
- **Purpose:** Track number of responses received
- **Updated:** Automatically incremented when response submitted

### publishedAt
- **Type:** Date
- **Default:** null
- **Purpose:** Timestamp when survey was published
- **Set:** When status changes from draft/closed to published

### closedAt
- **Type:** Date
- **Default:** null
- **Purpose:** Timestamp when survey was closed
- **Set:** When status changed to closed

### expiresAt
- **Type:** Date
- **Default:** null
- **Purpose:** Automatic closing time for survey
- **Usage:** If set and current time passes this, survey stops accepting responses

```javascript
{
  expiresAt: new Date('2024-12-31T23:59:59Z') // ✅ Survey expires at this time
}

{
  expiresAt: null // ✅ No expiration
}
```

**Check in request handler:**
```javascript
if (survey.expiresAt && new Date() > survey.expiresAt) {
  return res.status(403).json({ message: 'Survey has expired' });
}
```

### tags
- **Type:** Array of Strings
- **Purpose:** Category or topic tags for organization
- **Example:** ["product", "feedback", "q1-2024"]

```javascript
{
  tags: ["customer-feedback", "2024"] // ✅ Valid
}

{
  tags: [] // ✅ Valid (empty)
}
```

### createdAt & updatedAt
- **Type:** Date (Auto-generated)
- **Format:** ISO 8601 (UTC)
- **Purpose:** Audit trail of survey creation and modifications
- **Set By:** Mongoose timestamps option

---

## Shareable Links

### How Shareable Links Work

When a survey status is changed to "published", the pre-save middleware automatically generates a unique shareable link.

```javascript
surveySchema.pre('save', async function (next) {
  // Generate shareable link if status is published and link doesn't exist
  if (this.status === 'published' && !this.shareableLink) {
    try {
      let uniqueLink;
      let exists = true;

      // Generate unique link
      while (exists) {
        uniqueLink = crypto.randomBytes(6).toString('hex');
        const existing = await this.constructor.findOne({ shareableLink: uniqueLink });
        exists = !!existing;
      }

      this.shareableLink = uniqueLink;
    } catch (error) {
      next(error);
    }
  }

  next();
});
```

**Process:**
1. Check if status is "published"
2. Check if shareableLink doesn't already exist
3. Generate random 12-character hex string
4. Verify uniqueness in database
5. Assign to shareableLink field
6. Save survey

### Using Shareable Links

**Share Survey:**
```
Frontend URL: https://yourapp.com/surveys/{shareableLink}
Backend API: /api/surveys/public/{shareableLink}
```

**Access Without Authentication:**
```javascript
// Anyone with the link can access and respond
const survey = await Survey.findByShareableLink(shareableLink);

if (!survey) {
  return res.status(404).json({ message: 'Survey not found' });
}

// Return public view (no creator info)
res.json(survey.getPublicView());
```

---

## Questions Structure

### Example Survey with Multiple Question Types

```javascript
const survey = {
  title: "Product Feedback Survey",
  description: "Help us improve our product",
  questions: [
    {
      order: 1,
      type: "multiple_choice",
      text: "Which features do you use most?",
      required: true,
      options: [
        { text: "Feature A", value: "a" },
        { text: "Feature B", value: "b" },
        { text: "Feature C", value: "c" }
      ]
    },
    {
      order: 2,
      type: "short_text",
      text: "What is the main benefit you get?",
      required: true,
      description: "Limit your answer to 255 characters"
    },
    {
      order: 3,
      type: "rating",
      text: "Overall satisfaction",
      required: true,
      settings: {
        minValue: 1,
        maxValue: 5,
        minLabel: "Not Satisfied",
        maxLabel: "Very Satisfied"
      }
    },
    {
      order: 4,
      type: "long_text",
      text: "Additional comments",
      required: false,
      description: "Please share any additional feedback"
    },
    {
      order: 5,
      type: "ranking",
      text: "Rank these by preference",
      required: true,
      options: [
        { text: "Price", value: "price" },
        { text: "Quality", value: "quality" },
        { text: "Support", value: "support" }
      ]
    }
  ]
}
```

---

## Methods and Static Functions

### Instance Methods

#### canAcceptResponses()

Checks if the survey is currently accepting responses.

**Returns:** Boolean

**Logic:**
- Status must be "published"
- If expiresAt is set, current time must be before it

**Usage:**
```javascript
const survey = await Survey.findById(surveyId);

if (survey.canAcceptResponses()) {
  // Accept response
} else {
  return res.status(403).json({ message: 'Survey not accepting responses' });
}
```

**Implementation:**
```javascript
surveySchema.methods.canAcceptResponses = function () {
  return (
    this.status === 'published' &&
    (!this.expiresAt || new Date(this.expiresAt) > new Date())
  );
};
```

#### getPublicView()

Returns survey data safe for public (non-authenticated) access.

**Returns:** Object with public fields only

**Excludes:** createdBy details (for privacy)

**Usage:**
```javascript
// Instead of returning full survey
// which includes creator information:
const survey = await Survey.findByShareableLink(link);

// Return only public data
res.json(survey.getPublicView());
// Returns: { _id, title, description, questions, shareableLink }
```

**Implementation:**
```javascript
surveySchema.methods.getPublicView = function () {
  return {
    _id: this._id,
    title: this.title,
    description: this.description,
    questions: this.questions,
    shareableLink: this.shareableLink,
  };
};
```

### Static Methods

#### Survey.findByShareableLink(link)

Finds a survey by its shareable link (public access).

**Parameters:**
- `link` (string): The shareable link

**Returns:** Promise<Survey|null>

**Conditions:**
- Status must be "published"
- Link must match exactly

**Usage:**
```javascript
// Public endpoint
const survey = await Survey.findByShareableLink('a1b2c3d4e5f6');

if (!survey) {
  return res.status(404).json({ message: 'Survey not found' });
}

res.json(survey.getPublicView());
```

**Implementation:**
```javascript
surveySchema.statics.findByShareableLink = function (link) {
  return this.findOne({ shareableLink: link, status: 'published' });
};
```

#### Survey.findWithCreator(surveyId)

Finds a survey with populated creator information.

**Parameters:**
- `surveyId` (string): Survey ObjectId

**Returns:** Promise<Survey|null> with createdBy populated

**Populated Fields:** createdBy.name, createdBy.email

**Usage:**
```javascript
// Get survey with creator details (authenticated user)
const survey = await Survey.findWithCreator(surveyId);

res.json({
  ...survey.toObject(),
  createdBy: {
    id: survey.createdBy._id,
    name: survey.createdBy.name,
    email: survey.createdBy.email
  }
});
```

**Implementation:**
```javascript
surveySchema.statics.findWithCreator = function (surveyId) {
  return this.findById(surveyId).populate('createdBy', 'name email');
};
```

---

## Usage Examples

### Creating a Survey

**Method 1: Direct instantiation**
```javascript
const survey = new Survey({
  title: "Customer Satisfaction",
  description: "Tell us what you think",
  createdBy: userId,
  questions: [
    {
      order: 1,
      type: "multiple_choice",
      text: "How satisfied are you?",
      required: true,
      options: [
        { text: "Very Satisfied", value: "5" },
        { text: "Satisfied", value: "4" },
        { text: "Neutral", value: "3" },
        { text: "Unsatisfied", value: "2" },
        { text: "Very Unsatisfied", value: "1" }
      ]
    }
  ],
  settings: {
    allowAnonymous: true,
    allowMultipleResponses: false,
    showProgressBar: true
  }
});

await survey.save();
```

**Method 2: Create with additional fields**
```javascript
const survey = await Survey.create({
  title: "Product Feedback",
  description: "Help us improve",
  createdBy: userId,
  status: "draft",
  tags: ["product", "feedback"],
  expiresAt: new Date('2024-12-31'),
  questions: [
    // Add questions array
  ]
});
```

### Finding Surveys

**By ID:**
```javascript
const survey = await Survey.findById(surveyId);
```

**By Creator (authenticated user's surveys):**
```javascript
const surveys = await Survey.find({ createdBy: userId });
```

**By Status:**
```javascript
// Get all published surveys
const published = await Survey.find({ status: 'published' });

// Get user's draft surveys
const drafts = await Survey.find({ createdBy: userId, status: 'draft' });
```

**By Shareable Link (public access):**
```javascript
const survey = await Survey.findByShareableLink(link);
```

**With Creator Details:**
```javascript
const survey = await Survey.findWithCreator(surveyId);
```

**With Pagination:**
```javascript
const page = 1;
const limit = 10;
const surveys = await Survey.find({ createdBy: userId })
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit);
```

### Publishing a Survey

**From Draft to Published:**
```javascript
const survey = await Survey.findById(surveyId);

// Verify it has at least one question
if (!survey.questions || survey.questions.length === 0) {
  return res.status(400).json({ message: 'Survey must have at least one question' });
}

// Change status to published (triggers middleware)
survey.status = 'published';
survey.publishedAt = new Date();

await survey.save();
// shareableLink is automatically generated here

res.json({
  message: 'Survey published successfully',
  shareableLink: survey.shareableLink,
  survey
});
```

### Closing a Survey

**Stop accepting responses:**
```javascript
const survey = await Survey.findById(surveyId);

survey.status = 'closed';
survey.closedAt = new Date();

await survey.save();

res.json({ message: 'Survey closed', responseCount: survey.responseCount });
```

### Checking Response Availability

**Before accepting a response:**
```javascript
const survey = await Survey.findById(surveyId);

if (!survey.canAcceptResponses()) {
  return res.status(403).json({
    message: 'Survey is not accepting responses',
    reason: survey.status !== 'published'
      ? 'Survey is not published'
      : 'Survey has expired',
    responseCount: survey.responseCount
  });
}

// Accept response...
```

### Using Shareable Link (Public Access)

**No Authentication Required:**
```javascript
// GET /api/surveys/public/:shareableLink
const survey = await Survey.findByShareableLink(req.params.shareableLink);

if (!survey) {
  return res.status(404).json({ message: 'Survey not found' });
}

// Return only safe public data
res.json(survey.getPublicView());
```

---

## API Endpoints

### Create Survey (Protected)

**Endpoint:** `POST /api/surveys`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Customer Feedback Survey",
  "description": "Help us improve our service",
  "questions": [
    {
      "order": 1,
      "type": "multiple_choice",
      "text": "How satisfied are you?",
      "required": true,
      "options": [
        { "text": "Very Satisfied", "value": "5" },
        { "text": "Satisfied", "value": "4" }
      ]
    }
  ],
  "settings": {
    "allowAnonymous": true,
    "showProgressBar": true
  }
}
```

**Response (Success 201):**
```json
{
  "success": true,
  "message": "Survey created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Customer Feedback Survey",
    "description": "Help us improve our service",
    "createdBy": "507f1f77bcf86cd799439012",
    "status": "draft",
    "questions": [...],
    "settings": {...},
    "responseCount": 0,
    "shareableLink": null,
    "createdAt": "2024-02-09T10:30:00.000Z",
    "updatedAt": "2024-02-09T10:30:00.000Z"
  }
}
```

### Get User's Surveys (Protected)

**Endpoint:** `GET /api/surveys`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
?status=draft&limit=10&page=1
```

**Response (Success 200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Survey 1",
      "status": "draft",
      "responseCount": 0,
      "createdAt": "2024-02-09T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10
  }
}
```

### Get Survey Detail (Protected)

**Endpoint:** `GET /api/surveys/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success 200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Customer Feedback Survey",
    "description": "...",
    "createdBy": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "status": "draft",
    "questions": [...],
    "shareableLink": null,
    "responseCount": 0,
    "createdAt": "2024-02-09T10:30:00.000Z"
  }
}
```

### Publish Survey (Protected)

**Endpoint:** `POST /api/surveys/:id/publish`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Survey published successfully",
  "data": {
    "_id": "...",
    "title": "Customer Feedback Survey",
    "status": "published",
    "shareableLink": "a1b2c3d4e5f6",
    "publishedAt": "2024-02-09T11:00:00.000Z"
  }
}
```

### Get Survey by Shareable Link (Public - No Auth)

**Endpoint:** `GET /api/surveys/public/:shareableLink`

**Response (Success 200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Customer Feedback Survey",
    "description": "Help us improve",
    "questions": [...],
    "shareableLink": "a1b2c3d4e5f6"
  }
}
```

---

## Survey Status Lifecycle

### Status Transitions

```
┌─────────────────────────────────────────┐
│                Draft                    │
│ (Being created/edited by creator)       │
└────────────┬────────────────────────────┘
             │
             │ Save → publish
             │ (Creator clicks "Publish")
             │
        ┌────▼──────────────────────────┐
        │       Published                │
        │ (Accepting responses from      │
        │  users with shareable link)    │
        └────┬───────────────────────────┘
             │
             │ API call → close
             │ (Creator closes survey)
             │ OR expiresAt passes
             │
        ┌────▼──────────────────────────┐
        │        Closed                  │
        │ (No longer accepting responses)│
        └────────────────────────────────┘
```

### Status Details

**Draft:**
- Survey being created or edited
- Not visible to others
- No shareable link
- Creator can add/remove/modify questions

**Published:**
- Shareable link is auto-generated
- Public link accessible to anyone
- Accepting responses
- Questions should not be modified (breaks response data)

**Closed:**
- No new responses accepted
- Data is preserved
- Can be reopened by changing status back to "published"

---

## Settings and Configuration

### allowAnonymous

**Purpose:** Allow responses without user authentication

```javascript
{
  settings: {
    allowAnonymous: true
  }
}
```

**Use Cases:**
- Public surveys with no login required
- Customer feedback without registration

**In Response Handler:**
```javascript
if (survey.settings.allowAnonymous) {
  response.respondent = null; // Anonymous response
} else {
  response.respondent = userId; // Authenticated only
}
```

### allowMultipleResponses

**Purpose:** Control if same person can respond multiple times

```javascript
{
  settings: {
    allowMultipleResponses: false // Only one response per person
  }
}
```

**Use Cases:**
- `true`: Daily pulse surveys, multiple feedback sessions
- `false`: One-time surveys, official feedback

**In Response Handler:**
```javascript
if (!survey.settings.allowMultipleResponses) {
  const existing = await Response.findOne({
    survey: surveyId,
    respondent: userId
  });

  if (existing) {
    return res.status(403).json({ message: 'You already responded' });
  }
}
```

### showProgressBar

**Purpose:** Display progress indicator to respondent

```javascript
{
  settings: {
    showProgressBar: true
  }
}
```

**Use Cases:**
- `true`: For long surveys (shows progress encourages completion)
- `false`: For quick surveys (less visual clutter)

**Frontend Implementation:**
```javascript
if (survey.settings.showProgressBar) {
  const progress = (currentQuestion / totalQuestions) * 100;
  // Display progress bar
}
```

### randomizeQuestions

**Purpose:** Present questions in random order

```javascript
{
  settings: {
    randomizeQuestions: true
  }
}
```

**Use Cases:**
- Reduce bias in response patterns
- A/B testing different question orders
- Research studies requiring randomization

**Frontend Implementation:**
```javascript
let questions = survey.questions;

if (survey.settings.randomizeQuestions) {
  questions = questions.sort(() => Math.random() - 0.5);
}

// Display randomized questions
```

---

## Database Performance

### Indexes

```javascript
surveySchema.index({ createdBy: 1 });      // Find surveys by creator
surveySchema.index({ status: 1 });         // Filter by status
surveySchema.index({ shareableLink: 1 });  // Look up by public link
surveySchema.index({ createdAt: -1 });     // Sort by creation date
```

**Performance Impact:**
- Creator lookup: O(1) instead of O(n)
- Status filtering: Fast
- Shareable link lookup: O(1)
- Date sorting: 10-100x faster

---

## Validation Rules

### Title
- ✅ "Customer Satisfaction Survey" (3-200 chars)
- ✅ "Q1 2024 Feedback"
- ❌ "AB" (too short, min 3)
- ❌ "X".repeat(201) (too long, max 200)

### Questions Array
- ✅ Empty array for drafts: `[]`
- ✅ Single question: `[{ order: 1, type: "short_text", text: "..." }]`
- Requirements for publish:
  - Minimum 1 question required
  - Each question must have: order, type, text
  - order must be sequential

---

## Best Practices

```javascript
// ✅ Good: Check response availability first
if (survey.canAcceptResponses()) {
  // Process response
} else {
  return res.status(403).json({ message: 'Survey not accepting' });
}

// ❌ Bad: Only checking status
if (survey.status === 'published') { } // Misses expiration check

// ✅ Good: Get complete creator info
const survey = await Survey.findWithCreator(surveyId);

// ✅ Good: Use public view for shareable links
res.json(survey.getPublicView());

// ❌ Bad: Exposing all survey data
res.json(survey); // Might expose sensitive data

// ✅ Good: Update response count after saving response
survey.responseCount += 1;
await survey.save();

// ✅ Good: Sort by recent
const surveys = await Survey.find({ createdBy: userId })
  .sort({ createdAt: -1 });
```

---

## Summary

The Survey schema provides:

✅ Flexible question types (5 types supported)
✅ Auto-generated shareable links for public access
✅ Comprehensive survey settings
✅ Status lifecycle management
✅ Response counting and tracking
✅ Creator attribution
✅ Database performance optimization
✅ Public and private access modes

**Ready for production with enterprise-grade survey management!**

---

**Last Updated:** 2024-02-09
**Status:** Production Ready ✅
**Version:** 1.0.0
