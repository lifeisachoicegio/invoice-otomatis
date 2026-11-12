import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi, formatIDR, API_BASE } from '../api';
import {
  Plus,
  Search,
  FileDown,
  FileText,
  Edit,
  Trash2,
  Filter,
  DollarSign,
  Eye,
} from 'lucide-react';

export const AllInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    fetchApi('/invoices')
      .then((res) => {
        setInvoices(res.data || []);
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

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus invoice ini? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      await fetchApi(`/invoices/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.client_name && inv.client_name.toLowerCase().includes(search.toLowerCase())) ||
      (inv.company_name && inv.company_name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Semua Invoice</h2>
          <p className="text-xs text-brand-muted">
            Kelola tagihan, download PDF, dan pantau status pembayaran
          </p>
        </div>
        <Link
          to="/invoices/create"
          className="flex items-center gap-2 bg-gradient-to-r from-brand-electric to-brand-indigo text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-brand-electric/25"
        >
          <Plus size={16} /> Buat Invoice Baru
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-brand-card p-4 rounded-2xl border border-brand-border flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-3 text-brand-muted" />
          <input
            type="text"
            placeholder="Cari nomor invoice / klien..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-electric"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {['ALL', 'Draft', 'Unpaid', 'Partially Paid', 'Paid', 'Overdue'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-brand-electric text-white'
                  : 'bg-brand-surface text-brand-muted hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-brand-card rounded-2xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-surface text-brand-muted text-[11px] font-bold uppercase tracking-wider border-b border-brand-border">
                <th className="py-3 px-6">No. Invoice</th>
                <th className="py-3 px-6">Klien</th>
                <th className="py-3 px-6">Tgl Terbit</th>
                <th className="py-3 px-6">Jatuh Tempo</th>
                <th className="py-3 px-6 text-right">Total Tagihan</th>
                <th className="py-3 px-6 text-right">Sisa Tagihan</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-xs">
              {filtered.length > 0 ? (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-brand-surface/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-brand-electric">
                      <Link to={`/invoices/edit/${inv.id}`}>{inv.invoice_number}</Link>
                    </td>
                    <td className="py-4 px-6 font-semibold text-white">
                      {inv.client_name || 'Klien Umum'}
                      {inv.company_name && (
                        <span className="block text-[11px] text-brand-muted font-normal">
                          {inv.company_name}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-brand-muted">{inv.issue_date}</td>
                    <td className="py-4 px-6 text-brand-muted">{inv.due_date}</td>
                    <td className="py-4 px-6 text-right font-bold text-white">
                      {formatIDR(inv.grand_total)}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-brand-cyan">
                      {formatIDR(inv.balance_due)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : inv.status === 'Overdue'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : inv.status === 'Partially Paid'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <div className="flex items-center gap-1">
                        <a
                          href={`${API_BASE}/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          title="Cetak Default PDF"
                          className="p-1.5 hover:bg-slate-800 text-slate-300 rounded hover:text-white"
                        >
                          <FileDown size={16} />
                        </a>
                        <a
                          href={`${API_BASE}/invoices/${inv.id}/pdf?template=neobrutalism`}
                          target="_blank"
                          rel="noreferrer"
                          title="Cetak PDF (Neo-Brutalism Poster)"
                          className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[10px] rounded border border-black shadow-[1px_1px_0px_#000] transition-transform active:translate-y-0.5"
                        >
                          NEO PDF
                        </a>
                      </div>
                      <Link
                        to={`/invoices/edit/${inv.id}`}
                        className="inline-flex p-1.5 rounded-lg bg-brand-surface hover:bg-brand-border text-brand-muted hover:text-white transition-colors"
                        title="Edit Invoice"
                      >
                        <Edit size={15} />
                      </Link>
                      <button
                        onClick={() => handleDelete(inv.id)}
                        className="inline-flex p-1.5 rounded-lg bg-brand-surface hover:bg-rose-500/20 text-brand-muted hover:text-rose-400 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-brand-muted">
                    Tidak ada invoice yang sesuai dengan pencarian atau filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
