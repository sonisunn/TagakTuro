import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MeetingLobby() {
  const router = useRouter();
  const { roomId, userName } = useLocalSearchParams<{
    roomId: string;
    userId: string;
    userName: string;
    isTutor: string;
  }>();

  const roomUrl = `https://meet.jit.si/tagaturo-${roomId}`;

  const joinMeeting = async () => {
    await Linking.openURL(roomUrl);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.title}>Join a Meeting</Text>
        <Text style={styles.subtitle}>Stay updated with your tutor!</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.infoCard}>
          <Ionicons name="videocam" size={52} color="#1A6BCC" />
          <Text style={styles.infoTitle}>Ready to join?</Text>
          <Text style={styles.infoText}>
            Tapping <Text style={styles.bold}>Join now!</Text> will open your browser for the video session.
            Allow camera and microphone access when prompted.
          </Text>
          <View style={styles.roomRow}>
            <Ionicons name="link" size={14} color="#888" />
            <Text style={styles.roomText} numberOfLines={1}>{roomUrl}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.joinBtn} onPress={joinMeeting}>
          <Text style={styles.joinBtnText}>Join now!</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '700',
    color: '#1A6BCC',
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#95CDF2',
    fontWeight: '500',
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  infoTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2B4A',
  },
  infoText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },
  bold: { fontWeight: '700', color: '#1A2B4A' },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  roomText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: '#888',
    flex: 1,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  joinBtn: {
    backgroundColor: '#1A6BCC',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
  },
  joinBtnText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  backBtn: {
    borderWidth: 1.5,
    borderColor: '#1A6BCC',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  backBtnText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: '#1A6BCC',
  },
});
