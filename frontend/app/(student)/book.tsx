import { Stack } from 'expo-router';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Alert, Modal
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { createBooking } from '../../src/api/booking.js';
import { getStudentById } from '../../src/api/student.js';

export default function BookingPage() {

  const [subject, setSubject] = useState('');
  const [modality, setModality] = useState('');
  const [venue, setVenue] = useState('');
  const [alertModal, setAlertModal] = useState({ visible: false, title: '', body: '' });

  // -- Date State --
  const [date, setDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  // -- Time State --
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState(null); // 'start' or 'end'
  const [tempTime, setTempTime] = useState(new Date());

  const [openModality, setOpenModality] = useState(false);
  const [openVenue, setOpenVenue] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);

  const [validationErrors, setValidationErrors] = useState({
    subject: false,
    modality: false,
    venue: false,
  });
  const [showValidationError, setShowValidationError] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedStudentId = await AsyncStorage.getItem('studentId');
        console.log('[BookingPage] Loaded studentId from storage:', storedStudentId);
        if (storedStudentId) {
          setStudentId(storedStudentId);
          return;
        }

        // Fallback: if studentId is not in storage, try to fetch it using the user's email
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsedData = JSON.parse(userData);
          if (parsedData.email) {
            console.log('[BookingPage] No studentId in storage, trying API lookup for:', parsedData.email);
            try {
              const { getStudentByEmail } = await import('../src/api/student.js');
              const student = await getStudentByEmail(parsedData.email);
              if (student?.id) {
                const id = student.id.toString();
                await AsyncStorage.setItem('studentId', id);
                setStudentId(id);
                console.log('[BookingPage] Fetched and stored studentId from API:', id);
              }
            } catch (apiError) {
              console.warn('[BookingPage] Could not fetch studentId from API:', apiError);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load user data', error);
      }
    };
    loadUserData();
  }, []);

  // Reset venue when modality changes
  useEffect(() => {
    if (modality !== 'In-Person') {
      setVenue('');
      setValidationErrors(prev => ({ ...prev, venue: false }));
    }
  }, [modality]);

  // Dropdown management
  useEffect(() => { if (openModality) setOpenVenue(false); }, [openModality]);
  useEffect(() => { if (openVenue) setOpenModality(false); }, [openVenue]);

  const clearFieldError = (field) => {
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const updated = { ...prev, [field]: false };
        const hasErrors = Object.values(updated).some(error => error);
        setShowValidationError(hasErrors);
        return updated;
      });
    }
  };

  const validateFields = () => {
    const errors = {
      subject: !subject.trim(),
      modality: !modality,
      venue: modality === 'In-Person' && !venue,
    };
    setValidationErrors(errors);
    setShowValidationError(Object.values(errors).some(error => error));
    return !Object.values(errors).some(error => error);
  };

  // --- Date Picker Handlers ---
  const openDatePicker = () => {
    setTempDate(date); // Initialize temp date with current selection
    setShowDateModal(true);
  };

  const onDateChange = (event, selectedDate) => {
    if (selectedDate) setTempDate(selectedDate);
  };

  const saveDateSelection = () => {
    setDate(tempDate);
    setShowDateModal(false);
  };

  // --- Time Picker Handlers (Fixed Missing Functions) ---
  const openTimePicker = (mode) => {
    setTimePickerMode(mode);
    // Initialize temp time based on which box was clicked
    setTempTime(mode === 'start' ? startTime : endTime);
    setShowTimeModal(true);
  };

  const onTimeChange = (event, selectedTime) => {
    if (selectedTime) setTempTime(selectedTime);
  };

  const saveTimeSelection = () => {
    if (timePickerMode === 'start') {
      setStartTime(tempTime);
    } else {
      setEndTime(tempTime);
    }
    setShowTimeModal(false);
  };

  const handleSubmit = async () => {
    if (!studentId) {
      Alert.alert('Error', 'Student not logged in. Please log in to book a session.');
      return;
    }

    if (!validateFields()) return;

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
      setAlertModal({ visible: true, title: 'Invalid Time', body: 'End time must be after start time.' });
      return;
    }

    const startMins = bookingStart.getHours() * 60 + bookingStart.getMinutes();
    const endMins = bookingEnd.getHours() * 60 + bookingEnd.getMinutes();
    if (startMins < 8 * 60) {
      setAlertModal({ visible: true, title: 'Invalid Time', body: 'Sessions must start at or after 8:00 AM.' });
      return;
    }
    if (endMins > 17 * 60) {
      setAlertModal({ visible: true, title: 'Invalid Time', body: 'Sessions must end by 5:00 PM.' });
      return;
    }
    if (durationMinutes > 180) {
      setAlertModal({ visible: true, title: 'Invalid Duration', body: 'Sessions cannot exceed 3 hours.' });
      return;
    }

    const pad = (n: number) => n < 10 ? '0' + n : String(n);
    const localIso = bookingStart.getFullYear() + '-' +
      pad(bookingStart.getMonth() + 1) + '-' +
      pad(bookingStart.getDate()) + 'T' +
      pad(bookingStart.getHours()) + ':' +
      pad(bookingStart.getMinutes()) + ':00';

    const bookingData = {
      student: { id: studentId },
      subject: subject,
      bookingDateTime: localIso,
      modality,
      venue: modality === 'In-Person' ? venue : null,
      notes: null,
      status: 'PENDING',
      durationMinutes,
    };

    try {
      await createBooking(bookingData);
      setBookingSuccess(true);
    } catch (error) {
      const err = error;
      const errorMessage = (err.response?.data)?.error || err.message;

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
          <Text style={styles.infoText}>TagakTuro offers a wide range of topics!</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={[styles.input, validationErrors.subject && styles.inputError]}
              placeholder="e.g., Calculus, Web Development"
              value={subject}
              onChangeText={(text) => {
                setSubject(text);
                if (text.trim()) clearFieldError('subject');
              }}
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
              style={[styles.dropdown, validationErrors.modality && styles.dropdownError]}
              placeholder="Select a modality"
              placeholderStyle={styles.placeholderStyle}
              textStyle={styles.dropdownText}
              dropDownContainerStyle={{
                borderColor: validationErrors.modality ? '#FF0000' : '#2B74B4',
              }}
              zIndex={2000}
              zIndexInverse={1000}
            />
          </View>

          {modality === 'Online' && (
            <View style={styles.onlineInfoBox}>
              <Text style={styles.onlineInfoText}>
                The meeting room will be generated once booked and can be seen through the homepage
              </Text>
            </View>
          )}

          {modality === 'In-Person' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Venue</Text>
              <DropDownPicker
                listMode="SCROLLVIEW"
                open={openVenue}
                value={venue}
                items={[
                  { label: 'OPVSSCD Conference Room', value: 'OPVSSCD Conference Room' },
                  { label: 'Library', value: 'Library' },
                ]}
                setOpen={setOpenVenue}
                setValue={setVenue}
                style={[styles.dropdown, validationErrors.venue && styles.dropdownError]}
                placeholder="Select a venue"
                placeholderStyle={styles.placeholderStyle}
                textStyle={styles.dropdownText}
                dropDownContainerStyle={{
                  borderColor: validationErrors.venue ? '#FF0000' : '#2B74B4',
                }}
                zIndex={1000}
                zIndexInverse={2000}
              />
            </View>
          )}

          {/* DATE PICKER (Updated to use Modal) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity style={styles.input} onPress={openDatePicker}>
              <Text style={{ color: '#2B74B4', fontWeight: '600', fontSize: 12 }}>
                {date.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* TIME PICKER */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time</Text>
            <View style={styles.timeInputContainer}>
              <TouchableOpacity style={styles.timeInput} onPress={() => openTimePicker('start')}>
                <Text style={{ color: '#2B74B4', fontWeight: '600', fontSize: 12 }}>
                  {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>

              <Text style={{ color: '#2B74B4', fontWeight: '600', fontSize: 12 }}>to</Text>

              <TouchableOpacity style={styles.timeInput} onPress={() => openTimePicker('end')}>
                <Text style={{ color: '#2B74B4', fontWeight: '600', fontSize: 12 }}>
                  {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {showValidationError && (
          <Text style={styles.errorMessage}>
            Some information is missing. Please review the form and provide the required details.
          </Text>
        )}

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

      {/* --- DATE PICKER MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDateModal}
        onRequestClose={() => setShowDateModal(false)}
      >
        <BlurView intensity={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              textColor="#000"
              style={styles.picker}
            />
            <TouchableOpacity style={styles.closeModalButton} onPress={saveDateSelection}>
              <Text style={styles.closeModalText}>Select Date</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* --- ALERT MODAL --- */}
      <Modal animationType="fade" transparent={true} visible={alertModal.visible} onRequestClose={() => setAlertModal({ visible: false, title: '', body: '' })}>
        <BlurView intensity={20} tint="light" style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>{alertModal.title}</Text>
            <Text style={styles.alertBody}>{alertModal.body}</Text>
            <TouchableOpacity style={styles.alertButton} onPress={() => setAlertModal({ visible: false, title: '', body: '' })}>
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* --- TIME PICKER MODAL --- */}
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
              <Text style={styles.closeModalText}>Select Time</Text>
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
  inputError: {
    borderColor: '#FF0000',
  },
  dropdownError: {
    borderColor: '#FF0000',
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
    marginBottom: 3,
  },
  successText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '700',
    color: '#95CDF2',
  },
  errorMessage: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: '#FF0000',
    textAlign: 'center',
    marginHorizontal: 20,
    marginTop: 10,
  },
  submitContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
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
  onlineInfoBox: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#95CDF2',
    borderRadius: 8,
    backgroundColor: '#f0f7fc',
    padding: 12,
    marginBottom: 20,
  },
  onlineInfoText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#2B74B4',
    fontWeight: '500',
    textAlign: 'center',
  },
  dropdown: {
    borderColor: '#2B74B4',
    borderRadius: 8,
  },
  placeholderStyle: {
    color: '#95CDF2',
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600'
  },
  dropdownText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#2B74B4',
    fontWeight: '600'
  },
  // Alert Modal
  alertOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
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