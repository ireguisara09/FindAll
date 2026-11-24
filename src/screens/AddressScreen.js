
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import GradientButton from '../components/GradientButton';

import { colors, fonts } from '../theme';
import { useApp } from '../context/AppContext';

const INITIAL_FORM = {
  alias: '',
  municipio: '',
  reference: '',
};

export default function AddressScreen({ navigate }) {
  const {
    addresses,
    defaultAddress,
    selectedAddress,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
    selectAddress,
    notify,
  } = useApp();

  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  const updateField = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [key]: undefined,
    }));
  };

  // HU25: limpiar el formulario.
  const clearForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setErrors({});
  };

  // HU25: guardar una dirección nueva o editar una existente.
  const handleSave = () => {
    const result = saveAddress(form, editingId);

    if (!result.ok) {
      if (result.errors) {
        setErrors(result.errors);
      }

      notify(result.message || 'No se pudo guardar la dirección.', 'warn');
      return;
    }

    clearForm();
  };

  // HU25: cargar una dirección en el formulario para editarla.
  const handleEdit = (address) => {
    setForm({
      alias: address.alias,
      municipio: address.municipio,
      reference: address.reference,
    });

    setEditingId(address.id);
    setErrors({});

    notify('Puedes modificar los datos de esta dirección.', 'info');
  };

  // HU25: eliminar una dirección con confirmación.
  const handleDelete = (address) => {
    Alert.alert(
      'Eliminar dirección',
      `¿Deseas eliminar la dirección "${address.alias}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const deleted = deleteAddress(address.id);

            if (deleted && editingId === address.id) {
              clearForm();
            }
          },
        },
      ]
    );
  };

  // HU25: marcar como principal.
  const handleDefault = (addressId) => {
    setDefaultAddress(addressId);
  };

  // HU25: seleccionar dirección para la compra.
  const handleSelect = (addressId) => {
    const selected = selectAddress(addressId);

    if (selected) {
      navigate('checkout');
    }
  };

  return (
    <View style={styles.screen}>
      <Header navigate={navigate} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigate('checkout')}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={colors.orange}
            />

            <Text style={styles.backText}>
              Volver a la compra
            </Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            MI LIBRETA DE DIRECCIONES
          </Text>

          <Text style={styles.subtitle}>
            Guarda tus lugares de entrega para realizar tus compras
            de manera más rápida.
          </Text>

          {/* Formulario de registro y edición. */}
          <View style={styles.box}>
            <View style={styles.formHeading}>
              <Ionicons
                name={editingId ? 'create-outline' : 'add-circle-outline'}
                size={23}
                color={colors.orange}
              />

              <Text style={styles.boxTitle}>
                {editingId ? 'Editar dirección' : 'Agregar dirección'}
              </Text>
            </View>

            <Text style={styles.label}>
              Alias de la dirección
            </Text>

            <TextInput
              style={[
                styles.input,
                errors.alias && styles.inputError,
              ]}
              value={form.alias}
              onChangeText={(value) => updateField('alias', value)}
              placeholder="Ej: Casa, Trabajo, Universidad"
              placeholderTextColor="#777"
              maxLength={35}
            />

            {errors.alias ? (
              <Text style={styles.error}>
                {errors.alias}
              </Text>
            ) : null}

            <Text style={styles.label}>
              Municipio
            </Text>

            <TextInput
              style={[
                styles.input,
                errors.municipio && styles.inputError,
              ]}
              value={form.municipio}
              onChangeText={(value) => updateField('municipio', value)}
              placeholder="Ej: Mosquera"
              placeholderTextColor="#777"
              maxLength={50}
            />

            {errors.municipio ? (
              <Text style={styles.error}>
                {errors.municipio}
              </Text>
            ) : null}

            <Text style={styles.label}>
              Dirección o referencia de entrega
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.referenceInput,
                errors.reference && styles.inputError,
              ]}
              value={form.reference}
              onChangeText={(value) => updateField('reference', value)}
              placeholder="Ej: Calle 10 # 5-20, apartamento 302"
              placeholderTextColor="#777"
              multiline
              textAlignVertical="top"
              maxLength={180}
            />

            {errors.reference ? (
              <Text style={styles.error}>
                {errors.reference}
              </Text>
            ) : null}

            <GradientButton
              label={editingId ? 'Guardar cambios' : 'Guardar dirección'}
              onPress={handleSave}
              style={{ marginTop: 18 }}
            />

            {editingId ? (
              <TouchableOpacity
                onPress={clearForm}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>
                  Cancelar edición
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Listado de direcciones guardadas. */}
          <View style={styles.listHeading}>
            <Text style={styles.sectionTitle}>
              Mis direcciones
            </Text>

            <Text style={styles.counter}>
              {addresses.length} {addresses.length === 1 ? 'guardada' : 'guardadas'}
            </Text>
          </View>

          {addresses.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons
                name="location-outline"
                size={48}
                color={colors.orange}
              />

              <Text style={styles.emptyTitle}>
                Aún no tienes direcciones
              </Text>

              <Text style={styles.emptyText}>
                Agrega tu primera dirección para poder utilizarla
                en tus pedidos.
              </Text>
            </View>
          ) : (
            addresses.map((address) => {
              const isDefault = defaultAddress?.id === address.id;
              const isSelected = selectedAddress?.id === address.id;

              return (
                <View
                  key={address.id}
                  style={[
                    styles.addressCard,
                    isSelected && styles.selectedCard,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.aliasContainer}>
                      <View style={styles.locationIcon}>
                        <Ionicons
                          name="location"
                          size={22}
                          color={colors.orange}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.addressAlias}>
                          {address.alias}
                        </Text>

                        <Text style={styles.addressMunicipality}>
                          {address.municipio}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.badges}>
                      {isDefault ? (
                        <Text style={styles.defaultBadge}>
                          Principal
                        </Text>
                      ) : null}

                      {isSelected ? (
                        <Text style={styles.selectedBadge}>
                          Seleccionada
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.referenceContainer}>
                    <Ionicons
                      name="navigate-outline"
                      size={17}
                      color="#555"
                    />

                    <Text style={styles.referenceText}>
                      {address.reference}
                    </Text>
                  </View>

                  <View style={styles.cardActions}>
                    {!isDefault ? (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDefault(address.id)}
                      >
                        <Ionicons
                          name="star-outline"
                          size={17}
                          color={colors.orange}
                        />

                        <Text style={styles.actionText}>
                          Hacer principal
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEdit(address)}
                    >
                      <Ionicons
                        name="create-outline"
                        size={17}
                        color={colors.orange}
                      />

                      <Text style={styles.actionText}>
                        Editar
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDelete(address)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={17}
                        color={colors.danger}
                      />

                      <Text style={[styles.actionText, { color: colors.danger }]}>
                        Eliminar
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <GradientButton
                    label={
                      isSelected
                        ? 'Dirección seleccionada'
                        : 'Usar esta dirección'
                    }
                    onPress={() => handleSelect(address.id)}
                    disabled={isSelected}
                    style={{ marginTop: 12 }}
                  />
                </View>
              );
            })
          )}

          <View style={styles.footerNotice}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.orange}
            />

            <Text style={styles.footerNoticeText}>
              Puedes guardar varias direcciones. La dirección principal
              se utilizará como selección inicial para tus compras.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  backText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.orange,
    marginLeft: 6,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.orange,
    marginBottom: 7,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#444',
    marginBottom: 18,
    lineHeight: 21,
  },
  box: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 15,
    marginBottom: 22,
  },
  formHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  boxTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: '#000',
    marginLeft: 8,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#000',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#000',
  },
  referenceInput: {
    height: 85,
    paddingTop: 12,
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 2,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.danger,
    marginTop: 5,
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.link,
    textAlign: 'center',
  },
  listHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 19,
    color: '#000',
  },
  counter: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#555',
  },
  emptyBox: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: '#000',
    marginTop: 12,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  addressCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: colors.orange,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  aliasContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#FFF0E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addressAlias: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#000',
  },
  addressMunicipality: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#555',
    marginTop: 3,
  },
  badges: {
    alignItems: 'flex-end',
    marginLeft: 5,
  },
  defaultBadge: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.success,
    backgroundColor: '#E7F6EC',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 4,
  },
  selectedBadge: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.orange,
    backgroundColor: '#FFF0E5',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  referenceText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#444',
    marginLeft: 7,
    lineHeight: 19,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 13,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 5,
  },
  actionText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.orange,
    marginLeft: 4,
  },
  footerNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 13,
    marginTop: 5,
  },
  footerNoticeText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#444',
    marginLeft: 8,
    lineHeight: 18,
  },
});
