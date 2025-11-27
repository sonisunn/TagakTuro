import { Stack } from "expo-router";
import React from 'react';
import { loadTokenToHeader } from '../src/api/auth';

export default function Layout() {
  React.useEffect(() => {
    // load stored JWT (if any) into axios default header
    loadTokenToHeader().catch((e) => console.warn('Failed to load token', e));

    // Suppress all console output in the app (browser) but keep in terminal
    const suppressConsoleMethods = ['log', 'warn', 'error', 'info', 'debug'];

    suppressConsoleMethods.forEach(method => {
      const originalMethod = console[method];
      console[method] = (...args) => {
        const message = args.join(' ');

        // Suppress common development/debug messages and API errors
        if (
          // API-related errors that don't affect functionality
          message.includes('Request failed with status code 403') ||
          message.includes('Request failed with status code 401') ||
          message.includes('Network Error') ||
          message.includes('AxiosError') ||
          // React/Expo development messages
          message.includes('Warning:') ||
          message.includes('React DevTools') ||
          message.includes('Metro') ||
          message.includes('Fast Refresh') ||
          // Our app's internal logs that we don't want in console
          message.includes('🔍') || // Debug markers
          message.includes('Failed to fetch') ||
          message.includes('Error in ') ||
          // Generic error patterns
          /^ERROR\s/.test(message) ||
          /^Warning:\s/.test(message)
        ) {
          // Suppress these messages from browser console
          return;
        }

        // For any other messages, still suppress them in production
        // Only show critical errors that users should see
        if (__DEV__) {
          // In development, show everything in terminal only
          originalMethod.apply(console, args);
        }
        // In production, suppress all console output from browser
      };
    });
  }, []);

  return <Stack />;
}
