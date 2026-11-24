
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradientProps, fonts } from '../theme';

export default function GradientButton({
  label,
  onPress,
  style,
  textStyle,
  right,
  children,
  disabled = false,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={style}
      disabled={disabled}
    >
      <LinearGradient
        {...gradientProps}
        style={[
          styles.btn,
          disabled && styles.disabled,
        ]}
      >
        {children ?? (
          <Text style={[styles.text, textStyle]}>
            {label}
          </Text>
        )}
        {right}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 18,
    color: '#000',
  },
});
