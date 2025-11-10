import axios from 'axios';
import { API_BASE_URL } from './config';
import { loadTokenToHeader } from './auth';

// Ensure token is loaded before making requests
loadTokenToHeader();

export async function getAllStudents() {
  const url = `${API_BASE_URL}/student`;
  const res = await axios.get(url);
  return res.data;
}

export async function getStudentById(id) {
  const url = `${API_BASE_URL}/student/${id}`;
  const res = await axios.get(url);
  return res.data;
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

