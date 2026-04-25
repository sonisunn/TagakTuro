// components/BottomNav.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', icon: 'home', route: '/homepage' },
    { name: 'Book', icon: 'calendar', route: '/book' },
    { name: 'Messages', icon: 'chatbubbles', route: '/messages' },
    { name: 'Feedback', icon: 'star', route: '/feedback' },
  ];

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => {
        const isActive = pathname === item.route;
        return (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem}
            onPress={() => router.navigate(item.route)}
            activeOpacity={0.7}
            disabled={false}
          >
            {isActive && <View style={styles.activeNavBar} />}
            <Ionicons
              name={item.icon}
              size={24}
              color={isActive ? '#2B74B4' : '#95CDF2'}
            />
            <Text style={isActive ? styles.navTextActive : styles.navText}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
    position: 'relative',
    marginBottom: 10,
  },
  activeNavBar: {
    position: 'absolute',
    top: -16,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#2B74B4',
  },
  navText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: '#95CDF2',
    marginTop: 2,
  },
  navTextActive: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '600',
    color: '#2B74B4',
    marginTop: 2,
  },
});