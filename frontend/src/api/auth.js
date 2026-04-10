// src/api/auth.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

// Set default timeout for all axios requests
axios.defaults.timeout = 15000; // 15 seconds

/**
 * Sign up a new user
 */
export async function signup(user) {
  try {
    const res = await axios.post(`${API_BASE_URL}/api/auth/signup`, user, { timeout: 15000 });
    return res.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error('Sign up timeout: Request exceeded 15 seconds');
    } else if (error.message === 'Network Error') {
      console.error('Network error: Cannot reach backend server');
    } else {
      console.error('Error in signup:', error.response?.data || error.message);
    }
    throw error;
  }
}

/**
 * Log in a user
 * Stores token in AsyncStorage and sets axios default Authorization header
 */
export async function login(email, password) {
  try {
    const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password }, { timeout: 15000 });
    const data = res.data;

    if (data?.token) {
      await AsyncStorage.setItem('authToken', data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    }

    return data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error('Login timeout: Request exceeded 15 seconds');
    } else if (error.message === 'Network Error') {
      console.error('Network error: Cannot reach backend server');
    } else {
      console.error('Error in login:', error.response?.data || error.message);
    }
    throw error;
  }
}

/**
 * Load the JWT token from AsyncStorage and set axios Authorization header
 */
export async function loadTokenToHeader() {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  } catch (error) {
    console.error('Error loading token:', error.message);
  }
}

