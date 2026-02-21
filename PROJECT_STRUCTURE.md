# Project Structure Overview

This document provides a complete overview of the Survey Management SaaS MERN project structure.

## Directory Tree

```
survey-saas/
│
├── README.md                    # Main project documentation
├── SETUP.md                     # Detailed setup and installation guide
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── constants.js              # App constants (roles, statuses, question types)
│   │   │   └── database.js               # MongoDB connection configuration
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js         # Authentication logic
│   │   │   │   ├── register()
│   │   │   │   ├── login()
│   │   │   │   ├── getProfile()
│   │   │   │   └── updateProfile()
│   │   │   │
│   │   │   ├── surveyController.js       # Survey operations
│   │   │   │   ├── createSurvey()
│   │   │   │   ├── getSurveys()
│   │   │   │   ├── getSurveyById()
│   │   │   │   ├── updateSurvey()
│   │   │   │   ├── publishSurvey()
│   │   │   │   ├── closeSurvey()
│   │   │   │   ├── deleteSurvey()
│   │   │   │   ├── addQuestion()
│   │   │   │   └── getAnalytics()
│   │   │   │
│   │   │   └── responseController.js     # Response handling
│   │   │       ├── submitResponse()
│   │   │       ├── savePartialResponse()
│   │   │       ├── getResponses()
│   │   │       ├── getResponseById()
│   │   │       ├── getResponseAnalytics()
│   │   │       └── deleteResponse()
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js                   # JWT verification middleware
│   │   │   │   └── authMiddleware()
│   │   │   │
│   │   │   └── validation.js             # Input validation middleware
│   │   │       └── validationErrorHandler()
│   │   │
│   │   ├── models/
│   │   │   ├── User.js                   # User schema
│   │   │   │   ├── firstName
│   │   │   │   ├── lastName
│   │   │   │   ├── email
│   │   │   │   ├── password
│   │   │   │   ├── role
│   │   │   │   ├── comparePassword()
│   │   │   │   └── pre-save password hashing
│   │   │   │
│   │   │   ├── Survey.js                 # Survey schema
│   │   │   │   ├── title
│   │   │   │   ├── description
│   │   │   │   ├── questions (array)
│   │   │   │   ├── settings
│   │   │   │   ├── status
│   │   │   │   ├── responseCount
│   │   │   │   └── timestamps
│   │   │   │
│   │   │   └── Response.js               # Response schema
│   │   │       ├── survey (reference)
│   │   │       ├── respondent (reference)
│   │   │       ├── answers (array)
│   │   │       ├── metadata
│   │   │       ├── timeSpent
│   │   │       └── timestamps
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.js                   # Authentication endpoints
│   │   │   │   ├── POST /register
│   │   │   │   ├── POST /login
│   │   │   │   ├── GET /profile
│   │   │   │   └── PUT /profile
│   │   │   │
│   │   │   ├── surveys.js                # Survey endpoints
│   │   │   │   ├── POST /
│   │   │   │   ├── GET /
│   │   │   │   ├── GET /:id
│   │   │   │   ├── PUT /:id
│   │   │   │   ├── DELETE /:id
│   │   │   │   ├── PUT /:id/publish
│   │   │   │   ├── PUT /:id/close
│   │   │   │   ├── POST /:id/questions
│   │   │   │   └── GET /:id/analytics
│   │   │   │
│   │   │   └── responses.js              # Response endpoints
│   │   │       ├── POST /
│   │   │       ├── POST /draft
│   │   │       ├── GET /
│   │   │       ├── GET /:responseId
│   │   │       ├── GET /:surveyId/analytics
│   │   │       └── DELETE /:responseId
│   │   │
│   │   ├── utils/
│   │   │   ├── jwt.js                    # JWT token utilities
│   │   │   │   ├── generateToken()
│   │   │   │   └── verifyToken()
│   │   │   │
│   │   │   └── response.js               # Response formatting utilities
│   │   │       ├── sendSuccess()
│   │   │       └── sendError()
│   │   │
│   │   └── server.js                     # Express app entry point
│   │       ├── Middleware setup
│   │       ├── Route imports
│   │       ├── Error handling
│   │       └── Server startup
│   │
│   ├── public/                           # Static files
│   ├── .env.example                      # Environment variables template
│   ├── .gitignore                        # Git ignore rules
│   └── package.json                      # Dependencies and scripts
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── auth/
    │   │   │   └── ProtectedRoute.js      # Route protection component
    │   │   │       └── Route guard for authenticated users
    │   │   │
    │   │   ├── layouts/
    │   │   │   ├── Layout.js              # Main layout wrapper
    │   │   │   ├── Layout.css             # Layout styles
    │   │   │   ├── Navbar.js              # Navigation component
    │   │   │   └── Navbar.css             # Navbar styles
    │   │   │
    │   │   └── shared/                    # Reusable components
    │   │       └── (To be extended)
    │   │
    │   ├── context/
    │   │   └── AuthContext.js             # Global auth state
    │   │       ├── AuthProvider
    │   │       └── useAuth hook provider
    │   │
    │   ├── hooks/
    │   │   └── useAuth.js                 # Custom auth hook
    │   │       └── Returns: user, login, logout, etc.
    │   │
    │   ├── pages/
    │   │   ├── Home.js                    # Landing page
    │   │   ├── Home.css                   # Home styles
    │   │   ├── Login.js                   # Login page
    │   │   ├── Register.js                # Registration page
    │   │   ├── Auth.css                   # Auth pages styles
    │   │   ├── Dashboard.js               # Main dashboard
    │   │   └── Dashboard.css              # Dashboard styles
    │   │
    │   ├── services/
    │   │   ├── api.js                     # Axios instance with interceptors
    │   │   │   ├── Base URL configuration
    │   │   │   ├── Token injection
    │   │   │   └── Error handling
    │   │   │
    │   │   ├── authService.js             # Auth API calls
    │   │   │   ├── register()
    │   │   │   ├── login()
    │   │   │   ├── getProfile()
    │   │   │   └── updateProfile()
    │   │   │
    │   │   ├── surveyService.js           # Survey API calls
    │   │   │   ├── createSurvey()
    │   │   │   ├── getSurveys()
    │   │   │   ├── updateSurvey()
    │   │   │   └── more...
    │   │   │
    │   │   └── responseService.js         # Response API calls
    │   │       ├── submitResponse()
    │   │       ├── getResponses()
    │   │       └── more...
    │   │
    │   ├── styles/                        # Global styles
    │   │   └── (To be extended)
    │   │
    │   ├── utils/                         # Utility functions
    │   │   └── (To be extended)
    │   │
    │   ├── App.js                         # Main app component
    │   │   ├── Routes setup
    │   │   ├── Protected routes
    │   │   └── Toast notification setup
    │   │
    │   ├── App.css                        # Global app styles
    │   └── index.js                       # React entry point
    │
    ├── public/
    │   └── index.html                     # HTML template
    │
    ├── .env.example                       # Environment variables template
    ├── .gitignore                         # Git ignore rules
    └── package.json                       # Dependencies and scripts

```

## Key Files Description

### Backend

| File | Purpose |
|------|---------|
| `server.js` | Express application setup and server initialization |
| `config/database.js` | MongoDB connection setup |
| `config/constants.js` | Application-wide constants |
| `controllers/authController.js` | User authentication and profile management |
| `controllers/surveyController.js` | Survey CRUD operations |
| `controllers/responseController.js` | Survey response handling |
| `middleware/auth.js` | JWT verification middleware |
| `middleware/validation.js` | Input validation middleware |
| `models/User.js` | User data schema |
| `models/Survey.js` | Survey data schema |
| `models/Response.js` | Survey response schema |
| `utils/jwt.js` | JWT token generation and verification |
| `utils/response.js` | Standardized API response formatting |

### Frontend

| File | Purpose |
|------|---------|
| `App.js` | Main application component with routing |
| `index.js` | React application entry point |
| `context/AuthContext.js` | Global authentication state management |
| `hooks/useAuth.js` | Custom hook for accessing auth context |
| `services/api.js` | Axios instance with interceptors |
| `services/authService.js` | Authentication API calls |
| `services/surveyService.js` | Survey-related API calls |
| `services/responseService.js` | Response-related API calls |
| `components/auth/ProtectedRoute.js` | Route protection component |
| `components/layouts/Layout.js` | Main layout wrapper |
| `components/layouts/Navbar.js` | Navigation component |
| `pages/Home.js` | Landing page |
| `pages/Login.js` | User login page |
| `pages/Register.js` | User registration page |
| `pages/Dashboard.js` | Main dashboard page |

## API Route Map

### Authentication Routes
```
/api/auth
├── POST /register          - Create new user
├── POST /login             - User login
├── GET /profile            - Get current profile (Protected)
└── PUT /profile            - Update profile (Protected)
```

### Survey Routes
```
/api/surveys
├── GET /                   - List surveys (Protected)
├── POST /                  - Create survey (Protected)
├── GET /:id                - Get single survey
├── PUT /:id                - Update survey (Protected)
├── DELETE /:id             - Delete survey (Protected)
├── PUT /:id/publish        - Publish survey (Protected)
├── PUT /:id/close          - Close survey (Protected)
├── POST /:id/questions     - Add question (Protected)
└── GET /:id/analytics      - Get analytics (Protected)
```

### Response Routes
```
/api/responses
├── POST /                  - Submit response
├── POST /draft             - Save draft response
├── GET /                   - List responses (Protected)
├── GET /:responseId        - Get single response (Protected)
├── GET /:surveyId/analytics - Get analytics (Protected)
└── DELETE /:responseId     - Delete response (Protected)
```

## Data Flow

### Authentication Flow
1. User fills registration form
2. Frontend sends POST to `/api/auth/register`
3. Backend validates and hashes password
4. JWT token is generated and sent back
5. Frontend stores token in localStorage
6. Token is sent with every subsequent request

### Survey Creation Flow
1. Authenticated user creates survey on frontend
2. Frontend sends POST to `/api/surveys`
3. Backend saves survey to MongoDB
4. Frontend receives survey details
5. User can add questions and publish

### Response Submission Flow
1. Respondent accesses survey (public or with token)
2. Frontend collects responses in form
3. Frontend sends POST to `/api/responses`
4. Backend validates and saves responses
5. Backend increments response count on survey
6. Confirmation sent to respondent

## Environment Variables

### Backend (.env)
- `PORT` - Server port
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRE` - Token expiration time
- `FRONTEND_URL` - Frontend URL for CORS

### Frontend (.env)
- `REACT_APP_API_URL` - Backend API URL

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Authentication**: JWT
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **CORS**: cors

### Frontend
- **Framework**: React
- **Router**: React Router v6
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Styling**: CSS3

## File Statistics

- **Total Backend Files**: 16
- **Total Frontend Files**: 23
- **Total Configuration Files**: 6
- **Total Documentation Files**: 3

---

This structure provides a clean, scalable, and maintainable foundation for building a Survey Management SaaS application.
