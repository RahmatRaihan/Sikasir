// Zustand Cart Store — State management untuk keranjang belanja kasir
import { create } from 'zustand';
import type { MetodeBayar } from '../constants/penyedia';

export interface CartItemData {
  produkId: number;
  kodeBarang: string;
  namaProduk: string;
  penyediaId: number;
  hargaSatuan: number;
  potonganRs: string;
  qty: number;
  stokTersedia: number;
}

interface CartState {
  items: CartItemData[];
  metodeBayar: MetodeBayar;
  uangDiterima: number;

  // Actions
  addItem: (product: Omit<CartItemData, 'qty'>) => void;
  removeItem: (produkId: number) => void;
  updateQty: (produkId: number, qty: number) => void;
  incrementQty: (produkId: number) => void;
  decrementQty: (produkId: number) => void;
  setMetodeBayar: (metode: MetodeBayar) => void;
  setUangDiterima: (amount: number) => void;
  clearCart: () => void;

  // Computed getters
  getTotalTagihan: () => number;
  getKembalian: () => number;
  getTotalItems: () => number;
  isPaymentValid: () => boolean;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  metodeBayar: 'tunai',
  uangDiterima: 0,

  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((item) => item.produkId === product.produkId);
      if (existing) {
        // Increment qty jika sudah ada, max = stok
        if (existing.qty >= existing.stokTersedia) return state;
        return {
          items: state.items.map((item) =>
            item.produkId === product.produkId
              ? { ...item, qty: item.qty + 1 }
              : item
          ),
        };
      }
      // Add new item with qty = 1
      return {
        items: [...state.items, { ...product, qty: 1 }],
      };
    });
  },

  removeItem: (produkId) => {
    set((state) => ({
      items: state.items.filter((item) => item.produkId !== produkId),
    }));
  },

  updateQty: (produkId, qty) => {
    set((state) => {
      if (qty <= 0) {
        return { items: state.items.filter((item) => item.produkId !== produkId) };
      }
      return {
        items: state.items.map((item) =>
          item.produkId === produkId
            ? { ...item, qty: Math.min(qty, item.stokTersedia) }
            : item
        ),
      };
    });
  },

  incrementQty: (produkId) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.produkId === produkId && item.qty < item.stokTersedia
          ? { ...item, qty: item.qty + 1 }
          : item
      ),
    }));
  },

  decrementQty: (produkId) => {
    set((state) => {
      const item = state.items.find((i) => i.produkId === produkId);
      if (!item) return state;
      if (item.qty <= 1) {
        return { items: state.items.filter((i) => i.produkId !== produkId) };
      }
      return {
        items: state.items.map((i) =>
          i.produkId === produkId ? { ...i, qty: i.qty - 1 } : i
        ),
      };
    });
  },

  setMetodeBayar: (metode) => set({ metodeBayar: metode }),

  setUangDiterima: (amount) => set({ uangDiterima: amount }),

  clearCart: () => set({ items: [], metodeBayar: 'tunai', uangDiterima: 0 }),

  getTotalTagihan: () => {
    return get().items.reduce((sum, item) => sum + item.hargaSatuan * item.qty, 0);
  },

  getKembalian: () => {
    const state = get();
    if (state.metodeBayar !== 'tunai') return 0;
    const total = state.getTotalTagihan();
    return Math.max(0, state.uangDiterima - total);
  },

  getTotalItems: () => {
    return get().items.reduce((sum, item) => sum + item.qty, 0);
  },

  isPaymentValid: () => {
    const state = get();
    if (state.items.length === 0) return false;
    if (state.metodeBayar === 'tunai') {
      return state.uangDiterima >= state.getTotalTagihan();
    }
    return true; // QRIS always valid if items exist
  },
}));
