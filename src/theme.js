export const colors = {
  orange: '#FF7A21',
  yellow: '#FFD95A',
  bg: '#FFF5DF', // mismo crema del prototipo (así la imagen del hero se funde con el fondo)
  card: '#F5EDDD',
  cardDark: '#EEE8DA',
  circle: '#E6E2DA',
  white: '#FFFFFF',
  black: '#000000',
  link: '#0A84C6',
  heart: '#FF5A5A',
  border: '#222222',
  danger: '#D93025',
  success: '#2E9E5B',
};

export const gradient = [colors.orange, colors.yellow];
export const gradientProps = {
  colors: gradient,
  start: { x: 0, y: 0.5 },
  end: { x: 1, y: 0.5 },
};

export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

// ---- Reglas del negocio (HU11, HU17) ----
export const CATEGORIES = ['Todas', 'Moda', 'Belleza', 'Deporte', 'Mascotas'];
export const PRODUCT_CATEGORIES = CATEGORIES.slice(1);
export const CATEGORY_ICONS = {
  Moda: 'shirt-outline',
  Belleza: 'flower-outline',
  Deporte: 'barbell-outline',
  Mascotas: 'paw-outline',
};
export const SHIPPING_COST = 8000;
export const FREE_SHIPPING_FROM = 150000;
export const COUPONS = { BIENVENIDO10: 0.1 }; // 10 %

export const formatPrice = (n) => {
  const num = Number(n);
  const v = Number.isFinite(num) ? Math.round(num) : 0;
  return (v < 0 ? '-' : '') + '$' + String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const formatDate = (iso) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const p = (x) => String(x).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// Ordenar por precio (HU06)
export const SORT_OPTIONS = [
  { key: 'none', label: 'Sin orden' },
  { key: 'asc', label: 'Menor a mayor' },
  { key: 'desc', label: 'Mayor a menor' },
];

// Entrega aproximada (historial)
export const DELIVERY_DAYS = 3;
export const DELIVERY_WINDOW = '4:00 - 6:00 p.m.';
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
export const formatLongDate = (iso) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return `${d.getDate()} de ${MONTHS[d.getMonth()]}`;
};
