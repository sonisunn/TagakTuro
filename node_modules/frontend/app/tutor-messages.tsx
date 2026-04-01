import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';

export default function MessagesPage() {

  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'tutor',
      text: "I am Juan, your matched tutor for Computer Science, and your preferred modality is Online. Kindly answer this Diagnostic test so we can assess your current knowledge \n\n Diagnostic Test \n\n I'm looking forward to a swift study session with you!"

    },
    {
      id: 2,
      sender: 'tutor',
      text: "HRU Jayson?! I hope you are doing all good. Reminding you about our session on September 30, 2025. This will be held using our online video conference feature. See you there!",
    },
    {
      id: 3,
      sender: 'student',
      text: "Doing good!! I’ll be there 15 minutes prior :)",
    },
  ]);

  const conversations = [
    {
      id: 1,
      name: 'Juan Dela Cruz',
      preview: "Hey!!! Just a quick reminder about our session later today at 5 PM",
      avatar: null,
    },
    {
      id: 2,
      name: 'Jayson Partido',
      preview: "Looking forward to our session today at 10 AM. I'm ready to help with your English homework.",
      avatar: null,
    },
    {
      id: 3,
      name: 'Jayson Partido',
      preview: "I'm writing to confirm our tutoring session for today. [Date], at [Time, e.g., 4:00 PM].",
      avatar: null,
    },
    {
      id: 4,
      name: 'Jayson Partido',
      preview: "Looking forward to our session today at 10 AM. I'm ready to help with your English homework.",
      avatar: null,
    },
    {
      id: 5,
      name: 'Jayson Partido',
      preview: "I'm writing to confirm our tutoring session for today. [Date], at [Time, e.g., 4:00 PM].",
      avatar: null,
    },
  ];

  const handleSendMessage = () => {
    if (messageText.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: 'student',
        text: messageText,
      };
      setMessages([...messages, newMessage]);
      setMessageText('');
    }
  };

  if (selectedChat) {
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
              <Text style={styles.chatHeaderName}>Juan Dela Cruz</Text>
              {/* <Text style={styles.chatHeaderSubtitle}>Computer Science Tutor</Text> */}
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          style={styles.chatContent}
          contentContainerStyle={styles.chatContentContainer}
        >
          {messages.map((message) => (
            <View key={message.id} style={styles.messageContainer}>
              <View
                style={[
                  styles.messageBubble,
                  message.sender === 'student' ? styles.studentBubble : styles.tutorBubble,
                ]}
              >
                <Text 
                  style={[
                    styles.messageText,
                    message.sender === 'student' ? styles.studentText : styles.tutorText,
                  ]}
                >
                  {message.text}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

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
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <BottomNav />
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
        <Text style={styles.filterText}>Newest</Text>
      </View>

      {/* Conversations List */}
      <ScrollView style={styles.conversationsList} showsVerticalScrollIndicator={false}>
        {conversations.map((conversation) => (
          <TouchableOpacity
            key={conversation.id}
            style={styles.conversationCard}
            onPress={() => setSelectedChat(conversation.id)}
          >
            <View style={styles.avatar}>
              <Ionicons name="person-circle" size={85} color="#2B74B4" />
            </View>
            <View style={styles.conversationContent}>
              <Text style={styles.conversationName}>{conversation.name}</Text>
              <Text style={styles.conversationPreview} numberOfLines={2}>
                {conversation.preview}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <BottomNav />
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