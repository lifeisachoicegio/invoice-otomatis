import React, { useState, useEffect } from 'react';
import { fetchApi, formatIDR } from '../api';
import { Plus, Search, FileSpreadsheet, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuotationsPage: React.FC = () => {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Form
  const [clientId, setClientId] = useState<number | ''>('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [expDate, setExpDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('Penawaran harga ini berlaku hingga tanggal jatuh tempo di atas.');
  const [items, setItems] = useState([
    { description: 'Social Media Management (1 Bulan)', unit: 'bulan', price: 5000000, quantity: 1, discount: 0, subtotal: 5000000 }
  ]);

  const loadData = () => {
    Promise.all([fetchApi('/quotations'), fetchApi('/clients'), fetchApi('/services')])
      .then(([qRes, cRes, sRes]) => {
        setQuotations(qRes.data || []);
        setClients(cRes.data || []);
        setServices(sRes.data || []);
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

  const handleConvert = async (id: number) => {
    if (!confirm('Konversi penawaran ini menjadi Invoice resmi?')) return;
    try {
      const res = await fetchApi(`/quotations/${id}/convert`, { method: 'POST' });
      alert('Berhasil dikonversi menjadi Invoice!');
      navigate(`/invoices/edit/${res.data.id}`);
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert('Pilih klien terlebih dahulu!');
      return;
    }

    try {
      await fetchApi('/quotations', {
        method: 'POST',
        body: JSON.stringify({
          client_id: clientId,
          issue_date: issueDate,
          expiration_date: expDate,
          notes,
          items,
        }),
      });
      alert('Quotation berhasil dibuat!');
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
          <h2 className="text-xl font-extrabold text-white">Quotation & Penawaran Harga</h2>
          <p className="text-xs text-brand-muted">
            Buat penawaran harga untuk prospek, lalu konversi jadi invoice dengan 1 klik
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-electric to-brand-indigo text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-brand-electric/25"
        >
          <Plus size={16} /> Buat Quotation
        </button>
      </div>

      <div className="bg-brand-card rounded-2xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-surface text-brand-muted text-[11px] font-bold uppercase tracking-wider border-b border-brand-border">
                <th className="py-3 px-6">No. Penawaran</th>
                <th className="py-3 px-6">Klien</th>
                <th className="py-3 px-6">Tgl Penawaran</th>
                <th className="py-3 px-6">Berlaku Sampai</th>
                <th className="py-3 px-6 text-right">Nilai Total</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-xs">
              {quotations.length > 0 ? (
                quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-brand-surface/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-brand-electric font-mono">
                      {q.quotation_number}
                    </td>
                    <td className="py-4 px-6 font-semibold text-white">
                      {q.client_name || '-'}
                      {q.company_name && (
                        <span className="block text-[11px] text-brand-muted font-normal">
                          {q.company_name}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-brand-muted">{q.issue_date}</td>
                    <td className="py-4 px-6 text-brand-muted">{q.expiration_date}</td>
                    <td className="py-4 px-6 text-right font-bold text-white">
                      {formatIDR(q.grand_total)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          q.status === 'Converted'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {q.status !== 'Converted' ? (
                        <button
                          onClick={() => handleConvert(q.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-surface hover:bg-brand-electric hover:text-white text-brand-cyan text-xs font-bold transition-all border border-brand-border"
                        >
                          Konversi ke Invoice <ArrowRight size={13} />
                        </button>
                      ) : (
                        <span className="text-[11px] text-brand-muted">Sudah Dikonversi</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-brand-muted">
                    Belum ada penawaran harga yang dibuat.
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
              <h3 className="text-base font-bold text-white">Buat Quotation Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-brand-muted mb-1">
                  Klien <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(Number(e.target.value) || '')}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-electric"
                >
                  <option value="">-- Pilih Klien --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.client_name} {c.company_name ? `(${c.company_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-brand-muted mb-1">Tgl Penawaran</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-brand-muted mb-1">Berlaku Hingga</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-brand-muted mb-1">Deskripsi Item</label>
                <input
                  type="text"
                  value={items[0].description}
                  onChange={(e) =>
                    setItems([{ ...items[0], description: e.target.value }])
                  }
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-brand-muted mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    value={items[0].price}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      setItems([{ ...items[0], price: p, subtotal: p * items[0].quantity }]);
                    }}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-brand-muted mb-1">Qty</label>
                  <input
                    type="number"
                    value={items[0].quantity}
                    onChange={(e) => {
                      const q = Number(e.target.value);
                      setItems([{ ...items[0], quantity: q, subtotal: items[0].price * q }]);
                    }}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white"
                  />
                </div>
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
                  Simpan Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
