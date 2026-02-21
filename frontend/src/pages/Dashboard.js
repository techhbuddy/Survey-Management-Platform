import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import surveyService from '../services/surveyService';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const response = await surveyService.getSurveys({ limit: 10 });
      setSurveys(response.data.data.surveys);
    } catch (error) {
      toast.error('Failed to load surveys');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this survey?')) {
      try {
        await surveyService.deleteSurvey(id);
        toast.success('Survey deleted successfully');
        setSurveys(surveys.filter((s) => s._id !== id));
      } catch (error) {
        toast.error('Failed to delete survey');
      }
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user?.name}!</h1>
          <p>Manage your surveys and view responses</p>
        </div>
        <Link to="/surveys/create" className="btn btn-primary">
          + Create Survey
        </Link>
      </div>

      {loading ? (
        <p>Loading surveys...</p>
      ) : surveys.length === 0 ? (
        <div className="empty-state">
          <h3>No surveys yet</h3>
          <p>Create your first survey to get started</p>
          <Link to="/surveys/create" className="btn btn-primary">
            Create Survey
          </Link>
        </div>
      ) : (
        <div className="surveys-grid">
          {surveys.map((survey) => (
            <div key={survey._id} className="survey-card">
              <h3>
                {survey.status === 'published' && survey.shareableLink ? (
                  <Link to={`/published/${survey.shareableLink}`}>
                    {survey.title}
                  </Link>
                ) : (
                  survey.title
                )}
              </h3>
              <p className="survey-description">{survey.description}</p>
              <div className="survey-meta">
                <span className={`status status-${survey.status}`}>
                  {survey.status}
                </span>
                <span className="response-count">
                  {survey.responseCount} responses
                </span>
              </div>
              <div className="survey-actions">
                {survey.status === 'draft' && (
                  <Link to={`/surveys/${survey._id}`} className="btn btn-secondary">
                    Edit
                  </Link>
                )}
                <Link to={`/surveys/${survey._id}/responses`} className="btn btn-secondary">
                  View Responses
                </Link>
                <button
                  onClick={() => handleDelete(survey._id)}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
