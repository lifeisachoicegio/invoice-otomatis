import React, { useState, useEffect } from 'react';
import { fetchApi, formatIDR } from '../api';
import { Plus, Repeat, Play, CheckCircle2, X } from 'lucide-react';

export const RecurringPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState<number | ''>('');
  const [frequency, setFrequency] = useState('Monthly');
  const [amount, setAmount] = useState<number>(5000000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextDate, setNextDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = () => {
    Promise.all([fetchApi('/recurring'), fetchApi('/clients')])
      .then(([rRes, cRes]) => {
        setPlans(rRes.data || []);
        setClients(cRes.data || []);
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

  const handleTrigger = async (id: number) => {
    if (!confirm('Generate invoice sekarang berdasarkan jadwal rutin ini?')) return;
    try {
      const res = await fetchApi(`/recurring/${id}/trigger`, { method: 'POST' });
      alert(`Berhasil membuat invoice rutin: ${res.data.invoice_number}`);
      loadData();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !title) {
      alert('Lengkapi judul dan klien!');
      return;
    }

    try {
      await fetchApi('/recurring', {
        method: 'POST',
        body: JSON.stringify({
          title,
          client_id: clientId,
          frequency,
          amount,
          start_date: startDate,
          next_invoice_date: nextDate,
          items: [
            {
              description: title,
              price: amount,
              quantity: 1,
              unit: frequency === 'Monthly' ? 'bulan' : 'periode',
            },
          ],
        }),
      });
      alert('Paket Recurring berhasil disimpan!');
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
          <h2 className="text-xl font-extrabold text-white">Invoice Rutin (Recurring)</h2>
          <p className="text-xs text-brand-muted">
            Otomatisasi penagihan klien retainer bulanan atau tahunan
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-electric to-brand-indigo text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-brand-electric/25"
        >
          <Plus size={16} /> Buat Paket Rutin
        </button>
      </div>

      <div className="bg-brand-card rounded-2xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-surface text-brand-muted text-[11px] font-bold uppercase tracking-wider border-b border-brand-border">
                <th className="py-3 px-6">Nama Paket Retainer</th>
                <th className="py-3 px-6">Klien</th>
                <th className="py-3 px-6">Frekuensi</th>
                <th className="py-3 px-6">Jadwal Berikutnya</th>
                <th className="py-3 px-6 text-right">Nominal Tagihan</th>
                <th className="py-3 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-xs">
              {plans.length > 0 ? (
                plans.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-surface/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                      <Repeat size={14} className="text-brand-electric" /> {p.title}
                    </td>
                    <td className="py-4 px-6 font-semibold text-brand-cyan">
                      {p.client_name}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg bg-brand-surface text-brand-muted font-bold text-[11px]">
                        {p.frequency}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-brand-muted">{p.next_invoice_date}</td>
                    <td className="py-4 px-6 text-right font-bold text-white">
                      {formatIDR(p.amount)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleTrigger(p.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-surface hover:bg-brand-electric hover:text-white text-brand-electric text-xs font-bold transition-all border border-brand-border"
                      >
                        <Play size={13} /> Terbitkan Sekarang
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brand-muted">
                    Belum ada invoice rutin yang terdaftar.
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
              <h3 className="text-base font-bold text-white">Setup Paket Rutin</h3>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-brand-muted mb-1">
                  Nama Paket Retainer <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Retainer Video Reels Bulanan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-electric"
                />
              </div>

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
                  <label className="block font-semibold text-brand-muted mb-1">Frekuensi</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="Weekly">Mingguan (Weekly)</option>
                    <option value="Monthly">Bulanan (Monthly)</option>
                    <option value="Quarterly">3 Bulanan (Quarterly)</option>
                    <option value="Yearly">Tahunan (Yearly)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-brand-muted mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-brand-muted mb-1">Mulai Tanggal</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-brand-muted mb-1">Jadwal Pertama</label>
                  <input
                    type="date"
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
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
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
