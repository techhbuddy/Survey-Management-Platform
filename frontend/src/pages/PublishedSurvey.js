import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import './Published.css';
import QRCodeModal from '../components/shared/QRCodeModal';
import apiClient from '../services/api';

const PublishedSurvey = () => {
  const navigate = useNavigate();
  const { shareableLink } = useParams();
  const [copied, setCopied] = useState(false);

  // Base URL for public survey links:
  // - In development: falls back to current origin (e.g. http://localhost:3000)
  // - In production: set REACT_APP_PUBLIC_URL to your deployed frontend URL
  const publicBaseUrl =
    process.env.REACT_APP_PUBLIC_URL && process.env.REACT_APP_PUBLIC_URL.trim() !== ''
      ? process.env.REACT_APP_PUBLIC_URL.replace(/\/+$/, '')
      : window.location.origin;

  const surveyUrl = `${publicBaseUrl}/survey/${shareableLink}`;

  const [showQr, setShowQr] = useState(false);
  const [surveyTitle, setSurveyTitle] = useState('');

  useEffect(() => {
    const fetchPublic = async () => {
      if (!shareableLink) return;
      try {
        const resp = await apiClient.get(`/public/survey/${encodeURIComponent(shareableLink)}`);
        const data = resp.data?.data || resp.data;
        setSurveyTitle(data?.title || 'Survey');
      } catch (e) {
        // ignore; title is optional
      }
    };
    fetchPublic();
  }, [shareableLink]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(surveyUrl);
    toast.success('Link copied to clipboard!');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareableLink);
    toast.success('Share link copied to clipboard!');
  };

  return (
    <div className="published-survey-container">
      <div className="success-card">
        <div className="success-icon">✓</div>
        <h1>Survey Published Successfully!</h1>
        <p>Your survey is now live and ready to collect responses</p>

        {!shareableLink ? (
          <div style={{ color: 'red', padding: '20px', marginTop: '20px', background: '#ffe0e0', borderRadius: '8px' }}>
            <p>Error: Survey link not found. Please go back to dashboard and try publishing again.</p>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ marginTop: '10px' }}>
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="share-section">
              <h2>Share Your Survey</h2>

              <div className="share-link-box">
                <label>Survey URL</label>
                <div className="link-display">
                  <input type="text" value={surveyUrl} readOnly />
                  <div style={{display:'flex',gap:8}}>
                    <button
                      onClick={handleCopyLink}
                      className="btn btn-primary"
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={() => setShowQr(true)}
                      className="btn btn-outline"
                    >
                      Show QR Code
                    </button>
                  </div>
                </div>
                <p className="hint">Click above to copy the link</p>
              </div>

            <div className="share-methods">
              <h3>Share Via</h3>
              <div className="share-buttons">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Complete my survey: ${surveyUrl}`)}`}
                  className="btn btn-secondary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  💬 WhatsApp
                </a>
                <a
                  href={`mailto:?subject=Complete%20this%20survey&body=${encodeURIComponent(surveyUrl)}`}
                  className="btn btn-secondary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📧 Email
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Complete my survey: ${surveyUrl}`)}`}
                  className="btn btn-secondary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🐦 Twitter
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(surveyUrl)}`}
                  className="btn btn-secondary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  f Facebook
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(surveyUrl)}`}
                  className="btn btn-secondary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  in LinkedIn
                </a>
              </div>
            </div>

            <div className="shareable-link-box">
              <label>Shareable Link ID</label>
              <div className="link-display">
                <input type="text" value={shareableLink} readOnly />
                <button
                  onClick={handleCopyShareLink}
                  className="btn btn-outline"
                >
                  Copy Code
                </button>
              </div>
            </div>
          </div>
          </>
        )}

        {shareableLink && (
          <div className="next-steps">
            <h3>What's Next?</h3>
            <ul>
              <li>Share the survey link with your audience</li>
              <li>Monitor responses on your dashboard</li>
              <li>View detailed analytics and insights</li>
              <li>Close the survey when done collecting responses</li>
            </ul>
          </div>
        )}

        <div className="action-buttons">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
        {showQr && (
          <QRCodeModal
            shareableLink={shareableLink}
            surveyTitle={surveyTitle}
            onClose={() => setShowQr(false)}
          />
        )}
      </div>
    </div>
  );
};

export default PublishedSurvey;
