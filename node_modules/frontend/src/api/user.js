import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const axiosWithAuth = async () => {
  const token = await AsyncStorage.getItem('authToken');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

export async function updateUser(id, data) {
  try {
    const client = await axiosWithAuth();
    const res = await client.put(`/api/user/${id}`, data);
    return res.data;
  } catch (error) {
    console.error('Error in updateUser:', (error.response && error.response.data) || error.message);
    throw error;
  }
}
