// Use your machine LAN IP + backend port for Expo Go on iOS device.
// 8081 is Metro (Expo), backend runs on 8080 by default.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.137.20:8080';
