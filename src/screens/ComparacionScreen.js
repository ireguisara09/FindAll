
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
import ProductImage from '../components/ProductImage';
import GradientButton from '../components/GradientButton';

import { colors, fonts, formatPrice } from '../theme';
import { useApp } from '../context/AppContext';

const COLUMN_WIDTH = 145;
const LABEL_WIDTH = 125;

// Calcula el inventario total del producto.
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

// Obtiene el precio o rango de precios.
const getProductPrice = (product) => {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const prices = product.variants
      .map((variant) => Number(variant.price))
      .filter((price) => Number.isFinite(price) && price > 0);

    if (prices.length > 0) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);

      return min === max
        ? formatPrice(min)
        : `${formatPrice(min)} - ${formatPrice(max)}`;
    }
  }

  return formatPrice(Number(product.price) || 0);
};

const getAvailability = (product) =>
  getProductStock(product) > 0 ? 'Disponible' : 'Agotado';

export default function ComparisonScreen({ navigate }) {
  const {
    comparisonProducts = [],
    removeFromComparison,
    clearComparison,
  } = useApp();

  const goHome = () => navigate?.('home');

  const rows = [
    {
      label: 'Precio',
      icon: 'pricetag-outline',
      value: (product) => getProductPrice(product),
    },
    {
      label: 'Marca',
      icon: 'ribbon-outline',
      value: (product) => product.brand || 'No especificada',
    },
    {
      label: 'Categoría',
      icon: 'grid-outline',
      value: (product) => product.category || 'No especificada',
    },
    {
      label: 'Disponibilidad',
      icon: 'cube-outline',
      value: (product) => getAvailability(product),
    },
    {
      label: 'Unidades disponibles',
      icon: 'layers-outline',
      value: (product) => String(getProductStock(product)),
    },
    {
      label: 'Descripción',
      icon: 'document-text-outline',
      value: (product) => product.description || 'Sin descripción',
    },
  ];

  const hasEnoughProducts = comparisonProducts.length >= 2;

  return (
    <View style={styles.screen}>
      <Header navigate={navigate} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>COMPARAR PRODUCTOS</Text>

        <Text style={styles.subtitle}>
          Compara sus características y encuentra la mejor opción.
        </Text>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>
            Productos seleccionados
          </Text>

          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {comparisonProducts.length} de 3
            </Text>
          </View>
        </View>

        {!hasEnoughProducts ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="git-compare-outline"
                size={42}
                color={colors.orange}
              />
            </View>

            <Text style={styles.emptyTitle}>
              {comparisonProducts.length === 0
                ? 'Aún no tienes productos'
                : 'Falta un producto para comparar'}
            </Text>

            <Text style={styles.emptyText}>
              Selecciona al menos dos productos desde el catálogo
              para poder comparar sus características.
            </Text>

            <GradientButton
              label="Volver al catálogo"
              onPress={goHome}
              style={styles.mainButton}
            />
          </View>
        ) : (
          <>
            {/* Tarjetas de productos */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator
              contentContainerStyle={styles.productsContainer}
            >
              {comparisonProducts.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  <ProductImage
                    product={product}
                    style={styles.productImage}
                    iconSize={45}
                  />

                  <Text
                    style={styles.productName}
                    numberOfLines={2}
                  >
                    {product.name}
                  </Text>

                  <Text style={styles.productPrice}>
                    {getProductPrice(product)}
                  </Text>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFromComparison(product.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={colors.danger}
                    />

                    <Text style={styles.removeText}>Quitar</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>
              Características
            </Text>

            {/* Tabla con un solo desplazamiento horizontal */}
            <View style={styles.table}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator
                nestedScrollEnabled
              >
                <View>
                  {/* Encabezados */}
                  <View style={styles.tableHeader}>
                    <View style={styles.labelColumn}>
                      <Text style={styles.headerLabel}>
                        Característica
                      </Text>
                    </View>

                    {comparisonProducts.map((product) => (
                      <View
                        key={product.id}
                        style={styles.headerColumn}
                      >
                        <Text
                          style={styles.headerProduct}
                          numberOfLines={2}
                        >
                          {product.name}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Filas */}
                  {rows.map((row, index) => (
                    <View
                      key={row.label}
                      style={[
                        styles.tableRow,
                        index === rows.length - 1 && styles.lastRow,
                      ]}
                    >
                      <View style={styles.labelColumn}>
                        <Ionicons
                          name={row.icon}
                          size={18}
                          color={colors.orange}
                        />

                        <Text style={styles.rowLabel}>
                          {row.label}
                        </Text>
                      </View>

                      {comparisonProducts.map((product) => (
                        <View
                          key={`${product.id}-${row.label}`}
                          style={styles.valueColumn}
                        >
                          <Text style={styles.valueText}>
                            {row.value(product)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Acciones */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearComparison}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.orange}
                />

                <Text style={styles.clearText}>
                  Limpiar comparación
                </Text>
              </TouchableOpacity>

              <GradientButton
                label="Seguir explorando"
                onPress={goHome}
                style={styles.mainButton}
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
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  content: {
    padding: 16,
    paddingBottom: 25,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.orange,
    marginBottom: 5,
  },

  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#555',
    marginBottom: 18,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: '#000',
    marginBottom: 12,
  },

  counter: {
    backgroundColor: colors.yellow,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  counterText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#000',
  },

  productsContainer: {
    paddingBottom: 18,
    paddingRight: 5,
  },

  productCard: {
    width: 155,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
  },

  productImage: {
    width: '100%',
    height: 105,
    marginBottom: 9,
  },

  productName: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#000',
    textAlign: 'center',
    minHeight: 36,
  },

  productPrice: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.orange,
    marginTop: 5,
    textAlign: 'center',
  },

  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardDark,
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    width: '100%',
  },

  removeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.danger,
    marginLeft: 5,
  },

  table: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },

  tableHeader: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
    marginBottom: 5,
  },

  headerLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#555',
  },

  headerColumn: {
    width: COLUMN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  headerProduct: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.orange,
    textAlign: 'center',
  },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 9,
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  labelColumn: {
    width: LABEL_WIDTH,
    justifyContent: 'center',
    paddingRight: 8,
  },

  rowLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#222',
    marginTop: 5,
  },

  valueColumn: {
    width: COLUMN_WIDTH,
    backgroundColor: colors.bg,
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 3,
    justifyContent: 'center',
    minHeight: 65,
  },

  valueText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#222',
    textAlign: 'center',
  },

  actions: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
  },

  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },

  clearText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.orange,
    marginLeft: 7,
  },

  mainButton: {
    alignSelf: 'stretch',
  },

  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    marginTop: 8,
  },

  emptyIcon: {
    width: 75,
    height: 75,
    borderRadius: 20,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
    marginTop: 16,
  },

  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 16,
  },

});
