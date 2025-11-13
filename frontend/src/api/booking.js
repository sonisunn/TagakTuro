// src/api/booking.js
import axios from 'axios';
import { API_BASE_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Create an Axios instance with Authorization header
 */
const axiosWithAuth = async () => {
  const token = await AsyncStorage.getItem('token'); // read JWT from storage
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return instance;
};

/**
 * Create a new booking
 * @param {Object} bookingData
 * @returns {Promise<Object>}
 */
export async function createBooking(bookingData) {
  try {
    const client = await axiosWithAuth();
    const response = await client.post('/booking', bookingData);
    return response.data;
  } catch (error) {
    console.error('Error in createBooking:', (error.response && error.response.data) || error.message);
    throw error;
  }
}

/**
 * Get all bookings
 */
export async function getAllBookings() {
  try {
    const client = await axiosWithAuth();
    const response = await client.get('/booking');
    return response.data;
  } catch (error) {
    console.error('Error in getAllBookings:', (error.response && error.response.data) || error.message);
    throw error;
  }
}

/**
 * Get bookings by student ID
 */
export async function getBookingsByStudentId(studentId) {
  try {
    const client = await axiosWithAuth();
    const response = await client.get(`/booking/student/${studentId}`);
    return response.data;
  } catch (error) {
    console.error('Error in getBookingsByStudentId:', (error.response && error.response.data) || error.message);
    throw error;
  }
}

/**
 * Update booking by ID
 */
export async function updateBooking(id, bookingData) {
  try {
    const client = await axiosWithAuth();
    const response = await client.put(`/booking/${id}`, bookingData);
    return response.data;
  } catch (error) {
    console.error('Error in updateBooking:', (error.response && error.response.data) || error.message);
    throw error;
  }
}

/**
 * Update booking status
 */
export async function updateBookingStatus(id, status) {
  try {
    const client = await axiosWithAuth();
    const response = await client.patch(`/booking/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error in updateBookingStatus:', (error.response && error.response.data) || error.message);
    throw error;
  }
}

/**
 * Delete a booking by ID
 */
export async function deleteBooking(id) {
  try {
    const client = await axiosWithAuth();
    const response = await client.delete(`/booking/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error in deleteBooking:', (error.response && error.response.data) || error.message);
    throw error;
  }
}
