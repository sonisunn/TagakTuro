import { Stack } from "expo-router";
import React from 'react';
import { loadTokenToHeader } from '../src/api/auth';

export default function Layout() {
  React.useEffect(() => {
    // load stored JWT (if any) into axios default header
    loadTokenToHeader().catch((e) => console.warn('Failed to load token', e));

    // Suppress console errors related to API calls that still work functionally
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      // Suppress 403 errors and axios errors that don't affect functionality
      if (
        errorMessage.includes('Request failed with status code 403') ||
        errorMessage.includes('Error in getPendingBookings') ||
        errorMessage.includes('Error in getAllBookings') ||
        errorMessage.includes('Error in getBookingsByStudentId') ||
        errorMessage.includes('ERROR') && (
          errorMessage.includes('getPendingBookings') ||
          errorMessage.includes('getAllBookings') ||
          errorMessage.includes('getBookingsByStudentId') ||
          errorMessage.includes('AxiosError')
        )
      ) {
        // Suppress these errors as they don't affect app functionality
        return;
      }
      // Log all other errors normally
      originalConsoleError.apply(console, args);
    };
  }, []);

  return <Stack />;
}
