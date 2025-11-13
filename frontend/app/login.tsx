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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TagakTuroLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

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
          if (loginResponse?.studentId) {
            await AsyncStorage.setItem('studentId', loginResponse.studentId.toString());
          }
          // basic success flow - navigate to homepage
          alert('Login successful!');
          router.push('/homepage');
        })
        .catch((err) => {
          setSubmitting(false);
          console.warn('Login error', err?.response?.data || err.message || err);
          setError(true);
        });
    });
  };
  const handleSkip = () => {
    router.push('/homepage');
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
            <TextInput
              style={styles.input}
              placeholder="ILOVEYOU123"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#95CDF2"
            />
          </View>

          {error && (
            <Text style={styles.errorText}>
              The Email or Password you submitted is incorrect.
            </Text>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>{submitting ? 'Signing in...' : 'Submit'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSkip}>
            <Text style={styles.submitButtonText}>Skip</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account yet?{' '}
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
    alignSelf: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    height: '75%',
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
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: '#2B74B4',
    marginBottom: 8,
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
  errorText: {
    color: '#FF0000',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  submitButton: {
    fontFamily: 'Poppins',
    fontSize: 14,
    backgroundColor: '#2B74B4',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
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
});