import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import GradientButton from '../components/GradientButton';
import ProductImage from '../components/ProductImage';
import SummaryBox from '../components/SummaryBox';
import { EmptyState } from './HomeScreen';
import { colors, fonts, formatPrice } from '../theme';
import { useApp } from '../context/AppContext';
import { validateBuyer } from '../utils/logic';

const FIELDS = [
  { key: 'name', label: 'Nombre completo', placeholder: 'Ingrese su nombre completo' },
  { key: 'email', label: 'Correo electrónico', placeholder: 'Ingrese su correo electrónico', keyboard: 'email-address' },
  { key: 'phone', label: 'Teléfono', placeholder: 'Ingrese su número de teléfono', keyboard: 'phone-pad' },
  { key: 'municipio', label: 'Municipio', placeholder: 'Ingrese su municipio' },
  { key: 'address', label: 'Dirección', placeholder: 'Ingrese su dirección' },
];

// Flujo: "Realiza tu compra" (datos + cupón) → "Detalles de compra" (revisión)
//        → "Confirmación de compra" (código de pedido)
export default function CheckoutScreen({ navigate }) {
  const { user, lines, totals, coupon, confirmOrder, applyCoupon, removeCoupon, notify } = useApp();
  const [step, setStep] = useState('form'); // 'form' | 'review' | 'done'
  const [buyer, setBuyer] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    municipio: '',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [order, setOrder] = useState(null);
  const [code, setCode] = useState('');
  const [couponMsg, setCouponMsg] = useState(null); // { ok, message }
  const [confirmError, setConfirmError] = useState('');

  // ----- Paso 3: pedido confirmado (HU13) -----
  if (step === 'done' && order) {
    return (
      <View style={styles.screen}>
        <Header navigate={navigate} />
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.title}>CONFIRMACIÓN DE COMPRA</Text>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Código de pedido:</Text>
            <Text style={styles.code}>{order.code.split('').join(' ')}</Text>
          </View>
          <View style={[styles.box, styles.doneBox]}>
            <Ionicons name="checkmark-circle" size={96} color={colors.success} />
            <Text style={styles.doneTitle}>Su pedido ha sido confirmado</Text>
            <Text style={styles.doneTotal}>Total: {formatPrice(order.total)}</Text>
          </View>
          <View style={styles.notice}>
            <Ionicons name="information-circle" size={22} color={colors.orange} />
            <Text style={styles.noticeText}>
              Esta compra es una simulación académica: no se realizó ningún cobro real.
            </Text>
          </View>
          <GradientButton label="Ver historial de pedidos" onPress={() => navigate('history')} style={{ marginTop: 16 }} />
          <TouchableOpacity onPress={() => navigate('home')} style={{ marginTop: 14 }}>
            <Text style={styles.link}>Seguir comprando</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Carrito vacío (HU16 CA03)
  if (lines.length === 0) {
    return (
      <View style={styles.screen}>
        <Header navigate={navigate} />
        <EmptyState icon="cart-outline" text="No hay productos para comprar." action="Ir al catálogo" onAction={() => navigate('home')} />
      </View>
    );
  }

  // ----- Cupón (HU17) -----
  const submitCoupon = () => {
    const r = applyCoupon(code);
    setCouponMsg(r);
    if (r.ok) setCode('');
  };

  // ----- Paso 1 → 2: validar datos (HU12) -----
  const goReview = () => {
    const v = validateBuyer(buyer);
    setErrors(v.errors);
    if (!v.ok) {
      notify(`Faltan datos: ${v.missing.join(', ')}.`, 'error');
      return;
    }
    setConfirmError('');
    setStep('review');
  };

  // ----- Confirmar (HU13, HU14) -----
  const confirm = () => {
    const r = confirmOrder(buyer);
    if (!r.ok) {
      setConfirmError(r.message); // no se descuenta inventario
      return;
    }
    setOrder(r.order);
    setStep('done');
  };

  // ----- Paso 1: datos + cupón -----
  if (step === 'form') {
    return (
      <View style={styles.screen}>
        <Header navigate={navigate} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>¡ REALIZA TU COMPRA !</Text>
            <Text style={styles.hint}>Diligencie los campos para realizar la compra correctamente</Text>

            <View style={styles.box}>
              {FIELDS.map((f) => (
                <View key={f.key}>
                  <Text style={styles.label}>{f.label}</Text>
                  <TextInput
                    style={[styles.input, errors[f.key] && styles.inputError]}
                    placeholder={f.placeholder}
                    placeholderTextColor="#777"
                    value={buyer[f.key]}
                    onChangeText={(t) => {
                      setBuyer({ ...buyer, [f.key]: t });
                      setErrors({ ...errors, [f.key]: undefined });
                    }}
                    keyboardType={f.keyboard || 'default'}
                    autoCapitalize={f.key === 'email' ? 'none' : 'sentences'}
                  />
                  {errors[f.key] ? <Text style={styles.error}>{errors[f.key]}</Text> : null}
                </View>
              ))}

              {/* Cupón de descuento (HU17) */}
              <Text style={[styles.label, { color: colors.orange }]}>Cupón de descuento</Text>
              {coupon ? (
                <View style={styles.couponApplied}>
                  <Ionicons name="pricetag" size={18} color={colors.orange} />
                  <Text style={styles.couponAppliedText}>Cupón {coupon} aplicado</Text>
                  <TouchableOpacity onPress={removeCoupon}>
                    <Text style={styles.link}>Quitar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.couponRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, borderColor: colors.orange }]}
                    value={code}
                    onChangeText={(t) => { setCode(t); setCouponMsg(null); }}
                    placeholder="Ej: BIENVENIDO10"
                    placeholderTextColor="#777"
                    autoCapitalize="characters"
                  />
                  <GradientButton label="Aplicar" onPress={submitCoupon} textStyle={{ fontSize: 14 }} style={{ marginLeft: 8 }} />
                </View>
              )}
              {coupon ? (
                <Text style={styles.couponOk}>Se ha descontado el 10% al subtotal de su compra</Text>
              ) : couponMsg ? (
                <Text style={[styles.couponMsg, { color: couponMsg.ok ? colors.success : colors.danger }]}>
                  {couponMsg.message}
                </Text>
              ) : null}

              <Text style={styles.subtotal}>
                <Text style={styles.bold}>Subtotal:  </Text>
                {totals.discount > 0 && <Text style={styles.strike}>{formatPrice(totals.subtotal)}  </Text>}
                <Text style={totals.discount > 0 ? styles.accentBig : undefined}>
                  {formatPrice(totals.subtotal - totals.discount)}
                </Text>
              </Text>
            </View>

            <GradientButton label="Comprar" onPress={goReview} />
            <TouchableOpacity onPress={() => navigate('cart')} style={{ marginTop: 14 }}>
              <Text style={styles.link}>Volver al carrito</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ----- Paso 2: detalles de compra (revisión) -----
  return (
    <View style={styles.screen}>
      <Header navigate={navigate} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>DETALLES DE COMPRA</Text>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Información del comprador</Text>
          <Text style={styles.info}>{buyer.name.trim()}</Text>
          <Text style={styles.info}>{buyer.email.trim()}</Text>
          <Text style={styles.info}>{buyer.phone.trim()}</Text>
          <Text style={styles.info}>{buyer.municipio.trim()} · {buyer.address.trim()}</Text>
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Productos de su compra</Text>
          {lines.map((l) => (
            <View key={`${l.productId}-${l.size}`} style={styles.item}>
              <ProductImage product={l.product} style={styles.img} iconSize={44} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.itemName}>{l.product.name}</Text>
                <Text style={styles.line}>Emprendimiento: <Text style={styles.accent}>{l.product.brand}</Text></Text>
                {l.size && <Text style={styles.line}>Talla: <Text style={styles.accent}>{l.size}</Text></Text>}
                <Text style={styles.line}>Cantidad: <Text style={styles.accent}>{l.qty}</Text></Text>
                <Text style={styles.itemPrice}>{formatPrice(l.product.price * l.qty)}</Text>
              </View>
            </View>
          ))}
        </View>

        <SummaryBox totals={totals} coupon={coupon} />

        <View style={styles.notice}>
          <Ionicons name="information-circle" size={22} color={colors.orange} />
          <Text style={styles.noticeText}>Simulación académica: no se realizará ningún cobro real.</Text>
        </View>

        {confirmError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={22} color={colors.danger} />
            <Text style={styles.errorBoxText}>{confirmError}</Text>
          </View>
        ) : null}

        <GradientButton label="Confirmar pedido" onPress={confirm} style={{ marginTop: 14 }} />
        {confirmError ? (
          <TouchableOpacity onPress={() => navigate('cart')} style={{ marginTop: 14 }}>
            <Text style={styles.link}>Volver al carrito</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={() => setStep('form')} style={{ marginTop: 14 }}>
          <Text style={styles.link}>Editar mis datos</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontFamily: fonts.bold, fontSize: 26, color: colors.orange, marginBottom: 6 },
  hint: { fontFamily: fonts.regular, fontSize: 14, color: '#000', marginBottom: 12 },
  box: { backgroundColor: colors.card, borderRadius: 18, padding: 14, marginBottom: 14 },
  boxTitle: { fontFamily: fonts.bold, fontSize: 16, color: '#000', marginBottom: 8 },
  label: { fontFamily: fonts.bold, fontSize: 15, color: '#000', marginTop: 8, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 16, height: 48, fontFamily: fonts.regular, fontSize: 15 },
  inputError: { borderColor: colors.danger, borderWidth: 2 },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.danger, marginTop: 4 },
  link: { fontFamily: fonts.bold, fontSize: 15, color: colors.link, textAlign: 'center' },
  info: { fontFamily: fonts.regular, fontSize: 15, color: '#000', marginVertical: 4 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardDark, borderRadius: 16, padding: 10, marginTop: 6 },
  img: { width: 110, height: 120 },
  itemName: { fontFamily: fonts.bold, fontSize: 16, color: '#000', marginBottom: 4 },
  line: { fontFamily: fonts.bold, fontSize: 14, color: '#000', marginVertical: 2 },
  bold: { fontFamily: fonts.bold },
  accent: { fontFamily: fonts.bold, color: colors.orange },
  accentBig: { fontFamily: fonts.bold, color: colors.orange },
  strike: { textDecorationLine: 'line-through', color: '#444' },
  itemPrice: { fontFamily: fonts.regular, fontSize: 22, color: '#000', marginTop: 4 },
  couponRow: { flexDirection: 'row', alignItems: 'center' },
  couponApplied: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: colors.orange, padding: 12 },
  couponAppliedText: { flex: 1, fontFamily: fonts.bold, fontSize: 14, color: colors.orange, marginLeft: 6 },
  couponOk: { fontFamily: fonts.bold, fontSize: 15, color: colors.orange, marginTop: 10 },
  couponMsg: { fontFamily: fonts.medium, fontSize: 13, marginTop: 8 },
  subtotal: { fontFamily: fonts.regular, fontSize: 17, color: '#000', marginTop: 12 },
  notice: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, padding: 12 },
  noticeText: { flex: 1, marginLeft: 8, fontFamily: fonts.medium, fontSize: 13, color: '#000' },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDECEA', borderRadius: 14, padding: 12, marginTop: 12 },
  errorBoxText: { flex: 1, marginLeft: 8, fontFamily: fonts.medium, fontSize: 13, color: colors.danger },
  code: { fontFamily: fonts.bold, fontSize: 32, color: colors.orange, letterSpacing: 2 },
  doneBox: { alignItems: 'center', paddingVertical: 34 },
  doneTitle: { fontFamily: fonts.bold, fontSize: 22, color: '#000', textAlign: 'center', marginTop: 14 },
  doneTotal: { fontFamily: fonts.regular, fontSize: 18, color: '#000', marginTop: 8 },
});
