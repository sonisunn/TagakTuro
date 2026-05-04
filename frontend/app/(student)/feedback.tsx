import { Stack, useRouter } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { getStudentFeedback, StudentFeedbackResponse } from '../../src/api/feedback';

type ErrorType = 'auth' | 'network' | null;

export default function StudentFeedbackTab() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<StudentFeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [studentName, setStudentName] = useState('Student');
  const [currentStudentId, setCurrentStudentId] = useState<number | null>(null);

  const [fontsLoaded] = useFonts({
    Poppins: Poppins_400Regular,
    'Poppins-Bold': Poppins_700Bold,
    'Poppins-SemiBold': Poppins_600SemiBold,
  });

  const handleAuthError = async () => {
    await AsyncStorage.multiRemove(['authToken', 'userData', 'studentId', 'tutorId']);
    router.replace('/login');
  };

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setErrorType(null);
    setErrorMessage('');

    try {
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        setStudentName(userData.name || 'Student');
        setCurrentStudentId(userData.id);

        if (userData.id) {
          const feedbackList = await getStudentFeedback(userData.id);
          setFeedbacks(feedbackList || []);
        }
      }
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        setErrorType('auth');
        setErrorMessage('You are not authorized. Please log in again.');
        await handleAuthError();
      } else if (!error?.response) {
        setErrorType('network');
        setErrorMessage('Unable to connect. Please check your internet connection.');
      } else {
        setErrorType('network');
        setErrorMessage('Failed to load feedback. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFeedback();
    }, [loadFeedback])
  );

  if (!fontsLoaded) return null;

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2B74B4" />
          <Text style={styles.loadingText}>Loading feedback...</Text>
        </View>
      </View>
    );
  }

  // Network error state
  if (errorType === 'network') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContainer}>
          <Ionicons name="wifi-outline" size={56} color="#95CDF2" />
          <Text style={styles.errorTitle}>No Connection</Text>
          <Text style={styles.errorBody}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadFeedback}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Ionicons name="person-circle" size={100} color="#2B74B4" />
          </View>
          <Text style={styles.profileName}>{studentName}</Text>
          <Text style={styles.profileRole}>Student</Text>
        </View>

        {/* Feedback from Tutor Section */}
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackSectionTitle}>Feedback from Tutor</Text>

          {feedbacks.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="mail-outline" size={48} color="#B0C4DE" />
              <Text style={styles.emptyStateText}>No feedback received yet.</Text>
              <Text style={styles.emptyStateSubtext}>
                Feedback from your tutors will appear here after sessions.
              </Text>
            </View>
          ) : (
            <View style={styles.feedbackList}>
              {feedbacks.map((feedback, index) => (
                <View key={feedback.id || index}>
                  <View style={styles.feedbackItem}>
                    <Text style={styles.feedbackTutorName}>{feedback.tutorName}</Text>
                    <Text style={styles.feedbackComment}>"{feedback.feedback}"</Text>
                    <Text style={styles.feedbackDate}>
                      {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  {index < feedbacks.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#1B3A5C',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileRole: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#7A9ABF',
    textAlign: 'center',
  },

  // Feedback Section
  feedbackSection: {
    marginBottom: 20,
  },
  feedbackSectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#1B3A5C',
    marginBottom: 16,
  },

  // Empty State
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#1B3A5C',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#7A9ABF',
    textAlign: 'center',
  },

  // Feedback List
  feedbackList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  feedbackItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  feedbackTutorName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#1B3A5C',
    marginBottom: 8,
  },
  feedbackComment: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#5B7A9E',
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 18,
  },
  feedbackDate: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: '#A8C4E0',
  },
  divider: {
    height: 1,
    backgroundColor: '#DDE6F0',
  },

  // Loading and Error States
  loadingText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#7A9ABF',
    marginTop: 12,
  },
  errorTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#1B3A5C',
    marginTop: 12,
    marginBottom: 8,
  },
  errorBody: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#7A9ABF',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2B74B4',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },

  bottomSpacing: {
    height: 20,
  },
});
