# PRD — SiKasir RS Rubini
**Product Requirements Document**
**Versi:** 1.0.0
**Tanggal:** 26 Mei 2026
**Status:** Draft

---

## 1. Ringkasan Eksekutif

**SiKasir RS Rubini** adalah aplikasi kasir berbasis Android yang dirancang khusus untuk tablet 8.8 inci, digunakan di lingkungan Rumah Sakit Rubini. Aplikasi ini mengelola penjualan produk dari berbagai penyedia (DWP, Mona, Harian, Kering), lengkap dengan laporan bagi hasil, potongan RS, dan retur barang. Seluruh data disimpan secara offline menggunakan SQLite dan dapat diekspor ke format Excel/CSV.

---

## 2. Tujuan Produk

| Tujuan | Indikator Keberhasilan |
|---|---|
| Mempercepat proses transaksi kasir | Waktu transaksi < 60 detik per item |
| Merekam penjualan per penyedia secara akurat | 0% selisih antara laporan dan transaksi aktual |
| Menghasilkan laporan bagi hasil otomatis | Laporan dapat diekspor ke Excel tanpa proses manual |
| Operasional 100% offline | Tidak membutuhkan koneksi internet untuk fungsi utama |

---

## 3. Target Pengguna

| Peran | Akses | Deskripsi |
|---|---|---|
| Kasir | Layar kasir, tambah transaksi | Petugas yang melayani transaksi harian |
| Admin / Supervisor | Semua halaman | Mengelola produk, melihat laporan, export data |

---

## 4. Stack Teknologi

### 4.1 Framework & Bahasa
- **Framework:** React Native (Expo) — cross-platform, performa tinggi di Android tablet, ekosistem besar
- **Bahasa:** TypeScript — type-safe, maintainable
- **State Management:** Zustand — ringan dan sederhana

### 4.2 Database
- **Database:** SQLite via `expo-sqlite` — offline, native, ringan
- **ORM/Query Builder:** Drizzle ORM — type-safe SQL, tidak butuh server

### 4.3 UI & Styling
- **UI Library:** React Native Paper — Material Design 3, siap pakai
- **Chart/Grafik:** Victory Native — grafik interaktif untuk React Native
- **Icon:** `@expo/vector-icons` (MaterialCommunityIcons)

### 4.4 Export & File
- **Export Excel:** `xlsx` (SheetJS) — generate file `.xlsx` di sisi client
- **File System:** `expo-file-system` — baca/tulis file lokal
- **Share/Download:** `expo-sharing` — bagikan file ke aplikasi lain

### 4.5 Navigasi
- **Navigasi:** React Navigation v6 (Stack + Bottom Tab Navigator)

### 4.6 Utilitas
- **Tanggal:** `date-fns` — format dan manipulasi tanggal
- **Kode Barang Auto-generate:** format `PRD-YYYYMMDD-XXX` (sequential)

---

## 5. Arsitektur Aplikasi

```
sikasir-rs-rubini/
├── app/                        # Entry point (Expo Router)
├── src/
│   ├── components/             # Komponen UI reusable
│   │   ├── common/             # Header, SearchBar, Badge, Modal
│   │   ├── dashboard/          # ChartCard, StatCard, FilterBar
│   │   ├── kasir/              # ProductCard, CartItem, PaymentPanel
│   │   ├── produk/             # ProductTable, ProductForm
│   │   └── laporan/            # ReportTable, SummaryTable
│   ├── screens/                # Halaman utama
│   │   ├── HomeScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── KasirScreen.tsx
│   │   ├── ProdukScreen.tsx
│   │   └── LaporanScreen.tsx
│   ├── db/                     # Database layer
│   │   ├── schema.ts           # Definisi tabel SQLite
│   │   ├── migrations.ts       # Script migrasi
│   │   └── queries/            # Query per domain
│   │       ├── produk.ts
│   │       ├── transaksi.ts
│   │       └── laporan.ts
│   ├── store/                  # Zustand stores
│   │   ├── cartStore.ts
│   │   ├── filterStore.ts
│   │   └── authStore.ts
│   ├── utils/
│   │   ├── exportExcel.ts      # Logic export ke xlsx
│   │   ├── formatRupiah.ts     # Format currency IDR
│   │   ├── generateKode.ts     # Auto-generate kode barang
│   │   └── dateHelper.ts
│   └── constants/
│       ├── penyedia.ts         # Enum penyedia & produknya
│       └── theme.ts            # Warna & typography
```

---

## 6. Skema Database (SQLite)

### Tabel: `penyedia`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto increment |
| `nama` | TEXT NOT NULL | DWP, Mona, Harian, Kering |
| `created_at` | TEXT | ISO datetime |

### Tabel: `produk`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto increment |
| `kode_barang` | TEXT UNIQUE NOT NULL | Auto-generate, format PRD-YYYYMMDD-XXX |
| `nama_produk` | TEXT NOT NULL | Nama produk |
| `penyedia_id` | INTEGER FK | Relasi ke tabel penyedia |
| `potongan_rs` | TEXT | `none`, `10%`, `20%` |
| `harga_jual` | INTEGER NOT NULL | Harga dalam Rupiah (tanpa desimal) |
| `stok_fisik` | INTEGER NOT NULL DEFAULT 0 | Jumlah stok |
| `created_at` | TEXT | ISO datetime |
| `updated_at` | TEXT | ISO datetime |

### Tabel: `transaksi`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto increment |
| `nomor_transaksi` | TEXT UNIQUE NOT NULL | Format TRX-YYYYMMDD-XXXX |
| `tanggal` | TEXT NOT NULL | Format YYYY-MM-DD |
| `metode_bayar` | TEXT NOT NULL | `tunai`, `qris` |
| `total_tagihan` | INTEGER NOT NULL | Total sebelum bayar |
| `uang_diterima` | INTEGER | Untuk metode tunai |
| `kembalian` | INTEGER | Uang kembalian |
| `created_at` | TEXT | ISO datetime |

### Tabel: `transaksi_item`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto increment |
| `transaksi_id` | INTEGER FK | Relasi ke tabel transaksi |
| `produk_id` | INTEGER FK | Relasi ke tabel produk |
| `nama_produk` | TEXT | Snapshot nama saat transaksi |
| `penyedia_id` | INTEGER | Snapshot penyedia saat transaksi |
| `harga_satuan` | INTEGER | Harga saat transaksi |
| `potongan_rs` | TEXT | Snapshot potongan saat transaksi |
| `qty` | INTEGER NOT NULL | Jumlah beli |
| `subtotal` | INTEGER NOT NULL | harga_satuan × qty |

### Tabel: `retur`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto increment |
| `produk_id` | INTEGER FK | Produk yang diretur |
| `transaksi_item_id` | INTEGER FK NULLABLE | Item transaksi asal (jika ada) |
| `qty_retur` | INTEGER NOT NULL | Jumlah yang diretur |
| `alasan` | TEXT | Alasan retur |
| `tanggal` | TEXT NOT NULL | Tanggal retur |
| `created_at` | TEXT | ISO datetime |

---

## 7. Halaman & Spesifikasi Detail

### 7.1 Home Screen (Marketplace-style)

**Tujuan:** Landing page utama dengan nuansa marketplace modern.

**Komponen:**

| Komponen | Detail |
|---|---|
| **Header/Navbar** | Logo "SiKasir RS Rubini" (kiri) + Search bar besar (tengah) + Icon cart dengan badge jumlah item (kanan) + Tombol Login/Register |
| **Hero Section** | Banner promo sliding (carousel), minimum 3 slide, berisi promo atau info RS |
| **Kategori Produk** | Grid icon 2×N: DWP, Mona, Harian, Kering — klik filter produk |
| **Produk Populer** | Grid card produk: gambar placeholder, nama, harga, tombol "+ Keranjang" |
| **Cart Modal (Bonus)** | Slide-up modal berisi item di keranjang, total, tombol "Bayar Sekarang" |
| **Notifikasi Toast (Bonus)** | Muncul 2 detik saat produk berhasil ditambahkan ke keranjang |
| **Skeleton Loading (Bonus)** | Placeholder abu-abu animasi saat data produk belum selesai dimuat |

**Navigasi:** Bottom tab ke Dashboard, Kasir, Produk, Laporan.

---

### 7.2 Dashboard Penjualan

**Tujuan:** Monitoring performa penjualan dengan filter fleksibel.

**Filter Panel (bagian atas):**

| Filter | Pilihan |
|---|---|
| Nama Penyedia | Semua / DWP / Mona / Harian / Kering |
| Produk | Dropdown dinamis sesuai penyedia dipilih; jika "Semua" → tampilkan semua produk |
| Tanggal | Date picker — pilih tanggal spesifik |
| Bulan | Month-year picker |

**Kartu Statistik (Summary Cards):**

| Kartu | Data | Format |
|---|---|---|
| Total Pendapatan Harian | Sum subtotal transaksi hari ini (sesuai filter) | Rp X.XXX.XXX |
| Total Pendapatan Bulanan | Sum subtotal transaksi bulan ini (sesuai filter) | Rp X.XXX.XXX |
| Total Item Terjual | Sum qty semua transaksi_item (sesuai filter) | X pcs |

**Grafik/Chart:**
- Tipe: Line chart harian (7/30 hari terakhir) atau bar chart per kategori penyedia
- Library: Victory Native
- Sumbu X: Tanggal / Penyedia
- Sumbu Y: Total Penjualan (Rp)
- Tooltip saat tap titik data

**Business Logic Filter Produk:**
```
IF penyedia == "DWP"   → tampilkan produk dengan penyedia_id == DWP
IF penyedia == "Semua" → tampilkan semua produk
Query dinamis dibentuk berdasarkan kombinasi filter aktif
```

---

### 7.3 Layar Kasir

**Tujuan:** Transaksi penjualan yang cepat dan akurat.

**Layout (split view — tablet 8.8"):**
- Kolom kiri (60%): Daftar produk / pencarian
- Kolom kanan (40%): Keranjang + pembayaran

**Panel Kiri — Pencarian & Katalog:**

| Elemen | Spesifikasi |
|---|---|
| Search Bar | Input teks besar, placeholder "Cari nama produk atau kode..." |
| Autocomplete | Dropdown muncul saat mengetik ≥1 karakter, tampilkan maks 8 hasil, berisi nama produk + kode + harga + stok tersisa |
| Menu Cepat | Grid card produk lengkap (nama, kode, stok, harga), bisa di-scroll, klik langsung tambah ke keranjang |
| Filter Kategori | Tab chip penyedia (Semua / DWP / Mona / Harian / Kering) untuk filter menu cepat |

**Panel Kanan — Keranjang & Pembayaran:**

| Elemen | Spesifikasi |
|---|---|
| Daftar Item Keranjang | Nama produk, qty (±), harga satuan, subtotal, tombol hapus per item |
| Total Tagihan | Besar, bold, format Rupiah |
| Metode Pembayaran | Toggle/Radio: Tunai / QRIS Non-Tunai |
| Input Uang Tunai | Hanya tampil jika metode = Tunai; numeric keyboard; validasi ≥ total tagihan |
| Uang Kembalian | Auto-hitung: uang_diterima - total_tagihan; tampil real-time |
| Tombol Selesaikan Pembayaran | Warna hijau, disabled jika keranjang kosong atau uang tunai kurang |
| Tombol Batalkan | Warna abu/merah, konfirmasi dialog sebelum clear keranjang |

**Business Logic:**
```
- Saat produk ditambahkan: cek stok > 0; jika habis → tampilkan peringatan
- Saat transaksi selesai:
  → INSERT INTO transaksi (nomor, tanggal, metode, total, uang_diterima, kembalian)
  → INSERT INTO transaksi_item per item di keranjang
  → UPDATE produk SET stok_fisik = stok_fisik - qty WHERE id = produk_id
  → Clear keranjang
  → Tampilkan struk ringkasan (opsional: print via Bluetooth)
- Qty minimal 1, tidak bisa negatif
- Stok real-time terupdate di menu cepat
```

---

### 7.4 Data Produk

**Tujuan:** Manajemen master data produk (CRUD).

**Tampilan Tabel:**

| Kolom | Keterangan |
|---|---|
| Kode Barang | Auto-generate (PRD-YYYYMMDD-XXX), tidak bisa diedit manual |
| Nama Produk | Nama lengkap produk |
| Penyedia | DWP / Mona / Harian / Kering |
| Potongan RS | Tanpa Potongan / 10% / 20% |
| Harga Jual | Format Rp X.XXX |
| Stok | Angka, warna merah jika stok ≤ 5 (warning) |
| Aksi | Tombol: [Retur] [Edit] [Delete] |

**Toolbar Atas:**
- Tombol "+ Tambah Produk" (buka modal form)
- Search bar filter nama produk
- Filter dropdown penyedia

**Modal Form Tambah/Edit Produk:**

| Field | Tipe Input | Validasi |
|---|---|---|
| Nama Produk | Text input | Wajib, min 3 karakter |
| Penyedia | Dropdown select | Wajib, pilih salah satu |
| Potongan RS | Radio / Dropdown | Wajib (boleh "Tanpa Potongan") |
| Harga Jual | Numeric input | Wajib, > 0 |
| Stok Fisik | Numeric input | Wajib, ≥ 0 |

**Modal Retur (dari tombol Retur di tabel):**

| Field | Keterangan |
|---|---|
| Nama Produk | Read-only, otomatis terisi |
| Stok Saat Ini | Read-only |
| Jumlah Retur | Numeric input, validasi ≤ stok terjual |
| Alasan Retur | Text area, opsional |
| Tanggal Retur | Date picker, default hari ini |

**Business Logic Delete:**
- Konfirmasi dialog sebelum hapus
- Jika produk memiliki riwayat transaksi → soft delete (tandai `is_deleted = 1`), tidak benar-benar dihapus agar laporan tetap valid

---

### 7.5 Laporan

**Tujuan:** Laporan penjualan harian/bulanan dan ringkasan bagi hasil.

**Filter Panel:**

| Filter | Pilihan |
|---|---|
| Periode | Harian / Bulanan (toggle) |
| Tanggal / Bulan | Date picker atau month picker sesuai periode |
| Nama Penyedia | Semua / DWP / Mona / Harian / Kering |
| Produk | Dinamis sesuai penyedia dipilih |

**Tabel 1 — Rincian Penjualan Harian:**

| Kolom | Sumber Data |
|---|---|
| Tanggal | `transaksi.tanggal` |
| Penjualan Harian (Rp) | SUM subtotal semua item hari tsb |
| Titipan Kering (Rp) | SUM subtotal item penyedia = "Kering" |
| Produk DWP (Rp) | SUM subtotal item penyedia = "DWP" |
| Titipan Mona (Rp) | SUM subtotal item penyedia = "Mona" |
| Barang Retur (pcs) | SUM qty_retur dari tabel retur pada tanggal tsb |
| Jumlah Kering & Harian (Rp) | Total penyedia "Kering" + penyedia "Harian" |

**Tabel 2 — Ringkasan Bagi Hasil & Potongan:**

| Kolom | Sumber Data / Formula |
|---|---|
| Nama Penyedia | DWP / Mona / Harian / Kering |
| Total Kotor (Rp) | SUM subtotal produk penyedia tersebut dalam periode |
| Barang Retur (pcs) | SUM qty_retur produk penyedia tersebut |
| Potongan RS (Rp) | SUM (subtotal × persentase_potongan) per item |
| Pendapatan Bersih (Rp) | Total Kotor - Potongan RS - (nilai retur) |

**Tombol Export:**
- **Export Excel (.xlsx):** Generate file dengan 2 sheet (Rincian Harian + Ringkasan Bagi Hasil), format header berwarna, angka dalam format Rupiah
- **Export CSV:** Generate file CSV sederhana (opsional alternatif)
- File disimpan ke `Downloads/SiKasir/` dengan nama `Laporan_YYYYMMDD.xlsx`

---

## 8. Desain & UI Guidelines

### 8.1 Color Palette
| Token | Warna | Hex | Penggunaan |
|---|---|---|---|
| Primary | Biru Tua RS | `#1565C0` | Navbar, tombol utama |
| Secondary | Hijau Sehat | `#2E7D32` | Tombol selesaikan, konfirmasi |
| Accent | Oranye Hangat | `#F57C00` | Badge, highlight promo |
| Danger | Merah | `#C62828` | Delete, stok kritis |
| Surface | Putih Bersih | `#FAFAFA` | Background card |
| Background | Abu Sangat Muda | `#F0F2F5` | Background layar |
| Text Primary | Abu Gelap | `#212121` | Body text utama |
| Text Secondary | Abu Medium | `#757575` | Label, hint |

### 8.2 Typography
| Style | Font | Ukuran | Weight |
|---|---|---|---|
| H1 (Judul halaman) | Roboto | 24sp | Bold |
| H2 (Judul section) | Roboto | 20sp | SemiBold |
| H3 (Kartu stat) | Roboto | 18sp | Medium |
| Body | Roboto | 14sp | Regular |
| Caption | Roboto | 12sp | Regular |
| Harga/Total | Roboto Mono | 18sp | Bold |

### 8.3 Layout Tablet 8.8"
- **Resolusi target:** 1920×1200 atau 1280×800 (landscape)
- **Orientasi:** Landscape sebagai default
- **Grid:** 12 kolom, margin 16dp, gutter 12dp
- **Layar Kasir:** Split 60/40 (produk/pembayaran)
- **Layar Laporan:** Full-width tabel dengan horizontal scroll

### 8.4 Komponen Reusable
| Komponen | Props | Keterangan |
|---|---|---|
| `<StatCard>` | title, value, icon, color | Kartu statistik dashboard |
| `<FilterBar>` | filters[], onFilterChange | Panel filter dengan chip |
| `<ProductCard>` | produk, onAddToCart | Card produk marketplace |
| `<DataTable>` | columns[], data[], onAction | Tabel generik dengan aksi |
| `<SearchAutocomplete>` | onSelect, placeholder | Input pencarian dengan dropdown |
| `<ConfirmDialog>` | title, message, onConfirm | Dialog konfirmasi |
| `<ExportButton>` | onExportExcel, onExportCSV | Tombol export dengan opsi |

---

## 9. Fitur Bonus

| Fitur | Implementasi | Prioritas |
|---|---|---|
| **Modal Cart** | Bottom sheet slide-up, summary item, tombol checkout | Tinggi |
| **Toast Notifikasi** | `react-native-toast-message`, durasi 2 detik, posisi bawah | Tinggi |
| **Skeleton Loading** | `@rneui/themed` Skeleton atau custom animasi shimmer | Sedang |
| **Struk Ringkasan** | Modal struk setelah transaksi selesai, tampilkan detail | Sedang |

---

## 10. Keamanan & Validasi

| Aspek | Implementasi |
|---|---|
| Input Sanitasi | Escape semua input teks sebelum disimpan ke SQLite |
| Validasi Form | Validasi client-side di semua form sebelum submit |
| Konfirmasi Destruktif | Dialog konfirmasi untuk delete dan batalkan transaksi |
| Backup Data | Fitur export SQLite database (.db) sebagai backup manual |
| Stok Negatif | Hard block — tidak bisa simpan transaksi jika stok < qty |

---

## 11. Alur Data Utama

### Alur Transaksi Kasir
```
Kasir cari produk (autocomplete)
    → Pilih produk → Tambah ke keranjang
    → Atur qty di keranjang
    → Pilih metode bayar
    → Input uang (jika tunai) → Lihat kembalian
    → Klik "Selesaikan Pembayaran"
    → Sistem validasi stok & pembayaran
    → INSERT transaksi + transaksi_item
    → UPDATE stok produk
    → Tampilkan struk ringkasan
    → Keranjang dikosongkan
```

### Alur Export Laporan
```
Pilih filter (periode, penyedia, produk)
    → Query SQLite → Generate data
    → Klik "Export Excel"
    → SheetJS generate buffer .xlsx
    → Simpan via expo-file-system ke /Downloads/SiKasir/
    → expo-sharing buka dialog share/open
```

---

## 12. Batasan & Asumsi

| Item | Keterangan |
|---|---|
| Koneksi Internet | Tidak diperlukan untuk semua fitur utama |
| Multi-device Sync | Tidak dalam scope v1.0 |
| Print Struk | Tidak dalam scope v1.0 (dapat ditambahkan via Bluetooth printer di v2.0) |
| Autentikasi | Login/Register UI tersedia di header; auth logic disederhanakan (PIN atau username-password lokal) |
| Gambar Produk | Placeholder icon, upload gambar tidak dalam scope v1.0 |
| Penyedia | Hanya 4 penyedia tetap: DWP, Mona, Harian, Kering (bisa dikembangkan di v2.0) |
| Potongan RS | Tiga opsi tetap: Tanpa Potongan, 10%, 20% |
| Mata Uang | IDR (Rupiah), tanpa desimal |

---

## 13. Roadmap Pengembangan

### v1.0 (MVP)
- [x] Home screen marketplace-style
- [x] Dashboard penjualan dengan filter & grafik
- [x] Layar kasir dengan autocomplete & keranjang
- [x] Manajemen produk CRUD + retur
- [x] Laporan rincian & bagi hasil
- [x] Export Excel
- [x] Database SQLite offline

### v1.1
- [ ] Print struk via Bluetooth printer
- [ ] Dark mode
- [ ] Backup & restore database

### v2.0
- [ ] Sinkronisasi multi-perangkat
- [ ] Manajemen penyedia dinamis (tambah/edit penyedia)
- [ ] Foto produk dari kamera/galeri
- [ ] Laporan PDF (generate langsung di app)
- [ ] Dashboard superadmin web

---

## 14. Kriteria Penerimaan (Acceptance Criteria)

| ID | Fitur | Kriteria |
|---|---|---|
| AC-01 | Transaksi | Transaksi selesai tersimpan di SQLite dan stok terupdate dalam < 3 detik |
| AC-02 | Autocomplete | Hasil muncul dalam < 500ms setelah mengetik 1 karakter |
| AC-03 | Filter Dashboard | Grafik dan kartu stat berubah real-time saat filter diubah |
| AC-04 | Export Excel | File .xlsx tergenerate dengan 2 sheet, format Rupiah, dalam < 5 detik |
| AC-05 | Retur | Stok bertambah kembali setelah retur tersimpan |
| AC-06 | Validasi Stok | Sistem menolak transaksi jika qty > stok tersedia |
| AC-07 | Kode Barang | Kode barang unik dan tergenerate otomatis saat produk baru disimpan |
| AC-08 | Filter Produk | Dropdown produk hanya menampilkan produk sesuai penyedia yang dipilih |
| AC-09 | Kembalian | Nilai kembalian terhitung otomatis dan akurat (uang_diterima - total) |
| AC-10 | Laporan Bagi Hasil | Pendapatan bersih = total kotor - potongan RS, sesuai setting potongan per produk |

---

*Dokumen ini adalah living document dan akan diperbarui seiring perkembangan proyek.*

**Dibuat oleh:** Tim Pengembangan SiKasir RS Rubini
**Reviewers:** Admin RS Rubini, Tim Kasir