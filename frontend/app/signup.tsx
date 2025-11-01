import { Stack, useRouter, Link } from 'expo-router';
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
import { BlurView } from 'expo-blur';

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

  const handleSubmit = () => {
    if (!name || !studentId || !courseProgram || !email || !phoneNumber || !password) {
      setError(true);
      return;
    }
    
    if (!agreedToTerms) {
      alert('Please agree to the User Agreement and Privacy Policy');
      return;
    }

    setError(false);
    alert('Registration successful!');
    router.push('/');
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
            <TextInput
              style={[styles.input, error && !password && styles.inputError]}
              placeholder="ILOVEYOU_123"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#95CDF2"
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
                    Welcome To TagakTuro: Tutor Services for UMak Students. By using our system application, you agree to the following terms and conditions. Please read them carefully.
                  </Text>

                  <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                  <Text style={styles.sectionText}>
                    By accessing or using our tutoring platform, you agree to comply with these Terms and Conditions and any future updates to them. If you disagree, please refrain from using the Service.                  </Text>

                  <Text style={styles.sectionTitle}>2. Service Overview</Text>
                  <Text style={styles.sectionText}>
                    TagakTuro: Tutor Services for UMak Students provides a platform where bona fide students of the University of Makati can search for Tutors. Individuals can voluntarily apply to become Tutors themselves.
                  </Text>

                  <Text style={styles.sectionTitle}>3. User Eligibility</Text>
                  <Text style={styles.sectionText}>
                    • Users must be bona fide students or staff of the University of Makati.{'\n'}  
                    • Tutors must meet our qualifications and approval process to offer tutoring sessions.
                  </Text>
                  <Text style={styles.sectionTitle}>4. User Accounts</Text>
                  <Text style={styles.sectionText}>
                    • You are responsible for providing accurate information when creating an account.{'\n'}
                    • Keep your login credentials confidential; you are responsible for all activities under your account.
                  </Text>

                  <Text style={styles.sectionTitle}>5. Booking</Text>
                  <Text style={styles.sectionText}>
                    • Students can book tutoring sessions through the app.{'\n'}
                    • Students shall book 3 days before the target date of the schedule                  
                  </Text>

                  <Text style={styles.sectionTitle}>6. Tutor Application and Approval</Text>
                  <Text style={styles.sectionText}>
                    • 6.1 Application and Qualification. Individuals seeking to become Tutors must submit a formal application through the designated platform, including proof of academic qualifications and relevant experience. All applications are subject to review and approval by the administrators of TagakTuro.{'\n'}
                    • 6.2 Conduct and Professional Standards. Approved Tutors shall uphold the highest standards of professionalism, including punctuality, respectful communication, and preparedness for each tutoring session. Tutors are expected to foster a supportive and academically focused environment.{'\n'}
                    • 6.3 Session Delivery and Platform Use. Tutors shall conduct all tutoring sessions either within the approved physical premises of the University of Makati or through the integrated video conferencing system provided by the application. Sessions conducted outside these channels are strictly prohibited.{'\n'}
                    • 6.4 Tutors are required to indicate the location of the session and upload photos taken before, during, and after the meeting, including documentation of activities conducted with the assigned third-party monitor for face-to-face sessions.{'\n'}
                    • 6.5 Materials and Preparation. Tutors are responsible for preparing appropriate instructional materials tailored to the students' academic needs. All materials must comply with intellectual property laws and institutional guidelines.{'\n'}
                    • 6.6 Evaluation and Certification. Tutors may be subject to periodic evaluations based on student feedback, attendance, and performance metrics. The administrators may award tutors who consistently meet or exceed expectations certificates of recognition.{'\n'}

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
                    At TagakTuro, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data.
                  </Text>

                  <Text style={styles.sectionTitle}>1. Information We Collect</Text>
                  <Text style={styles.sectionText}>
                    We collect personal information such as your name, email address, student ID, phone number, and academic details when you register or use our services.
                  </Text>

                  <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
                  <Text style={styles.sectionText}>
                    Your information is used to provide tutoring services, match students with tutors, process bookings, and improve our platform.
                  </Text>

                  <Text style={styles.sectionTitle}>3. Data Security</Text>
                  <Text style={styles.sectionText}>
                    We implement security measures to protect your personal information from unauthorized access, alteration, or disclosure.
                  </Text>

                  <Text style={styles.sectionTitle}>4. Information Sharing</Text>
                  <Text style={styles.sectionText}>
                    We do not sell your personal information. We only share data with tutors and students as necessary to facilitate tutoring sessions.
                  </Text>

                  <Text style={styles.sectionTitle}>5. Your Rights</Text>
                  <Text style={styles.sectionText}>
                    You have the right to access, update, or delete your personal information. Contact us if you wish to exercise these rights.
                  </Text>

                  <Text style={styles.sectionTitle}>6. Changes to Policy</Text>
                  <Text style={styles.sectionText}>
                    We may update this Privacy Policy from time to time. Continued use of the platform constitutes acceptance of any changes.
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
            style={[styles.submitButton, error && !agreedToTerms && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
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
    fontSize: 16,
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
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: 'bold',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#2B74B4',
    marginTop: 5,
    marginBottom: 8,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#2B74B4',
  },
});