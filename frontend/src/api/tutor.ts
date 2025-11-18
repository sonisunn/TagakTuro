import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.8:8080'; // Make sure this is your backend IP

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const applyAsTutor = (formData: FormData) => {
  return apiClient.post('/api/tutor/apply', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};