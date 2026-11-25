import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import Header from '../components/Header';
import GradientButton from '../components/GradientButton';

import { useApp } from '../context/AppContext';
import { colors, fonts, gradientProps } from '../theme';

const REASONS = [
  { value: 'Entrega', icon: 'car-outline' },
  { value: 'Producto', icon: 'cube-outline' },
  { value: 'Otro', icon: 'chatbubble-outline' },
];

const HelpScreen = () => {
  const {
    orders = [],
    supportRequests = [],
    createSupportRequest,
    simulateSupportResponse,
    navigate,
  } = useApp();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedReason, setSelectedReason] = useState('Entrega');
  const [description, setDescription] = useState('');
  const [showOrders, setShowOrders] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // HU: errores de validación del formulario.
  const [errors, setErrors] = useState({});

  const descriptionLength = description.trim().length;

  const sortedRequests = useMemo(() => {
    return [...supportRequests].sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );
  }, [supportRequests]);

  const openRequests = supportRequests.filter(
    (request) => request.status === 'Abierto'
  ).length;

  const answeredRequests = supportRequests.filter(
    (request) => request.status === 'Respondido'
  ).length;

  const getDate = (date) => {
    if (!date) return 'Fecha no disponible';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Fecha no disponible';
    }

    return parsedDate.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getItemsCount = (order) => {
    if (!Array.isArray(order?.items)) return 0;

    return order.items.reduce(
      (total, item) => total + Number(item.quantity || 1),
      0
    );
  };

  const hasOpenRequest = (orderCode) => {
    return supportRequests.some(
      (request) =>
        request.orderCode === orderCode &&
        request.status === 'Abierto'
    );
  };

  // HU: validar los campos antes de crear la solicitud.
  const handleCreateRequest = () => {
    const newErrors = {};

    // Validar selección del pedido.
    if (!selectedOrder) {
      newErrors.order = 'Debes seleccionar un pedido.';
    }

    // Validar longitud mínima de la descripción.
    if (descriptionLength < 15) {
      newErrors.description =
        'La descripción debe tener mínimo 15 caracteres.';
    }

    // Validar que no exista otra solicitud abierta para ese pedido.
    if (
      selectedOrder &&
      hasOpenRequest(selectedOrder.code)
    ) {
      newErrors.order =
        'Ya tienes una solicitud abierta para este pedido.';
    }

    setErrors(newErrors);

    // Si existen errores, no se crea el caso.
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const result = createSupportRequest(
      selectedOrder.code,
      selectedReason,
      description.trim()
    );

    if (result?.ok) {
      setSelectedOrder(null);
      setSelectedReason('Entrega');
      setDescription('');
      setErrors({});
      setShowForm(false);
    }
  };

  const handleSimulateResponse = (requestId) => {
    simulateSupportResponse(requestId);
  };

  const renderOrderSelector = () => (
    <Modal
      visible={showOrders}
      transparent
      animationType="slide"
      onRequestClose={() => setShowOrders(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>
                Seleccionar pedido
              </Text>

              <Text style={styles.modalSubtitle}>
                Elige el pedido sobre el que necesitas ayuda.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowOrders(false)}
            >
              <Ionicons
                name="close"
                size={21}
                color={C.black}
              />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {orders.length === 0 ? (
              <View style={styles.emptyOrders}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="receipt-outline"
                    size={32}
                    color={C.orange}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  No tienes pedidos registrados
                </Text>

                <Text style={styles.emptyText}>
                  Cuando realices una compra, podrás solicitar ayuda desde
                  aquí.
                </Text>
              </View>
            ) : (
              orders.map((order) => {
                const alreadyOpen = hasOpenRequest(order.code);

                return (
                  <TouchableOpacity
                    key={order.code}
                    style={[
                      styles.orderOption,
                      selectedOrder?.code === order.code &&
                        styles.orderOptionSelected,
                      alreadyOpen && styles.orderOptionDisabled,
                    ]}
                    disabled={alreadyOpen}
                    onPress={() => {
                      setSelectedOrder(order);

                      setErrors((prev) => ({
                        ...prev,
                        order: undefined,
                      }));

                      setShowOrders(false);
                    }}
                  >
                    <View style={styles.orderIcon}>
                      <Ionicons
                        name="bag-handle-outline"
                        size={21}
                        color={C.orange}
                      />
                    </View>

                    <View style={styles.orderInfo}>
                      <Text style={styles.orderCode}>
                        Pedido #{order.code}
                      </Text>

                      <Text style={styles.orderDate}>
                        {getDate(order.date)}
                      </Text>

                      <Text style={styles.orderItems}>
                        {getItemsCount(order)} producto(s)
                      </Text>

                      {alreadyOpen && (
                        <Text style={styles.openRequestText}>
                          Ya tienes una solicitud abierta para este pedido.
                        </Text>
                      )}
                    </View>

                    <Ionicons
                      name={
                        alreadyOpen
                          ? 'lock-closed-outline'
                          : 'chevron-forward'
                      }
                      size={19}
                      color={C.muted}
                    />
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderRequestCard = (request) => {
    const isAnswered = request.status === 'Respondido';

    return (
      <View key={request.id} style={styles.requestCard}>
        {/* Encabezado del caso */}
        <View style={styles.requestTop}>
          <View style={styles.caseInfo}>
            <View style={styles.caseLabelRow}>
              <Ionicons
                name="document-text-outline"
                size={14}
                color={C.orange}
              />

              <Text style={styles.caseLabel}>
                Número de caso
              </Text>
            </View>

            <Text style={styles.caseNumber}>
              {request.caseNumber}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isAnswered
                ? styles.statusAnswered
                : styles.statusOpen,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isAnswered
                    ? C.success
                    : C.orange,
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: isAnswered
                    ? C.success
                    : C.orange,
                },
              ]}
            >
              {request.status}
            </Text>
          </View>
        </View>

        <View style={styles.requestDivider} />

        {/* Información del caso */}
        <View style={styles.requestDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Pedido</Text>

            <Text style={styles.detailValue}>
              #{request.orderCode}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Motivo</Text>

            <Text style={styles.detailValue}>
              {request.reason}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Fecha</Text>

            <Text style={styles.detailValue}>
              {getDate(request.createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.detailLabel}>
            Descripción del problema
          </Text>

          <Text style={styles.requestDescription}>
            {request.description}
          </Text>
        </View>

        {/* Respuesta */}
        {isAnswered ? (
          <View style={styles.answerContainer}>
            <View style={styles.answerHeader}>
              <View style={styles.answerIcon}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={18}
                  color={C.success}
                />
              </View>

              <Text style={styles.answerTitle}>
                Respuesta de atención
              </Text>
            </View>

            <Text style={styles.answerText}>
              {request.answer || 'Tu solicitud ha sido respondida.'}
            </Text>

            {request.answeredAt && (
              <Text style={styles.answerDate}>
                Respondido el {getDate(request.answeredAt)}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.pendingContainer}>
            <View style={styles.pendingHeader}>
              <Ionicons
                name="time-outline"
                size={19}
                color={C.orange}
              />

              <Text style={styles.pendingTitle}>
                Solicitud pendiente
              </Text>
            </View>

            <Text style={styles.pendingText}>
              Tu solicitud está abierta y pendiente de respuesta.
            </Text>

            <TouchableOpacity
              style={styles.simulateButton}
              onPress={() => handleSimulateResponse(request.id)}
              activeOpacity={0.75}
            >
              <Ionicons
                name="chatbox-ellipses-outline"
                size={17}
                color={C.black}
              />

              <Text style={styles.simulateButtonText}>
                Simular respuesta
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Título */}
        <View style={styles.pageHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigate('home')}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={C.black}
            />
          </TouchableOpacity>

          <View style={styles.pageTitleContainer}>
            <Text style={styles.pageTitle}>
              Centro de ayuda
            </Text>

            <Text style={styles.pageSubtitle}>
              Estamos aquí para ayudarte.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="headset-outline"
              size={24}
              color={C.orange}
            />
          </View>
        </View>

        {/* Banner principal */}
        <LinearGradient
          {...gradientProps}
          style={styles.welcomeCard}
        >
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeTitle}>
              ¿Necesitas ayuda?
            </Text>

            <Text style={styles.welcomeDescription}>
              Cuéntanos qué sucedió con tu compra y te ayudaremos a encontrar
              una solución.
            </Text>

            <TouchableOpacity
              style={styles.welcomeButton}
              onPress={() => {
                setShowForm(true);
                setErrors({});
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.welcomeButtonText}>
                Crear solicitud
              </Text>

              <Ionicons
                name="arrow-forward"
                size={16}
                color={C.black}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.welcomeIllustration}>
            <Ionicons
              name="headset"
              size={43}
              color={C.black}
            />
          </View>
        </LinearGradient>

        {/* Resumen */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="documents-outline"
                size={21}
                color={C.orange}
              />
            </View>

            <Text style={styles.summaryNumber}>
              {supportRequests.length}
            </Text>

            <Text style={styles.summaryLabel}>
              Total de casos
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="time-outline"
                size={21}
                color={C.orange}
              />
            </View>

            <Text style={styles.summaryNumber}>
              {openRequests}
            </Text>

            <Text style={styles.summaryLabel}>
              Abiertos
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="checkmark-circle-outline"
                size={21}
                color={C.success}
              />
            </View>

            <Text style={styles.summaryNumber}>
              {answeredRequests}
            </Text>

            <Text style={styles.summaryLabel}>
              Respondidos
            </Text>
          </View>
        </View>

        {/* Mis solicitudes */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Mis solicitudes
            </Text>

            <Text style={styles.sectionSubtitle}>
              Consulta el estado de tus casos.
            </Text>
          </View>

          <View style={styles.sectionCount}>
            <Text style={styles.sectionCountText}>
              {supportRequests.length}
            </Text>
          </View>
        </View>

        {sortedRequests.length === 0 ? (
          <View style={styles.emptyRequests}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="file-tray-outline"
                size={34}
                color={C.orange}
              />
            </View>

            <Text style={styles.emptyTitle}>
              Aún no tienes solicitudes
            </Text>

            <Text style={styles.emptyText}>
              Aquí aparecerán los casos que crees para recibir ayuda con tus
              pedidos.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => {
                setShowForm(true);
                setErrors({});
              }}
            >
              <Text style={styles.emptyButtonText}>
                Crear mi primera solicitud
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          sortedRequests.map(renderRequestCard)
        )}

        {/* Crear solicitud */}
        <View style={styles.newRequestSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Nueva solicitud
              </Text>

              <Text style={styles.sectionSubtitle}>
                Reporta un inconveniente con tu pedido.
              </Text>
            </View>
          </View>

          {!showForm ? (
            <TouchableOpacity
              style={styles.createRequestButton}
              onPress={() => {
                setShowForm(true);
                setErrors({});
              }}
              activeOpacity={0.75}
            >
              <View style={styles.createRequestIcon}>
                <Ionicons
                  name="add"
                  size={26}
                  color={C.black}
                />
              </View>

              <View style={styles.createRequestText}>
                <Text style={styles.createRequestTitle}>
                  Crear una solicitud
                </Text>

                <Text style={styles.createRequestSubtitle}>
                  Inicia un nuevo caso de atención.
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={C.orange}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <View>
                  <Text style={styles.formTitle}>
                    Detalles de tu solicitud
                  </Text>

                  <Text style={styles.formSubtitle}>
                    Completa la siguiente información.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setShowForm(false);
                    setErrors({});
                  }}
                  style={styles.closeFormButton}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={C.black}
                  />
                </TouchableOpacity>
              </View>

              {/* Pedido */}
              <Text style={styles.inputLabel}>
                1. Selecciona un pedido
              </Text>

              <TouchableOpacity
                style={[
                  styles.selector,
                  errors.order && styles.inputError,
                ]}
                onPress={() => setShowOrders(true)}
                activeOpacity={0.75}
              >
                <View style={styles.selectorIcon}>
                  <Ionicons
                    name="bag-handle-outline"
                    size={19}
                    color={C.orange}
                  />
                </View>

                <Text
                  style={[
                    styles.selectorText,
                    !selectedOrder && styles.placeholderText,
                  ]}
                >
                  {selectedOrder
                    ? `Pedido #${selectedOrder.code}`
                    : 'Seleccionar pedido del historial'}
                </Text>

                <Ionicons
                  name="chevron-down"
                  size={19}
                  color={C.muted}
                />
              </TouchableOpacity>

              {errors.order && (
                <Text style={styles.errorText}>
                  {errors.order}
                </Text>
              )}

              {selectedOrder && (
                <Text style={styles.selectedOrderDate}>
                  Pedido realizado el {getDate(selectedOrder.date)}
                </Text>
              )}

              {/* Motivo */}
              <Text style={styles.inputLabel}>
                2. Motivo de la solicitud
              </Text>

              <View style={styles.reasonsContainer}>
                {REASONS.map((reason) => {
                  const active = selectedReason === reason.value;

                  return (
                    <TouchableOpacity
                      key={reason.value}
                      style={[
                        styles.reasonOption,
                        active && styles.reasonOptionActive,
                      ]}
                      onPress={() => setSelectedReason(reason.value)}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name={reason.icon}
                        size={19}
                        color={active ? C.orange : C.muted}
                      />

                      <Text
                        style={[
                          styles.reasonText,
                          active && styles.reasonTextActive,
                        ]}
                      >
                        {reason.value}
                      </Text>

                      {active && (
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={C.orange}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Descripción */}
              <Text style={styles.inputLabel}>
                3. Describe lo sucedido
              </Text>

              <TextInput
                style={[
                  styles.descriptionInput,
                  errors.description && styles.inputError,
                ]}
                placeholder="Explica detalladamente el inconveniente que presentas..."
                placeholderTextColor={C.muted}
                value={description}
                onChangeText={(value) => {
                  setDescription(value);

                  if (value.trim().length >= 15) {
                    setErrors((prev) => ({
                      ...prev,
                      description: undefined,
                    }));
                  }
                }}
                multiline
                textAlignVertical="top"
                maxLength={500}
              />

              {errors.description && (
                <Text style={styles.errorText}>
                  {errors.description}
                </Text>
              )}

              <View style={styles.characterCounter}>
                <Text
                  style={[
                    styles.characterHint,
                    descriptionLength >= 15 &&
                      styles.characterHintValid,
                  ]}
                >
                  {descriptionLength >= 15
                    ? 'Descripción válida'
                    : 'Mínimo 15 caracteres'}
                </Text>

                <Text style={styles.characterCount}>
                  {descriptionLength}/500
                </Text>
              </View>

              <View style={styles.formNotice}>
                <Ionicons
                  name="information-circle-outline"
                  size={19}
                  color={C.orange}
                />

                <Text style={styles.formNoticeText}>
                  Se generará un número de caso para que puedas consultar el
                  estado de tu solicitud.
                </Text>
              </View>

              <GradientButton
                label="Enviar solicitud"
                onPress={handleCreateRequest}
                disabled={false}
              />
            </View>
          )}
        </View>

        {/* Información inferior */}
        <View style={styles.bottomHelp}>
          <Ionicons
            name="shield-checkmark-outline"
            size={19}
            color={C.orange}
          />

          <Text style={styles.bottomHelpText}>
            Tus solicitudes quedan guardadas para que puedas consultar su
            seguimiento.
          </Text>
        </View>
      </ScrollView>

      {renderOrderSelector()}
    </View>
  );
};

// Colores de FindAll.
const C = {
  background: colors.bg || '#FFF5DF',
  card: colors.card || '#F5EDDD',
  cardDark: colors.cardDark || '#EEE8DA',
  circle: colors.circle || '#E6E2DA',
  orange: colors.orange || '#FF7A21',
  yellow: colors.yellow || '#FFD95A',
  black: '#171717',
  white: '#FFFFFF',
  muted: '#858078',
  border: '#E7DCC9',
  success: colors.success || '#26865B',
  successLight: '#E6F3E9',
  warningLight: '#FFF0D8',
};

const FONT_REGULAR = fonts.regular;
const FONT_MEDIUM = fonts.medium;
const FONT_SEMIBOLD = fonts.semibold;
const FONT_BOLD = fonts.bold;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 35,
  },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
  },

  backButton: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  pageTitleContainer: {
    flex: 1,
  },

  pageTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 21,
    color: C.black,
  },

  pageSubtitle: {
    fontFamily: FONT_REGULAR,
    fontSize: 11,
    color: C.muted,
    marginTop: 3,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 17,
    marginBottom: 17,
    overflow: 'hidden',
  },

  welcomeTextContainer: {
    flex: 1,
    paddingRight: 8,
  },

  welcomeTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 18,
    color: C.black,
    marginBottom: 6,
  },

  welcomeDescription: {
    fontFamily: FONT_MEDIUM,
    fontSize: 11,
    lineHeight: 17,
    color: C.black,
  },

  welcomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: C.white,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 9,
    marginTop: 13,
    gap: 8,
  },

  welcomeButtonText: {
    fontFamily: FONT_BOLD,
    fontSize: 11,
    color: C.black,
  },

  welcomeIllustration: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryContainer: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 25,
  },

  summaryCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 17,
    paddingVertical: 13,
    paddingHorizontal: 4,
  },

  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: C.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },

  summaryNumber: {
    fontFamily: FONT_BOLD,
    fontSize: 19,
    color: C.black,
  },

  summaryLabel: {
    fontFamily: FONT_MEDIUM,
    fontSize: 9,
    color: C.muted,
    marginTop: 3,
    textAlign: 'center',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 17,
    color: C.black,
  },

  sectionSubtitle: {
    fontFamily: FONT_REGULAR,
    fontSize: 11,
    color: C.muted,
    marginTop: 3,
  },

  sectionCount: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: C.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionCountText: {
    fontFamily: FONT_BOLD,
    fontSize: 12,
    color: C.black,
  },

  emptyRequests: {
    backgroundColor: C.card,
    borderRadius: 19,
    padding: 22,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: C.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  emptyTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 14,
    color: C.black,
    marginBottom: 6,
    textAlign: 'center',
  },

  emptyText: {
    fontFamily: FONT_REGULAR,
    fontSize: 11,
    color: C.muted,
    lineHeight: 17,
    textAlign: 'center',
  },

  emptyButton: {
    backgroundColor: C.orange,
    borderRadius: 11,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 15,
  },

  emptyButtonText: {
    fontFamily: FONT_BOLD,
    fontSize: 11,
    color: C.black,
  },

  requestCard: {
    backgroundColor: C.card,
    borderRadius: 19,
    padding: 15,
    marginBottom: 12,
  },

  requestTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  caseInfo: {
    flex: 1,
  },

  caseLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },

  caseLabel: {
    fontFamily: FONT_MEDIUM,
    fontSize: 10,
    color: C.muted,
  },

  caseNumber: {
    fontFamily: FONT_BOLD,
    fontSize: 14,
    color: C.black,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  statusOpen: {
    backgroundColor: C.warningLight,
  },

  statusAnswered: {
    backgroundColor: C.successLight,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: {
    fontFamily: FONT_BOLD,
    fontSize: 10,
  },

  requestDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 13,
  },

  requestDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 9,
  },

  detailItem: {
    flex: 1,
    minWidth: 75,
  },

  detailLabel: {
    fontFamily: FONT_MEDIUM,
    fontSize: 10,
    color: C.muted,
  },

  detailValue: {
    fontFamily: FONT_BOLD,
    fontSize: 11,
    color: C.black,
    marginTop: 4,
  },

  descriptionContainer: {
    marginTop: 14,
    marginBottom: 13,
  },

  requestDescription: {
    fontFamily: FONT_REGULAR,
    fontSize: 12,
    lineHeight: 18,
    color: C.black,
    marginTop: 5,
  },

  answerContainer: {
    backgroundColor: C.successLight,
    borderRadius: 14,
    padding: 12,
  },

  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  answerIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  answerTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 12,
    color: C.success,
  },

  answerText: {
    fontFamily: FONT_REGULAR,
    fontSize: 11,
    lineHeight: 18,
    color: C.black,
  },

  answerDate: {
    fontFamily: FONT_MEDIUM,
    fontSize: 10,
    color: C.success,
    marginTop: 8,
  },

  pendingContainer: {
    backgroundColor: C.warningLight,
    borderRadius: 14,
    padding: 12,
  },

  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  pendingTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 12,
    color: C.black,
  },

  pendingText: {
    fontFamily: FONT_REGULAR,
    fontSize: 11,
    color: C.muted,
    lineHeight: 17,
    marginTop: 5,
  },

  simulateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: C.yellow,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 11,
    gap: 7,
  },

  simulateButtonText: {
    fontFamily: FONT_BOLD,
    fontSize: 10,
    color: C.black,
  },

  newRequestSection: {
    marginTop: 25,
  },

  createRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 17,
    padding: 13,
  },

  createRequestIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: C.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  createRequestText: {
    flex: 1,
  },

  createRequestTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 13,
    color: C.black,
  },

  createRequestSubtitle: {
    fontFamily: FONT_REGULAR,
    fontSize: 10,
    color: C.muted,
    marginTop: 4,
  },

  formCard: {
    backgroundColor: C.card,
    borderRadius: 19,
    padding: 15,
  },

  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  formTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 15,
    color: C.black,
  },

  formSubtitle: {
    fontFamily: FONT_REGULAR,
    fontSize: 10,
    color: C.muted,
    marginTop: 4,
  },

  closeFormButton: {
    width: 33,
    height: 33,
    borderRadius: 11,
    backgroundColor: C.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputLabel: {
    fontFamily: FONT_BOLD,
    fontSize: 12,
    color: C.black,
    marginTop: 15,
    marginBottom: 8,
  },

  selector: {
    minHeight: 47,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
  },

  selectorIcon: {
    width: 31,
    height: 31,
    borderRadius: 9,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectorText: {
    flex: 1,
    fontFamily: FONT_MEDIUM,
    fontSize: 11,
    color: C.black,
    marginLeft: 9,
  },

  placeholderText: {
    color: C.muted,
    fontFamily: FONT_REGULAR,
  },

  selectedOrderDate: {
    fontFamily: FONT_REGULAR,
    fontSize: 10,
    color: C.muted,
    marginTop: 6,
  },

  reasonsContainer: {
    gap: 7,
  },

  reasonOption: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 11,
    paddingHorizontal: 11,
    backgroundColor: C.white,
  },

  reasonOptionActive: {
    borderColor: C.orange,
    backgroundColor: '#FFF0DC',
  },

  reasonText: {
    flex: 1,
    fontFamily: FONT_MEDIUM,
    fontSize: 11,
    color: C.muted,
    marginLeft: 9,
  },

  reasonTextActive: {
    color: C.black,
    fontFamily: FONT_BOLD,
  },

  descriptionInput: {
    minHeight: 105,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    fontFamily: FONT_REGULAR,
    fontSize: 12,
    color: C.black,
    backgroundColor: C.white,
  },

  // HU: estilos de validación.
  inputError: {
    borderColor: '#D32F2F',
  },

  errorText: {
    fontFamily: FONT_MEDIUM,
    fontSize: 10,
    color: '#D32F2F',
    marginTop: 6,
    marginLeft: 3,
  },

  characterCounter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 7,
  },

  characterHint: {
    fontFamily: FONT_MEDIUM,
    fontSize: 10,
    color: C.orange,
  },

  characterHintValid: {
    color: C.success,
  },

  characterCount: {
    fontFamily: FONT_REGULAR,
    fontSize: 10,
    color: C.muted,
  },

  formNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF0DC',
    borderRadius: 11,
    padding: 11,
    marginTop: 15,
    marginBottom: 17,
    gap: 8,
  },

  formNoticeText: {
    flex: 1,
    fontFamily: FONT_REGULAR,
    fontSize: 10,
    lineHeight: 16,
    color: C.black,
  },

  bottomHelp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 23,
    paddingHorizontal: 8,
    gap: 8,
  },

  bottomHelpText: {
    flex: 1,
    fontFamily: FONT_REGULAR,
    fontSize: 10,
    color: C.muted,
    lineHeight: 15,
  },

  // Modal de pedidos
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    maxHeight: '78%',
    backgroundColor: C.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 17,
    paddingTop: 11,
    paddingBottom: 28,
  },

  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#D5CABB',
    alignSelf: 'center',
    marginBottom: 16,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  modalTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 17,
    color: C.black,
  },

  modalSubtitle: {
    fontFamily: FONT_REGULAR,
    fontSize: 10,
    color: C.muted,
    marginTop: 4,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  orderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 11,
    marginBottom: 9,
    backgroundColor: C.card,
  },

  orderOptionSelected: {
    borderColor: C.orange,
    backgroundColor: '#FFF0DC',
  },

  orderOptionDisabled: {
    opacity: 0.55,
  },

  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  orderInfo: {
    flex: 1,
  },

  orderCode: {
    fontFamily: FONT_BOLD,
    fontSize: 12,
    color: C.black,
  },

  orderDate: {
    fontFamily: FONT_REGULAR,
    fontSize: 10,
    color: C.muted,
    marginTop: 3,
  },

  orderItems: {
    fontFamily: FONT_REGULAR,
    fontSize: 10,
    color: C.muted,
    marginTop: 2,
  },

  openRequestText: {
    fontFamily: FONT_MEDIUM,
    fontSize: 9,
    color: C.orange,
    marginTop: 5,
  },

  emptyOrders: {
    alignItems: 'center',
    paddingVertical: 27,
    paddingHorizontal: 15,
  },
});

export default HelpScreen;