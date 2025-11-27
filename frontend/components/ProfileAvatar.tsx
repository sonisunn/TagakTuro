import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileAvatarProps {
  uri?: string | null;
  size?: number;
  opacity?: number;
  showPlaceholder?: boolean;
}

export default function ProfileAvatar({
  uri,
  size = 120,
  opacity = 1,
  showPlaceholder = true
}: ProfileAvatarProps) {
  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.avatar, avatarStyle, { opacity }]}
      />
    );
  }

  if (!showPlaceholder) {
    return null;
  }

  return (
    <View style={[styles.avatarPlaceholder, avatarStyle, { opacity }]}>
      <Ionicons name="person" size={size * 0.55} color="#cbd5e1" />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
});
