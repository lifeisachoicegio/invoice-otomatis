import puppeteer from 'puppeteer';

export interface InvoiceRenderData {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  currency: string;
  status: string;
  payment_terms?: string;
  reference_number?: string;
  notes?: string;
  template?: 'premium' | 'dark' | 'minimal' | 'neobrutalism';

  subtotal: number;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  grand_total: number;
  amount_paid: number;
  balance_due: number;

  company: {
    business_name: string;
    tagline?: string;
    logo_url?: string;
    address?: string;
    email?: string;
    phone?: string;
    website?: string;
    tax_number?: string;
    bank_name?: string;
    account_number?: string;
    account_holder?: string;
    branch?: string;
    payment_instructions?: string;
    default_footer?: string;
  };

  client: {
    client_name: string;
    company_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    tax_id?: string;
  };

  items: Array<{
    description: string;
    unit?: string;
    price: number;
    quantity: number;
    discount?: number;
    subtotal: number;
  }>;
}

function formatCurrency(val: number, cur = 'IDR') {
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: cur,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(val || 0);
  } catch {
    return `${cur} ${val.toLocaleString('id-ID')}`;
  }
}

export function generateInvoiceHtml(data: InvoiceRenderData): string {
  const tmpl = data.template || 'premium';

  if (tmpl === 'neobrutalism') {
    return generateNeoBrutalismHtml(data);
  }

  const isDark = tmpl === 'dark';
  const isMinimal = tmpl === 'minimal';

  const logoBase64 = `
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg, #3878FC, #6844FC);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:20px;letter-spacing:-1px;box-shadow:0 4px 12px rgba(56,120,252,0.3);">
        HZ
      </div>
      <div>
        <div style="font-size:20px;font-weight:800;letter-spacing:0.5px;color:${isDark ? '#FFFFFF' : '#10265F'};">
          ${data.company.business_name}
        </div>
        <div style="font-size:11px;font-weight:500;color:${isDark ? '#A5B0C8' : '#64748B'};letter-spacing:1px;text-transform:uppercase;">
          ${data.company.tagline || 'Creative & Digital Agency'}
        </div>
      </div>
    </div>
  `;

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${data.invoice_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: ${isDark ? '#080B18' : '#FFFFFF'};
      color: ${isDark ? '#FFFFFF' : '#1E293B'};
      font-size: 13px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 36px;
      padding-bottom: 24px;
      border-bottom: ${isMinimal ? '1px solid #E2E8F0' : isDark ? '1px solid #263451' : '2px solid #F1F5F9'};
    }

    .invoice-title-block {
      text-align: right;
    }

    .invoice-title {
      font-size: 28px;
      font-weight: 800;
      color: ${isDark ? '#3878FC' : '#10265F'};
      letter-spacing: -0.5px;
      margin-bottom: 6px;
    }

    .invoice-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      ${
        data.status === 'Paid'
          ? 'background: #DCFCE7; color: #15803D;'
          : data.status === 'Overdue'
          ? 'background: #FEE2E2; color: #B91C1C;'
          : data.status === 'Partially Paid'
          ? 'background: #FEF3C7; color: #B45309;'
          : isDark
          ? 'background: #1E293B; color: #94A3B8;'
          : 'background: #F1F5F9; color: #475569;'
      }
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 36px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: ${isDark ? '#6844FC' : '#4655CA'};
      margin-bottom: 12px;
    }

    .info-card {
      background: ${isDark ? '#11182A' : '#F8FAFC'};
      border: 1px solid ${isDark ? '#263451' : '#E2E8F0'};
      border-radius: 12px;
      padding: 16px 20px;
    }

    .info-name {
      font-size: 15px;
      font-weight: 700;
      color: ${isDark ? '#FFFFFF' : '#0F172A'};
      margin-bottom: 4px;
    }

    .info-detail {
      font-size: 12px;
      color: ${isDark ? '#A5B0C8' : '#64748B'};
      line-height: 1.6;
    }

    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-bottom: 32px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid ${isDark ? '#263451' : '#E2E8F0'};
    }

    th {
      background: ${isDark ? '#17213A' : '#F1F5F9'};
      color: ${isDark ? '#A5B0C8' : '#475569'};
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 14px 18px;
      text-align: left;
    }

    th.right, td.right {
      text-align: right;
    }

    th.center, td.center {
      text-align: center;
    }

    td {
      padding: 14px 18px;
      border-top: 1px solid ${isDark ? '#263451' : '#E2E8F0'};
      color: ${isDark ? '#FFFFFF' : '#1E293B'};
      font-size: 12.5px;
    }

    .item-desc {
      font-weight: 600;
      color: ${isDark ? '#FFFFFF' : '#0F172A'};
    }

    .item-unit {
      font-size: 11px;
      color: ${isDark ? '#A5B0C8' : '#94A3B8'};
    }

    .totals-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 36px;
    }

    .totals-table {
      width: 320px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      color: ${isDark ? '#A5B0C8' : '#64748B'};
    }

    .totals-row.grand {
      font-size: 16px;
      font-weight: 800;
      color: ${isDark ? '#3878FC' : '#10265F'};
      border-top: 2px solid ${isDark ? '#263451' : '#CBD5E1'};
      padding-top: 12px;
      margin-top: 6px;
    }

    .totals-row.due {
      font-size: 15px;
      font-weight: 700;
      color: ${data.balance_due > 0 ? '#EF4444' : '#22C55E'};
      background: ${isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2'};
      border-radius: 8px;
      padding: 8px 12px;
      margin-top: 8px;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      border-top: 1px solid ${isDark ? '#263451' : '#E2E8F0'};
      padding-top: 24px;
    }

    .footer-box {
      background: ${isDark ? '#11182A' : '#F8FAFC'};
      border-radius: 12px;
      padding: 16px;
      border: 1px solid ${isDark ? '#263451' : '#E2E8F0'};
    }

    .bank-label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: ${isDark ? '#3878FC' : '#4655CA'};
      margin-bottom: 6px;
    }

    .bank-name {
      font-size: 14px;
      font-weight: 700;
      color: ${isDark ? '#FFFFFF' : '#0F172A'};
    }

    .bank-acc {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 1px;
      color: ${isDark ? '#3878FC' : '#10265F'};
      margin: 4px 0;
    }

    .bank-holder {
      font-size: 12px;
      color: ${isDark ? '#A5B0C8' : '#64748B'};
    }

    .signature-text {
      text-align: center;
      margin-top: 36px;
      font-size: 11px;
      color: ${isDark ? '#A5B0C8' : '#94A3B8'};
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div>
        ${logoBase64}
        <div style="margin-top:12px;font-size:12px;color:${isDark ? '#A5B0C8' : '#64748B'};max-width:320px;">
          ${data.company.address || ''}<br/>
          ${data.company.email ? `Email: ${data.company.email}<br/>` : ''}
          ${data.company.phone ? `Telp: ${data.company.phone}<br/>` : ''}
          ${data.company.tax_number ? `NPWP: ${data.company.tax_number}` : ''}
        </div>
      </div>
      <div class="invoice-title-block">
        <div class="invoice-title">INVOICE</div>
        <div style="font-size:15px;font-weight:700;margin-bottom:6px;color:${isDark ? '#FFFFFF' : '#334155'};">
          ${data.invoice_number}
        </div>
        <div>
          <span class="invoice-badge">${data.status}</span>
        </div>
        <div style="margin-top:12px;font-size:12px;color:${isDark ? '#A5B0C8' : '#64748B'};">
          <div><strong>Tgl Terbit:</strong> ${data.issue_date}</div>
          <div><strong>Jatuh Tempo:</strong> ${data.due_date}</div>
          ${data.reference_number ? `<div><strong>Ref:</strong> ${data.reference_number}</div>` : ''}
        </div>
      </div>
    </div>

    <!-- Meta Grid -->
    <div class="meta-grid">
      <div class="info-card">
        <div class="section-title">Ditagihkan Kepada:</div>
        <div class="info-name">${data.client.client_name}</div>
        ${data.client.company_name ? `<div style="font-weight:600;margin-bottom:4px;color:${isDark ? '#E2E8F0' : '#334155'};">${data.client.company_name}</div>` : ''}
        <div class="info-detail">
          ${data.client.address ? `${data.client.address}<br/>` : ''}
          ${data.client.email ? `Email: ${data.client.email}<br/>` : ''}
          ${data.client.phone ? `Telp: ${data.client.phone}<br/>` : ''}
          ${data.client.tax_id ? `NPWP: ${data.client.tax_id}` : ''}
        </div>
      </div>

      <div class="info-card">
        <div class="section-title">Ketentuan Pembayaran:</div>
        <div style="font-size:13px;font-weight:600;color:${isDark ? '#FFFFFF' : '#0F172A'};margin-bottom:8px;">
          ${data.payment_terms || 'Due on Receipt'}
        </div>
        <div class="info-detail">
          ${data.company.payment_instructions || 'Mohon transfer sesuai nominal tertera sebelum tanggal jatuh tempo.'}
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table>
      <thead>
        <tr>
          <th style="width:40%;">Deskripsi</th>
          <th class="right" style="width:20%;">Harga</th>
          <th class="center" style="width:15%;">Qty</th>
          <th class="right" style="width:25%;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${data.items
          .map(
            (it) => `
          <tr>
            <td>
              <div class="item-desc">${it.description}</div>
              ${it.unit ? `<span class="item-unit">Satuan: ${it.unit}</span>` : ''}
            </td>
            <td class="right">${formatCurrency(it.price, data.currency)}</td>
            <td class="center">${it.quantity}</td>
            <td class="right" style="font-weight:700;">${formatCurrency(it.subtotal, data.currency)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-wrapper">
      <div class="totals-table">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>${formatCurrency(data.subtotal, data.currency)}</span>
        </div>
        ${
          data.discount_amount > 0
            ? `
          <div class="totals-row" style="color:#EF4444;">
            <span>Diskon ${data.discount_type === 'percentage' ? `(${data.discount_value}%)` : ''}</span>
            <span>-${formatCurrency(data.discount_amount, data.currency)}</span>
          </div>
        `
            : ''
        }
        ${
          data.tax_rate > 0
            ? `
          <div class="totals-row">
            <span>PPN (${data.tax_rate}%)</span>
            <span>+${formatCurrency(data.tax_amount, data.currency)}</span>
          </div>
        `
            : ''
        }
        <div class="totals-row grand">
          <span>Total Tagihan</span>
          <span>${formatCurrency(data.grand_total, data.currency)}</span>
        </div>
        <div class="totals-row">
          <span>Telah Dibayar</span>
          <span>${formatCurrency(data.amount_paid, data.currency)}</span>
        </div>
        <div class="totals-row due">
          <span>Sisa Tagihan</span>
          <span>${formatCurrency(data.balance_due, data.currency)}</span>
        </div>
      </div>
    </div>

    <!-- Footer Payment Details -->
    <div class="footer-grid">
      <div class="footer-box">
        <div class="bank-label">Instruksi Pembayaran Bank</div>
        <div class="bank-name">${data.company.bank_name || 'BCA'}</div>
        <div class="bank-acc">${data.company.account_number || '-'}</div>
        <div class="bank-holder">a.n. ${data.company.account_holder || data.company.business_name}</div>
        ${data.company.branch ? `<div style="font-size:11px;color:${isDark ? '#A5B0C8' : '#94A3B8'};margin-top:2px;">Cabang: ${data.company.branch}</div>` : ''}
      </div>

      <div class="footer-box">
        <div class="bank-label">Catatan Tambahan</div>
        <div style="font-size:12px;color:${isDark ? '#A5B0C8' : '#64748B'};line-height:1.6;">
          ${data.notes || 'Terima kasih atas kerja sama Anda dengan HypeZone Studio.'}
        </div>
      </div>
    </div>

    <!-- Bottom Notice -->
    <div class="signature-text">
      ${data.company.default_footer || 'Dokumen ini sah dan diterbitkan secara digital oleh sistem HypeZone Studio.'}
    </div>
  </div>
</body>
</html>
  `;
}

function generateNeoBrutalismHtml(data: InvoiceRenderData): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${data.invoice_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background-color: #FFFFFF;
      color: #000000;
      font-size: 13px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .canvas {
      max-width: 820px;
      margin: 0 auto;
      padding: 40px;
      background: #FFFFFF;
      position: relative;
    }

    /* Header */
    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
    }

    .main-title {
      font-size: 44px;
      font-weight: 900;
      letter-spacing: -1.5px;
      line-height: 1;
      text-transform: uppercase;
      color: #000000;
    }

    .issue-date {
      font-size: 13px;
      font-weight: 600;
      color: #000000;
      margin-top: 8px;
    }

    .brand-box {
      text-align: right;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-logo-badge {
      width: 44px;
      height: 44px;
      border: 3px solid #000000;
      border-radius: 10px;
      background: #FEE05C;
      box-shadow: 3px 3px 0 #000000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 20px;
    }

    .brand-name {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -0.5px;
      line-height: 1.1;
    }

    .brand-tagline {
      font-size: 11px;
      font-weight: 700;
      color: #555555;
    }

    /* Client Blocks & Meta Grid */
    .client-meta-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      gap: 20px;
    }

    .client-blocks {
      width: 58%;
    }

    .yellow-card {
      background: #FEE05C;
      border: 3px solid #000000;
      box-shadow: 4px 4px 0 #000000;
      border-radius: 12px;
      padding: 12px 18px;
      font-weight: 800;
      font-size: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: -4px;
      position: relative;
      z-index: 2;
    }

    .blue-card {
      background: #4D74C9;
      border: 3px solid #000000;
      box-shadow: 4px 4px 0 #000000;
      border-radius: 12px;
      padding: 16px 18px 12px 18px;
      color: #FFFFFF;
      font-size: 12px;
      font-weight: 600;
      line-height: 1.5;
    }

    .invoice-meta-side {
      text-align: right;
      font-size: 12px;
      line-height: 1.7;
    }

    .meta-line strong {
      font-weight: 900;
      color: #000000;
    }

    /* Neo Table */
    table.neo-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }

    table.neo-table th {
      border-bottom: 3px solid #000000;
      padding: 12px 10px;
      font-size: 13px;
      font-weight: 900;
      text-transform: capitalize;
    }

    table.neo-table td {
      border-bottom: 2px solid #000000;
      padding: 14px 10px;
      font-size: 12.5px;
      vertical-align: top;
    }

    .item-title {
      font-weight: 800;
      font-size: 13px;
    }

    .item-sub {
      font-size: 11px;
      color: #555555;
      margin-top: 2px;
    }

    /* Bottom section */
    .bottom-section {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
    }

    .terms-box {
      width: 50%;
      font-size: 11.5px;
      line-height: 1.6;
    }

    .terms-box strong {
      display: block;
      font-size: 13px;
      font-weight: 900;
      margin-bottom: 6px;
    }

    .totals-side {
      width: 42%;
      font-size: 13px;
    }

    .calc-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-weight: 700;
    }

    .calc-row.total-due {
      border-top: 3px solid #000000;
      margin-top: 8px;
      padding-top: 10px;
      font-size: 16px;
      font-weight: 900;
    }

    /* Payment purple block */
    .payment-purple-card {
      margin-top: 24px;
      background: #B689C8;
      border: 3px solid #000000;
      box-shadow: 4px 4px 0 #000000;
      border-radius: 12px;
      padding: 14px 18px;
      color: #FFFFFF;
      font-size: 12px;
    }

    .payment-purple-card strong {
      font-size: 13px;
      font-weight: 900;
      display: block;
      margin-bottom: 4px;
    }

    /* Retro deco icons */
    .retro-star {
      display: inline-block;
      width: 20px;
      height: 20px;
      vertical-align: middle;
      margin-right: 6px;
    }
  </style>
</head>
<body>
  <div class="canvas">
    <!-- Header -->
    <div class="top-header">
      <div>
        <div class="main-title">INVOICE</div>
        <div class="issue-date">${data.issue_date}</div>
      </div>
      <div class="brand-box">
        <div>
          <div class="brand-name">${data.company.business_name}</div>
          <div class="brand-tagline">${data.company.tagline || 'Creative & Digital Agency'}</div>
        </div>
        <div class="brand-logo-badge">HZ</div>
      </div>
    </div>

    <!-- Client Billed to & Meta -->
    <div class="client-meta-container">
      <div class="client-blocks">
        <div class="yellow-card">
          <span>${data.client.client_name || 'Klien HypeZone'}</span>
          <span style="font-size:12px;font-weight:700;">${data.client.phone || ''}</span>
        </div>
        <div class="blue-card">
          <div>${data.client.email || '-'}</div>
          <div>${data.client.address || data.client.company_name || 'Jakarta, Indonesia'}</div>
        </div>
      </div>

      <div class="invoice-meta-side">
        <div class="meta-line"><strong>Account No:</strong> ${data.company.account_number || '32B 00235'}</div>
        <div class="meta-line"><strong>Invoice No:</strong> ${data.invoice_number}</div>
        <div class="meta-line"><strong>Due Date:</strong> ${data.due_date}</div>
      </div>
    </div>

    <!-- Neo Table -->
    <table class="neo-table">
      <thead>
        <tr>
          <th style="width:10%;text-align:center;">Qty</th>
          <th style="width:50%;text-align:left;">Item Description</th>
          <th style="width:20%;text-align:right;">Price</th>
          <th style="width:20%;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${data.items
          .map(
            (it) => `
          <tr>
            <td style="text-align:center;font-weight:800;">${it.quantity}</td>
            <td>
              <div class="item-title">${it.description}</div>
              ${it.unit ? `<div class="item-sub">Satuan: ${it.unit}</div>` : ''}
            </td>
            <td style="text-align:right;font-weight:600;">${formatCurrency(it.price, data.currency)}</td>
            <td style="text-align:right;font-weight:900;">${formatCurrency(it.subtotal, data.currency)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <!-- Bottom details -->
    <div class="bottom-section">
      <div class="terms-box">
        <strong>Term & Condition:</strong>
        <p style="color:#333;">
          ${data.notes || 'Pembayaran penuh atau termin diselesaikan sebelum tanggal jatuh tempo. Hasil final proyek diserahkan setelah pelunasan tercatat.'}
        </p>
        <p style="margin-top:6px;color:#555;font-size:10.5px;">
          Terima kasih telah mempercayakan proyek kreatif digital Anda bersama ${data.company.business_name}.
        </p>

        <!-- Purple Payment Box -->
        <div class="payment-purple-card">
          <strong>Payment Method:</strong>
          <div>${data.company.bank_name || 'Bank Central Asia'}</div>
          <div style="font-family:monospace;font-weight:700;font-size:13px;letter-spacing:0.5px;">
            ${data.company.account_number || '-'}
          </div>
          <div style="font-size:11px;opacity:0.9;">a.n. ${data.company.account_holder || data.company.business_name}</div>
        </div>
      </div>

      <div class="totals-side">
        <div class="calc-row">
          <span>Subtotal</span>
          <span>${formatCurrency(data.subtotal, data.currency)}</span>
        </div>
        ${
          data.discount_amount > 0
            ? `
          <div class="calc-row" style="color:#B91C1C;">
            <span>Discount</span>
            <span>-${formatCurrency(data.discount_amount, data.currency)}</span>
          </div>
        `
            : ''
        }
        ${
          data.tax_rate > 0
            ? `
          <div class="calc-row">
            <span>Tax (${data.tax_rate}%)</span>
            <span>+${formatCurrency(data.tax_amount, data.currency)}</span>
          </div>
        `
            : ''
        }
        <div class="calc-row total-due">
          <span>Total</span>
          <span>${formatCurrency(data.grand_total, data.currency)}</span>
        </div>
        ${
          data.amount_paid > 0
            ? `
          <div class="calc-row" style="font-size:12px;color:#15803D;">
            <span>Amount Paid</span>
            <span>${formatCurrency(data.amount_paid, data.currency)}</span>
          </div>
          <div class="calc-row" style="font-size:13px;font-weight:900;color:#B91C1C;">
            <span>Balance Due</span>
            <span>${formatCurrency(data.balance_due, data.currency)}</span>
          </div>
        `
            : ''
        }
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export async function renderPdfBuffer(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    return Buffer.from(pdfBuffer);
  } finally {
    try {
      await browser.close();
    } catch (e) {
      // ignore
    }
  }
}
