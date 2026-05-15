// src/api/booking.js
import axios from 'axios';
import { API_BASE_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Create an Axios instance with Authorization header
 */
export const axiosWithAuth = async () => {
  const token = await AsyncStorage.getItem('authToken'); // read JWT from storage
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000, // 15 second timeout
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
    const response = await client.post('/api/booking', bookingData);
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
    const response = await client.get('/api/booking');
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
    const response = await client.get(`/api/booking/student/${studentId}`);
    return response.data || [];
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout: Could not fetch bookings (exceeded 15 seconds)');
    } else if (error.message === 'Network Error') {
      console.error('Network error: Cannot reach backend server. Ensure server is running at', API_BASE_URL);
    } else {
      console.error('Error in getBookingsByStudentId:', (error.response && error.response.data) || error.message);
    }
    return []; // Return empty array on error instead of throwing
  }
}

/**
 * Get all pending bookings
 */
export async function getPendingBookings() {
  try {
    const client = await axiosWithAuth();
    const response = await client.get('/api/booking/pending');
    return response.data;
  } catch (error) {
    console.error('Error in getPendingBookings:', (error.response && error.response.data) || error.message);
    throw error;
  }
}

/**
 * Get bookings by tutor name
 */
export async function getPendingBookingsForTutor(userId) {
  try {
    const client = await axiosWithAuth();
    const response = await client.get(`/api/booking/pending/tutor/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error in getPendingBookingsForTutor:', (error.response && error.response.data) || error.message);
    throw error;
  }
}

/**
 * Get bookings by tutor name
 */
export async function getBookingsByTutorName(tutorName) {
  try {
    const client = await axiosWithAuth();
    const response = await client.get(`/api/booking/tutor/${encodeURIComponent(tutorName)}`);
    return response.data;
  } catch (error) {
    console.error('Error in getBookingsByTutorName:', (error.response && error.response.data) || error.message);
    throw error;
  }
}

/**
 * Update booking by ID
 */
export async function updateBooking(id, bookingData) {
  try {
    const client = await axiosWithAuth();
    const response = await client.put(`/api/booking/${id}`, bookingData);
    return response.data;
  } catch (error) {
    console.error('Error in updateBooking:', (error.response && error.response.data) || error.message);
    throw error;
  }
}

/**
 * Update booking status. Pass an optional cancellationReason for CANCELLED;
 * the backend surfaces it in the cancellation notification + email body.
 */
export async function updateBookingStatus(id, status, cancellationReason) {
  try {
    const client = await axiosWithAuth();
    const payload = { status };
    if (cancellationReason && cancellationReason.trim()) {
      payload.cancellationReason = cancellationReason.trim();
    }
    const response = await client.patch(`/api/booking/${id}/status`, payload);
    return response.data;
  } catch (error) {
    console.error('Error in updateBookingStatus:', (error.response && error.response.data) || error.message);
    throw error;
  }
}

/**
 * Decline a booking (tutor) — reverts to PENDING, unassigns tutor
 */
export async function declineBooking(id) {
  try {
    const client = await axiosWithAuth();
    const response = await client.post(`/api/booking/${id}/decline`);
    return response.data;
  } catch (error) {
    console.error('Error in declineBooking:', (error.response && error.response.data) || error.message);
    throw error;
  }
}

/**
 * Delete a booking by ID
 */
export async function deleteBooking(id) {
  try {
    const client = await axiosWithAuth();
    const response = await client.delete(`/api/booking/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error in deleteBooking:', (error.response && error.response.data) || error.message);
    throw error;
  }
}
