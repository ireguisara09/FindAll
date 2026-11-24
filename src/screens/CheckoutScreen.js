
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
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
  {
    key: 'name',
    label: 'Nombre completo',
    placeholder: 'Ingrese su nombre completo',
  },
  {
    key: 'email',
    label: 'Correo electrónico',
    placeholder: 'Ingrese su correo electrónico',
    keyboard: 'email-address',
  },
  {
    key: 'phone',
    label: 'Teléfono',
    placeholder: 'Ingrese su número de teléfono',
    keyboard: 'phone-pad',
  },
];

export default function CheckoutScreen({ navigate }) {
  const {
    user,
    lines,
    totals,
    coupon,
    confirmOrder,
    applyCoupon,
    removeCoupon,
    notify,
    selectedAddress,
    defaultAddress,
    shippingMethod,
    setShippingMethod,
    shippingQuote,
  } = useApp();

  const [step, setStep] = useState('form');
  const [buyer, setBuyer] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [errors, setErrors] = useState({});
  const [order, setOrder] = useState(null);
  const [code, setCode] = useState('');
  const [couponMsg, setCouponMsg] = useState(null);
  const [confirmError, setConfirmError] = useState('');

  // HU13: confirmación del pedido.
  if (step === 'done' && order) {
    return (
      <View style={styles.screen}>
        <Header navigate={navigate} />

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.title}>CONFIRMACIÓN DE COMPRA</Text>

          <View style={styles.box}>
            <Text style={styles.boxTitle}>Código de pedido:</Text>
            <Text style={styles.code}>
              {order.code.split('').join(' ')}
            </Text>
          </View>

          <View style={[styles.box, styles.doneBox]}>
            <Ionicons
              name="checkmark-circle"
              size={96}
              color={colors.success}
            />

            <Text style={styles.doneTitle}>
              Su pedido ha sido confirmado
            </Text>

            <Text style={styles.doneTotal}>
              Total: {formatPrice(order.total)}
            </Text>

            <Text style={styles.info}>
              Envío {order.shippingMethodLabel}
            </Text>

            <Text style={styles.info}>
              Tiempo estimado: {order.shippingDays} día(s)
            </Text>
          </View>

          <View style={styles.notice}>
            <Ionicons
              name="information-circle"
              size={22}
              color={colors.orange}
            />
            <Text style={styles.noticeText}>
              Esta compra es una simulación académica: no se realizó ningún
              cobro real.
            </Text>
          </View>

          <GradientButton
            label="Ver historial de pedidos"
            onPress={() => navigate('history')}
            style={{ marginTop: 16 }}
          />

          <TouchableOpacity
            onPress={() => navigate('home')}
            style={{ marginTop: 14 }}
          >
            <Text style={styles.link}>Seguir comprando</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // HU16 CA03: carrito vacío.
  if (lines.length === 0) {
    return (
      <View style={styles.screen}>
        <Header navigate={navigate} />

        <EmptyState
          icon="cart-outline"
          text="No hay productos para comprar."
          action="Ir al catálogo"
          onAction={() => navigate('home')}
        />
      </View>
    );
  }

  // HU17: aplicar cupón.
  const submitCoupon = () => {
    const result = applyCoupon(code);
    setCouponMsg(result);

    if (result.ok) {
      setCode('');
    }
  };

  // HU25: abrir la libreta de direcciones.
  const openAddresses = () => {
    navigate('addresses');
  };

  // HU26: seleccionar tipo de envío.
  const chooseShipping = (method) => {
    setShippingMethod(method);
    setConfirmError('');
  };

  // HU12 y HU25: validar comprador y dirección.
  const goReview = () => {
    if (!selectedAddress) {
      notify(
        'Agrega y selecciona una dirección de entrega antes de continuar.',
        'warn'
      );
      return;
    }

    if (!shippingQuote.available) {
      notify(
        'No tenemos cobertura de envío para el municipio seleccionado.',
        'warn'
      );
      return;
    }

    const buyerWithAddress = {
      ...buyer,
      municipio: selectedAddress.municipio,
      address: selectedAddress.reference,
    };

    const validation = validateBuyer(buyerWithAddress);

    setErrors(validation.errors);

    if (!validation.ok) {
      notify(
        `Faltan datos: ${validation.missing.join(', ')}.`,
        'error'
      );
      return;
    }

    setConfirmError('');
    setStep('review');
  };

  // HU13, HU14, HU25 y HU26: confirmar compra.
  const confirm = () => {
    if (!selectedAddress) {
      setConfirmError('Debes seleccionar una dirección de entrega.');
      return;
    }

    if (!shippingQuote.available) {
      setConfirmError(
        'No tenemos cobertura de envío para el municipio seleccionado.'
      );
      return;
    }

    const buyerWithAddress = {
      ...buyer,
      municipio: selectedAddress.municipio,
      address: selectedAddress.reference,
    };

    const result = confirmOrder(buyerWithAddress);

    if (!result.ok) {
      setConfirmError(result.message);
      return;
    }

    setOrder(result.order);
    setStep('done');
  };

  // Paso 1: datos, dirección, envío y cupón.
  if (step === 'form') {
    return (
      <View style={styles.screen}>
        <Header navigate={navigate} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>¡ REALIZA TU COMPRA !</Text>

            <Text style={styles.hint}>
              Diligencie los campos para realizar la compra correctamente
            </Text>

            <View style={styles.box}>
              {FIELDS.map((field) => (
                <View key={field.key}>
                  <Text style={styles.label}>{field.label}</Text>

                  <TextInput
                    style={[
                      styles.input,
                      errors[field.key] && styles.inputError,
                    ]}
                    placeholder={field.placeholder}
                    placeholderTextColor="#777"
                    value={buyer[field.key]}
                    onChangeText={(value) => {
                      setBuyer({
                        ...buyer,
                        [field.key]: value,
                      });

                      setErrors({
                        ...errors,
                        [field.key]: undefined,
                      });
                    }}
                    keyboardType={field.keyboard || 'default'}
                    autoCapitalize={
                      field.key === 'email' ? 'none' : 'sentences'
                    }
                  />

                  {errors[field.key] ? (
                    <Text style={styles.error}>
                      {errors[field.key]}
                    </Text>
                  ) : null}
                </View>
              ))}

              {/* HU25: dirección de entrega seleccionada. */}
              <View style={styles.addressSection}>
                <View style={styles.addressHeading}>
                  <Ionicons
                    name="location"
                    size={22}
                    color={colors.orange}
                  />

                  <Text style={styles.addressTitle}>
                    Dirección de entrega
                  </Text>
                </View>

                {selectedAddress ? (
                  <View style={styles.addressCard}>
                    <View style={styles.addressCardHeader}>
                      <Text style={styles.addressAlias}>
                        {selectedAddress.alias}
                      </Text>

                      {selectedAddress.id === defaultAddress?.id ? (
                        <Text style={styles.defaultBadge}>
                          Principal
                        </Text>
                      ) : null}
                    </View>

                    <Text style={styles.addressInfo}>
                      {selectedAddress.municipio}
                    </Text>

                    <Text style={styles.addressInfo}>
                      {selectedAddress.reference}
                    </Text>

                    <TouchableOpacity
                      onPress={openAddresses}
                      style={styles.changeAddressButton}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={colors.orange}
                      />

                      <Text style={styles.changeAddressText}>
                        Cambiar dirección
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.noAddress}>
                    <Ionicons
                      name="location-outline"
                      size={30}
                      color={colors.orange}
                    />

                    <Text style={styles.noAddressText}>
                      Todavía no tienes una dirección seleccionada.
                    </Text>

                    <Text style={styles.noAddressHint}>
                      Registra una dirección para continuar con tu compra.
                    </Text>
                  </View>
                )}

                <GradientButton
                  label={
                    selectedAddress
                      ? 'Administrar mis direcciones'
                      : 'Agregar dirección'
                  }
                  onPress={openAddresses}
                  style={{ marginTop: 10 }}
                />
              </View>

              {/* HU26: estimador de envíos. */}
              <View style={styles.shippingSection}>
                <View style={styles.addressHeading}>
                  <Ionicons
                    name="car-outline"
                    size={23}
                    color={colors.orange}
                  />

                  <Text style={styles.addressTitle}>
                    Método de envío
                  </Text>
                </View>

                {!selectedAddress ? (
                  <Text style={styles.noAddressHint}>
                    Selecciona primero una dirección para calcular el envío.
                  </Text>
                ) : (
                  <>
                    <Text style={styles.shippingMunicipality}>
                      Destino: {selectedAddress.municipio}
                    </Text>

                    {shippingQuote.available ? (
                      <>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => chooseShipping('standard')}
                          style={[
                            styles.shippingOption,
                            shippingMethod === 'standard' &&
                              styles.shippingOptionSelected,
                          ]}
                        >
                          <View style={styles.shippingOptionLeft}>
                            <Ionicons
                              name={
                                shippingMethod === 'standard'
                                  ? 'radio-button-on'
                                  : 'radio-button-off'
                              }
                              size={22}
                              color={
                                shippingMethod === 'standard'
                                  ? colors.orange
                                  : '#777'
                              }
                            />

                            <View style={styles.shippingOptionText}>
                              <Text style={styles.shippingName}>
                                Envío estándar
                              </Text>
                              <Text style={styles.shippingDescription}>
                                Entrega estimada: 3 días
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.shippingPrice}>
                            {formatPrice(
                              selectedAddress.municipio
                                .trim()
                                .toLowerCase()
                                .normalize('NFD')
                                .replace(/[\u0300-\u036f]/g, '') === 'mosquera'
                                ? 6000
                                : selectedAddress.municipio
                                    .trim()
                                    .toLowerCase()
                                    .normalize('NFD')
                                    .replace(/[\u0300-\u036f]/g, '') === 'funza'
                                  ? 8000
                                  : 10000
                            )}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => chooseShipping('express')}
                          style={[
                            styles.shippingOption,
                            shippingMethod === 'express' &&
                              styles.shippingOptionSelected,
                          ]}
                        >
                          <View style={styles.shippingOptionLeft}>
                            <Ionicons
                              name={
                                shippingMethod === 'express'
                                  ? 'radio-button-on'
                                  : 'radio-button-off'
                              }
                              size={22}
                              color={
                                shippingMethod === 'express'
                                  ? colors.orange
                                  : '#777'
                              }
                            />

                            <View style={styles.shippingOptionText}>
                              <Text style={styles.shippingName}>
                                Envío exprés
                              </Text>
                              <Text style={styles.shippingDescription}>
                                Entrega estimada: 1 día
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.shippingPrice}>
                            {formatPrice(
                              selectedAddress.municipio
                                .trim()
                                .toLowerCase()
                                .normalize('NFD')
                                .replace(/[\u0300-\u036f]/g, '') === 'mosquera'
                                ? 10000
                                : selectedAddress.municipio
                                    .trim()
                                    .toLowerCase()
                                    .normalize('NFD')
                                    .replace(/[\u0300-\u036f]/g, '') === 'funza'
                                  ? 12000
                                  : 14000
                            )}
                          </Text>
                        </TouchableOpacity>

                        <View style={styles.shippingSelectedInfo}>
                          <Ionicons
                            name="checkmark-circle"
                            size={19}
                            color={colors.success}
                          />
                          <Text style={styles.shippingSelectedText}>
                            {shippingMethod === 'express'
                              ? 'Seleccionaste envío exprés: 1 día estimado.'
                              : 'Seleccionaste envío estándar: 3 días estimados.'}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <View style={styles.shippingUnavailable}>
                        <Ionicons
                          name="alert-circle-outline"
                          size={22}
                          color={colors.danger}
                        />
                        <Text style={styles.shippingUnavailableText}>
                          No tenemos cobertura de envío para este municipio.
                          Selecciona otra dirección para continuar.
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* HU17: cupón de descuento. */}
              <Text style={[styles.label, { color: colors.orange }]}>
                Cupón de descuento
              </Text>

              {coupon ? (
                <View style={styles.couponApplied}>
                  <Ionicons
                    name="pricetag"
                    size={18}
                    color={colors.orange}
                  />

                  <Text style={styles.couponAppliedText}>
                    Cupón {coupon} aplicado
                  </Text>

                  <TouchableOpacity onPress={removeCoupon}>
                    <Text style={styles.link}>Quitar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.couponRow}>
                  <TextInput
                    style={[
                      styles.input,
                      { flex: 1, borderColor: colors.orange },
                    ]}
                    value={code}
                    onChangeText={(value) => {
                      setCode(value);
                      setCouponMsg(null);
                    }}
                    placeholder="Ej: BIENVENIDO10"
                    placeholderTextColor="#777"
                    autoCapitalize="characters"
                  />

                  <GradientButton
                    label="Aplicar"
                    onPress={submitCoupon}
                    textStyle={{ fontSize: 14 }}
                    style={{ marginLeft: 8 }}
                  />
                </View>
              )}

              {coupon ? (
                <Text style={styles.couponOk}>
                  Se ha descontado el 10% al subtotal de su compra
                </Text>
              ) : couponMsg ? (
                <Text
                  style={[
                    styles.couponMsg,
                    {
                      color: couponMsg.ok
                        ? colors.success
                        : colors.danger,
                    },
                  ]}
                >
                  {couponMsg.message}
                </Text>
              ) : null}

              <Text style={styles.subtotal}>
                <Text style={styles.bold}>Subtotal: </Text>

                {totals.discount > 0 && (
                  <Text style={styles.strike}>
                    {formatPrice(totals.subtotal)}{' '}
                  </Text>
                )}

                <Text
                  style={
                    totals.discount > 0 ? styles.accentBig : undefined
                  }
                >
                  {formatPrice(totals.subtotal - totals.discount)}
                </Text>
              </Text>
            </View>

            {/* HU26: resumen del costo de envío y total. */}
            <View style={styles.box}>
              <Text style={styles.boxTitle}>
                Resumen de envío
              </Text>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Método seleccionado
                </Text>
                <Text style={styles.totalValue}>
                  {shippingMethod === 'express' ? 'Exprés' : 'Estándar'}
                </Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Costo de envío
                </Text>
                <Text style={styles.totalValue}>
                  {shippingQuote.available
                    ? formatPrice(shippingQuote.cost)
                    : 'No disponible'}
                </Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Tiempo estimado
                </Text>
                <Text style={styles.totalValue}>
                  {shippingQuote.available
                    ? `${shippingQuote.days} día(s)`
                    : 'No disponible'}
                </Text>
              </View>

              <View style={styles.totalDivider} />

              <View style={styles.totalRow}>
                <Text style={styles.grandTotalLabel}>
                  Total de la compra
                </Text>
                <Text style={styles.grandTotalValue}>
                  {formatPrice(totals.total)}
                </Text>
              </View>
            </View>

            <GradientButton
              label="Comprar"
              onPress={goReview}
              disabled={!selectedAddress || !shippingQuote.available}
            />

            <TouchableOpacity
              onPress={() => navigate('cart')}
              style={{ marginTop: 14 }}
            >
              <Text style={styles.link}>Volver al carrito</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Paso 2: detalles de compra.
  return (
    <View style={styles.screen}>
      <Header navigate={navigate} />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>DETALLES DE COMPRA</Text>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>
            Información del comprador
          </Text>

          <Text style={styles.info}>{buyer.name.trim()}</Text>
          <Text style={styles.info}>{buyer.email.trim()}</Text>
          <Text style={styles.info}>{buyer.phone.trim()}</Text>
        </View>

        {/* HU25: dirección seleccionada. */}
        <View style={styles.box}>
          <View style={styles.addressHeading}>
            <Ionicons
              name="location"
              size={22}
              color={colors.orange}
            />

            <Text style={styles.boxTitle}>
              Dirección de entrega
            </Text>
          </View>

          {selectedAddress ? (
            <>
              <Text style={styles.addressAlias}>
                {selectedAddress.alias}
              </Text>

              <Text style={styles.info}>
                {selectedAddress.municipio}
              </Text>

              <Text style={styles.info}>
                {selectedAddress.reference}
              </Text>

              <TouchableOpacity
                onPress={openAddresses}
                style={{ marginTop: 10 }}
              >
                <Text style={styles.link}>
                  Cambiar dirección
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.error}>
              No hay una dirección seleccionada.
            </Text>
          )}
        </View>

        {/* HU26: información del envío. */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>
            Información del envío
          </Text>

          <Text style={styles.info}>
            Método: {shippingMethod === 'express' ? 'Exprés' : 'Estándar'}
          </Text>

          <Text style={styles.info}>
            Costo: {formatPrice(shippingQuote.cost)}
          </Text>

          <Text style={styles.info}>
            Tiempo estimado: {shippingQuote.days} día(s)
          </Text>
        </View>

        {/* HU21: detalle de productos y variantes. */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>
            Productos de su compra
          </Text>

          {lines.map((line) => {
            const unitPrice =
              Number(
                line.unitPrice ??
                line.variant?.price ??
                line.product.price
              ) || 0;

            const lineTotal = unitPrice * line.qty;

            const variantLabel =
              line.variantLabel ??
              line.variant?.label ??
              line.size;

            return (
              <View
                key={`${line.productId}-${line.variantId ?? variantLabel ?? 'default'}`}
                style={styles.item}
              >
                <ProductImage
                  product={line.product}
                  style={styles.img}
                  iconSize={44}
                />

                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>
                    {line.product.name}
                  </Text>

                  <Text style={styles.line}>
                    Emprendimiento:{' '}
                    <Text style={styles.accent}>
                      {line.product.brand}
                    </Text>
                  </Text>

                  {variantLabel ? (
                    <Text style={styles.line}>
                      Variante:{' '}
                      <Text style={styles.accent}>
                        {variantLabel}
                      </Text>
                    </Text>
                  ) : null}

                  <Text style={styles.line}>
                    Cantidad:{' '}
                    <Text style={styles.accent}>
                      {line.qty}
                    </Text>
                  </Text>

                  <Text style={styles.unitPrice}>
                    Precio unitario: {formatPrice(unitPrice)}
                  </Text>

                  <Text style={styles.itemPrice}>
                    Total: {formatPrice(lineTotal)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <SummaryBox totals={totals} coupon={coupon} />

        <View style={styles.notice}>
          <Ionicons
            name="information-circle"
            size={22}
            color={colors.orange}
          />

          <Text style={styles.noticeText}>
            Simulación académica: no se realizará ningún cobro real.
          </Text>
        </View>

        {confirmError ? (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle"
              size={22}
              color={colors.danger}
            />

            <Text style={styles.errorBoxText}>
              {confirmError}
            </Text>
          </View>
        ) : null}

        <GradientButton
          label="Confirmar pedido"
          onPress={confirm}
          style={{ marginTop: 14 }}
        />

        {confirmError ? (
          <TouchableOpacity
            onPress={() => navigate('cart')}
            style={{ marginTop: 14 }}
          >
            <Text style={styles.link}>Volver al carrito</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={() => setStep('form')}
          style={{ marginTop: 14 }}
        >
          <Text style={styles.link}>Editar mis datos</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.orange,
    marginBottom: 6,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#000',
    marginBottom: 12,
  },
  box: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  boxTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#000',
    marginTop: 8,
    marginBottom: 6,
  },
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
  inputError: {
    borderColor: colors.danger,
    borderWidth: 2,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
  link: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.link,
    textAlign: 'center',
  },
  info: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: '#000',
    marginVertical: 4,
  },
  addressSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addressHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#000',
    marginLeft: 7,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.orange,
    padding: 12,
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  addressAlias: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.orange,
    marginBottom: 5,
  },
  defaultBadge: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.success,
    backgroundColor: '#E7F6EC',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  addressInfo: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#333',
    marginTop: 3,
  },
  changeAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 10,
    paddingTop: 10,
  },
  changeAddressText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.orange,
    marginLeft: 5,
  },
  noAddress: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  noAddressText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    marginTop: 8,
  },
  noAddressHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    marginTop: 5,
  },
  shippingSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  shippingMunicipality: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#444',
    marginBottom: 10,
  },
  shippingOption: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shippingOptionSelected: {
    borderColor: colors.orange,
    borderWidth: 2,
    backgroundColor: '#FFF8F1',
  },
  shippingOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shippingOptionText: {
    marginLeft: 9,
    flex: 1,
  },
  shippingName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#000',
  },
  shippingDescription: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  shippingPrice: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.orange,
    marginLeft: 8,
  },
  shippingSelectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  shippingSelectedText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.success,
    marginLeft: 6,
    flex: 1,
  },
  shippingUnavailable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEA',
    borderRadius: 12,
    padding: 12,
  },
  shippingUnavailableText: {
    flex: 1,
    marginLeft: 8,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.danger,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  totalLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#444',
  },
  totalValue: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#000',
  },
  totalDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 9,
  },
  grandTotalLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#000',
  },
  grandTotalValue: {
    fontFamily: fonts.bold,
    fontSize: 19,
    color: colors.orange,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardDark,
    borderRadius: 16,
    padding: 10,
    marginTop: 6,
  },
  img: {
    width: 110,
    height: 120,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 8,
  },
  itemName: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  line: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#000',
    marginVertical: 2,
  },
  bold: {
    fontFamily: fonts.bold,
  },
  accent: {
    fontFamily: fonts.bold,
    color: colors.orange,
  },
  accentBig: {
    fontFamily: fonts.bold,
    color: colors.orange,
  },
  strike: {
    textDecorationLine: 'line-through',
    color: '#444',
  },
  unitPrice: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#444',
    marginTop: 4,
  },
  itemPrice: {
    fontFamily: fonts.bold,
    fontSize: 19,
    color: '#000',
    marginTop: 4,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.orange,
    padding: 12,
  },
  couponAppliedText: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.orange,
    marginLeft: 6,
  },
  couponOk: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.orange,
    marginTop: 10,
  },
  couponMsg: {
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: 8,
  },
  subtotal: {
    fontFamily: fonts.regular,
    fontSize: 17,
    color: '#000',
    marginTop: 12,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
  },
  noticeText: {
    flex: 1,
    marginLeft: 8,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#000',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEA',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  errorBoxText: {
    flex: 1,
    marginLeft: 8,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.danger,
  },
  code: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: colors.orange,
    letterSpacing: 2,
  },
  doneBox: {
    alignItems: 'center',
    paddingVertical: 34,
  },
  doneTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#000',
    textAlign: 'center',
    marginTop: 14,
  },
  doneTotal: {
    fontFamily: fonts.regular,
    fontSize: 18,
    color: '#000',
    marginTop: 8,
  },
});
