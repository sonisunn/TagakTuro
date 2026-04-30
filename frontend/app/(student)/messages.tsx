import { Stack } from 'expo-router';
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChat } from '../../hooks/useChat';
import { getUserConversations, getMessageHistory } from '../../src/api/chat';

export default function MessagesPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { messages, setMessages, sendMessage, connected } = useChat(selectedChat?.id || null, userId);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user.id);
        fetchConversations(user.id);
      }
    };
    loadUser();
  }, []);

  const fetchConversations = async (id: number) => {
    try {
      const data = await getUserConversations(id);
      setConversations(data.content || []);
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (conversationId: number) => {
    if (!userId) return;
    setLoadingHistory(true);
    try {
      const data = await getMessageHistory(conversationId, userId);
      // Backend returns newest first in Page, we want oldest first for chat bubble display
      const history = [...data.content].reverse();
      setMessages(history);
    } catch (error) {
      console.error('Failed to load history', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectChat = (conversation: any) => {
    setSelectedChat(conversation);
    loadHistory(conversation.id);
  };

  const handleSendMessage = () => {
    if (messageText.trim() && connected) {
      sendMessage(messageText.trim());
      setMessageText('');
    }
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  if (selectedChat) {
    const otherUserName = selectedChat.user1Id === userId ? selectedChat.user2Name : selectedChat.user1Name;

    return (
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
                <Text style={styles.chatHeaderName}>{otherUserName}</Text>
                <Text style={[styles.chatHeaderSubtitle, { color: connected ? '#4CAF50' : '#F44336' }]}>
                  {connected ? 'Connected' : 'Disconnected'}
                </Text>
              </View>
            </View>
          </View>

          {/* Messages */}
          {loadingHistory ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#2B74B4" />
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.chatContent}
              contentContainerStyle={styles.chatContentContainer}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((message) => (
                <View key={message.id} style={styles.messageContainer}>
                  <View
                    style={[
                      styles.messageBubble,
                      message.senderId === userId ? styles.studentBubble : styles.tutorBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.senderId === userId ? styles.studentText : styles.tutorText,
                      ]}
                    >
                      {message.content}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

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
              style={[styles.sendButton, (!connected || !messageText.trim()) && { opacity: 0.5 }]}
              onPress={handleSendMessage}
              disabled={!connected || !messageText.trim()}
            >
              <Ionicons name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

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
        <Text style={styles.filterText}>Recent</Text>
      </View>

      {/* Conversations List */}
      <ScrollView style={styles.conversationsList} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#2B74B4" style={{ marginTop: 50 }} />
        ) : conversations.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Text style={{ color: '#95CDF2', fontFamily: 'Poppins' }}>No conversations yet.</Text>
          </View>
        ) : (
          conversations.map((conversation) => {
            const otherUserName = conversation.user1Id === userId ? conversation.user2Name : conversation.user1Name;
            return (
              <TouchableOpacity
                key={conversation.id}
                style={styles.conversationCard}
                onPress={() => handleSelectChat(conversation)}
              >
                <View style={styles.avatar}>
                  <Ionicons name="person-circle" size={85} color="#2B74B4" />
                </View>
                <View style={styles.conversationContent}>
                  <Text style={styles.conversationName}>{otherUserName}</Text>
                  <Text style={styles.conversationPreview} numberOfLines={2}>
                    {conversation.lastMessage?.content || "No messages yet"}
                  </Text>
                </View>
                {conversation.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  filterText: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600',
    color: '#2B74B4',
  },
  conversationsList: {
    flex: 1,
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 10,
    alignItems: 'center',
    height: 100,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2B74B4',
  },
  avatar: {
    width: 85,
    height: 85,
    marginRight: 5,
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
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
  },
  unreadBadge: {
    backgroundColor: '#2B74B4',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 5,
  },
  bottomSpacing: {
    height: 100,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  chatHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
    flex: 1,
  },
  chatAvatar: {
    width: 60,
    height: 60,
    marginRight: 5,
  },
  chatHeaderName: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: '#2B74B4',
  },
  chatHeaderSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
  },
  chatContent: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  chatContentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  messageContainer: {
    marginBottom: 5,
  },
  messageBubble: {
    padding: 15,
    borderRadius: 15,
    maxWidth: '90%',
  },
  tutorBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2B74B4',
  },
  studentBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2B74B4',
  },
  messageText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    lineHeight: 18,
  },
  tutorText: {
    color: '#2B74B4',
  },
  studentText: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
    gap: 10,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2B74B4',
    borderRadius: 10,
    paddingHorizontal: 20,
    height: 50,
    fontFamily: 'Poppins',
    fontSize: 15,
    color: '#2B74B4',
    maxHeight: 100,
    paddingTop: 15,
  },
  sendButton: {
    backgroundColor: '#2B74B4',
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});