import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const BASE_URL = `${API_BASE_URL}/api/feedback`;

const getAuthClient = async () => {
    const token = await AsyncStorage.getItem('authToken');
    return axios.create({
        timeout: 15000,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
};

export interface FeedbackRequest {
    bookingId: number;
    revieweeId: number;
    rating: number;
    comments: string;
}

export interface FeedbackResponse {
    id: number;
    bookingId: number;
    reviewerId: number;
    reviewerName: string;
    revieweeId: number;
    revieweeName: string;
    rating: number;
    comments: string;
    createdAt: string;
}

export interface StudentFeedbackResponse {
    id: number;
    bookingId: number;
    tutorId: number;
    tutorName: string;
    studentId: number;
    feedback: string;
    createdAt: string;
}

export const submitFeedback = async (reviewerId: number, data: FeedbackRequest): Promise<FeedbackResponse> => {
    const client = await getAuthClient();
    const response = await client.post(`${BASE_URL}?reviewerId=${reviewerId}`, data);
    return response.data;
};

export const getFeedbackForBooking = async (bookingId: number): Promise<FeedbackResponse[]> => {
    const client = await getAuthClient();
    const response = await client.get(`${BASE_URL}/booking/${bookingId}`);
    return response.data;
};

export const getFeedbackForUser = async (userId: number): Promise<FeedbackResponse[]> => {
    const client = await getAuthClient();
    const response = await client.get(`${BASE_URL}/user/${userId}`);
    return response.data;
};

export const getStudentFeedback = async (studentId: number): Promise<StudentFeedbackResponse[]> => {
    const client = await getAuthClient();
    const response = await client.get(`${BASE_URL}/student/${studentId}`);
    return response.data;
};
