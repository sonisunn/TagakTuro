import axios from 'axios';
import { API_BASE_URL } from './config';

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