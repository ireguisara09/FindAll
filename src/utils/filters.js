
export const getProductStock = (product) => {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants.reduce(
      (total, variant) =>
        total + Math.max(0, Number(variant.stock) || 0),
      0
    );
  }

  return Math.max(0, Number(product.stock) || 0);
};

export const validatePriceRange = (minPrice, maxPrice) => {
  const min = minPrice.trim() === '' ? null : Number(minPrice);
  const max = maxPrice.trim() === '' ? null : Number(maxPrice);

  if (
    (min !== null && (!Number.isFinite(min) || min < 0)) ||
    (max !== null && (!Number.isFinite(max) || max < 0))
  ) {
    return {
      valid: false,
      message: 'Ingresa valores de precio válidos.',
    };
  }

  if (min !== null && max !== null && min > max) {
    return {
      valid: false,
      message: 'El precio mínimo no puede ser mayor que el máximo.',
    };
  }

  return { valid: true, message: '' };
};

export const filterProducts = (products, filters) => {
  const {
    query = '',
    category = 'Todas',
    brand = 'Todas',
    minPrice = '',
    maxPrice = '',
    availableOnly = false,
    onlyFavorites = false,
    favorites = [],
    sort = 'none',
  } = filters;

  const search = query.trim().toLowerCase();
  const min = minPrice.trim() === '' ? null : Number(minPrice);
  const max = maxPrice.trim() === '' ? null : Number(maxPrice);

  let result = products.filter((product) => {
    const matchesName = (product.name || '')
      .toLowerCase()
      .includes(search);

    const matchesCategory =
      category === 'Todas' || product.category === category;

    const matchesBrand =
      brand === 'Todas' || product.brand === brand;

    const price = Number(product.price) || 0;

    const matchesMin = min === null || price >= min;
    const matchesMax = max === null || price <= max;

    const matchesAvailability =
      !availableOnly || getProductStock(product) > 0;

    const matchesFavorites =
      !onlyFavorites || favorites.includes(product.id);

    return (
      matchesName &&
      matchesCategory &&
      matchesBrand &&
      matchesMin &&
      matchesMax &&
      matchesAvailability &&
      matchesFavorites
    );
  });

  if (sort === 'asc') {
    result = [...result].sort(
      (a, b) => Number(a.price) - Number(b.price)
    );
  } else if (sort === 'desc') {
    result = [...result].sort(
      (a, b) => Number(b.price) - Number(a.price)
    );
  }

  return result;
};
