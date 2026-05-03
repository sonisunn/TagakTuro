import axios from 'axios';
import { API_BASE_URL } from './config';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// /api/tutor/apply is public — strip any session token so an expired/wrong
// JWT from a previously logged-in session can never cause a 403.
apiClient.interceptors.request.use((config) => {
  delete config.headers['Authorization'];
  delete config.headers.common?.['Authorization'];
  return config;
});

export const applyAsTutor = (formData: FormData) => {
  return apiClient.post('/api/tutor/apply', formData);
};

export const checkStudentIdTaken = async (studentId: string): Promise<boolean> => {
  try {
    const res = await apiClient.get(`/api/tutor/check-student-id?studentId=${encodeURIComponent(studentId)}`);
    return res.data.taken as boolean;
  } catch {
    return false;
  }
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