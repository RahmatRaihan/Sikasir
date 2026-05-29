// ReturForm — Modal form for product return
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Portal, Modal, Button, TextInput, Text } from 'react-native-paper';
import { Colors, Spacing } from '../../constants/theme';
import { formatDateISO } from '../../utils/dateHelper';

interface ReturFormProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: { qtyRetur: number; alasan: string; tanggal: string }) => void;
  produkNama: string;
  stokSaatIni: number;
}

export default function ReturForm({
  visible,
  onDismiss,
  onSubmit,
  produkNama,
  stokSaatIni,
}: ReturFormProps) {
  const [qtyRetur, setQtyRetur] = useState('');
  const [alasan, setAlasan] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const qty = parseInt(qtyRetur);
    if (!qty || qty <= 0) {
      setError('Jumlah retur harus lebih dari 0');
      return;
    }

    setError('');
    onSubmit({
      qtyRetur: qty,
      alasan,
      tanggal: formatDateISO(new Date()),
    });

    setQtyRetur('');
    setAlasan('');
    onDismiss();
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalWrapper}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <View style={styles.dialog}>
            <Text style={styles.title}>Retur Produk</Text>
            <ScrollView style={styles.scrollContent} keyboardShouldPersistTaps="handled">
              <View style={styles.formContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Produk:</Text>
                  <Text style={styles.value}>{produkNama}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Stok Saat Ini:</Text>
                  <Text style={styles.value}>{stokSaatIni}</Text>
                </View>

                <TextInput
                  label="Jumlah Retur *"
                  value={qtyRetur}
                  onChangeText={(text) => setQtyRetur(text.replace(/[^0-9]/g, ''))}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numeric"
                  error={!!error}
                  outlineColor={Colors.border}
                  activeOutlineColor={Colors.primary}
                />
                {error && <Text style={styles.error}>{error}</Text>}

                <TextInput
                  label="Alasan Retur (opsional)"
                  value={alasan}
                  onChangeText={setAlasan}
                  mode="outlined"
                  style={styles.input}
                  multiline
                  numberOfLines={3}
                  outlineColor={Colors.border}
                  activeOutlineColor={Colors.primary}
                />
              </View>
            </ScrollView>
            <View style={styles.actions}>
              <Button onPress={onDismiss} textColor={Colors.textSecondary}>
                Batal
              </Button>
              <Button
                onPress={handleSubmit}
                mode="contained"
                buttonColor={Colors.accent}
                style={styles.submitButton}
              >
                Proses Retur
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    padding: 32,
  },
  keyboardView: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  scrollContent: {
    maxHeight: 320,
  },
  formContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    width: 110,
  },
  value: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  input: {
    marginTop: Spacing.md,
    backgroundColor: Colors.white,
  },
  error: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  submitButton: {
    borderRadius: 8,
  },
});
