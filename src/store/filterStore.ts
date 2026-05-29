// Zustand Filter Store — State management untuk filter dashboard & laporan
import { create } from 'zustand';
import { formatDateISO } from '../utils/dateHelper';

interface FilterState {
  // Dashboard & Laporan filters
  penyediaId: number | null; // null = Semua
  produkId: number | null;   // null = Semua
  tanggal: string;           // YYYY-MM-DD format
  bulan: string;             // YYYY-MM format
  periode: 'harian' | 'bulanan';

  // Produk page filters
  produkSearchQuery: string;
  produkPenyediaFilter: number | null;

  // Actions
  setPenyediaId: (id: number | null) => void;
  setProdukId: (id: number | null) => void;
  setTanggal: (tanggal: string) => void;
  setBulan: (bulan: string) => void;
  setPeriode: (periode: 'harian' | 'bulanan') => void;
  setProdukSearchQuery: (query: string) => void;
  setProdukPenyediaFilter: (id: number | null) => void;
  resetFilters: () => void;
  resetProdukFilters: () => void;
}

const today = new Date();
const defaultTanggal = formatDateISO(today);
const defaultBulan = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

export const useFilterStore = create<FilterState>((set) => ({
  penyediaId: null,
  produkId: null,
  tanggal: defaultTanggal,
  bulan: defaultBulan,
  periode: 'harian',
  produkSearchQuery: '',
  produkPenyediaFilter: null,

  setPenyediaId: (id) => set({ penyediaId: id, produkId: null }),
  setProdukId: (id) => set({ produkId: id }),
  setTanggal: (tanggal) => set({ tanggal }),
  setBulan: (bulan) => set({ bulan }),
  setPeriode: (periode) => set({ periode }),
  setProdukSearchQuery: (query) => set({ produkSearchQuery: query }),
  setProdukPenyediaFilter: (id) => set({ produkPenyediaFilter: id }),

  resetFilters: () =>
    set({
      penyediaId: null,
      produkId: null,
      tanggal: defaultTanggal,
      bulan: defaultBulan,
      periode: 'harian',
    }),

  resetProdukFilters: () =>
    set({
      produkSearchQuery: '',
      produkPenyediaFilter: null,
    }),
}));
