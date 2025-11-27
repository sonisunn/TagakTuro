import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// --- FIXED: InputGroup moved OUTSIDE the main component ---
const InputGroup = ({ label, value, editable, onChangeText, keyboardType }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input, 
          editable ? styles.inputEditable : styles.inputReadonly,
          // Apply color based on focus state
          { color: isFocused ? '#2B74B4' : '#95CDF2' } 
        ]}
        value={value}
        editable={editable}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={label === "Phone Number" ? 11 : undefined}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

export default function ProfilePage() {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    fullName: '',
    email: '',
    course: '',
    phone: '', // Will be loaded from user data
    imageUri: null,
  });

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        const studentId = await AsyncStorage.getItem('studentId');

        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setProfileData(prev => ({
            ...prev,
            name: userData.name || '',
            fullName: userData.name || '',
            email: userData.email || '',
            course: userData.courseProgram || '',
            // Load phone number from user data (from registration)
            phone: userData.phoneNumber || '',
          }));
        }

        // Load saved profile image
        const savedImage = await AsyncStorage.getItem('profileImage');
        if (savedImage) {
          setProfileData(prev => ({
            ...prev,
            imageUri: savedImage,
          }));
        }

        // Load saved phone number (overrides the registration phone if user updated it)
        const savedPhone = await AsyncStorage.getItem('profilePhone');
        if (savedPhone) {
          setProfileData(prev => ({
            ...prev,
            phone: savedPhone,
          }));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  const [tempPhone, setTempPhone] = useState('');
  const [tempImage, setTempImage] = useState(null);

  const handleUpdateClick = () => {
    setTempPhone(profileData.phone);
    setTempImage(profileData.imageUri);
    setIsEditing(true);
  };

  const handleBackFromEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    // Phone Number Validation (only if user entered something)
    const phoneRegex = /^\d{11}$/;

    // Only validate phone if user actually entered/changed it
    if (tempPhone && tempPhone.trim() !== '') {
      if (!phoneRegex.test(tempPhone.trim())) {
        Alert.alert("Invalid Input", "Phone number must be exactly 11 digits.");
        return;
      }
    }

    try {
      // Save profile data to AsyncStorage (only save what was changed)
      if (tempPhone && tempPhone.trim() !== '') {
        await AsyncStorage.setItem('profilePhone', tempPhone.trim());
      }

      if (tempImage) {
        await AsyncStorage.setItem('profileImage', tempImage);
      }

      // Update local state with what was actually changed
      setProfileData(prev => ({
        ...prev,
        phone: tempPhone && tempPhone.trim() !== '' ? tempPhone.trim() : prev.phone,
        imageUri: tempImage || prev.imageUri,
      }));

      setIsEditing(false);

      // Show success message
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert("Error", "Failed to save profile changes.");
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to grant camera roll permissions to change your photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setTempImage(result.assets[0].uri);
    }
  };

  // Reusable Component for Image vs Icon logic
  const ProfileAvatar = ({ uri, opacity = 1 }) => {
    if (uri) {
      return <Image source={{ uri: uri }} style={[styles.avatar, { opacity }]} />;
    }
    return (
      <View style={[styles.avatarPlaceholder, { opacity }]}>
        <Ionicons name="person" size={65} color="#cbd5e1" />
      </View>
    );
  };

  // --- EDIT VIEW ---
  if (isEditing) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            
            <View style={styles.headerSection}>
              <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrapper}>
                <ProfileAvatar uri={tempImage} opacity={0.7} />
                <View style={styles.editIconOverlay}>
                   <MaterialIcons name="edit" size={30} color="#2B74B4" />
                </View>
              </TouchableOpacity>
              <Text style={styles.h1Name}>{profileData.name}</Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.h2Title}>Change information</Text>
              <View style={styles.divider} />

              <InputGroup 
                label="Phone Number" 
                value={tempPhone} 
                editable={true} 
                onChangeText={setTempPhone}
                keyboardType="phone-pad"
              />
              <View style={[styles.buttonRow,]}> 
                <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={handleBackFromEdit}>
                  <Text style={[styles.btnText, styles.textBlue]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={handleSave}>
                  <Text style={[styles.btnText, styles.textWhite]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // --- PROFILE VIEW ---
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerSection}>
          <View style={styles.avatarWrapper}>
            <ProfileAvatar uri={profileData.imageUri} />
          </View>
          <Text style={styles.h1Name}>{profileData.name}</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.h2Title}>Account information</Text>
          <View style={styles.divider} />

          <InputGroup label="Name" value={profileData.fullName} editable={false} />
          <InputGroup label="Email" value={profileData.email} editable={false} />
          <InputGroup label="Course & Program" value={profileData.course} editable={false} />
          <InputGroup label="Phone Number" value={profileData.phone} editable={false} />

          <View style={[styles.buttonRow,]}>
            <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => router.back()}>
              <Text style={[styles.btnText, styles.textBlue]}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnBlue]} onPress={handleUpdateClick}>
              <Text style={[styles.btnText, styles.textWhite]}>Update</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.btn, styles.btnRed, styles.btnLogout]} onPress={() => router.replace('/login')}>
            <Text style={[styles.btnText, styles.textWhite]}>Log out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollContainer: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 60, 
    paddingBottom: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  editIconOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  h1Name: {
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 24,
    color: '#2B74B4', 
  },
  formSection: {
    padding: 25,
  },
  h2Title: {
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 24,
    color: '#2B74B4',
    marginBottom: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#2B74B4',
    width: '100%',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 17,
    color: '#2B74B4',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 12,
  },
  inputReadonly: {
    borderColor: '#2B74B4',
    backgroundColor: '#fff',
  },
  inputEditable: {
    borderColor: '#2B74B4',
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
  },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnOutline: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2B74B4',
  },
  btnBlue: {
    backgroundColor: '#2B74B4',
  },
  btnGreen: {
    backgroundColor: '#1bd71b', 
  },
  btnRed: {
    backgroundColor: '#ff0000',
  },
  btnLogout: {
    marginTop: 10,
    width: '100%',
  },
  btnText: {
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 15,
  },
  textBlue: {
    color: '#2B74B4',
  },
  textWhite: {
    color: '#fff',
  },
});