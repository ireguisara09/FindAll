
// ======================================================
// FINDALL - MARKETPLACE 2.0
// HU29: Centro de notificaciones interno
// ======================================================

// Genera una notificación relacionada con un pedido.
export const createOrderNotification = ({
  orderId,
  orderCode,
  status,
}) => {
  const messages = {
    Confirmado: {
      title: 'Pedido confirmado',
      message: `Tu pedido ${orderCode} ha sido confirmado correctamente.`,
    },
    Preparando: {
      title: 'Pedido en preparación',
      message: `Tu pedido ${orderCode} está siendo preparado.`,
    },
    'En camino': {
      title: 'Pedido en camino',
      message: `Tu pedido ${orderCode} ya está en camino.`,
    },
    Entregado: {
      title: 'Pedido entregado',
      message: `Tu pedido ${orderCode} ha sido entregado.`,
    },
    Cancelado: {
      title: 'Pedido cancelado',
      message: `Tu pedido ${orderCode} ha sido cancelado.`,
    },
  };

  const notificationContent = messages[status];

  if (!notificationContent) {
    return null;
  }

  return {
    id: `${orderId}-${status}`,
    type: 'order',
    orderId,
    orderCode,
    status,
    title: notificationContent.title,
    message: notificationContent.message,
    createdAt: new Date().toISOString(),
    read: false,
  };
};

// Agrega una notificación sin duplicarla.
export const addNotification = (notifications = [], notification) => {
  if (!notification) {
    return notifications;
  }

  const alreadyExists = notifications.some(
    (item) => item.id === notification.id
  );

  if (alreadyExists) {
    return notifications;
  }

  return [notification, ...notifications];
};

// Marca una notificación específica como leída.
export const markNotificationAsRead = (notifications = [], id) => {
  return notifications.map((item) =>
    item.id === id
      ? { ...item, read: true }
      : item
  );
};

// Marca todas las notificaciones como leídas.
export const markAllNotificationsAsRead = (notifications = []) => {
  return notifications.map((item) => ({
    ...item,
    read: true,
  }));
};

// Cuenta las notificaciones que todavía no se han leído.
export const getUnreadNotificationCount = (notifications = []) => {
  return notifications.filter((item) => !item.read).length;
};
