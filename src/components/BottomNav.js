import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { gradientProps, fonts, colors } from '../theme';
import { useApp } from '../context/AppContext';

// Comprador: Catálogo / Carrito / Favoritos / Historial
const BUYER_ITEMS = [
  { key: 'home', label: 'Catálogo', icon: 'home-outline' },
  { key: 'cart', label: 'Carrito', icon: 'cart-outline' },
  { key: 'favorites', label: 'Favoritos', icon: 'heart-outline' },
  { key: 'history', label: 'Historial', icon: 'receipt-outline' },
];

// Vendedor: servicios distintos (no compra)
const SELLER_ITEMS = [
  { key: 'seller', label: 'Mis productos', icon: 'storefront-outline' },
  { key: 'seller-new', label: 'Nuevo', icon: 'add-circle-outline' },
  { key: 'home', label: 'Catálogo', icon: 'home-outline' },
];

export default function BottomNav({ current, onNavigate }) {
  const { totals, role } = useApp();
  const items = role === 'seller' ? SELLER_ITEMS : BUYER_ITEMS;
  const activeKey = current === 'checkout' ? 'cart' : current;
  return (
    <LinearGradient {...gradientProps} style={styles.nav}>
      {items.map((it) => {
        const active = activeKey === it.key;
        return (
          <TouchableOpacity key={it.key} style={styles.item} onPress={() => onNavigate(it.key)} activeOpacity={0.7}>
            <View>
              <Ionicons name={active ? it.icon.replace('-outline', '') : it.icon} size={30} color="#000" />
              {it.key === 'cart' && totals.count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{totals.count}</Text>
                </View>
              )}
            </View>
            <Text style={styles.label}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8, paddingBottom: 14, paddingHorizontal: 6 },
  item: { alignItems: 'center', flex: 1 },
  label: { fontFamily: fonts.bold, fontSize: 11, color: '#000' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: fonts.bold },
});
