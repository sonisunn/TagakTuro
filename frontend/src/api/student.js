import axios from 'axios';
import { API_BASE_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Create an Axios instance with Authorization header
 */
const axiosWithAuth = async () => {
  const token = await AsyncStorage.getItem('authToken'); // read JWT from storage
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return instance;
};

export async function getAllStudents() {
  try {
    const client = await axiosWithAuth();
    const response = await client.get('/api/student');
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getStudentById(id) {
  try {
    const client = await axiosWithAuth();
    const response = await client.get(`/api/student/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getStudentByEmail(email) {
  const url = `${API_BASE_URL}/student/email/${email}`;
  const res = await axios.get(url);
  return res.data;
}

export async function getStudentByStudentId(studentId) {
  const url = `${API_BASE_URL}/student/studentId/${studentId}`;
  const res = await axios.get(url);
  return res.data;
}

export async function createStudent(student) {
  const url = `${API_BASE_URL}/student`;
  const res = await axios.post(url, student);
  return res.data;
}

export async function updateStudent(id, student) {
  const url = `${API_BASE_URL}/student/${id}`;
  const res = await axios.put(url, student);
  return res.data;
}

export async function deleteStudent(id) {
  const url = `${API_BASE_URL}/student/${id}`;
  const res = await axios.delete(url);
  return res.data;
}

