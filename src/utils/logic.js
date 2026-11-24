
// ======================================================
// FINDALL - MARKETPLACE 2.0
// Lógica de negocio pura (sin React)
// HU21: variantes e inventario por variante
// HU25: libreta de direcciones
// HU29: persistencia de notificaciones
// HU30: avisos de reposición
// HU32: centro de ayuda y solicitudes
// ======================================================

import {
  PRODUCT_CATEGORIES,
  SHIPPING_COST,
  FREE_SHIPPING_FROM,
  COUPONS,
  DELIVERY_DAYS,
} from '../theme';

import { INITIAL_REVIEWS } from '../data/products';

// ======================================================
// DATOS INICIALES
// ======================================================

export const emptyUserData = () => ({
  cart: [],
  favorites: [],
  orders: [],
  coupon: null,
  addresses: [],
  defaultAddressId: null,
  selectedAddressId: null,
  notifications: [],
  restockSubscriptions: [],
  supportRequests: [],
});

export const EMAIL_RE = /^\S+@\S+\.\S+$/;

// ======================================================
// PRODUCTOS E INVENTARIO (HU21)
// ======================================================

export const getVariant = (product, variantId) => {
  if (!product || !variantId || !Array.isArray(product.variants)) {
    return null;
  }

  return product.variants.find(
    (variant) => variant.id === variantId
  ) || null;
};

export const calculateProductStock = (product) => {
  if (!product) return 0;

  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants.reduce(
      (total, variant) =>
        total + Math.max(0, Math.floor(Number(variant.stock) || 0)),
      0
    );
  }

  return Math.max(0, Math.floor(Number(product.stock) || 0));
};

export const getAvailableStock = (product, variantId = null) => {
  if (!product) return 0;

  if (Array.isArray(product.variants) && product.variants.length > 0) {
    if (!variantId) return 0;
    return getVariant(product, variantId)?.stock ?? 0;
  }

  return Math.max(0, Number(product.stock) || 0);
};

export const getUnitPrice = (product, variantId = null) => {
  if (!product) return 0;

  const variant = getVariant(product, variantId);
  return Number(variant?.price ?? product.price) || 0;
};

// ======================================================
// CARRITO (HU09 - HU21)
// ======================================================

export const unitsOf = (cart, productId, variantId = null) =>
  (Array.isArray(cart) ? cart : []).reduce((total, line) => {
    const sameProduct =
      Number(line.productId) === Number(productId);

    const sameVariant =
      variantId == null || line.variantId === variantId;

    return sameProduct && sameVariant
      ? total + (Number(line.qty) || 0)
      : total;
  }, 0);

export const buildLines = (cart, products) =>
  (Array.isArray(cart) ? cart : [])
    .map((line) => {
      const product = products.find(
        (item) => item.id === line.productId
      );

      if (!product) return null;

      const hasVariants =
        Array.isArray(product.variants) &&
        product.variants.length > 0;

      const variant = hasVariants
        ? getVariant(product, line.variantId)
        : null;

      if (hasVariants && !variant) return null;

      return {
        ...line,
        product,
        variant,
        unitPrice: getUnitPrice(product, line.variantId),
        variantId: variant?.id ?? null,
      };
    })
    .filter(Boolean);

export const clampCart = (cart, products) => {
  const used = new Map();
  const result = [];

  (Array.isArray(cart) ? cart : []).forEach((line) => {
    const product = products.find(
      (item) => item.id === line.productId
    );

    if (!product) return;

    const hasVariants =
      Array.isArray(product.variants) &&
      product.variants.length > 0;

    const variant = hasVariants
      ? getVariant(product, line.variantId)
      : null;

    if (hasVariants && !variant) return;

    const key = hasVariants
      ? `${product.id}:${variant.id}`
      : `${product.id}:simple`;

    const available = Math.max(
      0,
      getAvailableStock(product, variant?.id) -
        (used.get(key) || 0)
    );

    const requested = Math.max(
      0,
      Math.floor(Number(line.qty) || 0)
    );

    const qty = Math.min(requested, available);

    if (qty > 0) {
      used.set(key, (used.get(key) || 0) + qty);

      result.push({
        productId: product.id,
        variantId: variant?.id ?? null,
        size: variant?.size ?? line.size ?? null,
        qty,
      });
    }
  });

  return result;
};

export const clampAllCarts = (users, products) => {
  const result = {};

  Object.keys(users || {}).forEach((email) => {
    result[email] = {
      ...users[email],
      cart: clampCart(users[email]?.cart, products),
    };
  });

  return result;
};

// ======================================================
// ACTUALIZACIÓN DEL INVENTARIO
// ======================================================

export const updateInventory = (products, lines, direction = -1) => {
  const sign = direction < 0 ? -1 : 1;
  const quantities = new Map();

  (Array.isArray(lines) ? lines : []).forEach((line) => {
    const key =
      `${line.productId}:${line.variantId || 'simple'}`;

    quantities.set(
      key,
      (quantities.get(key) || 0) +
        Math.max(0, Number(line.qty) || 0)
    );
  });

  return products.map((product) => {
    const hasVariants =
      Array.isArray(product.variants) &&
      product.variants.length > 0;

    if (hasVariants) {
      const variants = product.variants.map((variant) => {
        const amount =
          quantities.get(`${product.id}:${variant.id}`) || 0;

        return {
          ...variant,
          stock: Math.max(
            0,
            Number(variant.stock || 0) + sign * amount
          ),
        };
      });

      return {
        ...product,
        variants,
        stock: variants.reduce(
          (sum, variant) => sum + variant.stock,
          0
        ),
      };
    }

    const amount =
      quantities.get(`${product.id}:simple`) || 0;

    return amount
      ? {
          ...product,
          stock: Math.max(
            0,
            Number(product.stock || 0) + sign * amount
          ),
        }
      : product;
  });
};

export const deductStock = (products, lines) =>
  updateInventory(products, lines, -1);

export const restoreStock = (products, lines) =>
  updateInventory(products, lines, 1);

// ======================================================
// TOTALES Y DESCUENTOS
// ======================================================

export const normalizeCoupon = (coupon) =>
  String(coupon || '').trim().toUpperCase();

export function computeTotals(lines, couponCode) {
  const subtotal = lines.reduce(
    (total, line) =>
      total +
      getUnitPrice(line.product, line.variantId) * line.qty,
    0
  );

  const count = lines.reduce(
    (total, line) => total + line.qty,
    0
  );

  const rate =
    couponCode && COUPONS[couponCode]
      ? COUPONS[couponCode]
      : 0;

  const discount =
    subtotal > 0
      ? Math.min(subtotal, Math.round(subtotal * rate))
      : 0;

  const shipping =
    subtotal === 0
      ? 0
      : subtotal >= FREE_SHIPPING_FROM
        ? 0
        : SHIPPING_COST;

  return {
    subtotal,
    discount,
    shipping,
    total: Math.max(0, subtotal - discount + shipping),
    count,
  };
}

// ======================================================
// VALIDACIÓN DE STOCK
// ======================================================

export function checkStock(lines, products) {
  const required = new Map();

  for (const line of lines) {
    const product = products.find(
      (item) => item.id === line.productId
    );

    if (!product) {
      return {
        ok: false,
        message: 'Uno de los productos ya no está disponible.',
      };
    }

    const hasVariants =
      Array.isArray(product.variants) &&
      product.variants.length > 0;

    if (hasVariants && !getVariant(product, line.variantId)) {
      return {
        ok: false,
        message: `Selecciona una variante válida para ${product.name}.`,
      };
    }

    if (!Number.isInteger(line.qty) || line.qty < 1) {
      return {
        ok: false,
        message: 'La cantidad solicitada no es válida.',
      };
    }

    const key =
      `${product.id}:${hasVariants ? line.variantId : 'simple'}`;

    required.set(key, (required.get(key) || 0) + line.qty);
  }

  for (const [key, quantity] of required.entries()) {
    const [productId, variantId] = key.split(':');

    const product = products.find(
      (item) => item.id === Number(productId)
    );

    const variant =
      variantId === 'simple'
        ? null
        : getVariant(product, variantId);

    const available = variant
      ? Number(variant.stock) || 0
      : Number(product.stock) || 0;

    if (available < quantity) {
      return {
        ok: false,
        message: variant
          ? `Stock insuficiente de ${product.name} (${variant.label}). Disponibles: ${available}.`
          : `Stock insuficiente de ${product.name}. Disponibles: ${available}.`,
      };
    }
  }

  return { ok: true };
}

// ======================================================
// PEDIDOS
// ======================================================

export function generateOrderCode(existingCodes = []) {
  let code;

  do {
    code = String(
      Math.floor(100000 + Math.random() * 900000)
    );
  } while (existingCodes.includes(code));

  return code;
}

export function deliveryFrom(isoDate) {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + DELIVERY_DAYS);
  return date.toISOString();
}

// ======================================================
// VALIDACIONES DE COMPRADOR
// ======================================================

const BUYER_FIELDS = [
  ['name', 'Nombre completo'],
  ['email', 'Correo electrónico'],
  ['phone', 'Teléfono'],
  ['municipio', 'Municipio'],
  ['address', 'Dirección'],
];

export function validateBuyer(buyer) {
  const errors = {};
  const missing = [];

  BUYER_FIELDS.forEach(([key, label]) => {
    if (!String(buyer?.[key] ?? '').trim()) {
      errors[key] = `Falta: ${label}`;
      missing.push(label);
    }
  });

  if (
    !errors.email &&
    !EMAIL_RE.test(String(buyer.email).trim())
  ) {
    errors.email = 'Correo no válido';
    missing.push('Correo electrónico válido');
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    missing,
  };
}

// ======================================================
// REGISTRO DE USUARIOS
// ======================================================

export function validateRegister(form, accounts) {
  const errors = {};

  const name = String(form.name || '').trim();

  const email = String(form.email || '')
    .trim()
    .toLowerCase();

  const phone = String(form.phone || '').trim();
  const digits = phone.replace(/\D/g, '');

  if (!name) {
    errors.name = 'Ingresa tu nombre completo.';
  }

  if (!email) {
    errors.email = 'Ingresa tu correo electrónico.';
  } else if (!EMAIL_RE.test(email)) {
    errors.email = 'Correo no válido.';
  } else if (
    accounts.some((account) => account.email === email)
  ) {
    errors.email = 'Ya existe una cuenta con este correo.';
  }

  if (!phone) {
    errors.phone = 'Ingresa tu teléfono.';
  } else if (digits.length < 7 || digits.length > 15) {
    errors.phone = 'Teléfono no válido (7 a 15 dígitos).';
  }

  if (!form.password) {
    errors.password = 'Crea una contraseña.';
  } else if (form.password.length < 6) {
    errors.password = 'Debe tener al menos 6 caracteres.';
  }

  if (!form.confirm) {
    errors.confirm = 'Repite tu contraseña.';
  } else if (form.password !== form.confirm) {
    errors.confirm = 'Las contraseñas no coinciden.';
  }

  const ok = Object.keys(errors).length === 0;

  return {
    ok,
    errors,
    clean: ok
      ? { name, email, phone, password: form.password }
      : null,
  };
}

// ======================================================
// RESEÑAS
// ======================================================

export function validateRating(value) {
  const raw = String(value).trim();
  const number = Number(raw);

  if (
    !raw ||
    !Number.isInteger(number) ||
    number < 1 ||
    number > 5
  ) {
    return {
      ok: false,
      message: 'La valoración debe ser un número entero entre 1 y 5.',
    };
  }

  return { ok: true, value: number };
}

export const averageRating = (ratings) =>
  ratings?.length
    ? Math.round(
        (ratings.reduce((sum, value) => sum + value, 0) /
          ratings.length) *
          10
      ) / 10
    : 0;

// ======================================================
// VALIDACIÓN DE PRODUCTOS
// ======================================================

export function validateProductForm(form) {
  const errors = {};
  const name = String(form.name ?? '').trim();

  if (!name) {
    errors.name = 'El nombre es obligatorio.';
  }

  const priceText = String(form.price ?? '').trim();

  const price = Number(
    priceText.replace(/[.\s$]/g, '').replace(',', '.')
  );

  if (!priceText || !Number.isFinite(price) || price <= 0) {
    errors.price = 'El precio debe ser un número mayor que 0.';
  }

  const stockText = String(form.stock ?? '').trim();
  const stock = Number(stockText);

  if (
    !stockText ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    errors.stock =
      'El stock debe ser un número entero igual o mayor que 0.';
  }

  if (!PRODUCT_CATEGORIES.includes(form.category)) {
    errors.category = 'Elige una categoría.';
  }

  const ok = Object.keys(errors).length === 0;

  return {
    ok,
    errors,
    clean: ok
      ? {
          name,
          price: Math.round(price),
          stock,
          category: form.category,
          description:
            String(form.description ?? '').trim() ||
            'Sin descripción.',
          brand: String(form.brand ?? '').trim(),
        }
      : null,
  };
}

// ======================================================
// ESTADO INICIAL Y SANEAMIENTO
// ======================================================

export function initialState(baseProducts) {
  return {
    products: baseProducts.map((product) => ({
      ...product,
      variants: Array.isArray(product.variants)
        ? product.variants.map((variant) => ({ ...variant }))
        : product.variants,
      stock: calculateProductStock(product),
    })),

    reviews: JSON.parse(JSON.stringify(INITIAL_REVIEWS)),
    buyers: [],
    sellers: [],
    session: null,
    users: {},
  };
}

const isObj = (value) =>
  value && typeof value === 'object' && !Array.isArray(value);

const toStock = (value) =>
  Math.max(0, Math.floor(Number(value) || 0));

const isStr = (value) =>
  typeof value === 'string' && value.trim() !== '';

// ======================================================
// NORMALIZACIÓN DE PRODUCTOS
// ======================================================

function sanitizeProducts(rawProducts, baseProducts) {
  const stored = Array.isArray(rawProducts)
    ? rawProducts.filter(isObj)
    : [];

  const products = baseProducts.map((base) => {
    const saved = stored.find((item) => item.id === base.id);

    if (!saved) {
      return {
        ...base,
        variants: Array.isArray(base.variants)
          ? base.variants.map((variant) => ({ ...variant }))
          : base.variants,
        stock: calculateProductStock(base),
      };
    }

    const savedPrice = Number(saved.price);
    let variants = base.variants;

    if (Array.isArray(base.variants) && base.variants.length > 0) {
      variants = base.variants.map((baseVariant) => {
        const savedVariant = Array.isArray(saved.variants)
          ? saved.variants.find(
              (variant) => variant.id === baseVariant.id
            )
          : null;

        const variantPrice = Number(savedVariant?.price);
        const variantStock = Number(savedVariant?.stock);

        return {
          ...baseVariant,
          price:
            Number.isFinite(variantPrice) && variantPrice > 0
              ? Math.round(variantPrice)
              : baseVariant.price,
          stock:
            Number.isInteger(variantStock) && variantStock >= 0
              ? variantStock
              : baseVariant.stock,
        };
      });
    }

    const product = {
      ...base,
      name: isStr(saved.name) ? saved.name : base.name,
      price:
        Number.isFinite(savedPrice) && savedPrice > 0
          ? Math.round(savedPrice)
          : base.price,
      variants,
      stock: 0,
      category: PRODUCT_CATEGORIES.includes(saved.category)
        ? saved.category
        : base.category,
      description:
        typeof saved.description === 'string'
          ? saved.description
          : base.description,
      brand:
        typeof saved.brand === 'string'
          ? saved.brand
          : base.brand,
    };

    product.stock = calculateProductStock(product);
    return product;
  });

  // Conserva productos creados por el vendedor.
  stored.forEach((saved) => {
    if (baseProducts.some((base) => base.id === saved.id)) {
      return;
    }

    const price = Number(saved.price);

    if (
      Number.isInteger(saved.id) &&
      isStr(saved.name) &&
      Number.isFinite(price) &&
      price > 0 &&
      PRODUCT_CATEGORIES.includes(saved.category) &&
      !products.some((product) => product.id === saved.id)
    ) {
      products.push({
        id: saved.id,
        name: saved.name,
        price: Math.round(price),
        stock: toStock(saved.stock),
        category: saved.category,
        description:
          typeof saved.description === 'string'
            ? saved.description
            : 'Sin descripción.',
        brand: isStr(saved.brand)
          ? saved.brand
          : 'Tienda FindAll',
        owner: isStr(saved.owner) ? saved.owner : null,
        image: null,
        sizes: null,
        variants: undefined,
      });
    }
  });

  return products;
}

// ======================================================
// NORMALIZACIÓN DE CUENTAS
// ======================================================

function sanitizeAccounts(raw) {
  const result = [];

  (Array.isArray(raw) ? raw : []).forEach((account) => {
    if (
      isObj(account) &&
      isStr(account.name) &&
      isStr(account.email) &&
      typeof account.password === 'string' &&
      typeof account.phone === 'string' &&
      !result.some((item) => item.email === account.email)
    ) {
      result.push({
        name: account.name,
        email: account.email,
        password: account.password,
        phone: account.phone,
      });
    }
  });

  return result;
}

// ======================================================
// HU32: NORMALIZACIÓN DE SOLICITUDES DE AYUDA
// ======================================================

const SUPPORT_REASONS = ['Entrega', 'Producto', 'Otro'];

function sanitizeSupportRequests(rawRequests) {
  if (!Array.isArray(rawRequests)) return [];

  const result = [];
  const usedIds = new Set();
  const usedCaseNumbers = new Set();

  rawRequests.forEach((request) => {
    if (
      !isObj(request) ||
      !isStr(request.id) ||
      !isStr(request.caseNumber) ||
      !isStr(request.orderCode) ||
      !SUPPORT_REASONS.includes(request.reason) ||
      !isStr(request.description) ||
      request.description.trim().length < 15 ||
      !['Abierto', 'Respondido'].includes(request.status)
    ) {
      return;
    }

    if (
      usedIds.has(request.id) ||
      usedCaseNumbers.has(request.caseNumber)
    ) {
      return;
    }

    usedIds.add(request.id);
    usedCaseNumbers.add(request.caseNumber);

    result.push({
      id: request.id,
      caseNumber: request.caseNumber,
      orderCode: request.orderCode,
      reason: request.reason,
      description: request.description.trim(),
      status: request.status,
      createdAt: isStr(request.createdAt)
        ? request.createdAt
        : new Date().toISOString(),
      answer: isStr(request.answer) ? request.answer : null,
      answeredAt: isStr(request.answeredAt)
        ? request.answeredAt
        : null,
    });
  });

  return result;
}

// ======================================================
// NORMALIZACIÓN DE DATOS DEL USUARIO
// ======================================================

function sanitizeUserData(raw, products) {
  if (!isObj(raw)) return emptyUserData();

  const cartRaw = Array.isArray(raw.cart) ? raw.cart : [];

  const cart = clampCart(
    cartRaw
      .filter(
        (line) =>
          isObj(line) &&
          Number.isInteger(line.productId) &&
          Number.isInteger(line.qty) &&
          line.qty >= 1
      )
      .map((line) => {
        const product = products.find(
          (item) => item.id === line.productId
        );

        const variant = product?.variants?.find(
          (item) => item.id === line.variantId
        );

        return {
          productId: line.productId,
          variantId: variant?.id ?? null,
          size: variant?.size ?? line.size ?? null,
          qty: line.qty,
        };
      }),
    products
  );

  const favorites = Array.isArray(raw.favorites)
    ? [
        ...new Set(
          raw.favorites.filter((id) =>
            products.some((product) => product.id === id)
          )
        ),
      ]
    : [];

  const orders = Array.isArray(raw.orders)
    ? raw.orders.filter(
        (order) =>
          isObj(order) &&
          typeof order.code === 'string' &&
          Array.isArray(order.items) &&
          order.items.every(isObj) &&
          Number.isFinite(Number(order.total)) &&
          Number(order.total) >= 0
      )
    : [];

  const coupon =
    raw.coupon && COUPONS[raw.coupon]
      ? raw.coupon
      : null;

  // HU25: direcciones guardadas.
  const addressesRaw = Array.isArray(raw.addresses)
    ? raw.addresses
    : [];

  const addresses = [];
  const usedAddressIds = new Set();

  addressesRaw.forEach((address) => {
    if (
      !isObj(address) ||
      !isStr(address.id) ||
      !isStr(address.alias) ||
      !isStr(address.municipio) ||
      !isStr(address.reference) ||
      usedAddressIds.has(address.id)
    ) {
      return;
    }

    usedAddressIds.add(address.id);

    addresses.push({
      id: address.id,
      alias: address.alias.trim(),
      municipio: address.municipio.trim(),
      reference: address.reference.trim(),
    });
  });

  const defaultAddressId = addresses.some(
    (address) => address.id === raw.defaultAddressId
  )
    ? raw.defaultAddressId
    : addresses[0]?.id ?? null;

  const selectedAddressId = addresses.some(
    (address) => address.id === raw.selectedAddressId
  )
    ? raw.selectedAddressId
    : defaultAddressId;

  // HU29: notificaciones.
  const notifications = Array.isArray(raw.notifications)
    ? raw.notifications.filter(
        (notification) =>
          isObj(notification) &&
          isStr(notification.id) &&
          isStr(notification.title) &&
          isStr(notification.message)
      )
    : [];

  // HU30: suscripciones a avisos de reposición.
  const restockSubscriptions = Array.isArray(
    raw.restockSubscriptions
  )
    ? raw.restockSubscriptions.filter((subscription) => {
        if (!isObj(subscription) || !isStr(subscription.id)) {
          return false;
        }

        const product = products.find(
          (item) => item.id === subscription.productId
        );

        if (!product) return false;

        if (subscription.variantId == null) {
          return !(
            Array.isArray(product.variants) &&
            product.variants.length > 0
          );
        }

        return (
          Array.isArray(product.variants) &&
          product.variants.some(
            (variant) => variant.id === subscription.variantId
          )
        );
      })
    : [];

  // HU32: conserva solicitudes aunque el pedido ya no esté en el historial.
  const supportRequests = sanitizeSupportRequests(
    raw.supportRequests
  );

  return {
    cart,
    favorites,
    orders,
    coupon,
    addresses,
    defaultAddressId,
    selectedAddressId,
    notifications,
    restockSubscriptions,
    supportRequests,
  };
}

// ======================================================
// SANEAMIENTO GENERAL DEL ESTADO
// ======================================================

export function sanitizeState(raw, baseProducts) {
  const initial = initialState(baseProducts);

  if (!isObj(raw)) return initial;

  const products = sanitizeProducts(raw.products, baseProducts);

  const buyers = sanitizeAccounts(raw.buyers);
  const sellers = sanitizeAccounts(raw.sellers);

  let session = null;

  if (isObj(raw.session)) {
    const accounts =
      raw.session.role === 'buyer'
        ? buyers
        : raw.session.role === 'seller'
          ? sellers
          : [];

    if (
      accounts.some(
        (account) => account.email === raw.session.email
      )
    ) {
      session = {
        role: raw.session.role,
        email: raw.session.email,
      };
    }
  }

  const users = {};

  buyers.forEach((buyer) => {
    users[buyer.email] = sanitizeUserData(
      isObj(raw.users) ? raw.users[buyer.email] : null,
      products
    );
  });

  let reviews = initial.reviews;

  if (isObj(raw.reviews)) {
    reviews = {};

    Object.keys(raw.reviews).forEach((key) => {
      if (Array.isArray(raw.reviews[key])) {
        reviews[key] = raw.reviews[key].filter(
          (rating) =>
            Number.isInteger(rating) &&
            rating >= 1 &&
            rating <= 5
        );
      }
    });
  }

  return {
    products,
    reviews,
    buyers,
    sellers,
    session,
    users,
  };
}
