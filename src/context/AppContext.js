import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRODUCTS } from '../data/products';
import { COUPONS } from '../theme';
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

// Pantallas según el tipo de usuario
const BUYER_ONLY = ['cart', 'checkout', 'favorites', 'history'];
const SELLER_ONLY = ['seller', 'seller-new'];
const EMPTY_DATA = emptyUserData();

export function AppProvider({ children }) {
  const init = initialState(PRODUCTS);
  const [hydrated, setHydrated] = useState(false);
  const [products, setProducts] = useState(init.products);
  const [reviews, setReviews] = useState(init.reviews);
  const [buyers, setBuyers] = useState(init.buyers);
  const [sellers, setSellers] = useState(init.sellers);
  const [session, setSession] = useState(init.session);
  const [users, setUsers] = useState(init.users); // datos por comprador
  const [toast, setToast] = useState(null);
  const [screen, setScreen] = useState('home'); // HU01: se abre en el catálogo (invitado)
  const [authPrompt, setAuthPrompt] = useState(null); // mensaje del aviso "necesitas una cuenta"

  const notify = (message, type = 'success') =>
    setToast({ message, type, id: Date.now() + Math.random() });

  // ---------- HU20: cargar al iniciar ----------
  useEffect(() => {
    (async () => {
      let s;
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        s = sanitizeState(raw ? JSON.parse(raw) : null, PRODUCTS);
      } catch (e) {
        s = initialState(PRODUCTS);
      }
      setProducts(s.products);
      setReviews(s.reviews);
      setBuyers(s.buyers);
      setSellers(s.sellers);
      setSession(s.session);
      setUsers(s.users);
      if (s.session && s.session.role === 'seller') setScreen('seller');
      setHydrated(true);
    })();
  }, []);

  // ---------- HU20: guardar en cada cambio ----------
  useEffect(() => {
    if (!hydrated) return;
    const slim = products.map(({ image, ...rest }) => rest); // la imagen viene del catálogo base
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ products: slim, reviews, buyers, sellers, session, users })
    ).catch(() => {});
  }, [hydrated, products, reviews, buyers, sellers, session, users]);

  // ---------- Quién está usando la app ----------
  const user = session && session.role === 'buyer' ? buyers.find((b) => b.email === session.email) || null : null;
  const seller = session && session.role === 'seller' ? sellers.find((s) => s.email === session.email) || null : null;
  const role = user ? 'buyer' : seller ? 'seller' : 'guest';

  const data = (user && users[user.email]) || EMPTY_DATA;
  const { cart, favorites, orders, coupon } = data;

  const updateData = (fn) => {
    if (!user) return;
    setUsers((prev) => ({ ...prev, [user.email]: fn(prev[user.email] || emptyUserData()) }));
  };

  // ---------- Derivados ----------
  const lines = buildLines(cart, products);
  const totals = computeTotals(lines, coupon);
  const getProduct = (id) => products.find((p) => p.id === id);

  // ---------- Navegación con control de acceso ----------
  const navigate = (target) => {
    if (BUYER_ONLY.includes(target) && role !== 'buyer') {
      if (role === 'seller') notify('Esta sección es solo para compradores.', 'warn');
      else setAuthPrompt('Para ver esta sección necesitas una cuenta de comprador.');
      return;
    }
    if (SELLER_ONLY.includes(target) && role !== 'seller') {
      setScreen('sellerLogin');
      return;
    }
    setScreen(target);
  };

  // Acciones de compra: solo compradores con sesión
  const requireBuyer = (what) => {
    if (role === 'buyer') return true;
    if (role === 'seller') {
      notify('Con una cuenta de vendedor no puedes comprar. Ingresa como comprador.', 'warn');
    } else {
      setAuthPrompt(`Para ${what} necesitas una cuenta de comprador.`);
    }
    return false;
  };

  // ---------- Cuentas ----------
  const register = (kind, form) => {
    const list = kind === 'seller' ? sellers : buyers;
    const v = validateRegister(form, list);
    if (!v.ok) return { ok: false, errors: v.errors };
    if (kind === 'seller') setSellers((prev) => [...prev, v.clean]);
    else {
      setBuyers((prev) => [...prev, v.clean]);
      setUsers((prev) => ({ ...prev, [v.clean.email]: emptyUserData() }));
    }
    setSession({ role: kind, email: v.clean.email });
    setScreen(kind === 'seller' ? 'seller' : 'home');
    notify(`¡Cuenta creada! Bienvenido a FindAll, ${v.clean.name.split(' ')[0]}.`);
    return { ok: true };
  };

  const login = (kind, email, password) => {
    const mail = String(email || '').trim().toLowerCase();
    if (!mail || !password) return { ok: false, message: 'Ingresa tu correo y tu contraseña.' };
    const list = kind === 'seller' ? sellers : buyers;
    const acc = list.find((a) => a.email === mail && a.password === password);
    if (!acc) return { ok: false, message: 'Correo o contraseña incorrectos.' };
    setSession({ role: kind, email: acc.email });
    setScreen(kind === 'seller' ? 'seller' : 'home');
    notify(`Hola de nuevo, ${acc.name.split(' ')[0]}.`);
    return { ok: true };
  };

  const logout = () => {
    setSession(null);
    setScreen('home');
    notify('Sesión cerrada.', 'info');
  };

  // ---------- Favoritos (HU08) ----------
  const toggleFavorite = (id) => {
    if (!requireBuyer('guardar favoritos')) return;
    const isFav = favorites.includes(id);
    updateData((d) => ({
      ...d,
      favorites: isFav ? d.favorites.filter((i) => i !== id) : [...d.favorites, id],
    }));
    const p = getProduct(id);
    notify(
      isFav ? `Quitado de favoritos: ${p?.name ?? ''}` : `Agregado a favoritos: ${p?.name ?? ''}`,
      'info'
    );
  };

  // ---------- Carrito (HU09, HU10) ----------
  const addToCart = (product, size = null, qty = 1) => {
    if (!requireBuyer('agregar productos al carrito')) return false;
    if (!product || product.stock <= 0) {
      notify('Este producto está agotado.', 'warn');
      return false;
    }
    const inCart = unitsOf(cart, product.id);
    if (inCart >= product.stock) {
      notify('Ya tienes en el carrito todas las unidades disponibles.', 'warn');
      return false;
    }
    if (inCart + qty > product.stock) {
      notify(`Solo quedan ${product.stock - inCart} unidades disponibles para agregar.`, 'warn');
      return false;
    }
    const finalSize = product.sizes ? size || product.sizes[1] || product.sizes[0] : null;
    updateData((d) => {
      const idx = d.cart.findIndex((l) => l.productId === product.id && l.size === finalSize);
      const next =
        idx >= 0
          ? d.cart.map((l, i) => (i === idx ? { ...l, qty: l.qty + qty } : l))
          : [...d.cart, { productId: product.id, size: finalSize, qty }];
      return { ...d, cart: next };
    });
    notify(`Agregado al carrito: ${product.name}`);
    return true;
  };

  const removeLine = (index) => {
    const line = cart[index];
    if (!line) return;
    updateData((d) => ({ ...d, cart: d.cart.filter((_, i) => i !== index) }));
    notify(`Eliminado del carrito: ${getProduct(line.productId)?.name ?? 'producto'}`, 'info');
  };

  const changeQty = (index, delta) => {
    const line = cart[index];
    if (!line) return;
    const product = getProduct(line.productId);
    if (delta > 0) {
      if (!product || unitsOf(cart, line.productId) + 1 > product.stock) {
        notify('No hay más unidades disponibles de este producto.', 'warn');
        return;
      }
      updateData((d) => ({ ...d, cart: d.cart.map((l, i) => (i === index ? { ...l, qty: l.qty + 1 } : l)) }));
    } else if (line.qty > 1) {
      updateData((d) => ({ ...d, cart: d.cart.map((l, i) => (i === index ? { ...l, qty: l.qty - 1 } : l)) }));
    } else {
      // Cantidad 1 → disminuir elimina la línea (consistente, sin negativos)
      removeLine(index);
    }
  };

  // ---------- Cupón (HU17) ----------
  const applyCoupon = (code) => {
    const c = normalizeCoupon(code);
    if (!c) return { ok: false, message: 'Escribe un código de cupón.' };
    if (lines.length === 0) return { ok: false, message: 'Agrega productos al carrito antes de aplicar un cupón.' };
    if (!COUPONS[c]) return { ok: false, message: 'Cupón no válido. El total no cambió.' };
    updateData((d) => ({ ...d, coupon: c }));
    return { ok: true, message: `Se ha descontado el ${Math.round(COUPONS[c] * 100)}% al subtotal de su compra` };
  };
  const removeCoupon = () => {
    updateData((d) => ({ ...d, coupon: null }));
    notify('Cupón quitado.', 'info');
  };

  // ---------- Confirmar pedido (HU13, HU14, HU15) ----------
  const confirmOrder = (buyer) => {
    if (!user) return { ok: false, message: 'Inicia sesión para comprar.' };
    if (lines.length === 0) return { ok: false, message: 'Tu carrito está vacío.' };
    const stock = checkStock(lines, products);
    if (!stock.ok) return { ok: false, message: stock.message }; // no se descuenta nada
    const allCodes = Object.values(users).flatMap((u) => u.orders.map((o) => o.code));
    const now = new Date().toISOString();
    const order = {
      code: generateOrderCode(allCodes),
      date: now,
      deliveryDate: deliveryFrom(now),
      buyer: { ...buyer },
      items: lines.map((l) => ({
        productId: l.productId,
        name: l.product.name,
        brand: l.product.brand,
        category: l.product.category,
        size: l.size,
        qty: l.qty,
        unitPrice: l.product.price,
      })),
      coupon,
      subtotal: totals.subtotal,
      discount: totals.discount,
      shipping: totals.shipping,
      total: totals.total,
    };
    const nextProducts = products.map((p) => {
      const units = unitsOf(cart, p.id);
      return units ? { ...p, stock: Math.max(0, p.stock - units) } : p;
    });
    setProducts(nextProducts);
    setUsers((prev) => {
      const cur = prev[user.email] || emptyUserData();
      const next = { ...prev, [user.email]: { ...cur, orders: [order, ...cur.orders], cart: [], coupon: null } };
      return clampAllCarts(next, nextProducts);
    });
    return { ok: true, order };
  };

  // ---------- Reseñas (HU19) ----------
  const addReview = (productId, value) => {
    if (!requireBuyer('calificar productos')) return false;
    const v = validateRating(value);
    if (!v.ok) {
      notify(v.message, 'error');
      return false;
    }
    setReviews((prev) => ({ ...prev, [productId]: [...(prev[productId] || []), v.value] }));
    notify('¡Gracias por tu valoración!');
    return true;
  };

  // ---------- Panel de vendedor (HU18) ----------
  const saveProduct = (form, editId = null) => {
    if (!seller) return { ok: false, errors: { name: 'Inicia sesión como vendedor.' } };
    const v = validateProductForm(form);
    if (!v.ok) return { ok: false, errors: v.errors };
    const clean = { ...v.clean, brand: v.clean.brand || seller.name };
    if (editId != null) {
      const target = products.find((p) => p.id === editId);
      if (!target || (target.owner && target.owner !== seller.email)) {
        return { ok: false, errors: { name: 'No puedes editar este producto.' } };
      }
      const next = products.map((p) => (p.id === editId ? { ...p, ...clean } : p));
      setProducts(next);
      setUsers((prev) => clampAllCarts(prev, next)); // si bajó el stock, ajusta los carritos
      notify('Producto actualizado.');
    } else {
      const id = Math.max(0, ...products.map((p) => p.id)) + 1;
      setProducts([...products, { id, ...clean, owner: seller.email, image: null, sizes: null }]);
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
        reviews,
        addReview,
        saveProduct,
        toast,
        notify,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
