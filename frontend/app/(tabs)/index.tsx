import { Text, View, StyleSheet } from 'react-native';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Import the configuration file you created
import { API_BASE_URL } from '../../src/api/config.js';  

// The full URL to the test endpoint: /api/hello
const FULL_API_URL = `${API_BASE_URL}/hello`;

export default function Index() {
  const [message, setMessage] = useState('Fetching data from Spring Boot...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch data when the component mounts
    axios.get(FULL_API_URL)
      .then(response => {
        // 2. Success: Set the message from the Spring Boot response
        setMessage(response.data);
      })
      .catch(err => {
        // 3. Failure: Log the error and show a user-friendly message
        console.error('API Error:', err.message);
        setError('Connection Failed! Check Spring Boot server, Wi-Fi, and IP in config.js.');
        setMessage('Status: DISCONNECTED');
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Spring Boot Status:</Text>
      <Text style={styles.message}>{message}</Text>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: 'green',
  },
  error: {
    fontSize: 14,
    marginTop: 20,
    color: 'red',
    textAlign: 'center',
  },
});