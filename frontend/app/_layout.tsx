import { Stack } from "expo-router";
import React from 'react';
import { loadTokenToHeader } from '../src/api/auth';

export default function Layout() {
  React.useEffect(() => {
    // load stored JWT (if any) into axios default header
    loadTokenToHeader().catch((e) => console.warn('Failed to load token', e));
  }, []);

  return <Stack />;
}
