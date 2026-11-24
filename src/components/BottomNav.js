
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import {
  gradientProps,
  fonts,
  colors,
} from '../theme';

import { useApp } from '../context/AppContext';

// Navegación principal del comprador.
const BUYER_ITEMS = [
  { key: 'home', label: 'Catálogo', icon: 'home-outline' },
  { key: 'cart', label: 'Carrito', icon: 'cart-outline' },
  { key: 'favorites', label: 'Favoritos', icon: 'heart-outline' },
  { key: 'history', label: 'Historial', icon: 'receipt-outline' },
  { key: 'more', label: 'Más', icon: 'grid-outline' },
];

// Opciones agrupadas en el menú Más.
const MORE_ITEMS = [
  {
    key: 'comparison',
    label: 'Comparar productos',
    description: 'Revisa y compara productos seleccionados.',
    icon: 'git-compare-outline',
  },
  {
    key: 'notifications',
    label: 'Avisos',
    description: 'Consulta tus notificaciones y novedades.',
    icon: 'notifications-outline',
  },
  {
    key: 'help',
    label: 'Centro de ayuda',
    description: 'Crea solicitudes y consulta su seguimiento.',
    icon: 'headset-outline',
  },
];

// Navegación del vendedor.
const SELLER_ITEMS = [
  { key: 'seller', label: 'Mis productos', icon: 'storefront-outline' },
  { key: 'seller-new', label: 'Nuevo', icon: 'add-circle-outline' },
  { key: 'home', label: 'Catálogo', icon: 'home-outline' },
];

export default function BottomNav({ current, onNavigate }) {
  const {
    totals,
    role,
    comparisonIds = [],
    unreadNotifications = 0,
  } = useApp();

  const [showMore, setShowMore] = useState(false);

  const isSeller = role === 'seller';

  const items = isSeller
    ? SELLER_ITEMS
    : BUYER_ITEMS;

  const activeKey = current === 'checkout'
    ? 'cart'
    : current;

  // Las pantallas agrupadas se consideran parte de Más.
  const moreScreens = ['comparison', 'notifications', 'help'];

  const moreIsActive = moreScreens.includes(current);

  const handleNavigate = (key) => {
    setShowMore(false);
    onNavigate(key);
  };

  return (
    <>
      <LinearGradient
        {...gradientProps}
        style={styles.nav}
      >
        {items.map((it) => {
          const active = it.key === 'more'
            ? moreIsActive
            : activeKey === it.key;

          return (
            <TouchableOpacity
              key={it.key}
              style={styles.item}
              onPress={() => {
                if (it.key === 'more') {
                  setShowMore(true);
                } else {
                  handleNavigate(it.key);
                }
              }}
              activeOpacity={0.7}
            >
              <View>
                <Ionicons
                  name={
                    active && it.key !== 'more'
                      ? it.icon.replace('-outline', '')
                      : active && it.key === 'more'
                      ? 'grid'
                      : it.icon
                  }
                  size={25}
                  color="#000"
                />

                {/* Contador del carrito */}
                {it.key === 'cart' && totals.count > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {totals.count > 99 ? '99+' : totals.count}
                    </Text>
                  </View>
                )}

                {/* Indicador de novedades dentro de Más */}
                {it.key === 'more' && unreadNotifications > 0 && (
                  <View style={styles.moreDot} />
                )}
              </View>

              <Text
                style={styles.label}
                numberOfLines={1}
              >
                {it.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </LinearGradient>

      {/* Menú desplegable Más */}
      <Modal
        visible={showMore}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMore(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMore(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.menuContainer}
            onPress={() => {}}
          >
            <View style={styles.menuHeader}>
              <View>
                <Text style={styles.menuTitle}>Más opciones</Text>
                <Text style={styles.menuSubtitle}>
                  Explora otras funciones de FindAll.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowMore(false)}
              >
                <Ionicons
                  name="close"
                  size={21}
                  color="#555"
                />
              </TouchableOpacity>
            </View>

            {MORE_ITEMS.map((item) => {
              const active = current === item.key;

              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.menuItem,
                    active && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigate(item.key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIconContainer}>
                    <Ionicons
                      name={item.icon}
                      size={23}
                      color={colors.orange}
                    />

                    {/* Contador de comparación */}
                    {item.key === 'comparison' &&
                      comparisonIds.length > 0 && (
                        <View style={styles.menuBadge}>
                          <Text style={styles.menuBadgeText}>
                            {comparisonIds.length > 99
                              ? '99+'
                              : comparisonIds.length}
                          </Text>
                        </View>
                      )}

                    {/* Contador de avisos */}
                    {item.key === 'notifications' &&
                      unreadNotifications > 0 && (
                        <View style={styles.menuBadge}>
                          <Text style={styles.menuBadgeText}>
                            {unreadNotifications > 99
                              ? '99+'
                              : unreadNotifications}
                          </Text>
                        </View>
                      )}
                  </View>

                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>
                      {item.label}
                    </Text>

                    <Text style={styles.menuItemDescription}>
                      {item.description}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={19}
                    color="#999"
                  />
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 14,
    paddingHorizontal: 4,
  },

  item: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  label: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: '#000',
    marginTop: 3,
  },

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

  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: fonts.bold,
  },

  moreDot: {
    position: 'absolute',
    top: -2,
    right: -5,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.danger,
    borderWidth: 1,
    borderColor: '#fff',
  },

  // Modal Más
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'flex-end',
  },

  menuContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 30,
  },

  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
  },

  menuTitle: {
    fontFamily: fonts.bold,
    fontSize: 19,
    color: '#222',
  },

  menuSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },

  closeButton: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: '#F3F3F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 11,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#FAFAFC',
    borderWidth: 1,
    borderColor: '#EEEEF2',
  },

  menuItemActive: {
    backgroundColor: '#FFF5E8',
    borderColor: colors.orange,
  },

  menuIconContainer: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#FFF0DD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  menuItemText: {
    flex: 1,
  },

  menuItemTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#252525',
  },

  menuItemDescription: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: '#888',
    marginTop: 4,
  },

  menuBadge: {
    position: 'absolute',
    top: -5,
    right: -7,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },

  menuBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: '#fff',
  },
});
