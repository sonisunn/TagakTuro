import { Stack, useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  getFeedbackForUser,
  getFeedbackForBooking,
  submitFeedback,
  FeedbackResponse,
} from '../../src/api/feedback';
import { getUser } from '../../src/api/user';

type ErrorType = 'auth' | 'network' | null;

export default function StudentFeedbackTab() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // When a tutor navigates here to view/rate a student these params are set
  const targetUserIdParam = params.userId as string | undefined;
  const targetNameParam = params.name as string | undefined;
  const bookingIdParam = params.bookingId as string | undefined;
  const isViewingOther = !!targetUserIdParam;

  const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Own-tab view state
  const [studentName, setStudentName] = useState('Student');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

  // Cross-user view state (tutor viewing student)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState('Student');
  const [alreadyRated, setAlreadyRated] = useState(false);

  // Rating modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [alertModal, setAlertModal] = useState<{ visible: boolean; title: string; body: string }>({
    visible: false, title: '', body: '',
  });

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
      if (!storedUserData) return;
      const userData = JSON.parse(storedUserData);
      setCurrentUserId(userData.id);

      if (isViewingOther) {
        // Tutor (or any user) viewing another student's profile
        const uid = parseInt(targetUserIdParam!);
        setTargetUserId(uid);
        setDisplayName(targetNameParam || 'Student');

        try {
          const user = await getUser(uid);
          setProfileImageUri(user.profilePictureUrl || null);
        } catch {}

        const feedbackList = await getFeedbackForUser(uid);
        setFeedbacks(feedbackList || []);

        if (bookingIdParam) {
          const bookingFeedbacks = await getFeedbackForBooking(parseInt(bookingIdParam));
          const alreadySubmitted = bookingFeedbacks.some((f) => f.reviewerId === userData.id);
          setAlreadyRated(alreadySubmitted);
          if (!alreadySubmitted) {
            setModalVisible(true);
          }
        }
      } else {
        // Student viewing their own feedback tab
        setStudentName(userData.name || 'Student');
        setDisplayName(userData.name || 'Student');
        setProfileImageUri(userData.profilePictureUrl || null);
        setTargetUserId(userData.id);

        if (userData.id) {
          const feedbackList = await getFeedbackForUser(userData.id);
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
  }, [isViewingOther, targetUserIdParam, targetNameParam, bookingIdParam]);

  useFocusEffect(
    useCallback(() => {
      loadFeedback();
    }, [loadFeedback])
  );

  const handleSubmitReview = async () => {
    if (rating === 0) {
      setAlertModal({ visible: true, title: 'Rating Required', body: 'Please select a star rating before submitting.' });
      return;
    }
    if (!currentUserId || !bookingIdParam || !targetUserId) {
      setAlertModal({ visible: true, title: 'Error', body: 'Missing required details to submit feedback.' });
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await submitFeedback(currentUserId, {
        bookingId: parseInt(bookingIdParam),
        revieweeId: targetUserId,
        rating,
        comments,
      });
      setFeedbacks((prev) => [response, ...prev]);
      setModalVisible(false);
      setAlreadyRated(true);
      setRating(0);
      setComments('');
      setAlertModal({ visible: true, title: 'Review Submitted!', body: 'Your review has been published.' });
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        setModalVisible(false);
        await handleAuthError();
        return;
      }
      const msg = error?.response?.data?.error || 'Failed to submit your review. Please try again.';
      setAlertModal({ visible: true, title: 'Error', body: msg });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!fontsLoaded) return null;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#2B74B4" />
        <Text style={styles.loadingText}>Loading feedback...</Text>
      </View>
    );
  }

  if (errorType === 'network') {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="wifi-outline" size={56} color="#95CDF2" />
        <Text style={styles.errorTitle}>No Connection</Text>
        <Text style={styles.errorBody}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadFeedback}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          {isViewingOther && (
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="#2B74B4" />
            </TouchableOpacity>
          )}

          <View style={styles.profileImageContainer}>
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
            ) : (
              <Ionicons name="person-circle" size={120} color="#2B74B4" />
            )}
          </View>
          <Text style={styles.profileName}>{isViewingOther ? displayName : studentName}</Text>

          {isViewingOther && bookingIdParam && (
            alreadyRated ? (
              <View style={styles.alreadyRatedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#0FE40F" />
                <Text style={styles.alreadyRatedText}>Already Rated</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.rateButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.rateButtonText}>Rate This Student</Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {/* Feedback List */}
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackSectionTitle}>
            {isViewingOther ? 'Feedback from Tutor' : 'Feedback from Tutor'}
          </Text>
          <View style={styles.feedbackList}>
            {feedbacks.length === 0 ? (
              <Text style={[styles.feedbackComment, { textAlign: 'center', paddingVertical: 20 }]}>
                No feedback received yet.
              </Text>
            ) : (
              feedbacks.map((feedback, index) => (
                <View key={feedback.id || index}>
                  <View style={styles.feedbackItem}>
                    <Text style={styles.feedbackName}>{feedback.reviewerName || 'Tutor'}</Text>
                    {feedback.comments ? (
                      <Text style={styles.feedbackComment}>"{feedback.comments}"</Text>
                    ) : (
                      <Text style={[styles.feedbackComment, { opacity: 0.5 }]}>No written comments.</Text>
                    )}
                  </View>
                  {index < feedbacks.length - 1 && <View style={styles.divider} />}
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Rating Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <BlurView intensity={20} tint="dark" style={styles.absolute}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate This Student</Text>
            <Text style={styles.modalSubTitle}>How was your session with {displayName}?</Text>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color="#FCC419"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.textInput}
              placeholder="Share details of your experience (optional)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={comments}
              onChangeText={setComments}
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalSubmitButton, submitLoading && styles.disabledButton]}
                onPress={handleSubmitReview}
                disabled={submitLoading}
              >
                <Text style={styles.modalBtnTextWhite}>
                  {submitLoading ? 'Submitting...' : 'Submit Review'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalReturnButton, submitLoading && styles.disabledButton]}
                onPress={() => setModalVisible(false)}
                disabled={submitLoading}
              >
                <Text style={styles.modalBtnTextBlue}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* Alert Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={alertModal.visible}
        onRequestClose={() => setAlertModal({ visible: false, title: '', body: '' })}
      >
        <BlurView intensity={20} tint="light" style={styles.absolute}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>{alertModal.title}</Text>
            <Text style={styles.alertBody}>{alertModal.body}</Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => setAlertModal({ visible: false, title: '', body: '' })}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 30,
    gap: 12,
  },
  scrollView: {
    flex: 1,
  },

  // Profile Section
  profileSection: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 25,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 20,
    zIndex: 10,
  },
  profileImageContainer: {
    marginBottom: 8,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#2B74B4',
    marginBottom: 2,
    textAlign: 'center',
  },
  rateButton: {
    backgroundColor: '#FCC419',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 14,
  },
  rateButtonText: {
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
    fontSize: 14,
  },
  alreadyRatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8E8',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginTop: 14,
  },
  alreadyRatedText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#0FE40F',
  },

  // Feedback Section
  feedbackSection: {
    marginTop: 25,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  feedbackSectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#2B74B4',
    marginBottom: 15,
  },
  feedbackList: {
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#95CDF2',
    padding: 20,
  },
  feedbackItem: {
    paddingVertical: 10,
  },
  feedbackName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#2B74B4',
  },
  feedbackComment: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#777',
    fontStyle: 'italic',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 5,
  },

  // Rating Modal
  absolute: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0, right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#2B74B4',
  },
  modalSubTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#95CDF2',
    textAlign: 'center',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  textInput: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 15,
    height: 100,
    textAlignVertical: 'top',
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#333',
    marginBottom: 25,
  },
  modalButtonContainer: {
    width: '100%',
    gap: 10,
  },
  modalSubmitButton: {
    backgroundColor: '#2B74B4',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
  },
  modalReturnButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#95CDF2',
    width: '100%',
  },
  modalBtnTextWhite: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
  modalBtnTextBlue: {
    color: '#2B74B4',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },

  // Alert Modal
  alertCard: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2B74B4',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  alertTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#2B74B4',
    textAlign: 'center',
    marginBottom: 10,
  },
  alertBody: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#95CDF2',
    textAlign: 'center',
    marginBottom: 24,
  },
  alertButton: {
    backgroundColor: '#2B74B4',
    borderRadius: 10,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  alertButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#fff',
  },

  // Loading and Error States
  loadingText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#95CDF2',
    marginTop: 8,
  },
  errorTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#2B74B4',
    textAlign: 'center',
  },
  errorBody: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#95CDF2',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2B74B4',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 8,
  },
  retryButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#fff',
  },

  bottomSpacing: {
    height: 100,
  },
});
