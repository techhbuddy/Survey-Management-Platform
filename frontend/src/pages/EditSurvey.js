import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import surveyService from '../services/surveyService';
import toast from 'react-hot-toast';
import './SurveyForm.css';

const EditSurvey = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questions: [],
    settings: {
      allowAnonymous: true,
      allowMultipleResponses: false,
      showProgressBar: true,
      randomizeQuestions: false,
    },
    tags: [],
  });

  // Fetch survey data on mount
  const fetchSurvey = useCallback(async () => {
    try {
      setLoading(true);
      const response = await surveyService.getSurveyById(id);
      const surveyData = response.data.data;

      // Check if survey is published or closed
      if (surveyData.status !== 'draft') {
        toast.error('You can only edit draft surveys');
        navigate('/dashboard');
        return;
      }

      setFormData({
        title: surveyData.title,
        description: surveyData.description || '',
        questions: surveyData.questions.map((q, idx) => ({
          ...q,
          id: q._id || `temp-${idx}`,
        })),
        settings: surveyData.settings || {
          allowAnonymous: true,
          allowMultipleResponses: false,
          showProgressBar: true,
          randomizeQuestions: false,
        },
        tags: surveyData.tags || [],
      });
    } catch (error) {
      toast.error('Failed to load survey');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchSurvey();
  }, [fetchSurvey]);

  // Handle basic field changes
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle question field changes
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index][field] = value;
    setFormData({ ...formData, questions: updatedQuestions });
  };

  // Handle question option changes
  const handleOptionChange = (questionIndex, optionIndex, field, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options[optionIndex][field] = value;
    setFormData({ ...formData, questions: updatedQuestions });
  };

  // Add new question
  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      order: formData.questions.length,
      type: 'multiple_choice',
      text: '',
      description: '',
      required: true,
      options: [{ text: '', value: '' }],
    };
    setFormData({
      ...formData,
      questions: [...formData.questions, newQuestion],
    });
  };

  // Remove question
  const removeQuestion = (index) => {
    const updatedQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: updatedQuestions });
  };

  // Add option to a question
  const addOption = (questionIndex) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options.push({ text: '', value: '' });
    setFormData({ ...formData, questions: updatedQuestions });
  };

  // Remove option from a question
  const removeOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options.filter(
      (_, i) => i !== optionIndex
    );
    setFormData({ ...formData, questions: updatedQuestions });
  };

  // Handle settings changes
  const handleSettingsChange = (field) => {
    setFormData({
      ...formData,
      settings: {
        ...formData.settings,
        [field]: !formData.settings[field],
      },
    });
  };

  // Handle tags change
  const handleTagsChange = (e) => {
    const tagsString = e.target.value;
    const tags = tagsString
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    setFormData({ ...formData, tags });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.title.trim()) {
      toast.error('Survey title is required');
      return;
    }

    if (formData.questions.length === 0) {
      toast.error('At least one question is required');
      return;
    }

    // Validate questions
    for (let i = 0; i < formData.questions.length; i++) {
      const question = formData.questions[i];
      if (!question.text.trim()) {
        toast.error(`Question ${i + 1} text is required`);
        return;
      }

      if (['multiple_choice', 'ranking'].includes(question.type)) {
        const validOptions = question.options.filter((opt) => opt.text.trim());
        if (validOptions.length === 0) {
          toast.error(`Question ${i + 1} must have at least one option`);
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      // Remove 'id' field from questions as MongoDB uses '_id'
      const surveyData = {
        ...formData,
        questions: formData.questions.map(({ id, ...rest }) => rest),
      };
      await surveyService.updateSurvey(id, surveyData);
      toast.success('Survey updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update survey');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle publish survey
  const handlePublish = async () => {
    if (window.confirm('Are you sure you want to publish this survey? It cannot be edited after publishing.')) {
      try {
        setSubmitting(true);
        const response = await surveyService.publishSurvey(id);

        // Validate response structure
        if (!response.data || !response.data.data) {
          toast.error('Invalid response from server. Please try again.');
          return;
        }

        const publishedSurvey = response.data.data;

        // Check if shareableLink was generated
        if (!publishedSurvey.shareableLink) {
          toast.error('Failed to generate survey link. Please try again.');
          return;
        }

        toast.success('Survey published successfully!');

        // Navigate to the published survey page with the shareableLink
        navigate(`/published/${publishedSurvey.shareableLink}`);
      } catch (error) {
        console.error('Publish error:', error);
        toast.error(error.response?.data?.message || 'Failed to publish survey');
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return <div className="survey-form-container"><p>Loading survey...</p></div>;
  }

  return (
    <div className="survey-form-container">
      <div className="form-header">
        <h1>Edit Survey</h1>
        <p>Update your survey details and questions</p>
      </div>

      <form onSubmit={handleSubmit} className="survey-form">
        {/* Survey Basic Info */}
        <section className="form-section">
          <h2>Survey Details</h2>

          <div className="form-group">
            <label htmlFor="title">Survey Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleFieldChange}
              placeholder="e.g., Customer Satisfaction Survey"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleFieldChange}
              placeholder="Add instructions or context for respondents"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (comma-separated)</label>
            <input
              type="text"
              id="tags"
              value={formData.tags.join(', ')}
              onChange={handleTagsChange}
              placeholder="e.g., feedback, customer, product"
            />
          </div>
        </section>

        {/* Survey Settings */}
        <section className="form-section">
          <h2>Survey Settings</h2>

          <div className="settings-grid">
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={formData.settings.allowAnonymous}
                  onChange={() => handleSettingsChange('allowAnonymous')}
                />
                Allow Anonymous Responses
              </label>
              <p className="setting-hint">Anyone can respond without logging in</p>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={formData.settings.allowMultipleResponses}
                  onChange={() => handleSettingsChange('allowMultipleResponses')}
                />
                Allow Multiple Responses
              </label>
              <p className="setting-hint">Same user can respond multiple times</p>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={formData.settings.showProgressBar}
                  onChange={() => handleSettingsChange('showProgressBar')}
                />
                Show Progress Bar
              </label>
              <p className="setting-hint">Display completion progress to respondents</p>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={formData.settings.randomizeQuestions}
                  onChange={() => handleSettingsChange('randomizeQuestions')}
                />
                Randomize Questions
              </label>
              <p className="setting-hint">Show questions in random order</p>
            </div>
          </div>
        </section>

        {/* Questions */}
        <section className="form-section">
          <h2>Questions ({formData.questions.length})</h2>

          <div className="questions-list">
            {formData.questions.map((question, questionIndex) => (
              <div key={question.id} className="question-card">
                <div className="question-header">
                  <h3>Question {questionIndex + 1}</h3>
                  {formData.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(questionIndex)}
                      className="btn btn-danger btn-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label>Question Type *</label>
                  <select
                    value={question.type}
                    onChange={(e) => handleQuestionChange(questionIndex, 'type', e.target.value)}
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="short_text">Short Text</option>
                    <option value="long_text">Long Text</option>
                    <option value="rating">Rating (1-5)</option>
                    <option value="star_rating">Star Rating (1-5 Stars)</option>
                    <option value="ranking">Ranking</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Question Text *</label>
                  <input
                    type="text"
                    value={question.text}
                    onChange={(e) => handleQuestionChange(questionIndex, 'text', e.target.value)}
                    placeholder="e.g., How satisfied are you with our service?"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description (optional)</label>
                  <textarea
                    value={question.description}
                    onChange={(e) => handleQuestionChange(questionIndex, 'description', e.target.value)}
                    placeholder="Add additional context or help text"
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={question.required}
                      onChange={(e) => handleQuestionChange(questionIndex, 'required', e.target.checked)}
                    />
                    Required Question
                  </label>
                </div>

                {/* Options for multiple choice and ranking */}
                {['multiple_choice', 'ranking'].includes(question.type) && (
                  <div className="options-section">
                    <h4>Options</h4>
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="form-row">
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) =>
                            handleOptionChange(questionIndex, optionIndex, 'text', e.target.value)
                          }
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                        <input
                          type="text"
                          value={option.value}
                          onChange={(e) =>
                            handleOptionChange(questionIndex, optionIndex, 'value', e.target.value)
                          }
                          placeholder="Value (auto-generated if empty)"
                        />
                        {question.options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOption(questionIndex, optionIndex)}
                            className="btn btn-danger btn-sm"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(questionIndex)}
                      className="btn btn-secondary btn-sm"
                    >
                      + Add Option
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button type="button" onClick={addQuestion} className="btn btn-secondary">
            + Add Question
          </button>
        </section>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-outline"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePublish}
            className="btn btn-success"
            disabled={submitting}
          >
            {submitting ? 'Publishing...' : 'Publish Survey'}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditSurvey;
