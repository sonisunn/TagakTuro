import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFeedbackForUser,
  getFeedbackForBooking,
  submitFeedback,
  FeedbackResponse,
} from '../../src/api/feedback';
import { getUser } from '../../src/api/user';

type ErrorType = 'auth' | 'notFound' | 'network' | null;

export default function TutorFeedbackPage() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const tutorIdString = params.userId as string;
  const bookingIdString = params.bookingId as string;

  const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [studentId, setStudentId] = useState<number | null>(null);
  const [activeTutorName, setActiveTutorName] = useState('Tutor');
  const [tutorRole, setTutorRole] = useState('Tutor');
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [alertModal, setAlertModal] = useState<{ visible: boolean; title: string; body: string }>({
    visible: false, title: '', body: '',
  });

  const handleAuthError = async () => {
    await AsyncStorage.multiRemove(['authToken', 'userData', 'studentId', 'tutorId']);
    router.replace('/login');
  };

  const classifyError = (error: any): { type: ErrorType; message: string } => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      return {
        type: 'auth',
        message: 'You are not authorized to view this. Please log in again.',
      };
    }
    if (status === 404) {
      return { type: 'notFound', message: 'Feedback not found for this user.' };
    }
    if (!error?.response) {
      return {
        type: 'network',
        message: 'Unable to connect. Please check your internet connection.',
      };
    }
    return { type: 'network', message: 'Something went wrong. Please try again.' };
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorType(null);
    setErrorMessage('');

    try {
      let currentReviewerId: number | null = null;

      const storedStudentId = await AsyncStorage.getItem('studentId');
      if (storedStudentId) {
        const id = parseInt(storedStudentId);
        setStudentId(id);
        currentReviewerId = id;
      }

      const storedUserData = await AsyncStorage.getItem('userData');
      let currentName = 'Tutor';
      let currentRole = 'Tutor';
      if (storedUserData) {
        const parsed = JSON.parse(storedUserData);
        if (!currentReviewerId) {
          currentReviewerId = parsed.id;
          setStudentId(parsed.id);
        }
        currentName = parsed.name || 'Tutor';
        currentRole = parsed.role || parsed.specialization || 'Tutor';
      }

      setActiveTutorName((params.name as string) || currentName);
      setTutorRole(currentRole);

      // Load profile photo: fetch from API if viewing another tutor, else from own stored data
      if (tutorIdString) {
        try {
          const tutorUser = await getUser(parseInt(tutorIdString));
          setProfileImageUri(tutorUser.profilePictureUrl || null);
        } catch {}
      } else if (storedUserData) {
        const parsed = JSON.parse(storedUserData);
        setProfileImageUri(parsed.profilePictureUrl || null);
      }

      const targetUserId = tutorIdString ? parseInt(tutorIdString) : currentReviewerId;
      if (targetUserId) {
        const list = await getFeedbackForUser(targetUserId);
        setFeedbacks(list);
      }

      if (bookingIdString && currentReviewerId) {
        const bookingFeedbacks = await getFeedbackForBooking(parseInt(bookingIdString));
        const alreadySubmitted = bookingFeedbacks.some(f => f.reviewerId === currentReviewerId);
        if (alreadySubmitted) {
          setAlreadyRated(true);
        } else {
          setModalVisible(true);
        }
      }
    } catch (e: any) {
      const { type, message } = classifyError(e);
      setErrorType(type);
      setErrorMessage(message);
      if (type === 'auth') {
        await handleAuthError();
      }
    } finally {
      setLoading(false);
    }
  }, [tutorIdString, bookingIdString]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      setAlertModal({ visible: true, title: 'Rating Required', body: 'Please select a star rating before submitting.' });
      return;
    }
    if (!studentId || !bookingIdString || !tutorIdString) {
      setAlertModal({ visible: true, title: 'Error', body: 'Missing required details to submit feedback.' });
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await submitFeedback(studentId, {
        bookingId: parseInt(bookingIdString),
        revieweeId: parseInt(tutorIdString),
        rating,
        comments,
      });
      setFeedbacks(prev => [response, ...prev]);
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2B74B4" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (errorType === 'network') {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="wifi-outline" size={56} color="#95CDF2" />
        <Text style={styles.errorTitle}>No Connection</Text>
        <Text style={styles.errorBody}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLinkButton} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (errorType === 'notFound') {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="person-outline" size={56} color="#95CDF2" />
        <Text style={styles.errorTitle}>Not Found</Text>
        <Text style={styles.errorBody}>{errorMessage}</Text>
        <TouchableOpacity style={styles.backLinkButton} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          {(tutorIdString || bookingIdString) && (
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
          <Text style={styles.profileName}>{activeTutorName}</Text>

          {bookingIdString && (
            alreadyRated ? (
              <View style={styles.alreadyRatedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#0FE40F" />
                <Text style={styles.alreadyRatedText}>Already Rated</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.rateButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.rateButtonText}>Rate Your Tutor</Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackSectionTitle}>Feedback from Student</Text>
          <View style={styles.feedbackList}>
            {feedbacks.length === 0 ? (
              <Text style={[styles.feedbackComment, { textAlign: 'center', paddingVertical: 20 }]}>
                No reviews for this tutor yet.
              </Text>
            ) : feedbacks.map((feedback, index) => (
              <View key={feedback.id}>
                <View style={styles.feedbackItem}>
                  <Text style={styles.feedbackName}>{feedback.reviewerName || 'Student'}</Text>
                  {feedback.comments ? (
                    <Text style={styles.feedbackComment}>"{feedback.comments}"</Text>
                  ) : (
                    <Text style={[styles.feedbackComment, { opacity: 0.5 }]}>No written comments.</Text>
                  )}
                </View>
                {index < feedbacks.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
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
            <Text style={styles.modalTitle}>Rate Your Tutor</Text>
            <Text style={styles.modalSubTitle}>How was your session with {activeTutorName}?</Text>

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
  loadingText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#95CDF2',
    marginTop: 8,
  },
  errorTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
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
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  retryButtonText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  backLinkButton: {
    paddingVertical: 8,
  },
  backLinkText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#95CDF2',
    textDecorationLine: 'underline',
  },
  scrollView: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 20,
    zIndex: 10,
  },
  profileSection: {
    backgroundColor: '#fff',
    paddingTop: 50,
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
  profileImageContainer: {
    marginTop: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileName: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600',
    color: '#2B74B4',
    marginBottom: 3,
  },
  rateButton: {
    backgroundColor: '#FCC419',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
  },
  rateButtonText: {
    fontFamily: 'Poppins',
    fontWeight: '600',
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
  },
  alreadyRatedText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: '#0FE40F',
  },
  feedbackSection: {
    marginTop: 25,
    marginHorizontal: 20,
    marginBottom: 100,
  },
  feedbackSectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
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
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: '#2B74B4',
    marginBottom: 5,
  },
  feedbackComment: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#777',
    fontStyle: 'italic',
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 5,
  },
  bottomSpacing: {
    height: 100,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
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
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '600',
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
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 16,
  },
  modalBtnTextBlue: {
    color: '#2B74B4',
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
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
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
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
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
