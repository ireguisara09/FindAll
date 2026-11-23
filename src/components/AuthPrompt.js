import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientButton from './GradientButton';
import { colors, fonts } from '../theme';
import { useApp } from '../context/AppContext';

// Aviso para invitados que intentan comprar, guardar favoritos, etc.
export default function AuthPrompt() {
  const { authPrompt, closeAuthPrompt, navigate } = useApp();
  const go = (screen) => {
    closeAuthPrompt();
    navigate(screen);
  };
  return (
    <Modal transparent visible={!!authPrompt} animationType="fade" onRequestClose={closeAuthPrompt}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Ionicons name="person-circle-outline" size={56} color={colors.orange} />
          <Text style={styles.title}>Necesitas una cuenta</Text>
          <Text style={styles.text}>{authPrompt}</Text>
          <GradientButton label="Iniciar sesión" onPress={() => go('login')} style={styles.btn} />
          <GradientButton label="Registrarme" onPress={() => go('register')} style={styles.btn} />
          <TouchableOpacity onPress={closeAuthPrompt} style={{ marginTop: 14 }}>
            <Text style={styles.link}>Ahora no</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: colors.bg, borderRadius: 22, padding: 22, alignItems: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 22, color: colors.orange, marginTop: 6 },
  text: { fontFamily: fonts.regular, fontSize: 15, color: '#000', textAlign: 'center', marginVertical: 12 },
  btn: { alignSelf: 'stretch', marginTop: 8 },
  link: { fontFamily: fonts.bold, fontSize: 15, color: colors.link },
});
