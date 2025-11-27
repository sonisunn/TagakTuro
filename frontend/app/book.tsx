import { Stack } from 'expo-router';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Platform, Alert, Modal
} from 'react-native';
import BottomNav from '../components/BottomNav';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur'; // Added import
import { createBooking } from '../src/api/booking.js';
import { getStudentById } from '../src/api/student.js';
import { AxiosError } from 'axios';

export default function BookingPage() {

  const [subject, setSubject] = useState('');
  const [modality, setModality] = useState('');
  const [date, setDate] = useState(new Date());
  
  // Time State
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  // Date Picker State (Kept original logic for Calendar Date)
  const [showDatePicker, setShowDatePicker] = useState(false);

  // New Modal Time Picker State
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState(null); // 'start' or 'end'
  const [tempTime, setTempTime] = useState(new Date());

  const [openModality, setOpenModality] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [studentId, setStudentId] = useState(null);
  const [studentEmail, setStudentEmail] = useState(null);

  useEffect(() => {
            const loadUserData = async () => {
              try {
                const userData = await AsyncStorage.getItem('userData');
                const storedStudentId = await AsyncStorage.getItem('studentId');
                if (userData) {
                  const parsedData = JSON.parse(userData);
                  setStudentEmail(parsedData.email);
                }
                if (storedStudentId) {
                  setStudentId(storedStudentId);
                }
              } catch (error) {
                console.error('Failed to load user data', error);
              }
            };    loadUserData();
  }, []);

  // --- Modal Time Picker Logic ---
  const openTimePicker = (mode) => {
    setTimePickerMode(mode);
    // Set temp time to currently selected time for that mode
    setTempTime(mode === 'start' ? startTime : endTime);
    setShowTimeModal(true);
  };

  const onTimeChange = (event, selectedDate) => {
    if (selectedDate) {
      setTempTime(selectedDate);
    }
  };

  const saveTimeSelection = () => {
    if (timePickerMode === 'start') {
      setStartTime(tempTime);
    } else {
      setEndTime(tempTime);
    }
    setShowTimeModal(false);
  };
  // -------------------------------

  const handleSubmit = async () => {
    if (!studentId || !studentEmail) {
      Alert.alert('Error', 'Student not logged in. Please log in to book a session.');
      return;
    }

    if (!subject || !modality) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await getStudentById(studentId);
    } catch (error) {
      console.error('Student validation failed:', error);
      await AsyncStorage.removeItem('studentId');
      Alert.alert('Session Expired', 'Your student session is invalid. Please log in again.');
      return;
    }

    const bookingStart = new Date(date);
    bookingStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    const bookingEnd = new Date(date);
    bookingEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    const durationMinutes = Math.round((bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60));
    if (durationMinutes <= 0) {
      Alert.alert('Error', 'End time must be after start time.');
      return;
    }

    const bookingData = {
      student: { id: studentId },
      subject: subject,
      bookingDateTime: bookingStart.toISOString(),
      modality,
      notes: null,
      status: 'PENDING',
      durationMinutes,
    };

    console.log('Sending booking data:', bookingData);

    try {
      await createBooking(bookingData);
      setBookingSuccess(true);
    } catch (error) {
      const err = error;
      const errorMessage = (err.response?.data)?.error || err.message;
      console.error('Error creating booking:', errorMessage);
      
      if (errorMessage && (errorMessage.includes('FK95ehd6idg3lvmpah7byi8pfwc') || errorMessage.includes('Student not found'))) {
        await AsyncStorage.removeItem('studentId');
        Alert.alert('Session Expired', 'Your student session is invalid. Please log in again.');
        return;
      }
      if (errorMessage && errorMessage.includes('overlaps with an existing booking')) {
        Alert.alert('Booking Conflict', errorMessage);
      } else {
        Alert.alert('Error', errorMessage || 'Failed to create booking. Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Book a Tutor</Text>
          <Text style={styles.subtitle}>Find a tutor that fits your needs and schedule!</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            TagakTuro offers a wide range of topics!
          </Text>
        </View>


        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Calculus, Web Development"
              value={subject}
              onChangeText={setSubject}
              placeholderTextColor="#95CDF2"
              
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Modality</Text>
            <DropDownPicker
              listMode="SCROLLVIEW"
              open={openModality}
              value={modality}
              items={[
                { label: 'Online', value: 'Online' },
                { label: 'In-Person', value: 'In-Person' },
              ]}
              setOpen={setOpenModality}
              setValue={setModality}
              style={styles.dropdown}
              placeholder="Select a modality"
              placeholderStyle={{ color: '#95CDF2', fontFamily: 'Poppins', fontSize: 12, fontWeight: '600',}}
              textStyle={{ fontFamily: 'Poppins', fontSize: 12, color: '#2B74B4', fontWeight:'600',}}
              dropDownContainerStyle={{
                borderColor: '#2B74B4',
              }}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text style={{ color: '#2B74B4', fontWeight: '600', fontSize: 12 }}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                mode="date"
                value={date}
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time</Text>
            <View style={styles.timeInputContainer}>
              
              {/* Start Time Trigger */}
              <TouchableOpacity style={styles.timeInput} onPress={() => openTimePicker('start')}>
                <Text style={{ color: '#2B74B4', fontWeight: '600', fontSize: 12}}>
                  {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              
              <Text style={{ color: '#2B74B4', fontWeight: '600', fontSize: 12 }}>to</Text>
              
              {/* End Time Trigger */}
              <TouchableOpacity style={styles.timeInput} onPress={() => openTimePicker('end')}>
                <Text style={{ color: '#2B74B4', fontWeight: '600', fontSize: 12 }}>
                  {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        </View>

        {bookingSuccess && (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Booking Successful!</Text>
            <Text style={styles.successText}>
              Your booking request has been sent. You will be notified once a tutor accepts your request.
            </Text>
          </View>
        )}

        <View style={styles.submitContainer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Booking Request</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showTimeModal}
        onRequestClose={() => setShowTimeModal(false)}
      >
        <BlurView intensity={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select {timePickerMode === 'start' ? 'Start' : 'End'} Time
            </Text>
            
            <DateTimePicker
              value={tempTime}
              mode="time"
              display="spinner"
              is24Hour={false}
              onChange={onTimeChange}
              textColor="#000"
              style={styles.picker}
            />

            <TouchableOpacity style={styles.closeModalButton} onPress={saveTimeSelection}>
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
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
  header: {
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600',
    color: '#2B74B4',
    marginBottom: 5,
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
  },
  infoCard: {
    backgroundColor: '#2B74B4',
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 15,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2B74B4',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '600',
    color: '#2B74B4',
    marginBottom: 5,
  },
  input: {
    fontFamily: 'Poppins',
    borderWidth: 1,
    borderColor: '#2B74B4',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 12,
    color: '#2B74B4',
    fontWeight: '600',
    width: '100%',
  },
  timeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    width: '100%',
  },
  timeInput: {
    fontFamily: 'Poppins',
    borderWidth: 1,
    borderColor: '#2B74B4',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2B74B4',
    flex: 1,
    textAlign: 'center',
  },
  successCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2B74B4',
  },
  successTitle: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '600',
    color: '#2B74B4',
    marginBottom: 8,
  },
  successText: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '600',
    color: '#95CDF2',
    lineHeight: 20,
  },
  submitContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#2B74B4',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpacing: {
    height: 100,
  },
  dropdown: {
    borderColor: '#2B74B4',
    borderRadius: 8,
  },
  dropdownContainer: {
    borderColor: '#2B74B4',
  },
  // Modal Styles
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2B74B4',
  },
  modalTitle: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '600',
    color: '#2B74B4',
    marginBottom: 10,
  },
  picker: {
    width: '100%',
    height: 150,
  },
  closeModalButton: {
    marginTop: 10,
    backgroundColor: '#2B74B4',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  closeModalText: {
    color: '#fff',
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 15,
  },
});