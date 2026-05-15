import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
  Keyboard,
  Image,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RTCView } from 'react-native-webrtc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InCallManager from 'react-native-incall-manager';
import { useWebRTC, MeetingChatMessage } from '../constants/hooks/useWebRTC';
import { startMeetingForegroundService, stopMeetingForegroundService } from '../src/meetingForegroundService';

type TileLayout = { width: number; height: number; left: number; top: number };
type ParticipantTile = {
  userId: string;
  name: string;
  stream: any | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isLocal: boolean;
  profilePictureUrl: string | null;
};

const GAP = 8;

function computeLayouts(count: number, w: number, h: number): TileLayout[] {
  if (count === 0 || w === 0 || h === 0) return [];

  if (count === 1) {
    return [{ width: w, height: h, left: 0, top: 0 }];
  }
  if (count === 2) {
    const tileH = (h - GAP) / 2;
    return [
      { width: w, height: tileH, left: 0, top: 0 },
      { width: w, height: tileH, left: 0, top: tileH + GAP },
    ];
  }
  if (count === 3) {
    const tileH = (h - GAP) / 2;
    const halfW = (w - GAP) / 2;
    return [
      { width: w, height: tileH, left: 0, top: 0 },
      { width: halfW, height: tileH, left: 0, top: tileH + GAP },
      { width: halfW, height: tileH, left: halfW + GAP, top: tileH + GAP },
    ];
  }
  if (count === 4) {
    const tileH = (h - GAP) / 2;
    const tileW = (w - GAP) / 2;
    return [
      { width: tileW, height: tileH, left: 0, top: 0 },
      { width: tileW, height: tileH, left: tileW + GAP, top: 0 },
      { width: tileW, height: tileH, left: 0, top: tileH + GAP },
      { width: tileW, height: tileH, left: tileW + GAP, top: tileH + GAP },
    ];
  }

  // 5–6: 2 columns x 3 rows fitted to viewport
  const rows = Math.ceil(count / 2);
  const tileW = (w - GAP) / 2;
  const tileH = (h - GAP * (rows - 1)) / rows;
  const out: TileLayout[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / 2);
    const col = i % 2;
    out.push({
      width: tileW,
      height: tileH,
      left: col * (tileW + GAP),
      top: row * (tileH + GAP),
    });
  }
  return out;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes();
  const hh = ((h + 11) % 12) + 1;
  const mm = m < 10 ? `0${m}` : `${m}`;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${hh}:${mm} ${ampm}`;
}

export default function MeetingRoom() {
  const router = useRouter();
  const { roomId, userId, userName, initialMicOn, initialCamOn } = useLocalSearchParams<{
    roomId: string;
    userId: string;
    userName: string;
    isTutor: string;
    initialMicOn?: string;
    initialCamOn?: string;
  }>();

  const startMicOn = initialMicOn !== '0';
  const startCamOn = initialCamOn !== '0';

  const [localPhoto, setLocalPhoto] = useState<string | null>(null);

  // Load the local user's profile picture so we can broadcast it on JOIN and
  // also render it in our own tile when the camera is off.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('userData');
        if (!stored || cancelled) return;
        const parsed = JSON.parse(stored);
        if (parsed?.profilePictureUrl) setLocalPhoto(parsed.profilePictureUrl);
      } catch (e) {
        console.warn('[MeetingRoom] failed to load local photo:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const {
    localStream,
    remoteParticipants,
    isMicOn,
    isCameraOn,
    wsConnected,
    chatMessages,
    toggleMic,
    toggleCamera,
    endCall,
    sendChatMessage,
  } = useWebRTC(roomId, userId, userName, true, startMicOn, startCamOn);

  const [tilesBox, setTilesBox] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [chatOpen, setChatOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [lastSeenLen, setLastSeenLen] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const chatListRef = useRef<FlatList<MeetingChatMessage>>(null);

  // Track keyboard height manually — edge-to-edge layouts make windowSoftInputMode=adjustResize
  // unreliable, so we lift the chat panel ourselves to keep the input bar visible.
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Route call audio to the loud speaker for the lifetime of the meeting.
  // Default Android routing sends WebRTC audio to the earpiece, which is barely audible.
  useEffect(() => {
    try {
      InCallManager.start({ media: 'video' });
      InCallManager.setForceSpeakerphoneOn(true);
      InCallManager.setSpeakerphoneOn(true);
    } catch (e) {
      console.warn('[InCallManager] start failed:', e);
    }
    // Promote the app to a foreground service so Android keeps the JS thread,
    // WebSocket, camera and mic alive when the user switches apps mid-call.
    startMeetingForegroundService(userName ?? '');
    return () => {
      try {
        InCallManager.setForceSpeakerphoneOn(false);
        InCallManager.stop();
      } catch (e) {
        console.warn('[InCallManager] stop failed:', e);
      }
      stopMeetingForegroundService();
    };
  }, []);

  const handleEndCall = () => {
    endCall();
    router.back();
  };

  const allParticipants = useMemo<ParticipantTile[]>(() => {
    const local: ParticipantTile = {
      userId: userId ?? 'me',
      name: 'You',
      stream: localStream,
      isMuted: !isMicOn,
      isCameraOff: !isCameraOn,
      isLocal: true,
      profilePictureUrl: localPhoto,
    };
    const remotes: ParticipantTile[] = remoteParticipants.map(p => ({
      userId: p.userId,
      name: p.name,
      stream: p.stream,
      isMuted: p.isMuted,
      isCameraOff: p.isCameraOff,
      isLocal: false,
      profilePictureUrl: p.profilePictureUrl,
    }));
    // Local first when alone, remotes first otherwise (remote is the focus)
    return remotes.length === 0 ? [local] : [...remotes, local];
  }, [remoteParticipants, localStream, userId, isMicOn, isCameraOn, localPhoto]);

  const layouts = useMemo(
    () => computeLayouts(allParticipants.length, tilesBox.w, tilesBox.h),
    [allParticipants.length, tilesBox.w, tilesBox.h],
  );

  // Unread chat badge
  useEffect(() => {
    if (chatOpen) setLastSeenLen(chatMessages.length);
  }, [chatOpen, chatMessages.length]);
  const unread = chatOpen ? 0 : Math.max(0, chatMessages.length - lastSeenLen);

  // Autoscroll chat to bottom when a new message arrives or panel opens
  useEffect(() => {
    if (!chatOpen) return;
    requestAnimationFrame(() => {
      chatListRef.current?.scrollToEnd({ animated: true });
    });
  }, [chatOpen, chatMessages.length]);

  const onTilesLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== tilesBox.w || height !== tilesBox.h) {
      setTilesBox({ w: width, h: height });
    }
  };

  const renderTile = (participant: ParticipantTile, layout: TileLayout, idx: number) => {
    const hasStream = !!participant.stream;
    const streamURL = hasStream && RTCView
      ? (participant.stream.toURL ? participant.stream.toURL() : participant.stream.id)
      : null;

    return (
      <View
        key={participant.userId + idx}
        style={[
          styles.tile,
          {
            position: 'absolute',
            width: layout.width,
            height: layout.height,
            left: layout.left,
            top: layout.top,
          },
        ]}
      >
        {streamURL && !participant.isCameraOff ? (
          <RTCView
            streamURL={streamURL}
            style={styles.tileVideo}
            objectFit="cover"
            mirror={participant.isLocal}
          />
        ) : (
          <View style={styles.tilePlaceholder}>
            {participant.profilePictureUrl ? (
              <Image
                source={{ uri: participant.profilePictureUrl }}
                style={[
                  styles.tileAvatar,
                  {
                    width: Math.min(140, Math.max(64, Math.min(layout.width, layout.height) * 0.5)),
                    height: Math.min(140, Math.max(64, Math.min(layout.width, layout.height) * 0.5)),
                  },
                ]}
              />
            ) : (
              <Ionicons
                name="person-circle"
                size={Math.min(96, Math.max(48, Math.min(layout.width, layout.height) * 0.35))}
                color="#555"
              />
            )}
          </View>
        )}

        <View style={styles.nameLabel}>
          {participant.isMuted && (
            <Ionicons name="mic-off" size={14} color="#fff" style={styles.mutedIcon} />
          )}
          <Text style={styles.nameText} numberOfLines={1}>{participant.name}</Text>
        </View>
      </View>
    );
  };

  const renderChatItem = ({ item }: { item: MeetingChatMessage }) => (
    <View style={styles.chatItem}>
      <View style={styles.chatItemHeader}>
        <Text style={styles.chatSender}>{item.isLocal ? 'You' : item.senderName}</Text>
        <Text style={styles.chatTime}>{formatTime(item.timestamp)}</Text>
      </View>
      <Text style={styles.chatText}>{item.text}</Text>
    </View>
  );

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    sendChatMessage(trimmed);
    setDraft('');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {!wsConnected && (
        <View style={styles.connectingBanner}>
          <Text style={styles.connectingText}>Connecting…</Text>
        </View>
      )}

      <View style={styles.tilesArea} onLayout={onTilesLayout}>
        {layouts.length === allParticipants.length &&
          allParticipants.map((p, i) => renderTile(p, layouts[i], i))}
      </View>

      <View style={styles.controlBar}>
        <TouchableOpacity
          style={styles.ctrlBtn}
          onPress={() => setChatOpen(true)}
        >
          <Ionicons name="chatbubble" size={22} color="#fff" />
          {unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ctrlBtn, !isMicOn && styles.ctrlBtnOff]}
          onPress={toggleMic}
        >
          <Ionicons name={isMicOn ? 'mic' : 'mic-off'} size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ctrlBtn, !isCameraOn && styles.ctrlBtnOff]}
          onPress={toggleCamera}
        >
          <Ionicons name={isCameraOn ? 'videocam' : 'videocam-off'} size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
          <Ionicons name="call" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {chatOpen && (
        <View style={styles.chatOverlay}>
          <View
            style={[
              styles.chatPanel,
              keyboardHeight > 0 && { paddingBottom: keyboardHeight + 12 },
            ]}
          >
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>In-call messages</Text>
              <TouchableOpacity onPress={() => setChatOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.chatNotice}>
              Messages can only be seen by people in the call and are deleted when the call ends.
            </Text>

            {chatMessages.length === 0 ? (
              <ScrollView contentContainerStyle={styles.chatEmpty}>
                <Ionicons name="chatbubbles-outline" size={48} color="#444" />
                <Text style={styles.chatEmptyText}>No messages yet</Text>
              </ScrollView>
            ) : (
              <FlatList
                ref={chatListRef}
                data={chatMessages}
                keyExtractor={(m) => m.id}
                renderItem={renderChatItem}
                contentContainerStyle={styles.chatListContent}
                onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: true })}
              />
            )}

            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Send a message"
                placeholderTextColor="#777"
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                multiline
              />
              <TouchableOpacity
                style={[styles.chatSendBtn, !draft.trim() && styles.chatSendBtnDisabled]}
                onPress={handleSend}
                disabled={!draft.trim()}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  tilesArea: {
    flex: 1,
    margin: 12,
    position: 'relative',
  },
  tile: {
    backgroundColor: '#2a2a2a',
    borderRadius: 14,
    overflow: 'hidden',
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
  tileAvatar: {
    borderRadius: 999,
    backgroundColor: '#3a3a3a',
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
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e53935',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#111',
  },
  unreadText: {
    fontFamily: 'Poppins',
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  chatOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  chatPanel: {
    backgroundColor: '#1f1f1f',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 14,
    paddingBottom: 12,
    height: '75%',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  chatTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  chatNotice: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: '#888',
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  chatListContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
  },
  chatItem: {
    marginBottom: 14,
  },
  chatItemHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 2,
  },
  chatSender: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: '#95CDF2',
  },
  chatTime: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: '#666',
  },
  chatText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#eee',
    lineHeight: 20,
  },
  chatEmpty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  chatEmptyText: {
    fontFamily: 'Poppins',
    color: '#666',
    fontSize: 13,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    color: '#fff',
    fontFamily: 'Poppins',
    fontSize: 14,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    maxHeight: 110,
  },
  chatSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A6BCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatSendBtnDisabled: {
    backgroundColor: '#3a3a3a',
  },
});
