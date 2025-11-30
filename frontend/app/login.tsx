import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function TagakTuroLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Progress bar animation for filling the submit button
  const progressAnim = useRef(new Animated.Value(0)).current;

  const handleSubmit = () => {
    setError(false);
    setSubmitting(true);
    import('../src/api/auth').then(({ login }) => {
      login(email, password)
        .then(async (loginResponse) => {
          setSubmitting(false);
          // Store user data
          if (loginResponse?.user) {
            await AsyncStorage.setItem('userData', JSON.stringify(loginResponse.user));
          }

          // Handle studentId
          if (loginResponse?.studentId) {
            await AsyncStorage.setItem('studentId', loginResponse.studentId.toString());
          } else {
            // If no studentId is returned for a student, ensure it's cleared from storage
            await AsyncStorage.removeItem('studentId');
          }

          // Handle tutorId
          if (loginResponse?.tutorId) {
            await AsyncStorage.setItem('tutorId', loginResponse.tutorId.toString());
          } else {
            // If no tutorId is returned for a tutor, ensure it's cleared from storage
            await AsyncStorage.removeItem('tutorId');
          }
          // basic success flow - navigate to homepage
          alert('Login successful!');
          if (loginResponse?.roles?.includes('ROLE_TUTOR')) {
            router.push('/tutor-homepage');
          } else {
            router.push('/homepage');
          }
        })
        .catch((err) => {
          setSubmitting(false);
          console.warn('Login error', err?.response?.data || err.message || err);
          setError(true);
        });
    });
  };

  const [submitting, setSubmitting] = React.useState(false);

  // Progress bar animation effect for filling the submit button
  useEffect(() => {
    if (submitting) {
      // Start the looping progress animation - continuously fill from 0% to 100%
      const loopAnimation = Animated.loop(
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1500, // 1.5 seconds per cycle
          useNativeDriver: false,
        })
      );
      loopAnimation.start();
    } else {
      // Stop animation and reset progress when not submitting
      progressAnim.stopAnimation();
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 300, // Quick reset
        useNativeDriver: false,
      }).start();
    }

    return () => {
      progressAnim.stopAnimation();
    };
  }, [submitting, progressAnim]);

  const handleSkip = () => {
    router.push('/homepage');
  }
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
          <Text style={styles.formTitle}>Log in now!</Text>
          <Text style={styles.formSubtitle}>Log in to access TagakTuro</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="jpartido.k12148008@umak.edu.ph"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
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


          {error && (
            <Text style={styles.errorText}>
              The Email or Password you submitted is incorrect.
            </Text>
          )}

          <View style={styles.submitButtonContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                submitting && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Signing in...' : 'Submit'}
              </Text>
            </TouchableOpacity>

            {/* Animated progress bar that fills the button */}
            <Animated.View
              style={[
                styles.submitButtonProgress,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don&apos;t have an account yet?{' '}
              <Text style={styles.link} onPress={() => router.push('/signup')}>
                Sign up now
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
    fontWeight: '600',
    color: '#fff',
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '600',
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
    alignSelf: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    height: '75%',
  },
  formTitle: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600',
    color: '#2B74B4',
    textAlign: 'center',
  },
  formSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '600'
  },
  inputGroup: {
    marginBottom: 15,
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
    fontWeight: '600',
    color: '#2B74B4',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  submitButtonContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  submitButton: {
    fontFamily: 'Poppins',
    fontSize: 15,
    backgroundColor: '#2B74B4',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#1a5a8a', // Slightly darker when disabled
  },
  submitButtonProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Semi-transparent white overlay
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
    fontWeight: '600',
    marginBottom: 5,
  },
  link: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#2B74B4',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2B74B4",
    borderRadius: 10,
    paddingHorizontal: 10,
    fontWeight: '600',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 12,
    color: "#2B74B4",
    fontWeight: '600',
  },
});