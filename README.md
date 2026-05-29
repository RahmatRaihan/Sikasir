# SiKasir DWP RS Rubini

Sistem Kasir modern untuk DWP (Dharma Wanita Persatuan) RS Rubini. Dibangun dengan React Native + Expo dan Supabase sebagai cloud database.

## 🏗 Tech Stack

- **Frontend**: React Native (Expo SDK 56)
- **UI Framework**: React Native Paper
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Navigation**: Expo Router (file-based)
- **Export**: SheetJS (xlsx)

## 🚀 Setup

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/sikasir-dwp.git
cd sikasir-dwp
npm install
```

### 2. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** → Paste isi file `supabase/setup.sql` → Klik **Run**
3. Copy **Project URL** dan **anon key** dari Settings → API

### 3. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` dengan kredensial Supabase:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

### 4. Run Development

```bash
npx expo start
```

### 5. Build APK

```bash
npx expo prebuild --platform android --clean --no-install
cd android && ./gradlew assembleRelease
```

APK ada di: `android/app/build/outputs/apk/release/app-release.apk`

## 📱 Fitur

- **Beranda** — Katalog produk, pencarian, keranjang
- **Kasir** — Split view: produk + keranjang + pembayaran (Tunai/QRIS)
- **Produk** — CRUD produk, retur, manajemen stok
- **Dashboard** — Grafik penjualan, statistik harian/bulanan
- **Laporan** — Rincian penjualan, bagi hasil per penyedia, export Excel

## 📁 Struktur Database

| Tabel | Deskripsi |
|-------|-----------|
| `penyedia` | Daftar penyedia (DWP, Mona, Harian, Kering) |
| `produk` | Produk dengan kode, harga, stok, potongan RS |
| `transaksi` | Header transaksi (nomor, tanggal, metode bayar) |
| `transaksi_item` | Detail item per transaksi (snapshot harga) |
| `retur` | Pengembalian produk |

## 🔄 Update Aplikasi

Untuk update tanpa rebuild APK (OTA):
```bash
npx eas-cli update --branch production
```

Untuk update yang melibatkan perubahan native:
```bash
npx expo prebuild --clean --no-install
cd android && ./gradlew assembleRelease
```
