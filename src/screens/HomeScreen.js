
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  useWindowDimensions,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import GradientButton from '../components/GradientButton';

import {
  colors,
  fonts,
  gradientProps,
  CATEGORIES,
} from '../theme';

import { useApp } from '../context/AppContext';

const HERO_IMG = require('../../assets/hero.png');

const getProductStock = (product) => {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants.reduce(
      (total, variant) =>
        total + Math.max(0, Number(variant.stock) || 0),
      0
    );
  }

  return Math.max(0, Number(product.stock) || 0);
};

export default function HomeScreen({ navigate, onlyFavorites = false }) {
  const {
    products,
    favorites,
    comparisonIds,
    comparisonProducts,
    toggleComparison,
    clearComparison,
    navigate: appNavigate,
  } = useApp();

  const { width } = useWindowDimensions();

  // Distribución original: dos tarjetas por fila.
  const horizontalPadding = 16;
  const cardGap = 12;
  const cardWidth = (width - horizontalPadding * 2 - cardGap) / 2;

  // Tamaño adaptable del banner.
  const heroHeight = Math.min(230, Math.max(185, width * 0.43));

  const [category, setCategory] = useState('Todas');
  const [brand, setBrand] = useState('Todas');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('none');
  const [selectedId, setSelectedId] = useState(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const selected = products.find((p) => p.id === selectedId) || null;

  const goToComparison = () => {
    if (comparisonProducts.length < 2) return;

    if (navigate) {
      navigate('comparison');
    } else {
      appNavigate('comparison');
    }
  };

  const brands = useMemo(() => {
    const uniqueBrands = [
      ...new Set(
        products
          .map((product) => product.brand)
          .filter(
            (value) =>
              typeof value === 'string' && value.trim() !== ''
          )
      ),
    ];

    return ['Todas', ...uniqueBrands.sort((a, b) => a.localeCompare(b))];
  }, [products]);

  // Búsqueda y filtros combinados.
  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = minPrice.trim() === '' ? null : Number(minPrice);
    const max = maxPrice.trim() === '' ? null : Number(maxPrice);

    let list = products.filter((product) => {
      const matchesName = (product.name || '').toLowerCase().includes(q);

      const matchesCategory =
        category === 'Todas' || product.category === category;

      const matchesBrand =
        brand === 'Todas' || product.brand === brand;

      const price = Number(product.price) || 0;

      const matchesMin =
        min === null || (Number.isFinite(min) && price >= min);

      const matchesMax =
        max === null || (Number.isFinite(max) && price <= max);

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
      list.sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (sort === 'desc') {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    }

    return list;
  }, [
    products,
    category,
    brand,
    query,
    sort,
    minPrice,
    maxPrice,
    availableOnly,
    onlyFavorites,
    favorites,
  ]);

  const clearFilters = () => {
    setCategory('Todas');
    setBrand('Todas');
    setQuery('');
    setSort('none');
    setMinPrice('');
    setMaxPrice('');
    setAvailableOnly(false);
  };

  const clearAdvancedFilters = () => {
    setBrand('Todas');
    setSort('none');
    setMinPrice('');
    setMaxPrice('');
    setAvailableOnly(false);
  };

  const hasFilters =
    category !== 'Todas' ||
    brand !== 'Todas' ||
    query.trim() !== '' ||
    sort !== 'none' ||
    minPrice.trim() !== '' ||
    maxPrice.trim() !== '' ||
    availableOnly;

  const activeFiltersCount = [
    brand !== 'Todas',
    sort !== 'none',
    minPrice.trim() !== '',
    maxPrice.trim() !== '',
    availableOnly,
  ].filter(Boolean).length;

  // Contenido superior de la lista.
  const ListHeader = (
    <View>
      {!onlyFavorites && (
        <View style={[styles.hero, { minHeight: heroHeight }]}>
          {/* Línea decorativa */}
          <LinearGradient
            colors={[colors.orange, colors.yellow]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.heroBar}
          />

          {/* Texto del banner */}
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>
              ¡TODO LO QUE NECESITAS, EN UN SOLO LUGAR!
            </Text>

            <Text style={styles.heroSub}>
              Explora productos de moda, belleza, deporte y mascotas.
              Descubre nuevas opciones y encuentra tus favoritos.
            </Text>

            <GradientButton
              label="Compra ahora"
              onPress={clearFilters}
              style={styles.heroButton}
              textStyle={styles.heroButtonText}
              right={
                <Ionicons
                  name="arrow-forward"
                  size={19}
                  color="#000"
                  style={{ marginLeft: 8 }}
                />
              }
            />
          </View>

          {/* Imagen del banner */}
          <View style={[styles.heroPic, { height: heroHeight }]}>
            <LinearGradient
              colors={[colors.orange, colors.yellow]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroBox}
            />

            <Image
              source={HERO_IMG}
              style={styles.heroGirl}
              resizeMode="contain"
            />
          </View>
        </View>
      )}

      {onlyFavorites && (
        <Text style={styles.favTitle}>MIS FAVORITOS</Text>
      )}

      {/* Categorías */}
      {!onlyFavorites && (
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Categorías</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {CATEGORIES.map((item) => {
              const active = item === category;

              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => setCategory(item)}
                  activeOpacity={0.8}
                  style={styles.categoryItem}
                >
                  {active ? (
                    <LinearGradient
                      {...gradientProps}
                      style={styles.chip}
                    >
                      <Text style={styles.chipText}>{item}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.chip, styles.inactiveChip]}>
                      <Text style={styles.chipText}>{item}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Panel de filtros */}
      {!onlyFavorites && filtersExpanded && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterPanelHeading}>
            <Text style={styles.filterTitle}>Filtrar productos</Text>

            <TouchableOpacity
              onPress={() => setFiltersExpanded(false)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close-circle-outline"
                size={23}
                color={colors.orange}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>Marca</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {brands.map((item) => {
              const active = brand === item;

              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => setBrand(item)}
                  style={[
                    styles.brandChip,
                    active && styles.brandChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.brandText,
                      active && styles.brandTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.filterLabel}>Rango de precio</Text>

          <View style={styles.priceRow}>
            <View style={styles.priceInputContainer}>
              <Text style={styles.inputPrefix}>Mínimo $</Text>
              <TextInput
                value={minPrice}
                onChangeText={(value) =>
                  setMinPrice(value.replace(/[^0-9]/g, ''))
                }
                placeholder="0"
                placeholderTextColor="#888"
                keyboardType="numeric"
                style={styles.priceInput}
              />
            </View>

            <View style={styles.priceInputContainer}>
              <Text style={styles.inputPrefix}>Máximo $</Text>
              <TextInput
                value={maxPrice}
                onChangeText={(value) =>
                  setMaxPrice(value.replace(/[^0-9]/g, ''))
                }
                placeholder="Sin límite"
                placeholderTextColor="#888"
                keyboardType="numeric"
                style={styles.priceInput}
              />
            </View>
          </View>

          <Text style={styles.filterLabel}>Ordenar por precio</Text>

          <View style={styles.sortRow}>
            {[
              { key: 'none', label: 'Predeterminado' },
              { key: 'asc', label: 'Menor precio' },
              { key: 'desc', label: 'Mayor precio' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                onPress={() => setSort(option.key)}
                style={[
                  styles.sortChip,
                  sort === option.key && styles.sortChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.sortChipText,
                    sort === option.key && styles.sortChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.availabilityRow}
            onPress={() => setAvailableOnly((previous) => !previous)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={availableOnly ? 'checkbox' : 'square-outline'}
              size={22}
              color={colors.orange}
            />

            <Text style={styles.availabilityText}>
              Mostrar solo productos disponibles
            </Text>
          </TouchableOpacity>

          {activeFiltersCount > 0 && (
            <TouchableOpacity
              onPress={clearAdvancedFilters}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle-outline"
                size={17}
                color={colors.orange}
              />
              <Text style={styles.clearText}>Limpiar filtros</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Resultados */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {data.length}{' '}
          {data.length === 1
            ? 'producto encontrado'
            : 'productos encontrados'}
        </Text>

        {hasFilters && (
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.resetText}>Restablecer todo</Text>
          </TouchableOpacity>
        )}
      </View>

      {!onlyFavorites && (
        <View style={styles.comparisonInfo}>
          <Ionicons
            name="git-compare-outline"
            size={19}
            color={colors.orange}
          />
          <Text style={styles.comparisonInfoText}>
            Selecciona entre 2 y 3 productos para compararlos.
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (products.length === 0) {
      return (
        <EmptyState
          icon="storefront-outline"
          text="Aún no hay productos disponibles."
        />
      );
    }

    if (onlyFavorites && favorites.length === 0) {
      return (
        <EmptyState
          icon="heart-outline"
          text="Aún no tienes productos favoritos."
          action="Ver catálogo"
          onAction={() => navigate('home')}
        />
      );
    }

    return (
      <EmptyState
        icon="search-outline"
        text="No encontramos productos con esos filtros."
        action={hasFilters ? 'Limpiar filtros' : null}
        onAction={clearFilters}
      />
    );
  };

  const renderProduct = ({ item }) => {
    const isCompared = comparisonIds.includes(item.id);
    const comparisonLimitReached = comparisonIds.length >= 3;

    return (
      <View style={{ width: cardWidth }}>
        <ProductCard
          product={item}
          onPress={() => setSelectedId(item.id)}
        />

        {!onlyFavorites && (
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={!isCompared && comparisonLimitReached}
            onPress={() => toggleComparison(item.id)}
            style={[
              styles.compareSelectButton,
              isCompared && styles.compareSelectButtonActive,
              !isCompared &&
                comparisonLimitReached &&
                styles.compareSelectButtonDisabled,
            ]}
          >
            <Ionicons
              name={isCompared ? 'checkmark-circle' : 'git-compare-outline'}
              size={17}
              color={isCompared ? '#fff' : colors.orange}
            />

            <Text
              style={[
                styles.compareSelectText,
                isCompared && styles.compareSelectTextActive,
              ]}
            >
              {isCompared ? 'Seleccionado' : 'Comparar'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        variant="home"
        query={query}
        onQuery={setQuery}
        navigate={navigate}
        onOpenFilters={() =>
          setFiltersExpanded((previous) => !previous)
        }
        activeFiltersCount={activeFiltersCount}
      />

      <View style={{ flex: 1 }}>
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={renderEmpty}
          renderItem={renderProduct}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          extraData={comparisonIds}
        />

        {/* Barra de comparación */}
        {!onlyFavorites && comparisonIds.length > 0 && (
          <View style={styles.comparisonBar}>
            <View style={styles.comparisonBarInfo}>
              <View style={styles.comparisonBarIcon}>
                <Ionicons
                  name="git-compare"
                  size={21}
                  color={colors.orange}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.comparisonBarTitle}>
                  Comparar productos
                </Text>

                <Text style={styles.comparisonBarSubtitle}>
                  {comparisonProducts.length} de 3 productos seleccionados
                </Text>
              </View>
            </View>

            <View style={styles.comparisonBarActions}>
              <TouchableOpacity
                onPress={clearComparison}
                style={styles.clearComparisonButton}
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={colors.orange}
                />
                <Text style={styles.clearComparisonText}>Limpiar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={goToComparison}
                disabled={comparisonProducts.length < 2}
                style={[
                  styles.openComparisonButton,
                  comparisonProducts.length < 2 &&
                    styles.openComparisonButtonDisabled,
                ]}
              >
                <Text style={styles.openComparisonText}>
                  Comparar ahora
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={17}
                  color="#000"
                />
              </TouchableOpacity>
            </View>

            {comparisonProducts.length < 2 && (
              <Text style={styles.comparisonWarning}>
                Selecciona al menos otro producto para continuar.
              </Text>
            )}
          </View>
        )}

        {/* Modal de producto con recomendaciones HU31 */}
        {selected && (
          <ProductModal
            key={selected.id}
            product={selected}
            onClose={() => setSelectedId(null)}
            onSelectProduct={(productId) => setSelectedId(productId)}
          />
        )}
      </View>
    </View>
  );
}

export function EmptyState({ icon, text, action, onAction }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={54} color={colors.orange} />

      <Text style={styles.emptyText}>{text}</Text>

      {action ? (
        <GradientButton
          label={action}
          onPress={onAction}
          style={{ marginTop: 14 }}
          textStyle={{ fontSize: 15 }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 125,
  },

  productRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  // BANNER PRINCIPAL
  hero: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingRight: 4,
  },

  heroBar: {
    width: 7,
    alignSelf: 'stretch',
    borderRadius: 5,
    marginRight: 13,
    marginVertical: 8,
  },

  heroText: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 5,
  },

  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    color: '#000',
  },

  heroSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: '#000',
    marginTop: 10,
  },

  heroButton: {
    alignSelf: 'flex-start',
    marginTop: 13,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 15,
  },

  heroButtonText: {
    fontSize: 14,
  },

  heroPic: {
    width: '46%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroBox: {
    position: 'absolute',
    right: 0,
    top: '7%',
    width: '91%',
    height: '86%',
    borderRadius: 20,
  },

  heroGirl: {
    width: '125%',
    height: '112%',
    position: 'absolute',
    right: '-8%',
    bottom: 0,
  },

  // FAVORITOS
  favTitle: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.orange,
    marginVertical: 12,
  },

  // CATEGORÍAS
  categorySection: {
    marginTop: 12,
    marginBottom: 8,
  },

  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.orange,
    marginBottom: 9,
  },

  categoryList: {
    paddingBottom: 5,
  },

  categoryItem: {
    marginRight: 10,
  },

  chip: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },

  inactiveChip: {
    backgroundColor: colors.card,
  },

  chipText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#000',
  },

  // FILTROS
  filtersContainer: {
    marginTop: 13,
    padding: 13,
    backgroundColor: colors.card,
    borderRadius: 15,
  },

  filterPanelHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  filterTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#000',
  },

  filterLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#000',
    marginTop: 12,
    marginBottom: 7,
  },

  brandChip: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 16,
    backgroundColor: colors.cardDark,
    marginRight: 8,
  },

  brandChipActive: {
    backgroundColor: colors.orange,
  },

  brandText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#333',
  },

  brandTextActive: {
    fontFamily: fonts.bold,
    color: '#000',
  },

  priceRow: {
    flexDirection: 'row',
    gap: 10,
  },

  priceInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: 10,
    paddingHorizontal: 9,
  },

  inputPrefix: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: '#555',
  },

  priceInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 4,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#000',
  },

  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  sortChip: {
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 15,
    backgroundColor: colors.cardDark,
  },

  sortChipActive: {
    backgroundColor: colors.orange,
  },

  sortChipText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: '#333',
  },

  sortChipTextActive: {
    fontFamily: fonts.bold,
    color: '#000',
  },

  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },

  availabilityText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#222',
    marginLeft: 8,
    flex: 1,
  },

  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
  },

  clearText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.orange,
    marginLeft: 5,
  },

  // RESULTADOS
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 13,
  },

  resultsText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#555',
  },

  resetText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.orange,
  },

  comparisonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 9,
  },

  comparisonInfoText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#555',
    marginLeft: 7,
    flex: 1,
  },

  // COMPARACIÓN DE PRODUCTOS
  compareSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 5,
    marginTop: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.orange,
    backgroundColor: colors.card,
  },

  compareSelectButtonActive: {
    backgroundColor: colors.orange,
  },

  compareSelectButtonDisabled: {
    opacity: 0.4,
  },

  compareSelectText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.orange,
    marginLeft: 6,
  },

  compareSelectTextActive: {
    color: '#fff',
  },

  comparisonBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 14,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },

  comparisonBarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  comparisonBarIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  comparisonBarTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#000',
    marginLeft: 9,
  },

  comparisonBarSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#666',
    marginLeft: 9,
    marginTop: 2,
  },

  comparisonBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },

  clearComparisonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.cardDark,
    gap: 6,
  },

  clearComparisonText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.orange,
  },

  openComparisonButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: colors.orange,
    gap: 8,
  },

  openComparisonButtonDisabled: {
    opacity: 0.4,
  },

  openComparisonText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#000',
  },

  comparisonWarning: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#777',
    marginTop: 7,
    textAlign: 'center',
  },

  // ESTADO VACÍO
  empty: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },

  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginTop: 10,
  },
});
