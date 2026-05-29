// Home Screen — Marketplace-style landing page
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  Dimensions,
  Animated as RNAnimated,
  RefreshControl,
} from 'react-native';
import { Text, Searchbar, Badge, Button, Portal, Modal, Divider, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { PENYEDIA_LIST } from '@/constants/penyedia';
import { formatRupiah } from '@/utils/formatRupiah';
import { useCartStore } from '@/store/cartStore';
import ProductCard from '@/components/kasir/ProductCard';
import CartItem from '@/components/kasir/CartItem';
import { getAllProduk } from '@/db/queries/produk';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Hero carousel slides
const HERO_SLIDES = [
  {
    id: 1,
    title: 'Selamat Datang di Sikasir DWP',
    subtitle: 'Sistem Kasir DWP RS Rubini',
    icon: 'hospital-building',
    gradient: [Colors.primary, Colors.primaryLight],
  },
  {
    id: 2,
    title: 'Produk Segar Setiap Hari',
    subtitle: 'DWP, Mona, Harian & Kering',
    icon: 'food-variant',
    gradient: [Colors.secondary, Colors.secondaryLight],
  },
  {
    id: 3,
    title: 'Laporan Otomatis',
    subtitle: 'Bagi hasil & export ke Excel',
    icon: 'chart-line',
    gradient: [Colors.accent, '#FFB74D'],
  },
];

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cartVisible, setCartVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideRef = useRef<FlatList>(null);
  const slideInterval = useRef<any>(null);

  const cart = useCartStore();
  const router = useRouter();

  // Load products
  useEffect(() => {
    loadProducts();
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    slideInterval.current = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % HERO_SLIDES.length;
        slideRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(slideInterval.current);
  }, []);

  // Filter products
  useEffect(() => {
    let filtered = products;
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.penyediaId === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.namaProduk.toLowerCase().includes(q) ||
          p.kodeBarang.toLowerCase().includes(q)
      );
    }
    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchQuery]);

  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = async () => {
    try {
      const data = await getAllProduk();
      setProducts(data);
    } catch (e) {
      console.error('Failed to load products:', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const handleAddToCart = useCallback(
    (product: any) => {
      if (product.stokFisik <= 0) return;
      cart.addItem({
        produkId: product.id,
        kodeBarang: product.kodeBarang,
        namaProduk: product.namaProduk,
        penyediaId: product.penyediaId,
        hargaSatuan: product.hargaJual,
        potonganRs: product.potonganRs || 'none',
        stokTersedia: product.stokFisik,
      });
      Toast.show({
        type: 'success',
        text1: 'Ditambahkan ke keranjang',
        text2: product.namaProduk,
        visibilityTime: 2000,
        position: 'bottom',
      });
    },
    [cart]
  );

  return (
    <View style={styles.container}>
      {/* Header / Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <MaterialCommunityIcons name="hospital-box" size={28} color={Colors.white} />
          <View style={styles.navTitle}>
            <Text style={styles.navTitleText}>Sikasir DWP</Text>
            <Text style={styles.navSubtitle}>RS Rubini</Text>
          </View>
        </View>

        <Searchbar
          placeholder="Cari produk..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          iconColor={Colors.textSecondary}
          elevation={0}
        />

        <Pressable onPress={() => setCartVisible(true)} style={styles.cartButton}>
          <MaterialCommunityIcons name="cart-outline" size={26} color={Colors.white} />
          {cart.getTotalItems() > 0 && (
            <Badge style={styles.cartBadge}>{cart.getTotalItems()}</Badge>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Hero Carousel */}
        <View style={styles.carouselContainer}>
          <FlatList
            ref={slideRef}
            data={HERO_SLIDES}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
              setCurrentSlide(idx);
            }}
            renderItem={({ item }) => (
              <View style={[styles.heroSlide, { backgroundColor: item.gradient[0] }]}>
                <View style={styles.heroContent}>
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={48}
                    color="rgba(255,255,255,0.9)"
                  />
                  <View style={styles.heroText}>
                    <Text style={styles.heroTitle}>{item.title}</Text>
                    <Text style={styles.heroSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
              </View>
            )}
          />
          {/* Dots */}
          <View style={styles.dots}>
            {HERO_SLIDES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, currentSlide === i && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        {/* Category Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategori Penyedia</Text>
          <View style={styles.categoryGrid}>
            {PENYEDIA_LIST.map((p) => (
              <Pressable
                key={p.id}
                onPress={() =>
                  setSelectedCategory(selectedCategory === p.id ? null : p.id)
                }
                style={[
                  styles.categoryItem,
                  selectedCategory === p.id && { borderColor: p.color, borderWidth: 2 },
                ]}
              >
                <View style={[styles.categoryIcon, { backgroundColor: p.bgColor }]}>
                  <MaterialCommunityIcons name={p.icon as any} size={30} color={p.color} />
                </View>
                <Text style={styles.categoryLabel}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Product Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory
                ? `Produk ${PENYEDIA_LIST.find((p) => p.id === selectedCategory)?.label}`
                : 'Semua Produk'}
            </Text>
            <Text style={styles.sectionCount}>{filteredProducts.length} produk</Text>
          </View>
          <View style={styles.productGrid}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                kodeBarang={product.kodeBarang}
                namaProduk={product.namaProduk}
                penyediaId={product.penyediaId!}
                hargaJual={product.hargaJual}
                stokFisik={product.stokFisik}
                potonganRs={product.potonganRs || 'none'}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Cart Modal */}
      <Portal>
        <Modal
          visible={cartVisible}
          onDismiss={() => setCartVisible(false)}
          contentContainerStyle={styles.cartModal}
        >
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>🛒 Keranjang</Text>
            <IconButton
              icon="close"
              size={22}
              onPress={() => setCartVisible(false)}
            />
          </View>
          <Divider />
          {cart.items.length === 0 ? (
            <View style={styles.emptyCart}>
              <MaterialCommunityIcons
                name="cart-outline"
                size={64}
                color={Colors.textLight}
              />
              <Text style={styles.emptyCartText}>Keranjang kosong</Text>
            </View>
          ) : (
            <>
              <ScrollView style={styles.cartItems}>
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
              </ScrollView>
              <Divider />
              <View style={styles.cartFooter}>
                <View style={styles.cartTotal}>
                  <Text style={styles.cartTotalLabel}>Total</Text>
                  <Text style={styles.cartTotalValue}>
                    {formatRupiah(cart.getTotalTagihan())}
                  </Text>
                </View>
                <Button
                  mode="contained"
                  buttonColor={Colors.secondary}
                  style={styles.checkoutButton}
                  labelStyle={{ fontWeight: '700', fontSize: 16 }}
                  icon="cart-check"
                  onPress={() => {
                    setCartVisible(false);
                    router.push('/kasir');
                  }}
                >
                  Lanjut ke Kasir
                </Button>
              </View>
            </>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // ─── Navbar ───
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  navTitle: {},
  navTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  navSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  searchbar: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  searchInput: {
    fontSize: 14,
    color: Colors.white,
    minHeight: 40,
  },
  cartButton: {
    position: 'relative',
    padding: Spacing.sm,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  // ─── Scroll ───
  scrollView: {
    flex: 1,
  },
  // ─── Carousel ───
  carouselContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  heroSlide: {
    width: SCREEN_WIDTH - 32,
    height: 140,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  heroText: {},
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 20,
  },
  // ─── Sections ───
  section: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sectionCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  // ─── Categories ───
  categoryGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  categoryItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    ...Shadows.sm,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  // ─── Products ───
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.sm / 2,
    paddingBottom: Spacing.xxxl,
  },
  // ─── Cart Modal ───
  cartModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '70%',
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyCartText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  cartItems: {
    maxHeight: 300,
  },
  cartFooter: {
    padding: Spacing.lg,
  },
  cartTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cartTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  cartTotalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  checkoutButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: 4,
  },
});
