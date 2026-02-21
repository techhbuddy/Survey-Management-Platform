import apiClient from './api';

const surveyService = {
  createSurvey: (data) => {
    return apiClient.post('/surveys', data);
  },

  getSurveys: (params) => {
    return apiClient.get('/surveys', { params });
  },

  getSurveyById: (id) => {
    return apiClient.get(`/surveys/${id}`);
  },

  updateSurvey: (id, data) => {
    return apiClient.put(`/surveys/${id}`, data);
  },

  publishSurvey: (id) => {
    return apiClient.put(`/surveys/${id}/publish`);
  },

  closeSurvey: (id) => {
    return apiClient.put(`/surveys/${id}/close`);
  },

  deleteSurvey: (id) => {
    return apiClient.delete(`/surveys/${id}`);
  },

  addQuestion: (id, data) => {
    return apiClient.post(`/surveys/${id}/questions`, data);
  },

  getAnalytics: (id) => {
    return apiClient.get(`/surveys/${id}/analytics`);
  },

  getAnalysis: (id) => {
    return apiClient.get(`/surveys/${id}/analysis`);
  },

  analyzeSurvey: (id) => {
    return apiClient.post(`/surveys/${id}/analyze`);
  },
};

export default surveyService;
