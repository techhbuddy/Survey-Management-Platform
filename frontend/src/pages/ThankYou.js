import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ThankYou.css';

const ThankYou = () => {
  const navigate = useNavigate();

  return (
    <div className="thank-you-container">
      <div className="thank-you-card">
        <div className="thank-you-icon">✓</div>
        <h1>Thank You!</h1>
        <p className="thank-you-message">
          Your response has been successfully submitted.
        </p>
        <p className="thank-you-subtitle">
          We appreciate your feedback and will use it to improve our services.
        </p>

        <div className="action-buttons">
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
