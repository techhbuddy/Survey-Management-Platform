# Survey Management SaaS - MERN Stack

A full-stack web application for creating, managing, and analyzing surveys built with MongoDB, Express, React, and Node.js.

## Project Structure

```
survey-saas/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── constants.js
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── surveyController.js
│   │   │   └── responseController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── validation.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Survey.js
│   │   │   └── Response.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── surveys.js
│   │   │   └── responses.js
│   │   ├── utils/
│   │   │   ├── jwt.js
│   │   │   └── response.js
│   │   └── server.js
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── auth/
    │   │   │   └── ProtectedRoute.js
    │   │   ├── layouts/
    │   │   │   ├── Layout.js
    │   │   │   ├── Layout.css
    │   │   │   ├── Navbar.js
    │   │   │   └── Navbar.css
    │   │   └── shared/
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── hooks/
    │   │   └── useAuth.js
    │   ├── pages/
    │   │   ├── Home.js
    │   │   ├── Home.css
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── Dashboard.js
    │   │   ├── Dashboard.css
    │   │   └── Auth.css
    │   ├── services/
    │   │   ├── api.js
    │   │   ├── authService.js
    │   │   ├── surveyService.js
    │   │   └── responseService.js
    │   ├── styles/
    │   ├── utils/
    │   ├── App.js
    │   ├── App.css
    │   └── index.js
    ├── public/
    │   └── index.html
    ├── .env.example
    ├── .gitignore
    └── package.json
```

## Backend Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Navigate to the backend directory:
```bash
cd survey-saas/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/survey-saas
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

### Running the Backend

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The backend server will run on `http://localhost:5000`

## Frontend Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd survey-saas/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your API URL:
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Running the Frontend

Development mode:
```bash
npm start
```

The frontend will open in your browser at `http://localhost:3000`

Build for production:
```bash
npm run build
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile (Protected)
- `PUT /api/auth/profile` - Update user profile (Protected)

### Surveys
- `GET /api/surveys` - Get all surveys (Protected)
- `POST /api/surveys` - Create a new survey (Protected)
- `GET /api/surveys/:id` - Get survey by ID
- `PUT /api/surveys/:id` - Update survey (Protected)
- `DELETE /api/surveys/:id` - Delete survey (Protected)
- `PUT /api/surveys/:id/publish` - Publish survey (Protected)
- `PUT /api/surveys/:id/close` - Close survey (Protected)
- `POST /api/surveys/:id/questions` - Add question to survey (Protected)
- `GET /api/surveys/:id/analytics` - Get survey analytics (Protected)

### Responses
- `POST /api/responses` - Submit survey response
- `POST /api/responses/draft` - Save partial response
- `GET /api/responses` - Get responses for a survey (Protected)
- `GET /api/responses/:responseId` - Get single response (Protected)
- `GET /api/responses/:surveyId/analytics` - Get response analytics (Protected)
- `DELETE /api/responses/:responseId` - Delete response (Protected)

## Database Models

### User
- firstName
- lastName
- email (unique)
- password (hashed)
- role (admin/user)
- company
- phone
- avatar
- isActive
- lastLogin
- timestamps

### Survey
- title
- description
- createdBy (reference to User)
- status (draft/published/closed)
- questions (array of questions with types, options, etc.)
- settings (allowAnonymous, allowMultipleResponses, showProgressBar, etc.)
- responseCount
- tags
- timestamps

### Response
- survey (reference to Survey)
- respondent (reference to User, optional)
- answers (array of answers)
- metadata (userAgent, ipAddress, country, deviceType)
- timeSpent
- isCompleted
- progress
- timestamps

## Features

- User registration and authentication with JWT
- Survey creation with multiple question types (multiple choice, short/long text, rating, ranking)
- Survey management (draft, publish, close)
- Survey responses collection
- Response analytics
- User profile management
- Responsive design
- Real-time validation

## Question Types Supported

1. **Multiple Choice** - Single or multiple selection
2. **Short Text** - Text input with character limit
3. **Long Text** - Multi-line text input
4. **Rating** - Scale-based rating (1-5 or 1-10)
5. **Ranking** - Rank options in order

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected routes
- Request validation with express-validator
- CORS configuration
- SQL injection prevention (using Mongoose)

## Future Enhancements

- Email notifications
- Survey templates
- Conditional logic for questions
- Advanced analytics and reporting
- Team collaboration features
- Survey sharing and permissions
- Data export functionality
- Theme customization
- Two-factor authentication
- API rate limiting

## Testing

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm test
```

## Deployment

### Backend Deployment (Heroku/Railway/Render)
1. Ensure environment variables are set in the deployment platform
2. Connect your Git repository
3. Deploy with automatic builds

### Frontend Deployment (Vercel/Netlify)
1. Build the application: `npm run build`
2. Deploy the `build` folder to your hosting platform
3. Update the `REACT_APP_API_URL` environment variable to your production API

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Support

For support, email support@surveyapp.com or open an issue in the repository.
