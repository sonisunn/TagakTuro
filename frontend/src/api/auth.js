import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

export async function signup(user) {
  const url = `${API_BASE_URL}/auth/register`;
  const res = await axios.post(url, user);
  return res.data;
}

export async function login(email, password) {
  const url = `${API_BASE_URL}/auth/login`;
  const res = await axios.post(url, { email, password });
  // expected response: { token: '...', user: { ... } }
  const data = res.data;
  if (data?.token) {
    await AsyncStorage.setItem('authToken', data.token);
    // set default header for axios
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
  }
  return data;
}

export async function loadTokenToHeader() {
  const token = await AsyncStorage.getItem('authToken');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
