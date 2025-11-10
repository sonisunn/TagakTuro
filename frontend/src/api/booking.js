import axios from 'axios';
import { API_BASE_URL } from './config';
import { loadTokenToHeader } from './auth';

// Ensure token is loaded before making requests
loadTokenToHeader();

export async function getAllBookings() {
  const url = `${API_BASE_URL}/booking`;
  const res = await axios.get(url);
  return res.data;
}

export async function getBookingById(id) {
  const url = `${API_BASE_URL}/booking/${id}`;
  const res = await axios.get(url);
  return res.data;
}

export async function getBookingsByStudentId(studentId) {
  const url = `${API_BASE_URL}/booking/student/${studentId}`;
  const res = await axios.get(url);
  return res.data;
}

export async function getBookingsByStatus(status) {
  const url = `${API_BASE_URL}/booking/status/${status}`;
  const res = await axios.get(url);
  return res.data;
}

export async function getBookingsByDateRange(start, end) {
  const url = `${API_BASE_URL}/booking/date-range`;
  const res = await axios.get(url, {
    params: {
      start: start,
      end: end
    }
  });
  return res.data;
}

export async function createBooking(booking) {
  const url = `${API_BASE_URL}/booking`;
  const res = await axios.post(url, booking);
  return res.data;
}

export async function updateBooking(id, booking) {
  const url = `${API_BASE_URL}/booking/${id}`;
  const res = await axios.put(url, booking);
  return res.data;
}

export async function updateBookingStatus(id, status) {
  const url = `${API_BASE_URL}/booking/${id}/status`;
  const res = await axios.patch(url, { status });
  return res.data;
}

export async function deleteBooking(id) {
  const url = `${API_BASE_URL}/booking/${id}`;
  const res = await axios.delete(url);
  return res.data;
}

