import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import BottomNav from '../components/BottomNav';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function BookingPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [modality, setModality] = useState('');
  const [date, setDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleSubmit = () => {
    if (subject && modality && date && selectedTime) {
      setBookingSuccess(true);
    } else {
      alert('Please fill in all fields');
    }
  };
  const [openModality, setOpenModality] = useState(false);

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);


  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Book a Tutor</Text>
          <Text style={styles.subtitle}>Find a tutor that fits your needs and schedule!</Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>TagakTuro offers a wide range of topics!</Text>
        </View>

        {/* Booking Form */}
        <View style={styles.formContainer}>
          {/* Subject */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              placeholder="Discrete Structures 2"
              value={subject}
              onChangeText={setSubject}
              placeholderTextColor="#95CDF2"
            />
          </View>

          {/* Modality */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Modality</Text>
            <DropDownPicker
            open={openModality}
              value={modality}
              items={[
                { label: 'Online', value: 'Online' },
                { label: 'In-Person', value: 'In-Person' },
              ]}
            setOpen={setOpenModality}
            setValue={setModality}
            placeholder="Select a modality"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            placeholderStyle={{ color: '#95CDF2' }}
            textStyle={{ color: '#2B74B4', fontFamily: 'Poppins', fontSize: 12 }}
          />
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              placeholder="September 30, 2025"
              value={date}
              onChangeText={setDate}
              placeholderTextColor="#95CDF2"
            />
          </View>

          {/* Preferred Time */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Time</Text>
            <View style={styles.timeInputContainer}>
              <TouchableOpacity
                style={styles.timeInput}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={{ color: startTime ? '#2B74B4' : '#95CDF2', fontSize: 12, alignSelf: 'center' }}>
                  {startTime || '8:00 am'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timeInput}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={{ color: endTime ? '#2B74B4' : '#95CDF2', fontSize: 12, alignSelf: 'center' }}>
                  {endTime || '10:00 am'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Start Picker */}
            {showStartPicker && (
              Platform.OS === 'ios' ? (
                <Modal transparent={true} animationType="fade">
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                      <DateTimePicker
                        mode="time"
                        value={new Date()}
                        is24Hour={false}
                        display="spinner"
                        onChange={(event, selected) => {
                          if (event.type === 'set' && selected) {
                            const formatted = selected.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            }).toLowerCase();
                            setStartTime(formatted);
                          }
                          setShowStartPicker(false);
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => setShowStartPicker(false)}
                        style={styles.modalClose}
                      >
                        <Text style={{ color: '#2B74B4', fontWeight: '600', fontSize: 12, }}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              ) : (
                <DateTimePicker
                  mode="time"
                  value={new Date()}
                  is24Hour={false}
                  display="default"
                  onChange={(event, selected) => {
                    setShowStartPicker(false);
                    if (selected) {
                      const formatted = selected.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      }).toLowerCase();
                      setStartTime(formatted);
                    }
                  }}
                />
              )
            )}

            {/* End Picker */}
            {showEndPicker && (
              Platform.OS === 'ios' ? (
                <Modal transparent={true} animationType="fade">
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                      <DateTimePicker
                        mode="time"
                        value={new Date()}
                        is24Hour={false}
                        display="spinner"
                        onChange={(event, selected) => {
                          if (event.type === 'set' && selected) {
                            const formatted = selected.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            }).toLowerCase();
                            setEndTime(formatted);
                          }
                          setShowEndPicker(false);
                        }}
                      />
                    <TouchableOpacity
                      onPress={() => setShowEndPicker(false)}
                      style={styles.modalClose}
                    >
                      <Text style={{ color: '#2B74B4', fontWeight: '600', fontSize: 12 }}>Done</Text>
                    </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              ) : (
                <DateTimePicker
                  mode="time"
                  value={new Date()}
                  is24Hour={false}
                  display="default"
                  onChange={(event, selected) => {
                    setShowEndPicker(false);
                    if (selected) {
                      const formatted = selected.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      }).toLowerCase();
                      setEndTime(formatted);
                    }
                  }}
                />
              )
            )}
          </View>
        </View>

        {/* Success Message */}
        {bookingSuccess && (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>You booked a session</Text>
            <Text style={styles.successText}>
              We have received your online booking scheduled for September 30, 2025
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Navigation */}
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
    fontSize: 28,
    fontWeight: '700',
    color: '#2B74B4',
    marginBottom: 5,
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
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
    borderWidth: 2,
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
    borderWidth: 2,
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
modalOverlay: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.3)',
},
modalContainer: {
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#2B74B4',
  borderRadius: 15, 
  padding: 20,
  width: '80%',
  alignItems: 'center',
},
modalClose: {
  marginTop: 10,
  borderRadius: 10,
  width: 300,
  height: 40,
  alignItems: 'center',
  justifyContent: 'center',
  borderColor: '#2B74B4',
  borderWidth: 1,
},

});