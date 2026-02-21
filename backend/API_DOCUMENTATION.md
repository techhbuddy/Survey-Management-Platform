# Survey Management API Documentation

Complete API reference for the Survey Management SaaS application with all endpoints, request/response examples, and authentication details.

---

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [Survey Management APIs](#survey-management-apis)
3. [Public Survey Access APIs](#public-survey-access-apis)
4. [Response APIs](#response-apis)
5. [Error Handling](#error-handling)
6. [Rate Limiting & Best Practices](#rate-limiting--best-practices)

---

## Base URL

```
Development: http://localhost:5000/api
Production: https://api.yourdomain.com/api
```

---

## Authentication APIs

All endpoints use JWT Bearer tokens for authentication (except public endpoints).

### Register New User

**Endpoint:** `POST /auth/register`

**Authentication:** No

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Validation Rules:**
- `name`: Required, minimum 2 characters
- `email`: Required, valid email format
- `password`: Required, minimum 6 characters

**Response (Success 201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "creator",
      "createdAt": "2024-02-09T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error 400 - Email Already Registered):**
```json
{
  "success": false,
  "message": "Email already registered",
  "status": 400
}
```

---

### Login User

**Endpoint:** `POST /auth/login`

**Authentication:** No

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "creator",
      "createdAt": "2024-02-09T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error 401 - Invalid Credentials):**
```json
{
  "success": false,
  "message": "Invalid credentials",
  "status": 401
}
```

**Token Usage:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Get User Profile

**Endpoint:** `GET /auth/profile`

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "creator",
    "createdAt": "2024-02-09T10:30:00.000Z",
    "updatedAt": "2024-02-09T10:30:00.000Z"
  }
}
```

---

### Update User Profile

**Endpoint:** `PUT /auth/profile`

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Jane Doe"
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Jane Doe",
    "email": "john@example.com",
    "role": "creator",
    "updatedAt": "2024-02-09T10:45:00.000Z"
  }
}
```

---

### Change Password

**Endpoint:** `POST /auth/change-password`

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Validation Rules:**
- `currentPassword`: Required, must be correct
- `newPassword`: Required, minimum 6 characters, must be different from current

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": null
}
```

**Response (Error 401 - Wrong Current Password):**
```json
{
  "success": false,
  "message": "Current password is incorrect",
  "status": 401
}
```

---

## Survey Management APIs

All survey management endpoints require authentication.

### Create Survey

**Endpoint:** `POST /surveys`

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Customer Satisfaction Survey",
  "description": "Help us improve our service",
  "questions": [
    {
      "order": 1,
      "type": "multiple_choice",
      "text": "How satisfied are you?",
      "required": true,
      "options": [
        { "text": "Very Satisfied", "value": "5" },
        { "text": "Satisfied", "value": "4" },
        { "text": "Neutral", "value": "3" },
        { "text": "Unsatisfied", "value": "2" },
        { "text": "Very Unsatisfied", "value": "1" }
      ]
    }
  ],
  "settings": {
    "allowAnonymous": true,
    "allowMultipleResponses": false,
    "showProgressBar": true,
    "randomizeQuestions": false
  },
  "tags": ["customer-feedback", "q1-2024"]
}
```

**Response (Success 201):**
```json
{
  "success": true,
  "message": "Survey created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Customer Satisfaction Survey",
    "description": "Help us improve our service",
    "createdBy": "507f1f77bcf86cd799439011",
    "status": "draft",
    "questions": [...],
    "settings": {...},
    "responseCount": 0,
    "shareableLink": null,
    "tags": ["customer-feedback", "q1-2024"],
    "createdAt": "2024-02-09T10:30:00.000Z",
    "updatedAt": "2024-02-09T10:30:00.000Z"
  }
}
```

---

### List User's Surveys

**Endpoint:** `GET /surveys`

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
?status=draft&search=satisfaction&skip=0&limit=10
```

- `status` (optional): Filter by status (draft, published, closed)
- `search` (optional): Search in title and description
- `skip` (optional): Number of surveys to skip (default: 0)
- `limit` (optional): Number of surveys to return (default: 10)

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "surveys": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Customer Satisfaction Survey",
        "status": "draft",
        "responseCount": 0,
        "createdAt": "2024-02-09T10:30:00.000Z"
      }
    ],
    "total": 5,
    "skip": 0,
    "limit": 10
  }
}
```

---

### Get Survey Details

**Endpoint:** `GET /surveys/:id`

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Customer Satisfaction Survey",
    "description": "Help us improve our service",
    "createdBy": "507f1f77bcf86cd799439011",
    "status": "draft",
    "questions": [...],
    "shareableLink": null,
    "responseCount": 0,
    "createdAt": "2024-02-09T10:30:00.000Z"
  }
}
```

**Response (Error 403 - Not Authorized):**
```json
{
  "success": false,
  "message": "Not authorized to access this survey",
  "status": 403
}
```

---

### Update Survey

**Endpoint:** `PUT /surveys/:id`

**Authentication:** Required (Bearer token)

**Authorization:** Only survey creator can update

**Note:** Cannot update published or closed surveys

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated Survey Title",
  "description": "Updated description",
  "questions": [...],
  "settings": {...},
  "tags": [...]
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Survey updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Updated Survey Title",
    ...
  }
}
```

**Response (Error 400 - Cannot Update Published Survey):**
```json
{
  "success": false,
  "message": "Cannot update published or closed surveys",
  "status": 400
}
```

---

### Delete Survey

**Endpoint:** `DELETE /surveys/:id`

**Authentication:** Required (Bearer token)

**Authorization:** Only survey creator can delete

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Survey deleted successfully",
  "data": null
}
```

---

### Publish Survey

**Endpoint:** `PUT /surveys/:id/publish`

**Authentication:** Required (Bearer token)

**Authorization:** Only survey creator can publish

**Note:** Survey must have at least one question

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Survey published successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Customer Satisfaction Survey",
    "status": "published",
    "shareableLink": "a1b2c3d4e5f6",
    "publishedAt": "2024-02-09T11:00:00.000Z"
  }
}
```

**Next Steps After Publishing:**
- Share the `shareableLink` with respondents
- Public URL: `https://yourdomain.com/surveys/{shareableLink}`
- API URL: `GET /api/public/survey/{shareableLink}`

---

### Close Survey

**Endpoint:** `PUT /surveys/:id/close`

**Authentication:** Required (Bearer token)

**Authorization:** Only survey creator can close

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Survey closed successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "status": "closed",
    "closedAt": "2024-02-09T12:00:00.000Z"
  }
}
```

---

### Add Question to Survey

**Endpoint:** `POST /surveys/:id/questions`

**Authentication:** Required (Bearer token)

**Authorization:** Only survey creator

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "order": 2,
  "type": "rating",
  "text": "How likely are you to recommend us?",
  "required": true,
  "settings": {
    "minValue": 1,
    "maxValue": 5,
    "minLabel": "Not Likely",
    "maxLabel": "Very Likely"
  }
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Question added successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "questions": [...]
  }
}
```

---

### Get Survey Analytics

**Endpoint:** `GET /surveys/:id/analytics`

**Authentication:** Required (Bearer token)

**Authorization:** Only survey creator

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "surveyId": "507f1f77bcf86cd799439012",
    "title": "Customer Satisfaction Survey",
    "responseCount": 45,
    "status": "published",
    "createdAt": "2024-02-09T10:30:00.000Z"
  }
}
```

---

## Public Survey Access APIs

No authentication required for public survey access.

### Get Survey by Shareable Link

**Endpoint:** `GET /public/survey/:link`

**Authentication:** No

**Request Headers:**
```
Content-Type: application/json
```

**URL Parameters:**
- `link`: The shareable link (e.g., "a1b2c3d4e5f6")

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Survey retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Customer Satisfaction Survey",
    "description": "Help us improve our service",
    "questions": [
      {
        "_id": "...",
        "order": 1,
        "type": "multiple_choice",
        "text": "How satisfied are you?",
        "required": true,
        "options": [...]
      }
    ],
    "shareableLink": "a1b2c3d4e5f6"
  }
}
```

**Response (Error 404 - Survey Not Found):**
```json
{
  "success": false,
  "message": "Survey not found or not published",
  "status": 404
}
```

**Response (Error 403 - Survey Expired/Closed):**
```json
{
  "success": false,
  "message": "This survey is no longer accepting responses",
  "status": 403
}
```

---

### Submit Survey Response via Shareable Link

**Endpoint:** `POST /public/survey/:link/submit`

**Authentication:** Optional (supports anonymous and authenticated responses)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token> (optional)
```

**URL Parameters:**
- `link`: The shareable link

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "507f1f77bcf86cd799439030",
      "questionText": "How satisfied are you?",
      "questionType": "rating",
      "answer": 4,
      "timeSpent": 12
    },
    {
      "questionId": "507f1f77bcf86cd799439031",
      "questionText": "What can we improve?",
      "questionType": "long_text",
      "answer": "Better customer support would help",
      "timeSpent": 45
    }
  ]
}
```

**Validation Rules:**
- All required questions must be answered
- Answers must match question type
- Empty answers array is not allowed

**Response (Success 201):**
```json
{
  "success": true,
  "message": "Response submitted successfully",
  "data": {
    "responseId": "507f1f77bcf86cd799439020",
    "message": "Thank you! Your response has been submitted."
  }
}
```

**Response (Error 400 - Missing Required Questions):**
```json
{
  "success": false,
  "message": "Please answer 2 required question(s)",
  "status": 400
}
```

**Response (Error 400 - Already Responded):**
```json
{
  "success": false,
  "message": "You have already submitted a response to this survey",
  "status": 400
}
```

**Response (Error 403 - Survey Expired):**
```json
{
  "success": false,
  "message": "This survey is no longer accepting responses",
  "status": 403
}
```

---

## Response APIs

### Submit Complete Response

**Endpoint:** `POST /responses`

**Authentication:** Optional

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token> (optional)
```

**Request Body:**
```json
{
  "surveyId": "507f1f77bcf86cd799439012",
  "answers": [
    {
      "questionId": "507f1f77bcf86cd799439030",
      "answer": 4
    }
  ]
}
```

**Response (Success 201):**
```json
{
  "success": true,
  "message": "Response submitted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "survey": "507f1f77bcf86cd799439012",
    "answers": [...],
    "isCompleted": true,
    "completedAt": "2024-02-09T11:30:00.000Z"
  }
}
```

---

### Save Partial Response

**Endpoint:** `POST /responses/draft`

**Authentication:** Optional

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token> (optional)
```

**Request Body:**
```json
{
  "surveyId": "507f1f77bcf86cd799439012",
  "answers": [
    {
      "questionId": "507f1f77bcf86cd799439030",
      "answer": 4
    }
  ],
  "progress": 25
}
```

**Response (Success 201):**
```json
{
  "success": true,
  "message": "Response saved",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "isCompleted": false,
    "progress": 25
  }
}
```

---

### Get Responses for Survey

**Endpoint:** `GET /responses`

**Authentication:** Required (Bearer token)

**Authorization:** Only survey creator can view responses

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
?surveyId=507f1f77bcf86cd799439012&skip=0&limit=10
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "responses": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "survey": "507f1f77bcf86cd799439012",
        "respondent": null,
        "answers": [...],
        "isCompleted": true,
        "completedAt": "2024-02-09T11:30:00.000Z"
      }
    ],
    "total": 45,
    "skip": 0,
    "limit": 10
  }
}
```

---

### Get Response Details

**Endpoint:** `GET /responses/:responseId`

**Authentication:** Required (Bearer token)

**Authorization:** Only survey creator

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "survey": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Customer Satisfaction Survey"
    },
    "respondent": null,
    "answers": [...],
    "metadata": {
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "203.0.113.42",
      "country": "United States",
      "deviceType": "mobile"
    },
    "isCompleted": true,
    "completedAt": "2024-02-09T11:30:00.000Z"
  }
}
```

---

### Get Response Analytics

**Endpoint:** `GET /responses/:surveyId/analytics`

**Authentication:** Required (Bearer token)

**Authorization:** Only survey creator

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "surveyId": "507f1f77bcf86cd799439012",
    "completedResponses": 42,
    "partialResponses": 8,
    "totalResponses": 50,
    "completionRate": 84,
    "averageTimeSpent": 287
  }
}
```

---

### Delete Response

**Endpoint:** `DELETE /responses/:responseId`

**Authentication:** Required (Bearer token)

**Authorization:** Only survey creator

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Response deleted successfully",
  "data": null
}
```

---

## Error Handling

### Standard Error Response

All error responses follow this format:

```json
{
  "success": false,
  "status": 400,
  "message": "Error message here",
  "timestamp": "2024-02-09T10:30:00.000Z",
  "path": "/api/surveys",
  "errors": null
}
```

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful request |
| 201 | Created | Resource successfully created |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Access denied (not authorized) |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |

### Error Types

#### Validation Error (400)
```json
{
  "success": false,
  "status": 400,
  "message": "Validation Error: Email is required, Password must be at least 6 characters",
  "errors": {
    "email": "Email is required",
    "password": "Password must be at least 6 characters"
  }
}
```

#### Authentication Error (401)
```json
{
  "success": false,
  "status": 401,
  "message": "Invalid or expired token"
}
```

#### Authorization Error (403)
```json
{
  "success": false,
  "status": 403,
  "message": "Not authorized to access this resource"
}
```

#### Resource Not Found (404)
```json
{
  "success": false,
  "status": 404,
  "message": "Survey not found"
}
```

---

## Rate Limiting & Best Practices

### Best Practices

1. **Always include Authorization header for protected routes:**
   ```
   Authorization: Bearer <your_token_here>
   ```

2. **Store tokens securely:**
   - Never expose tokens in logs or error messages
   - Store in secure, HttpOnly cookies (not localStorage)
   - Include CSRF protection

3. **Handle token expiration:**
   - Implement token refresh mechanism
   - Redirect to login on 401 response
   - Re-authenticate user

4. **Validate input on client side:**
   - Check field lengths before sending
   - Validate email format
   - Confirm required fields are filled

5. **Pagination for large datasets:**
   - Always use `skip` and `limit` parameters
   - Recommended limit: 10-50 items per page
   - Example: `?skip=0&limit=20`

6. **Error handling on client:**
   ```javascript
   try {
     const response = await fetch('/api/surveys');
     if (!response.ok) {
       const error = await response.json();
       console.error('API Error:', error.message);
     }
     const data = await response.json();
   } catch (error) {
     console.error('Network error:', error);
   }
   ```

---

## Complete Example Workflow

### 1. User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 2. User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Create Survey (uses token from login)
```bash
curl -X POST http://localhost:5000/api/surveys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_FROM_LOGIN>" \
  -d '{
    "title": "Customer Survey",
    "questions": [...]
  }'
```

### 4. Publish Survey
```bash
curl -X PUT http://localhost:5000/api/surveys/{SURVEY_ID}/publish \
  -H "Authorization: Bearer <TOKEN>"
```

### 5. Public User Submits Response
```bash
curl -X POST http://localhost:5000/api/public/survey/{SHAREABLE_LINK}/submit \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [...]
  }'
```

### 6. View Responses
```bash
curl -X GET "http://localhost:5000/api/responses?surveyId={SURVEY_ID}" \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Environment Variables

Required `.env` variables:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/survey-saas
MONGODB_POOL_SIZE=10
MONGODB_SOCKET_TIMEOUT=45000

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## API Health Check

### Basic Health Check
```bash
GET /api/health
```

**Response:**
```json
{
  "status": "Server is running",
  "timestamp": "2024-02-09T10:30:00.000Z",
  "uptime": 3600
}
```

### Detailed Health Check
```bash
GET /api/health/detailed
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-02-09T10:30:00.000Z",
  "uptime": 3600,
  "server": {
    "environment": "development",
    "port": 5000
  },
  "database": {
    "connected": true,
    "status": "connected"
  },
  "memory": {
    "heapUsed": "45 MB",
    "heapTotal": "256 MB"
  }
}
```

---

## Support & Troubleshooting

### Token Issues
- **Token Invalid**: Re-login to get a new token
- **Token Expired**: Token automatically expires after 7 days, re-login needed
- **No Token Provided**: Add Authorization header to request

### Survey Issues
- **Cannot Update Published Survey**: Close the survey first, or delete and recreate
- **Shareable Link Not Generated**: Publish the survey first
- **Response Not Saving**: Ensure survey is published and accepting responses

### Common Mistakes
1. Missing Authorization header on protected routes
2. Including "Bearer " prefix in token value (it's already in header)
3. Sending JSON without Content-Type header
4. Not URL-encoding shareable links if they contain special characters

---

**Last Updated:** February 9, 2024
**Version:** 1.0.0
**Status:** ✅ Production Ready

For issues or questions, check the server logs at `/api/health/detailed` or review error messages in API responses.
