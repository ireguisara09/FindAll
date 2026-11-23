import React from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import { AppProvider, useApp } from './src/context/AppContext';
import { colors } from './src/theme';
import BottomNav from './src/components/BottomNav';
import Toast from './src/components/Toast';
import AuthPrompt from './src/components/AuthPrompt';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SellerScreen from './src/screens/SellerScreen';

const Loader = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
    <ActivityIndicator size="large" color={colors.orange} />
  </View>
);

// Barra inferior según el tipo de usuario:
//  - invitado: sin barra (no tiene carrito, favoritos ni historial)
//  - comprador: Catálogo / Carrito / Favoritos / Historial
//  - vendedor: Mis productos / Nuevo / Catálogo
const NAV_SCREENS = {
  buyer: ['home', 'cart', 'checkout', 'favorites', 'history'],
  seller: ['seller', 'seller-new', 'home'],
  guest: [],
};

function Main() {
  const { hydrated, screen, navigate, role } = useApp();

  if (!hydrated) return <Loader />;

  const renderScreen = () => {
    switch (screen) {
      case 'login':        return <LoginScreen key="login" navigate={navigate} kind="buyer" />;
      case 'register':     return <RegisterScreen key="register" navigate={navigate} kind="buyer" />;
      case 'sellerLogin':  return <LoginScreen key="sellerLogin" navigate={navigate} kind="seller" />;
      case 'sellerRegister': return <RegisterScreen key="sellerRegister" navigate={navigate} kind="seller" />;
      case 'cart':         return <CartScreen navigate={navigate} />;
      case 'checkout':     return <CheckoutScreen navigate={navigate} />;
      case 'history':      return <HistoryScreen navigate={navigate} />;
      case 'seller':
      case 'seller-new':   return <SellerScreen key={screen} navigate={navigate} startInForm={screen === 'seller-new'} />;
      case 'favorites':    return <HomeScreen key="fav" navigate={navigate} onlyFavorites />;
      default:             return <HomeScreen key="home" navigate={navigate} />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1 }}>{renderScreen()}</View>
      {NAV_SCREENS[role].includes(screen) && <BottomNav current={screen} onNavigate={navigate} />}
      <Toast />
      <AuthPrompt />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) return <Loader />;

  return (
    <AppProvider>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <Main />
    </AppProvider>
  );
}
