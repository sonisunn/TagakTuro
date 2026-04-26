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

import { axiosWithAuth } from './booking';

export const getTutorAvailabilityByUserId = async (userId: string | number) => {
  const client = await axiosWithAuth();
  const res = await client.get(`/api/tutor/user/${userId}/availability`);
  return res.data;
};

export const updateTutorAvailabilityByUserId = async (userId: string | number, availabilities: any[]) => {
  const client = await axiosWithAuth();
  const res = await client.put(`/api/tutor/user/${userId}/availability`, availabilities);
  return res.data;
};