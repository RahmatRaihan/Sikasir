// PaymentPanel — Payment section in kasir (total, method, cash input, change)
import React from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { Text, Button, RadioButton, Divider } from 'react-native-paper';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { formatRupiah, parseRupiah } from '../../utils/formatRupiah';

interface PaymentPanelProps {
  totalTagihan: number;
  metodeBayar: string;
  uangDiterima: number;
  kembalian: number;
  isValid: boolean;
  onMetodeChange: (metode: 'tunai' | 'qris') => void;
  onUangDiterimaChange: (amount: number) => void;
  onSelesaikan: () => void;
  onBatalkan: () => void;
  itemCount: number;
}

export default function PaymentPanel({
  totalTagihan,
  metodeBayar,
  uangDiterima,
  kembalian,
  isValid,
  onMetodeChange,
  onUangDiterimaChange,
  onSelesaikan,
  onBatalkan,
  itemCount,
}: PaymentPanelProps) {
  return (
    <View style={styles.container}>
      {/* Total */}
      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>Total Tagihan</Text>
        <Text style={styles.totalValue}>{formatRupiah(totalTagihan)}</Text>
        <Text style={styles.itemCount}>{itemCount} item</Text>
      </View>

      <Divider style={styles.divider} />

      {/* Payment Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
        <RadioButton.Group
          value={metodeBayar}
          onValueChange={(val) => onMetodeChange(val as 'tunai' | 'qris')}
        >
          <View style={styles.radioRow}>
            <View style={styles.radioOption}>
              <RadioButton.Android value="tunai" color={Colors.primary} />
              <Text style={styles.radioLabel}>💵 Tunai</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton.Android value="qris" color={Colors.primary} />
              <Text style={styles.radioLabel}>📱 QRIS</Text>
            </View>
          </View>
        </RadioButton.Group>
      </View>

      {/* Cash Input (only for tunai) */}
      {metodeBayar === 'tunai' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uang Diterima</Text>
          <TextInput
            style={[
              styles.cashInput,
              uangDiterima > 0 && uangDiterima < totalTagihan && styles.cashInputError,
            ]}
            keyboardType="numeric"
            placeholder="Masukkan jumlah uang..."
            placeholderTextColor={Colors.textLight}
            value={uangDiterima > 0 ? uangDiterima.toString() : ''}
            onChangeText={(text) => {
              const num = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
              onUangDiterimaChange(num);
            }}
          />
          {uangDiterima > 0 && uangDiterima < totalTagihan && (
            <Text style={styles.errorText}>Uang kurang {formatRupiah(totalTagihan - uangDiterima)}</Text>
          )}

          {/* Quick amount buttons */}
          <View style={styles.quickAmounts}>
            {[totalTagihan, 50000, 100000, 200000].map((amount) => (
              <Button
                key={amount}
                mode="outlined"
                compact
                onPress={() => onUangDiterimaChange(amount)}
                style={styles.quickButton}
                labelStyle={styles.quickButtonLabel}
              >
                {amount === totalTagihan ? 'Uang Pas' : formatRupiah(amount)}
              </Button>
            ))}
          </View>

          {/* Change */}
          {uangDiterima >= totalTagihan && uangDiterima > 0 && (
            <View style={styles.changeSection}>
              <Text style={styles.changeLabel}>Kembalian</Text>
              <Text style={styles.changeValue}>{formatRupiah(kembalian)}</Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={onSelesaikan}
          disabled={!isValid}
          buttonColor={Colors.secondary}
          style={styles.completeButton}
          labelStyle={styles.completeLabel}
          icon="check-circle"
        >
          Selesaikan Pembayaran
        </Button>
        <Button
          mode="outlined"
          onPress={onBatalkan}
          textColor={Colors.danger}
          style={styles.cancelButton}
          icon="close-circle"
          disabled={itemCount === 0}
        >
          Batalkan
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  totalSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    backgroundColor: `${Colors.primary}08`,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  totalLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 4,
  },
  itemCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    marginVertical: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  radioRow: {
    flexDirection: 'row',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  cashInput: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  cashInputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
    fontWeight: '500',
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.sm,
  },
  quickButton: {
    borderRadius: BorderRadius.md,
    borderColor: Colors.border,
  },
  quickButtonLabel: {
    fontSize: 11,
  },
  changeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  changeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary,
  },
  changeValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.secondary,
  },
  actions: {
    marginTop: 'auto',
    paddingTop: Spacing.md,
  },
  completeButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: 6,
    marginBottom: Spacing.sm,
  },
  completeLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    borderRadius: BorderRadius.md,
    borderColor: Colors.danger,
  },
});
