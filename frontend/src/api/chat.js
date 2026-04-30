import axios from 'axios';
import { API_BASE_URL } from './config';

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId) {
    try {
        const res = await axios.get(`${API_BASE_URL}/api/chat/conversations`, {
            params: { userId }
        });
        return res.data;
    } catch (error) {
        console.error('Error fetching conversations:', error);
        throw error;
    }
}

/**
 * Get or create a conversation between two users
 */
export async function getOrCreateConversation(currentUserId, otherUserId) {
    try {
        const res = await axios.get(`${API_BASE_URL}/api/chat/conversations/with/${otherUserId}`, {
            params: { currentUserId }
        });
        return res.data;
    } catch (error) {
        console.error('Error getting/creating conversation:', error);
        throw error;
    }
}

/**
 * Get message history for a conversation
 */
export async function getMessageHistory(conversationId, userId, page = 0, size = 50) {
    try {
        const res = await axios.get(`${API_BASE_URL}/api/chat/messages/history/${conversationId}`, {
            params: { userId, page, size }
        });
        return res.data;
    } catch (error) {
        console.error('Error fetching message history:', error);
        throw error;
    }
}
