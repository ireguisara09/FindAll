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
import { colors, fonts, gradientProps, SORT_OPTIONS } from '../theme';
import { useApp } from '../context/AppContext';

const TAGLINE = 'Encuentra todo, en un solo lugar';
const TOP = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 50;

export default function Header({
  variant = 'simple', // 'simple' | 'home'
  sort = 'none',
  onSort,
  query,
  onQuery,
  navigate,
}) {
  const { role, user, seller, logout } = useApp();
  const [open, setOpen] = useState(false); // desplegable "Filtrar Precio"
  const [menu, setMenu] = useState(false); // menú del ícono de usuario

  const go = (screen) => {
    setMenu(false);
    navigate(screen);
  };

  const person = user || seller;
  const label = person ? person.name.split(' ')[0] : 'Sign Up'; // invitado: "Sign Up" (prototipo)
  const sortLabel = sort !== 'none' ? SORT_OPTIONS.find((s) => s.key === sort)?.label : 'Filtrar Precio';

  return (
    <LinearGradient {...gradientProps} style={styles.header}>
      <View style={styles.row}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigate('home')}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </TouchableOpacity>
        <Text style={styles.tagline}>{TAGLINE}</Text>
        <TouchableOpacity style={styles.user} onPress={() => setMenu(true)} activeOpacity={0.8}>
          <Text style={styles.signUp} numberOfLines={1}>{label}</Text>
          <Ionicons name="person-circle-outline" size={42} color="#000" />
        </TouchableOpacity>
      </View>

      {variant === 'home' && (
        <>
          <View style={[styles.row, { marginTop: 8 }]}>
            {/* Filtrar por precio (HU06) */}
            <TouchableOpacity style={styles.dropdown} activeOpacity={0.8} onPress={() => setOpen(!open)}>
              <Text style={styles.dropText} numberOfLines={1}>{sortLabel}</Text>
              <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#555" />
            </TouchableOpacity>

            {/* Buscar por palabra clave (HU04) */}
            <View style={styles.search}>
              <Ionicons name="search" size={18} color="#000" />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={onQuery}
                placeholder="Buscar producto"
                placeholderTextColor="#777"
                autoCapitalize="none"
                returnKeyType="search"
              />
              <TouchableOpacity onPress={() => onQuery('')}>
                <Ionicons name="close" size={18} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          {open && (
            <View style={styles.dropList}>
              {SORT_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={styles.dropItem}
                  onPress={() => {
                    onSort(s.key);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.dropText, s.key === sort && { fontFamily: fonts.bold }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      <Modal transparent visible={menu} animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenu(false)}>
          <View style={styles.menu}>
            {role === 'guest' && (
              <>
                <MenuItem icon="log-in-outline" label="Iniciar sesión" onPress={() => go('login')} />
                <MenuItem icon="person-add-outline" label="Registrarse" onPress={() => go('register')} />
                <View style={styles.sep} />
                <Text style={styles.menuSection}>¿Quieres vender?</Text>
                <MenuItem icon="storefront-outline" label="Ingresar como vendedor" onPress={() => go('sellerLogin')} />
                <MenuItem icon="add-circle-outline" label="Registrarme como vendedor" onPress={() => go('sellerRegister')} />
              </>
            )}
            {role === 'buyer' && (
              <>
                <Text style={styles.menuHello}>Hola, {user.name}</Text>
                <MenuItem icon="log-out-outline" label="Cerrar sesión" onPress={() => { setMenu(false); logout(); }} />
              </>
            )}
            {role === 'seller' && (
              <>
                <Text style={styles.menuHello}>Vendedor: {seller.name}</Text>
                <MenuItem icon="storefront-outline" label="Panel de vendedor" onPress={() => go('seller')} />
                <MenuItem icon="log-out-outline" label="Cerrar sesión" onPress={() => { setMenu(false); logout(); }} />
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
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.orange} />
      <Text style={styles.menuText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: TOP, paddingBottom: 14, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 96, height: 54 },
  tagline: { flex: 1, marginLeft: 10, fontFamily: fonts.regular, fontSize: 12, color: '#000' },
  user: { flexDirection: 'row', alignItems: 'center' },
  signUp: { fontFamily: fonts.regular, fontSize: 12, marginRight: 4, color: '#000', maxWidth: 70 },
  dropdown: {
    width: 150,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
  },
  dropText: { fontFamily: fonts.regular, fontSize: 14, color: '#000', flexShrink: 1 },
  dropList: {
    marginTop: 6,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    width: 150,
  },
  dropItem: { paddingVertical: 9, paddingHorizontal: 10 },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 38,
  },
  searchInput: { flex: 1, paddingHorizontal: 6, fontFamily: fonts.regular, fontSize: 14, paddingVertical: 0 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
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
  menuHello: { fontFamily: fonts.bold, fontSize: 14, paddingHorizontal: 14, paddingVertical: 10, color: '#000' },
  menuSection: { fontFamily: fonts.bold, fontSize: 12, color: '#555', paddingHorizontal: 14, paddingTop: 6 },
  sep: { height: 1, backgroundColor: colors.circle, marginVertical: 6, marginHorizontal: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11 },
  menuText: { fontFamily: fonts.medium, fontSize: 14, marginLeft: 10, color: '#000' },
});
