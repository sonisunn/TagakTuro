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
import { signup } from '../src/api/auth';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

export default function TagakTuroSignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [courseProgram, setCourseProgram] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleSubmit = async () => {
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

    if (!agreedToTerms) {
      alert('Please agree to the User Agreement and Privacy Policy');
      return;
    }

    setError(false);
    setSubmitting(true);

    try {
      // TODO: Add a role selection UI for student/tutor
      const userData = { name, studentId, courseProgram, email, phoneNumber, password, role: 'STUDENT' };
      await signup(userData);
      setSubmitting(false);
      alert('Registration successful! You can now log in.');
      router.push('/');
    } catch (err: any) {
      setSubmitting(false);
      console.warn('Signup error', err);
      alert('Registration failed: ' + (err.message || 'An unexpected error occurred.'));
    }
  };

  const [submitting, setSubmitting] = React.useState(false);

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
          <Text style={styles.formTitle}>Sign up now!</Text>
          <Text style={styles.formSubtitle}>Create an account to get started</Text>

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
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, error && !phoneNumber && styles.inputError]}
              placeholder="09672411911"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              placeholderTextColor="#95CDF2"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.passwordInput,
                  error && !password && styles.inputError
                ]}
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

          <View style={styles.checkboxContainer}>
            <TouchableOpacity onPress={() => setAgreedToTerms(!agreedToTerms)}>
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>

            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxLabel}>I have read and agreed to the </Text>
              <TouchableOpacity onPress={() => setTermsModalVisible(true)}>
                <Text style={styles.link}>User Agreement</Text>
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}> and </Text>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(true)}>
                <Text style={styles.link}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* User Agreement Modal */}
          <Modal
            visible={termsModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setTermsModalVisible(false)}
          >
            <BlurView intensity={15} style={styles.blurBackground}>
              <View style={styles.modalContainer}>
                <ScrollView style={styles.modalScroll}>
                  <Text style={styles.modalTitle}>Terms and Condition</Text>
                  
                  <Text style={styles.modalIntro}>
                  Welcome to TagakTuro: Tutor Services for UMak Students. By using our application, you agree to the following Terms and Conditions. Please read them carefully.
                  </Text>

                  <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                  <Text style={styles.sectionText}>
                  By accessing or using our tutoring platform, you confirm that you have read, understood, and agree to comply with these Terms and Conditions and any future updates. If you disagree, please refrain from using the Service. Electronic signatures, One-Time Passwords (OTPs), and other electronic confirmations are legally binding under the Philippine E-Commerce Act (RA 8792).
                  </Text>

                  <Text style={styles.sectionTitle}>2. Service Overview</Text>
                  <Text style={styles.sectionText}>
                  TagakTuro provides a platform where bona fide students of the University of Makati can book tutoring sessions with approved tutors, and where qualified individuals may apply to become Tutors.
                  </Text>

                  <Text style={styles.sectionTitle}>3. User Eligibility</Text>
                  <Text style={styles.sectionText}>
                    • Users must be bona fide students or staff of the University of Makati.{'\n'}  
                    • Tutors must meet our qualifications and pass the approval process.{'\n'}    
                    • Users confirm they are of legal age and have full legal capacity to enter into this agreement.
                  </Text>
                  <Text style={styles.sectionTitle}>4. User Accounts</Text>
                  <Text style={styles.sectionText}>
                    • You must provide accurate and current information when creating an account.{'\n'}
                    • You are responsible for safeguarding your login credentials (username, password, OTP).{'\n'}
                    • Notify TagakTuro immediately of any material changes to your account information.

                  </Text>
                    <Text style={styles.sectionTitle}>5. Booking</Text>
                    <Text style={styles.sectionText}>
                    • Students can book tutoring sessions through the app.{'\n'}
                    • Students shall book 3 days before the target date of the schedule                  
                    </Text>
                    <Text style={styles.sectionTitle}>6. Tutor Application and Approval</Text>
                    <Text style={styles.sectionText}>
                    • Tutors must submit proof of academic qualifications and relevant experience. Applications are subject to administrator review.{'\n'}
                    • Conduct and Standards: Tutors must maintain professionalism, punctuality, respectful communication, and preparedness.{'\n'}
                    • Session Delivery: Sessions must be conducted either on UMak premises or via the app's integrated video conferencing system.{'\n'}
                    • Documentation: Tutors must indicate session location and upload photos before, during, and after sessions, with third-party monitoring for face-to-face sessions.{'\n'}
                    • Materials: Tutors must prepare instructional materials that comply with intellectual property laws.{'\n'}
                    • Prohibited Conduct: Tutors may not:{'\n'}
                    • Conduct sessions outside approved venues/platforms.{'\n'}
                    • Accept direct payments outside the system.{'\n'}
                    • Share personal contact information or engage in non-academic relationships.{'\n'}
                    • Use or distribute copyrighted, offensive, or inappropriate materials.{'\n'}
                    • Violation and Termination: Breaches may result in suspension, revocation of tutor status, or permanent removal.
                    </Text>
                    <Text style={styles.sectionTitle}>7. Prohibited Conduct (Users & Tutors)</Text>
                    <Text style={styles.sectionText}>
                    • No illegal, fraudulent, or harmful activities.{'\n'}
                    • No study sessions outside UMak premises or the app's video platform.{'\n'}
                    • No sharing of offensive or copyrighted materials.{'\n'}
                    • Misuse may result in suspension or termination.
                    </Text>
                    <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
                    <Text style={styles.sectionText}>
                    • TagakTuro owns all app content, logos, mascot, and materials.{'\n'}
                    • Users receive a limited, non-transferable license to use the Service.{'\n'}
                    • Unauthorized reproduction, modification, or distribution is prohibited under the Intellectual Property Code (RA 8293).
                    </Text>

                    <Text style={styles.sectionTitle}>9. Privacy and Data Protection</Text>
                    <Text style={styles.sectionText}>
                    • Your use of the Service is subject to our separate Privacy Policy, compliant with the Philippine Data Privacy Act (RA 10173).{'\n'}
                    • By using the Service, you consent to the collection, use, and processing of your Personal Data as outlined in the Privacy Policy.
                    </Text>

                    <Text style={styles.sectionTitle}>10. Disclaimers and Limitation of Liability</Text>
                    <Text style={styles.sectionText}>
                    • The Service is provided "as is." We do not guarantee learning outcomes or session availability.{'\n'}
                    • Liability is limited to the extent permitted by Philippine law. Waivers for fraud or gross negligence are void.{'\n'}
                    • Users agree to indemnify TagakTuro against claims arising from misuse or violations of these Terms.
                    </Text>

                    <Text style={styles.sectionTitle}>11. Communication and Electronic Transactions</Text>
                    <Text style={styles.sectionText}>
                    • TagakTuro may send notices via email, SMS, or app notifications.{'\n'}
                    • Communications sent to your registered contact details are considered valid.{'\n'}
                    • Communications may be recorded and stored as proof of acceptance.
                    </Text>

                    <Text style={styles.sectionTitle}>12. Termination</Text>
                    <Text style={styles.sectionText}>
                    • TagakTuro reserves the right to suspend or terminate accounts for violations of these Terms.
                    </Text>

                    <Text style={styles.sectionTitle}>13. Changes to Terms</Text>
                    <Text style={styles.sectionText}>
                    • We may update these Terms at any time.{'\n'}
                    • Updates are binding once published in the app or communicated via email/SMS.
                    </Text>

                    <Text style={styles.sectionTitle}>14. Governing Law and Dispute Resolution</Text>
                    <Text style={styles.sectionText}>
                    • These Terms are governed by the laws of the Republic of the Philippines.{'\n'}
                    • Disputes shall be brought exclusively before the courts of Metro Manila.{'\n'}
                    • Arbitration or mediation may be used as alternative dispute resolution methods.
                    </Text>
                  </ScrollView>

                  <TouchableOpacity 
                    style={styles.returnButton}
                    onPress={() => setTermsModalVisible(false)}
                  >
                  <Text style={styles.returnButtonText}>Return</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Modal>

          {/* Privacy Policy Modal */}
          <Modal
            visible={privacyModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setPrivacyModalVisible(false)}
          >
            <BlurView intensity={80} style={styles.blurBackground}>
              <View style={styles.modalContainer}>
                <ScrollView style={styles.modalScroll}>
                  <Text style={styles.modalTitle}>Privacy Policy</Text>
                  
                  <Text style={styles.modalIntro}>
                  We care about your privacy. Here’s how TagakTuro handles your data in simple terms:
                  </Text>

                  <Text style={styles.sectionTitle}>What We Collect</Text>
                    <Text style={styles.sectionText}>
                    • Your name, UMak ID, email, and mobile number.{'\n'}
                    • Tutor applicants: qualifications and proof of experience.{'\n'}
                    • Technical info like device type and usage logs.
                    </Text>
                  <Text style={styles.sectionTitle}>Why We Collect It</Text>
                  <Text style={styles.sectionText}>
                    • To let you book tutoring sessions.{'\n'}
                    • To approve tutors.{'\n'}
                    • To send updates and confirmations.{'\n'}
                    • To improve the app and keep it secure.
                  </Text>
                  <Text style={styles.sectionTitle}>Who We Share With</Text>
                  <Text style={styles.sectionText}>
                    • Tutors (only session‑related info).{'\n'}
                    • Service providers (like hosting and payments).{'\n'}
                    • Government if legally required.{'\n\n'}
                    We never sell your data.
                  </Text>
                  <Text style={styles.sectionTitle}>Your Rights</Text>
                  <Text style={styles.sectionText}>
                    You can ask to see your data, correct it, delete it, or stop certain uses.
                  </Text>
                  <Text style={styles.sectionTitle}>Security</Text>
                  <Text style={styles.sectionText}>
                    We use encryption and monitoring to protect your data. If a breach happens, we’ll notify you and the NPC within 72 hours.
                  </Text>
                  <Text style={styles.sectionTitle}>Consent</Text>
                  <Text style={styles.sectionText}>
                    By clicking "Agree," you allow us to process your data. You can withdraw consent anytime in the app or by contacting us.
                  </Text>
                </ScrollView>

                <TouchableOpacity 
                  style={styles.returnButton}
                  onPress={() => setPrivacyModalVisible(false)}
                >
                  <Text style={styles.returnButtonText}>Return</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Modal>

          {error && (
            <Text style={styles.errorText}>
              Missing Detail/s is required!
            </Text>
          )}

          <TouchableOpacity 
            style={[styles.submitButton, (error || submitting) && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Submit'}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text style={styles.link} onPress={() => router.push('/')}>
                Log in now
              </Text>
            </Text>
            <Text style={styles.footerText}>
              Want to apply as a tutor?{' '}
              <Text style={styles.link} onPress={() => router.push('/apply')}>
                Click here
              </Text>
            </Text>
          </View>
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
    fontSize: 17,
    color: '#fff',
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: -30,
    borderRadius: 20,
    padding: 30,
    width: '100%',
    height: '78%',
    alignSelf: 'center',
    alignContent: 'center',
    justifyContent: 'center',
  },
  formTitle: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '700',
    color: '#2B74B4',
    textAlign: 'center',
  },
  formSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '700',
    color: '#2B74B4',
    marginBottom: 6,
  },
  input: {
    fontFamily: 'Poppins',
    borderWidth: 1,
    borderColor: '#2B74B4',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#2B74B4',
  },
  inputError: {
    borderColor: '#FF0000',
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
    fontWeight: '700',
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
    fontWeight: '700',
    color: '#2B74B4',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '700',
  },
  submitButton: {
    fontFamily: 'Poppins',
    fontSize: 15,
    backgroundColor: '#2B74B4',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
    fontWeight: '700',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
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
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  blurBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#2B74B4',
    padding: 20,
    width: '95%',
    marginTop: 20,
    maxHeight: '100%',    
  },
  modalScroll: {
    maxHeight: '90%',
  },
  modalTitle: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '700',
    color: '#2B74B4',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalIntro: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
    textAlign: 'justify',
    marginBottom: 5,
    lineHeight: 18,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '700',
    color: '#2B74B4',
    marginTop: 5,
  },
  sectionText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
    lineHeight: 18,
    marginBottom: 5,
    textAlign: 'justify',
  },
  returnButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2B74B4',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 15,
    alignItems: 'center',
  },
  returnButtonText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: '#2B74B4',
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2B74B4",
    borderRadius: 10,
    paddingHorizontal: 10,
    fontWeight: '700',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 12,
    color: "#2B74B4",
    fontWeight: '700',
  },
});