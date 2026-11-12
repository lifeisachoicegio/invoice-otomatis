import React, { useState, useEffect } from 'react';
import { fetchApi, formatIDR } from '../api';
import { Plus, Search, Trash2, Receipt, X } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Software');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('Bank Transfer');
  const [notes, setNotes] = useState('');

  const categories = [
    'Software',
    'Subscription',
    'Equipment',
    'Internet',
    'Transportation',
    'Freelance Payment',
    'Operational',
    'Other',
  ];

  const loadData = () => {
    fetchApi('/expenses')
      .then((res) => {
        setExpenses(res.data || []);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) {
      alert('Nama dan nominal wajib diisi!');
      return;
    }

    try {
      await fetchApi('/expenses', {
        method: 'POST',
        body: JSON.stringify({
          expense_name: name,
          category,
          amount,
          expense_date: date,
          payment_method: method,
          notes,
        }),
      });
      alert('Pengeluaran berhasil dicatat!');
      setShowModal(false);
      setName('');
      setAmount(0);
      loadData();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus pengeluaran ini?')) return;
    try {
      await fetchApi(`/expenses/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const totalExpense = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Beban & Pengeluaran Studio</h2>
          <p className="text-xs text-brand-muted">
            Pencatatan biaya operasional, langganan software AI, dan freelance creative
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-electric to-brand-indigo text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-brand-electric/25"
        >
          <Plus size={16} /> Catat Pengeluaran
        </button>
      </div>

      <div className="bg-brand-card p-5 rounded-2xl border border-brand-border flex items-center justify-between">
        <div>
          <span className="text-xs text-brand-muted">Total Beban Tercatat</span>
          <div className="text-2xl font-black text-brand-danger mt-1">
            {formatIDR(totalExpense)}
          </div>
        </div>
        <div className="text-xs text-brand-muted bg-brand-surface px-3 py-1.5 rounded-lg border border-brand-border">
          {expenses.length} Transaksi
        </div>
      </div>

      <div className="bg-brand-card rounded-2xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-surface text-brand-muted text-[11px] font-bold uppercase tracking-wider border-b border-brand-border">
                <th className="py-3 px-6">Nama Beban / Transaksi</th>
                <th className="py-3 px-6">Kategori</th>
                <th className="py-3 px-6">Tanggal</th>
                <th className="py-3 px-6">Metode</th>
                <th className="py-3 px-6 text-right">Nominal</th>
                <th className="py-3 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-xs">
              {expenses.length > 0 ? (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-brand-surface/40 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white">
                      {e.expense_name}
                      {e.notes && (
                        <span className="block text-[11px] text-brand-muted font-normal">
                          {e.notes}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg bg-brand-surface text-brand-muted font-bold text-[10px] uppercase">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-brand-muted">{e.expense_date}</td>
                    <td className="py-4 px-6 text-brand-cyan">{e.payment_method}</td>
                    <td className="py-4 px-6 text-right font-bold text-brand-danger">
                      -{formatIDR(e.amount)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="p-1.5 rounded-lg bg-brand-surface hover:bg-rose-500/20 text-brand-muted hover:text-rose-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brand-muted">
                    Belum ada catatan pengeluaran.
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
              <h3 className="text-base font-bold text-white">Catat Pengeluaran Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-brand-muted mb-1">
                  Nama Pengeluaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Langganan Adobe CC / Envato Elements"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-electric"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-brand-muted mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-brand-muted mb-1">
                    Nominal Biaya (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none font-bold text-rose-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-brand-muted mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-brand-muted mb-1">Metode Bayar</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Kartu Kredit">Kartu Kredit</option>
                    <option value="Cash">Cash / Kas Kecil</option>
                    <option value="E-Wallet">E-Wallet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-brand-muted mb-1">Keterangan / Catatan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl p-3 text-white"
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
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
