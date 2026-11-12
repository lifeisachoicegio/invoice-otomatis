import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchApi, formatIDR } from '../api';
import {
  Plus,
  Trash2,
  FileDown,
  Save,
  Eye,
  CheckCircle2,
  UserPlus,
  Layers,
  ArrowLeft,
} from 'lucide-react';

interface InvoiceItem {
  id?: number;
  service_id?: number;
  description: string;
  unit: string;
  price: number;
  quantity: number;
  discount: number;
  subtotal: number;
}

export const InvoiceCreator: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [clientId, setClientId] = useState<number | ''>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = useState('Due on Receipt');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [template, setTemplate] = useState<'premium' | 'dark' | 'minimal' | 'neobrutalism'>('neobrutalism');

  // Items
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: 'Short Form Video (Reels/TikTok)', unit: 'video', price: 450000, quantity: 2, discount: 0, subtotal: 900000 },
  ]);

  // Financial calculations
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(11);

  useEffect(() => {
    Promise.all([
      fetchApi('/clients'),
      fetchApi('/services'),
      fetchApi('/settings'),
    ])
      .then(([cRes, sRes, setRes]) => {
        setClients(cRes.data || []);
        setServices(sRes.data || []);
        setSettings(setRes.data || {});
        if (setRes.data) {
          setTaxRate(setRes.data.default_tax_rate ?? 11);
          setNotes(setRes.data.default_notes || '');
          setTemplate(setRes.data.default_template || 'neobrutalism');
        }

        if (id) {
          fetchApi(`/invoices/${id}`).then((invRes) => {
            const inv = invRes.data;
            setClientId(inv.client_id || '');
            setInvoiceNumber(inv.invoice_number);
            setIssueDate(inv.issue_date);
            setDueDate(inv.due_date);
            setPaymentTerms(inv.payment_terms || 'Due on Receipt');
            setReferenceNumber(inv.reference_number || '');
            setNotes(inv.notes || '');
            setTemplate(inv.template || 'premium');
            setDiscountType(inv.discount_type || 'percentage');
            setDiscountValue(inv.discount_value || 0);
            setTaxRate(inv.tax_rate ?? 11);
            if (inv.items && inv.items.length > 0) {
              setItems(inv.items);
            }
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  // Recalculate item subtotals
  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    const p = Number(item.price) || 0;
    const q = Number(item.quantity) || 1;
    const d = Number(item.discount) || 0;
    item.subtotal = p * q - d;
    updated[index] = item;
    setItems(updated);
  };

  const handleSelectService = (index: number, serviceId: string) => {
    if (!serviceId) return;
    const s = services.find((srv) => srv.id === Number(serviceId));
    if (s) {
      const updated = [...items];
      updated[index] = {
        ...updated[index],
        service_id: s.id,
        description: s.service_name,
        unit: s.unit || 'item',
        price: s.price,
        subtotal: s.price * (updated[index].quantity || 1),
      };
      setItems(updated);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      { description: '', unit: 'item', price: 0, quantity: 1, discount: 0, subtotal: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Math totals
  const subtotal = items.reduce((acc, it) => acc + (it.subtotal || 0), 0);
  const discountAmount =
    discountType === 'percentage' ? (subtotal * (Number(discountValue) || 0)) / 100 : Number(discountValue) || 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * (Number(taxRate) || 0)) / 100;
  const grandTotal = taxableAmount + taxAmount;

  const handleSave = async (statusOverride?: string) => {
    if (!clientId) {
      alert('Pilih klien terlebih dahulu!');
      return;
    }
    if (items.some((it) => !it.description.trim())) {
      alert('Lengkapi seluruh deskripsi item invoice!');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        client_id: clientId,
        invoice_number: invoiceNumber || undefined,
        issue_date: issueDate,
        due_date: dueDate,
        payment_terms: paymentTerms,
        reference_number: referenceNumber,
        notes,
        template,
        discount_type: discountType,
        discount_value: discountValue,
        tax_rate: taxRate,
        status: statusOverride || 'Unpaid',
        items,
      };

      if (id) {
        await fetchApi(`/invoices/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('Invoice berhasil diperbarui!');
      } else {
        await fetchApi('/invoices', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('Invoice berhasil dibuat!');
      }
      navigate('/invoices');
    } catch (err: any) {
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === Number(clientId));

  if (loading) {
    return <div className="p-8 text-brand-muted">Menyiapkan Invoice Creator...</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 rounded-xl bg-brand-card hover:bg-brand-surface border border-brand-border text-brand-muted hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              {id ? 'Edit Invoice' : 'Buat Invoice Baru'}
            </h2>
            <p className="text-xs text-brand-muted">
              Live split-view: Isi form di kiri, pratinjau instan di kanan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSave('Draft')}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-brand-surface hover:bg-brand-border border border-brand-border text-xs font-bold text-white transition-all"
          >
            Simpan Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave('Unpaid')}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-brand-electric to-brand-indigo hover:opacity-95 text-xs font-bold text-white shadow-lg shadow-brand-electric/25 transition-all"
          >
            <Save size={16} />
            {saving ? 'Menyimpan...' : 'Terbitkan Invoice'}
          </button>
        </div>
      </div>

      {/* Split View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Input Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Client & Invoice Info */}
          <div className="bg-brand-card p-6 rounded-2xl border border-brand-border space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-brand-electric" /> Informasi Invoice & Klien
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1.5">
                  Pilih Klien <span className="text-rose-500">*</span>
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(Number(e.target.value) || '')}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-electric"
                >
                  <option value="">-- Pilih Klien Terdaftar --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.client_name} {c.company_name ? `(${c.company_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1.5">
                  Nomor Invoice (Auto)
                </label>
                <input
                  type="text"
                  placeholder="Otomatis dibuat jika kosong"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-electric font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1.5">
                  Tanggal Terbit
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-electric"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1.5">
                  Jatuh Tempo
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-electric"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1.5">
                  Termin Pembayaran
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-electric"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1.5">
                  Nomor Referensi / PO
                </label>
                <input
                  type="text"
                  placeholder="Opsional (PO-001 / Project ID)"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-electric"
                />
              </div>
            </div>
          </div>

          {/* Card: Invoice Items */}
          <div className="bg-brand-card p-6 rounded-2xl border border-brand-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Daftar Item & Jasa
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 text-xs font-bold text-brand-electric hover:underline"
              >
                <Plus size={15} /> Tambah Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-brand-muted">Item #{idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <select
                        onChange={(e) => handleSelectService(idx, e.target.value)}
                        className="bg-brand-card border border-brand-border rounded-lg px-2 py-1 text-[11px] text-brand-electric font-semibold focus:outline-none"
                      >
                        <option value="">Pilih dari Katalog Jasa...</option>
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.service_name} ({formatIDR(s.price)})
                          </option>
                        ))}
                      </select>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-brand-muted hover:text-rose-400 p-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Deskripsi jasa / produk..."
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      className="w-full bg-brand-card border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-electric"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] text-brand-muted block mb-1">Satuan</label>
                      <input
                        type="text"
                        placeholder="video, jam, dll"
                        value={item.unit}
                        onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                        className="w-full bg-brand-card border border-brand-border rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-brand-muted block mb-1">Harga (Rp)</label>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(idx, 'price', Number(e.target.value))}
                        className="w-full bg-brand-card border border-brand-border rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-brand-muted block mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                        className="w-full bg-brand-card border border-brand-border rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-brand-muted block mb-1">Subtotal</label>
                      <div className="text-xs font-bold text-white pt-2">
                        {formatIDR(item.subtotal)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Calculations, Notes & Templates */}
          <div className="bg-brand-card p-6 rounded-2xl border border-brand-border space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Diskon, Pajak & Catatan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1.5">
                  Diskon
                </label>
                <div className="flex gap-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="bg-brand-surface border border-brand-border rounded-xl px-2.5 py-2 text-xs text-white"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1.5">
                  Tarif Pajak PPN (%)
                </label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1.5">
                  Template Desain PDF
                </label>
                <select
                  value={template}
                  onChange={(e: any) => setTemplate(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="neobrutalism">Template Neo-Brutalism (Retro Pop / Poster Design)</option>
                  <option value="premium">Template A — HypeZone Premium (Putih Elegan)</option>
                  <option value="dark">Template B — HypeZone Dark (Navy Mewah)</option>
                  <option value="minimal">Template C — HypeZone Minimalis</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-brand-muted mb-1.5">
                  Catatan Tambahan untuk Klien
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Invoice Preview */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="bg-brand-card p-6 rounded-2xl border border-brand-border shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
              <div>
                <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-wider">
                  Live Preview
                </span>
                <h4 className="text-base font-extrabold text-white">Invoice Pratinjau</h4>
              </div>
              <span className="px-3 py-1 bg-brand-surface border border-brand-border rounded-full text-[10px] font-bold text-brand-muted">
                {template.toUpperCase()}
              </span>
            </div>

            {/* Inner Preview Canvas */}
            {template === 'neobrutalism' ? (
              <div className="p-5 rounded-2xl bg-white text-black border-4 border-black shadow-[4px_4px_0px_#000000] font-sans">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-3xl font-black tracking-tighter uppercase leading-none">INVOICE</div>
                    <div className="text-[11px] font-bold mt-1 text-slate-800">{issueDate || 'YYYY-MM-DD'}</div>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <div className="font-black text-sm">{settings?.business_name || 'HYPEZONE STUDIO'}</div>
                      <div className="text-[9px] font-bold text-slate-600">{settings?.tagline || 'Creative & Digital Agency'}</div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-[#FEE05C] border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center font-black text-xs">
                      HZ
                    </div>
                  </div>
                </div>

                {/* Client Box & Meta */}
                <div className="space-y-[-4px] mb-4">
                  <div className="bg-[#FEE05C] border-2 border-black rounded-lg p-2 font-black text-xs shadow-[2px_2px_0px_#000] relative z-10 flex justify-between">
                    <span>{selectedClient?.client_name || 'Nama Klien'}</span>
                    <span className="text-[10px]">{selectedClient?.phone || ''}</span>
                  </div>
                  <div className="bg-[#4D74C9] border-2 border-black rounded-lg p-2.5 text-white font-semibold text-[10px] shadow-[2px_2px_0px_#000]">
                    <div>{selectedClient?.email || 'email@klien.com'}</div>
                    <div className="truncate">{selectedClient?.address || selectedClient?.company_name || 'Indonesia'}</div>
                  </div>
                </div>

                {/* Items */}
                <div className="border-b-2 border-black mb-3">
                  <div className="flex justify-between font-black text-[10px] uppercase border-b-2 border-black pb-1">
                    <span>Item</span>
                    <span>Total</span>
                  </div>
                  {items.map((it, idx) => (
                    <div key={idx} className="flex justify-between py-1.5 border-b border-black text-[11px] font-medium">
                      <span className="truncate max-w-[150px] font-bold">
                        {it.description || 'Layanan Studio'}
                      </span>
                      <span className="font-extrabold">{formatIDR(it.subtotal)}</span>
                    </div>
                  ))}
                </div>

                {/* Bottom section */}
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between font-bold">
                    <span>Subtotal</span>
                    <span>{formatIDR(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between font-bold text-red-600">
                      <span>Discount</span>
                      <span>-{formatIDR(discountAmount)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between font-bold">
                      <span>Tax ({taxRate}%)</span>
                      <span>+{formatIDR(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm pt-1.5 border-t-2 border-black">
                    <span>Total</span>
                    <span>{formatIDR(grandTotal)}</span>
                  </div>
                </div>

                {/* Payment card */}
                <div className="mt-3 p-2 bg-[#B689C8] border-2 border-black shadow-[2px_2px_0px_#000] rounded-lg text-white text-[10px]">
                  <div className="font-black">Payment Method:</div>
                  <div className="font-mono font-bold text-xs">{settings?.bank_name} {settings?.account_number}</div>
                  <div className="opacity-90">a.n. {settings?.account_holder}</div>
                </div>
              </div>
            ) : (
              <div
                className={`p-6 rounded-xl border transition-colors ${
                  template === 'dark'
                    ? 'bg-[#080B18] text-white border-brand-border'
                    : 'bg-white text-slate-800 border-slate-200'
                }`}
              >
                {/* Header preview */}
                <div className="flex justify-between items-start border-b pb-4 mb-4 border-slate-200 dark:border-brand-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-electric to-brand-violet flex items-center justify-center font-black text-white text-xs">
                      HZ
                    </div>
                    <div>
                      <div className="font-extrabold text-xs tracking-wide">
                        {settings?.business_name || 'HYPEZONE STUDIO'}
                      </div>
                      <div className="text-[9px] opacity-70">
                        {settings?.tagline || 'Creative & Digital Agency'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-extrabold text-brand-electric">INVOICE</div>
                    <div className="text-[10px] font-mono font-bold">
                      {invoiceNumber || 'HZS-INV-PREVIEW'}
                    </div>
                  </div>
                </div>

                {/* Client Info preview */}
                <div className="mb-4 text-[11px] space-y-0.5">
                  <div className="text-[9px] font-bold uppercase opacity-60">Ditagihkan Kepada:</div>
                  <div className="font-bold text-xs">{selectedClient?.client_name || 'Nama Klien'}</div>
                  <div className="opacity-80">{selectedClient?.company_name}</div>
                  <div className="opacity-70 text-[10px]">{selectedClient?.address}</div>
                </div>

                {/* Items List */}
                <div className="space-y-1.5 mb-4 text-[11px]">
                  <div className="flex justify-between font-bold border-b pb-1 opacity-70 text-[9px] uppercase">
                    <span>Deskripsi</span>
                    <span>Subtotal</span>
                  </div>
                  {items.map((it, i) => (
                    <div key={i} className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-brand-border">
                      <span className="truncate max-w-[160px] font-medium">
                        {it.description || 'Item belum diberi nama'}
                      </span>
                      <span className="font-bold">{formatIDR(it.subtotal)}</span>
                    </div>
                  ))}
                </div>

                {/* Math Summary */}
                <div className="space-y-1 text-[11px] pt-2 border-t border-slate-200 dark:border-brand-border">
                  <div className="flex justify-between opacity-80">
                    <span>Subtotal</span>
                    <span>{formatIDR(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-rose-500">
                      <span>Diskon</span>
                      <span>-{formatIDR(discountAmount)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between opacity-80">
                      <span>PPN ({taxRate}%)</span>
                      <span>+{formatIDR(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-sm pt-2 border-t border-slate-300 dark:border-brand-border text-brand-electric">
                    <span>Grand Total</span>
                    <span>{formatIDR(grandTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bank details note */}
            <div className="p-3 rounded-xl bg-brand-surface border border-brand-border text-[11px] text-brand-muted">
              Transfer: <strong className="text-white">{settings?.bank_name} {settings?.account_number}</strong> (a.n. {settings?.account_holder})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
