import apiClient from './api';

const publicService = {
  // Get survey by shareable link (public access, no auth required)
  getSurveyByLink: (link) => {
    return apiClient.get(`/public/survey/${link}`);
  },

  // Submit response via shareable link (public access, no auth required)
  submitSurveyResponse: (link, data) => {
    return apiClient.post(`/public/survey/${link}/submit`, data);
  },
};

export default publicService;
