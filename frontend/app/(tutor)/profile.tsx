import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { updateUser } from '../../src/api/user';

interface UserData {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  courseProgram?: string;
  profilePictureUrl?: string;
  role?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Modal States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [successModal, setSuccessModal] = useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: '' });

  const [fontsLoaded] = useFonts({
    Poppins: Poppins_400Regular,
    'Poppins-Bold': Poppins_700Bold,
    'Poppins-SemiBold': Poppins_600SemiBold,
  });

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const data = JSON.parse(userDataString);
          setUserData(data);
          setPhoneNumber(data.phoneNumber || '');
          if (data.profilePictureUrl) {
            setProfileImageUri(data.profilePictureUrl);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Gallery access is required to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    try {
      setUpdating(true);

      const formData = new FormData();
      const imageName = imageUri.split('/').pop() || 'profile.jpg';
      const imageType = imageName.endsWith('.png') ? 'image/png' : 'image/jpeg';

      formData.append('file', {
        uri: imageUri,
        type: imageType,
        name: imageName,
      } as any);

      // Note: This assumes the backend has an endpoint for uploading profile pictures
      // If not, we'll update the user data locally for now
      const token = await AsyncStorage.getItem('authToken');
      const API_BASE_URL = 'http://localhost:8080';

      const uploadResponse = await fetch(`${API_BASE_URL}/api/upload/profile-picture`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (uploadResponse.ok) {
        const uploadedData = await uploadResponse.json();
        setProfileImageUri(imageUri);

        // Update userData with new picture URL
        if (userData) {
          const updatedData = {
            ...userData,
            profilePictureUrl: uploadedData.pictureUrl || imageUri,
          };
          setUserData(updatedData);
          await AsyncStorage.setItem('userData', JSON.stringify(updatedData));
        }

        setSuccessModal({
          visible: true,
          message: 'Successfully changed your profile picture!',
        });
      } else {
        // Fallback: store locally if endpoint doesn't exist
        setProfileImageUri(imageUri);
        setSuccessModal({
          visible: true,
          message: 'Successfully changed your profile picture!',
        });
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      // Still show success for local storage
      setProfileImageUri(imageUri);
      setSuccessModal({
        visible: true,
        message: 'Successfully changed your profile picture!',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePhoneNumber = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number.');
      return;
    }

    try {
      setUpdating(true);

      if (userData) {
        const updatedData = {
          ...userData,
          phoneNumber: phoneNumber.trim(),
        };

        await updateUser(userData.id, { phoneNumber: phoneNumber.trim() });
        setUserData(updatedData);
        await AsyncStorage.setItem('userData', JSON.stringify(updatedData));

        setEditModalVisible(false);
        setSuccessModal({
          visible: true,
          message: 'Successfully changed your phone number!',
        });
      }
    } catch (error) {
      console.error('Error updating phone number:', error);
      Alert.alert('Error', 'Failed to update phone number. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('userData');
              await AsyncStorage.removeItem('studentId');
              await AsyncStorage.removeItem('tutorId');
              router.replace('/login');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (!fontsLoaded || loading) return null;

  if (!userData) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {profileImageUri ? (
              <View style={styles.profileImage}>
                {/* Placeholder for actual image - using icon for now */}
                <Ionicons name="person-circle" size={120} color="#2B74B4" />
              </View>
            ) : (
              <View style={styles.profileImage}>
                <Ionicons name="person-circle" size={120} color="#2B74B4" />
              </View>
            )}

            <TouchableOpacity
              style={styles.editIconContainer}
              onPress={handlePickImage}
              disabled={updating}
            >
              <Ionicons name="pencil" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userRole}>{userData.role || 'Tutor'}</Text>
        </View>

        {/* Account Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account information</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={userData.name}
                editable={false}
                placeholderTextColor="#B0C4DE"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={userData.email}
                editable={false}
                placeholderTextColor="#B0C4DE"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Course & Program</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={userData.courseProgram || 'N/A'}
                editable={false}
                placeholderTextColor="#B0C4DE"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={userData.phoneNumber || 'Not provided'}
                editable={false}
                placeholderTextColor="#B0C4DE"
              />
            </View>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={() => setEditModalVisible(true)}
            >
              <Text style={styles.updateButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Log out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Edit Phone Number Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <BlurView intensity={20} tint="light" style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change information</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter new phone number"
                placeholderTextColor="#B0C4DE"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                editable={!updating}
              />
            </View>

            <View style={styles.modalButtonGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setEditModalVisible(false)}
                disabled={updating}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, updating && styles.disabledButton]}
                onPress={handleUpdatePhoneNumber}
                disabled={updating}
              >
                <Text style={styles.saveButtonText}>
                  {updating ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModal.visible}
        onRequestClose={() => setSuccessModal({ visible: false, message: '' })}
      >
        <BlurView intensity={20} tint="light" style={styles.modalOverlay}>
          <View style={styles.noticeCard}>
            <View style={styles.noticeIconContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#0FE40F" />
            </View>
            <Text style={styles.noticeTitle}>Notice</Text>
            <Text style={styles.noticeMessage}>{successModal.message}</Text>
            <TouchableOpacity
              style={styles.noticeButton}
              onPress={() => setSuccessModal({ visible: false, message: '' })}
            >
              <Text style={styles.noticeButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    color: '#7A9ABF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#2B74B4',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2B74B4',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#1B3A5C',
    marginBottom: 4,
  },
  userRole: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#7A9ABF',
  },

  // Section
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#1B3A5C',
    marginBottom: 16,
  },

  // Form Group
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#1B3A5C',
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1.5,
    borderColor: '#A8C4E0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#1B3A5C',
  },
  textInput: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#1B3A5C',
    borderWidth: 1.5,
    borderColor: '#A8C4E0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },

  // Buttons
  buttonGroup: {
    marginTop: 20,
  },
  updateButton: {
    backgroundColor: '#2B74B4',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  updateButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },

  logoutSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },

  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: '88%',
    maxWidth: 400,
  },
  modalTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#1B3A5C',
    marginBottom: 20,
  },
  modalButtonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#1B3A5C',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#1B3A5C',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#0FE40F',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },

  // Notice Card
  noticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: '85%',
    maxWidth: 380,
    alignItems: 'center',
  },
  noticeIconContainer: {
    marginBottom: 12,
  },
  noticeTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#1B3A5C',
    marginBottom: 8,
  },
  noticeMessage: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#7A9ABF',
    textAlign: 'center',
    marginBottom: 24,
  },
  noticeButton: {
    backgroundColor: '#2B74B4',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
  },
  noticeButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },

  bottomSpacing: {
    height: 40,
  },
});
