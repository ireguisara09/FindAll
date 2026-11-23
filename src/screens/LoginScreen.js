import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import Header from '../components/Header';
import GradientButton from '../components/GradientButton';
import { colors, fonts } from '../theme';
import { useApp } from '../context/AppContext';

// kind = 'buyer' (comprador) | 'seller' (vendedor)
export default function LoginScreen({ navigate, kind = 'buyer' }) {
  const { login, notify } = useApp();
  const isSeller = kind === 'seller';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    const r = login(kind, email, password);
    if (!r.ok) setError(r.message);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header navigate={navigate} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>¡ BIENVENIDO DE NUEVO !</Text>
          <Text style={styles.sub}>
            {isSeller
              ? 'Inicia sesión y empieza a emprender'
              : 'Inicia sesión y descubre todo lo que FindAll tiene para ti'}
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingrese su correo electrónico"
              placeholderTextColor="#222"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingrese su contraseña"
              placeholderTextColor="#222"
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              secureTextEntry
              autoCapitalize="none"
            />

            <Text
              style={styles.forgot}
              onPress={() => notify('La recuperación de contraseña no está disponible en este prototipo.', 'info')}
            >
              ¿Olvidó su contraseña?
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <GradientButton label="Iniciar sesión" onPress={submit} />

            <Text style={styles.footer}>
              ¿No tiene cuenta?{' '}
              <Text style={styles.link} onPress={() => navigate(isSeller ? 'sellerRegister' : 'register')}>
                Regístrese aquí
              </Text>
            </Text>
          </View>

          <Text style={styles.switch}>
            {isSeller ? '¿Eres comprador? ' : '¿Quieres vender en FindAll? '}
            <Text style={styles.link} onPress={() => navigate(isSeller ? 'login' : 'sellerLogin')}>
              {isSeller ? 'Ingresa como comprador' : 'Ingresa como vendedor'}
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 22, paddingBottom: 60 },
  title: { fontFamily: fonts.bold, fontSize: 26, color: colors.orange, textAlign: 'center' },
  sub: { fontFamily: fonts.regular, fontSize: 15, color: '#000', textAlign: 'center', marginTop: 6, marginBottom: 26 },
  card: { backgroundColor: colors.card, borderRadius: 22, padding: 18 },
  label: { fontFamily: fonts.bold, fontSize: 15, color: '#000', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 48,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  forgot: { fontFamily: fonts.bold, fontSize: 14, color: colors.orange, textAlign: 'right', marginVertical: 12 },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.danger, marginBottom: 10 },
  footer: { fontFamily: fonts.regular, fontSize: 16, color: '#000', textAlign: 'center', marginTop: 18 },
  switch: { fontFamily: fonts.regular, fontSize: 15, color: '#000', textAlign: 'center', marginTop: 22 },
  link: { color: colors.link, fontFamily: fonts.medium },
});
