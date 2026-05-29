// Kasir Screen — Split view: product catalog (55%) + cart & payment (45%)
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, ScrollView, TextInput, KeyboardAvoidingView, Platform, Keyboard, RefreshControl, Alert } from 'react-native';
import { Text, Searchbar, Divider, Portal, Modal, Button, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Colors, Spacing, BorderRadius, Shadows, Layout } from '@/constants/theme';
import { formatRupiah } from '@/utils/formatRupiah';
import { formatTanggal, formatWaktu } from '@/utils/dateHelper';
import ProductCard from '@/components/kasir/ProductCard';
import CartItem from '@/components/kasir/CartItem';
import PaymentPanel from '@/components/kasir/PaymentPanel';
import FilterBar from '@/components/common/FilterBar';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useCartStore } from '@/store/cartStore';
import { getAllProduk } from '@/db/queries/produk';
import { createTransaksi } from '@/db/queries/transaksi';

export default function KasirScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedPenyedia, setSelectedPenyedia] = useState<number | null>(null);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [paymentDialogVisible, setPaymentDialogVisible] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [lastTransaksi, setLastTransaksi] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const cart = useCartStore();

  // Load products
  useEffect(() => {
    loadProducts();
  }, [selectedPenyedia]);

  const loadProducts = async () => {
    try {
      const data = await getAllProduk({
        penyediaId: selectedPenyedia,
      });
      setProducts(data);
    } catch (e) {
      console.error('Load products error:', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  // Search autocomplete
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 1) {
      const results = await getAllProduk({ search: query });
      setSearchResults(results);
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
      setSearchResults([]);
    }
  }, []);

  const handleAddToCart = useCallback(
    (product: any) => {
      if (product.stokFisik <= 0) {
        Toast.show({
          type: 'error',
          text1: 'Stok Habis',
          text2: `${product.namaProduk} tidak tersedia`,
          position: 'bottom',
        });
        return;
      }
      cart.addItem({
        produkId: product.id,
        kodeBarang: product.kodeBarang,
        namaProduk: product.namaProduk,
        penyediaId: product.penyediaId,
        hargaSatuan: product.hargaJual,
        potonganRs: product.potonganRs || 'none',
        stokTersedia: product.stokFisik,
      });
      setShowAutocomplete(false);
      setSearchQuery('');
      Toast.show({
        type: 'success',
        text1: '✓ Ditambahkan',
        text2: product.namaProduk,
        visibilityTime: 1500,
        position: 'bottom',
      });
    },
    [cart]
  );

  const handleSelesaikanPembayaran = () => {
    setPaymentDialogVisible(true);
  };

  const executePembayaran = async () => {
    setLoading(true);
    try {
      const total = cart.getTotalTagihan();
      const result = await createTransaksi({
        items: cart.items,
        metodeBayar: cart.metodeBayar,
        totalTagihan: total,
        uangDiterima: cart.metodeBayar === 'tunai' ? cart.uangDiterima : null,
        kembalian: cart.metodeBayar === 'tunai' ? cart.getKembalian() : null,
      });

      setLastTransaksi({
        ...result,
        items: [...cart.items],
        total,
        metodeBayar: cart.metodeBayar,
        uangDiterima: cart.uangDiterima,
        kembalian: cart.getKembalian(),
      });

      cart.clearCart();
      await loadProducts(); // Refresh stok
      setReceiptVisible(true);

      Toast.show({
        type: 'success',
        text1: '✅ Transaksi Berhasil',
        text2: `No: ${result.nomorTransaksi}`,
        visibilityTime: 3000,
        position: 'bottom',
      });
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Gagal',
        text2: e.message || 'Terjadi kesalahan',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBatalkan = () => {
    if (cart.items.length > 0) {
      setCancelDialogVisible(true);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="cash-register" size={24} color={Colors.white} />
        <Text style={styles.headerTitle}>Layar Kasir</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <Text style={styles.headerTime}>{formatTanggal(new Date())} • {formatWaktu(new Date())}</Text>
          <IconButton
            icon="refresh"
            iconColor={Colors.white}
            size={20}
            onPress={loadProducts}
            style={{ margin: 0 }}
          />
        </View>
      </View>

      <View style={styles.splitView}>
        {/* LEFT PANEL — Product Catalog (60%) */}
        <View style={styles.leftPanel}>
          {/* Search with Autocomplete */}
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Cari nama produk atau kode..."
              value={searchQuery}
              onChangeText={handleSearch}
              onFocus={() => searchQuery.length >= 1 && setShowAutocomplete(true)}
              style={styles.searchbar}
              inputStyle={styles.searchInput}
              elevation={0}
            />
            {/* Autocomplete Dropdown */}
            {showAutocomplete && searchResults.length > 0 && (
              <View style={[styles.autocomplete, Shadows.lg]}>
                {searchResults.map((item: any) => (
                  <React.Fragment key={item.id}>
                    <View style={styles.autocompleteItem}>
                      <View style={styles.autocompleteInfo}>
                        <Text style={styles.autocompleteName}>{item.namaProduk}</Text>
                        <Text style={styles.autocompleteCode}>
                          {item.kodeBarang} • Stok: {item.stokFisik}
                        </Text>
                      </View>
                      <Text style={styles.autocompletePrice}>{formatRupiah(item.hargaJual)}</Text>
                      <IconButton
                        icon="cart-plus"
                        size={20}
                        iconColor={Colors.secondary}
                        onPress={() => handleAddToCart(item)}
                      />
                    </View>
                    <Divider />
                  </React.Fragment>
                ))}
              </View>
            )}
          </View>

          {/* Filter Chips */}
          <FilterBar
            selectedPenyediaId={selectedPenyedia}
            onPenyediaChange={setSelectedPenyedia}
          />

          {/* Product Grid */}
          <FlatList
            data={products}
            numColumns={2}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.productList}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
            renderItem={({ item }) => (
              <ProductCard
                id={item.id}
                kodeBarang={item.kodeBarang}
                namaProduk={item.namaProduk}
                penyediaId={item.penyediaId!}
                hargaJual={item.hargaJual}
                stokFisik={item.stokFisik}
                potonganRs={item.potonganRs || 'none'}
                onAddToCart={() => handleAddToCart(item)}
                compact
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyProducts}>
                <MaterialCommunityIcons name="package-variant" size={48} color={Colors.textLight} />
                <Text style={styles.emptyText}>Tidak ada produk ditemukan</Text>
              </View>
            }
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* RIGHT PANEL — Cart & Payment (45%) */}
        <View style={styles.rightPanel}>
        <ScrollView contentContainerStyle={styles.rightPanelContent} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>🛒 Keranjang</Text>
            <Text style={styles.cartCount}>{cart.getTotalItems()} item</Text>
          </View>

          {/* Cart Items */}
          {cart.items.length === 0 ? (
            <View style={styles.emptyCart}>
              <MaterialCommunityIcons name="cart-outline" size={48} color={Colors.textLight} />
              <Text style={styles.emptyText}>Keranjang kosong</Text>
              <Text style={styles.emptyHint}>Klik produk untuk menambahkan</Text>
            </View>
          ) : (
            <View style={styles.cartItems}>
              {cart.items.map((item) => (
                <CartItem
                  key={item.produkId}
                  namaProduk={item.namaProduk}
                  hargaSatuan={item.hargaSatuan}
                  qty={item.qty}
                  stokTersedia={item.stokTersedia}
                  onIncrement={() => cart.incrementQty(item.produkId)}
                  onDecrement={() => cart.decrementQty(item.produkId)}
                  onRemove={() => cart.removeItem(item.produkId)}
                />
              ))}
            </View>
          )}

          <Divider style={{ marginVertical: Spacing.sm }} />

          {/* Payment Panel */}
          <PaymentPanel
            totalTagihan={cart.getTotalTagihan()}
            metodeBayar={cart.metodeBayar}
            uangDiterima={cart.uangDiterima}
            kembalian={cart.getKembalian()}
            isValid={cart.isPaymentValid()}
            loading={loading}
            onMetodeChange={cart.setMetodeBayar}
            onUangDiterimaChange={cart.setUangDiterima}
            onSelesaikan={handleSelesaikanPembayaran}
            onBatalkan={handleBatalkan}
            itemCount={cart.getTotalItems()}
          />
        </ScrollView>
        </View>
      </View>

      {/* Cancel Confirmation */}
      <ConfirmDialog
        visible={cancelDialogVisible}
        title="Batalkan Transaksi?"
        message="Semua item di keranjang akan dihapus. Anda yakin?"
        confirmLabel="Ya, Batalkan"
        onConfirm={() => {
          cart.clearCart();
          setCancelDialogVisible(false);
        }}
        onCancel={() => setCancelDialogVisible(false)}
      />

      {/* Payment Confirmation */}
      <ConfirmDialog
        visible={paymentDialogVisible}
        title="Konfirmasi Pembayaran"
        message={
          `Selesaikan transaksi ini?\n\n` +
          `Total Tagihan: ${formatRupiah(cart.getTotalTagihan())}\n` +
          `Metode Bayar: ${cart.metodeBayar === 'qris' ? '📱 QRIS' : '💵 TUNAI'}` +
          (cart.metodeBayar === 'tunai' && cart.uangDiterima > 0
            ? `\nUang Diterima: ${formatRupiah(cart.uangDiterima)}\nKembalian: ${formatRupiah(cart.getKembalian())}`
            : '')
        }
        confirmLabel="Ya, Selesaikan"
        confirmColor={Colors.secondary}
        onConfirm={() => {
          setPaymentDialogVisible(false);
          executePembayaran();
        }}
        onCancel={() => setPaymentDialogVisible(false)}
      />

      {/* Receipt Modal */}
      <Portal>
        <Modal
          visible={receiptVisible}
          onDismiss={() => setReceiptVisible(false)}
          contentContainerStyle={styles.receiptModal}
        >
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptLogo}>🏥 SiKasir RS Rubini</Text>
            <Text style={styles.receiptSeparator}>{'═'.repeat(36)}</Text>
          </View>

          {lastTransaksi && (
            <ScrollView>
              <Text style={styles.receiptInfo}>No: {lastTransaksi.nomorTransaksi}</Text>
              <Text style={styles.receiptInfo}>Tgl: {lastTransaksi.tanggal}</Text>
              <Text style={styles.receiptInfo}>Metode: {lastTransaksi.metodeBayar.toUpperCase()}</Text>
              <Text style={styles.receiptSeparator}>{'─'.repeat(36)}</Text>

              {lastTransaksi.items.map((item: any, i: number) => (
                <View key={i} style={styles.receiptItem}>
                  <Text style={styles.receiptItemName}>{item.namaProduk}</Text>
                  <Text style={styles.receiptItemDetail}>
                    {item.qty} x {formatRupiah(item.hargaSatuan)} = {formatRupiah(item.hargaSatuan * item.qty)}
                  </Text>
                </View>
              ))}

              <Text style={styles.receiptSeparator}>{'─'.repeat(36)}</Text>
              <View style={styles.receiptTotalRow}>
                <Text style={styles.receiptTotalLabel}>TOTAL</Text>
                <Text style={styles.receiptTotalValue}>{formatRupiah(lastTransaksi.total)}</Text>
              </View>
              {lastTransaksi.metodeBayar === 'tunai' && (
                <>
                  <View style={styles.receiptTotalRow}>
                    <Text style={styles.receiptInfo}>Dibayar</Text>
                    <Text style={styles.receiptInfo}>{formatRupiah(lastTransaksi.uangDiterima)}</Text>
                  </View>
                  <View style={styles.receiptTotalRow}>
                    <Text style={styles.receiptInfo}>Kembalian</Text>
                    <Text style={styles.receiptInfo}>{formatRupiah(lastTransaksi.kembalian)}</Text>
                  </View>
                </>
              )}
              <Text style={styles.receiptSeparator}>{'═'.repeat(36)}</Text>
              <Text style={styles.receiptThank}>Terima kasih atas kunjungan Anda!</Text>
            </ScrollView>
          )}

          <Button
            mode="contained"
            onPress={() => setReceiptVisible(false)}
            buttonColor={Colors.primary}
            style={{ marginTop: Spacing.lg, borderRadius: 8 }}
          >
            Tutup
          </Button>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingTop: Spacing.xl,
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
    flex: 1,
  },
  headerTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  splitView: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    flex: 55, // 55%
    padding: Spacing.sm,
  },
  rightPanel: {
    flex: 45, // 45%
    backgroundColor: Colors.white,
    ...Shadows.md,
  },
  rightPanelContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.divider,
  },
  // ─── Search ───
  searchContainer: {
    position: 'relative',
    zIndex: 10,
  },
  searchbar: {
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    elevation: 2,
  },
  searchInput: {
    fontSize: 14,
    minHeight: 40,
  },
  autocomplete: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    maxHeight: 280,
    zIndex: 100,
  },
  autocompleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  autocompleteInfo: {
    flex: 1,
  },
  autocompleteName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  autocompleteCode: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  autocompletePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginRight: Spacing.sm,
  },
  // ─── Products ───
  productList: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
  emptyProducts: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  emptyHint: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  // ─── Cart ───
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cartTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cartCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  cartItems: {
    // No maxHeight - parent ScrollView handles overflow
  },
  // ─── Receipt ───
  receiptModal: {
    backgroundColor: Colors.white,
    margin: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    maxWidth: 400,
    alignSelf: 'center',
    width: '80%',
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  receiptLogo: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  receiptSeparator: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    fontFamily: 'monospace',
    marginVertical: 4,
  },
  receiptInfo: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  receiptItem: {
    marginVertical: 4,
  },
  receiptItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  receiptItemDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  receiptTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  receiptTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  receiptThank: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
});
