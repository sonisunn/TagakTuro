import { Stack } from "expo-router";
import React from 'react';
import { loadTokenToHeader } from '../src/api/auth';
// Imported for its registerForegroundService side-effect — must run before any
// meeting starts so Notifee can resume the service task on cold start.
import '../src/meetingForegroundService';

export default function Layout() {
  React.useEffect(() => {
    loadTokenToHeader().catch((e) => console.warn('Failed to load token', e));
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(student)" options={{ headerShown: false }} />
      <Stack.Screen name="(tutor)" options={{ headerShown: false }} />
    </Stack>
  );
}
