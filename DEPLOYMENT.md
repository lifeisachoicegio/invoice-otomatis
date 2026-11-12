# Panduan Deploy HypeZone Studio Invoice (Vercel + Render)

Aplikasi telah disiapkan agar siap online dengan arsitektur:
- **Frontend**: Dihosting di **Vercel** (Cepat, gratis, SSL otomatis).
- **Backend**: Dihosting di **Render** atau **Railway** (Mendukung SQLite persistent & Puppeteer Chromium).

---

## Bagian 1: Deploy Backend ke Render (Gratis)

1. Buka [render.com](https://render.com) dan buat akun (bisa login pakai GitHub).
2. Push repository proyek ini ke GitHub Anda.
3. Di Dashboard Render, klik **New +** -> **Web Service**.
4. Hubungkan repository GitHub Anda.
5. Konfigurasikan setting berikut:
   - **Root Directory**: `server`
   - **Environment**: `Node` (atau pilih `Docker` karena sudah disediakan `server/Dockerfile` untuk Puppeteer)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
6. *(Opsional - Persistent Disk)*:
   Jika ingin file SQLite permanen tidak ter-reset saat server idle, tambahkan **Disk** di tab Disks:
   - Mount Path: `/app/data` (Ukuran: 1 GB).
7. Klik **Deploy Web Service**.
8. Setelah status `Live`, salin URL backend Anda (contoh: `https://hypezone-api.onrender.com`).

---

## Bagian 2: Deploy Frontend ke Vercel

1. Buka [vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
2. Klik **Add New...** -> **Project**.
3. Pilih repository proyek HypeZone Studio.
4. Pada halaman konfigurasi project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Klik **Edit** dan pilih folder `client`
5. Buka bagian **Environment Variables**, tambahkan:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://hypezone-api.onrender.com/api` (Ganti dengan URL backend Render Anda dari Bagian 1, pastikan ada `/api` di ujungnya).
6. Klik tombol **Deploy**.
7. Tunggu sekitar 1 menit sampai selesai. Vercel akan memberikan domain publik (contoh: `https://hypezone-studio.vercel.app`).

---

## File Konfigurasi yang Sudah Disiapkan:
1. `client/vercel.json` : Menangani routing SPA (Single Page Application) React Router agar tidak 404 saat di-refresh.
2. `client/src/api.ts` : Sudah dinamis membaca environment variable `VITE_API_URL`.
3. `server/Dockerfile` : Sudah disiapkan lengkap dengan pustaka Linux Chromium untuk menjalankan Puppeteer tanpa kendala.
4. `server/package.json` : Skrip `build` (`tsc`) dan `start` (`node dist/server.js`) sudah tervalidasi.
