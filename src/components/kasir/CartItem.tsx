// CartItem — Single item in the shopping cart
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { formatRupiah } from '../../utils/formatRupiah';

interface CartItemProps {
  namaProduk: string;
  hargaSatuan: number;
  qty: number;
  stokTersedia: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

export default function CartItem({
  namaProduk,
  hargaSatuan,
  qty,
  stokTersedia,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemProps) {
  const subtotal = hargaSatuan * qty;

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{namaProduk}</Text>
        <Text style={styles.price}>{formatRupiah(hargaSatuan)}</Text>
      </View>

      <View style={styles.qtyContainer}>
        <Pressable
          onPress={onDecrement}
          style={[styles.qtyButton, styles.qtyMinus]}
        >
          <Text style={styles.qtyButtonText}>−</Text>
        </Pressable>
        <View style={styles.qtyDisplay}>
          <Text style={styles.qtyText}>{qty}</Text>
        </View>
        <Pressable
          onPress={onIncrement}
          style={[styles.qtyButton, styles.qtyPlus, qty >= stokTersedia && styles.qtyButtonDisabled]}
          disabled={qty >= stokTersedia}
        >
          <Text style={[styles.qtyButtonText, styles.qtyPlusText]}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.subtotal}>{formatRupiah(subtotal)}</Text>

      <IconButton
        icon="close"
        size={18}
        iconColor={Colors.danger}
        style={styles.deleteButton}
        onPress={onRemove}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  info: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  price: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyMinus: {
    backgroundColor: '#FFEBEE',
  },
  qtyPlus: {
    backgroundColor: Colors.secondary,
  },
  qtyButtonDisabled: {
    opacity: 0.4,
  },
  qtyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.danger,
  },
  qtyPlusText: {
    color: Colors.white,
  },
  qtyDisplay: {
    minWidth: 32,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    width: 100,
    textAlign: 'right',
  },
  deleteButton: {
    margin: 0,
    marginLeft: 4,
  },
});
