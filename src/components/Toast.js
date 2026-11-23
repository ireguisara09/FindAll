import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';
import { useApp } from '../context/AppContext';

const STYLE = {
  success: { bg: '#2E9E5B', icon: 'checkmark-circle' },
  info: { bg: '#444', icon: 'information-circle' },
  warn: { bg: '#E08A00', icon: 'warning' },
  error: { bg: colors.danger, icon: 'alert-circle' },
};

export default function Toast() {
  const { toast } = useApp();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [toast]);

  if (!toast) return null;
  const s = STYLE[toast.type] || STYLE.success;
  return (
    <Animated.View pointerEvents="none" style={[styles.toast, { opacity, backgroundColor: s.bg }]}>
      <Ionicons name={s.icon} size={20} color="#fff" />
      <Text style={styles.text}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 100,
    zIndex: 100,
    elevation: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  text: { flex: 1, marginLeft: 8, fontFamily: fonts.medium, fontSize: 13, color: '#fff' },
});
