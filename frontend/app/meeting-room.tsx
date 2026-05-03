import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWebRTC, RemoteParticipant } from '../hooks/useWebRTC';

let RTCView: any = null;
try {
  RTCView = require('react-native-webrtc').RTCView;
} catch {
  console.warn('[Room] react-native-webrtc not available');
}

const { width: SCREEN_W } = Dimensions.get('window');
const TILE_HEIGHT = 200;

export default function MeetingRoom() {
  const router = useRouter();
  const { roomId, userId, userName, isTutor } = useLocalSearchParams<{
    roomId: string;
    userId: string;
    userName: string;
    isTutor: string;
  }>();

  const {
    localStream,
    remoteParticipants,
    isMicOn,
    isCameraOn,
    wsConnected,
    toggleMic,
    toggleCamera,
    endCall,
  } = useWebRTC(roomId, userId, userName, true);

  const handleEndCall = () => {
    endCall();
    router.back();
  };

  // Build the full participant list: remotes first, local ("You") last
  const allParticipants = useMemo(() => {
    const locals = [{
      userId: userId ?? 'me',
      name: 'You',
      stream: localStream,
      isMuted: !isMicOn,
      isCameraOff: !isCameraOn,
      isLocal: true,
    }];
    const remotes = remoteParticipants.map(p => ({ ...p, isLocal: false }));
    return [...remotes, ...locals];
  }, [remoteParticipants, localStream, userId, isMicOn, isCameraOn]);

  const renderTile = (participant: any, idx: number) => {
    const hasStream = !!participant.stream;
    const streamURL = hasStream && RTCView
      ? (participant.stream.toURL ? participant.stream.toURL() : participant.stream.id)
      : null;

    return (
      <View key={participant.userId + idx} style={styles.tile}>
        {streamURL && !participant.isCameraOff ? (
          <RTCView
            streamURL={streamURL}
            style={styles.tileVideo}
            objectFit="cover"
            mirror={participant.isLocal}
          />
        ) : (
          <View style={styles.tilePlaceholder}>
            <Ionicons name="person-circle" size={64} color="#555" />
          </View>
        )}

        {/* Name label */}
        <View style={styles.nameLabel}>
          {participant.isMuted && (
            <Ionicons name="mic-off" size={14} color="#fff" style={styles.mutedIcon} />
          )}
          <Text style={styles.nameText} numberOfLines={1}>{participant.name}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Connection status banner */}
      {!wsConnected && (
        <View style={styles.connectingBanner}>
          <Text style={styles.connectingText}>Connecting…</Text>
        </View>
      )}

      {/* Participant tiles */}
      <ScrollView
        style={styles.tilesScroll}
        contentContainerStyle={styles.tilesContent}
        showsVerticalScrollIndicator={false}
      >
        {allParticipants.map((p, i) => renderTile(p, i))}
      </ScrollView>

      {/* Control bar */}
      <View style={styles.controlBar}>
        {/* Chat */}
        <TouchableOpacity
          style={styles.ctrlBtn}
          onPress={() => router.replace(isTutor === 'true' ? '/tutor-messages' : '/messages')}
        >
          <Ionicons name="chatbubble" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Mic */}
        <TouchableOpacity
          style={[styles.ctrlBtn, !isMicOn && styles.ctrlBtnOff]}
          onPress={toggleMic}
        >
          <Ionicons name={isMicOn ? 'mic' : 'mic-off'} size={22} color="#fff" />
        </TouchableOpacity>

        {/* Camera */}
        <TouchableOpacity
          style={[styles.ctrlBtn, !isCameraOn && styles.ctrlBtnOff]}
          onPress={toggleCamera}
        >
          <Ionicons name={isCameraOn ? 'videocam' : 'videocam-off'} size={22} color="#fff" />
        </TouchableOpacity>

        {/* End call */}
        <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
          <Ionicons name="call" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  connectingBanner: {
    backgroundColor: '#333',
    paddingVertical: 6,
    alignItems: 'center',
  },
  connectingText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
  },
  tilesScroll: {
    flex: 1,
  },
  tilesContent: {
    padding: 12,
    gap: 12,
    paddingBottom: 24,
  },
  tile: {
    width: SCREEN_W - 24,
    height: TILE_HEIGHT,
    backgroundColor: '#2a2a2a',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  tileVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tilePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2e2e2e',
  },
  nameLabel: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
    maxWidth: '70%',
  },
  mutedIcon: {
    marginRight: 2,
  },
  nameText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 18,
    paddingBottom: 34,
    backgroundColor: '#111',
  },
  ctrlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1A6BCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctrlBtnOff: {
    backgroundColor: '#444',
  },
  endCallBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e53935',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
  },
});
