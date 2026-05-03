import axios from 'axios';
import { API_BASE_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const axiosWithAuth = async () => {
  const token = await AsyncStorage.getItem('authToken');
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

export async function submitEvaluation(data) {
  try {
    const client = await axiosWithAuth();
    const response = await client.post('/api/evaluation', data);
    return response.data;
  } catch (error) {
    console.error('Error in submitEvaluation:', (error.response && error.response.data) || error.message);
    throw error;
  }
}

export async function checkEvaluated(bookingId, type) {
  try {
    const client = await axiosWithAuth();
    const response = await client.get(`/api/evaluation/check?bookingId=${bookingId}&type=${type}`);
    return response.data.evaluated;
  } catch (error) {
    console.error('Error in checkEvaluated:', (error.response && error.response.data) || error.message);
    return false;
  }
}

export async function getEvaluationsForBooking(bookingId) {
  try {
    const client = await axiosWithAuth();
    const response = await client.get(`/api/evaluation/booking/${bookingId}`);
    return response.data || [];
  } catch (error) {
    console.error('Error in getEvaluationsForBooking:', (error.response && error.response.data) || error.message);
    return [];
  }
}
