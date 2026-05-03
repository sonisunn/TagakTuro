import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLobbyStream, stopStream } from '../hooks/useWebRTC';

// RTCView loaded at runtime (requires react-native-webrtc custom dev build)
let RTCView: any = null;
try {
  RTCView = require('react-native-webrtc').RTCView;
} catch {
  console.warn('[Lobby] react-native-webrtc not available');
}

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
  const [cameraOn, setCameraOn] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionPermanent, setPermissionPermanent] = useState(false);
  const [loading, setLoading] = useState(true);
  const streamRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      // Android: explicit permission request
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          ]);
          const camResult = granted[PermissionsAndroid.PERMISSIONS.CAMERA];
          const micResult = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
          const isPermanentlyDenied =
            camResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
            micResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;
          const isDenied =
            camResult !== PermissionsAndroid.RESULTS.GRANTED ||
            micResult !== PermissionsAndroid.RESULTS.GRANTED;
          if (isDenied) {
            if (mounted) {
              setPermissionDenied(true);
              setPermissionPermanent(isPermanentlyDenied);
              setLoading(false);
            }
            return;
          }
        } catch {
          if (mounted) { setPermissionDenied(true); setLoading(false); }
          return;
        }
      }

      const s = await getLobbyStream();
      if (!mounted) { stopStream(s); return; }
      if (s) {
        streamRef.current = s;
        setStream(s);
      } else {
        setPermissionDenied(true);
      }
      setLoading(false);
    };

    start();
    return () => {
      mounted = false;
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  const toggleMic = () => {
    if (!streamRef.current) return;
    const next = !micOn;
    streamRef.current.getAudioTracks().forEach((t: any) => { t.enabled = next; });
    setMicOn(next);
  };

  const toggleCamera = () => {
    if (!streamRef.current) return;
    const next = !cameraOn;
    streamRef.current.getVideoTracks().forEach((t: any) => { t.enabled = next; });
    setCameraOn(next);
  };

  const joinMeeting = () => {
    // Stop lobby stream — the meeting room will create its own
    stopStream(streamRef.current);
    streamRef.current = null;
    setStream(null);

    router.replace({
      pathname: '/meeting-room',
      params: { roomId, userId, userName, isTutor },
    });
  };

  const goBack = () => {
    stopStream(streamRef.current);
    streamRef.current = null;
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Join a Meeting</Text>
        <Text style={styles.subtitle}>Stay updated with your tutor!</Text>
      </View>

      {/* Camera Preview */}
      <View style={styles.previewWrapper}>
        {loading ? (
          <ActivityIndicator size="large" color="#1A6BCC" style={styles.loader} />
        ) : permissionDenied ? (
          <View style={styles.permissionBox}>
            <Ionicons name="videocam-off" size={48} color="#888" />
            <Text style={styles.permissionText}>Camera / microphone access denied.</Text>
            <Text style={styles.permissionSub}>
              {permissionPermanent
                ? 'You\'ve permanently denied camera/microphone. Tap below to enable them in Android Settings.'
                : 'Enable camera and microphone permissions to join.'}
            </Text>
            {permissionPermanent && (
              <TouchableOpacity style={styles.openSettingsBtn} onPress={() => Linking.openSettings()}>
                <Text style={styles.openSettingsText}>Open App Settings</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : stream && RTCView ? (
          <>
            {cameraOn ? (
              <RTCView
                streamURL={stream.toURL ? stream.toURL() : stream.id}
                style={styles.rtcView}
                objectFit="cover"
                mirror
              />
            ) : (
              <View style={styles.cameraOffPlaceholder}>
                <Ionicons name="videocam-off" size={52} color="#555" />
              </View>
            )}
          </>
        ) : (
          <View style={styles.cameraOffPlaceholder}>
            <Ionicons name="videocam-off" size={52} color="#555" />
            <Text style={styles.noPreviewText}>No camera preview</Text>
          </View>
        )}

        {/* Toggle buttons overlaid on preview */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, !micOn && styles.toggleBtnOff]}
            onPress={toggleMic}
          >
            <Ionicons
              name={micOn ? 'mic' : 'mic-off'}
              size={22}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, !cameraOn && styles.toggleBtnOff]}
            onPress={toggleCamera}
          >
            <Ionicons
              name={cameraOn ? 'videocam' : 'videocam-off'}
              size={22}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.joinBtn, (loading || permissionDenied) && styles.joinBtnDisabled]}
          onPress={joinMeeting}
          disabled={loading || permissionDenied}
        >
          <Text style={styles.joinBtnText}>Join now!</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
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
  previewWrapper: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#111',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rtcView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loader: {
    flex: 1,
  },
  permissionBox: {
    alignItems: 'center',
    padding: 24,
  },
  permissionText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 12,
  },
  permissionSub: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },
  openSettingsBtn: {
    marginTop: 14,
    backgroundColor: '#1A6BCC',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  openSettingsText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  cameraOffPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  noPreviewText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#555',
  },
  toggleRow: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    gap: 16,
    alignSelf: 'center',
  },
  toggleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A6BCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtnOff: {
    backgroundColor: '#444',
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
  joinBtnDisabled: {
    opacity: 0.5,
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
