import React, { useEffect, useState } from 'react';
import { fetchApi, formatIDR } from '../api';
import {
  TrendingUp,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/dashboard')
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-brand-muted">
        Memuat data dashboard HypeZone Studio...
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentInvoices = data?.recent_invoices || [];
  const monthlyRevenue = data?.monthly_revenue || [];

  return (
    <div className="space-y-8">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Ringkasan Finansial</h2>
          <p className="text-sm text-brand-muted mt-1">
            Status operasional invoice, pembayaran, dan pendapatan HypeZone Studio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/invoices/create"
            className="flex items-center gap-2 bg-gradient-to-r from-brand-electric to-brand-indigo hover:opacity-95 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-brand-electric/25 transition-all"
          >
            <Plus size={16} />
            Buat Invoice Baru
          </Link>
          <Link
            to="/payments"
            className="flex items-center gap-2 bg-brand-surface border border-brand-border hover:bg-brand-border text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            <DollarSign size={16} className="text-brand-success" />
            Catat Pembayaran
          </Link>
        </div>
      </div>

      {/* 6 Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Billed */}
        <div className="bg-brand-card p-4 rounded-2xl border border-brand-border relative overflow-hidden">
          <div className="flex items-center justify-between text-brand-muted text-xs font-medium mb-2">
            <span>Total Tagihan</span>
            <Receipt size={16} className="text-brand-electric" />
          </div>
          <div className="text-lg font-black text-white">{formatIDR(stats.total_revenue)}</div>
          <div className="text-[10px] text-brand-muted mt-1">{stats.total_invoices || 0} total invoice</div>
        </div>

        {/* Cash Collected */}
        <div className="bg-brand-card p-4 rounded-2xl border border-brand-border relative overflow-hidden">
          <div className="flex items-center justify-between text-brand-muted text-xs font-medium mb-2">
            <span>Uang Masuk</span>
            <TrendingUp size={16} className="text-brand-success" />
          </div>
          <div className="text-lg font-black text-brand-success">{formatIDR(stats.total_cash_received)}</div>
          <div className="text-[10px] text-brand-muted mt-1">Kas aktual diterima</div>
        </div>

        {/* Paid Count */}
        <div className="bg-brand-card p-4 rounded-2xl border border-brand-border relative overflow-hidden">
          <div className="flex items-center justify-between text-brand-muted text-xs font-medium mb-2">
            <span>Invoice Lunas</span>
            <CheckCircle2 size={16} className="text-brand-success" />
          </div>
          <div className="text-lg font-black text-white">{stats.paid_invoices || 0}</div>
          <div className="text-[10px] text-brand-success mt-1">Status Paid</div>
        </div>

        {/* Partially Paid */}
        <div className="bg-brand-card p-4 rounded-2xl border border-brand-border relative overflow-hidden">
          <div className="flex items-center justify-between text-brand-muted text-xs font-medium mb-2">
            <span>Sebagian (DP)</span>
            <Clock size={16} className="text-brand-warning" />
          </div>
          <div className="text-lg font-black text-white">{stats.partially_paid_invoices || 0}</div>
          <div className="text-[10px] text-brand-warning mt-1">Ada cicilan masuk</div>
        </div>

        {/* Outstanding Unpaid */}
        <div className="bg-brand-card p-4 rounded-2xl border border-brand-border relative overflow-hidden">
          <div className="flex items-center justify-between text-brand-muted text-xs font-medium mb-2">
            <span>Piutang Belum Lunas</span>
            <AlertCircle size={16} className="text-brand-cyan" />
          </div>
          <div className="text-lg font-black text-brand-cyan">{formatIDR(stats.total_outstanding)}</div>
          <div className="text-[10px] text-brand-muted mt-1">Sisa tagihan aktif</div>
        </div>

        {/* Overdue */}
        <div className="bg-brand-card p-4 rounded-2xl border border-brand-border relative overflow-hidden">
          <div className="flex items-center justify-between text-brand-muted text-xs font-medium mb-2">
            <span>Jatuh Tempo (Overdue)</span>
            <AlertCircle size={16} className="text-brand-danger" />
          </div>
          <div className="text-lg font-black text-brand-danger">{stats.overdue_invoices || 0}</div>
          <div className="text-[10px] text-brand-danger mt-1">Perlu follow-up</div>
        </div>
      </div>

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-brand-card p-6 rounded-2xl border border-brand-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Tren Pendapatan & Kas</h3>
              <p className="text-xs text-brand-muted mt-0.5">Perbandingan nilai invoice vs uang yang diterima</p>
            </div>
          </div>
          <div className="h-72 w-full">
            {monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="billedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3878FC" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3878FC" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#263451" vertical={false} />
                  <XAxis dataKey="month" stroke="#A5B0C8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#A5B0C8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#11182A', borderColor: '#263451', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="billed" name="Tagihan Diterbitkan" stroke="#3878FC" strokeWidth={2} fillOpacity={1} fill="url(#billedGrad)" />
                  <Area type="monotone" dataKey="collected" name="Kas Masuk" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#collectedGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-brand-muted">
                Belum ada data transaksi bulanan. Buat invoice pertama Anda!
              </div>
            )}
          </div>
        </div>

        {/* Quick Summary & Net Flow */}
        <div className="bg-brand-card p-6 rounded-2xl border border-brand-border flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-4">Laba Bersih & Arus Kas</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-brand-surface border border-brand-border">
                <div className="text-xs text-brand-muted">Total Pengeluaran</div>
                <div className="text-xl font-bold text-brand-danger mt-1">
                  {formatIDR(stats.total_expenses || 0)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-brand-surface border border-brand-border">
                <div className="text-xs text-brand-muted">Net Cash Flow (Kas - Beban)</div>
                <div className={`text-xl font-black mt-1 ${stats.net_cash_flow >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                  {formatIDR(stats.net_cash_flow || 0)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-brand-border">
            <Link
              to="/reports"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-surface hover:bg-brand-border text-white text-xs font-bold transition-all"
            >
              Buka Laporan Finansial Lengkap
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-brand-card rounded-2xl border border-brand-border overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b border-brand-border">
          <div>
            <h3 className="text-base font-bold text-white">Invoice Terbaru</h3>
            <p className="text-xs text-brand-muted mt-0.5">Daftar transaksi penagihan terkini</p>
          </div>
          <Link to="/invoices" className="text-xs font-bold text-brand-electric hover:underline flex items-center gap-1">
            Lihat Semua <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-surface text-brand-muted text-[11px] font-bold uppercase tracking-wider border-b border-brand-border">
                <th className="py-3 px-6">No. Invoice</th>
                <th className="py-3 px-6">Klien</th>
                <th className="py-3 px-6">Tgl Terbit</th>
                <th className="py-3 px-6">Jatuh Tempo</th>
                <th className="py-3 px-6 text-right">Total</th>
                <th className="py-3 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-xs">
              {recentInvoices.length > 0 ? (
                recentInvoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-brand-surface/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-brand-electric">
                      <Link to={`/invoices/edit/${inv.id}`}>{inv.invoice_number}</Link>
                    </td>
                    <td className="py-4 px-6 font-semibold text-white">
                      {inv.client_name || 'Klien Umum'}
                      {inv.company_name && <span className="block text-[11px] text-brand-muted font-normal">{inv.company_name}</span>}
                    </td>
                    <td className="py-4 px-6 text-brand-muted">{inv.issue_date}</td>
                    <td className="py-4 px-6 text-brand-muted">{inv.due_date}</td>
                    <td className="py-4 px-6 text-right font-bold text-white">{formatIDR(inv.grand_total)}</td>
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brand-muted">
                    Belum ada invoice yang dibuat. Klik tombol "Buat Invoice Baru" di atas.
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
