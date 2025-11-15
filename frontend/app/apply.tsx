import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ApplyTutorPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // Step 1 - Basic Info
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [courseProgram, setCourseProgram] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Step 2 - Documents
  const [timeAvailableStart, setTimeAvailableStart] = useState('');
  const [timeAvailableEnd, setTimeAvailableEnd] = useState('');
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [reportOfGrades, setReportOfGrades] = useState(null);
  const [certificates, setCertificates] = useState(null);
  const [experience, setExperience] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [error, setError] = useState(false);

  const handleNext = () => {
    if (!name || !studentId || !courseProgram || !email || !phoneNumber || !password) {
      setError(true);
      return;
    }
    
    // Email validation
    if (!email.endsWith('@umak.edu.ph')) {
      alert('Email must end with @umak.edu.ph');
      setError(true);
      return;
    }
    
    // Phone number validation
    if (phoneNumber.length !== 11 || !/^\d+$/.test(phoneNumber)) {
      alert('Phone number must be exactly 11 digits');
      setError(true);
      return;
    }
    
    setError(false);
    setStep(2);
  };

  const handleSubmit = () => {
    if (!timeAvailableStart || !timeAvailableEnd || !reportOfGrades || !experience) {
      setError(true);
      return;
    }
    
    if (!agreedToTerms) {
      alert('Please agree to the User Agreement and Privacy Policy');
      return;
    }

    setError(false);
    alert('Application submitted successfully!');
    router.push('/');
  };

  const pickDocument = async (setter) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
      });
      if (result.type === 'success') {
        setter(result);
      }
    } catch (err) {
      console.log('Error picking document:', err);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to TagakTuro!</Text>
          <Text style={styles.subtitle}>an Online Tutoring Service</Text>
        </View>

        <View style={styles.formContainer}>
          {step === 1 ? (
            <>
              <Text style={styles.formTitle}>Apply as a tutor!</Text>
              <Text style={styles.formSubtitle}>Join the team!</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={[styles.input, error && !name && styles.inputError]}
                  placeholder="Jayson Partido"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#95CDF2"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Student ID</Text>
                <TextInput
                  style={[styles.input, error && !studentId && styles.inputError]}
                  placeholder="K12148008"
                  value={studentId}
                  onChangeText={setStudentId}
                  placeholderTextColor="#95CDF2"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Course and Program</Text>
                <TextInput
                  style={[styles.input, error && !courseProgram && styles.inputError]}
                  placeholder="CCIS - BS COMPUTER SCIENCE"
                  value={courseProgram}
                  onChangeText={setCourseProgram}
                  placeholderTextColor="#95CDF2"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, error && !email && styles.inputError]}
                  placeholder="jpartido.k12148008@umak.edu.ph"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#95CDF2"
                />
                <Text style={styles.helperText}>Must end with @umak.edu.ph</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={[styles.input, error && !phoneNumber && styles.inputError]}
                  placeholder="09672411911"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    // Only allow numbers and limit to 11 digits
                    const numbers = text.replace(/[^0-9]/g, '');
                    if (numbers.length <= 11) {
                      setPhoneNumber(numbers);
                    }
                  }}
                  keyboardType="phone-pad"
                  placeholderTextColor="#95CDF2"
                  maxLength={11}
                />
                <Text style={styles.helperText}>Must be 11 digits</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.passwordInput, error && !password && styles.inputError]}
                    placeholder="ILOVEYOU123"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#95CDF2"
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#2B74B4" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {error && (
                <Text style={styles.errorText}>
                  Missing Detail/s is required!
                </Text>
              )}

              <TouchableOpacity style={styles.submitButton} onPress={handleNext}>
                <Text style={styles.submitButtonText}>Next</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={() => router.push('/tutor-homepage')}>
                <Text style={styles.submitButtonText}>skip</Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Already have an account?{' '}
                  <Text style={styles.link} onPress={() => router.push('/')}>
                    Log in now
                  </Text>
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.formTitle}>Upload your documents</Text>
              <Text style={styles.formSubtitle}>To ensure and verify your credibility</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Time Available</Text>
                <View style={styles.timeInputContainer}>
                  <TouchableOpacity
                    style={[styles.timeInput, error && !timeAvailableStart && styles.inputError]}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Text style={{ color: timeAvailableStart ? '#2B74B4' : '#95CDF2', fontSize: 12 }}>
                      {timeAvailableStart || '8:00 am'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.timeInput, error && !timeAvailableEnd && styles.inputError]}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Text style={{ color: timeAvailableEnd ? '#2B74B4' : '#95CDF2', fontSize: 12 }}>
                      {timeAvailableEnd || '10:00 am'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Start Time Picker */}
                {showStartTimePicker && (
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
                                setTimeAvailableStart(formatted);
                              }
                              setShowStartTimePicker(false);
                            }}
                          />
                          <TouchableOpacity
                            onPress={() => setShowStartTimePicker(false)}
                            style={styles.modalClose}
                          >
                            <Text style={styles.modalCloseText}>Done</Text>
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
                        setShowStartTimePicker(false);
                        if (selected) {
                          const formatted = selected.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          }).toLowerCase();
                          setTimeAvailableStart(formatted);
                        }
                      }}
                    />
                  )
                )}

                {/* End Time Picker */}
                {showEndTimePicker && (
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
                                setTimeAvailableEnd(formatted);
                              }
                              setShowEndTimePicker(false);
                            }}
                          />
                          <TouchableOpacity
                            onPress={() => setShowEndTimePicker(false)}
                            style={styles.modalClose}
                          >
                            <Text style={styles.modalCloseText}>Done</Text>
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
                        setShowEndTimePicker(false);
                        if (selected) {
                          const formatted = selected.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          }).toLowerCase();
                          setTimeAvailableEnd(formatted);
                        }
                      }}
                    />
                  )
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Report of Grades (Last A.Y) <Text style={styles.pdfLabel}>(PDF)</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.uploadButton, error && !reportOfGrades && styles.inputError]}
                  onPress={() => pickDocument(setReportOfGrades)}
                >
                  <Text style={styles.uploadButtonText}>
                    {reportOfGrades ? reportOfGrades.name : '+ UPLOAD DOCUMENT'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Certificates (if any)</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => pickDocument(setCertificates)}
                >
                  <Text style={styles.uploadButtonText}>
                    {certificates ? certificates.name : '+ UPLOAD DOCUMENT'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Experience</Text>
                <TextInput
                  style={[styles.textArea, error && !experience && styles.inputError]}
                  placeholder="Experience Description"
                  value={experience}
                  onChangeText={setExperience}
                  placeholderTextColor="#95CDF2"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.checkboxContainer}>
                <TouchableOpacity onPress={() => setAgreedToTerms(!agreedToTerms)}>
                  <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                    {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>

                <View style={styles.checkboxTextContainer}>
                  <Text style={styles.checkboxLabel}>I have read and agreed to the </Text>
                  <TouchableOpacity>
                    <Text style={styles.link}>User Agreement</Text>
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}> and </Text>
                  <TouchableOpacity>
                    <Text style={styles.link}>Privacy Policy</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {error && (
                <Text style={styles.errorText}>
                  Missing Detail/s is required!
                </Text>
              )}

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>

              <View style={styles.backButton}>
                <TouchableOpacity onPress={() => setStep(1)}>
                  <Text style={styles.back}>← Back</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#2B74B4',
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    height: 250,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: '#fff',
    marginTop: -30,
    borderRadius: 20,
    padding: 30,
    width: '100%',
    alignSelf: 'center',
    alignContent: 'center',
    justifyContent: 'center',
  },
  formTitle: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2B74B4',
    textAlign: 'center',
  },
  formSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: '#2B74B4',
    marginBottom: 6,
  },
  pdfLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
  },
  input: {
    fontFamily: 'Poppins',
    borderWidth: 1,
    borderColor: '#2B74B4',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 12,
    fontWeight: '400',
    color: '#2B74B4',
  },
  inputError: {
    borderColor: '#FF0000',
  },
  timeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  timeInput: {
    fontFamily: 'Poppins',
    borderWidth: 1,
    borderColor: '#2B74B4',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 12,
    fontWeight: '400',
    color: '#2B74B4',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    fontFamily: 'Poppins',
    borderWidth: 1,
    borderColor: '#2B74B4',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingRight: 45,
    fontSize: 12,
    fontWeight: '400',
    color: '#2B74B4',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 12,
  },
  helperText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: '#95CDF2',
    marginTop: 4,
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
  modalCloseText: {
    color: '#2B74B4',
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 12,
  },
  uploadButton: {
    fontFamily: 'Poppins',
    borderWidth: 1,
    borderColor: '#2B74B4',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
    fontWeight: '400',
  },
  textArea: {
    fontFamily: 'Poppins',
    borderWidth: 1,
    borderColor: '#2B74B4',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 12,
    fontWeight: '400',
    color: '#2B74B4',
    height: 100,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 15,
    marginTop: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#2B74B4',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#2B74B4',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#2B74B4',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500',
  },
  submitButton: {
    fontFamily: 'Poppins',
    fontSize: 14,
    backgroundColor: '#2B74B4',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    height: 50,

  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  backButton: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#95CDF2',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2B74B4',
    borderRadius: 8,
  },
  back: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#2B74B4',
    fontWeight: '600',
  },
  footerText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
    marginBottom: 5,
  },
  link: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#2B74B4',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});