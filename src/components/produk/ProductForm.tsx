// ProductForm — Modal form for add/edit product
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Dialog, Portal, Modal, Button, TextInput, Text, RadioButton } from 'react-native-paper';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { PENYEDIA_LIST, POTONGAN_RS_OPTIONS } from '../../constants/penyedia';

interface ProductFormProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: ProductFormData) => void;
  initialData?: ProductFormData | null;
  title?: string;
}

export interface ProductFormData {
  namaProduk: string;
  penyediaId: number;
  potonganRs: string;
  hargaJual: number;
  stokFisik: number;
}

export default function ProductForm({
  visible,
  onDismiss,
  onSubmit,
  initialData,
  title = 'Tambah Produk',
}: ProductFormProps) {
  const [namaProduk, setNamaProduk] = useState('');
  const [penyediaId, setPenyediaId] = useState(1);
  const [potonganRs, setPotonganRs] = useState('none');
  const [hargaJual, setHargaJual] = useState('');
  const [stokFisik, setStokFisik] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setNamaProduk(initialData.namaProduk);
      setPenyediaId(initialData.penyediaId);
      setPotonganRs(initialData.potonganRs);
      setHargaJual(initialData.hargaJual.toString());
      setStokFisik(initialData.stokFisik.toString());
    } else {
      resetForm();
    }
  }, [initialData, visible]);

  const resetForm = () => {
    setNamaProduk('');
    setPenyediaId(1);
    setPotonganRs('none');
    setHargaJual('');
    setStokFisik('');
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!namaProduk || namaProduk.length < 3) {
      newErrors.namaProduk = 'Nama produk minimal 3 karakter';
    }
    if (!hargaJual || parseInt(hargaJual) <= 0) {
      newErrors.hargaJual = 'Harga harus lebih dari 0';
    }
    if (stokFisik === '' || parseInt(stokFisik) < 0) {
      newErrors.stokFisik = 'Stok tidak boleh negatif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      namaProduk,
      penyediaId,
      potonganRs,
      hargaJual: parseInt(hargaJual),
      stokFisik: parseInt(stokFisik),
    });

    resetForm();
    onDismiss();
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalWrapper}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <View style={styles.dialog}>
            <Text style={styles.title}>{title}</Text>
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={true} keyboardShouldPersistTaps="handled">
              <View style={styles.formContent}>
                {/* Nama Produk */}
                <TextInput
                  label="Nama Produk *"
                  value={namaProduk}
                  onChangeText={setNamaProduk}
                  mode="outlined"
                  style={styles.input}
                  error={!!errors.namaProduk}
                  outlineColor={Colors.border}
                  activeOutlineColor={Colors.primary}
                />
                {errors.namaProduk && <Text style={styles.error}>{errors.namaProduk}</Text>}

                {/* Penyedia */}
                <Text style={styles.fieldLabel}>Penyedia *</Text>
                <View style={styles.penyediaContainer}>
                  {PENYEDIA_LIST.map((p) => (
                    <Button
                      key={p.id}
                      mode={penyediaId === p.id ? 'contained' : 'outlined'}
                      onPress={() => setPenyediaId(p.id)}
                      style={styles.penyediaButton}
                      buttonColor={penyediaId === p.id ? p.color : undefined}
                      textColor={penyediaId === p.id ? Colors.white : p.color}
                      compact
                    >
                      {p.label}
                    </Button>
                  ))}
                </View>

                {/* Potongan RS */}
                <Text style={styles.fieldLabel}>Potongan RS *</Text>
                <RadioButton.Group value={potonganRs} onValueChange={setPotonganRs}>
                  <View style={styles.radioGroup}>
                    {POTONGAN_RS_OPTIONS.map((opt) => (
                      <View key={opt.value} style={styles.radioItem}>
                        <RadioButton.Android value={opt.value} color={Colors.primary} />
                        <Text style={styles.radioLabel}>{opt.label}</Text>
                      </View>
                    ))}
                  </View>
                </RadioButton.Group>

                {/* Harga Jual */}
                <TextInput
                  label="Harga Jual (Rp) *"
                  value={hargaJual}
                  onChangeText={(text) => setHargaJual(text.replace(/[^0-9]/g, ''))}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numeric"
                  error={!!errors.hargaJual}
                  outlineColor={Colors.border}
                  activeOutlineColor={Colors.primary}
                  left={<TextInput.Affix text="Rp" />}
                />
                {errors.hargaJual && <Text style={styles.error}>{errors.hargaJual}</Text>}

                {/* Stok Fisik */}
                <TextInput
                  label="Stok Fisik *"
                  value={stokFisik}
                  onChangeText={(text) => setStokFisik(text.replace(/[^0-9]/g, ''))}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numeric"
                  error={!!errors.stokFisik}
                  outlineColor={Colors.border}
                  activeOutlineColor={Colors.primary}
                />
                {errors.stokFisik && <Text style={styles.error}>{errors.stokFisik}</Text>}
              </View>
            </ScrollView>
            <View style={styles.actions}>
              <Button onPress={onDismiss} textColor={Colors.textSecondary}>
                Batal
              </Button>
              <Button
                onPress={handleSubmit}
                mode="contained"
                buttonColor={Colors.primary}
                style={styles.submitButton}
              >
                Simpan
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
    maxWidth: 480,
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '100%',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  scrollArea: {
    maxHeight: 380,
  },
  formContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  input: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  penyediaContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  penyediaButton: {
    borderRadius: BorderRadius.md,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  radioLabel: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  error: {
    fontSize: 12,
    color: Colors.danger,
    marginBottom: Spacing.sm,
    marginTop: -8,
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
