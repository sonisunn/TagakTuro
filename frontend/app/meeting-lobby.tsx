import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RTCView } from 'react-native-webrtc';
import { getLobbyStream, stopStream } from '../constants/hooks/useWebRTC';

export default function MeetingLobby() {
  const router = useRouter();
  const { roomId, userId, userName, isTutor } = useLocalSearchParams<{
    roomId: string;
    userId: string;
    userName: string;
    isTutor: string;
  }>();

  const [stream, setStream] = useState<any>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getLobbyStream();
      if (cancelled) {
        if (result.ok) stopStream(result.stream);
        return;
      }
      if (!result.ok) {
        setError(result.reason);
        return;
      }
      streamRef.current = result.stream;
      setStream(result.stream);
    })();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        stopStream(streamRef.current);
        streamRef.current = null;
      }
    };
  }, []);

  const toggleMic = () => {
    const s = streamRef.current;
    if (!s) return;
    const next = !micOn;
    s.getAudioTracks().forEach((t: any) => { t.enabled = next; });
    setMicOn(next);
  };

  const toggleCam = () => {
    const s = streamRef.current;
    if (!s) return;
    const next = !camOn;
    s.getVideoTracks().forEach((t: any) => { t.enabled = next; });
    setCamOn(next);
  };

  const joinNow = () => {
    // Release the camera/mic synchronously before navigating — otherwise
    // Android's exclusive capture lock prevents meeting-room from acquiring it.
    if (streamRef.current) {
      stopStream(streamRef.current);
      streamRef.current = null;
    }
    router.replace({
      pathname: '/meeting-room',
      params: { roomId, userId, userName, isTutor },
    });
  };

  const streamURL = stream && RTCView && typeof stream.toURL === 'function' ? stream.toURL() : null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.title}>Join a Meeting</Text>
        <Text style={styles.subtitle}>Check your camera and mic before joining.</Text>
      </View>

      <View style={styles.preview}>
        {streamURL && camOn ? (
          <RTCView streamURL={streamURL} style={styles.video} objectFit="cover" mirror />
        ) : (
          <View style={styles.placeholder}>
            {error ? (
              <>
                <Ionicons name="alert-circle" size={48} color="#e53935" />
                <Text style={styles.errorText}>{error}</Text>
              </>
            ) : !stream ? (
              <>
                <ActivityIndicator size="large" color="#95CDF2" />
                <Text style={styles.placeholderText}>Starting camera…</Text>
              </>
            ) : (
              <>
                <Ionicons name="videocam-off" size={48} color="#95CDF2" />
                <Text style={styles.placeholderText}>Camera off</Text>
              </>
            )}
          </View>
        )}

        <View style={styles.nameTag}>
          <Text style={styles.nameTagText} numberOfLines={1}>{userName ?? 'You'}</Text>
        </View>
      </View>

      <View style={styles.previewControls}>
        <TouchableOpacity
          style={[styles.toggleBtn, !micOn && styles.toggleBtnOff]}
          onPress={toggleMic}
          disabled={!stream}
        >
          <Ionicons name={micOn ? 'mic' : 'mic-off'} size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, !camOn && styles.toggleBtnOff]}
          onPress={toggleCam}
          disabled={!stream}
        >
          <Ionicons name={camOn ? 'videocam' : 'videocam-off'} size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.joinBtn, !stream && styles.joinBtnDisabled]}
          onPress={joinNow}
          disabled={!stream}
        >
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
    paddingBottom: 12,
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
  preview: {
    marginHorizontal: 20,
    marginTop: 8,
    aspectRatio: 3 / 4,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  video: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  placeholderText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#95CDF2',
  },
  errorText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
  },
  nameTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: '70%',
  },
  nameTagText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 18,
  },
  toggleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1A6BCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtnOff: {
    backgroundColor: '#666',
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
    marginTop: 'auto',
  },
  joinBtn: {
    backgroundColor: '#1A6BCC',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
  },
  joinBtnDisabled: {
    backgroundColor: '#9bbbe0',
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
