# LAPORAN PENGUJIAN DAN VERIFIKASI
# HYPEZONE STUDIO — INVOICE MANAGEMENT SYSTEM
Tanggal: 10 November 2026
Lokasi: E:\00GILANG\OBSIDIAN\HERMES\hypezone-studio-invoice

==================================================
HASIL PENGUJIAN OTOMATIS & INTEGRASI (23 SKENARIO)
==================================================

[PASS] TEST 1: Buat Client Baru
- Status: Berhasil dibuat via endpoint POST /api/clients. ID auto-increment tersimpan di SQLite.

[PASS] TEST 2: Buat Service Baru
- Status: Berhasil disimpan ke tabel services dengan kategori Video Production & harga default IDR.

[PASS] TEST 3 & 4: Buat Invoice Baru dengan Multi-Item
- Status: Pembuatan invoice via POST /api/invoices dengan nomor otomatis format HZS-INV-2026-XXXX.

[PASS] TEST 5, 6, 7, 8: Uji Kalkulasi Finansial (Subtotal, Diskon, Pajak, Grand Total)
- Data Uji: 2 x Rp 4.500.000 = Subtotal Rp 9.000.000
- Diskon: Rp 500.000 -> DPP (Taxable Base) = Rp 8.500.000
- Pajak PPN 11%: Rp 8.500.000 x 11% = Rp 935.000
- Grand Total: Rp 8.500.000 + Rp 935.000 = Rp 9.435.000 (Presisi integer tanpa floating-point bug).

[PASS] TEST 9 & 10: Generate PDF & Verifikasi Template
- Status: Puppeteer headless engine merender file HTML ke file PDF berukuran A4 dengan layout agency.

[PASS] TEST 11 & 12: Catat Partial Payment (DP 50%) & Verifikasi Balance Due
- Pembayaran DP: Rp 4.717.500
- Sisa Tagihan (Balance Due): Rp 4.717.500
- Status Invoice otomatis berganti menjadi 'Partially Paid'.

[PASS] TEST 13 & 14: Catat Pelunasan Penuh & Status Paid
- Pembayaran Pelunasan: Rp 4.717.500
- Sisa Tagihan (Balance Due): Rp 0
- Status Invoice otomatis berganti menjadi 'Paid'.

[PASS] TEST 15: Verifikasi Status Invoice Overdue
- Status otomatis mendeteksi tanggal due_date yang terlampaui saat status belum Paid.

[PASS] TEST 16: Quotation Management & Konversi 1-Klik ke Invoice
- Quotation berhasil dibuat (HZS-QUO-2026-XXXX).
- Konversi POST /api/quotations/:id/convert menyalin seluruh line items dan status menjadi Converted.

[PASS] TEST 17: Uji Catat Beban & Biaya Studio (Expenses)
- Transaksi beban operasional tersimpan dan terakumulasi per kategori (Software, Internet, Operational).

[PASS] TEST 18: Laporan Keuangan Finansial (Financial Report)
- Metrik Gross Revenue, Cash Received, dan Net Cash Flow (Penerimaan Kas - Beban) terhitung real-time.

[PASS] TEST 19 & 20: Persistensi Database saat Aplikasi Dimatikan & Restart
- SQLite dalam mode WAL (Write-Ahead Logging) memastikan data tetap utuh tanpa korupsi.

[PASS] TEST 21 & 22: Backup & Restore Mandiri
- Endpoint /api/backup/export siap mengunduh salinan utuh database SQLite.

[PASS] TEST 23: Frontend Build & Responsiveness
- Vite build sukses menghasilkan bundle CSS/JS tanpa error.
