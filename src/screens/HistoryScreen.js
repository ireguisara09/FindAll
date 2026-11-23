import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import ProductImage from '../components/ProductImage';
import { EmptyState } from './HomeScreen';
import { colors, fonts, formatPrice, formatDate, formatLongDate, DELIVERY_WINDOW } from '../theme';
import { useApp } from '../context/AppContext';

const unitsIn = (o) => o.items.reduce((s, it) => s + (Number(it.qty) || 0), 0);

export default function HistoryScreen({ navigate }) {
  const { orders, getProduct } = useApp();
  const [code, setCode] = useState(null);
  const order = orders.find((o) => o.code === code);

  // Imagen del primer artículo (si el producto ya no existe se muestra el ícono de su categoría)
  const imageOf = (it) => getProduct(it.productId) || { category: it.category, image: null };

  return (
    <View style={styles.screen}>
      <Header navigate={navigate} />

      {/* ----- Lista (HU15 CA01 / CA04) ----- */}
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>HISTORIAL DE PEDIDOS</Text>

        {orders.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            text="Aún no hay pedidos registrados."
            action="Ir al catálogo"
            onAction={() => navigate('home')}
          />
        ) : (
          orders.map((o) => {
            const n = unitsIn(o);
            return (
              <TouchableOpacity key={o.code} style={styles.orderCard} onPress={() => setCode(o.code)} activeOpacity={0.85}>
                <ProductImage product={imageOf(o.items[0])} style={styles.thumb} iconSize={40} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.small}>Código de pedido:</Text>
                  <Text style={styles.orderCode}>{o.code.split('').join(' ')}</Text>
                  <Text style={styles.small}>Pedido: {formatDate(o.date)}</Text>
                  <Text style={styles.small}>Entrega aproximada:</Text>
                  <Text style={styles.delivery}>{formatLongDate(o.deliveryDate || o.date)}</Text>
                  <Text style={styles.deliveryTime}>{DELIVERY_WINDOW}</Text>
                  <Text style={styles.total}>Total: {formatPrice(o.total)}</Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{n} {n === 1 ? 'Producto' : 'Productos'}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* ----- Detalle de un pedido (HU15 CA02): ventana sobre la lista, como el prototipo ----- */}
      {order && (
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <TouchableOpacity style={styles.close} onPress={() => setCode(null)}>
                <Ionicons name="close" size={30} color={colors.danger} />
              </TouchableOpacity>

              <Text style={styles.small}>Código de pedido:</Text>
              <Text style={styles.orderCode}>{order.code.split('').join(' ')}</Text>
              <Text style={styles.small}>Pedido: {formatDate(order.date)}</Text>
              <Text style={styles.small}>
                Entrega aproximada: {formatLongDate(order.deliveryDate || order.date)}, {DELIVERY_WINDOW}
              </Text>

              {order.items.map((it, i) => (
                <View key={i} style={styles.item}>
                  <ProductImage product={imageOf(it)} style={styles.itemImg} iconSize={40} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.itemName}>{it.name}</Text>
                    <Text style={styles.line}>Emprendimiento: <Text style={styles.accent}>{it.brand}</Text></Text>
                    {it.size ? <Text style={styles.line}>Talla: <Text style={styles.accent}>{it.size}</Text></Text> : null}
                    <Text style={styles.line}>Cantidad: <Text style={styles.accent}>{it.qty}</Text></Text>
                    <Text style={styles.line}>
                      Precio unitario: <Text style={styles.accent}>{formatPrice(it.unitPrice)}</Text>
                    </Text>
                  </View>
                </View>
              ))}

              <View style={styles.sumBox}>
                <Text style={styles.sumLine}><Text style={styles.bold}>Subtotal:  </Text>{formatPrice(order.subtotal)}</Text>
                {order.discount > 0 && (
                  <Text style={styles.sumLine}>
                    <Text style={styles.bold}>Descuento ({order.coupon}):  </Text>
                    <Text style={styles.accent}>-{formatPrice(order.discount)}</Text>
                  </Text>
                )}
                <Text style={styles.sumLine}>
                  <Text style={styles.bold}>Costo de envío:  </Text>
                  {order.shipping === 0 ? <Text style={styles.accent}>Gratis</Text> : formatPrice(order.shipping)}
                </Text>
                <Text style={styles.sumLine}><Text style={styles.bold}>Total:  </Text>{formatPrice(order.total)}</Text>
              </View>

              {order.buyer ? (
                <View style={styles.sumBox}>
                  <Text style={styles.bold}>Entrega</Text>
                  <Text style={styles.sumLine}>{order.buyer.name} · {order.buyer.phone}</Text>
                  <Text style={styles.sumLine}>{order.buyer.municipio} · {order.buyer.address}</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontFamily: fonts.bold, fontSize: 26, color: colors.orange, marginBottom: 12 },
  orderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 20, padding: 12, marginBottom: 14 },
  thumb: { width: 100, height: 120 },
  small: { fontFamily: fonts.medium, fontSize: 12, color: '#222', marginTop: 2 },
  orderCode: { fontFamily: fonts.bold, fontSize: 20, color: colors.orange, letterSpacing: 1 },
  delivery: { fontFamily: fonts.bold, fontSize: 16, color: colors.orange },
  deliveryTime: { fontFamily: fonts.regular, fontSize: 12, color: colors.orange },
  total: { fontFamily: fonts.bold, fontSize: 15, color: '#000', marginTop: 4 },
  pill: { position: 'absolute', right: 10, bottom: 10, backgroundColor: colors.cardDark, borderRadius: 14, paddingVertical: 4, paddingHorizontal: 10 },
  pillText: { fontFamily: fonts.bold, fontSize: 12, color: colors.orange },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,243,220,0.85)', justifyContent: 'center', padding: 16, zIndex: 10 },
  modal: { maxHeight: '88%', backgroundColor: colors.bg, borderRadius: 22, borderWidth: 1, borderColor: '#000', overflow: 'hidden' },
  close: { alignSelf: 'flex-end', width: 44, height: 44, borderRadius: 22, backgroundColor: colors.circle, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 10, marginTop: 12 },
  itemImg: { width: 100, height: 110 },
  itemName: { fontFamily: fonts.bold, fontSize: 15, color: '#000', marginBottom: 2 },
  line: { fontFamily: fonts.bold, fontSize: 13, color: '#000', marginVertical: 2 },
  bold: { fontFamily: fonts.bold, fontSize: 15, color: '#000' },
  accent: { fontFamily: fonts.bold, color: colors.orange },
  sumBox: { backgroundColor: colors.card, borderRadius: 16, padding: 12, marginTop: 12 },
  sumLine: { fontFamily: fonts.regular, fontSize: 15, color: '#000', marginVertical: 3 },
});
