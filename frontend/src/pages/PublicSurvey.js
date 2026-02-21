import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import publicService from '../services/publicService';
import toast from 'react-hot-toast';
import './PublicSurvey.css';
import RespondentInfo from '../components/public/RespondentInfo';

// Normalize question ID to string so object keys and lookups are consistent (MongoDB _id can be object or string in JSON)
const toIdStr = (id) => {
  if (id == null) return '';
  if (typeof id === 'string') return id;
  if (id.toString && typeof id.toString === 'function') return id.toString();
  return String(id);
};

// Option value for MCQ: use value if non-empty, else text (so radios are selectable when value is blank)
const getOptionValue = (option) => {
  const v = option.value;
  if (v != null && v !== '') return String(v);
  return option.text != null && option.text !== '' ? String(option.text) : '';
};

const PublicSurvey = () => {
  const { shareableLink } = useParams();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [respondent, setRespondent] = useState(null);

  const fetchSurvey = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching survey with shareable link:', shareableLink);
      const response = await publicService.getSurveyByLink(shareableLink);
      console.log('Full API response:', response);

      // Validate response structure
      if (!response.data) {
        console.error('No data in response:', response);
        toast.error('Invalid response from server');
        return;
      }

      const surveyData = response.data.data;
      console.log('Survey data:', surveyData);

      // Verify survey data exists
      if (!surveyData) {
        console.error('No survey data in response');
        toast.error('Survey not found or has expired');
        return;
      }

      // Verify survey has questions
      if (!surveyData.questions || surveyData.questions.length === 0) {
        console.error('Survey has no questions');
        toast.error('Survey has no questions');
        return;
      }

      setSurvey(surveyData);
      console.log('Survey loaded successfully');
    } catch (error) {
      console.error('Error fetching survey:', error);
      console.error('Error response status:', error.response?.status);
      console.error('Error response data:', error.response?.data);
      const errorMsg = error.response?.data?.message || 'Survey not found or has expired';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [shareableLink]);

  useEffect(() => {
    fetchSurvey();
  }, [fetchSurvey]);

  const handleAnswerChange = (questionId, value) => {
    const key = toIdStr(questionId);
    setAnswers({
      ...answers,
      [key]: value,
    });
  };

  // Drag state for ranking questions (index within the current list)
  const [draggingIndex, setDraggingIndex] = useState(null);

  const handleDragStart = (e, qId, idx) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggingIndex(idx);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropRanking = (e, question, dropIdx) => {
    e.preventDefault();
    const key = toIdStr(question._id);

    // Build current ordered list (array of {value,text})
    const current = (answers[key] && Array.isArray(answers[key])
      ? answers[key].map((val) => ({ value: String(val) }))
      : question.options.map((opt) => ({ value: getOptionValue(opt), text: opt.text })))
      .map((item, i) => ({ value: item.value, text: item.text || question.options[i]?.text || item.value }));

    if (draggingIndex == null || draggingIndex < 0 || draggingIndex >= current.length) {
      setDraggingIndex(null);
      return;
    }

    const dragged = current[draggingIndex];
    const remaining = current.filter((_, i) => i !== draggingIndex);
    const newList = [
      ...remaining.slice(0, dropIdx),
      dragged,
      ...remaining.slice(dropIdx),
    ];

    // Update answers to an array of values (expected by backend)
    setAnswers({
      ...answers,
      [key]: newList.map((it) => it.value),
    });

    setDraggingIndex(null);
  };

  const handleSubmitResponse = async () => {
    // Validate all required questions are answered (use normalized string IDs for lookup)
    const requiredQuestions = survey.questions.filter(q => q.required);
    const unansweredRequired = requiredQuestions.filter((q) => {
      const key = toIdStr(q._id);
      const val = answers[key];
      // Treat undefined, null, empty string, or empty array as unanswered
      if (val === undefined || val === null) return true;
      if (Array.isArray(val)) return val.length === 0;
      return val === '';
    });

    if (unansweredRequired.length > 0) {
      toast.error(
        `Please answer all required questions (${unansweredRequired.length} remaining)`
      );
      return;
    }

    setSubmitting(true);

    try {
      // Format answers for submission (use normalized IDs so backend receives consistent questionId strings)
      const formattedAnswers = survey.questions.map((question) => {
        const key = toIdStr(question._id);
        return {
          questionId: key,
          questionText: question.text,
          questionType: question.type,
          answer: answers[key],
          timeSpent: 0,
        };
      });

      const payload = {
        answers: formattedAnswers,
      };

      if (respondent) {
        payload.respondentName = respondent.name;
        payload.respondentEmail = respondent.email;
      }

      await publicService.submitSurveyResponse(shareableLink, payload);

      toast.success('Thank you! Your response has been submitted.');

      setTimeout(() => {
        window.location.href = '/thank-you';
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < survey.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  if (loading) {
    return (
      <div className="survey-container">
        <div className="loading">Loading survey...</div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="survey-container">
        <div className="error">Survey not found or has expired</div>
      </div>
    );
  }

  const totalQuestions = survey.questions.length;
  const question = survey.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  // If respondent details are not collected yet, show the form first
  if (!respondent) {
    return <RespondentInfo onSubmit={(r) => setRespondent(r)} />;
  }

  return (
    <div className="public-survey-container">
      <div className="survey-card">
        {/* Survey Header */}
        <div className="survey-header">
          <h1>{survey.title}</h1>
          {survey.description && <p className="description">{survey.description}</p>}
        </div>

        {/* Progress Bar */}
        {survey.settings?.showProgressBar && (
          <div className="progress-section">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="progress-text">
              Question {currentQuestion + 1} of {totalQuestions}
            </p>
          </div>
        )}

        {/* Current Question */}
        <div className="question-section">
          <div className="question-number">Question {currentQuestion + 1}</div>
          <h2>{question.text}</h2>
          {question.description && <p className="question-description">{question.description}</p>}
          {question.required && <span className="required-badge">Required</span>}

          {/* Answer Input based on question type */}
          <div className="answer-input">
            {question.type === 'multiple_choice' && (
              <div className="options-list">
                {question.options.map((option, optIdx) => {
                  const optionVal = getOptionValue(option);
                  const answerKey = toIdStr(question._id);
                  return (
                    <label key={optIdx} className="option-item">
                      <input
                        type="radio"
                        name={`question-${answerKey}`}
                        value={optionVal}
                        checked={answers[answerKey] === optionVal}
                        onChange={() => handleAnswerChange(question._id, optionVal)}
                      />
                      <span>{option.text}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {question.type === 'short_text' && (
              <input
                type="text"
                maxLength="255"
                value={answers[toIdStr(question._id)] || ''}
                onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                placeholder="Enter your answer..."
                className="text-input"
              />
            )}

            {question.type === 'long_text' && (
              <textarea
                value={answers[toIdStr(question._id)] || ''}
                onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                placeholder="Enter your detailed answer..."
                className="text-input"
                rows="5"
              />
            )}

            {question.type === 'rating' && (
              <div className="rating-scale">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleAnswerChange(question._id, rating)}
                    className={`rating-btn ${answers[toIdStr(question._id)] === rating ? 'active' : ''}`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            )}

            {question.type === 'star_rating' && (
              <div className="star-rating-scale">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleAnswerChange(question._id, star)}
                    className={`star-btn ${answers[toIdStr(question._id)] >= star ? 'active' : ''}`}
                    title={`${star} star${star !== 1 ? 's' : ''}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            )}

            {question.type === 'ranking' && (
              <div className="ranking-list">
                <p className="ranking-hint">Drag to rank items in order</p>
                {(() => {
                  const key = toIdStr(question._id);
                  // Build display list from saved answers (array of values) or fallback to original options
                  const ordered = (answers[key] && Array.isArray(answers[key]))
                    ? answers[key].map((val) => {
                        // Find matching option text
                        const found = question.options.find((o) => (getOptionValue(o) === String(val)) || (o.text === val));
                        return { value: String(val), text: found ? found.text : String(val) };
                      })
                    : question.options.map((o) => ({ value: getOptionValue(o), text: o.text }));

                  return ordered.map((item, idx) => (
                    <div
                      key={`${item.value}-${idx}`}
                      className="ranking-item"
                      draggable
                      onDragStart={(e) => handleDragStart(e, question._id, idx)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropRanking(e, question, idx)}
                    >
                      <span className="ranking-handle">⋮⋮</span>
                      <span>{item.text}</span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="button-group">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestion === 0}
            className="btn btn-outline"
          >
            ← Previous
          </button>

          {currentQuestion === totalQuestions - 1 ? (
            <button
              onClick={handleSubmitResponse}
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Submitting...' : 'Submit Response'}
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="btn btn-primary"
            >
              Next →
            </button>
          )}
        </div>

        {/* Question Indicator */}
        <div className="question-indicator">
          {survey.questions.map((q, idx) => (
            <div
              key={idx}
              className={`indicator-dot ${
                answers[toIdStr(q._id)] !== undefined && answers[toIdStr(q._id)] !== '' && answers[toIdStr(q._id)] !== null ? 'answered' : ''
              } ${currentQuestion === idx ? 'active' : ''}`}
              onClick={() => setCurrentQuestion(idx)}
              title={`Question ${idx + 1} ${answers[toIdStr(q._id)] != null && answers[toIdStr(q._id)] !== '' ? '(answered)' : '(unanswered)'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicSurvey;
