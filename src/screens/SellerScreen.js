
import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import GradientButton from '../components/GradientButton';
import ProductImage from '../components/ProductImage';
import { colors, fonts, formatPrice, PRODUCT_CATEGORIES } from '../theme';
import { useApp } from '../context/AppContext';

const EMPTY = {
  name: '',
  price: '',
  stock: '',
  category: '',
  description: '',
  brand: '',
};

// Panel de vendedor: creación, edición y reposición de productos.
export default function SellerScreen({ navigate, startInForm = false }) {
  const {
    products,
    saveProduct,
    notify,
    seller,
    simulateRestock,
  } = useApp();

  const mine = products.filter(
    (p) => !p.owner || p.owner === seller?.email
  );

  const [mode, setMode] = useState(startInForm ? 'form' : 'list');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  // Estados del simulador HU30
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockVariantId, setRestockVariantId] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState('5');

  const openNew = () => {
    setEditId(null);
    setForm(EMPTY);
    setErrors({});
    setMode('form');
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      price: String(p.price),
      stock: String(p.stock),
      category: p.category,
      description: p.description,
      brand: p.brand,
    });
    setErrors({});
    setMode('form');
  };

  const save = () => {
    const r = saveProduct(form, editId);

    if (!r.ok) {
      setErrors(r.errors);
      notify('Revisa los datos: ' + Object.values(r.errors)[0], 'error');
      return;
    }

    setMode('list');
  };

  // Abre el simulador para el producto seleccionado.
  const openRestock = (product) => {
    const variants = Array.isArray(product.variants)
      ? product.variants
      : [];

    const firstOutOfStock = variants.find(
      (variant) => Number(variant.stock) <= 0
    );

    setRestockProduct(product);
    setRestockVariantId(firstOutOfStock?.id ?? null);
    setRestockQuantity('5');
  };

  // Ejecuta la reposición desde AppContext.
  const confirmRestock = () => {
    if (!restockProduct) return;

    const quantity = Number(restockQuantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      notify('Ingresa una cantidad válida de unidades.', 'error');
      return;
    }

    const variants = Array.isArray(restockProduct.variants)
      ? restockProduct.variants
      : [];

    if (variants.length > 0 && restockVariantId === null) {
      notify('Selecciona una variante para reponer.', 'error');
      return;
    }

    const result = simulateRestock(
      restockProduct.id,
      restockVariantId,
      quantity
    );

    if (result) {
      setRestockProduct(null);
      setRestockVariantId(null);
      setRestockQuantity('5');
    }
  };

  if (mode === 'form') {
    return (
      <View style={styles.screen}>
        <Header navigate={navigate} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>
              {editId ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}
            </Text>

            <View style={styles.box}>
              <Field
                label="Nombre"
                placeholder="Ingrese el nombre del producto"
                value={form.name}
                error={errors.name}
                onChange={(t) => setForm({ ...form, name: t })}
              />

              <Field
                label="Precio (COP)"
                placeholder="ej: 88000"
                value={form.price}
                error={errors.price}
                keyboard="numeric"
                onChange={(t) => setForm({ ...form, price: t })}
              />

              <Field
                label="Stock (unidades)"
                placeholder="Ingrese el stock del producto"
                value={form.stock}
                error={errors.stock}
                keyboard="number-pad"
                onChange={(t) => setForm({ ...form, stock: t })}
              />

              <Text style={styles.label}>Categoría</Text>

              <View style={styles.chips}>
                {PRODUCT_CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setForm({ ...form, category: c })}
                    style={[
                      styles.chip,
                      form.category === c && styles.chipActive,
                    ]}
                  >
                    <Text style={styles.chipText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {errors.category && (
                <Text style={styles.error}>{errors.category}</Text>
              )}

              <Field
                label="Descripción"
                placeholder="Ingrese una descripción para su producto"
                value={form.description}
                multiline
                onChange={(t) => setForm({ ...form, description: t })}
              />

              <Field
                label="Emprendimiento"
                placeholder="Ingrese el nombre de su emprendimiento"
                value={form.brand}
                onChange={(t) => setForm({ ...form, brand: t })}
              />
            </View>

            <GradientButton
              label={editId ? 'Guardar cambios' : 'Crear producto'}
              onPress={save}
            />

            <TouchableOpacity
              onPress={() => setMode('list')}
              style={{ marginTop: 14 }}
            >
              <Text style={styles.link}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header navigate={navigate} />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>PANEL DE VENDEDOR</Text>

        <GradientButton
          label="Nuevo producto"
          onPress={openNew}
          style={{ marginBottom: 14 }}
          textStyle={{ fontSize: 16 }}
          right={
            <Ionicons
              name="add"
              size={24}
              color="#000"
              style={{ marginLeft: 8 }}
            />
          }
        />

        {/* SIMULADOR DE REPOSICIÓN HU30 */}
        {restockProduct && (
          <View style={styles.restockBox}>
            <View style={styles.restockHeader}>
              <View style={styles.restockIcon}>
                <Ionicons
                  name="cube-outline"
                  size={24}
                  color={colors.orange}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.restockTitle}>
                  SIMULAR REPOSICIÓN
                </Text>
                <Text style={styles.restockSubtitle}>
                  {restockProduct.name}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setRestockProduct(null)}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={25}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.restockDescription}>
              Indica cuántas unidades deseas agregar al inventario.
              Los compradores suscritos recibirán una notificación.
            </Text>

            {Array.isArray(restockProduct.variants) &&
              restockProduct.variants.length > 0 && (
                <>
                  <Text style={styles.label}>
                    Selecciona la variante
                  </Text>

                  <View style={styles.chips}>
                    {restockProduct.variants.map((variant) => {
                      const selected =
                        String(restockVariantId) === String(variant.id);

                      return (
                        <TouchableOpacity
                          key={variant.id}
                          onPress={() => setRestockVariantId(variant.id)}
                          style={[
                            styles.chip,
                            selected && styles.chipActive,
                          ]}
                        >
                          <Text style={styles.chipText}>
                            {variant.label} ({variant.stock} disponibles)
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

            <Text style={styles.label}>
              Cantidad que se va a reponer
            </Text>

            <TextInput
              style={styles.input}
              value={restockQuantity}
              onChangeText={setRestockQuantity}
              keyboardType="number-pad"
              placeholder="Ejemplo: 10"
              placeholderTextColor="#777"
            />

            <View style={styles.restockButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setRestockProduct(null)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmRestock}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={19}
                  color="#fff"
                />
                <Text style={styles.confirmButtonText}>
                  Confirmar reposición
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* LISTADO DE PRODUCTOS */}
        {mine.map((p) => (
          <View key={p.id} style={styles.row}>
            <ProductImage
              product={p}
              style={styles.thumb}
              iconSize={30}
            />

            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.name} numberOfLines={2}>
                {p.name}
              </Text>

              <Text style={styles.meta}>
                {p.category} · {formatPrice(p.price)} ·{' '}
                {p.stock <= 0 ? 'Agotado' : `${p.stock} en stock`}
              </Text>

              {!p.owner && (
                <Text style={styles.tag}>Catálogo inicial</Text>
              )}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.edit}
                onPress={() => openEdit(p)}
              >
                <Ionicons
                  name="create-outline"
                  size={22}
                  color={colors.orange}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.restockButton}
                onPress={() => openRestock(p)}
              >
                <Ionicons
                  name="refresh-outline"
                  size={21}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {mine.length === 0 && (
          <Text style={styles.emptyText}>
            Todavía no tienes productos registrados.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  keyboard,
  multiline,
  placeholder,
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={[
          styles.input,
          multiline && {
            height: 90,
            textAlignVertical: 'top',
            paddingTop: 10,
          },
          error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard || 'default'}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor="#777"
      />

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.orange,
    marginBottom: 12,
  },
  box: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#000',
    marginTop: 8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: '#000',
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 2,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: colors.cardDark,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActive: {
    borderColor: colors.orange,
    backgroundColor: colors.yellow,
  },
  chipText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#000',
  },
  link: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.link,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
  },
  thumb: {
    width: 58,
    height: 58,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#000',
  },
  tag: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.orange,
    marginTop: 2,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#444',
    marginTop: 2,
  },
  actions: {
    alignItems: 'center',
    gap: 7,
  },
  edit: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: colors.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restockButton: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restockBox: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: colors.orange,
  },
  restockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  restockIcon: {
    width: 42,
    height: 42,
    borderRadius: 22,
    backgroundColor: colors.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restockTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.orange,
  },
  restockSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  restockDescription: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#555',
    lineHeight: 19,
    marginBottom: 8,
  },
  restockButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: fonts.bold,
    color: '#444',
    fontSize: 13,
  },
  confirmButton: {
    flex: 2,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmButtonText: {
    fontFamily: fonts.bold,
    color: '#fff',
    fontSize: 13,
  },
  emptyText: {
    fontFamily: fonts.regular,
    color: '#666',
    textAlign: 'center',
    marginTop: 25,
  },
});
