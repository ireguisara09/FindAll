import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, CATEGORY_ICONS } from '../theme';

// Muestra la foto del producto o, si no tiene, el ícono de su categoría.
export default function ProductImage({ product, style, iconSize = 64 }) {
  if (product.image) {
    return <Image source={product.image} style={style} resizeMode="contain" />;
  }
  return (
    <View style={[style, styles.placeholder]}>
      <Ionicons
        name={CATEGORY_ICONS[product.category] || 'cube-outline'}
        size={iconSize}
        color={colors.orange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,122,33,0.08)',
    borderRadius: 16,
  },
});
