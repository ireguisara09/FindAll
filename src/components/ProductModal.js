
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, formatPrice, formatDate } from '../theme';
import GradientButton from './GradientButton';
import ProductImage from './ProductImage';
import { useApp } from '../context/AppContext';
import { averageRating } from '../utils/logic';

// Se dibuja como capa dentro de la pantalla para que
// el Header y el BottomNav sigan visibles.
export default function ProductModal({
  product,
  onClose,
  onSelectProduct,
}) {
  const {
    products,
    favorites,
    toggleFavorite,
    addToCart,
    reviews,
    addReview,
    questions,
    addQuestion,
    simulateAnswer,
    restockSubscriptions,
    subscribeToRestock,
    cancelRestockSubscription,
  } = useApp();

  // Variantes del producto: talla, color, precio y stock.
  const variants = Array.isArray(product.variants)
    ? product.variants
    : [];

  const availableVariants = variants.filter(
    (variant) => Number(variant.stock) > 0
  );

  const [selectedVariantId, setSelectedVariantId] = useState(() => {
    const firstAvailable = variants.find(
      (variant) => Number(variant.stock) > 0
    );

    return (firstAvailable || variants[0])?.id || null;
  });

  const [size, setSize] = useState(
    product.sizes ? product.sizes[1] || product.sizes[0] : null
  );

  const [qty, setQty] = useState(1);
  const [ratingText, setRatingText] = useState('');
  const [questionText, setQuestionText] = useState('');

  const selectedVariant = variants.find(
    (variant) => variant.id === selectedVariantId
  ) || variants[0] || null;

  const hasVariants = variants.length > 0;

  // Datos que dependen de la variante seleccionada.
  const currentStock = hasVariants
    ? Number(selectedVariant?.stock || 0)
    : Number(product.stock || 0);

  const currentPrice = hasVariants
    ? Number(selectedVariant?.price ?? product.price)
    : product.price;

  // La disponibilidad depende de la variante seleccionada.
  const soldOut = currentStock <= 0;

  const isFav = favorites.includes(product.id);

  // ======================================================
  // HU31: PRODUCTOS RELACIONADOS
  // ======================================================

  // Muestra máximo 4 productos de la misma categoría.
  // Excluye el producto actual y los productos agotados.
  const relatedProducts = (products || [])
    .filter((item) => {
      // No recomendar el producto que se está consultando.
      if (String(item.id) === String(product.id)) {
        return false;
      }

      // Recomendar únicamente productos de la misma categoría.
      if (item.category !== product.category) {
        return false;
      }

      // Comprobar disponibilidad según el inventario.
      const hasStock = Array.isArray(item.variants) &&
        item.variants.length > 0
          ? item.variants.some(
              (variant) => Number(variant.stock) > 0
            )
          : Number(item.stock) > 0;

      return hasStock;
    })
    .slice(0, 4);

  // Suscripción correspondiente al producto o variante.
  const currentSubscription = (restockSubscriptions || []).find(
    (subscription) =>
      String(subscription.productId) === String(product.id) &&
      String(subscription.variantId ?? '') ===
        String(hasVariants ? selectedVariant?.id ?? '' : '')
  );

  const isSubscribed = Boolean(currentSubscription);

  const list = reviews[product.id] || [];
  const avg = averageRating(list);
  const ratingNum = Number(ratingText);

  // Obtener las tallas y colores existentes en las variantes.
  const sizes = [
    ...new Set(
      variants
        .map((variant) => variant.size)
        .filter(Boolean)
    ),
  ];

  const variantColors = [
    ...new Set(
      variants
        .map((variant) => variant.color)
        .filter(Boolean)
    ),
  ];

  // Seleccionar una variante al cambiar la talla.
  // También permite seleccionar variantes agotadas.
  const handleSelectSize = (newSize) => {
    const matchingVariants = variants.filter(
      (variant) => variant.size === newSize
    );

    const matchingVariant =
      matchingVariants.find(
        (variant) =>
          variant.color === selectedVariant?.color &&
          Number(variant.stock) > 0
      ) ||
      matchingVariants.find(
        (variant) => variant.color === selectedVariant?.color
      ) ||
      matchingVariants.find(
        (variant) => Number(variant.stock) > 0
      ) ||
      matchingVariants[0];

    if (matchingVariant) {
      setSelectedVariantId(matchingVariant.id);
      setQty(1);
    }
  };

  // Seleccionar una variante al cambiar el color.
  // También permite seleccionar variantes agotadas.
  const handleSelectColor = (newColor) => {
    const matchingVariants = variants.filter(
      (variant) => variant.color === newColor
    );

    const matchingVariant =
      matchingVariants.find(
        (variant) =>
          variant.size === selectedVariant?.size &&
          Number(variant.stock) > 0
      ) ||
      matchingVariants.find(
        (variant) => variant.size === selectedVariant?.size
      ) ||
      matchingVariants.find(
        (variant) => Number(variant.stock) > 0
      ) ||
      matchingVariants[0];

    if (matchingVariant) {
      setSelectedVariantId(matchingVariant.id);
      setQty(1);
    }
  };

  // Preguntas correspondientes al producto actual.
  const productQuestions = (questions || []).filter(
    (question) =>
      String(question.productId) === String(product.id)
  );

  // Registrar una pregunta.
  const handleAddQuestion = () => {
    if (addQuestion(product.id, questionText)) {
      setQuestionText('');
    }
  };

  // Agregar al carrito utilizando el ID real de la variante.
  const handleAddToCart = () => {
    if (soldOut) return;

    if (hasVariants) {
      if (!selectedVariant || currentStock <= 0) return;

      addToCart(product, selectedVariant.id, qty);
    } else {
      addToCart(product, size, qty);
    }
  };

  // Solicitar aviso cuando vuelva a existir inventario.
  const handleSubscribeRestock = () => {
    if (!soldOut) return;

    subscribeToRestock(
      product.id,
      hasVariants ? selectedVariant?.id : null
    );
  };

  // Cancelar aviso de reposición.
  const handleCancelRestock = () => {
    if (currentSubscription) {
      cancelRestockSubscription(currentSubscription.id);
    }
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onClose}
      />

      <View style={styles.modal}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 18 }}
        >
          {/* ENCABEZADO */}
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.back}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color="#000"
              />
              <Text style={styles.backText}>Volver</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.heart}
              onPress={() => toggleFavorite(product.id)}
            >
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={30}
                color={isFav ? colors.heart : '#000'}
              />
            </TouchableOpacity>
          </View>

          {/* IMAGEN Y NOMBRE */}
          <ProductImage
            product={product}
            style={styles.image}
            iconSize={110}
          />

          <Text style={styles.name}>{product.name}</Text>

          {/* PRECIO Y CARRITO */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {formatPrice(currentPrice)}
            </Text>

            {!soldOut && (
              <GradientButton onPress={handleAddToCart}>
                <Ionicons
                  name="cart-outline"
                  size={28}
                  color="#000"
                />
              </GradientButton>
            )}
          </View>

          {/* AVISOS DE REPOSICIÓN - HU30 */}
          {soldOut && (
            <View style={styles.restockBox}>
              <Ionicons
                name="notifications-outline"
                size={28}
                color={colors.orange}
              />

              <Text style={styles.restockTitle}>
                ¡Este producto está agotado!
              </Text>

              <Text style={styles.restockDescription}>
                Puedes solicitar una notificación cuando vuelva
                a estar disponible.
              </Text>

              {isSubscribed ? (
                <TouchableOpacity
                  style={styles.cancelRestockButton}
                  onPress={handleCancelRestock}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={19}
                    color="#fff"
                  />

                  <Text style={styles.cancelRestockText}>
                    Cancelar aviso
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.restockButton}
                  onPress={handleSubscribeRestock}
                >
                  <Ionicons
                    name="notifications"
                    size={19}
                    color="#000"
                  />

                  <Text style={styles.restockButtonText}>
                    Avisarme cuando esté disponible
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* INFORMACIÓN DEL PRODUCTO */}
          <Text style={styles.line}>
            <Text style={styles.bold}>Descripción: </Text>
            {product.description}
          </Text>

          <Text style={[styles.line, { marginTop: 8 }]}>
            <Text style={styles.bold}>Categoría: </Text>
            <Text style={styles.accent}>
              {product.category}
            </Text>
          </Text>

          <Text style={[styles.line, { marginTop: 8 }]}>
            <Text style={styles.bold}>Disponibilidad: </Text>

            {soldOut ? (
              <Text style={styles.soldOut}>Agotado</Text>
            ) : (
              <Text style={styles.accent}>
                {currentStock} disponibles
              </Text>
            )}
          </Text>

          {/* SELECCIÓN DE VARIANTES */}
          {(hasVariants || !soldOut) && (
            <View style={styles.options}>
              <View style={styles.variantOptions}>
                {/* TALLAS */}
                {hasVariants && sizes.length > 0 && (
                  <View style={styles.optBox}>
                    <Text style={styles.optTitle}>Talla:</Text>

                    <View style={styles.chipsContainer}>
                      {sizes.map((item) => {
                        const hasStock = variants.some(
                          (variant) =>
                            variant.size === item &&
                            Number(variant.stock) > 0
                        );

                        const isSelected =
                          selectedVariant?.size === item;

                        return (
                          <TouchableOpacity
                            key={item}
                            onPress={() => handleSelectSize(item)}
                            style={[
                              styles.sizeChip,
                              isSelected && styles.sizeActive,
                              !hasStock && styles.disabledChip,
                            ]}
                          >
                            <Text
                              style={[
                                styles.sizeText,
                                !hasStock && styles.disabledText,
                              ]}
                            >
                              {item}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* COLORES */}
                {hasVariants && variantColors.length > 0 && (
                  <View style={styles.optBox}>
                    <Text style={styles.optTitle}>Color:</Text>

                    <View style={styles.chipsContainer}>
                      {variantColors.map((item) => {
                        const hasStock = variants.some(
                          (variant) =>
                            variant.color === item &&
                            Number(variant.stock) > 0
                        );

                        const isSelected =
                          selectedVariant?.color === item;

                        return (
                          <TouchableOpacity
                            key={item}
                            onPress={() => handleSelectColor(item)}
                            style={[
                              styles.sizeChip,
                              isSelected && styles.sizeActive,
                              !hasStock && styles.disabledChip,
                            ]}
                          >
                            <Text
                              style={[
                                styles.sizeText,
                                !hasStock && styles.disabledText,
                              ]}
                            >
                              {item}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* TALLAS PARA PRODUCTOS SIN VARIANTES */}
                {!hasVariants && product.sizes && (
                  <View style={styles.optBox}>
                    <Text style={styles.optTitle}>Talla:</Text>

                    <View style={styles.chipsContainer}>
                      {product.sizes.map((item) => (
                        <TouchableOpacity
                          key={item}
                          onPress={() => setSize(item)}
                          style={[
                            styles.sizeChip,
                            size === item && styles.sizeActive,
                          ]}
                        >
                          <Text style={styles.sizeText}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* CANTIDAD */}
                {!soldOut && (
                  <View style={styles.optBox}>
                    <Text style={styles.optTitle}>Cantidad:</Text>

                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        onPress={() =>
                          setQty(Math.max(1, qty - 1))
                        }
                      >
                        <Text style={styles.qtyBtn}>-</Text>
                      </TouchableOpacity>

                      <Text style={styles.qty}>{qty}</Text>

                      <TouchableOpacity
                        onPress={() =>
                          setQty(Math.min(currentStock, qty + 1))
                        }
                      >
                        <Text style={styles.qtyBtn}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* EMPRENDIMIENTO */}
          <Text style={[styles.line, { marginTop: 14 }]}>
            <Text style={styles.bold}>Emprendimiento: </Text>
            <Text style={styles.accent}>{product.brand}</Text>
          </Text>

          {/* PRODUCTOS RELACIONADOS - HU31 */}
          <View style={styles.relatedBox}>
            <Text style={styles.optTitle}>
              También te puede interesar
            </Text>

            {relatedProducts.length > 0 ? (
              <>
                <Text style={styles.relatedDescription}>
                  Descubre otros productos de esta categoría.
                </Text>

                {relatedProducts.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.relatedItem}
                    activeOpacity={0.8}
                    onPress={() => onSelectProduct?.(item.id)}
                  >
                    <ProductImage
                      product={item}
                      style={styles.relatedImage}
                      iconSize={35}
                    />

                    <View style={styles.relatedInfo}>
                      <Text
                        style={styles.relatedName}
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>

                      <Text style={styles.relatedCategory}>
                        {item.category}
                      </Text>

                      <Text style={styles.relatedPrice}>
                        {formatPrice(item.price)}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={22}
                      color={colors.orange}
                    />
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <View style={styles.noRelated}>
                <Ionicons
                  name="search-outline"
                  size={32}
                  color="#888"
                />

                <Text style={styles.noRelatedTitle}>
                  No hay productos relacionados
                </Text>

                <Text style={styles.noRelatedDescription}>
                  No hay otros productos disponibles en esta
                  categoría por el momento.
                </Text>
              </View>
            )}
          </View>

          {/* VALORACIONES - HU19 */}
          <View style={styles.reviewBox}>
            <Text style={styles.optTitle}>Valoraciones</Text>

            {list.length === 0 ? (
              <Text style={styles.line}>
                Aún no hay valoraciones para este producto.
              </Text>
            ) : (
              <View style={styles.avgRow}>
                <Ionicons
                  name="star"
                  size={20}
                  color={colors.orange}
                />

                <Text style={styles.avg}>
                  {avg.toFixed(1)}
                </Text>

                <Text style={styles.line}>
                  ({list.length}{' '}
                  {list.length === 1
                    ? 'valoración'
                    : 'valoraciones'})
                </Text>
              </View>
            )}

            <Text style={[styles.line, { marginTop: 10 }]}>
              Califica este producto (1 a 5):
            </Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => setRatingText(String(n))}
                >
                  <Ionicons
                    name={
                      ratingNum >= n
                        ? 'star'
                        : 'star-outline'
                    }
                    size={32}
                    color={colors.orange}
                  />
                </TouchableOpacity>
              ))}

              <TextInput
                style={styles.ratingInput}
                value={ratingText}
                onChangeText={setRatingText}
                keyboardType="number-pad"
                placeholder="1-5"
                placeholderTextColor="#777"
                maxLength={3}
              />
            </View>

            <GradientButton
              label="Enviar valoración"
              textStyle={{ fontSize: 14 }}
              style={{ marginTop: 10 }}
              onPress={() => {
                if (addReview(product.id, ratingText)) {
                  setRatingText('');
                }
              }}
            />
          </View>

          {/* PREGUNTAS SOBRE EL PRODUCTO - HU24 */}
          <View style={styles.questionBox}>
            <Text style={styles.optTitle}>
              Preguntas sobre este producto
            </Text>

            <Text style={styles.line}>
              ¿Tienes alguna duda? Escríbenos tu pregunta.
            </Text>

            <TextInput
              style={styles.questionInput}
              value={questionText}
              onChangeText={setQuestionText}
              placeholder="Escribe tu pregunta (mínimo 10 caracteres)"
              placeholderTextColor="#777"
              multiline
              maxLength={300}
            />

            <Text style={styles.questionCounter}>
              {questionText.trim().length}/10 caracteres mínimos
            </Text>

            <GradientButton
              label="Enviar pregunta"
              textStyle={{ fontSize: 14 }}
              style={{ marginTop: 10 }}
              onPress={handleAddQuestion}
            />

            {/* LISTADO DE PREGUNTAS */}
            <Text style={[styles.optTitle, { marginTop: 20 }]}>
              Preguntas realizadas ({productQuestions.length})
            </Text>

            {productQuestions.length === 0 ? (
              <Text style={styles.line}>
                Todavía no hay preguntas. ¡Sé la primera persona en preguntar!
              </Text>
            ) : (
              productQuestions.map((question) => (
                <View
                  key={question.id}
                  style={styles.questionItem}
                >
                  <Text style={styles.questionText}>
                    {question.text}
                  </Text>

                  <Text style={styles.questionMeta}>
                    Fecha: {formatDate(question.date)}
                  </Text>

                  <Text style={styles.questionStatus}>
                    Estado: {question.status}
                  </Text>

                  {/* RESPUESTA */}
                  {question.answer ? (
                    <View style={styles.answerBox}>
                      <Text style={styles.answerLabel}>
                        Respuesta de demostración:
                      </Text>

                      <Text style={styles.answerText}>
                        {question.answer}
                      </Text>
                    </View>
                  ) : (
                    <GradientButton
                      label="Simular respuesta"
                      textStyle={{ fontSize: 13 }}
                      style={{ marginTop: 10 }}
                      onPress={() =>
                        simulateAnswer(question.id)
                      }
                    />
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,243,220,0.85)',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    zIndex: 10,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#000',
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  backText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    marginLeft: 6,
    color: '#000',
  },
  heart: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 240,
    marginTop: 4,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: '#000',
    marginTop: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontFamily: fonts.regular,
    fontSize: 30,
    color: '#000',
  },
  line: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
  },
  bold: {
    fontFamily: fonts.bold,
  },
  accent: {
    fontFamily: fonts.bold,
    color: colors.orange,
  },
  soldOut: {
    fontFamily: fonts.bold,
    color: colors.danger,
  },
  options: {
    flexDirection: 'row',
    marginTop: 14,
  },
  variantOptions: {
    flex: 1,
    gap: 10,
  },
  optBox: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 10,
  },
  optTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    marginBottom: 6,
    color: '#000',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sizeChip: {
    backgroundColor: colors.cardDark,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  sizeActive: {
    borderColor: colors.orange,
  },
  disabledChip: {
    opacity: 0.35,
  },
  disabledText: {
    color: '#777',
  },
  sizeText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#000',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardDark,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
    minWidth: 100,
  },
  qtyBtn: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.orange,
  },
  qty: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#000',
    marginHorizontal: 10,
  },
  reviewBox: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
  },
  avgRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avg: {
    fontFamily: fonts.bold,
    fontSize: 20,
    marginLeft: 4,
    color: '#000',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingInput: {
    marginLeft: 12,
    width: 64,
    height: 38,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 15,
  },

  // AVISOS DE REPOSICIÓN - HU30
  restockBox: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.orange,
  },
  restockTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: '#000',
    marginTop: 8,
    textAlign: 'center',
  },
  restockDescription: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#444',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  restockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    width: '100%',
  },
  cancelRestockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    width: '100%',
  },
  restockButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#000',
    marginLeft: 7,
    textAlign: 'center',
  },
  cancelRestockText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#fff',
    marginLeft: 7,
    textAlign: 'center',
  },

  // PRODUCTOS RELACIONADOS - HU31
  relatedBox: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
  },
  relatedDescription: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#555',
    marginBottom: 10,
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 9,
    marginTop: 8,
  },
  relatedImage: {
    width: 75,
    height: 75,
    borderRadius: 10,
  },
  relatedInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  relatedName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#000',
  },
  relatedCategory: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#666',
    marginTop: 3,
  },
  relatedPrice: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.orange,
    marginTop: 5,
  },
  noRelated: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    paddingHorizontal: 12,
  },
  noRelatedTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#444',
    marginTop: 10,
    textAlign: 'center',
  },
  noRelatedDescription: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 18,
  },

  // ESTILOS DE PREGUNTAS HU24
  questionBox: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
  },
  questionInput: {
    minHeight: 90,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#000',
    marginTop: 8,
  },
  questionCounter: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  questionItem: {
    backgroundColor: colors.cardDark,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  questionText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#000',
  },
  questionMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  questionStatus: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.orange,
    marginTop: 6,
  },
  answerBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  answerLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.success,
  },
  answerText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#000',
    marginTop: 4,
  },
});
