import { Stack } from 'expo-router';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Platform, Alert,
} from 'react-native';
import BottomNav from '../components/BottomNav';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createBooking } from '../src/api/booking.js';
import { AxiosError } from 'axios';

export default function BookingPage() {

  const [subject, setSubject] = useState('');
  const [modality, setModality] = useState('');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [openModality, setOpenModality] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentEmail, setStudentEmail] = useState<string | null>(null);

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

  const handleSubmit = async () => {
    if (!studentId || !studentEmail) {
      Alert.alert('Error', 'Student not logged in. Please log in to book a session.');
      return;
    }

    if (!subject || !modality) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate time range
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
      student: { id: studentId }, // Revert to sending the ID
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
    } catch (error: unknown) {
      const err = error as AxiosError;
      const errorMessage = (err.response?.data as { error?: string })?.error || err.message;
      console.error('Error creating booking:', errorMessage);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
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

        {/* Info Card */}
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
              placeholderStyle={{ color: '#95CDF2', fontFamily: 'Poppins', fontSize: 12 }}
              textStyle={{ fontFamily: 'Poppins', fontSize: 12, color: '#2B74B4' }}
              dropDownContainerStyle={{
                borderColor: '#2B74B4',
              }}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text style={{ color: '#2B74B4' }}>{date.toLocaleDateString()}</Text>
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
              <TouchableOpacity style={styles.timeInput} onPress={() => setShowStartPicker(true)}>
                <Text style={{ color: '#2B74B4' }}>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  mode="time"
                  value={startTime}
                  onChange={(event, selected) => {
                    setShowStartPicker(Platform.OS === 'ios');
                    if (selected) setStartTime(selected);
                  }}
                />
              )}
              <Text style={{ color: '#2B74B4', fontWeight: 'bold' }}>to</Text>
              <TouchableOpacity style={styles.timeInput} onPress={() => setShowEndPicker(true)}>
                <Text style={{ color: '#2B74B4' }}>{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  mode="time"
                  value={endTime}
                  onChange={(event, selected) => {
                    setShowEndPicker(Platform.OS === 'ios');
                    if (selected) setEndTime(selected);
                  }}
                />
              )}
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
    fontWeight: '700',
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
    fontSize: 16,
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
    fontSize: 14,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#2B74B4',
    marginBottom: 8,
  },
  successText: {
    fontFamily: 'Poppins',
    fontSize: 14,
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
    fontSize: 14,
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
});
