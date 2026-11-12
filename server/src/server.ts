import express, { Request, Response } from 'express';
import cors from 'cors';
import dayjs from 'dayjs';
import path from 'path';
import fs from 'fs';
import { db, initDatabase } from './db';
import { generateInvoiceHtml, renderPdfBuffer, InvoiceRenderData } from './pdfService';

initDatabase();

process.on('uncaughtException', (err) => {
  console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'HypeZone Studio Invoice API', time: new Date().toISOString() });
});

// Helper for generating next sequence number
function getNextSequenceNumber(prefix: string, type: 'invoice' | 'quotation' | 'payment'): string {
  const year = dayjs().format('YYYY');
  let tableName = 'invoices';
  let colName = 'invoice_number';

  if (type === 'quotation') {
    tableName = 'quotations';
    colName = 'quotation_number';
  } else if (type === 'payment') {
    tableName = 'payments';
    colName = 'payment_number';
  }

  const row = db.prepare(`SELECT ${colName} as num FROM ${tableName} ORDER BY id DESC LIMIT 1`).get() as { num?: string };
  let seq = 1;
  if (row?.num) {
    const parts = row.num.split('-');
    const lastPart = parts[parts.length - 1];
    const parsed = parseInt(lastPart, 10);
    if (!isNaN(parsed)) {
      seq = parsed + 1;
    }
  }

  const padded = String(seq).padStart(4, '0');
  return `${prefix}-${year}-${padded}`;
}

// ==========================================
// 1. COMPANY SETTINGS
// ==========================================
app.get('/api/settings', (req: Request, res: Response) => {
  const settings = db.prepare('SELECT * FROM company_settings WHERE id = 1').get();
  res.json({ data: settings });
});

app.put('/api/settings', (req: Request, res: Response) => {
  const body = req.body;
  const stmt = db.prepare(`
    UPDATE company_settings SET
      business_name = ?,
      tagline = ?,
      logo_url = ?,
      address = ?,
      email = ?,
      phone = ?,
      website = ?,
      tax_number = ?,
      bank_name = ?,
      account_number = ?,
      account_holder = ?,
      branch = ?,
      payment_instructions = ?,
      invoice_prefix = ?,
      invoice_format = ?,
      default_currency = ?,
      default_payment_terms = ?,
      default_tax_rate = ?,
      default_notes = ?,
      default_footer = ?,
      default_template = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `);

  stmt.run(
    body.business_name || 'HYPEZONE STUDIO',
    body.tagline || '',
    body.logo_url || '/assets/logo.png',
    body.address || '',
    body.email || '',
    body.phone || '',
    body.website || '',
    body.tax_number || '',
    body.bank_name || '',
    body.account_number || '',
    body.account_holder || '',
    body.branch || '',
    body.payment_instructions || '',
    body.invoice_prefix || 'HZS-INV',
    body.invoice_format || '{prefix}-{year}-{seq}',
    body.default_currency || 'IDR',
    body.default_payment_terms || 'Due on Receipt',
    Number(body.default_tax_rate ?? 11),
    body.default_notes || '',
    body.default_footer || '',
    body.default_template || 'neobrutalism'
  );

  const updated = db.prepare('SELECT * FROM company_settings WHERE id = 1').get();
  res.json({ success: true, data: updated });
});

// ==========================================
// 2. CLIENTS
// ==========================================
app.get('/api/clients', (req: Request, res: Response) => {
  const clients = db.prepare(`
    SELECT c.*,
      COALESCE((SELECT COUNT(*) FROM invoices WHERE client_id = c.id), 0) as total_invoices,
      COALESCE((SELECT SUM(grand_total) FROM invoices WHERE client_id = c.id), 0) as total_billed,
      COALESCE((SELECT SUM(amount_paid) FROM invoices WHERE client_id = c.id), 0) as total_paid,
      COALESCE((SELECT SUM(balance_due) FROM invoices WHERE client_id = c.id AND status != 'Cancelled'), 0) as balance_due
    FROM clients c
    ORDER BY c.id DESC
  `).all();
  res.json({ data: clients });
});

app.post('/api/clients', (req: Request, res: Response) => {
  const { client_name, company_name, email, phone, address, tax_id, notes } = req.body;
  if (!client_name) {
    return res.status(400).json({ error: 'Client name is required' });
  }

  const info = db.prepare(`
    INSERT INTO clients (client_name, company_name, email, phone, address, tax_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(client_name, company_name, email, phone, address, tax_id, notes);

  const newClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ success: true, data: newClient });
});

app.put('/api/clients/:id', (req: Request, res: Response) => {
  const { client_name, company_name, email, phone, address, tax_id, notes } = req.body;
  const id = Number(req.params.id);

  db.prepare(`
    UPDATE clients SET
      client_name = ?,
      company_name = ?,
      email = ?,
      phone = ?,
      address = ?,
      tax_id = ?,
      notes = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(client_name, company_name, email, phone, address, tax_id, notes, id);

  const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  res.json({ success: true, data: updated });
});

app.delete('/api/clients/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const invCount = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE client_id = ?').get(id) as { count: number };
  if (invCount.count > 0) {
    return res.status(400).json({ error: 'Klien tidak bisa dihapus karena masih memiliki riwayat invoice.' });
  }

  db.prepare('DELETE FROM clients WHERE id = ?').run(id);
  res.json({ success: true });
});

// ==========================================
// 3. SERVICES CATALOG
// ==========================================
app.get('/api/services', (req: Request, res: Response) => {
  const services = db.prepare('SELECT * FROM services ORDER BY category ASC, service_name ASC').all();
  res.json({ data: services });
});

app.post('/api/services', (req: Request, res: Response) => {
  const { service_name, category, description, price, unit, active_status } = req.body;
  if (!service_name || !category) {
    return res.status(400).json({ error: 'Service name and category are required' });
  }

  const info = db.prepare(`
    INSERT INTO services (service_name, category, description, price, unit, active_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(service_name, category, description, Number(price || 0), unit || 'item', active_status ?? 1);

  const created = db.prepare('SELECT * FROM services WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ success: true, data: created });
});

app.put('/api/services/:id', (req: Request, res: Response) => {
  const { service_name, category, description, price, unit, active_status } = req.body;
  const id = Number(req.params.id);

  db.prepare(`
    UPDATE services SET
      service_name = ?,
      category = ?,
      description = ?,
      price = ?,
      unit = ?,
      active_status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(service_name, category, description, Number(price || 0), unit, active_status ?? 1, id);

  const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  res.json({ success: true, data: updated });
});

app.delete('/api/services/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM services WHERE id = ?').run(id);
  res.json({ success: true });
});

// ==========================================
// 4. INVOICES
// ==========================================
app.get('/api/invoices', (req: Request, res: Response) => {
  const invoices = db.prepare(`
    SELECT i.*, c.client_name, c.company_name
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    ORDER BY i.id DESC
  `).all();
  res.json({ data: invoices });
});

app.get('/api/invoices/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const invoice = db.prepare(`
    SELECT i.*, c.client_name, c.company_name, c.email as client_email, c.phone as client_phone, c.address as client_address
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.id = ?
  `).get(id) as any;

  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order ASC, id ASC').all(id);
  const payments = db.prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC, id DESC').all(id);

  res.json({
    data: {
      ...invoice,
      items,
      payments
    }
  });
});

app.post('/api/invoices', (req: Request, res: Response) => {
  const body = req.body;

  // Retrieve default prefix from company settings
  const settings = db.prepare('SELECT * FROM company_settings WHERE id = 1').get() as any;
  const prefix = settings?.invoice_prefix || 'HZS-INV';
  const invoice_number = body.invoice_number || getNextSequenceNumber(prefix, 'invoice');

  // Client snapshot
  let client_snapshot = '{}';
  if (body.client_id) {
    const cl = db.prepare('SELECT * FROM clients WHERE id = ?').get(body.client_id);
    if (cl) client_snapshot = JSON.stringify(cl);
  }

  const company_snapshot = JSON.stringify(settings || {});

  const items = body.items || [];
  let subtotal = 0;
  for (const it of items) {
    const itemSubtotal = (Number(it.price) || 0) * (Number(it.quantity) || 1) - (Number(it.discount) || 0);
    subtotal += itemSubtotal;
  }

  const discount_type = body.discount_type || 'percentage';
  const discount_value = Number(body.discount_value || 0);
  let discount_amount = 0;
  if (discount_type === 'percentage') {
    discount_amount = (subtotal * discount_value) / 100;
  } else {
    discount_amount = discount_value;
  }

  const taxable_amount = Math.max(0, subtotal - discount_amount);
  const tax_rate = Number(body.tax_rate ?? 11);
  const tax_amount = (taxable_amount * tax_rate) / 100;
  const grand_total = taxable_amount + tax_amount;
  const amount_paid = 0;
  const balance_due = grand_total;

  const issue_date = body.issue_date || dayjs().format('YYYY-MM-DD');
  const due_date = body.due_date || dayjs().add(7, 'day').format('YYYY-MM-DD');
  const status = body.status || 'Draft';

  const tx = db.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO invoices (
        invoice_number, client_id, status, issue_date, due_date, currency,
        payment_terms, reference_number, notes, template,
        subtotal, discount_type, discount_value, discount_amount,
        tax_rate, tax_amount, grand_total, amount_paid, balance_due,
        company_snapshot, client_snapshot
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?
      )
    `);

    const result = stmt.run(
      invoice_number,
      body.client_id || null,
      status,
      issue_date,
      due_date,
      body.currency || 'IDR',
      body.payment_terms || 'Due on Receipt',
      body.reference_number || '',
      body.notes || '',
      body.template || 'neobrutalism',
      subtotal,
      discount_type,
      discount_value,
      discount_amount,
      tax_rate,
      tax_amount,
      grand_total,
      amount_paid,
      balance_due,
      company_snapshot,
      client_snapshot
    );

    const invId = result.lastInsertRowid;

    const itemStmt = db.prepare(`
      INSERT INTO invoice_items (invoice_id, service_id, description, unit, price, quantity, discount, subtotal, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let idx = 0;
    for (const it of items) {
      const itPrice = Number(it.price) || 0;
      const itQty = Number(it.quantity) || 1;
      const itDisc = Number(it.discount) || 0;
      const itSub = itPrice * itQty - itDisc;
      itemStmt.run(invId, it.service_id || null, it.description || '', it.unit || 'item', itPrice, itQty, itDisc, itSub, idx++);
    }

    return invId;
  });

  const createdId = tx();
  const createdInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(createdId);
  res.status(201).json({ success: true, data: createdInvoice });
});

app.put('/api/invoices/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const body = req.body;

  const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const items = body.items || [];
  let subtotal = 0;
  for (const it of items) {
    const itemSubtotal = (Number(it.price) || 0) * (Number(it.quantity) || 1) - (Number(it.discount) || 0);
    subtotal += itemSubtotal;
  }

  const discount_type = body.discount_type || existing.discount_type;
  const discount_value = Number(body.discount_value ?? existing.discount_value);
  let discount_amount = 0;
  if (discount_type === 'percentage') {
    discount_amount = (subtotal * discount_value) / 100;
  } else {
    discount_amount = discount_value;
  }

  const taxable_amount = Math.max(0, subtotal - discount_amount);
  const tax_rate = Number(body.tax_rate ?? existing.tax_rate);
  const tax_amount = (taxable_amount * tax_rate) / 100;
  const grand_total = taxable_amount + tax_amount;
  const amount_paid = Number(existing.amount_paid || 0);
  const balance_due = Math.max(0, grand_total - amount_paid);

  // Recalculate status
  let status = body.status || existing.status;
  if (status !== 'Draft' && status !== 'Cancelled') {
    if (balance_due === 0 && grand_total > 0) {
      status = 'Paid';
    } else if (amount_paid > 0 && balance_due > 0) {
      status = 'Partially Paid';
    } else if (dayjs().isAfter(dayjs(body.due_date || existing.due_date), 'day') && balance_due > 0) {
      status = 'Overdue';
    } else if (amount_paid === 0) {
      status = 'Unpaid';
    }
  }

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE invoices SET
        client_id = ?,
        status = ?,
        issue_date = ?,
        due_date = ?,
        currency = ?,
        payment_terms = ?,
        reference_number = ?,
        notes = ?,
        template = ?,
        subtotal = ?,
        discount_type = ?,
        discount_value = ?,
        discount_amount = ?,
        tax_rate = ?,
        tax_amount = ?,
        grand_total = ?,
        balance_due = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      body.client_id ?? existing.client_id,
      status,
      body.issue_date || existing.issue_date,
      body.due_date || existing.due_date,
      body.currency || existing.currency,
      body.payment_terms || existing.payment_terms,
      body.reference_number || existing.reference_number,
      body.notes || existing.notes,
      body.template || existing.template,
      subtotal,
      discount_type,
      discount_value,
      discount_amount,
      tax_rate,
      tax_amount,
      grand_total,
      balance_due,
      id
    );

    if (body.items) {
      db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(id);
      const itemStmt = db.prepare(`
        INSERT INTO invoice_items (invoice_id, service_id, description, unit, price, quantity, discount, subtotal, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let idx = 0;
      for (const it of items) {
        const itPrice = Number(it.price) || 0;
        const itQty = Number(it.quantity) || 1;
        const itDisc = Number(it.discount) || 0;
        const itSub = itPrice * itQty - itDisc;
        itemStmt.run(id, it.service_id || null, it.description || '', it.unit || 'item', itPrice, itQty, itDisc, itSub, idx++);
      }
    }
  });

  tx();
  const updated = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  res.json({ success: true, data: updated });
});

app.delete('/api/invoices/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
  res.json({ success: true });
});

// Download / Preview PDF
app.get('/api/invoices/:id/pdf', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as any;
  if (!inv) return res.status(404).send('Invoice not found');

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(inv.client_id) as any;
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order ASC, id ASC').all(id) as any[];
  const settings = db.prepare('SELECT * FROM company_settings WHERE id = 1').get() as any;

  const renderData: InvoiceRenderData = {
    invoice_number: inv.invoice_number,
    issue_date: inv.issue_date,
    due_date: inv.due_date,
    currency: inv.currency,
    status: inv.status,
    payment_terms: inv.payment_terms,
    reference_number: inv.reference_number,
    notes: inv.notes,
    template: (req.query.template as any) || (inv.template !== 'premium' ? inv.template : (settings?.default_template || 'neobrutalism')),
    subtotal: inv.subtotal,
    discount_type: inv.discount_type,
    discount_value: inv.discount_value,
    discount_amount: inv.discount_amount,
    tax_rate: inv.tax_rate,
    tax_amount: inv.tax_amount,
    grand_total: inv.grand_total,
    amount_paid: inv.amount_paid,
    balance_due: inv.balance_due,
    company: {
      business_name: settings?.business_name || 'HYPEZONE STUDIO',
      tagline: settings?.tagline,
      address: settings?.address,
      email: settings?.email,
      phone: settings?.phone,
      website: settings?.website,
      tax_number: settings?.tax_number,
      bank_name: settings?.bank_name,
      account_number: settings?.account_number,
      account_holder: settings?.account_holder,
      branch: settings?.branch,
      payment_instructions: settings?.payment_instructions,
      default_footer: settings?.default_footer
    },
    client: {
      client_name: client?.client_name || 'Klien Umum',
      company_name: client?.company_name,
      email: client?.email,
      phone: client?.phone,
      address: client?.address,
      tax_id: client?.tax_id
    },
    items: items.map((it) => ({
      description: it.description,
      unit: it.unit,
      price: it.price,
      quantity: it.quantity,
      discount: it.discount,
      subtotal: it.subtotal
    }))
  };

  const html = generateInvoiceHtml(renderData);

  if (req.query.format === 'html') {
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }

  try {
    const pdfBuf = await renderPdfBuffer(html);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${inv.invoice_number}.pdf"`);
    res.send(pdfBuf);
  } catch (err: any) {
    console.error('PDF generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
    }
  }
});

// ==========================================
// 5. PAYMENTS
// ==========================================
app.get('/api/payments', (req: Request, res: Response) => {
  const payments = db.prepare(`
    SELECT p.*, i.invoice_number, c.client_name, c.company_name
    FROM payments p
    JOIN invoices i ON p.invoice_id = i.id
    LEFT JOIN clients c ON i.client_id = c.id
    ORDER BY p.id DESC
  `).all();
  res.json({ data: payments });
});

app.post('/api/payments', (req: Request, res: Response) => {
  const { invoice_id, payment_date, payment_amount, payment_method, reference_number, notes } = req.body;
  if (!invoice_id || !payment_amount) {
    return res.status(400).json({ error: 'Invoice ID and payment amount are required' });
  }

  const amt = Number(payment_amount);
  if (amt <= 0) {
    return res.status(400).json({ error: 'Payment amount must be greater than zero' });
  }

  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice_id) as any;
  if (!inv) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const payment_number = getNextSequenceNumber('HZS-PAY', 'payment');

  const tx = db.transaction(() => {
    // 1. Insert payment record
    const payStmt = db.prepare(`
      INSERT INTO payments (payment_number, invoice_id, payment_date, payment_amount, payment_method, reference_number, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const pRes = payStmt.run(
      payment_number,
      invoice_id,
      payment_date || dayjs().format('YYYY-MM-DD'),
      amt,
      payment_method || 'Bank Transfer',
      reference_number || '',
      notes || ''
    );

    // 2. Recalculate invoice totals and status
    const allPayments = db.prepare('SELECT SUM(payment_amount) as total FROM payments WHERE invoice_id = ?').get(invoice_id) as { total: number };
    const newPaid = allPayments.total || 0;
    const newBalance = Math.max(0, inv.grand_total - newPaid);

    let newStatus = inv.status;
    if (newBalance === 0) {
      newStatus = 'Paid';
    } else if (newPaid > 0) {
      newStatus = 'Partially Paid';
    } else {
      newStatus = 'Unpaid';
    }

    db.prepare(`
      UPDATE invoices SET
        amount_paid = ?,
        balance_due = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newPaid, newBalance, newStatus, invoice_id);

    return pRes.lastInsertRowid;
  });

  const payId = tx();
  const createdPayment = db.prepare('SELECT * FROM payments WHERE id = ?').get(payId);
  res.status(201).json({ success: true, data: createdPayment });
});

// ==========================================
// 6. QUOTATIONS
// ==========================================
app.get('/api/quotations', (req: Request, res: Response) => {
  const quotations = db.prepare(`
    SELECT q.*, c.client_name, c.company_name
    FROM quotations q
    LEFT JOIN clients c ON q.client_id = c.id
    ORDER BY q.id DESC
  `).all();
  res.json({ data: quotations });
});

app.post('/api/quotations', (req: Request, res: Response) => {
  const body = req.body;
  const quotation_number = body.quotation_number || getNextSequenceNumber('HZS-QUO', 'quotation');

  const items = body.items || [];
  let subtotal = 0;
  for (const it of items) {
    const itemSubtotal = (Number(it.price) || 0) * (Number(it.quantity) || 1) - (Number(it.discount) || 0);
    subtotal += itemSubtotal;
  }

  const discount_type = body.discount_type || 'percentage';
  const discount_value = Number(body.discount_value || 0);
  let discount_amount = 0;
  if (discount_type === 'percentage') {
    discount_amount = (subtotal * discount_value) / 100;
  } else {
    discount_amount = discount_value;
  }

  const taxable_amount = Math.max(0, subtotal - discount_amount);
  const tax_rate = Number(body.tax_rate ?? 11);
  const tax_amount = (taxable_amount * tax_rate) / 100;
  const grand_total = taxable_amount + tax_amount;

  const tx = db.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO quotations (
        quotation_number, client_id, status, issue_date, expiration_date, currency, notes,
        subtotal, discount_type, discount_value, discount_amount, tax_rate, tax_amount, grand_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      quotation_number,
      body.client_id || null,
      body.status || 'Draft',
      body.issue_date || dayjs().format('YYYY-MM-DD'),
      body.expiration_date || dayjs().add(14, 'day').format('YYYY-MM-DD'),
      body.currency || 'IDR',
      body.notes || '',
      subtotal,
      discount_type,
      discount_value,
      discount_amount,
      tax_rate,
      tax_amount,
      grand_total
    );

    const qId = result.lastInsertRowid;
    const itemStmt = db.prepare(`
      INSERT INTO quotation_items (quotation_id, service_id, description, unit, price, quantity, discount, subtotal, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let idx = 0;
    for (const it of items) {
      const itPrice = Number(it.price) || 0;
      const itQty = Number(it.quantity) || 1;
      const itDisc = Number(it.discount) || 0;
      const itSub = itPrice * itQty - itDisc;
      itemStmt.run(qId, it.service_id || null, it.description || '', it.unit || 'item', itPrice, itQty, itDisc, itSub, idx++);
    }

    return qId;
  });

  const quoId = tx();
  const createdQuo = db.prepare('SELECT * FROM quotations WHERE id = ?').get(quoId);
  res.status(201).json({ success: true, data: createdQuo });
});

// Convert quotation to invoice
app.post('/api/quotations/:id/convert', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const quo = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id) as any;
  if (!quo) return res.status(404).json({ error: 'Quotation not found' });

  const quoItems = db.prepare('SELECT * FROM quotation_items WHERE quotation_id = ?').all(id) as any[];
  const settings = db.prepare('SELECT * FROM company_settings WHERE id = 1').get() as any;
  const invNumber = getNextSequenceNumber(settings?.invoice_prefix || 'HZS-INV', 'invoice');

  const tx = db.transaction(() => {
    const invStmt = db.prepare(`
      INSERT INTO invoices (
        invoice_number, client_id, status, issue_date, due_date, currency,
        reference_number, notes, subtotal, discount_type, discount_value, discount_amount,
        tax_rate, tax_amount, grand_total, amount_paid, balance_due, company_snapshot
      ) VALUES (?, ?, 'Unpaid', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `);

    const invRes = invStmt.run(
      invNumber,
      quo.client_id,
      dayjs().format('YYYY-MM-DD'),
      dayjs().add(7, 'day').format('YYYY-MM-DD'),
      quo.currency,
      `From Quotation ${quo.quotation_number}`,
      quo.notes,
      quo.subtotal,
      quo.discount_type,
      quo.discount_value,
      quo.discount_amount,
      quo.tax_rate,
      quo.tax_amount,
      quo.grand_total,
      quo.grand_total,
      JSON.stringify(settings || {})
    );

    const invId = invRes.lastInsertRowid;
    const itStmt = db.prepare(`
      INSERT INTO invoice_items (invoice_id, service_id, description, unit, price, quantity, discount, subtotal, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const it of quoItems) {
      itStmt.run(invId, it.service_id, it.description, it.unit, it.price, it.quantity, it.discount, it.subtotal, it.sort_order);
    }

    // Update quotation status
    db.prepare("UPDATE quotations SET status = 'Converted', converted_invoice_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(invId, id);

    return invId;
  });

  const createdInvId = tx();
  const createdInv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(createdInvId);
  res.json({ success: true, data: createdInv });
});

// ==========================================
// 7. RECURRING INVOICES
// ==========================================
app.get('/api/recurring', (req: Request, res: Response) => {
  const recurring = db.prepare(`
    SELECT r.*, c.client_name, c.company_name
    FROM recurring_invoices r
    JOIN clients c ON r.client_id = c.id
    ORDER BY r.id DESC
  `).all();
  res.json({ data: recurring });
});

app.post('/api/recurring', (req: Request, res: Response) => {
  const { title, client_id, frequency, amount, start_date, end_date, next_invoice_date, template, items } = req.body;
  if (!title || !client_id || !frequency) {
    return res.status(400).json({ error: 'Title, client, and frequency are required' });
  }

  const info = db.prepare(`
    INSERT INTO recurring_invoices (title, client_id, frequency, amount, start_date, end_date, next_invoice_date, template, items_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    client_id,
    frequency,
    Number(amount || 0),
    start_date || dayjs().format('YYYY-MM-DD'),
    end_date || null,
    next_invoice_date || dayjs().format('YYYY-MM-DD'),
    template || 'premium',
    JSON.stringify(items || [])
  );

  const created = db.prepare('SELECT * FROM recurring_invoices WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ success: true, data: created });
});

app.post('/api/recurring/:id/trigger', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const rec = db.prepare('SELECT * FROM recurring_invoices WHERE id = ?').get(id) as any;
  if (!rec) return res.status(404).json({ error: 'Recurring plan not found' });

  const items = JSON.parse(rec.items_json || '[]');
  const settings = db.prepare('SELECT * FROM company_settings WHERE id = 1').get() as any;
  const invNumber = getNextSequenceNumber(settings?.invoice_prefix || 'HZS-INV', 'invoice');

  let subtotal = 0;
  for (const it of items) {
    subtotal += (Number(it.price) || 0) * (Number(it.quantity) || 1);
  }
  const taxRate = settings?.default_tax_rate ?? 11;
  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxAmount;

  const tx = db.transaction(() => {
    const invRes = db.prepare(`
      INSERT INTO invoices (
        invoice_number, client_id, status, issue_date, due_date, currency,
        reference_number, notes, subtotal, tax_rate, tax_amount, grand_total, amount_paid, balance_due
      ) VALUES (?, ?, 'Unpaid', ?, ?, 'IDR', ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      invNumber,
      rec.client_id,
      dayjs().format('YYYY-MM-DD'),
      dayjs().add(7, 'day').format('YYYY-MM-DD'),
      `Recurring: ${rec.title}`,
      `Invoice rutin: ${rec.title}`,
      subtotal,
      taxRate,
      taxAmount,
      grandTotal,
      grandTotal
    );

    const invId = invRes.lastInsertRowid;
    const itStmt = db.prepare(`
      INSERT INTO invoice_items (invoice_id, service_id, description, unit, price, quantity, discount, subtotal)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `);

    for (const it of items) {
      const price = Number(it.price) || 0;
      const qty = Number(it.quantity) || 1;
      itStmt.run(invId, it.service_id || null, it.description || '', it.unit || 'item', price, qty, price * qty);
    }

    // Advance next invoice date based on frequency
    let nextDate = dayjs(rec.next_invoice_date);
    if (rec.frequency === 'Weekly') nextDate = nextDate.add(1, 'week');
    else if (rec.frequency === 'Monthly') nextDate = nextDate.add(1, 'month');
    else if (rec.frequency === 'Quarterly') nextDate = nextDate.add(3, 'month');
    else if (rec.frequency === 'Yearly') nextDate = nextDate.add(1, 'year');

    db.prepare('UPDATE recurring_invoices SET next_invoice_date = ?, last_generated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      nextDate.format('YYYY-MM-DD'),
      id
    );

    return invId;
  });

  const createdId = tx();
  const createdInv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(createdId);
  res.json({ success: true, data: createdInv });
});

// ==========================================
// 8. EXPENSES
// ==========================================
app.get('/api/expenses', (req: Request, res: Response) => {
  const expenses = db.prepare('SELECT * FROM expenses ORDER BY expense_date DESC, id DESC').all();
  res.json({ data: expenses });
});

app.post('/api/expenses', (req: Request, res: Response) => {
  const { expense_name, category, amount, expense_date, payment_method, notes } = req.body;
  if (!expense_name || !amount) {
    return res.status(400).json({ error: 'Expense name and amount are required' });
  }

  const info = db.prepare(`
    INSERT INTO expenses (expense_name, category, amount, expense_date, payment_method, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    expense_name,
    category || 'Operational',
    Number(amount || 0),
    expense_date || dayjs().format('YYYY-MM-DD'),
    payment_method || 'Bank Transfer',
    notes || ''
  );

  const created = db.prepare('SELECT * FROM expenses WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ success: true, data: created });
});

app.delete('/api/expenses/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  res.json({ success: true });
});

// ==========================================
// 9. DASHBOARD & FINANCIAL REPORTS
// ==========================================
app.get('/api/dashboard', (req: Request, res: Response) => {
  // Update overdue status dynamically before fetching
  const today = dayjs().format('YYYY-MM-DD');
  db.prepare(`
    UPDATE invoices
    SET status = 'Overdue'
    WHERE due_date < ? AND balance_due > 0 AND status NOT IN ('Paid', 'Cancelled')
  `).run(today);

  const stats = db.prepare(`
    SELECT
      COALESCE(SUM(grand_total), 0) as total_revenue,
      COUNT(*) as total_invoices,
      SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END) as paid_invoices,
      SUM(CASE WHEN status = 'Unpaid' THEN 1 ELSE 0 END) as unpaid_invoices,
      SUM(CASE WHEN status = 'Partially Paid' THEN 1 ELSE 0 END) as partially_paid_invoices,
      SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) as overdue_invoices,
      COALESCE(SUM(amount_paid), 0) as total_cash_received,
      COALESCE(SUM(balance_due), 0) as total_outstanding
    FROM invoices
    WHERE status != 'Cancelled'
  `).get() as any;

  const totalExpenses = (db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM expenses').get() as any).total || 0;

  const recentInvoices = db.prepare(`
    SELECT i.id, i.invoice_number, i.issue_date, i.due_date, i.grand_total, i.status, c.client_name, c.company_name
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    ORDER BY i.id DESC
    LIMIT 6
  `).all();

  const recentPayments = db.prepare(`
    SELECT p.*, i.invoice_number, c.client_name
    FROM payments p
    JOIN invoices i ON p.invoice_id = i.id
    LEFT JOIN clients c ON i.client_id = c.id
    ORDER BY p.id DESC
    LIMIT 5
  `).all();

  const monthlyRevenue = db.prepare(`
    SELECT
      strftime('%Y-%m', issue_date) as month,
      SUM(grand_total) as billed,
      SUM(amount_paid) as collected
    FROM invoices
    WHERE status != 'Cancelled'
    GROUP BY strftime('%Y-%m', issue_date)
    ORDER BY month DESC
    LIMIT 6
  `).all().reverse();

  res.json({
    data: {
      stats: {
        ...stats,
        total_expenses: totalExpenses,
        net_cash_flow: (stats.total_cash_received || 0) - totalExpenses
      },
      recent_invoices: recentInvoices,
      recent_payments: recentPayments,
      monthly_revenue: monthlyRevenue
    }
  });
});

// Alias for reports financial
app.get('/api/reports/financial', (req: Request, res: Response) => {
  const { start_date, end_date } = req.query;
  const whereInvoices = [];
  const wherePayments = [];
  const whereExpenses = [];
  const params: any[] = [];

  if (start_date) {
    whereInvoices.push('issue_date >= ?');
    wherePayments.push('payment_date >= ?');
    whereExpenses.push('expense_date >= ?');
    params.push(start_date);
  }
  if (end_date) {
    whereInvoices.push('issue_date <= ?');
    wherePayments.push('payment_date <= ?');
    whereExpenses.push('expense_date <= ?');
    params.push(end_date);
  }

  const wInv = whereInvoices.length ? `WHERE ${whereInvoices.join(' AND ')}` : '';
  const wPay = wherePayments.length ? `WHERE ${wherePayments.join(' AND ')}` : '';
  const wExp = whereExpenses.length ? `WHERE ${whereExpenses.join(' AND ')}` : '';

  const grossRevenue = db.prepare(`SELECT COALESCE(SUM(grand_total), 0) as total FROM invoices ${wInv}`).get(...params) as any;
  const cashCollected = db.prepare(`SELECT COALESCE(SUM(payment_amount), 0) as total FROM payments ${wPay}`).get(...params) as any;
  const totalExpenses = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses ${wExp}`).get(...params) as any;

  res.json({
    data: {
      gross_revenue: grossRevenue.total,
      cash_collected: cashCollected.total,
      total_expenses: totalExpenses.total,
      net_income: cashCollected.total - totalExpenses.total
    }
  });
});

app.get('/api/reports', (req: Request, res: Response) => {
  const { start_date, end_date } = req.query;

  let invQuery = "SELECT * FROM invoices WHERE status != 'Cancelled'";
  let payQuery = 'SELECT * FROM payments WHERE 1=1';
  let expQuery = 'SELECT * FROM expenses WHERE 1=1';

  const params: any[] = [];
  if (start_date && end_date) {
    invQuery += ' AND issue_date BETWEEN ? AND ?';
    payQuery += ' AND payment_date BETWEEN ? AND ?';
    expQuery += ' AND expense_date BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }

  const invoices = db.prepare(invQuery).all(...params) as any[];
  const payments = db.prepare(payQuery).all(...params) as any[];
  const expenses = db.prepare(expQuery).all(...params) as any[];

  const grossRevenue = invoices.reduce((acc, i) => acc + (i.grand_total || 0), 0);
  const cashReceived = payments.reduce((acc, p) => acc + (p.payment_amount || 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const outstanding = invoices.reduce((acc, i) => acc + (i.balance_due || 0), 0);
  const netCashFlow = cashReceived - totalExpenses;

  res.json({
    data: {
      gross_revenue: grossRevenue,
      cash_received: cashReceived,
      total_expenses: totalExpenses,
      outstanding: outstanding,
      net_cash_flow: netCashFlow,
      invoices_count: invoices.length,
      payments_count: payments.length,
      expenses_count: expenses.length,
      invoices,
      payments,
      expenses
    }
  });
});

// ==========================================
// 10. BACKUP & RESTORE
// ==========================================
const backupDir = path.resolve(__dirname, '../../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

app.post('/api/backup/now', (req: Request, res: Response) => {
  try {
    const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
    const backupFileName = `backup_hypezone_${timestamp}.db`;
    const backupFilePath = path.join(backupDir, backupFileName);

    // SQLite backup API
    db.backup(backupFilePath)
      .then(() => {
        const stats = fs.statSync(backupFilePath);
        res.json({
          success: true,
          file: backupFileName,
          path: backupFilePath,
          size: stats.size,
          created_at: timestamp
        });
      })
      .catch((err) => {
        res.status(500).json({ error: 'Backup failed', details: err.message });
      });
  } catch (err: any) {
    res.status(500).json({ error: 'Backup error', details: err.message });
  }
});

app.get('/api/backup/list', (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.db'));
    const list = files.map((f) => {
      const p = path.join(backupDir, f);
      const s = fs.statSync(p);
      return {
        name: f,
        size: s.size,
        created_at: s.birthtime
      };
    });
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`HypeZone Studio Invoice API running at http://localhost:${PORT}`);
});
