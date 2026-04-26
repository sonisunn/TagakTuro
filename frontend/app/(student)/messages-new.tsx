import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../src/api/config';
import { useWebSocket } from '../../src/hooks/useWebSocket';

interface Conversation {
  id: number;
  user1: { id: number; name: string };
  user2: { id: number; name: string };
  lastMessage: Message | null;
}

interface Message {
  id: number;
  conversationId: number;
  sender: { id: number; name: string };
  content: string;
  createdAt: string;
  isRead: boolean;
  messageType: string;
}

export default function MessagesPage() {
  const { subscribe, unsubscribe, publish, isConnected } = useWebSocket();
  
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [selectedConversationName, setSelectedConversationName] = useState('');
  const flatListRef = useRef<FlatList>(null);

  /**
   * Fetch all conversations
   */
  const fetchConversations = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) return;

      const user = JSON.parse(userDataString);
      setCurrentUserId(user.id);

      const response = await axios.get(
        `${API_BASE_URL}/api/chat/conversations?userId=${user.id}&page=0&size=50`
      );
      
      // Handle pagination response
      const conversationList = response.data.content || response.data;
      setConversations(conversationList);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch messages for a conversation
   */
  const fetchMessages = async (conversationId: number) => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) return;

      const user = JSON.parse(userDataString);

      const response = await axios.get(
        `${API_BASE_URL}/api/chat/messages/history/${conversationId}?userId=${user.id}&page=0&size=100`
      );

      const messageList = response.data.content ? response.data.content.reverse() : response.data.reverse();
      setMessages(messageList);

      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 500);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  /**
   * Load conversations on mount
   */
  useEffect(() => {
    fetchConversations();
  }, []);

  /**
   * When a chat is selected, fetch messages and subscribe to chat updates
   */
  useEffect(() => {
    if (selectedChat && currentUserId) {
      fetchMessages(selectedChat);

      // Subscribe to chat messages for this conversation
      console.log(`🔔 Subscribing to chat messages for conversation ${selectedChat}`);
      subscribe(
        `/topic/conversation/${selectedChat}`,
        (newMessage: Message) => {
          console.log('📨 New message received:', newMessage);
          setMessages(prev => [...prev, newMessage]);
          
          // Auto-scroll to new message
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 300);
        }
      );

      return () => {
        unsubscribe(`/topic/conversation/${selectedChat}`);
      };
    }
  }, [selectedChat, currentUserId, subscribe, unsubscribe]);

  /**
   * Send a message
   */
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat || !currentUserId) return;

    const messageContent = messageText;
    setMessageText('');

    try {
      // Send via REST API (will be broadcast via WebSocket)
      const payload = {
        conversationId: selectedChat,
        content: messageContent,
        messageType: 'TEXT',
      };

      await axios.post(
        `${API_BASE_URL}/api/chat/messages?userId=${currentUserId}`,
        payload
      );

      // Also publish to WebSocket for instant feedback
      publish(`/app/chat/${selectedChat}`, payload);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageText(messageContent); // Restore text on error
    }
  };

  /**
   * Get the other user's name in the conversation
   */
  const getOtherUserName = (conversation: Conversation): string => {
    if (!currentUserId) return 'User';
    return conversation.user1.id === currentUserId ? conversation.user2.name : conversation.user1.name;
  };

  /**
   * Render a single message
   */
  const renderMessage = (message: Message) => {
    const isOwn = message.sender.id === currentUserId;

    return (
      <View key={message.id} style={styles.messageContainer}>
        <View
          style={[
            styles.messageBubble,
            isOwn ? styles.studentBubble : styles.tutorBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwn ? styles.studentText : styles.tutorText,
            ]}
          >
            {message.content}
          </Text>
          <Text style={styles.messageTime}>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  /**
   * Render conversation list when no chat is selected
   */
  if (!selectedChat) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>Stay updated with your tutor!</Text>
        </View>

        {/* Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterText}>Newest</Text>
        </View>

        {/* Conversations List */}
        {loading ? (
          <ActivityIndicator size="large" color="#2B74B4" style={{ marginTop: 50 }} />
        ) : conversations.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 50, color: '#888' }}>
            No conversations yet!
          </Text>
        ) : (
          <ScrollView style={styles.conversationsList} showsVerticalScrollIndicator={false}>
            {conversations.map((conversation) => (
              <TouchableOpacity
                key={conversation.id}
                style={styles.conversationCard}
                onPress={() => {
                  const otherUserName = getOtherUserName(conversation);
                  setSelectedChat(conversation.id);
                  setSelectedConversationName(otherUserName);
                }}
              >
                <View style={styles.avatar}>
                  <Ionicons name="person-circle" size={85} color="#2B74B4" />
                </View>
                <View style={styles.conversationContent}>
                  <Text style={styles.conversationName}>
                    {getOtherUserName(conversation)}
                  </Text>
                  <Text style={styles.conversationPreview} numberOfLines={2}>
                    {conversation.lastMessage?.content || 'No messages yet'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        )}
      </View>
    );
  }

  /**
   * Render chat view
   */
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <Stack.Screen options={{ headerShown: false }} />

        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedChat(null)}>
            <Ionicons name="arrow-back" size={24} color="#2B74B4" />
          </TouchableOpacity>
          <View style={styles.chatHeaderContent}>
            <View style={styles.chatAvatar}>
              <Ionicons name="person-circle" size={60} color="#2B74B4" />
            </View>
            <View>
              <Text style={styles.chatHeaderName}>{selectedConversationName}</Text>
              {isConnected() && (
                <Text style={styles.chatHeaderSubtitle}>Online</Text>
              )}
            </View>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => renderMessage(item)}
          keyExtractor={(item) => item.id.toString()}
          style={styles.chatContent}
          contentContainerStyle={styles.chatContentContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type something here..."
            value={messageText}
            onChangeText={setMessageText}
            placeholderTextColor="#95CDF2"
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
          >
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600',
    color: '#2B74B4',
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
    fontWeight: '600',
  },
  conversationsList: {
    flex: 1,
  },
  conversationCard: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    marginVertical: 5,
    alignItems: 'center',
  },
  avatar: {
    marginRight: 15,
  },
  conversationContent: {
    flex: 1,
  },
  conversationName: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: '#2B74B4',
  },
  conversationPreview: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
    marginTop: 5,
  },
  bottomSpacing: {
    height: 50,
  },
  chatHeader: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 15,
  },
  chatHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
  },
  chatAvatar: {
    marginRight: 15,
  },
  chatHeaderName: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: '#2B74B4',
  },
  chatHeaderSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: '#95CDF2',
    marginTop: 2,
  },
  chatContent: {
    flex: 1,
    paddingHorizontal: 15,
  },
  chatContentContainer: {
    paddingVertical: 15,
  },
  messageContainer: {
    marginVertical: 8,
  },
  messageBubble: {
    maxWidth: '85%',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  studentBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2B74B4',
  },
  tutorBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F4F8',
  },
  messageText: {
    fontFamily: 'Poppins',
    fontSize: 14,
  },
  studentText: {
    color: '#fff',
  },
  tutorText: {
    color: '#2B74B4',
  },
  messageTime: {
    fontFamily: 'Poppins',
    fontSize: 10,
    marginTop: 5,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#2B74B4',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
