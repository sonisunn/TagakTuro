import { Stack, useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { getUser, updateUser, uploadProfilePhoto } from '../../src/api/user';

export default function TutorProfile() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noticeModal, setNoticeModal] = useState({ visible: false, message: '' });

  const [profileData, setProfileData] = useState({
    id: null as number | null,
    name: '',
    email: '',
    course: '',
    phone: '',
    imageBase64: null as string | null,
  });
  const [tempPhone, setTempPhone] = useState('');

  const [fontsLoaded] = useFonts({
    Poppins: Poppins_400Regular,
    'Poppins-Bold': Poppins_700Bold,
    'Poppins-SemiBold': Poppins_600SemiBold,
  });

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem('userData');
      if (!stored) return;
      const p = JSON.parse(stored);
      setProfileData({
        id: p.id || null,
        name: p.name || '',
        email: p.email || '',
        course: p.courseProgram || '',
        phone: p.phoneNumber || '',
        imageBase64: p.profilePictureUrl || null,
      });
      if (p.id) {
        try {
          const fresh = await getUser(p.id);
          const merged = {
            id: fresh.id,
            name: fresh.name || p.name,
            email: fresh.email || p.email,
            course: fresh.courseProgram || p.courseProgram,
            phone: fresh.phoneNumber || p.phoneNumber,
            imageBase64: fresh.profilePictureUrl || p.profilePictureUrl || null,
          };
          setProfileData(merged);
          await AsyncStorage.setItem('userData', JSON.stringify({
            ...p,
            name: merged.name,
            email: merged.email,
            courseProgram: merged.course,
            phoneNumber: merged.phone,
            profilePictureUrl: merged.imageBase64,
          }));
        } catch { /* use cached */ }
      }
    } catch (e) {
      console.warn('Failed to load profile', e);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['authToken', 'userData', 'studentId', 'tutorId', 'evaluatedBookings']);
    router.replace('/login');
  };

  const handleUpdateClick = () => {
    setTempPhone(profileData.phone);
    setIsEditing(true);
  };

  const handleBackFromEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!/^\d{11}$/.test(tempPhone)) {
      setNoticeModal({ visible: true, message: 'Phone number must be exactly 11 digits.' });
      return;
    }
    setSaving(true);
    try {
      const updated = await updateUser(profileData.id, {
        name: profileData.name,
        email: profileData.email,
        phoneNumber: tempPhone,
        courseProgram: profileData.course,
      });
      setProfileData(prev => ({ ...prev, phone: updated.phoneNumber || tempPhone }));
      const stored = await AsyncStorage.getItem('userData');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.phoneNumber = updated.phoneNumber || tempPhone;
        await AsyncStorage.setItem('userData', JSON.stringify(parsed));
      }
      setIsEditing(false);
      setNoticeModal({ visible: true, message: 'Successfully changed your phone number!' });
    } catch {
      setNoticeModal({ visible: true, message: 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setNoticeModal({ visible: true, message: 'Gallery permission is required to change your photo.' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType || 'image/jpeg';
    const imageBase64 = `data:${mimeType};base64,${asset.base64}`;

    setSaving(true);
    try {
      await uploadProfilePhoto(profileData.id, imageBase64);
      setProfileData(prev => ({ ...prev, imageBase64 }));
      const stored = await AsyncStorage.getItem('userData');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.profilePictureUrl = imageBase64;
        await AsyncStorage.setItem('userData', JSON.stringify(parsed));
      }
      setNoticeModal({ visible: true, message: 'Successfully changed your profile picture!' });
    } catch {
      setNoticeModal({ visible: true, message: 'Failed to upload photo. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const dismissNotice = () => setNoticeModal({ visible: false, message: '' });

  if (!fontsLoaded) return null;

  const AvatarDisplay = ({ dimmed = false }: { dimmed?: boolean }) =>
    profileData.imageBase64 ? (
      <Image
        source={{ uri: profileData.imageBase64 }}
        style={[styles.avatar, dimmed && { opacity: 0.65 }]}
      />
    ) : (
      <View style={[styles.avatarPlaceholder, dimmed && { opacity: 0.65 }]}>
        <Ionicons name="person" size={65} color="#cbd5e1" />
      </View>
    );

  const NoticeModal = () => (
    <Modal animationType="fade" transparent visible={noticeModal.visible} onRequestClose={dismissNotice}>
      <BlurView intensity={20} tint="light" style={styles.absolute}>
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Notice</Text>
          <Text style={styles.noticeBody}>{noticeModal.message}</Text>
          <TouchableOpacity style={styles.noticeBtn} onPress={dismissNotice}>
            <Text style={styles.noticeBtnText}>OK</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );

  // ── Edit view ──────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.headerSection}>
            <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrapper} disabled={saving}>
              <AvatarDisplay dimmed />
              <View style={styles.editIconOverlay}>
                <MaterialIcons name="edit" size={30} color="#2B74B4" />
              </View>
            </TouchableOpacity>
            <Text style={styles.h1Name}>{profileData.name}</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.h2Title}>Change information</Text>
            <View style={styles.divider} />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={tempPhone}
              onChangeText={setTempPhone}
              keyboardType="phone-pad"
              maxLength={11}
              placeholderTextColor="#B0C4DE"
              placeholder="09XXXXXXXXX"
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={handleBackFromEdit} disabled={saving}>
                <Text style={[styles.btnText, styles.textBlue]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={handleSave} disabled={saving}>
                <Text style={[styles.btnText, styles.textWhite]}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.btn, styles.btnRed, styles.btnFull]} onPress={handleLogout}>
              <Text style={[styles.btnText, styles.textWhite]}>Log out</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
        <NoticeModal />
      </KeyboardAvoidingView>
    );
  }

  // ── Profile view ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrapper} disabled={saving}>
            <AvatarDisplay />
            <View style={styles.editIconOverlay}>
              <MaterialIcons name="edit" size={30} color="#2B74B4" />
            </View>
          </TouchableOpacity>
          <Text style={styles.h1Name}>{profileData.name}</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.h2Title}>Account information</Text>
          <View style={styles.divider} />

          {[
            { label: 'Name', value: profileData.name },
            { label: 'Email', value: profileData.email },
            { label: 'Course & Program', value: profileData.course },
            { label: 'Phone Number', value: profileData.phone },
          ].map(({ label, value }) => (
            <View key={label} style={styles.inputGroup}>
              <Text style={styles.label}>{label}</Text>
              <View style={styles.readonlyBox}>
                <Text style={styles.readonlyText}>{value}</Text>
              </View>
            </View>
          ))}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => router.back()}>
              <Text style={[styles.btnText, styles.textBlue]}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnBlue]} onPress={handleUpdateClick}>
              <Text style={[styles.btnText, styles.textWhite]}>Update</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.btn, styles.btnRed, styles.btnFull]} onPress={handleLogout}>
            <Text style={[styles.btnText, styles.textWhite]}>Log out</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
      <NoticeModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F7' },
  scroll: { flex: 1 },
  absolute: {
    position: 'absolute', top: 0, left: 0, bottom: 0, right: 0,
    justifyContent: 'center', alignItems: 'center',
  },

  // Header
  headerSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 24,
  },
  avatarWrapper: {
    width: 120, height: 120, borderRadius: 60,
    marginBottom: 12, position: 'relative',
  },
  avatar: { width: '100%', height: '100%', borderRadius: 60 },
  avatarPlaceholder: {
    width: '100%', height: '100%', borderRadius: 60,
    backgroundColor: '#F0F2F5', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#DDE6F0',
  },
  editIconOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  h1Name: { fontFamily: 'Poppins-Bold', fontSize: 22, color: '#2B74B4' },

  // Form
  formSection: { padding: 24 },
  h2Title: { fontFamily: 'Poppins-Bold', fontSize: 20, color: '#2B74B4', marginBottom: 4 },
  divider: { height: 1, backgroundColor: '#2B74B4', marginBottom: 20 },
  inputGroup: { marginBottom: 14 },
  label: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#2B74B4', marginBottom: 5 },
  input: {
    borderWidth: 1.5, borderColor: '#2B74B4', borderRadius: 8,
    paddingVertical: 12, paddingHorizontal: 14,
    fontFamily: 'Poppins', fontSize: 13, color: '#2B74B4',
    backgroundColor: '#fff', marginBottom: 14,
  },
  readonlyBox: {
    borderWidth: 1.5, borderColor: '#2B74B4', borderRadius: 8,
    paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#fff',
  },
  readonlyText: { fontFamily: 'Poppins', fontSize: 13, color: '#95CDF2' },

  // Buttons
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 10 },
  btn: { flex: 1, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnFull: { flex: 0, width: '100%', marginTop: 4 },
  btnOutline: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#2B74B4' },
  btnBlue: { backgroundColor: '#2B74B4' },
  btnGreen: { backgroundColor: '#1bd71b' },
  btnRed: { backgroundColor: '#FF0000' },
  btnText: { fontFamily: 'Poppins-SemiBold', fontSize: 15 },
  textBlue: { color: '#2B74B4' },
  textWhite: { color: '#fff' },

  // Notice modal
  noticeCard: {
    backgroundColor: '#fff', width: '80%', borderRadius: 16,
    padding: 24, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#2B74B4',
    elevation: 10, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
  },
  noticeTitle: { fontFamily: 'Poppins-Bold', fontSize: 18, color: '#2B74B4', marginBottom: 8 },
  noticeBody: {
    fontFamily: 'Poppins', fontSize: 13,
    color: '#7A9ABF', textAlign: 'center', marginBottom: 20,
  },
  noticeBtn: {
    backgroundColor: '#2B74B4', borderRadius: 10,
    paddingVertical: 12, width: '100%', alignItems: 'center',
  },
  noticeBtnText: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#fff' },
});
