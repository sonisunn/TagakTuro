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
import { applyAsTutor } from '../src/api/tutor';
import { AxiosError } from 'axios';

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
  const [timeAvailableStart, setTimeAvailableStart] = useState<Date | null>(null);
  const [timeAvailableEnd, setTimeAvailableEnd] = useState<Date | null>(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [reportOfGrades, setReportOfGrades] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [certificates, setCertificates] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [experience, setExperience] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [error, setError] = useState(false);

  const validateName = (name: string): boolean => {
    if (!name.trim()) return false;
    return /^[a-zA-Z\s]+$/.test(name.trim());
  };

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) return false;
    // Must have content before @ and end with @umak.edu.ph
    const emailRegex = /^[^@\s]+@umak\.edu\.ph$/;
    return emailRegex.test(email.trim());
  };

  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone.trim()) return false;
    return phone.length === 11 && /^\d+$/.test(phone);
  };

  const validatePassword = (password: string): boolean => {
    if (!password) return false;
    // 12-16 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special char (^, _, *)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\^\_\*])[A-Za-z\d\^\_\*]{12,16}$/;
    return passwordRegex.test(password);
  };

  const handleNext = () => {
    if (!name || !studentId || !courseProgram || !email || !phoneNumber || !password) {
      setError(true);
      return;
    }

    // Name validation - alphabetic characters only
    if (!validateName(name)) {
      alert('Name must contain only alphabetic characters');
      setError(true);
      return;
    }

    // Email validation - must end with @umak.edu.ph and not just @umak.edu.ph
    if (!validateEmail(email)) {
      alert('Error: Only @umak.edu.ph email addresses are allowed!');
      setError(true);
      return;
    }

    // Phone number validation - must be 11 digits
    if (!validatePhoneNumber(phoneNumber)) {
      alert('Must be 11 digits');
      setError(true);
      return;
    }

    // Password validation - 12-16 chars, mix of upper/lower, number, special char
    if (!validatePassword(password)) {
      alert('Password must be 12-16 characters with at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (^, _, *)');
      setError(true);
      return;
    }

    setError(false);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!timeAvailableStart || !timeAvailableEnd || !reportOfGrades || !experience) {
      setError(true);
      return;
    }

    if (!agreedToTerms) {
      alert('Please agree to the User Agreement and Privacy Policy');
      return;
    }

    setError(false);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('studentId', studentId);
    formData.append('courseProgram', courseProgram);
    formData.append('email', email);
    formData.append('phoneNumber', phoneNumber);
    formData.append('password', password);
    formData.append('experience', experience);
    formData.append('timeAvailableStart', timeAvailableStart.toTimeString().split(' ')[0]); // HH:mm:ss
    formData.append('timeAvailableEnd', timeAvailableEnd.toTimeString().split(' ')[0]); // HH:mm:ss

    if (reportOfGrades) {
      formData.append('reportOfGrades', {
        uri: reportOfGrades.uri,
        name: reportOfGrades.name,
        type: reportOfGrades.mimeType || 'application/octet-stream',
      } as any);
    }
    if (certificates) {
      formData.append('certificates', {
        uri: certificates.uri,
        name: certificates.name,
        type: certificates.mimeType || 'application/octet-stream',
      } as any);
    }

    try {
      await applyAsTutor(formData);
      alert('Application submitted successfully! You will be notified upon approval.');
      router.push('/login');
    } catch (error) {
      const err = error as AxiosError;
      const errorMessage = (err.response?.data as { error?: string })?.error || err.message;
      console.error('Error submitting application:', errorMessage);
      alert('Application failed: ' + errorMessage);
    }
  };

  const pickDocument = async (setter: React.Dispatch<React.SetStateAction<DocumentPicker.DocumentPickerAsset | null>>) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setter(result.assets[0]);
      }
    } catch (err) {
      console.warn('Error picking document:', err);
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
                      {timeAvailableStart ? timeAvailableStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Start Time'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.timeInput, error && !timeAvailableEnd && styles.inputError]}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Text style={{ color: timeAvailableEnd ? '#2B74B4' : '#95CDF2', fontSize: 12 }}>
                      {timeAvailableEnd ? timeAvailableEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'End Time'}
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
                            value={timeAvailableStart || new Date()}
                            mode="time"
                            display="spinner"
                            onChange={(event, selected) => {
                              setShowStartTimePicker(false);
                              if (event.type === 'set' && selected) setTimeAvailableStart(selected);
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
                      value={timeAvailableStart || new Date()}
                      mode="time"
                      display="default"
                      onChange={(event, selected) => {
                        setShowStartTimePicker(false);
                        if (event.type === 'set' && selected) setTimeAvailableStart(selected);
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
                            value={timeAvailableEnd || new Date()}
                            mode="time"
                            display="spinner"
                            onChange={(event, selected) => {
                              setShowEndTimePicker(false);
                              if (event.type === 'set' && selected) setTimeAvailableEnd(selected);
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
                      value={timeAvailableEnd || new Date()}
                      mode="time"
                      display="default"
                      onChange={(event, selected) => {
                        setShowEndTimePicker(false);
                        if (event.type === 'set' && selected) setTimeAvailableEnd(selected);
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
                    {reportOfGrades ? reportOfGrades.name : 'UPLOAD DOCUMENT'}
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
                    {certificates ? certificates.name : 'UPLOAD DOCUMENT (OPTIONAL)'}
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

              <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                <Text style={styles.back}>← Back</Text>
              </TouchableOpacity>
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
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2B74B4',
    borderRadius: 8,
    paddingHorizontal: 20,
    marginTop: 10,
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