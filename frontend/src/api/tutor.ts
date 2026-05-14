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

// Use fetch directly for the multipart upload.
// axios + React Native + FormData-with-files is unreliable: axios silently
// fails to serialize the body and the request never leaves the device,
// surfacing as a generic "Network Error" with no response. fetch handles
// React Native's FormData (including the {uri, name, type} file shape) natively.
export const applyAsTutor = async (formData: FormData) => {
  const res = await fetch(`${API_BASE_URL}/api/tutor/apply`, {
    method: 'POST',
    body: formData,
    // Intentionally do NOT set Content-Type — fetch must add it itself
    // so the multipart boundary parameter is correct.
  });
  if (!res.ok) {
    let serverError = '';
    try {
      const data = await res.json();
      serverError = (data && (data.error || data.message)) || '';
    } catch {
      serverError = await res.text().catch(() => '');
    }
    const err: any = new Error(serverError || `HTTP ${res.status}`);
    err.response = { status: res.status, data: { error: serverError } };
    throw err;
  }
  try { return await res.json(); } catch { return {}; }
};

// Returns true = confirmed student, false = confirmed not student, null = endpoint unavailable
export const checkEmailIsStudent = async (email: string): Promise<boolean | null> => {
  try {
    const res = await apiClient.get(`/api/tutor/check-email-is-student?email=${encodeURIComponent(email)}`);
    console.log('[tutor.ts] check-email-is-student response:', res.status, res.data);
    return res.data.isStudent as boolean;
  } catch (err: any) {
    console.warn('[tutor.ts] check-email-is-student failed:', err?.response?.status, err?.message);
    return null;
  }
};

export const checkStudentIdTaken = async (
  studentId: string,
  email?: string
): Promise<{ taken: boolean; canSwitch: boolean }> => {
  try {
    let url = `/api/tutor/check-student-id?studentId=${encodeURIComponent(studentId)}`;
    if (email) url += `&email=${encodeURIComponent(email)}`;
    const res = await apiClient.get(url);
    return { taken: res.data.taken as boolean, canSwitch: (res.data.canSwitch as boolean) ?? false };
  } catch {
    return { taken: false, canSwitch: false };
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