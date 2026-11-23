import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, formatPrice } from '../theme';
import GradientButton from './GradientButton';
import ProductImage from './ProductImage';
import { useApp } from '../context/AppContext';
import { averageRating } from '../utils/logic';

// Se dibuja como capa dentro de la pantalla (no como <Modal>) para que
// el Header y el BottomNav sigan visibles, igual que en el prototipo.
export default function ProductModal({ product, onClose }) {
  const { favorites, toggleFavorite, addToCart, reviews, addReview, role } = useApp();
  const canBuy = role !== 'seller';
  const [size, setSize] = useState(product.sizes ? product.sizes[1] || product.sizes[0] : null);
  const [qty, setQty] = useState(1);
  const [ratingText, setRatingText] = useState('');

  const isFav = favorites.includes(product.id);
  const soldOut = product.stock <= 0;
  const list = reviews[product.id] || [];
  const avg = averageRating(list);
  const ratingNum = Number(ratingText);

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      <View style={styles.modal}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 18 }}
        >
          <View style={styles.topRow}>
            <TouchableOpacity onPress={onClose} style={styles.back} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color="#000" />
              <Text style={styles.backText}>Volver</Text>
            </TouchableOpacity>
            {canBuy && (
              <TouchableOpacity style={styles.heart} onPress={() => toggleFavorite(product.id)}>
                <Ionicons
                  name={isFav ? 'heart' : 'heart-outline'}
                  size={30}
                  color={isFav ? colors.heart : '#000'}
                />
              </TouchableOpacity>
            )}
          </View>

          <ProductImage product={product} style={styles.image} iconSize={110} />

          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>{formatPrice(product.price)}</Text>
              {list.length > 0 && (
                <View style={styles.avgRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Ionicons
                      key={n}
                      name={avg >= n ? 'star' : avg >= n - 0.5 ? 'star-half' : 'star-outline'}
                      size={18}
                      color="#F5B800"
                    />
                  ))}
                </View>
              )}
            </View>
            {canBuy && (
              <View style={soldOut && { opacity: 0.4 }}>
                <GradientButton onPress={() => addToCart(product, size, qty)}>
                  <Ionicons name="cart-outline" size={28} color="#000" />
                </GradientButton>
              </View>
            )}
          </View>

          <Text style={styles.line}>
            <Text style={styles.bold}>Descripción: </Text>
            {product.description}
          </Text>
          <Text style={[styles.line, { marginTop: 8 }]}>
            <Text style={styles.bold}>Categoría: </Text>
            <Text style={styles.accent}>{product.category}</Text>
          </Text>
          <Text style={[styles.line, { marginTop: 8 }]}>
            <Text style={styles.bold}>Disponibilidad: </Text>
            {soldOut ? (
              <Text style={styles.soldOut}>Agotado</Text>
            ) : (
              <Text style={styles.accent}>{product.stock} disponibles</Text>
            )}
          </Text>

          {!soldOut && (
            <View style={styles.options}>
              {product.sizes && (
                <View style={styles.optBox}>
                  <Text style={styles.optTitle}>Talla:</Text>
                  <View style={{ flexDirection: 'row' }}>
                    {product.sizes.map((s) => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setSize(s)}
                        style={[styles.sizeChip, size === s && styles.sizeActive]}
                      >
                        <Text style={styles.sizeText}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={[styles.optBox, { marginLeft: product.sizes ? 10 : 0 }]}>
                <Text style={styles.optTitle}>Cantidad:</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))}>
                    <Text style={styles.qtyBtn}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qty}>{qty}</Text>
                  <TouchableOpacity onPress={() => setQty(Math.min(product.stock, qty + 1))}>
                    <Text style={styles.qtyBtn}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          <Text style={[styles.line, { marginTop: 14 }]}>
            <Text style={styles.bold}>Emprendimiento: </Text>
            <Text style={styles.accent}>{product.brand}</Text>
          </Text>

          {/* ---- Reseñas (HU19) ---- */}
          <View style={styles.reviewBox}>
            <Text style={styles.optTitle}>Valoraciones</Text>
            {list.length === 0 ? (
              <Text style={styles.line}>Aún no hay valoraciones para este producto.</Text>
            ) : (
              <View style={styles.avgRow}>
                <Ionicons name="star" size={20} color={colors.orange} />
                <Text style={styles.avg}>{avg.toFixed(1)}</Text>
                <Text style={styles.line}>  ({list.length} {list.length === 1 ? 'valoración' : 'valoraciones'})</Text>
              </View>
            )}

            {canBuy && (<>
            <Text style={[styles.line, { marginTop: 10 }]}>Califica este producto (1 a 5):</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setRatingText(String(n))}>
                  <Ionicons
                    name={ratingNum >= n ? 'star' : 'star-outline'}
                    size={32}
                    color={colors.orange}
                  />
                </TouchableOpacity>
              ))}
              <TextInput
                style={styles.ratingInput}
                value={ratingText}
                onChangeText={setRatingText}
                keyboardType="number-pad"
                placeholder="1-5"
                placeholderTextColor="#777"
                maxLength={3}
              />
            </View>
            <GradientButton
              label="Enviar valoración"
              textStyle={{ fontSize: 14 }}
              style={{ marginTop: 10 }}
              onPress={() => {
                if (addReview(product.id, ratingText)) setRatingText('');
              }}
            />
            </>)}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,243,220,0.85)',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    zIndex: 10,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#000',
    overflow: 'hidden',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  backText: { fontFamily: fonts.bold, fontSize: 14, marginLeft: 6, color: '#000' },
  heart: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: 240, marginTop: 4 },
  name: { fontFamily: fonts.bold, fontSize: 24, color: '#000', marginTop: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontFamily: fonts.regular, fontSize: 30, color: '#000' },
  line: { fontFamily: fonts.regular, fontSize: 15, color: '#000', lineHeight: 22 },
  bold: { fontFamily: fonts.bold },
  accent: { fontFamily: fonts.bold, color: colors.orange },
  soldOut: { fontFamily: fonts.bold, color: colors.danger },
  options: { flexDirection: 'row', marginTop: 14 },
  optBox: { backgroundColor: colors.card, borderRadius: 14, padding: 10 },
  optTitle: { fontFamily: fonts.bold, fontSize: 15, marginBottom: 6, color: '#000' },
  sizeChip: {
    backgroundColor: colors.cardDark,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  sizeActive: { borderColor: colors.orange },
  sizeText: { fontFamily: fonts.bold, fontSize: 13, color: '#000' },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardDark,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
    minWidth: 100,
  },
  qtyBtn: { fontFamily: fonts.bold, fontSize: 22, color: colors.orange },
  qty: { fontFamily: fonts.bold, fontSize: 16, color: '#000', marginHorizontal: 10 },
  reviewBox: { backgroundColor: colors.card, borderRadius: 14, padding: 12, marginTop: 16 },
  avgRow: { flexDirection: 'row', alignItems: 'center' },
  avg: { fontFamily: fonts.bold, fontSize: 20, marginLeft: 4, color: '#000' },
  starsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingInput: {
    marginLeft: 12,
    width: 64,
    height: 38,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 15,
  },
});
