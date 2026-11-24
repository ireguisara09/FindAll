
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, formatPrice } from '../theme';
import GradientButton from './GradientButton';
import ProductImage from './ProductImage';
import { useApp } from '../context/AppContext';

export default function ProductCard({ product, width, onPress }) {
  const {
    favorites,
    toggleFavorite,
    addToCart,
    role,
  } = useApp();

  const canBuy = role !== 'seller';
  const isFav = favorites.includes(product.id);

  const hasVariants =
    Array.isArray(product.variants) &&
    product.variants.length > 0;

  // Calcula el inventario total, incluyendo las variantes.
  const stock = hasVariants
    ? product.variants.reduce(
        (total, variant) =>
          total + Math.max(0, Number(variant.stock) || 0),
        0
      )
    : Math.max(0, Number(product.stock) || 0);

  const soldOut = stock <= 0;

  // Si hay variantes, el comprador debe seleccionarlas en el modal.
  const handleCart = () => {
    if (soldOut) return;

    if (hasVariants) {
      onPress(product);
      return;
    }

    addToCart(product);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(product)}
      style={[styles.card, { width }]}
    >
      {canBuy && (
        <TouchableOpacity
          style={styles.heart}
          onPress={() => toggleFavorite(product.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={26}
            color={isFav ? colors.heart : '#000'}
          />
        </TouchableOpacity>
      )}

      <ProductImage
        product={product}
        style={styles.image}
        iconSize={60}
      />

      <Text style={styles.meta} numberOfLines={1}>
        {product.category} ·{' '}
        <Text style={soldOut ? styles.soldOut : styles.stock}>
          {soldOut ? 'Agotado' : `${stock} disponibles`}
        </Text>
      </Text>

      <View style={styles.bottom}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>

          <Text style={styles.price}>
            {formatPrice(product.price)}
          </Text>

          {hasVariants && (
            <Text style={styles.variantInfo}>
              {product.variants.length} opciones disponibles
            </Text>
          )}
        </View>

        {canBuy && (
          <View style={styles.cartContainer}>
            {soldOut ? (
              <View style={[styles.cartBtn, styles.disabledBtn]}>
                <Ionicons
                  name="cart-outline"
                  size={26}
                  color="#777"
                />
              </View>
            ) : (
              <GradientButton
                onPress={handleCart}
                style={styles.cartBtn}
              >
                <Ionicons
                  name="cart-outline"
                  size={26}
                  color="#000"
                />
              </GradientButton>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 12,
    marginBottom: 14,
  },
  heart: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 140,
    marginTop: 4,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: '#555',
    marginTop: 6,
  },
  stock: {
    color: colors.orange,
    fontFamily: fonts.bold,
  },
  soldOut: {
    color: colors.danger,
    fontFamily: fonts.bold,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#000',
  },
  price: {
    fontFamily: fonts.regular,
    fontSize: 18,
    color: '#000',
  },
  variantInfo: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: '#555',
    marginTop: 3,
  },
  cartContainer: {
    marginLeft: 6,
  },
  cartBtn: {
    marginLeft: 0,
  },
  disabledBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
});
