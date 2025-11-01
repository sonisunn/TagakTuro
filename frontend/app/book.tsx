import { Stack } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomNav from '../components/BottomNav';

export default function BookPage() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.content}>
        <Text style={styles.title}>Book a Tutor</Text>
      </View>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2B74B4',
  },
});