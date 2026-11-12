import React, { useState, useEffect } from 'react';
import { fetchApi, formatIDR } from '../api';
import { Plus, Search, DollarSign, Calendar, CreditCard, X } from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [invoiceId, setInvoiceId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('Bank Transfer');
  const [refNum, setRefNum] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = () => {
    Promise.all([fetchApi('/payments'), fetchApi('/invoices')])
      .then(([pRes, iRes]) => {
        setPayments(pRes.data || []);
        // Only invoices with balance_due > 0 or not paid
        setInvoices(iRes.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdd = () => {
    setInvoiceId('');
    setAmount(0);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setMethod('Bank Transfer');
    setRefNum('');
    setNotes('');
    setShowModal(true);
  };

  const handleSelectInvoice = (idStr: string) => {
    const numId = Number(idStr);
    setInvoiceId(numId || '');
    const inv = invoices.find((i) => i.id === numId);
    if (inv) {
      setAmount(inv.balance_due);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId || !amount || amount <= 0) {
      alert('Pilih invoice dan masukkan jumlah pembayaran yang valid!');
      return;
    }

    try {
      await fetchApi('/payments', {
        method: 'POST',
        body: JSON.stringify({
          invoice_id: invoiceId,
          payment_amount: amount,
          payment_date: paymentDate,
          payment_method: method,
          reference_number: refNum,
          notes,
        }),
      });
      alert('Pembayaran berhasil dicatat!');
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Catatan Pembayaran</h2>
          <p className="text-xs text-brand-muted">
            Riwayat penerimaan pembayaran klien, pelunasan, dan uang muka (DP)
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-electric to-brand-indigo text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-brand-electric/25"
        >
          <Plus size={16} /> Catat Pembayaran Baru
        </button>
      </div>

      <div className="bg-brand-card rounded-2xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-surface text-brand-muted text-[11px] font-bold uppercase tracking-wider border-b border-brand-border">
                <th className="py-3 px-6">ID Bukti</th>
                <th className="py-3 px-6">No. Invoice</th>
                <th className="py-3 px-6">Klien</th>
                <th className="py-3 px-6">Tanggal</th>
                <th className="py-3 px-6">Metode</th>
                <th className="py-3 px-6">Ref / Bank</th>
                <th className="py-3 px-6 text-right">Jumlah Dibayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-xs">
              {payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-surface/40 transition-colors">
                    <td className="py-4 px-6 font-mono text-brand-muted">{p.payment_number}</td>
                    <td className="py-4 px-6 font-bold text-brand-electric">{p.invoice_number}</td>
                    <td className="py-4 px-6 font-semibold text-white">
                      {p.client_name || '-'}
                    </td>
                    <td className="py-4 px-6 text-brand-muted">{p.payment_date}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg bg-brand-surface text-brand-cyan font-semibold text-[11px]">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-brand-muted font-mono">{p.reference_number || '-'}</td>
                    <td className="py-4 px-6 text-right font-black text-brand-success text-sm">
                      {formatIDR(p.payment_amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-brand-muted">
                    Belum ada riwayat pembayaran yang dicatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-card w-full max-w-lg rounded-2xl border border-brand-border p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-base font-bold text-white">Catat Pembayaran Masuk</h3>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-brand-muted mb-1">
                  Pilih Invoice Yang Dibayar <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={invoiceId}
                  onChange={(e) => handleSelectInvoice(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-electric"
                >
                  <option value="">-- Pilih Invoice --</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} — {inv.client_name || 'Umum'} (Sisa: {formatIDR(inv.balance_due)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-brand-muted mb-1">
                    Jumlah Pembayaran (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-electric font-bold text-brand-success"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-brand-muted mb-1">Tanggal Bayar</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-brand-muted mb-1">Metode Pembayaran</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="Bank Transfer">Bank Transfer (BCA/Mandiri)</option>
                    <option value="Cash">Cash / Tunai</option>
                    <option value="QRIS">QRIS</option>
                    <option value="E-Wallet">E-Wallet (GoPay/OVO)</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-brand-muted mb-1">Nomor Bukti / Ref Transfer</label>
                  <input
                    type="text"
                    placeholder="Contoh: TRF-882193"
                    value={refNum}
                    onChange={(e) => setRefNum(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-brand-muted mb-1">Catatan</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan pembayaran (DP 50%, pelunasan, dll)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-brand-surface text-brand-muted hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-electric to-brand-indigo text-white font-bold"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
