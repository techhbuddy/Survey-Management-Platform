import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      <section className="hero">
        <h1>Welcome to SurveyFlow</h1>
        <p>Create, publish, and analyze surveys with ease</p>
        {isAuthenticated ? (
          <Link to="/dashboard" className="cta-button">
            Go to Dashboard
          </Link>
        ) : (
          <div className="hero-buttons">
            <Link to="/register" className="cta-button primary">
              Get Started
            </Link>
            <Link to="/login" className="cta-button">
              Login
            </Link>
          </div>
        )}
      </section>

      <section className="features">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Easy Survey Creation</h3>
            <p>Create surveys with various question types in minutes</p>
          </div>
          <div className="feature-card">
            <h3>Instant Analytics</h3>
            <p>Get real-time insights and detailed analytics</p>
          </div>
          <div className="feature-card">
            <h3>Secure Responses</h3>
            <p>Protect your survey data with enterprise security</p>
          </div>
          <div className="feature-card">
            <h3>Share & Collaborate</h3>
            <p>Share surveys and collaborate with team members</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
