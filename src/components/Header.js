
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Pressable,
  Modal,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import {
  colors,
  fonts,
  gradientProps,
} from '../theme';

import { useApp } from '../context/AppContext';

const TAGLINE = 'Encuentra todo, en un solo lugar';

const TOP =
  Platform.OS === 'android'
    ? StatusBar.currentHeight || 24
    : 50;

export default function Header({
  variant = 'simple',
  query = '',
  onQuery,
  navigate,

  // Nombres utilizados por HomeScreen.
  onOpenFilters,
  activeFiltersCount = 0,

  // Compatibilidad con nombres anteriores.
  onToggleFilters,
  activeFilterCount,

  filtersExpanded = false,
}) {
  const { role, user, seller, logout } = useApp();

  const [menu, setMenu] = useState(false);

  // Permite utilizar ambos nombres de propiedades.
  const handleOpenFilters = onOpenFilters || onToggleFilters;

  const filterCount =
    activeFilterCount !== undefined
      ? activeFilterCount
      : activeFiltersCount;

  const go = (screen) => {
    setMenu(false);

    if (navigate) {
      navigate(screen);
    }
  };

  const person = user || seller;

  const label = person?.name
    ? person.name.split(' ')[0]
    : 'Sign Up';

  const handleLogout = () => {
    setMenu(false);
    logout();
  };

  return (
    <LinearGradient
      {...gradientProps}
      style={styles.header}
    >
      {/* Fila superior: logo, eslogan y usuario */}
      <View style={styles.topRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => go('home')}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Text style={styles.tagline}>
          {TAGLINE}
        </Text>

        <TouchableOpacity
          style={styles.user}
          onPress={() => setMenu(true)}
          activeOpacity={0.8}
        >
          <Text
            style={styles.signUp}
            numberOfLines={1}
          >
            {label}
          </Text>

          <Ionicons
            name="person-circle-outline"
            size={42}
            color="#000"
          />
        </TouchableOpacity>
      </View>

      {/* Fila inferior: buscador y filtros */}
      {variant === 'home' && (
        <View style={styles.searchRow}>
          {/* Buscador */}
          <View style={styles.search}>
            <Ionicons
              name="search"
              size={20}
              color="#000"
            />

            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={onQuery}
              placeholder="Buscar productos..."
              placeholderTextColor="#777"
              autoCapitalize="none"
              returnKeyType="search"
            />

            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => onQuery && onQuery('')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-circle"
                  size={19}
                  color="#555"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Botón de filtros */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              filtersExpanded && styles.filterButtonActive,
            ]}
            onPress={handleOpenFilters}
            activeOpacity={0.8}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color="#000"
            />

            <Text style={styles.filterButtonText}>
              Filtros
            </Text>

            {filterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {filterCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Menú de usuario */}
      <Modal
        transparent
        visible={menu}
        animationType="fade"
        onRequestClose={() => setMenu(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setMenu(false)}
        >
          <View style={styles.menu}>
            {role === 'guest' && (
              <>
                <MenuItem
                  icon="log-in-outline"
                  label="Iniciar sesión"
                  onPress={() => go('login')}
                />

                <MenuItem
                  icon="person-add-outline"
                  label="Registrarse"
                  onPress={() => go('register')}
                />

                <View style={styles.sep} />

                <Text style={styles.menuSection}>
                  ¿Quieres vender?
                </Text>

                <MenuItem
                  icon="storefront-outline"
                  label="Ingresar como vendedor"
                  onPress={() => go('sellerLogin')}
                />

                <MenuItem
                  icon="add-circle-outline"
                  label="Registrarme como vendedor"
                  onPress={() => go('sellerRegister')}
                />
              </>
            )}

            {role === 'buyer' && (
              <>
                <Text style={styles.menuHello}>
                  Hola, {user?.name || 'Comprador'}
                </Text>

                <MenuItem
                  icon="log-out-outline"
                  label="Cerrar sesión"
                  onPress={handleLogout}
                />
              </>
            )}

            {role === 'seller' && (
              <>
                <Text style={styles.menuHello}>
                  Vendedor: {seller?.name || 'Usuario'}
                </Text>

                <MenuItem
                  icon="storefront-outline"
                  label="Panel de vendedor"
                  onPress={() => go('seller')}
                />

                <MenuItem
                  icon="log-out-outline"
                  label="Cerrar sesión"
                  onPress={handleLogout}
                />
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

function MenuItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={20}
        color={colors.orange}
      />

      <Text style={styles.menuText}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: TOP,
    paddingBottom: 14,
    paddingHorizontal: 14,
    zIndex: 10,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 96,
    height: 54,
  },

  tagline: {
    flex: 1,
    marginLeft: 10,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#000',
  },

  user: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  signUp: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginRight: 4,
    color: '#000',
    maxWidth: 70,
  },

  // Buscador y filtros.
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },

  search: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    paddingHorizontal: 10,
    height: 44,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 7,
    fontFamily: fonts.regular,
    fontSize: 14,
    paddingVertical: 0,
    color: '#000',
  },

  filterButton: {
    minWidth: 98,
    height: 44,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
  },

  filterButtonActive: {
    borderColor: colors.orange,
    backgroundColor: '#FFF7EA',
  },

  filterButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#000',
  },

  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  filterBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#fff',
  },

  // Menú de usuario.
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  menu: {
    position: 'absolute',
    top: TOP + 52,
    right: 14,
    backgroundColor: colors.bg,
    borderRadius: 14,
    paddingVertical: 6,
    minWidth: 240,
    elevation: 10,
  },

  menuHello: {
    fontFamily: fonts.bold,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#000',
  },

  menuSection: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#555',
    paddingHorizontal: 14,
    paddingTop: 6,
  },

  sep: {
    height: 1,
    backgroundColor: colors.circle,
    marginVertical: 6,
    marginHorizontal: 12,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  menuText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    marginLeft: 10,
    color: '#000',
  },
});
