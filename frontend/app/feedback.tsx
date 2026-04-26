import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../components/BottomNav';
import { getFeedbackForUser, submitFeedback, FeedbackResponse } from '../src/api/feedback';

export default function StudentFeedbackPage() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // The user ID of the student we are viewing
  const studentUserIdString = params.userId as string;
  // If the tutor came here directly from a completed class linking to rate
  const bookingIdString = params.bookingId as string;

  const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tutorUserId, setTutorUserId] = useState<number | null>(null);
  const [activeStudentName, setActiveStudentName] = useState('Student');
  const [studentRole, setStudentRole] = useState('Student');

  const [modalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        let currentUserId = null;
        let currentName = 'Student';
        let currentRole = 'Student';
        if (storedUserData) {
          const parsed = JSON.parse(storedUserData);
          setTutorUserId(parsed.id);
          currentUserId = parsed.id;
          currentName = parsed.name || 'Student';
          currentRole = parsed.role || parsed.year || 'Student';
        }

        const targetUserId = studentUserIdString ? parseInt(studentUserIdString) : currentUserId;
        setActiveStudentName((params.name as string) || currentName);
        setStudentRole(currentRole);

        if (targetUserId) {
          const list = await getFeedbackForUser(targetUserId);
          setFeedbacks(list);
        }
      } catch (e) {
        console.warn('Failed to load feedback', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [studentUserIdString]);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a star rating first.');
      return;
    }
    if (!tutorUserId || !bookingIdString || !studentUserIdString) {
      Alert.alert('Error', 'Missing required details to submit feedback.');
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await submitFeedback(tutorUserId, {
        bookingId: parseInt(bookingIdString),
        revieweeId: parseInt(studentUserIdString),
        rating: rating,
        comments: comments
      });
      // Add the new feedback directly to the UI
      setFeedbacks([response, ...feedbacks]);
      setModalVisible(false);
      setRating(0);
      setComments('');
      Alert.alert('Success', 'Your review has been published!');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit your review. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getAverageRating = () => {
    if (feedbacks.length === 0) return 0;
    const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0);
    return (sum / feedbacks.length).toFixed(1);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#2B74B4" />
          </TouchableOpacity>
          <View style={styles.profileImageContainer}>
            <Ionicons name="person-circle" size={150} color="#2B74B4" />
          </View>
          <Text style={styles.profileName}>{activeStudentName}</Text>
          <Text style={styles.profileRole}>{studentRole}</Text>

          <View style={styles.ratingContainer}>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={24}
                  color="#FCC419"
                  style={{ marginHorizontal: 3 }}
                />
              ))}
            </View>
            <Text style={styles.ratingValue}>
              ({feedbacks.length > 0 ? getAverageRating() : '0'})
            </Text>
          </View>
        </View>

        {/* Feedback Section */}
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackSectionTitle}>Recent Feedback from students</Text>

          <View style={styles.feedbackList}>
            {loading ? (
              <ActivityIndicator size="large" color="#2B74B4" style={{ padding: 20 }} />
            ) : feedbacks.length === 0 ? (
              <Text style={[styles.feedbackComment, { textAlign: 'center', paddingVertical: 20 }]}>
                No feedback found for this student.
              </Text>
            ) : feedbacks.map((feedback, index) => (
              <View key={feedback.id}>
                <View style={styles.feedbackItem}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.feedbackName}>{feedback.reviewerName || 'Tutor'}</Text>
                    <View style={{ flexDirection: 'row' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= feedback.rating ? "star" : "star-outline"}
                          size={12}
                          color="#FCC419"
                        />
                      ))}
                    </View>
                  </View>
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

      {/* Review Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <BlurView intensity={20} tint="dark" style={styles.absolute}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate Your Student</Text>
            <Text style={styles.modalSubTitle}>How was {activeStudentName} during the session?</Text>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
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
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 20,
    zIndex: 10,
  },
  profileSection: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 20,
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
    position: 'relative',
    marginTop: 10,
  },
  profileName: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600',
    color: '#2B74B4',
    marginBottom: 3,
  },
  profileRole: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#95CDF2',
    marginBottom: 12,
  },
  ratingContainer: {
    alignItems: 'center',
    gap: 8,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#FCC419',
    fontSize: 14,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 5,
  },
  ratingBadgeText: {
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#2B74B4',
    marginLeft: 5,
    fontSize: 14,
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
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  feedbackTitle: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '600',
    color: '#2B74B4',
  },
  rateButton: {
    backgroundColor: '#FCC419',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rateButtonText: {
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#fff',
    fontSize: 12,
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
    flex: 1,
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
});