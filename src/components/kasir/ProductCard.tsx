// ProductCard — Product card for kasir quick menu & home marketplace grid
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { formatRupiah } from '../../utils/formatRupiah';
import { getPenyediaById } from '../../constants/penyedia';

interface ProductCardProps {
  id: number;
  kodeBarang: string;
  namaProduk: string;
  penyediaId: number;
  hargaJual: number;
  stokFisik: number;
  potonganRs: string;
  onAddToCart: () => void;
  compact?: boolean;
}

export default function ProductCard({
  id,
  kodeBarang,
  namaProduk,
  penyediaId,
  hargaJual,
  stokFisik,
  potonganRs,
  onAddToCart,
  compact = false,
}: ProductCardProps) {
  const penyedia = getPenyediaById(penyediaId);
  const isOutOfStock = stokFisik <= 0;
  const isLowStock = stokFisik > 0 && stokFisik <= 5;

  return (
    <Pressable
      onPress={isOutOfStock ? undefined : onAddToCart}
      style={({ pressed }) => [
        styles.card,
        Shadows.sm,
        pressed && !isOutOfStock && styles.cardPressed,
        isOutOfStock && styles.cardDisabled,
        compact && styles.cardCompact,
      ]}
    >
      {/* Product Icon/Placeholder */}
      <View style={[styles.imageContainer, { backgroundColor: penyedia?.bgColor || '#F5F5F5' }]}>
        <MaterialCommunityIcons
          name={(penyedia?.icon || 'package-variant') as any}
          size={compact ? 28 : 36}
          color={penyedia?.color || Colors.textSecondary}
        />
        {potonganRs !== 'none' && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{potonganRs}</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.info}>
        <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={2}>
          {namaProduk}
        </Text>
        {!compact && (
          <Text style={styles.code} numberOfLines={1}>
            {kodeBarang}
          </Text>
        )}
        <Text style={styles.price}>{formatRupiah(hargaJual)}</Text>
        <View style={styles.stockRow}>
          <Text
            style={[
              styles.stock,
              isLowStock && styles.stockLow,
              isOutOfStock && styles.stockOut,
            ]}
          >
            {isOutOfStock ? 'Stok Habis' : `Stok: ${stokFisik}`}
          </Text>
        </View>
      </View>

      {/* Add to Cart Button */}
      {!isOutOfStock && (
        <View style={styles.addButton}>
          <MaterialCommunityIcons name="cart-plus" size={20} color={Colors.white} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    flex: 1,
    margin: Spacing.sm / 2,
    minWidth: 140,
  },
  cardCompact: {
    minWidth: 120,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  imageContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  info: {
    padding: Spacing.sm,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 18,
    marginBottom: 2,
  },
  nameCompact: {
    fontSize: 12,
  },
  code: {
    fontSize: 10,
    color: Colors.textLight,
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stock: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  stockLow: {
    color: Colors.accent,
    fontWeight: '600',
  },
  stockOut: {
    color: Colors.danger,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
