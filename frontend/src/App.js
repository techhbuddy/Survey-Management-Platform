import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layouts/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateSurvey from './pages/CreateSurvey';
import EditSurvey from './pages/EditSurvey';
import PublicSurvey from './pages/PublicSurvey';
import PublishedSurvey from './pages/PublishedSurvey';
import Responses from './pages/Responses';
import ThankYou from './pages/ThankYou';
import GoogleCallback from './pages/GoogleCallback';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/surveys/create"
              element={
                <ProtectedRoute>
                  <CreateSurvey />
                </ProtectedRoute>
              }
            />
            <Route
              path="/surveys/:id"
              element={
                <ProtectedRoute>
                  <EditSurvey />
                </ProtectedRoute>
              }
            />
            <Route
              path="/surveys/:id/responses"
              element={
                <ProtectedRoute>
                  <Responses />
                </ProtectedRoute>
              }
            />
            <Route path="/survey/:shareableLink" element={<PublicSurvey />} />
            <Route path="/published/:shareableLink" element={<PublishedSurvey />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
          </Routes>
        </Layout>
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;
