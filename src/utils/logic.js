// Lógica pura (sin React) para poder probarla fácilmente.
import { PRODUCT_CATEGORIES, SHIPPING_COST, FREE_SHIPPING_FROM, COUPONS, DELIVERY_DAYS } from '../theme';
import { INITIAL_REVIEWS } from '../data/products';

export const emptyUserData = () => ({ cart: [], favorites: [], orders: [], coupon: null });
export const EMAIL_RE = /^\S+@\S+\.\S+$/;

// ---------- Carrito ----------
export const unitsOf = (cart, productId) =>
  cart.reduce((s, l) => (l.productId === productId ? s + l.qty : s), 0);

export const buildLines = (cart, products) =>
  cart
    .map((l) => {
      const product = products.find((p) => p.id === l.productId);
      return product ? { ...l, product } : null;
    })
    .filter(Boolean);

// Recorta el carrito para que nunca supere el stock (y elimina líneas sin stock).
export const clampCart = (cart, products) => {
  const used = {};
  const out = [];
  cart.forEach((l) => {
    const p = products.find((x) => x.id === l.productId);
    if (!p) return;
    const available = Math.max(0, p.stock - (used[p.id] || 0));
    const qty = Math.min(l.qty, available);
    if (qty >= 1) {
      used[p.id] = (used[p.id] || 0) + qty;
      out.push({ ...l, qty });
    }
  });
  return out;
};

// Aplica clampCart al carrito de cada comprador (cuando cambia el stock).
export const clampAllCarts = (users, products) => {
  const out = {};
  Object.keys(users).forEach((k) => {
    out[k] = { ...users[k], cart: clampCart(users[k].cart, products) };
  });
  return out;
};

// ---------- Totales (HU11, HU17) ----------
export const normalizeCoupon = (c) => String(c || '').trim().toUpperCase();

export function computeTotals(lines, couponCode) {
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const rate = couponCode && COUPONS[couponCode] ? COUPONS[couponCode] : 0;
  const discount = subtotal > 0 ? Math.min(subtotal, Math.round(subtotal * rate)) : 0;
  // El envío se evalúa sobre el subtotal (antes del descuento del cupón).
  const shipping = subtotal === 0 ? 0 : subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;
  const total = Math.max(0, subtotal - discount + shipping);
  return { subtotal, discount, shipping, total, count };
}

// ---------- Stock al confirmar (HU13, HU14) ----------
export function checkStock(lines, products) {
  const need = {};
  lines.forEach((l) => {
    need[l.productId] = (need[l.productId] || 0) + l.qty;
  });
  for (const id of Object.keys(need)) {
    const p = products.find((x) => String(x.id) === id);
    if (!p || p.stock < need[id]) {
      return {
        ok: false,
        message: `No hay stock suficiente de "${p ? p.name : 'un producto'}"${
          p ? ` (disponibles: ${p.stock})` : ''
        }. Ajusta tu carrito e inténtalo de nuevo.`,
      };
    }
  }
  return { ok: true };
}

// Código numérico de 6 dígitos, único (como en el prototipo: 3 0 4 5 6 1)
export function generateOrderCode(existingCodes) {
  let code;
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
  } while (existingCodes.includes(code));
  return code;
}

// Fecha de entrega aproximada: fecha del pedido + DELIVERY_DAYS días
export function deliveryFrom(isoDate) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + DELIVERY_DAYS);
  return d.toISOString();
}

// ---------- Validaciones ----------
const BUYER_FIELDS = [
  ['name', 'Nombre completo'],
  ['email', 'Correo electrónico'],
  ['phone', 'Teléfono'],
  ['municipio', 'Municipio'],
  ['address', 'Dirección'],
];

// HU12: ningún campo obligatorio vacío o solo con espacios
export function validateBuyer(buyer) {
  const errors = {};
  const missing = [];
  BUYER_FIELDS.forEach(([key, label]) => {
    if (!String(buyer[key] ?? '').trim()) {
      errors[key] = `Falta: ${label}`;
      missing.push(label);
    }
  });
  if (!errors.email && !EMAIL_RE.test(String(buyer.email).trim())) {
    errors.email = 'Correo no válido';
    missing.push('Correo electrónico válido');
  }
  return { ok: Object.keys(errors).length === 0, errors, missing };
}

// Registro de comprador / vendedor (cuentas simuladas, solo en el dispositivo)
export function validateRegister(form, accounts) {
  const errors = {};
  const name = String(form.name || '').trim();
  const email = String(form.email || '').trim().toLowerCase();
  const phone = String(form.phone || '').trim();
  const digits = phone.replace(/\D/g, '');

  if (!name) errors.name = 'Ingresa tu nombre completo.';
  if (!email) errors.email = 'Ingresa tu correo electrónico.';
  else if (!EMAIL_RE.test(email)) errors.email = 'Correo no válido.';
  else if (accounts.some((a) => a.email === email)) errors.email = 'Ya existe una cuenta con este correo.';
  if (!phone) errors.phone = 'Ingresa tu teléfono.';
  else if (digits.length < 7 || digits.length > 15) errors.phone = 'Teléfono no válido (7 a 15 dígitos).';
  if (!form.password) errors.password = 'Crea una contraseña.';
  else if (form.password.length < 6) errors.password = 'Debe tener al menos 6 caracteres.';
  if (!form.confirm) errors.confirm = 'Repite tu contraseña.';
  else if (form.password !== form.confirm) errors.confirm = 'Las contraseñas no coinciden.';

  const ok = Object.keys(errors).length === 0;
  return { ok, errors, clean: ok ? { name, email, phone, password: form.password } : null };
}

export function validateRating(value) {
  const n = Number(String(value).trim());
  if (String(value).trim() === '' || !Number.isInteger(n) || n < 1 || n > 5) {
    return { ok: false, message: 'La valoración debe ser un número entero entre 1 y 5.' };
  }
  return { ok: true, value: n };
}

export const averageRating = (arr) =>
  arr && arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;

export function validateProductForm(f) {
  const errors = {};
  const name = String(f.name ?? '').trim();
  if (!name) errors.name = 'El nombre es obligatorio.';

  const priceNum = Number(String(f.price ?? '').trim().replace(/[.\s$]/g, '').replace(',', '.'));
  if (String(f.price ?? '').trim() === '' || !Number.isFinite(priceNum) || priceNum <= 0) {
    errors.price = 'El precio debe ser un número mayor que 0.';
  }

  const stockStr = String(f.stock ?? '').trim();
  const stockNum = Number(stockStr);
  if (stockStr === '' || !Number.isInteger(stockNum) || stockNum < 0) {
    errors.stock = 'El stock debe ser un número entero igual o mayor que 0.';
  }

  if (!PRODUCT_CATEGORIES.includes(f.category)) errors.category = 'Elige una categoría.';

  const ok = Object.keys(errors).length === 0;
  return {
    ok,
    errors,
    clean: ok
      ? {
          name,
          price: Math.round(priceNum),
          stock: stockNum,
          category: f.category,
          description: String(f.description ?? '').trim() || 'Sin descripción.',
          brand: String(f.brand ?? '').trim(),
        }
      : null,
  };
}

// ---------- Persistencia (HU20) ----------
export function initialState(baseProducts) {
  return {
    products: baseProducts.map((p) => ({ ...p })),
    reviews: JSON.parse(JSON.stringify(INITIAL_REVIEWS)),
    buyers: [], // cuentas de comprador
    sellers: [], // cuentas de vendedor
    session: null, // { role: 'buyer' | 'seller', email }
    users: {}, // datos por comprador: { [email]: { cart, favorites, orders, coupon } }
  };
}

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const toStock = (v) => Math.max(0, Math.floor(Number(v) || 0));
const isStr = (v) => typeof v === 'string' && v.trim() !== '';

function sanitizeProducts(rawProducts, baseProducts) {
  const stored = Array.isArray(rawProducts) ? rawProducts.filter((p) => isObj(p)) : [];
  const products = baseProducts.map((base) => {
    const s = stored.find((x) => x.id === base.id);
    if (!s) return { ...base };
    const price = Number(s.price);
    return {
      ...base,
      name: isStr(s.name) ? s.name : base.name,
      price: Number.isFinite(price) && price > 0 ? Math.round(price) : base.price,
      stock: toStock(s.stock),
      category: PRODUCT_CATEGORIES.includes(s.category) ? s.category : base.category,
      description: typeof s.description === 'string' ? s.description : base.description,
      brand: typeof s.brand === 'string' ? s.brand : base.brand,
    };
  });
  stored.forEach((s) => {
    if (baseProducts.some((b) => b.id === s.id)) return;
    const price = Number(s.price);
    if (
      Number.isInteger(s.id) &&
      isStr(s.name) &&
      Number.isFinite(price) &&
      price > 0 &&
      PRODUCT_CATEGORIES.includes(s.category) &&
      !products.some((p) => p.id === s.id)
    ) {
      products.push({
        id: s.id,
        name: s.name,
        price: Math.round(price),
        stock: toStock(s.stock),
        category: s.category,
        description: typeof s.description === 'string' ? s.description : 'Sin descripción.',
        brand: typeof s.brand === 'string' ? s.brand : 'Tienda FindAll',
        owner: isStr(s.owner) ? s.owner : null,
        image: null,
        sizes: null,
      });
    }
  });
  return products;
}

function sanitizeAccounts(raw) {
  const out = [];
  (Array.isArray(raw) ? raw : []).forEach((a) => {
    if (
      isObj(a) && isStr(a.name) && isStr(a.email) && typeof a.password === 'string' &&
      typeof a.phone === 'string' && !out.some((x) => x.email === a.email)
    ) {
      out.push({ name: a.name, email: a.email, phone: a.phone, password: a.password });
    }
  });
  return out;
}

function sanitizeUserData(raw, products) {
  if (!isObj(raw)) return emptyUserData();

  const cartRaw = Array.isArray(raw.cart) ? raw.cart : [];
  const cart = clampCart(
    cartRaw
      .filter((l) => isObj(l) && Number.isInteger(l.productId) && Number.isInteger(l.qty) && l.qty >= 1)
      .map((l) => {
        const p = products.find((x) => x.id === l.productId);
        const size = p && p.sizes && p.sizes.includes(l.size) ? l.size : p && p.sizes ? p.sizes[0] : null;
        return { productId: l.productId, size, qty: l.qty };
      }),
    products
  );

  const favorites = Array.isArray(raw.favorites)
    ? [...new Set(raw.favorites.filter((id) => products.some((p) => p.id === id)))]
    : [];

  const orders = Array.isArray(raw.orders)
    ? raw.orders.filter(
        (o) =>
          isObj(o) &&
          typeof o.code === 'string' &&
          Array.isArray(o.items) &&
          o.items.every(isObj) &&
          Number.isFinite(Number(o.total)) &&
          Number(o.total) >= 0
      )
    : [];

  const coupon = raw.coupon && COUPONS[raw.coupon] ? raw.coupon : null;
  return { cart, favorites, orders, coupon };
}

// Recibe lo guardado (posiblemente vacío o corrupto) y devuelve un estado seguro.
export function sanitizeState(raw, baseProducts) {
  const init = initialState(baseProducts);
  if (!isObj(raw)) return init;

  const products = sanitizeProducts(raw.products, baseProducts);
  const buyers = sanitizeAccounts(raw.buyers);
  const sellers = sanitizeAccounts(raw.sellers);

  let session = null;
  if (isObj(raw.session)) {
    const list = raw.session.role === 'buyer' ? buyers : raw.session.role === 'seller' ? sellers : [];
    if (list.some((a) => a.email === raw.session.email)) {
      session = { role: raw.session.role, email: raw.session.email };
    }
  }

  const users = {};
  buyers.forEach((b) => {
    users[b.email] = sanitizeUserData(isObj(raw.users) ? raw.users[b.email] : null, products);
  });

  let reviews = init.reviews;
  if (isObj(raw.reviews)) {
    reviews = {};
    Object.keys(raw.reviews).forEach((k) => {
      if (Array.isArray(raw.reviews[k])) {
        reviews[k] = raw.reviews[k].filter((r) => Number.isInteger(r) && r >= 1 && r <= 5);
      }
    });
  }

  return { products, reviews, buyers, sellers, session, users };
}
