// Produk Screen — Product management (CRUD + Retur)
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Searchbar, Button, DataTable, IconButton, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { formatRupiah } from '@/utils/formatRupiah';
import { PENYEDIA_LIST, getPenyediaById } from '@/constants/penyedia';
import FilterBar from '@/components/common/FilterBar';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ProductForm, { type ProductFormData } from '@/components/produk/ProductForm';
import ReturForm from '@/components/produk/ReturForm';
import { getAllProduk, insertProduk, updateProduk, deleteProduk } from '@/db/queries/produk';
import { createRetur } from '@/db/queries/retur';

export default function ProdukScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPenyedia, setSelectedPenyedia] = useState<number | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ visible: boolean; product: any }>({
    visible: false,
    product: null,
  });
  const [returForm, setReturForm] = useState<{ visible: boolean; product: any }>({
    visible: false,
    product: null,
  });

  useEffect(() => {
    loadProducts();
  }, [selectedPenyedia, searchQuery]);

  const loadProducts = async () => {
    try {
      const data = await getAllProduk({
        penyediaId: selectedPenyedia,
        search: searchQuery,
      });
      setProducts(data);
    } catch (e) {
      console.error('Load products error:', e);
    }
  };

  const handleAddProduct = async (data: ProductFormData) => {
    try {
      await insertProduk(data);
      await loadProducts();
      Toast.show({ type: 'success', text1: '✓ Produk ditambahkan', position: 'bottom' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: e.message, position: 'bottom' });
    }
  };

  const handleEditProduct = async (data: ProductFormData) => {
    if (!editProduct) return;
    try {
      await updateProduk(editProduct.id, data);
      await loadProducts();
      setEditProduct(null);
      Toast.show({ type: 'success', text1: '✓ Produk diperbarui', position: 'bottom' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: e.message, position: 'bottom' });
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteDialog.product) return;
    try {
      await deleteProduk(deleteDialog.product.id);
      await loadProducts();
      setDeleteDialog({ visible: false, product: null });
      Toast.show({ type: 'success', text1: '✓ Produk dihapus', position: 'bottom' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: e.message, position: 'bottom' });
    }
  };

  const handleRetur = async (data: { qtyRetur: number; alasan: string; tanggal: string }) => {
    if (!returForm.product) return;
    try {
      await createRetur({
        produkId: returForm.product.id,
        ...data,
      });
      await loadProducts();
      setReturForm({ visible: false, product: null });
      Toast.show({ type: 'success', text1: '✓ Retur berhasil diproses', position: 'bottom' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: e.message, position: 'bottom' });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Data Produk</Text>
          <Text style={styles.headerSubtitle}>{products.length} produk terdaftar</Text>
        </View>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => {
            setEditProduct(null);
            setFormVisible(true);
          }}
          buttonColor={Colors.secondary}
          style={styles.addButton}
          labelStyle={{ fontWeight: '700' }}
        >
          Tambah Produk
        </Button>
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Searchbar
          placeholder="Cari nama produk..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          elevation={0}
        />
        <FilterBar
          selectedPenyediaId={selectedPenyedia}
          onPenyediaChange={setSelectedPenyedia}
        />
      </View>

      {/* Product Table */}
      <View style={styles.tableContainer}>
      <ScrollView horizontal contentContainerStyle={styles.tableScroll}>
        <DataTable style={styles.table}>
          <DataTable.Header style={styles.tableHeader}>
            <DataTable.Title style={styles.colKode}>
              <Text style={styles.headerCell}>Kode Barang</Text>
            </DataTable.Title>
            <DataTable.Title style={styles.colNama}>
              <Text style={styles.headerCell}>Nama Produk</Text>
            </DataTable.Title>
            <DataTable.Title style={styles.colPenyedia}>
              <Text style={styles.headerCell}>Penyedia</Text>
            </DataTable.Title>
            <DataTable.Title style={styles.colPotongan}>
              <Text style={styles.headerCell}>Potongan RS</Text>
            </DataTable.Title>
            <DataTable.Title style={styles.colHarga} numeric>
              <Text style={styles.headerCell}>Harga Jual</Text>
            </DataTable.Title>
            <DataTable.Title style={styles.colStok} numeric>
              <Text style={styles.headerCell}>Stok</Text>
            </DataTable.Title>
            <DataTable.Title style={styles.colAksi}>
              <Text style={styles.headerCell}>Aksi</Text>
            </DataTable.Title>
          </DataTable.Header>

          <ScrollView showsVerticalScrollIndicator={false}>
            {products.map((product) => {
              const penyedia = getPenyediaById(product.penyediaId!);
              const isLowStock = product.stokFisik <= 5;
              const isOutOfStock = product.stokFisik <= 0;

              return (
                <DataTable.Row key={product.id} style={styles.tableRow}>
                  <DataTable.Cell style={styles.colKode}>
                    <Text style={styles.codeText}>{product.kodeBarang}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.colNama}>
                    <Text style={styles.nameText}>{product.namaProduk}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.colPenyedia}>
                    <View style={[styles.penyediaBadge, { backgroundColor: penyedia?.bgColor }]}>
                      <Text style={[styles.penyediaBadgeText, { color: penyedia?.color }]}>
                        {penyedia?.label}
                      </Text>
                    </View>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.colPotongan}>
                    <Text style={styles.cellText}>
                      {product.potonganRs === 'none' ? 'Tanpa Potongan' : product.potonganRs}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.colHarga} numeric>
                    <Text style={styles.priceText}>{formatRupiah(product.hargaJual)}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.colStok} numeric>
                    <Text
                      style={[
                        styles.stokText,
                        isOutOfStock && styles.stokOut,
                        isLowStock && !isOutOfStock && styles.stokLow,
                      ]}
                    >
                      {product.stokFisik}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.colAksi}>
                    <View style={styles.aksiRow}>
                      <IconButton
                        icon="undo-variant"
                        size={22}
                        iconColor={Colors.accent}
                        onPress={() => setReturForm({ visible: true, product })}
                        style={styles.aksiButton}
                      />
                      <IconButton
                        icon="pencil"
                        size={22}
                        iconColor={Colors.primary}
                        onPress={() => {
                          setEditProduct(product);
                          setFormVisible(true);
                        }}
                        style={styles.aksiButton}
                      />
                      <IconButton
                        icon="delete"
                        size={22}
                        iconColor={Colors.danger}
                        onPress={() => setDeleteDialog({ visible: true, product })}
                        style={styles.aksiButton}
                      />
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              );
            })}

            {products.length === 0 && (
              <View style={styles.emptyTable}>
                <MaterialCommunityIcons name="package-variant" size={48} color={Colors.textLight} />
                <Text style={styles.emptyText}>Tidak ada produk ditemukan</Text>
              </View>
            )}
          </ScrollView>
        </DataTable>
      </ScrollView>
      </View>

      {/* Product Form Modal */}
      <ProductForm
        visible={formVisible}
        onDismiss={() => {
          setFormVisible(false);
          setEditProduct(null);
        }}
        onSubmit={editProduct ? handleEditProduct : handleAddProduct}
        initialData={
          editProduct
            ? {
                namaProduk: editProduct.namaProduk,
                penyediaId: editProduct.penyediaId!,
                potonganRs: editProduct.potonganRs || 'none',
                hargaJual: editProduct.hargaJual,
                stokFisik: editProduct.stokFisik,
              }
            : null
        }
        title={editProduct ? 'Edit Produk' : 'Tambah Produk'}
      />

      {/* Retur Form Modal */}
      <ReturForm
        visible={returForm.visible}
        onDismiss={() => setReturForm({ visible: false, product: null })}
        onSubmit={handleRetur}
        produkNama={returForm.product?.namaProduk || ''}
        stokSaatIni={returForm.product?.stokFisik || 0}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={deleteDialog.visible}
        title="Hapus Produk?"
        message={`Apakah Anda yakin ingin menghapus "${deleteDialog.product?.namaProduk}"? Produk dengan riwayat transaksi akan disembunyikan (soft delete).`}
        confirmLabel="Hapus"
        onConfirm={handleDeleteProduct}
        onCancel={() => setDeleteDialog({ visible: false, product: null })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  addButton: {
    borderRadius: BorderRadius.md,
  },
  toolbar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  searchbar: {
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    elevation: 1,
  },
  searchInput: {
    fontSize: 14,
    minHeight: 40,
  },
  tableContainer: {
    flex: 1,
    marginHorizontal: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  tableScroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  table: {
    minWidth: 780,
  },
  tableHeader: {
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  colKode: { width: 110 },
  colNama: { width: 150 },
  colPenyedia: { width: 90 },
  colPotongan: { width: 100 },
  colHarga: { width: 110 },
  colStok: { width: 80 },
  colAksi: { width: 140 },
  codeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  nameText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cellText: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  stokText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stokLow: {
    color: Colors.accent,
  },
  stokOut: {
    color: Colors.danger,
  },
  penyediaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  penyediaBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  aksiRow: {
    flexDirection: 'row',
    gap: 4,
  },
  aksiButton: {
    margin: 0,
    width: 36,
    height: 36,
  },
  emptyTable: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
});
