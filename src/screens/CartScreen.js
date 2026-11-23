import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import GradientButton from '../components/GradientButton';
import ProductImage from '../components/ProductImage';
import SummaryBox from '../components/SummaryBox';
import { EmptyState } from './HomeScreen';
import { colors, fonts, formatPrice } from '../theme';
import { useApp } from '../context/AppContext';

export default function CartScreen({ navigate }) {
  const {
    lines, totals, coupon, favorites, toggleFavorite,
    changeQty, removeLine, notify,
  } = useApp();

  const count = totals.count;

  const next = () => {
    if (lines.length === 0) {
      notify('Tu carrito está vacío. Agrega productos para continuar.', 'warn');
      return;
    }
    navigate('checkout');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header navigate={navigate} />

      <View style={styles.titleRow}>
        <Text style={styles.title}>MI CARRITO</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{count} {count === 1 ? 'Producto' : 'Productos'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10 }} keyboardShouldPersistTaps="handled">
        {lines.length === 0 && (
          <EmptyState
            icon="cart-outline"
            text="Tu carrito está vacío."
            action="Ir al catálogo"
            onAction={() => navigate('home')}
          />
        )}

        {lines.map((l, idx) => {
          const p = l.product;
          const isFav = favorites.includes(p.id);
          return (
            <View key={`${p.id}-${l.size}`} style={styles.row}>
              {/* El círculo del prototipo ahora elimina la referencia (HU10) */}
              <TouchableOpacity style={styles.trash} onPress={() => removeLine(idx)}>
                <Ionicons name="trash-outline" size={26} color={colors.orange} />
              </TouchableOpacity>

              <View style={styles.card}>
                <TouchableOpacity style={styles.heart} onPress={() => toggleFavorite(p.id)}>
                  <Ionicons
                    name={isFav ? 'heart' : 'heart-outline'}
                    size={22}
                    color={isFav ? colors.heart : '#000'}
                  />
                </TouchableOpacity>
                <ProductImage product={p} style={styles.img} iconSize={50} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.name}>{p.name}</Text>
                  <Text style={styles.price}>{formatPrice(p.price)}</Text>
                  {l.size && <Text style={styles.meta}>Talla: {l.size}</Text>}

                  <View style={styles.qtyRow}>
                    <TouchableOpacity onPress={() => changeQty(idx, -1)} style={styles.qtyBtnBox}>
                      <Text style={styles.qtyBtn}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qty}>{l.qty}</Text>
                    <TouchableOpacity onPress={() => changeQty(idx, +1)} style={styles.qtyBtnBox}>
                      <Text style={styles.qtyBtn}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.lineTotal}>Subtotal: {formatPrice(p.price * l.qty)}</Text>
                </View>
              </View>
            </View>
          );
        })}

        <SummaryBox totals={totals} coupon={coupon} />
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
        <GradientButton label="Continuar con la compra" onPress={next} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  title: { fontFamily: fonts.bold, fontSize: 28, color: colors.orange },
  pill: { backgroundColor: colors.card, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  pillText: { fontFamily: fonts.bold, fontSize: 14, color: colors.orange },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  trash: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.circle, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  card: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 20, padding: 12, minHeight: 150 },
  heart: { position: 'absolute', top: 8, right: 8, zIndex: 2, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.circle, alignItems: 'center', justifyContent: 'center' },
  img: { width: 100, height: 120 },
  name: { fontFamily: fonts.bold, fontSize: 14, color: '#000', marginTop: 26 },
  price: { fontFamily: fonts.regular, fontSize: 17, color: '#000', marginVertical: 2 },
  meta: { fontFamily: fonts.medium, fontSize: 12, color: '#444' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.cardDark, borderRadius: 14, marginTop: 6 },
  qtyBtnBox: { paddingHorizontal: 12, paddingVertical: 2 },
  qtyBtn: { fontFamily: fonts.bold, fontSize: 22, color: colors.orange },
  qty: { fontFamily: fonts.bold, fontSize: 15, color: '#000', minWidth: 20, textAlign: 'center' },
  lineTotal: { fontFamily: fonts.bold, fontSize: 12, color: colors.orange, marginTop: 4 },
  couponBox: { backgroundColor: colors.card, borderRadius: 18, padding: 14, marginBottom: 14 },
  couponTitle: { fontFamily: fonts.bold, fontSize: 16, color: '#000', marginBottom: 8 },
  couponRow: { flexDirection: 'row', alignItems: 'center' },
  couponInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, height: 44, fontFamily: fonts.regular, fontSize: 15 },
  couponApplied: { flexDirection: 'row', alignItems: 'center' },
  couponAppliedText: { flex: 1, fontFamily: fonts.bold, fontSize: 14, color: colors.orange, marginLeft: 6 },
  couponRemove: { fontFamily: fonts.bold, fontSize: 14, color: colors.link },
  couponMsg: { fontFamily: fonts.medium, fontSize: 13, marginTop: 8 },
});
