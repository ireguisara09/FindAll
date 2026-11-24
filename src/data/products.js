// ======================================================
// FINDALL - MARKETPLACE 2.0
// Catálogo inicial de productos
// HU21: Variantes e inventario por variante
// ======================================================

// Normaliza los productos para mantener coherente el inventario.

// Calcula el stock general a partir de las variantes.
const calculateProductStock = (product, originalStock) => {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants.reduce(
      (total, variant) =>
        total + Math.max(0, Number(variant.stock) || 0),
      0
    );
  }

  return Math.max(0, Number(originalStock) || 0);
};

// Normaliza los productos para mantener coherente el inventario.
const normalizeProduct = (product) => {
  // Guardamos el stock original antes de crear el getter.
  const { stock: originalStock, ...productData } = product;

  return {
    ...productData,

    variants: Array.isArray(product.variants)
      ? product.variants.map((variant) => ({
          ...variant,
          stock: Math.max(0, Number(variant.stock) || 0),
          price: Number(variant.price) || product.price,
        }))
      : undefined,

    get stock() {
      return calculateProductStock(this, originalStock);
    },
  };
};


// ======================================================
// CATÁLOGO: 13 PRODUCTOS
// ======================================================

const INITIAL_PRODUCTS = [
  // --------------------------------------------------
  // MODA
  // --------------------------------------------------

  {
    id: 1,
    name: 'Workation Oversize Hoodie',
    price: 90000,
    category: 'Moda',
    image: require('../../assets/hoodie.png'),
    description:
      'Hoodie de estilo oversize, holgado, capucha ajustable, bolsillo frontal tipo canguro. Elaborado en algodón.',
    brand: 'Urban Style',
    sizes: ['S', 'M', 'L', 'XL'],

    variants: [
      {
        id: '1-S-NEGRO',
        label: 'Talla S - Negro',
        size: 'S',
        color: 'Negro',
        price: 90000,
        stock: 1,
      },
      {
        id: '1-M-NEGRO',
        label: 'Talla M - Negro',
        size: 'M',
        color: 'Negro',
        price: 90000,
        stock: 1,
      },
      {
        id: '1-L-NEGRO',
        label: 'Talla L - Negro',
        size: 'L',
        color: 'Negro',
        price: 90000,
        stock: 2,
      },
      {
        id: '1-XL-GRIS',
        label: 'Talla XL - Gris',
        size: 'XL',
        color: 'Gris',
        price: 95000,
        stock: 1,
      },
    ],
  },

  {
    id: 2,
    name: 'Camiseta básica de algodón',
    price: 45000,
    category: 'Moda',
    image: null,
    description:
      'Camiseta de corte regular en algodón suave, ideal para el uso diario.',
    brand: 'Urban Style',
    sizes: ['S', 'M', 'L', 'XL'],

    variants: [
      {
        id: '2-S-BLANCO',
        label: 'Talla S - Blanco',
        size: 'S',
        color: 'Blanco',
        price: 45000,
        stock: 4,
      },
      {
        id: '2-M-BLANCO',
        label: 'Talla M - Blanco',
        size: 'M',
        color: 'Blanco',
        price: 45000,
        stock: 5,
      },
      {
        id: '2-L-NEGRO',
        label: 'Talla L - Negro',
        size: 'L',
        color: 'Negro',
        price: 48000,
        stock: 3,
      },
      {
        id: '2-XL-NEGRO',
        label: 'Talla XL - Negro',
        size: 'XL',
        color: 'Negro',
        price: 48000,
        stock: 3,
      },
    ],
  },

  {
    id: 3,
    name: 'Gorra urbana ajustable',
    price: 35000,
    category: 'Moda',
    image: null,
    description:
      'Gorra con cierre ajustable y visera curva. Talla única.',
    stock: 10,
    sizes: null,
    brand: 'Urban Style',
  },

  // --------------------------------------------------
  // BELLEZA
  // --------------------------------------------------

  {
    id: 4,
    name: 'Dr.Althea 345 Relief Cream',
    price: 130000,
    category: 'Belleza',
    image: require('../../assets/crema.png'),
    description:
      'Crema facial calmante e hidratante, ideal para pieles sensibles. Textura ligera de rápida absorción.',
    stock: 12,
    sizes: null,
    brand: 'Glow Skin',
  },

  {
    id: 5,
    name: 'Sérum facial de vitamina C',
    price: 85000,
    category: 'Belleza',
    image: null,
    description:
      'Sérum antioxidante que ayuda a unificar el tono y dar luminosidad a la piel.',
    stock: 9,
    sizes: null,
    brand: 'Glow Skin',
  },

  {
    id: 6,
    name: 'Set de brochas de maquillaje',
    price: 60000,
    category: 'Belleza',
    image: null,
    description:
      'Set de 8 brochas de cerdas suaves para rostro y ojos, con estuche.',
    stock: 14,
    sizes: null,
    brand: 'Glow Skin',
  },

  // --------------------------------------------------
  // DEPORTE
  // --------------------------------------------------

  {
    id: 7,
    name: 'Mancuernas Ajustables',
    price: 500000,
    category: 'Deporte',
    image: require('../../assets/mancuernas.png'),
    description:
      'Par de mancuernas ajustables con selector de peso rápido y base de almacenamiento. Perfectas para entrenar en casa.',
    stock: 8,
    sizes: null,
    brand: 'Fit Zone',
  },

  {
    id: 8,
    name: 'Banda elástica de resistencia',
    price: 25000,
    category: 'Deporte',
    image: null,
    description:
      'Banda de látex con resistencia media, para ejercicios de fuerza y movilidad.',
    stock: 30,
    sizes: null,
    brand: 'Fit Zone',
  },

  {
    id: 9,
    name: 'Botella deportiva 750 ml',
    price: 28000,
    category: 'Deporte',
    image: null,
    description:
      'Botella libre de BPA con tapa antiderrame y boquilla de flujo rápido.',
    stock: 18,
    sizes: null,
    brand: 'Fit Zone',
  },

  {
    id: 10,
    name: 'Colchoneta de yoga antideslizante',
    price: 70000,
    category: 'Deporte',
    image: null,
    description:
      'Colchoneta de 6 mm con superficie antideslizante. Producto agotado de ejemplo.',
    stock: 0,
    sizes: null,
    brand: 'Fit Zone',
  },

  // --------------------------------------------------
  // MASCOTAS
  // --------------------------------------------------

  {
    id: 11,
    name: 'Colección de collares mascotas',
    price: 30000,
    category: 'Mascotas',
    image: require('../../assets/collares.png'),
    description:
      'Collares resistentes y ajustables para mascotas, disponibles en varios colores y diseños.',
    brand: 'Pet Lovers',
    sizes: null,

    variants: [
      {
        id: '11-ROJO',
        label: 'Color Rojo',
        size: null,
        color: 'Rojo',
        price: 30000,
        stock: 6,
      },
      {
        id: '11-AZUL',
        label: 'Color Azul',
        size: null,
        color: 'Azul',
        price: 30000,
        stock: 8,
      },
      {
        id: '11-NEGRO',
        label: 'Color Negro',
        size: null,
        color: 'Negro',
        price: 32000,
        stock: 6,
      },
    ],
  },

  {
    id: 12,
    name: 'Cama acolchada para perro',
    price: 120000,
    category: 'Mascotas',
    image: null,
    description:
      'Cama mullida y lavable con base antideslizante, ideal para perros medianos.',
    stock: 6,
    sizes: null,
    brand: 'Pet Lovers',
  },

  {
    id: 13,
    name: 'Rascador para gatos',
    price: 95000,
    category: 'Mascotas',
    image: null,
    description:
      'Rascador vertical de sisal con base estable y juguete colgante.',
    stock: 7,
    sizes: null,
    brand: 'Pet Lovers',
  },
];

// Exportamos el catálogo con el inventario normalizado.
export const PRODUCTS = INITIAL_PRODUCTS.map(normalizeProduct);

// ======================================================
// RESEÑAS FICTICIAS (HU19)
// ======================================================

export const INITIAL_REVIEWS = {
  1: [5, 4],
  4: [5],
  7: [4, 5, 4],
  11: [5, 5],
};
