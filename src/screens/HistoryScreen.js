
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import ProductImage from '../components/ProductImage';
import { EmptyState } from './HomeScreen';

import {
  colors,
  fonts,
  formatPrice,
  formatDate,
  formatLongDate,
  DELIVERY_WINDOW,
} from '../theme';

import { useApp } from '../context/AppContext';

const unitsIn = (order) =>
  (order.items || []).reduce(
    (total, item) => total + (Number(item.qty) || 0),
    0
  );

const STATUS_FLOW = [
  'Confirmado',
  'Preparando',
  'En camino',
  'Entregado',
];

const STATUS_INFO = {
  Confirmado: {
    icon: 'receipt-outline',
    description: 'Tu pedido fue confirmado correctamente.',
  },
  Preparando: {
    icon: 'cube-outline',
    description: 'El vendedor está preparando tu pedido.',
  },
  'En camino': {
    icon: 'car-outline',
    description: 'Tu pedido ha sido enviado y está en camino.',
  },
  Entregado: {
    icon: 'checkmark-circle-outline',
    description: 'Tu pedido ha sido entregado correctamente.',
  },
  Cancelado: {
    icon: 'close-circle-outline',
    description: 'El pedido fue cancelado y las unidades regresaron al inventario.',
  },
};

const formatStatusDate = (date) => {
  if (!date) return 'Fecha no disponible';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Fecha no disponible';
  }

  return parsedDate.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function HistoryScreen({ navigate }) {
  const {
    orders,
    getProduct,
    advanceOrder,
    cancelOrder,
  } = useApp();

  const [selectedCode, setSelectedCode] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Buscar el pedido seleccionado.
  const order = orders.find(
    (item) => item.code === selectedCode
  );

  // Obtener imagen del producto.
  const imageOf = (item) =>
    getProduct(item.productId) || {
      category: item.category,
      image: null,
    };

  // Historial compatible con pedidos antiguos.
  const getOrderHistory = (selectedOrder) => {
    if (
      Array.isArray(selectedOrder.statusHistory) &&
      selectedOrder.statusHistory.length > 0
    ) {
      return selectedOrder.statusHistory;
    }

    return [
      {
        status: selectedOrder.status || 'Confirmado',
        date: selectedOrder.date,
        description:
          STATUS_INFO[selectedOrder.status]?.description ||
          'Tu pedido fue registrado.',
      },
    ];
  };

  // Avanzar un estado del pedido.
  const handleAdvance = () => {
    if (!order) return;

    advanceOrder(order.code);
  };

  // Mostrar confirmación de cancelación.
  const handleCancel = () => {
    if (!order) return;

    setShowCancelConfirm(true);
  };

  // Ejecutar cancelación después de confirmar.
  const confirmCancellation = () => {
    if (!order) return;

    const cancelled = cancelOrder(order.code);

    if (cancelled) {
      setShowCancelConfirm(false);
    }
  };

  const currentStatus = order?.status || 'Confirmado';

  const currentIndex = STATUS_FLOW.indexOf(currentStatus);

  const canAdvance =
    currentIndex >= 0 &&
    currentIndex < STATUS_FLOW.length - 1;

  // Solo se puede cancelar si está confirmado o preparando.
  const canCancel =
    currentStatus === 'Confirmado' ||
    currentStatus === 'Preparando';

  const history = order ? getOrderHistory(order) : [];

  const lastEvent = history[history.length - 1];

  const cancellationEvent = history.find(
    (event) => event.status === 'Cancelado'
  );

  return (
    <View style={styles.screen}>
      <Header navigate={navigate} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          HISTORIAL DE PEDIDOS
        </Text>

        <Text style={styles.subtitle}>
          Consulta tus compras y revisa el estado de tus entregas.
        </Text>

        {orders.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            text="Aún no hay pedidos registrados."
            action="Ir al catálogo"
            onAction={() => navigate('home')}
          />
        ) : (
          orders.map((item) => {
            const quantity = unitsIn(item);

            return (
              <TouchableOpacity
                key={item.code}
                style={styles.orderCard}
                onPress={() => {
                  setShowCancelConfirm(false);
                  setSelectedCode(item.code);
                }}
                activeOpacity={0.85}
              >
                <ProductImage
                  product={imageOf(item.items?.[0] || {})}
                  style={styles.thumb}
                  iconSize={40}
                />

                <View style={styles.orderInfo}>
                  <Text style={styles.small}>
                    Código de pedido:
                  </Text>

                  <Text style={styles.orderCode}>
                    {item.code.split('').join(' ')}
                  </Text>

                  <Text style={styles.small}>
                    Pedido: {formatDate(item.date)}
                  </Text>

                  <Text style={styles.small}>
                    Estado actual:
                  </Text>

                  <Text
                    style={[
                      styles.statusText,
                      item.status === 'Cancelado' &&
                        styles.cancelledStatus,
                    ]}
                  >
                    {item.status || 'Confirmado'}
                  </Text>

                  <Text style={styles.small}>
                    Entrega aproximada:
                  </Text>

                  <Text style={styles.delivery}>
                    {formatLongDate(
                      item.deliveryDate || item.date
                    )}
                  </Text>

                  <Text style={styles.deliveryTime}>
                    {item.shippingMethodLabel
                      ? `Envío ${item.shippingMethodLabel}`
                      : DELIVERY_WINDOW}
                  </Text>

                  <Text style={styles.total}>
                    Total: {formatPrice(item.total)}
                  </Text>

                  <Text style={styles.openDetails}>
                    Ver seguimiento y detalles
                    <Ionicons
                      name="chevron-forward"
                      size={15}
                      color={colors.orange}
                    />
                  </Text>
                </View>

                <View style={styles.pill}>
                  <Text style={styles.pillText}>
                    {quantity}{' '}
                    {quantity === 1 ? 'Producto' : 'Productos'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* DETALLE Y SEGUIMIENTO DEL PEDIDO */}
      {order && (
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <ScrollView
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                style={styles.close}
                onPress={() => {
                  setSelectedCode(null);
                  setShowCancelConfirm(false);
                }}
              >
                <Ionicons
                  name="close"
                  size={28}
                  color={colors.danger}
                />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>
                DETALLE DEL PEDIDO
              </Text>

              <Text style={styles.small}>
                Código de pedido:
              </Text>

              <Text style={styles.orderCode}>
                {order.code.split('').join(' ')}
              </Text>

              <Text style={styles.small}>
                Fecha de compra: {formatDate(order.date)}
              </Text>

              {/* ESTADO ACTUAL */}
              <View style={styles.currentStatusBox}>
                <Ionicons
                  name={
                    STATUS_INFO[currentStatus]?.icon ||
                    'time-outline'
                  }
                  size={30}
                  color={
                    currentStatus === 'Cancelado'
                      ? colors.danger
                      : colors.orange
                  }
                />

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.currentStatusLabel}>
                    ESTADO ACTUAL
                  </Text>

                  <Text
                    style={[
                      styles.currentStatus,
                      currentStatus === 'Cancelado' &&
                        styles.cancelledStatus,
                    ]}
                  >
                    {currentStatus}
                  </Text>

                  <Text style={styles.statusDescription}>
                    {STATUS_INFO[currentStatus]?.description ||
                      'Tu pedido se encuentra en seguimiento.'}
                  </Text>
                </View>
              </View>

              {/* SEGUIMIENTO CRONOLÓGICO */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons
                    name="navigate-circle-outline"
                    size={21}
                    color={colors.orange}
                  />{' '}
                  Seguimiento de entrega
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Consulta cada etapa por la que ha pasado tu pedido.
                </Text>

                <View style={styles.timeline}>
                  {STATUS_FLOW.map((status, index) => {
                    const event = history.find(
                      (item) => item.status === status
                    );

                    const completed = Boolean(event);
                    const isCurrent = status === currentStatus;
                    const isLast =
                      index === STATUS_FLOW.length - 1;

                    return (
                      <View
                        key={status}
                        style={styles.timelineItem}
                      >
                        <View style={styles.timelineLeft}>
                          <View
                            style={[
                              styles.timelineCircle,
                              completed && styles.timelineCircleDone,
                            ]}
                          >
                            <Ionicons
                              name={
                                completed
                                  ? 'checkmark'
                                  : 'ellipse-outline'
                              }
                              size={17}
                              color={
                                completed
                                  ? '#FFFFFF'
                                  : colors.muted
                              }
                            />
                          </View>

                          {!isLast && (
                            <View
                              style={[
                                styles.timelineLine,
                                completed && styles.timelineLineDone,
                              ]}
                            />
                          )}
                        </View>

                        <View style={styles.timelineContent}>
                          <Text
                            style={[
                              styles.timelineTitle,
                              completed && styles.timelineTitleDone,
                            ]}
                          >
                            {status}
                          </Text>

                          {completed ? (
                            <>
                              <Text style={styles.timelineDescription}>
                                {event.description ||
                                  STATUS_INFO[status]?.description}
                              </Text>

                              <Text style={styles.timelineDate}>
                                {formatStatusDate(event.date)}
                              </Text>
                            </>
                          ) : (
                            <Text style={styles.pendingText}>
                              Pendiente
                            </Text>
                          )}

                          {isCurrent && (
                            <View style={styles.currentBadge}>
                              <Text style={styles.currentBadgeText}>
                                ESTADO ACTUAL
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}

                  {/* EVENTO DE CANCELACIÓN */}
                  {cancellationEvent && (
                    <View style={styles.timelineItem}>
                      <View style={styles.timelineLeft}>
                        <View style={styles.cancelTimelineCircle}>
                          <Ionicons
                            name="close"
                            size={18}
                            color="#FFFFFF"
                          />
                        </View>
                      </View>

                      <View style={styles.timelineContent}>
                        <Text style={styles.cancelTimelineTitle}>
                          Pedido cancelado
                        </Text>

                        <Text style={styles.timelineDescription}>
                          {cancellationEvent.description ||
                            STATUS_INFO.Cancelado.description}
                        </Text>

                        <Text style={styles.cancelTimelineDate}>
                          {formatStatusDate(cancellationEvent.date)}
                        </Text>

                        <View style={styles.cancelledBadge}>
                          <Text style={styles.cancelledBadgeText}>
                            PEDIDO CANCELADO
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* INFORMACIÓN DEL ENVÍO */}
              <View style={styles.sumBox}>
                <Text style={styles.sectionTitle}>
                  <Ionicons
                    name="car-outline"
                    size={20}
                    color={colors.orange}
                  />{' '}
                  Información del envío
                </Text>

                <Text style={styles.sumLine}>
                  <Text style={styles.bold}>Método: </Text>
                  {order.shippingMethodLabel || 'Estándar'}
                </Text>

                <Text style={styles.sumLine}>
                  <Text style={styles.bold}>Tiempo estimado: </Text>
                  {order.shippingDays
                    ? `${order.shippingDays} día(s)`
                    : DELIVERY_WINDOW}
                </Text>

                <Text style={styles.sumLine}>
                  <Text style={styles.bold}>Entrega aproximada: </Text>
                  {formatLongDate(
                    order.deliveryDate || order.date
                  )}
                </Text>

                {order.shippingAddress ? (
                  <>
                    <Text style={styles.sumLine}>
                      <Text style={styles.bold}>Dirección: </Text>
                      {order.shippingAddress.alias}
                    </Text>

                    <Text style={styles.sumLine}>
                      {order.shippingAddress.municipio} ·{' '}
                      {order.shippingAddress.reference}
                    </Text>
                  </>
                ) : order.buyer ? (
                  <Text style={styles.sumLine}>
                    {order.buyer.municipio} · {order.buyer.address}
                  </Text>
                ) : null}
              </View>

              {/* PRODUCTOS */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Productos del pedido
                </Text>

                {(order.items || []).map((item, index) => (
                  <View
                    key={`${item.productId}-${index}`}
                    style={styles.item}
                  >
                    <ProductImage
                      product={imageOf(item)}
                      style={styles.itemImg}
                      iconSize={40}
                    />

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.itemName}>
                        {item.name}
                      </Text>

                      <Text style={styles.line}>
                        Emprendimiento:{' '}
                        <Text style={styles.accent}>
                          {item.brand}
                        </Text>
                      </Text>

                      {item.variantLabel || item.size ? (
                        <Text style={styles.line}>
                          Variante:{' '}
                          <Text style={styles.accent}>
                            {item.variantLabel || item.size}
                          </Text>
                        </Text>
                      ) : null}

                      <Text style={styles.line}>
                        Cantidad:{' '}
                        <Text style={styles.accent}>
                          {item.qty}
                        </Text>
                      </Text>

                      <Text style={styles.line}>
                        Precio unitario:{' '}
                        <Text style={styles.accent}>
                          {formatPrice(item.unitPrice)}
                        </Text>
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* RESUMEN DE COMPRA */}
              <View style={styles.sumBox}>
                <Text style={styles.sectionTitle}>
                  Resumen de compra
                </Text>

                <Text style={styles.sumLine}>
                  <Text style={styles.bold}>Subtotal: </Text>
                  {formatPrice(order.subtotal)}
                </Text>

                {order.discount > 0 && (
                  <Text style={styles.sumLine}>
                    <Text style={styles.bold}>
                      Descuento ({order.coupon}):{' '}
                    </Text>

                    <Text style={styles.accent}>
                      -{formatPrice(order.discount)}
                    </Text>
                  </Text>
                )}

                <Text style={styles.sumLine}>
                  <Text style={styles.bold}>Costo de envío: </Text>

                  {order.shipping === 0
                    ? 'Gratis'
                    : formatPrice(order.shipping)}
                </Text>

                <View style={styles.totalDivider} />

                <Text style={styles.finalTotal}>
                  TOTAL: {formatPrice(order.total)}
                </Text>
              </View>

              {/* HU28: CANCELAR PEDIDO */}
              {canCancel && (
                <View style={styles.cancelBox}>
                  <Text style={styles.cancelTitle}>
                    ¿Necesitas cancelar tu pedido?
                  </Text>

                  <Text style={styles.cancelDescription}>
                    Puedes cancelar mientras el pedido esté confirmado
                    o en preparación. Las unidades compradas regresarán
                    al inventario.
                  </Text>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancel}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={21}
                      color="#FFFFFF"
                    />

                    <Text style={styles.cancelButtonText}>
                      Cancelar pedido
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* SIMULACIÓN DE AVANCE */}
              <View style={styles.simulationBox}>
                <Text style={styles.simulationTitle}>
                  Simulación de seguimiento
                </Text>

                <Text style={styles.simulationDescription}>
                  Utiliza este botón para simular el avance del pedido
                  y comprobar las diferentes etapas de entrega.
                </Text>

                {canAdvance ? (
                  <TouchableOpacity
                    style={styles.advanceButton}
                    onPress={handleAdvance}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="arrow-forward-circle-outline"
                      size={21}
                      color="#FFFFFF"
                    />

                    <Text style={styles.advanceButtonText}>
                      Simular avance de entrega
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.completedBox}>
                    <Ionicons
                      name={
                        currentStatus === 'Cancelado'
                          ? 'close-circle'
                          : 'checkmark-circle'
                      }
                      size={23}
                      color={
                        currentStatus === 'Cancelado'
                          ? colors.danger
                          : '#27834B'
                      }
                    />

                    <Text
                      style={[
                        styles.completedText,
                        currentStatus === 'Cancelado' &&
                          styles.cancelledCompletedText,
                      ]}
                    >
                      {currentStatus === 'Cancelado'
                        ? 'Este pedido fue cancelado y ya no puede avanzar.'
                        : 'Este pedido ya finalizó su seguimiento.'}
                    </Text>
                  </View>
                )}

                <Text style={styles.simulationNote}>
                  Última actualización:{' '}
                  {formatStatusDate(lastEvent?.date)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedCode(null)}
              >
                <Text style={styles.closeButtonText}>
                  Cerrar detalle
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}

      {/* VENTANA PROPIA DE CONFIRMACIÓN */}
      {showCancelConfirm && order && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmModal}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={colors.danger}
            />

            <Text style={styles.confirmTitle}>
              ¿Cancelar pedido?
            </Text>

            <Text style={styles.confirmDescription}>
              ¿Estás seguro de que deseas cancelar este pedido?
              Las unidades compradas regresarán al inventario.
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.keepOrderButton}
                onPress={() => setShowCancelConfirm(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.keepOrderText}>
                  No, volver
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={confirmCancellation}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmCancelText}>
                  Sí, cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  content: {
    padding: 16,
    paddingBottom: 35,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.orange,
    marginBottom: 5,
  },

  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#555',
    marginBottom: 18,
  },

  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 12,
    marginBottom: 14,
    minHeight: 150,
  },

  thumb: {
    width: 95,
    height: 115,
  },

  orderInfo: {
    flex: 1,
    marginLeft: 10,
    paddingBottom: 5,
  },

  small: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#222',
    marginTop: 3,
  },

  orderCode: {
    fontFamily: fonts.bold,
    fontSize: 19,
    color: colors.orange,
    letterSpacing: 1,
    marginVertical: 2,
  },

  statusText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.orange,
    marginTop: 2,
  },

  cancelledStatus: {
    color: colors.danger,
  },

  delivery: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.orange,
  },

  deliveryTime: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.orange,
  },

  total: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#000',
    marginTop: 5,
  },

  openDetails: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.orange,
    marginTop: 10,
  },

  pill: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: colors.cardDark,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },

  pillText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.orange,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,243,220,0.88)',
    justifyContent: 'center',
    padding: 12,
    zIndex: 10,
  },

  modal: {
    flex: 1,
    maxHeight: '96%',
    backgroundColor: colors.bg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#000',
    overflow: 'hidden',
  },

  modalContent: {
    padding: 16,
    paddingBottom: 30,
  },

  close: {
    alignSelf: 'flex-end',
    width: 42,
    height: 42,
    borderRadius: 22,
    backgroundColor: colors.circle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },

  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.orange,
    marginBottom: 10,
  },

  currentStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 17,
    padding: 14,
    marginTop: 14,
  },

  currentStatusLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#777',
    letterSpacing: 1,
  },

  currentStatus: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.orange,
    marginTop: 2,
  },

  statusDescription: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#555',
    marginTop: 3,
  },

  section: {
    marginTop: 20,
  },

  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.orange,
    marginBottom: 5,
  },

  sectionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },

  timeline: {
    paddingLeft: 5,
    paddingTop: 5,
  },

  timelineItem: {
    flexDirection: 'row',
    minHeight: 90,
  },

  timelineLeft: {
    width: 38,
    alignItems: 'center',
  },

  timelineCircle: {
    width: 30,
    height: 30,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C8C8C8',
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  timelineCircleDone: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },

  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#D8D8D8',
    marginVertical: 2,
  },

  timelineLineDone: {
    backgroundColor: colors.orange,
  },

  timelineContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 18,
  },

  timelineTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#888',
  },

  timelineTitleDone: {
    color: '#222',
  },

  timelineDescription: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },

  timelineDate: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.orange,
    marginTop: 5,
  },

  pendingText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },

  currentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cardDark,
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginTop: 6,
  },

  currentBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.orange,
  },

  cancelTimelineCircle: {
    width: 30,
    height: 30,
    borderRadius: 16,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  cancelTimelineTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.danger,
  },

  cancelTimelineDate: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.danger,
    marginTop: 5,
  },

  cancelledBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FCE5E5',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 7,
  },

  cancelledBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.danger,
  },

  sumBox: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 13,
    marginTop: 15,
  },

  sumLine: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#000',
    marginVertical: 4,
  },

  bold: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#000',
  },

  accent: {
    fontFamily: fonts.bold,
    color: colors.orange,
  },

  totalDivider: {
    height: 1,
    backgroundColor: '#D5D5D5',
    marginVertical: 9,
  },

  finalTotal: {
    fontFamily: fonts.bold,
    fontSize: 19,
    color: colors.orange,
    textAlign: 'right',
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 10,
    marginTop: 12,
  },

  itemImg: {
    width: 90,
    height: 100,
  },

  itemName: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#000',
    marginBottom: 3,
  },

  line: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#000',
    marginVertical: 2,
  },

  cancelBox: {
    backgroundColor: colors.card,
    borderRadius: 17,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.danger,
  },

  cancelTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.danger,
  },

  cancelDescription: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 12,
  },

  cancelButton: {
    backgroundColor: colors.danger,
    borderRadius: 14,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  cancelButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#FFFFFF',
    marginLeft: 7,
  },

  simulationBox: {
    backgroundColor: colors.card,
    borderRadius: 17,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.orange,
  },

  simulationTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.orange,
  },

  simulationDescription: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 12,
  },

  advanceButton: {
    backgroundColor: colors.orange,
    borderRadius: 14,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  advanceButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#FFFFFF',
    marginLeft: 7,
  },

  completedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F3E8',
    padding: 12,
    borderRadius: 12,
  },

  completedText: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#27834B',
    marginLeft: 8,
  },

  cancelledCompletedText: {
    color: colors.danger,
  },

  simulationNote: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: '#777',
    marginTop: 10,
  },

  closeButton: {
    backgroundColor: colors.cardDark,
    borderRadius: 14,
    padding: 13,
    alignItems: 'center',
    marginTop: 18,
  },

  closeButtonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.orange,
  },

  // Ventana de confirmación de cancelación.
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    zIndex: 30,
  },

  confirmModal: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.bg,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
  },

  confirmTitle: {
    fontFamily: fonts.bold,
    fontSize: 21,
    color: colors.danger,
    marginTop: 12,
    marginBottom: 8,
  },

  confirmDescription: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },

  confirmActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 22,
  },

  keepOrderButton: {
    flex: 1,
    backgroundColor: colors.cardDark,
    padding: 13,
    borderRadius: 12,
    alignItems: 'center',
  },

  keepOrderText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.orange,
  },

  confirmCancelButton: {
    flex: 1,
    backgroundColor: colors.danger,
    padding: 13,
    borderRadius: 12,
    alignItems: 'center',
  },

  confirmCancelText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
});
