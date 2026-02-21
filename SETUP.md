# MERN Stack Setup Guide for Survey Management SaaS

## Quick Start Guide

### Prerequisites Installation

#### 1. Install Node.js
- Download from https://nodejs.org/
- Install the LTS version (v18 or higher recommended)
- Verify installation: `node --version` and `npm --version`

#### 2. Install MongoDB

**Option A: Local Installation**
- Download from https://www.mongodb.com/try/download/community
- Follow the installation instructions for your OS
- Start MongoDB service

**Option B: Cloud (MongoDB Atlas)**
- Create account at https://www.mongodb.com/cloud/atlas
- Create a free cluster
- Get connection string

### Backend Setup

1. **Install dependencies**
   ```bash
   cd survey-saas/backend
   npm install
   ```

2. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update values with your settings:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: Any random string (e.g., use `openssl rand -base64 32`)
     - `PORT`: Server port (default: 5000)
     - `FRONTEND_URL`: Frontend URL (default: http://localhost:3000)

3. **Start the server**
   ```bash
   npm run dev
   ```

   Expected output:
   ```
   Server running on port 5000
   MongoDB connected successfully
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd survey-saas/frontend
   npm install
   ```

2. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update `REACT_APP_API_URL` to match your backend URL

3. **Start the development server**
   ```bash
   npm start
   ```

   The application will open at `http://localhost:3000`

## Testing the Application

### 1. User Registration
- Navigate to `http://localhost:3000/register`
- Fill in the registration form
- Click Register
- You'll be redirected to the dashboard

### 2. Create a Survey
- Click "Create Survey" button
- Fill in survey title and description
- Add questions of different types
- Save as draft

### 3. Publish Survey
- Go to Dashboard
- Click "Edit" on your survey
- Click "Publish" button
- Survey is now available for responses

### 4. View Responses
- Click "View Responses" on any survey
- See analytics and individual responses

## Project Structure Explanation

### Backend Folder Structure

```
src/
├── config/
│   ├── database.js       # MongoDB connection setup
│   └── constants.js      # App-wide constants
│
├── controllers/
│   ├── authController.js      # Auth logic (register, login, etc.)
│   ├── surveyController.js    # Survey CRUD operations
│   └── responseController.js  # Response handling
│
├── middleware/
│   ├── auth.js           # JWT verification
│   └── validation.js     # Input validation
│
├── models/
│   ├── User.js           # User schema
│   ├── Survey.js         # Survey schema
│   └── Response.js       # Response schema
│
├── routes/
│   ├── auth.js           # Auth endpoints
│   ├── surveys.js        # Survey endpoints
│   └── responses.js      # Response endpoints
│
├── utils/
│   ├── jwt.js            # JWT operations
│   └── response.js       # Response formatting
│
└── server.js             # Express app setup
```

### Frontend Folder Structure

```
src/
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.js    # Protected route wrapper
│   ├── layouts/
│   │   ├── Layout.js            # Main layout wrapper
│   │   └── Navbar.js            # Navigation component
│   └── shared/                  # Reusable components
│
├── context/
│   └── AuthContext.js           # Auth state management
│
├── hooks/
│   └── useAuth.js               # Custom auth hook
│
├── pages/
│   ├── Home.js                  # Landing page
│   ├── Login.js                 # Login page
│   ├── Register.js              # Registration page
│   └── Dashboard.js             # Main dashboard
│
├── services/
│   ├── api.js                   # Axios configuration
│   ├── authService.js           # Auth API calls
│   ├── surveyService.js         # Survey API calls
│   └── responseService.js       # Response API calls
│
├── styles/
│   └── (CSS files)
│
└── App.js                       # Main app component
```

## Common Commands

### Backend
```bash
# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Run tests
npm test

# Watch tests
npm test:watch
```

### Frontend
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject configuration (⚠️ Irreversible)
npm eject
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running locally or Atlas cluster is active
- Check connection string in `.env` file
- Verify network access if using MongoDB Atlas

### Port Already in Use
- Backend: Change `PORT` in `.env` file
- Frontend: React will prompt to use a different port

### CORS Errors
- Ensure `FRONTEND_URL` in `.env` matches your frontend URL
- Check CORS middleware in `server.js`

### Module Not Found
- Run `npm install` again
- Delete `node_modules` folder and `.package-lock.json`, then reinstall

### Hot Reload Not Working
- Backend: Ensure `nodemon` is installed (`npm install -D nodemon`)
- Frontend: Check that `npm start` is running with proper Webpack configuration

## Security Checklist

- [ ] Change `JWT_SECRET` in production
- [ ] Use strong passwords in `.env` files
- [ ] Enable HTTPS in production
- [ ] Set secure CORS origins
- [ ] Use environment variables for sensitive data
- [ ] Implement rate limiting
- [ ] Add API request validation
- [ ] Use secure MongoDB connection strings
- [ ] Keep dependencies updated

## Performance Tips

1. **Database Indexing**
   - Add indexes on frequently queried fields in MongoDB

2. **Pagination**
   - Implement limit/skip for large datasets

3. **Caching**
   - Cache survey responses with Redis
   - Cache user profiles

4. **Frontend Optimization**
   - Use React.memo for expensive components
   - Implement code splitting for routes
   - Optimize images

5. **API Optimization**
   - Use field projection in MongoDB queries
   - Implement GraphQL for flexible queries
   - Use compression middleware

## Next Steps

1. **Implement Survey Templates**
   - Create pre-made survey templates
   - Allow users to clone templates

2. **Add Advanced Analytics**
   - Create data visualization charts
   - Generate PDF reports

3. **Implement Team Features**
   - Add team management
   - Set role-based permissions

4. **Add Email Notifications**
   - Send survey links via email
   - Notify of new responses

5. **Mobile App**
   - Create React Native mobile app
   - Use same backend APIs

## Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [JWT Authentication](https://jwt.io/)

## Support & Contact

For issues or questions:
1. Check the main README.md
2. Review error logs in console
3. Check GitHub issues
4. Contact development team

---

Happy Surveying! 🎉
