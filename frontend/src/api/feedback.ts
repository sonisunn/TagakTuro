import axios from 'axios';
import { API_BASE_URL } from './config';

const BASE_URL = `${API_BASE_URL}/api/feedback`;

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

export const submitFeedback = async (reviewerId: number, data: FeedbackRequest): Promise<FeedbackResponse> => {
    try {
        const response = await axios.post(`${BASE_URL}?reviewerId=${reviewerId}`, data);
        return response.data;
    } catch (error) {
        console.error('Error submitting feedback:', error);
        throw error;
    }
};

export const getFeedbackForBooking = async (bookingId: number): Promise<FeedbackResponse[]> => {
    try {
        const response = await axios.get(`${BASE_URL}/booking/${bookingId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching feedback for booking:', error);
        throw error;
    }
};

export const getFeedbackForUser = async (userId: number): Promise<FeedbackResponse[]> => {
    try {
        const response = await axios.get(`${BASE_URL}/user/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching feedback for user:', error);
        throw error;
    }
};
