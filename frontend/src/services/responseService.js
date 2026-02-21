import apiClient from './api';

const responseService = {
  submitResponse: (data) => {
    return apiClient.post('/responses', data);
  },

  savePartialResponse: (data) => {
    return apiClient.post('/responses/draft', data);
  },

  getResponses: (params) => {
    return apiClient.get('/responses', { params });
  },

  getResponseById: (id) => {
    return apiClient.get(`/responses/${id}`);
  },

  getResponseAnalytics: (surveyId) => {
    return apiClient.get(`/responses/${surveyId}/analytics`);
  },

  deleteResponse: (id) => {
    return apiClient.delete(`/responses/${id}`);
  },
};

export default responseService;
