
import React from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';

import {
  colors,
  fonts,
} from '../theme';

import { useApp } from '../context/AppContext';

// Icono según el estado del pedido.
const getNotificationIcon = (status) => {
  switch (status) {
    case 'Confirmado':
      return 'bag-check-outline';

    case 'Preparando':
      return 'time-outline';

    case 'En camino':
      return 'car-outline';

    case 'Entregado':
      return 'checkmark-circle-outline';

    case 'Cancelado':
      return 'close-circle-outline';

    default:
      return 'notifications-outline';
  }
};

// Color según el estado.
const getNotificationColor = (status) => {
  switch (status) {
    case 'Confirmado':
      return '#E99A35';

    case 'Preparando':
      return '#D99A35';

    case 'En camino':
      return '#8E70C9';

    case 'Entregado':
      return '#36A477';

    case 'Cancelado':
      return '#E36B6B';

    default:
      return colors.orange;
  }
};

// Formato de fecha.
const formatDate = (value) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function NotificacionScreen({ navigate }) {
  const {
    notifications = [],
    unreadNotifications = 0,
    markAsRead,
    markAllAsRead,
  } = useApp();

  const handlePress = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  return (
    <View style={styles.container}>

      {/* Encabezado original de FindAll */}
      <Header navigate={navigate} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Título de la pantalla */}
        <View style={styles.titleSection}>
          <View>
            <Text style={styles.title}>
              Mis notificaciones
            </Text>

            <Text style={styles.subtitle}>
              Aquí encontrarás las novedades de tus pedidos.
            </Text>
          </View>

          <View style={styles.titleIcon}>
            <Ionicons
              name="notifications-outline"
              size={23}
              color={colors.orange}
            />
          </View>
        </View>

        {/* Resumen de notificaciones */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="mail-unread-outline"
                size={21}
                color={colors.orange}
              />
            </View>

            <View>
              <Text style={styles.summaryTitle}>
                Notificaciones pendientes
              </Text>

              <Text style={styles.summaryDescription}>
                {unreadNotifications === 0
                  ? 'No tienes avisos pendientes'
                  : `Tienes ${unreadNotifications} aviso(s) sin leer`}
              </Text>
            </View>
          </View>

          <Text style={styles.summaryNumber}>
            {unreadNotifications}
          </Text>
        </View>

        {/* Encabezado de actividad */}
        <View style={styles.listHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Actividad reciente
            </Text>

            <Text style={styles.sectionSubtitle}>
              {notifications.length} notificación(es)
            </Text>
          </View>

          {unreadNotifications > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              activeOpacity={0.7}
              style={styles.readAllButton}
            >
              <Ionicons
                name="checkmark-done-outline"
                size={16}
                color={colors.orange}
              />

              <Text style={styles.readAllText}>
                Leer todas
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Lista de notificaciones */}
        {notifications.length === 0 ? (

          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="notifications-off-outline"
                size={38}
                color="#B5B5B5"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No tienes notificaciones
            </Text>

            <Text style={styles.emptyDescription}>
              Cuando realices una compra, recibirás aquí
              las actualizaciones sobre tus pedidos.
            </Text>

            <TouchableOpacity
              style={styles.catalogButton}
              onPress={() => navigate?.('home')}
              activeOpacity={0.8}
            >
              <Text style={styles.catalogButtonText}>
                Explorar productos
              </Text>

              <Ionicons
                name="arrow-forward"
                size={16}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

        ) : (

          <View style={styles.notificationList}>
            {notifications.map((notification) => {
              const icon = getNotificationIcon(
                notification.status
              );

              const iconColor = getNotificationColor(
                notification.status
              );

              const unread = !notification.read;

              return (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    unread && styles.unreadCard,
                  ]}
                  onPress={() => handlePress(notification)}
                  activeOpacity={0.8}
                >

                  {/* Icono */}
                  <View
                    style={[
                      styles.notificationIcon,
                      {
                        backgroundColor: `${iconColor}18`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={icon}
                      size={23}
                      color={iconColor}
                    />
                  </View>

                  {/* Información */}
                  <View style={styles.notificationContent}>

                    <View style={styles.notificationTop}>
                      <Text style={styles.notificationTitle}>
                        {notification.title}
                      </Text>

                      {unread && (
                        <View style={styles.unreadDot} />
                      )}
                    </View>

                    <Text style={styles.notificationMessage}>
                      {notification.message}
                    </Text>

                    <View style={styles.notificationBottom}>
                      <View style={styles.dateContainer}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color="#999"
                        />

                        <Text style={styles.notificationDate}>
                          {formatDate(notification.createdAt)}
                        </Text>
                      </View>

                      <Text style={styles.orderCode}>
                        {notification.orderCode}
                      </Text>
                    </View>

                    {!unread && (
                      <Text style={styles.readLabel}>
                        Leída
                      </Text>
                    )}
                  </View>

                </TouchableOpacity>
              );
            })}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 19,
    paddingBottom: 25,
  },

  // Título.
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: '#222',
  },

  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },

  titleIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#FFF1DF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Resumen.
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 23,
  },

  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  summaryIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    backgroundColor: '#FFF2E3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  summaryTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#333',
  },

  summaryDescription: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: '#888',
    marginTop: 3,
  },

  summaryNumber: {
    fontFamily: fonts.bold,
    fontSize: 23,
    color: colors.orange,
    marginLeft: 8,
  },

  // Lista.
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#222',
  },

  sectionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: '#999',
    marginTop: 3,
  },

  readAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 9,
    backgroundColor: '#FFF2E3',
    borderRadius: 8,
  },

  readAllText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.orange,
    marginLeft: 4,
  },

  notificationList: {
    gap: 10,
  },

  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 13,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },

  unreadCard: {
    borderColor: '#F3C995',
    backgroundColor: '#FFFCF8',
  },

  notificationIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  notificationContent: {
    flex: 1,
  },

  notificationTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  notificationTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#292929',
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.orange,
    marginLeft: 7,
  },

  notificationMessage: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 16,
    color: '#777',
    marginTop: 5,
  },

  notificationBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 10,
  },

  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  notificationDate: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: '#999',
  },

  orderCode: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: '#888',
  },

  readLabel: {
    fontFamily: fonts.medium,
    fontSize: 9,
    color: '#999',
    marginTop: 7,
  },

  // Estado vacío.
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 35,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  emptyIcon: {
    width: 75,
    height: 75,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#333',
  },

  emptyDescription: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 18,
    color: '#888',
    textAlign: 'center',
    marginTop: 7,
  },

  catalogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginTop: 19,
  },

  catalogButtonText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#fff',
    marginRight: 7,
  },
});
