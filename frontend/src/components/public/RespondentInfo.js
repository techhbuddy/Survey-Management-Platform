import React, { useState } from 'react';
import './../../pages/Auth.css';

// Clean email regex (eslint-safe)
const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;

const RespondentInfo = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!name || name.trim().length < 2) {
      setError('Please provide your name (at least 2 characters)');
      return;
    }

    if (!email || !emailRegex.test(email)) {
      setError('Please provide a valid email');
      return;
    }

    onSubmit({
      name: name.trim(),
      email: email.trim().toLowerCase(),
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-form" style={{ maxWidth: 560 }}>
        <h2>Respondent Details</h2>
        <p>Please provide your name and email before continuing to the survey.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="resp-name">Name</label>
            <input
              id="resp-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="resp-email">Email</label>
            <input
              id="resp-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{ color: 'crimson', marginBottom: 12 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary">
            Continue to Survey
          </button>
        </form>
      </div>
    </div>
  );
};

export default RespondentInfo;