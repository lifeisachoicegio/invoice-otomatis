import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'hypezone.db');
export const db = new Database(dbPath);

// Enable WAL mode & foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    -- 1. App / Company Settings
    CREATE TABLE IF NOT EXISTS company_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      business_name TEXT NOT NULL DEFAULT 'HYPEZONE STUDIO',
      tagline TEXT NOT NULL DEFAULT 'Creative & Digital Agency',
      logo_url TEXT DEFAULT '/assets/logo.png',
      address TEXT DEFAULT 'Jl. Veteran No. 45, Surakarta, Jawa Tengah',
      email TEXT DEFAULT 'contact@hypezone.studio',
      phone TEXT DEFAULT '+62 812-3456-7890',
      website TEXT DEFAULT 'https://hypezone.studio',
      tax_number TEXT DEFAULT '09.876.543.2-123.000',
      bank_name TEXT DEFAULT 'BCA',
      account_number TEXT DEFAULT '0158923481',
      account_holder TEXT DEFAULT 'HYPEZONE STUDIO',
      branch TEXT DEFAULT 'KCP Slamet Riyadi',
      payment_instructions TEXT DEFAULT 'Silakan transfer tepat waktu sesuai nominal invoice. Cantumkan nomor invoice di berita transfer.',
      invoice_prefix TEXT DEFAULT 'HZS-INV',
      invoice_format TEXT DEFAULT '{prefix}-{year}-{seq}',
      default_currency TEXT DEFAULT 'IDR',
      default_payment_terms TEXT DEFAULT 'Due on Receipt',
      default_tax_rate REAL DEFAULT 11.0,
      default_notes TEXT DEFAULT 'Terima kasih atas kerja sama Anda dengan HypeZone Studio.',
      default_footer TEXT DEFAULT 'Dokumen ini sah dan diterbitkan secara digital oleh sistem HypeZone Studio.',
      default_template TEXT DEFAULT 'premium',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Seed company settings if not exists
    INSERT OR IGNORE INTO company_settings (id) VALUES (1);

    -- 2. Clients
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      company_name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      tax_id TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Services Catalog
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL DEFAULT 0,
      unit TEXT DEFAULT 'project',
      active_status INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Invoices
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT NOT NULL UNIQUE,
      client_id INTEGER,
      status TEXT NOT NULL DEFAULT 'Draft', -- Draft, Sent, Unpaid, Partially Paid, Paid, Overdue, Cancelled
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'IDR',
      payment_terms TEXT,
      reference_number TEXT,
      notes TEXT,
      template TEXT DEFAULT 'premium',

      -- Calculation fields
      subtotal REAL NOT NULL DEFAULT 0,
      discount_type TEXT DEFAULT 'percentage', -- 'percentage' | 'fixed'
      discount_value REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 11.0,
      tax_amount REAL NOT NULL DEFAULT 0,
      grand_total REAL NOT NULL DEFAULT 0,
      amount_paid REAL NOT NULL DEFAULT 0,
      balance_due REAL NOT NULL DEFAULT 0,

      -- Snapshot data (company & client freeze)
      company_snapshot TEXT,
      client_snapshot TEXT,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE RESTRICT
    );

    -- 5. Invoice Items
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      service_id INTEGER,
      description TEXT NOT NULL,
      unit TEXT DEFAULT 'item',
      price REAL NOT NULL DEFAULT 0,
      quantity REAL NOT NULL DEFAULT 1,
      discount REAL NOT NULL DEFAULT 0,
      subtotal REAL NOT NULL DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE SET NULL
    );

    -- 6. Payments
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_number TEXT NOT NULL UNIQUE,
      invoice_id INTEGER NOT NULL,
      payment_date TEXT NOT NULL,
      payment_amount REAL NOT NULL,
      payment_method TEXT NOT NULL, -- Bank Transfer, Cash, E-Wallet, QRIS, Other
      reference_number TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
    );

    -- 7. Quotations
    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_number TEXT NOT NULL UNIQUE,
      client_id INTEGER,
      status TEXT NOT NULL DEFAULT 'Draft', -- Draft, Sent, Accepted, Rejected, Expired, Converted
      issue_date TEXT NOT NULL,
      expiration_date TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'IDR',
      notes TEXT,
      subtotal REAL NOT NULL DEFAULT 0,
      discount_type TEXT DEFAULT 'percentage',
      discount_value REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 11.0,
      tax_amount REAL NOT NULL DEFAULT 0,
      grand_total REAL NOT NULL DEFAULT 0,
      company_snapshot TEXT,
      client_snapshot TEXT,
      converted_invoice_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE RESTRICT,
      FOREIGN KEY (converted_invoice_id) REFERENCES invoices (id) ON DELETE SET NULL
    );

    -- 8. Quotation Items
    CREATE TABLE IF NOT EXISTS quotation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER NOT NULL,
      service_id INTEGER,
      description TEXT NOT NULL,
      unit TEXT DEFAULT 'item',
      price REAL NOT NULL DEFAULT 0,
      quantity REAL NOT NULL DEFAULT 1,
      discount REAL NOT NULL DEFAULT 0,
      subtotal REAL NOT NULL DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (quotation_id) REFERENCES quotations (id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE SET NULL
    );

    -- 9. Recurring Invoices
    CREATE TABLE IF NOT EXISTS recurring_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      client_id INTEGER NOT NULL,
      frequency TEXT NOT NULL, -- Weekly, Monthly, Quarterly, Yearly
      amount REAL NOT NULL DEFAULT 0,
      start_date TEXT NOT NULL,
      end_date TEXT,
      next_invoice_date TEXT NOT NULL,
      active_status INTEGER NOT NULL DEFAULT 1,
      template TEXT DEFAULT 'premium',
      items_json TEXT NOT NULL, -- JSON array of items to create
      last_generated_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE RESTRICT
    );

    -- 10. Expenses
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_name TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      expense_date TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 11. Activity Logs
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default services if empty
  const sCount = db.prepare('SELECT COUNT(*) as cnt FROM services').get() as { cnt: number };
  if (sCount.cnt === 0) {
    const insertService = db.prepare(`
      INSERT INTO services (service_name, category, description, price, unit, active_status)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    const defaults = [
      // VIDEO PRODUCTION
      ['Video Editing Standard', 'VIDEO PRODUCTION', 'Editing video durasi sampai 5 menit + color grading dasar', 750000, 'video'],
      ['Short Form Video (Reels/TikTok)', 'VIDEO PRODUCTION', 'Video 30-60 detik vertikal 9:16 + hook & captions dinamis', 450000, 'video'],
      ['Long Form Video YouTube', 'VIDEO PRODUCTION', 'Editing video 10-20 menit + multi-cam & motion graphics', 1800000, 'video'],
      ['Motion Graphics & Animation', 'VIDEO PRODUCTION', 'Visual 2D motion title, lower thirds, logo reveal animasi', 1200000, 'project'],
      ['Video Ads / Commercial', 'VIDEO PRODUCTION', 'High-impact commercial video untuk campaign paid ads', 2500000, 'project'],
      // DESIGN
      ['Brand Identity Design', 'DESIGN', 'Paket logo, color palette, typography guidelines, mockup brand', 4500000, 'package'],
      ['Logo Design Concept', 'DESIGN', '3 konsep logo unik + file master vektor (AI, EPS, SVG, PNG)', 2000000, 'project'],
      ['Graphic Design Banner/Poster', 'DESIGN', 'Desain materi promosi digital/cetak resolusi tinggi', 500000, 'design'],
      ['Social Media Feed Design (Pack of 12)', 'DESIGN', '12 postingan IG feed aesthetic sesuai brand visual', 1800000, 'package'],
      ['YouTube Thumbnail Design', 'DESIGN', 'Thumbnail high CTR dengan typography tebal dan lighting menarik', 250000, 'thumbnail'],
      // DIGITAL MARKETING
      ['Social Media Management (1 Bulan)', 'DIGITAL MARKETING', 'Manajemen Instagram 1 bulan, 16 konten feed + 20 stories + caption', 5000000, 'bulan'],
      ['Content Planning & Strategy', 'DIGITAL MARKETING', 'Riset audiens, content pillar, calendar plan 30 hari', 2000000, 'project'],
      ['Digital Marketing Ads Campaign', 'DIGITAL MARKETING', 'Setup dan optimasi Meta Ads / TikTok Ads selama 1 bulan', 3500000, 'bulan'],
      // WEB DEVELOPMENT
      ['Website Landing Page', 'WEB DEVELOPMENT', 'Desain dan build landing page responsif, modern, dan cepat', 3500000, 'page'],
      ['Company Profile Website', 'WEB DEVELOPMENT', 'Website multi-page perusahaan interaktif dan SEO ready', 7500000, 'website'],
      // OTHER
      ['Product Photography Session', 'OTHER SERVICES', 'Foto produk studio 20 foto final retouched', 2500000, 'session'],
      ['Videography Half-Day Shoot', 'OTHER SERVICES', 'Pengambilan footage profesional 4 jam di lokasi', 3000000, 'session'],
      ['Consultation Creative Strategy (1 Hour)', 'OTHER SERVICES', 'Sesi konsultasi 1 jam strategi konten brand', 750000, 'jam']
    ];

    const tx = db.transaction(() => {
      for (const [name, cat, desc, price, unit] of defaults) {
        insertService.run(name, cat, desc, price, unit);
      }
    });
    tx();
  }

  // Seed default clients if empty
  const cCount = db.prepare('SELECT COUNT(*) as cnt FROM clients').get() as { cnt: number };
  if (cCount.cnt === 0) {
    const insertClient = db.prepare(`
      INSERT INTO clients (client_name, company_name, email, phone, address, tax_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const clientDefaults = [
      ['Rian Pratama', 'Kopi Senja Nusantara', 'rian@kopisenja.co.id', '+62 813-9821-4455', 'Jl. Gandaria Tengah No. 12, Jakarta Selatan', '01.234.567.8-012.000', 'Klien retainer social media'],
      ['Maya Safitri', 'GlowSkin Clinic', 'maya.safitri@glowskin.id', '+62 812-7711-2299', 'Ruko Sentra Bisnis Blok B-8, Solo Baru', '02.345.678.9-023.000', 'Project rebrand & video commercial'],
      ['Budi Santoso', 'TechVenture Asia', 'budi@techventure.asia', '+62 811-3344-5566', 'Level 24, Cyber 2 Tower, Kuningan, Jakarta', '03.456.789.0-034.000', 'Project landing page & corporate identity']
    ];

    const tx = db.transaction(() => {
      for (const [name, comp, email, phone, addr, tax, notes] of clientDefaults) {
        insertClient.run(name, comp, email, phone, addr, tax, notes);
      }
    });
    tx();
  }
}
