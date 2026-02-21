import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import responseService from '../services/responseService';
import surveyService from '../services/surveyService';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import './Responses.css';

const Responses = () => {
  const navigate = useNavigate();
  const { id: surveyId } = useParams(); // route is /surveys/:id/responses
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  const fetchSurveyAndResponses = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch survey
      const surveyRes = await surveyService.getSurveyById(surveyId);
      setSurvey(surveyRes.data.data);

      // Fetch responses
      const responsesRes = await responseService.getResponses({
        surveyId,
        skip,
        limit,
      });
      setResponses(responsesRes.data.data.responses);
      setTotal(responsesRes.data.data.total);
    } catch (error) {
      toast.error('Failed to load responses');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [surveyId, skip, limit, navigate]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const analyticsRes = await surveyService.getAnalytics(surveyId);
      setAnalytics(analyticsRes.data.data);
    } catch (error) {
      console.error('Failed to load analytics', error);
    }
  }, [surveyId]);

  const fetchStoredAnalysis = useCallback(async () => {
    if (!surveyId) return;
    try {
      setAnalysisLoading(true);
      setAnalysisError(null);
      const res = await surveyService.getAnalysis(surveyId);
      if (res.data.data && res.data.data.analysis) {
        setAiAnalysis(res.data.data.analysis);
      }
    } catch (err) {
      setAnalysisError(err.response?.data?.message || 'Failed to load analysis');
    } finally {
      setAnalysisLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    fetchSurveyAndResponses();
    fetchAnalytics();
  }, [fetchSurveyAndResponses, fetchAnalytics]);

  useEffect(() => {
    if (surveyId && !loading) fetchStoredAnalysis();
  }, [surveyId, loading, fetchStoredAnalysis]);

  const handleDeleteResponse = async (responseId) => {
    if (window.confirm('Are you sure you want to delete this response?')) {
      try {
        await responseService.deleteResponse(responseId);
        toast.success('Response deleted successfully');
        setResponses(responses.filter(r => r._id !== responseId));
        setTotal(total - 1);
      } catch (error) {
        toast.error('Failed to delete response');
      }
    }
  };

  const handleAnalyzeWithAI = async () => {
    if (!surveyId) return;
    try {
      setAnalyzing(true);
      setAnalysisError(null);
      const res = await surveyService.analyzeSurvey(surveyId);
      if (res.data.data && res.data.data.analysis) {
        setAiAnalysis(res.data.data.analysis);
        toast.success('Analysis completed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Analysis failed';
      setAnalysisError(msg);
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExportResponses = () => {
    // Create CSV data
    const headers = ['Timestamp', 'Name', 'Email', ...survey.questions.map(q => q.text)];
    const csvRows = [headers.join(',')];

    responses.forEach(response => {
      const row = [
        new Date(response.createdAt).toLocaleString(),
        response.respondentName || '',
        response.respondentEmail || '',
        ...survey.questions.map(question => {
          const answer = response.answers.find(a => String(a.questionId) === String(question._id));
          return answer ? `"${answer.answer}"` : '';
        }),
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${survey.title}-responses.csv`;
    a.click();
    toast.success('Responses exported successfully');
  };

  if (loading) {
    return <div className="responses-container"><p>Loading responses...</p></div>;
  }

  if (!survey) {
    return <div className="responses-container"><p>Survey not found</p></div>;
  }

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(skip / limit) + 1;

  return (
    <div className="responses-container">
      <div className="responses-header">
        <div>
          <h1>{survey.title}</h1>
          <p>View and manage survey responses</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-outline"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* KPI Analytics Section */}
      {analytics && (
        <div className="analytics-section">
          <h2>Analytics</h2>
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-value">{analytics.totals?.totalResponses ?? 0}</div>
              <div className="analytics-label">Total Responses</div>
            </div>
            <div className="analytics-card">
              <div className="analytics-value">{analytics.totals?.completedResponses ?? 0}</div>
              <div className="analytics-label">Completed</div>
            </div>
            <div className="analytics-card">
              <div className="analytics-value">{analytics.totals?.partialResponses ?? 0}</div>
              <div className="analytics-label">Partial</div>
            </div>
            <div className="analytics-card">
              <div className="analytics-value">
                {Math.round(Number(analytics.totals?.averageCompletionTimeSeconds) || 0)}s
              </div>
              <div className="analytics-label">Avg Completion Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Funnel Chart */}
      {analytics?.funnel && analytics.funnel.length > 0 && (
        <div className="analytics-section">
          <h2>Response Funnel</h2>
          <p className="analysis-hint">
            Shows how many respondents reached each question.
          </p>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart
                data={analytics.funnel.map((f) => ({
                  name: `Q${f.order + 1}`,
                  reached: f.reached,
                }))}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="reached" fill="#007bff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Question-wise Charts */}
      {analytics?.questions && analytics.questions.length > 0 && (
        <div className="analytics-section">
          <h2>Question Insights</h2>
          {analytics.questions.map((q) => (
            <div key={q.questionId} className="question-analytics-card">
              <h3>
                Q{q.order + 1}. {q.questionText}
              </h3>
              <p className="question-meta">
                Type: {q.type} · Answers: {q.totalAnswers}
              </p>

              {q.kind === 'choice' && q.options && q.options.length > 0 && (
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={q.options.map((opt) => ({
                        name: opt.label,
                        count: opt.count,
                      }))}
                      margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#28a745" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {q.kind === 'rating' && q.distribution && q.distribution.length > 0 && (
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={q.distribution.map((d) => ({
                        name: String(d.value),
                        count: d.count,
                      }))}
                      margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ffc107" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {q.kind === 'text' && (
                <p className="text-question-stat">
                  Text responses collected: <strong>{q.textCount}</strong>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AI Analysis Section */}
      <div className="analysis-section">
        <h2>AI Analysis</h2>
        <p className="analysis-hint">Uses text responses (short/long text) to generate a summary, sentiment, and insights.</p>
        <div className="action-buttons">
          <button
            onClick={handleAnalyzeWithAI}
            disabled={analyzing || responses.length === 0}
            className="btn btn-primary"
          >
            {analyzing ? 'Analyzing…' : '✨ Analyze with AI'}
          </button>
        </div>
        {analysisLoading && !aiAnalysis && !analysisError && <p className="analysis-loading">Loading saved analysis…</p>}
        {analysisError && (
          <div className="analysis-error">
            <p>{analysisError}</p>
          </div>
        )}
        {aiAnalysis && (
          <div className="analysis-result">
            <div className="analysis-summary">
              <h3>Summary</h3>
              <p>{aiAnalysis.summary}</p>
            </div>
            <div className="analysis-sentiment">
              <h3>Sentiment</h3>
              <span className={`sentiment-badge sentiment-${(aiAnalysis.sentiment || '').toLowerCase()}`}>
                {aiAnalysis.sentiment || '—'}
              </span>
            </div>
            {aiAnalysis.insights && aiAnalysis.insights.length > 0 && (
              <div className="analysis-insights">
                <h3>Actionable insights</h3>
                <ul>
                  {aiAnalysis.insights.map((insight, i) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiAnalysis.analyzedAt && (
              <p className="analysis-meta">Analyzed {new Date(aiAnalysis.analyzedAt).toLocaleString()}</p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          onClick={handleExportResponses}
          disabled={responses.length === 0}
          className="btn btn-secondary"
        >
          📥 Export to CSV
        </button>
      </div>

      {/* Responses List */}
      {responses.length === 0 ? (
        <div className="empty-state">
          <h3>No responses yet</h3>
          <p>Share your survey to start collecting responses</p>
        </div>
      ) : (
        <div className="responses-list">
          {responses.map((response, index) => (
            <div key={response._id} className="response-card">
              <div className="response-header">
                <div>
                    <h3>Response {skip + index + 1}</h3>
                    <p className="response-meta">
                      {response.respondentName ? (
                        <>
                          <strong>{response.respondentName}</strong> · {response.respondentEmail}
                          <br />
                        </>
                      ) : null}
                      {new Date(response.createdAt).toLocaleString()}
                    </p>
                </div>
                <div className="response-actions">
                  <button
                    onClick={() => setSelectedResponse(selectedResponse === response._id ? null : response._id)}
                    className="btn btn-secondary btn-sm"
                  >
                    {selectedResponse === response._id ? '▼ Hide' : '▶ View Details'}
                  </button>
                  <button
                    onClick={() => handleDeleteResponse(response._id)}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Expanded Response Details */}
              {selectedResponse === response._id && (
                <div className="response-details">
                  {response.answers.map((answer, answerIndex) => (
                    <div key={answerIndex} className="answer-item">
                      <h4>{answer.questionText}</h4>
                      <div className="answer-type">({answer.questionType})</div>
                      <div className="answer-value">
                        {Array.isArray(answer.answer)
                          ? answer.answer.join(', ')
                          : String(answer.answer)}
                      </div>
                      {answer.timeSpent && (
                        <p className="time-spent">Time spent: {answer.timeSpent}s</p>
                      )}
                    </div>
                  ))}

                  {response.metadata && (
                    <div className="response-metadata">
                      <h4>Device Information</h4>
                      <div className="metadata-grid">
                        <div>
                          <span className="label">Device Type:</span>
                          <span>{response.metadata.deviceType || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="label">Country:</span>
                          <span>{response.metadata.country || 'Unknown'}</span>
                        </div>
                        {response.metadata.ipAddress && (
                          <div>
                            <span className="label">IP Address:</span>
                            <span>{response.metadata.ipAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setSkip(Math.max(0, skip - limit))}
            disabled={skip === 0}
            className="btn btn-outline btn-sm"
          >
            ← Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setSkip(skip + limit)}
            disabled={currentPage === totalPages}
            className="btn btn-outline btn-sm"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default Responses;
