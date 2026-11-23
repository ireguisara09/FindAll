import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, formatPrice } from '../theme';

// Resumen de compra (HU11 / HU17): subtotal, descuento, envío y total.
export default function SummaryBox({ totals, coupon }) {
  const { subtotal, discount, shipping, total } = totals;
  return (
    <View style={styles.box}>
      <Text style={styles.title}>Resumen de compra</Text>
      <Text style={styles.line}>
        <Text style={styles.bold}>Subtotal:  </Text>
        {formatPrice(subtotal)}
      </Text>
      {discount > 0 && (
        <Text style={styles.line}>
          <Text style={styles.bold}>Descuento ({coupon}):  </Text>
          <Text style={styles.accent}>-{formatPrice(discount)}</Text>
        </Text>
      )}
      <Text style={styles.line}>
        <Text style={styles.bold}>Costo de envío:  </Text>
        {subtotal > 0 && shipping === 0 ? (
          <Text style={styles.accent}>Gratis (compras desde $150.000)</Text>
        ) : (
          formatPrice(shipping)
        )}
      </Text>
      <Text style={styles.line}>
        <Text style={styles.bold}>Total:  </Text>
        {formatPrice(total)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.card, borderRadius: 18, padding: 14, marginBottom: 14 },
  title: { fontFamily: fonts.bold, fontSize: 16, color: '#000', marginBottom: 6 },
  line: { fontFamily: fonts.regular, fontSize: 15, color: '#000', marginVertical: 5 },
  bold: { fontFamily: fonts.bold },
  accent: { fontFamily: fonts.bold, color: colors.orange },
});
