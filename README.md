# HYPEZONE STUDIO — INVOICE MANAGEMENT SYSTEM

Sistem manajemen keuangan, invoice, klien, katalog jasa, pencatatan pembayaran, dan laporan keuangan internal berbasis desktop/local web untuk **HypeZone Studio** (Creative & Digital Agency).

---

## ⚡ Fitur Utama

1. **Dashboard Eksekutif**: Ringkasan omset (Gross Revenue), kas riil diterima, piutang tertunda, invoice overdue, dan grafik tren bulanan.
2. **Invoice Creator Profesional**: Live preview dua panel (form input & preview dokumen), snapshot data klien/perusahaan, perhitungan PPN & diskon otomatis tanpa floating point error.
3. **Template PDF Agency**: 3 template siap cetak A4 (Premium Agency, Modern Dark Navy, Minimalist) ditenagai engine headless Chromium (Puppeteer).
4. **Manajemen Klien**: Database klien lengkap dengan riwayat seluruh transaksi dan outstanding balance.
5. **Katalog Jasa & Produk**: Pengelompokan kategori (Video Production, Design, Digital Marketing, Web Development) dengan tarif bawaan.
6. **Catatan Pembayaran (Payments)**: Mendukung DP/termin (partial payment), pelunasan bertahap, dan otomatisasi status tagihan (`Draft` -> `Unpaid` -> `Partially Paid` -> `Paid` -> `Overdue`).
7. **Quotation (Penawaran Harga)**: Pembuatan penawaran dan konversi 1-klik menjadi Invoice resmi.
8. **Invoice Rutin (Recurring)**: Manajemen klien retainer bulanan/tahunan.
9. **Beban Studio (Expenses)**: Pencatatan beban operasional, langganan software AI, dan honor freelance.
10. **Laporan Finansial**: Laporan arus kas bersih (`Net Cash Flow = Cash Received - Expenses`) serta ekspor file CSV.
11. **Sistem Backup Lokal**: Database SQLite mode WAL (`data/hypezone.db`), sepenuhnya offline dan aman untuk privasi studio.

---

## 🛠️ Persyaratan Sistem

- Windows 10 / 11 (64-bit)
- Node.js versi 18+ (Sudah teruji di Node.js v26.7.0 & npm 11.19.0)
- Browser modern (Google Chrome, Microsoft Edge, Brave)

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Instalasi Pertama Kali
Klik dua kali file:
```text
install.bat
```
Script akan memeriksa runtime Node.js, mengunduh seluruh dependensi frontend dan backend, serta menyiapkan database.

### 2. Menjalankan Aplikasi
Klik dua kali file:
```text
start.bat
```
Aplikasi akan otomatis menyalakan backend API di port 5000 dan frontend di port 3000, lalu membuka browser pada URL:
👉 **`http://localhost:3000`**

### 3. Menghentikan Aplikasi
Klik dua kali file:
```text
stop.bat
```
Semua proses server dan klien akan ditutup dengan aman.

---

## 💾 Struktur Folder

```text
hypezone-studio-invoice/
├── client/                     # Frontend React + Vite + Tailwind CSS
│   ├── public/assets/          # Logo HypeZone Studio & aset statis
│   ├── src/                    # Komponen, halaman, dan routing
├── server/                     # Backend Node.js + Express + TypeScript
│   ├── data/hypezone.db        # Database SQLite (WAL mode)
│   ├── src/                    # REST API, skema DB, dan PDF service
├── install.bat                 # One-click dependency installer
├── start.bat                   # One-click application launcher
├── stop.bat                    # Clean shutdown script
└── README.md                   # Dokumentasi teknis
```
