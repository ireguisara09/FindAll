import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import Header from '../components/Header';
import GradientButton from '../components/GradientButton';
import { colors, fonts } from '../theme';
import { useApp } from '../context/AppContext';

const FIELDS = [
  { key: 'name', label: 'Nombre completo', placeholder: 'Ingrese su nombre completo' },
  { key: 'email', label: 'Correo electrónico', placeholder: 'Ingrese su correo electrónico', keyboard: 'email-address' },
  { key: 'phone', label: 'Teléfono', placeholder: 'Ingrese su número de teléfono', keyboard: 'phone-pad' },
  { key: 'password', label: 'Contraseña', placeholder: 'Cree una contraseña', secure: true },
  { key: 'confirm', label: 'Confirmar contraseña', placeholder: 'Repita su contraseña', secure: true },
];

// kind = 'buyer' (comprador) | 'seller' (vendedor)
export default function RegisterScreen({ navigate, kind = 'buyer' }) {
  const { register, notify } = useApp();
  const isSeller = kind === 'seller';
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});

  const submit = () => {
    const r = register(kind, form);
    if (!r.ok) {
      setErrors(r.errors);
      notify('Revisa los datos: ' + Object.values(r.errors)[0], 'error');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header navigate={navigate} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{isSeller ? '¡ ÚNETE A FINDALL COMO VENDEDOR !' : '¡ ÚNETE A FINDALL !'}</Text>
          <Text style={styles.sub}>
            {isSeller
              ? 'Regístrate ahora para empezar a emprender y ser el mejor vendedor en FindAll'
              : 'Regístrate ahora para empezar a comprar y descubrir todo lo que tenemos para ti'}
          </Text>

          <View style={styles.card}>
            {FIELDS.map((f) => (
              <View key={f.key}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={[styles.input, errors[f.key] && styles.inputError]}
                  placeholder={f.placeholder}
                  placeholderTextColor="#222"
                  value={form[f.key]}
                  onChangeText={(t) => {
                    setForm({ ...form, [f.key]: t });
                    setErrors({ ...errors, [f.key]: undefined });
                  }}
                  secureTextEntry={f.secure}
                  keyboardType={f.keyboard || 'default'}
                  autoCapitalize={f.key === 'name' ? 'words' : 'none'}
                />
                {errors[f.key] ? <Text style={styles.error}>{errors[f.key]}</Text> : null}
              </View>
            ))}

            <GradientButton label="Crear cuenta" onPress={submit} style={{ marginTop: 18 }} />

            <Text style={styles.footer}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.link} onPress={() => navigate(isSeller ? 'sellerLogin' : 'login')}>
                Inicia sesión ahora
              </Text>
            </Text>
          </View>

          <Text style={styles.switch}>
            {isSeller ? '¿Eres comprador? ' : '¿Quieres vender en FindAll? '}
            <Text style={styles.link} onPress={() => navigate(isSeller ? 'register' : 'sellerRegister')}>
              {isSeller ? 'Regístrate como comprador' : 'Regístrate como vendedor'}
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 22, paddingTop: 30, paddingBottom: 50 },
  title: { fontFamily: fonts.bold, fontSize: 26, color: colors.orange, textAlign: 'center' },
  sub: { fontFamily: fonts.regular, fontSize: 15, color: '#000', textAlign: 'center', marginTop: 6, marginBottom: 22 },
  card: { backgroundColor: colors.card, borderRadius: 22, padding: 18 },
  label: { fontFamily: fonts.bold, fontSize: 15, color: '#000', marginTop: 8, marginBottom: 6 },
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
  inputError: { borderColor: colors.danger, borderWidth: 2 },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.danger, marginTop: 4 },
  footer: { fontFamily: fonts.regular, fontSize: 16, color: '#000', textAlign: 'center', marginTop: 18 },
  switch: { fontFamily: fonts.regular, fontSize: 15, color: '#000', textAlign: 'center', marginTop: 22 },
  link: { color: colors.link, fontFamily: fonts.medium },
});
