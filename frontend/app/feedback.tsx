import { Stack, useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';

export default function FeedbackPage() {


  const feedbacks = [
    {
      id: 1,
      name: 'Juan Dela Cruz',
      comment: 'Gladly, he was cooperating during the session',
    },
    {
      id: 2,
      name: 'Juan Luna',
      comment: 'He learned the topic swiftly',
    },
    {
      id: 3,
      name: 'Jose Rizal',
      comment: 'He was a fun and engaging student',
    },
    {
      id: 4,
      name: 'Donald Trump',
      comment: 'He was kind of talkative so it took the session longer',
    },
    {
      id: 5,
      name: 'Sabrina Carter',
      comment: 'Thankful for him, he managed to learn the topic',
    },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Ionicons name="person-circle" size={150} color="#2B74B4" />
          </View>
          <Text style={styles.profileName}>Jayson Partido</Text>
          <Text style={styles.profileRole}>Computer Science Tutor</Text>
        </View>

        {/* Feedback Section */}
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackTitle}>Feedback from Tutor</Text>
          <View style={styles.feedbackList}>
            {feedbacks.map((feedback, index) => (
              <View key={feedback.id}>
                <View style={styles.feedbackItem}>
                  <Text style={styles.feedbackName}>{feedback.name}</Text>
                  <Text style={styles.feedbackComment}>&quot;{feedback.comment}&quot;</Text>
                </View>
                {index < feedbacks.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Spacing */}
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
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileName: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '700',
    color: '#2B74B4',
    marginBottom: 5,
  },
  profileRole: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#95CDF2',
    fontWeight: '600',
  },
  feedbackSection: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  feedbackTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#2B74B4',
    marginBottom: 15,
  },
  feedbackList: {
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2B74B4',
    padding: 20,
  },
  feedbackItem: {
    paddingVertical: 10,
  },
  feedbackName: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: '#2B74B4',
    marginBottom: 5,
  },
  feedbackComment: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#95CDF2',
    marginVertical: 5,
  },
  bottomSpacing: {
    height: 100,
  },
});