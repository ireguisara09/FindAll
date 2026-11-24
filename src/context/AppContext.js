
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRODUCTS } from '../data/products';
import { COUPONS } from '../theme';

// HU29: funciones del centro de notificaciones.
import {
  createOrderNotification,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from '../data/notificacion';

import {
  buildLines,
  checkStock,
  clampAllCarts,
  computeTotals,
  deliveryFrom,
  emptyUserData,
  generateOrderCode,
  initialState,
  normalizeCoupon,
  sanitizeState,
  unitsOf,
  validateProductForm,
  validateRating,
  validateRegister,
} from '../utils/logic';

const STORAGE_KEY = 'findall_state_v2';
const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

const BUYER_ONLY = [
  'cart',
  'checkout',
  'favorites',
  'history',
  'addresses',
  'notifications',
  'help', // HU32: centro de ayuda
];

const SELLER_ONLY = ['seller', 'seller-new'];
const EMPTY_DATA = emptyUserData();

// HU26: tarifas ficticias de envío por municipio.
const SHIPPING_RATES = {
  mosquera: { standard: 6000, express: 10000 },
  funza: { standard: 8000, express: 12000 },
  madrid: { standard: 10000, express: 14000 },
};

// HU26: tiempos estimados ficticios en días.
const SHIPPING_DAYS = {
  standard: 3,
  express: 1,
};

const normalizeMunicipality = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

// HU26: obtiene la tarifa y el tiempo de entrega.
const getShippingQuote = (municipio, method = 'standard') => {
  const normalized = normalizeMunicipality(municipio);
  const rates = SHIPPING_RATES[normalized];

  if (!rates) {
    return {
      available: false,
      cost: 0,
      days: 0,
      method,
      message: 'Todavía no tenemos cobertura en este municipio.',
    };
  }

  if (!['standard', 'express'].includes(method)) {
    method = 'standard';
  }

  return {
    available: true,
    cost: rates[method],
    days: SHIPPING_DAYS[method],
    method,
    message: 'Servicio de envío disponible.',
  };
};

// HU26: calcula la fecha estimada según el método seleccionado.
const deliveryFromDays = (isoDate, days) => {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

// Busca una variante por su identificador o por su etiqueta.
const findVariant = (product, selectedVariant) => {
  if (!product?.variants?.length || !selectedVariant) return null;

  if (typeof selectedVariant === 'object') {
    return product.variants.find(
      (variant) =>
        variant.id === selectedVariant.id ||
        variant.label === selectedVariant.label
    ) || null;
  }

  return product.variants.find(
    (variant) =>
      variant.id === selectedVariant ||
      variant.label === selectedVariant
  ) || null;
};

// Obtiene las unidades disponibles de una variante o producto.
const getStock = (product, variantId = null) => {
  if (!product) return 0;

  if (product.variants?.length) {
    const variant = findVariant(product, variantId);
    return variant ? Math.max(0, Number(variant.stock) || 0) : 0;
  }

  return Math.max(0, Number(product.stock) || 0);
};

// Descuenta el inventario según las líneas compradas.
const deductInventory = (currentProducts, orderLines) => {
  return currentProducts.map((product) => {
    const productLines = orderLines.filter(
      (line) => line.productId === product.id
    );

    if (productLines.length === 0) return product;

    if (product.variants?.length) {
      const nextVariants = product.variants.map((variant) => {
        const units = productLines
          .filter((line) => line.variantId === variant.id)
          .reduce((total, line) => total + line.qty, 0);

        return units > 0
          ? { ...variant, stock: Math.max(0, variant.stock - units) }
          : variant;
      });

      return {
        ...product,
        variants: nextVariants,
        stock: nextVariants.reduce(
          (total, variant) => total + Number(variant.stock || 0),
          0
        ),
      };
    }

    const units = productLines.reduce(
      (total, line) => total + line.qty,
      0
    );

    return {
      ...product,
      stock: Math.max(0, product.stock - units),
    };
  });
};

// HU28: devuelve al inventario las unidades de un pedido cancelado.
const restoreInventory = (currentProducts, orderItems) => {
  return currentProducts.map((product) => {
    const productItems = orderItems.filter(
      (item) => item.productId === product.id
    );

    if (productItems.length === 0) return product;

    if (product.variants?.length) {
      const nextVariants = product.variants.map((variant) => {
        const units = productItems
          .filter((item) => item.variantId === variant.id)
          .reduce(
            (total, item) => total + Number(item.qty || 0),
            0
          );

        return units > 0
          ? { ...variant, stock: Number(variant.stock || 0) + units }
          : variant;
      });

      return {
        ...product,
        variants: nextVariants,
        stock: nextVariants.reduce(
          (total, variant) => total + Number(variant.stock || 0),
          0
        ),
      };
    }

    const units = productItems.reduce(
      (total, item) => total + Number(item.qty || 0),
      0
    );

    return {
      ...product,
      stock: Number(product.stock || 0) + units,
    };
  });
};

// Normaliza texto para comparar direcciones.
const normalizeAddressText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

export function AppProvider({ children }) {
  const init = initialState(PRODUCTS);

  const [hydrated, setHydrated] = useState(false);
  const [products, setProducts] = useState(init.products);
  const [reviews, setReviews] = useState(init.reviews);
  const [buyers, setBuyers] = useState(init.buyers);
  const [sellers, setSellers] = useState(init.sellers);
  const [session, setSession] = useState(init.session);
  const [users, setUsers] = useState(init.users);
  const [toast, setToast] = useState(null);
  const [screen, setScreen] = useState('home');
  const [authPrompt, setAuthPrompt] = useState(null);

  // HU22: productos seleccionados para comparar.
  const [comparisonIds, setComparisonIds] = useState([]);

  // HU24: preguntas y respuestas de los productos.
  const [questions, setQuestions] = useState([]);

  // HU26: método de envío seleccionado.
  const [shippingMethod, setShippingMethod] = useState('standard');

  const notify = (message, type = 'success') =>
    setToast({ message, type, id: Date.now() + Math.random() });

  // ---------- HU20: cargar información al iniciar ----------
  useEffect(() => {
    (async () => {
      let state;
      let savedQuestions = [];

      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;

        state = sanitizeState(parsed, PRODUCTS);

        savedQuestions = Array.isArray(parsed?.questions)
          ? parsed.questions
          : [];
      } catch (error) {
        state = initialState(PRODUCTS);
        savedQuestions = [];
      }

      setProducts(state.products);
      setReviews(state.reviews);
      setBuyers(state.buyers);
      setSellers(state.sellers);
      setSession(state.session);
      setUsers(state.users);
      setQuestions(savedQuestions);

      if (state.session?.role === 'seller') {
        setScreen('seller');
      }

      setHydrated(true);
    })();
  }, []);

  // ---------- HU20: guardar cambios ----------
  useEffect(() => {
    if (!hydrated) return;

    const slimProducts = products.map(({ image, ...rest }) => rest);

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        products: slimProducts,
        reviews,
        buyers,
        sellers,
        session,
        users,
        questions,
      })
    ).catch(() => {});
  }, [
    hydrated,
    products,
    reviews,
    buyers,
    sellers,
    session,
    users,
    questions,
  ]);

  // ---------- Usuario actual ----------
  const user =
    session?.role === 'buyer'
      ? buyers.find((buyer) => buyer.email === session.email) || null
      : null;

  const seller =
    session?.role === 'seller'
      ? sellers.find((item) => item.email === session.email) || null
      : null;

  const role = user ? 'buyer' : seller ? 'seller' : 'guest';

  const data = (user && users[user.email]) || EMPTY_DATA;

  const {
    cart,
    favorites,
    orders,
    coupon,
    addresses = [],
    defaultAddressId = null,
    selectedAddressId = null,
    notifications = [],
    restockSubscriptions = [],
    supportRequests = [],
  } = data;

  // HU25: obtener la dirección principal.
  const defaultAddress =
    addresses.find(
      (address) => address.id === defaultAddressId
    ) || addresses[0] || null;

  // HU25: obtener la dirección seleccionada.
  const selectedAddress =
    addresses.find(
      (address) => address.id === selectedAddressId
    ) || defaultAddress || null;

  const updateData = (fn) => {
    if (!user) return;

    setUsers((previous) => ({
      ...previous,
      [user.email]: fn(previous[user.email] || emptyUserData()),
    }));
  };

  // ---------- Datos derivados ----------
  const lines = buildLines(cart, products);

  // HU26: calcular el envío según municipio y método.
  const shippingQuote = getShippingQuote(
    selectedAddress?.municipio,
    shippingMethod
  );

  const baseTotals = computeTotals(lines, coupon);

  const totals = {
    ...baseTotals,
    shipping: shippingQuote.available
      ? shippingQuote.cost
      : 0,
    total:
      baseTotals.subtotal -
      baseTotals.discount +
      (shippingQuote.available ? shippingQuote.cost : 0),
  };

  const getProduct = (id) =>
    products.find((product) => product.id === id);

  // HU22: productos completos seleccionados para comparar.
  const comparisonProducts = comparisonIds
    .map((id) => getProduct(id))
    .filter(Boolean);

  // ---------- HU22: comparación de productos ----------
  const toggleComparison = (productId) => {
    const product = getProduct(productId);

    if (!product) {
      notify('No se encontró el producto.', 'warn');
      return false;
    }

    if (comparisonIds.includes(productId)) {
      setComparisonIds((previous) =>
        previous.filter((id) => id !== productId)
      );

      notify('Producto eliminado de la comparación.', 'info');
      return true;
    }

    if (comparisonIds.length >= 3) {
      notify('Solo puedes comparar un máximo de 3 productos.', 'warn');
      return false;
    }

    setComparisonIds((previous) => [...previous, productId]);
    notify('Producto agregado a la comparación.');

    return true;
  };

  const removeFromComparison = (productId) => {
    setComparisonIds((previous) =>
      previous.filter((id) => id !== productId)
    );
  };

  const clearComparison = () => {
    setComparisonIds([]);
    notify('Comparación limpiada.', 'info');
  };

  // ---------- Navegación ----------
  const navigate = (target) => {
    if (BUYER_ONLY.includes(target) && role !== 'buyer') {
      if (role === 'seller') {
        notify('Esta sección es solo para compradores.', 'warn');
      } else {
        setAuthPrompt('Para ver esta sección necesitas una cuenta de comprador.');
      }

      return;
    }

    if (SELLER_ONLY.includes(target) && role !== 'seller') {
      setScreen('sellerLogin');
      return;
    }

    setScreen(target);
  };

  // ---------- Validación de comprador ----------
  const requireBuyer = (action) => {
    if (role === 'buyer') return true;

    if (role === 'seller') {
      notify(
        'Con una cuenta de vendedor no puedes comprar. Ingresa como comprador.',
        'warn'
      );
    } else {
      setAuthPrompt(`Para ${action} necesitas una cuenta de comprador.`);
    }

    return false;
  };

  // ======================================================
  // HU29: CENTRO DE NOTIFICACIONES
  // ======================================================

  const markAsRead = (notificationId) => {
    if (!requireBuyer('consultar notificaciones')) return;

    updateData((current) => ({
      ...current,
      notifications: markNotificationAsRead(
        current.notifications || [],
        notificationId
      ),
    }));
  };

  const markAllAsRead = () => {
    if (!requireBuyer('consultar notificaciones')) return;

    updateData((current) => ({
      ...current,
      notifications: markAllNotificationsAsRead(
        current.notifications || []
      ),
    }));
  };

  const unreadNotifications = getUnreadNotificationCount(
    notifications
  );

  // ======================================================
  // HU32: CENTRO DE AYUDA Y SOLICITUDES
  // ======================================================

  // El comprador crea una solicitud asociada a uno de sus pedidos.
  const createSupportRequest = (
    orderCode,
    reason,
    description
  ) => {
    if (!requireBuyer('crear una solicitud de ayuda')) {
      return {
        ok: false,
        message: 'Inicia sesión como comprador.',
      };
    }

    const cleanOrderCode = String(orderCode || '').trim();
    const cleanDescription = String(description || '').trim();

    const validReasons = ['Entrega', 'Producto', 'Otro'];

    // CA03: validar que se haya seleccionado un pedido.
    if (!cleanOrderCode) {
      return {
        ok: false,
        message: 'Selecciona el pedido relacionado con tu solicitud.',
      };
    }

    // Comprobar que el pedido pertenezca al comprador actual.
    const order = orders.find(
      (item) => String(item.code) === cleanOrderCode
    );

    if (!order) {
      return {
        ok: false,
        message: 'No se encontró el pedido seleccionado.',
      };
    }

    // CA01: validar el motivo de la solicitud.
    if (!validReasons.includes(reason)) {
      return {
        ok: false,
        message: 'Selecciona un motivo válido para tu solicitud.',
      };
    }

    // CA02 y CA03: mínimo 15 caracteres.
    if (cleanDescription.length < 15) {
      return {
        ok: false,
        message: 'La descripción debe tener al menos 15 caracteres.',
      };
    }

    // Generar un número de caso único.
    const existingCases = supportRequests.map(
      (request) => request.caseNumber
    );

    let caseNumber;

    do {
      caseNumber = `FA-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)
        .toUpperCase()}`;
    } while (existingCases.includes(caseNumber));

    const now = new Date().toISOString();

    const newRequest = {
      id: `support-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      caseNumber,
      orderCode: cleanOrderCode,
      reason,
      description: cleanDescription,
      status: 'Abierto',
      createdAt: now,
      answer: null,
      answeredAt: null,
    };

    updateData((current) => ({
      ...current,
      supportRequests: [
        newRequest,
        ...(current.supportRequests || []),
      ],
    }));

    notify(`Solicitud creada correctamente. Caso: ${caseNumber}`);

    return {
      ok: true,
      request: newRequest,
      message: 'Tu solicitud de ayuda fue creada correctamente.',
    };
  };

  // CA04: simular una respuesta para una solicitud abierta.
  const simulateSupportResponse = (requestId) => {
    if (!requireBuyer('consultar tus solicitudes de ayuda')) {
      return false;
    }

    const request = supportRequests.find(
      (item) => item.id === requestId
    );

    if (!request) {
      notify('No se encontró la solicitud.', 'warn');
      return false;
    }

    if (request.status !== 'Abierto') {
      notify('Esta solicitud ya fue respondida.', 'info');
      return false;
    }

    const now = new Date().toISOString();

    const simulatedAnswer =
      'Hemos recibido tu solicitud. Nuestro equipo de atención revisó el caso y está trabajando para darte una solución. Gracias por comunicarte con FindAll.';

    updateData((current) => ({
      ...current,
      supportRequests: (current.supportRequests || []).map(
        (item) =>
          item.id === requestId
            ? {
                ...item,
                status: 'Respondido',
                answer: simulatedAnswer,
                answeredAt: now,
              }
            : item
      ),
    }));

    notify('Se ha generado una respuesta simulada.');

    return true;
  };

  // ======================================================
  // HU30: AVISOS DE REPOSICIÓN
  // ======================================================

  // El comprador se suscribe a un producto o variante agotada.
  const subscribeToRestock = (productId, variantId = null) => {
    if (!requireBuyer('solicitar avisos de reposición')) {
      return false;
    }

    const product = getProduct(productId);

    if (!product) {
      notify('No se encontró el producto.', 'warn');
      return false;
    }

    const hasVariants =
      Array.isArray(product.variants) &&
      product.variants.length > 0;

    let variant = null;

    if (hasVariants) {
      if (!variantId) {
        notify('Selecciona una variante para recibir el aviso.', 'warn');
        return false;
      }

      variant = findVariant(product, variantId);

      if (!variant) {
        notify('No se encontró la variante seleccionada.', 'warn');
        return false;
      }
    } else if (variantId != null) {
      notify('Este producto no tiene variantes.', 'warn');
      return false;
    }

    const currentStock = getStock(product, variant?.id ?? null);

    if (currentStock > 0) {
      notify('Este producto ya está disponible.', 'info');
      return false;
    }

    const alreadySubscribed = restockSubscriptions.some(
      (subscription) =>
        subscription.productId === product.id &&
        (subscription.variantId ?? null) === (variant?.id ?? null)
    );

    if (alreadySubscribed) {
      notify('Ya tienes un aviso registrado para este producto.', 'info');
      return false;
    }

    const subscription = {
      id: `restock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      productId: product.id,
      productName: product.name,
      variantId: variant?.id ?? null,
      variantLabel: variant?.label ?? null,
      createdAt: new Date().toISOString(),
    };

    updateData((current) => ({
      ...current,
      restockSubscriptions: [
        ...(current.restockSubscriptions || []),
        subscription,
      ],
    }));

    notify('Te avisaremos cuando vuelva a estar disponible.');
    return true;
  };

  // El comprador cancela un aviso registrado.
  const cancelRestockSubscription = (subscriptionId) => {
    if (!requireBuyer('administrar avisos de reposición')) {
      return false;
    }

    const exists = restockSubscriptions.some(
      (subscription) => subscription.id === subscriptionId
    );

    if (!exists) {
      notify('No se encontró el aviso que deseas cancelar.', 'warn');
      return false;
    }

    updateData((current) => ({
      ...current,
      restockSubscriptions: (
        current.restockSubscriptions || []
      ).filter(
        (subscription) => subscription.id !== subscriptionId
      ),
    }));

    notify('Aviso de reposición cancelado.', 'info');
    return true;
  };

  // El vendedor simula la reposición de un producto o variante.
  // Se notificará a todos los compradores que estén suscritos.
  const simulateRestock = (
    productId,
    variantId = null,
    quantity = 5
  ) => {
    if (!seller) {
      notify('Solo un vendedor puede simular la reposición.', 'warn');
      return false;
    }

    const product = getProduct(productId);

    if (!product) {
      notify('No se encontró el producto.', 'warn');
      return false;
    }

    const amount = Number(quantity);

    if (!Number.isInteger(amount) || amount < 1) {
      notify('La cantidad de reposición debe ser mayor que cero.', 'warn');
      return false;
    }

    const hasVariants =
      Array.isArray(product.variants) &&
      product.variants.length > 0;

    let variant = null;

    if (hasVariants) {
      if (!variantId) {
        notify('Selecciona la variante que deseas reponer.', 'warn');
        return false;
      }

      variant = findVariant(product, variantId);

      if (!variant) {
        notify('No se encontró la variante seleccionada.', 'warn');
        return false;
      }
    } else if (variantId != null) {
      notify('Este producto no tiene variantes.', 'warn');
      return false;
    }

    const currentStock = getStock(product, variant?.id ?? null);

    if (currentStock > 0) {
      notify('Esta opción ya tiene unidades disponibles.', 'info');
      return false;
    }

    const now = new Date().toISOString();

    const nextProducts = products.map((item) => {
      if (item.id !== product.id) return item;

      if (hasVariants) {
        const nextVariants = item.variants.map((itemVariant) =>
          itemVariant.id === variant.id
            ? {
                ...itemVariant,
                stock: Number(itemVariant.stock || 0) + amount,
              }
            : itemVariant
        );

        return {
          ...item,
          variants: nextVariants,
          stock: nextVariants.reduce(
            (total, itemVariant) =>
              total + Number(itemVariant.stock || 0),
            0
          ),
        };
      }

      return {
        ...item,
        stock: Number(item.stock || 0) + amount,
      };
    });

    setProducts(nextProducts);

    // Notificar a todos los compradores suscritos.
    setUsers((previous) => {
      const nextUsers = { ...previous };

      Object.keys(previous).forEach((email) => {
        const current = previous[email] || emptyUserData();

        const matchingSubscriptions = (
          current.restockSubscriptions || []
        ).filter(
          (subscription) =>
            subscription.productId === product.id &&
            (subscription.variantId ?? null) ===
              (variant?.id ?? null)
        );

        if (matchingSubscriptions.length === 0) return;

        let nextNotifications = current.notifications || [];

        matchingSubscriptions.forEach((subscription) => {
          const notification = {
            id: `restock-notification-${subscription.id}-${Date.now()}`,
            type: 'restock',
            productId: product.id,
            productName: product.name,
            variantId: variant?.id ?? null,
            variantLabel: variant?.label ?? null,
            title: '¡Producto disponible!',
            message: variant
              ? `${product.name} (${variant.label}) vuelve a estar disponible.`
              : `${product.name} vuelve a estar disponible.`,
            createdAt: now,
            read: false,
          };

          nextNotifications = addNotification(
            nextNotifications,
            notification
          );
        });

        nextUsers[email] = {
          ...current,
          notifications: nextNotifications,
          restockSubscriptions: (
            current.restockSubscriptions || []
          ).filter(
            (subscription) =>
              !matchingSubscriptions.some(
                (matching) => matching.id === subscription.id
              )
          ),
        };
      });

      return nextUsers;
    });

    notify(
      `Se repusieron ${amount} unidades de ${product.name}. Se notificó a los compradores suscritos.`
    );

    return true;
  };

  // ---------- Cuentas ----------
  const register = (kind, form) => {
    const list = kind === 'seller' ? sellers : buyers;
    const validation = validateRegister(form, list);

    if (!validation.ok) {
      return { ok: false, errors: validation.errors };
    }

    if (kind === 'seller') {
      setSellers((previous) => [...previous, validation.clean]);
    } else {
      setBuyers((previous) => [...previous, validation.clean]);

      setUsers((previous) => ({
        ...previous,
        [validation.clean.email]: emptyUserData(),
      }));
    }

    setSession({ role: kind, email: validation.clean.email });
    setScreen(kind === 'seller' ? 'seller' : 'home');

    notify(
      `¡Cuenta creada! Bienvenido a FindAll, ${
        validation.clean.name.split(' ')[0]
      }.`
    );

    return { ok: true };
  };

  const login = (kind, email, password) => {
    const mail = String(email || '').trim().toLowerCase();

    if (!mail || !password) {
      return {
        ok: false,
        message: 'Ingresa tu correo y tu contraseña.',
      };
    }

    const list = kind === 'seller' ? sellers : buyers;

    const account = list.find(
      (item) => item.email === mail && item.password === password
    );

    if (!account) {
      return {
        ok: false,
        message: 'Correo o contraseña incorrectos.',
      };
    }

    setSession({ role: kind, email: account.email });
    setScreen(kind === 'seller' ? 'seller' : 'home');

    notify(`Hola de nuevo, ${account.name.split(' ')[0]}.`);

    return { ok: true };
  };

  const logout = () => {
    setSession(null);
    setScreen('home');
    setShippingMethod('standard');
    notify('Sesión cerrada.', 'info');
  };

  // ---------- Favoritos (HU08) ----------
  const toggleFavorite = (id) => {
    if (!requireBuyer('guardar favoritos')) return;

    const isFavorite = favorites.includes(id);

    updateData((current) => ({
      ...current,
      favorites: isFavorite
        ? current.favorites.filter((item) => item !== id)
        : [...current.favorites, id],
    }));

    const product = getProduct(id);

    notify(
      isFavorite
        ? `Quitado de favoritos: ${product?.name ?? ''}`
        : `Agregado a favoritos: ${product?.name ?? ''}`,
      'info'
    );
  };

  // ---------- HU25: LIBRETA DE DIRECCIONES ----------
  const saveAddress = (form, editId = null) => {
    if (!requireBuyer('guardar direcciones')) {
      return {
        ok: false,
        message: 'Inicia sesión como comprador.',
      };
    }

    const alias = String(form?.alias || '').trim();
    const municipio = String(form?.municipio || '').trim();
    const reference = String(form?.reference || '').trim();

    const errors = {};

    if (!alias) {
      errors.alias = 'Ingresa un alias para la dirección.';
    }

    if (!municipio) {
      errors.municipio = 'Selecciona o escribe el municipio.';
    }

    if (!reference) {
      errors.reference = 'Ingresa la dirección o referencia de entrega.';
    }

    if (Object.keys(errors).length > 0) {
      return {
        ok: false,
        errors,
        message: 'Completa todos los campos de la dirección.',
      };
    }

    const duplicate = addresses.find(
      (address) =>
        address.id !== editId &&
        normalizeAddressText(address.municipio) ===
          normalizeAddressText(municipio) &&
        normalizeAddressText(address.reference) ===
          normalizeAddressText(reference)
    );

    if (duplicate) {
      return {
        ok: false,
        message: 'Esta dirección ya está registrada.',
      };
    }

    if (editId && !addresses.some((address) => address.id === editId)) {
      return {
        ok: false,
        message: 'No se encontró la dirección que deseas editar.',
      };
    }

    const addressId =
      editId ||
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const newAddress = {
      id: addressId,
      alias,
      municipio,
      reference,
    };

    updateData((current) => {
      const currentAddresses = current.addresses || [];
      const exists = currentAddresses.some(
        (address) => address.id === addressId
      );

      const nextAddresses = exists
        ? currentAddresses.map((address) =>
            address.id === addressId ? newAddress : address
          )
        : [...currentAddresses, newAddress];

      const isFirstAddress = currentAddresses.length === 0;

      return {
        ...current,
        addresses: nextAddresses,
        defaultAddressId: isFirstAddress
          ? addressId
          : current.defaultAddressId,
        selectedAddressId: isFirstAddress
          ? addressId
          : current.selectedAddressId,
      };
    });

    notify(
      editId
        ? 'Dirección actualizada correctamente.'
        : 'Dirección guardada correctamente.'
    );

    return {
      ok: true,
      address: newAddress,
    };
  };

  const deleteAddress = (addressId) => {
    if (!requireBuyer('administrar direcciones')) return false;

    const exists = addresses.some(
      (address) => address.id === addressId
    );

    if (!exists) {
      notify('No se encontró la dirección.', 'warn');
      return false;
    }

    updateData((current) => {
      const nextAddresses = (current.addresses || []).filter(
        (address) => address.id !== addressId
      );

      const nextDefaultId =
        current.defaultAddressId === addressId
          ? nextAddresses[0]?.id ?? null
          : current.defaultAddressId;

      const nextSelectedId =
        current.selectedAddressId === addressId
          ? nextDefaultId || nextAddresses[0]?.id || null
          : current.selectedAddressId;

      return {
        ...current,
        addresses: nextAddresses,
        defaultAddressId: nextDefaultId,
        selectedAddressId: nextSelectedId,
      };
    });

    notify('Dirección eliminada.', 'info');
    return true;
  };

  const setDefaultAddress = (addressId) => {
    if (!requireBuyer('administrar direcciones')) return false;

    const exists = addresses.some(
      (address) => address.id === addressId
    );

    if (!exists) {
      notify('No se encontró la dirección.', 'warn');
      return false;
    }

    updateData((current) => ({
      ...current,
      defaultAddressId: addressId,
      selectedAddressId: addressId,
    }));

    notify('Dirección principal actualizada.');
    return true;
  };

  const selectAddress = (addressId) => {
    if (!requireBuyer('seleccionar una dirección')) return false;

    const exists = addresses.some(
      (address) => address.id === addressId
    );

    if (!exists) {
      notify('Selecciona una dirección válida.', 'warn');
      return false;
    }

    updateData((current) => ({
      ...current,
      selectedAddressId: addressId,
    }));

    notify('Dirección seleccionada para tu pedido.');
    return true;
  };

  // ---------- Carrito (HU09, HU10, HU21) ----------
  const addToCart = (product, selectedVariant = null, qty = 1) => {
    if (!requireBuyer('agregar productos al carrito')) return false;

    const currentProduct = product ? getProduct(product.id) : null;
    const quantity = Math.floor(Number(qty));

    if (!currentProduct || !Number.isFinite(quantity) || quantity < 1) {
      notify('No se pudo agregar el producto. Verifica la cantidad.', 'warn');
      return false;
    }

    let variant = null;

    if (currentProduct.variants?.length) {
      variant = findVariant(currentProduct, selectedVariant);

      if (!variant) {
        notify('Selecciona una variante antes de agregar el producto.', 'warn');
        return false;
      }
    }

    const variantId = variant?.id ?? null;
    const availableStock = getStock(currentProduct, variantId);

    if (availableStock <= 0) {
      notify('Esta variante está agotada.', 'warn');
      return false;
    }

    const inCart = unitsOf(cart, currentProduct.id, variantId);

    if (inCart + quantity > availableStock) {
      notify(
        `Solo quedan ${availableStock - inCart} unidades disponibles de esta variante.`,
        'warn'
      );
      return false;
    }

    const finalSize = variant
      ? variant.label
      : currentProduct.sizes
        ? selectedVariant || currentProduct.sizes[1] || currentProduct.sizes[0]
        : null;

    updateData((current) => {
      const index = current.cart.findIndex(
        (line) =>
          line.productId === currentProduct.id &&
          (line.variantId ?? null) === variantId &&
          line.size === finalSize
      );

      const nextCart =
        index >= 0
          ? current.cart.map((line, i) =>
              i === index
                ? { ...line, qty: line.qty + quantity }
                : line
            )
          : [
              ...current.cart,
              {
                productId: currentProduct.id,
                variantId,
                variantLabel: variant?.label ?? null,
                size: finalSize,
                qty: quantity,
              },
            ];

      return { ...current, cart: nextCart };
    });

    notify(`Agregado al carrito: ${currentProduct.name}`);

    return true;
  };

  const removeLine = (index) => {
    const line = cart[index];
    if (!line) return;

    updateData((current) => ({
      ...current,
      cart: current.cart.filter((_, i) => i !== index),
    }));

    notify(
      `Eliminado del carrito: ${
        getProduct(line.productId)?.name ?? 'producto'
      }`,
      'info'
    );
  };

  const changeQty = (index, delta) => {
    const line = cart[index];
    if (!line) return;

    const product = getProduct(line.productId);
    if (!product) return;

    if (delta > 0) {
      const availableStock = getStock(product, line.variantId);
      const unitsInCart = unitsOf(cart, line.productId, line.variantId);

      if (unitsInCart + 1 > availableStock) {
        notify(
          'No hay más unidades disponibles de esta variante.',
          'warn'
        );
        return;
      }

      updateData((current) => ({
        ...current,
        cart: current.cart.map((item, i) =>
          i === index ? { ...item, qty: item.qty + 1 } : item
        ),
      }));
    } else if (line.qty > 1) {
      updateData((current) => ({
        ...current,
        cart: current.cart.map((item, i) =>
          i === index ? { ...item, qty: item.qty - 1 } : item
        ),
      }));
    } else {
      removeLine(index);
    }
  };

  // ---------- Cupón (HU17) ----------
  const applyCoupon = (code) => {
    const normalized = normalizeCoupon(code);

    if (!normalized) {
      return { ok: false, message: 'Escribe un código de cupón.' };
    }

    if (lines.length === 0) {
      return {
        ok: false,
        message: 'Agrega productos al carrito antes de aplicar un cupón.',
      };
    }

    if (!COUPONS[normalized]) {
      return {
        ok: false,
        message: 'Cupón no válido. El total no cambió.',
      };
    }

    updateData((current) => ({
      ...current,
      coupon: normalized,
    }));

    return {
      ok: true,
      message: `Se ha descontado el ${Math.round(
        COUPONS[normalized] * 100
      )}% al subtotal de su compra`,
    };
  };

  const removeCoupon = () => {
    updateData((current) => ({ ...current, coupon: null }));
    notify('Cupón quitado.', 'info');
  };

  // ---------- Confirmar pedido (HU13, HU14, HU15, HU21, HU25, HU26, HU27, HU29) ----------
  const confirmOrder = (buyer) => {
    if (!user) {
      return { ok: false, message: 'Inicia sesión para comprar.' };
    }

    if (lines.length === 0) {
      return { ok: false, message: 'Tu carrito está vacío.' };
    }

    if (!selectedAddress) {
      return {
        ok: false,
        message: 'Agrega y selecciona una dirección de entrega antes de confirmar.',
      };
    }

    if (!shippingQuote.available) {
      return {
        ok: false,
        message: shippingQuote.message,
      };
    }

    const stockValidation = checkStock(lines, products);

    if (!stockValidation.ok) {
      return { ok: false, message: stockValidation.message };
    }

    const allCodes = Object.values(users).flatMap((item) =>
      (item.orders || []).map((order) => order.code)
    );

    const now = new Date().toISOString();

    const addressSnapshot = {
      id: selectedAddress.id,
      alias: selectedAddress.alias,
      municipio: selectedAddress.municipio,
      reference: selectedAddress.reference,
    };

    const order = {
      code: generateOrderCode(allCodes),
      date: now,
      deliveryDate: deliveryFromDays(now, shippingQuote.days),
      status: 'Confirmado',
      statusHistory: [
        {
          status: 'Confirmado',
          date: now,
          description: 'Tu pedido fue confirmado correctamente.',
        },
      ],
      buyer: {
        ...buyer,
        municipio: selectedAddress.municipio,
        address: selectedAddress.reference,
      },
      shippingAddress: addressSnapshot,
      shippingMethod: shippingMethod,
      shippingMethodLabel:
        shippingMethod === 'express' ? 'Exprés' : 'Estándar',
      shippingDays: shippingQuote.days,
      items: lines.map((line) => ({
        productId: line.productId,
        name: line.product.name,
        brand: line.product.brand,
        category: line.product.category,
        variantId: line.variantId ?? null,
        variantLabel: line.variantLabel ?? line.variant?.label ?? null,
        size: line.size,
        qty: line.qty,
        unitPrice:
          line.unitPrice ??
          line.variant?.price ??
          line.product.price,
      })),
      coupon,
      subtotal: totals.subtotal,
      discount: totals.discount,
      shipping: shippingQuote.cost,
      total: totals.total,
    };

    const nextProducts = deductInventory(products, lines);

    const orderNotification = createOrderNotification({
      orderId: order.code,
      orderCode: order.code,
      status: 'Confirmado',
    });

    setProducts(nextProducts);

    setUsers((previous) => {
      const current = previous[user.email] || emptyUserData();

      const next = {
        ...previous,
        [user.email]: {
          ...current,
          orders: [order, ...current.orders],
          cart: [],
          coupon: null,
          notifications: addNotification(
            current.notifications || [],
            orderNotification
          ),
        },
      };

      return clampAllCarts(next, nextProducts);
    });

    notify('¡Tu pedido ha sido confirmado!');

    return { ok: true, order };
  };

  // ---------- HU27: SEGUIMIENTO DE PEDIDOS + HU29 ----------
  const advanceOrder = (orderCode) => {
    const order = orders.find((item) => item.code === orderCode);

    if (!order) {
      notify('No se encontró el pedido.', 'warn');
      return false;
    }

    const statusFlow = [
      'Confirmado',
      'Preparando',
      'En camino',
      'Entregado',
    ];

    const currentIndex = statusFlow.indexOf(order.status);

    if (currentIndex === -1 || currentIndex >= statusFlow.length - 1) {
      notify('Este pedido ya no puede avanzar.', 'warn');
      return false;
    }

    const nextStatus = statusFlow[currentIndex + 1];
    const now = new Date().toISOString();

    const descriptions = {
      Preparando: 'El vendedor está preparando tu pedido.',
      'En camino': 'Tu pedido ha sido enviado y está en camino.',
      Entregado: 'Tu pedido ha sido entregado correctamente.',
    };

    const orderNotification = createOrderNotification({
      orderId: order.code,
      orderCode: order.code,
      status: nextStatus,
    });

    updateData((current) => ({
      ...current,
      orders: current.orders.map((item) => {
        if (item.code !== orderCode) return item;

        const previousHistory = Array.isArray(item.statusHistory)
          ? item.statusHistory
          : [
              {
                status: 'Confirmado',
                date: item.date,
                description: 'Tu pedido fue confirmado correctamente.',
              },
            ];

        return {
          ...item,
          status: nextStatus,
          statusHistory: [
            ...previousHistory,
            {
              status: nextStatus,
              date: now,
              description: descriptions[nextStatus],
            },
          ],
        };
      }),
      notifications: addNotification(
        current.notifications || [],
        orderNotification
      ),
    }));

    notify(`Tu pedido ahora está: ${nextStatus}`);

    return true;
  };

  // ---------- HU28: CANCELACIÓN DE PEDIDOS + HU29 ----------
  const cancelOrder = (orderCode) => {
    const order = orders.find((item) => item.code === orderCode);

    if (!order) {
      notify('No se encontró el pedido.', 'warn');
      return false;
    }

    const allowedStatuses = ['Confirmado', 'Preparando'];

    if (!allowedStatuses.includes(order.status)) {
      notify(
        'No puedes cancelar este pedido porque ya fue enviado o finalizado.',
        'warn'
      );
      return false;
    }

    if (order.status === 'Cancelado') {
      notify('Este pedido ya fue cancelado.', 'warn');
      return false;
    }

    const now = new Date().toISOString();

    const orderNotification = createOrderNotification({
      orderId: order.code,
      orderCode: order.code,
      status: 'Cancelado',
    });

    const nextProducts = restoreInventory(
      products,
      order.items || []
    );

    setProducts(nextProducts);

    updateData((current) => ({
      ...current,
      orders: current.orders.map((item) => {
        if (item.code !== orderCode) return item;
        if (item.status === 'Cancelado') return item;

        const previousHistory = Array.isArray(item.statusHistory)
          ? item.statusHistory
          : [
              {
                status: item.status,
                date: item.date,
                description: 'Estado inicial del pedido.',
              },
            ];

        return {
          ...item,
          status: 'Cancelado',
          cancelledAt: now,
          statusHistory: [
            ...previousHistory,
            {
              status: 'Cancelado',
              date: now,
              description:
                'El pedido fue cancelado. Las unidades fueron devueltas al inventario.',
            },
          ],
        };
      }),
      notifications: addNotification(
        current.notifications || [],
        orderNotification
      ),
    }));

    notify('Pedido cancelado. El inventario ha sido actualizado.');

    return true;
  };

  // ---------- Reseñas (HU19) ----------
  const addReview = (productId, value) => {
    if (!requireBuyer('calificar productos')) return false;

    const validation = validateRating(value);

    if (!validation.ok) {
      notify(validation.message, 'error');
      return false;
    }

    setReviews((previous) => ({
      ...previous,
      [productId]: [
        ...(previous[productId] || []),
        validation.value,
      ],
    }));

    notify('¡Gracias por tu valoración!');

    return true;
  };

  // ---------- Preguntas de productos (HU24) ----------
  const addQuestion = (productId, text) => {
    const cleanText = String(text || '').trim();

    if (cleanText.length < 10) {
      notify(
        'La pregunta debe tener al menos 10 caracteres.',
        'warn'
      );
      return false;
    }

    const product = getProduct(productId);

    if (!product) {
      notify('No se encontró el producto.', 'warn');
      return false;
    }

    const newQuestion = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      productId,
      text: cleanText,
      date: new Date().toISOString(),
      status: 'Pendiente',
      answer: null,
      answeredAt: null,
    };

    setQuestions((previous) => [
      newQuestion,
      ...previous,
    ]);

    notify('Tu pregunta se agregó correctamente.');

    return true;
  };

  const simulateAnswer = (questionId) => {
    const pendingQuestion = questions.find(
      (question) =>
        question.id === questionId &&
        question.status === 'Pendiente'
    );

    if (!pendingQuestion) {
      notify(
        'Esta pregunta ya fue respondida o no existe.',
        'warn'
      );
      return false;
    }

    setQuestions((previous) =>
      previous.map((question) =>
        question.id === questionId
          ? {
              ...question,
              status: 'Respondida',
              answer:
                '¡Gracias por tu interés! Esta es una respuesta simulada para demostrar el funcionamiento de FindAll.',
              answeredAt: new Date().toISOString(),
            }
          : question
      )
    );

    notify('Se generó una respuesta simulada.');

    return true;
  };

  // ---------- Panel de vendedor (HU18) ----------
  const saveProduct = (form, editId = null) => {
    if (!seller) {
      return {
        ok: false,
        errors: { name: 'Inicia sesión como vendedor.' },
      };
    }

    const validation = validateProductForm(form);

    if (!validation.ok) {
      return { ok: false, errors: validation.errors };
    }

    const clean = {
      ...validation.clean,
      brand: validation.clean.brand || seller.name,
    };

    if (editId != null) {
      const target = products.find((product) => product.id === editId);

      if (!target || (target.owner && target.owner !== seller.email)) {
        return {
          ok: false,
          errors: { name: 'No puedes editar este producto.' },
        };
      }

      const nextProducts = products.map((product) =>
        product.id === editId
          ? { ...product, ...clean }
          : product
      );

      setProducts(nextProducts);
      setUsers((previous) => clampAllCarts(previous, nextProducts));

      notify('Producto actualizado.');
    } else {
      const id = Math.max(0, ...products.map((product) => product.id)) + 1;

      setProducts((previous) => [
        ...previous,
        {
          id,
          ...clean,
          owner: seller.email,
          image: null,
          sizes: null,
        },
      ]);

      notify('Producto creado.');
    }

    return { ok: true };
  };

  return (
    <AppContext.Provider
      value={{
        hydrated,
        screen,
        navigate,
        role,
        user,
        seller,
        register,
        login,
        logout,
        authPrompt,
        closeAuthPrompt: () => setAuthPrompt(null),

        products,
        getProduct,

        comparisonIds,
        comparisonProducts,
        toggleComparison,
        removeFromComparison,
        clearComparison,

        favorites,
        toggleFavorite,

        cart,
        lines,
        totals,
        coupon,
        addToCart,
        changeQty,
        removeLine,
        applyCoupon,
        removeCoupon,

        orders,
        confirmOrder,
        advanceOrder,
        cancelOrder,

        // HU29: centro de notificaciones.
        notifications,
        unreadNotifications,
        markAsRead,
        markAllAsRead,

        // HU30: avisos de reposición.
        restockSubscriptions,
        subscribeToRestock,
        cancelRestockSubscription,
        simulateRestock,

        // HU32: centro de ayuda y solicitudes.
        supportRequests,
        createSupportRequest,
        simulateSupportResponse,

        reviews,
        addReview,

        questions,
        addQuestion,
        simulateAnswer,

        // HU25: libreta de direcciones.
        addresses,
        defaultAddressId,
        selectedAddressId,
        defaultAddress,
        selectedAddress,
        saveAddress,
        deleteAddress,
        setDefaultAddress,
        selectAddress,

        // HU26: estimador de envíos.
        shippingMethod,
        setShippingMethod,
        shippingQuote,

        saveProduct,

        toast,
        notify,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
