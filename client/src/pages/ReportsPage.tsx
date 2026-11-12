import React, { useState, useEffect } from 'react';
import { fetchApi, formatIDR } from '../api';
import { BarChart3, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = () => {
    setLoading(true);
    fetchApi(`/reports?start_date=${startDate}&end_date=${endDate}`)
      .then((res) => {
        setData(res.data);
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

  const exportCSV = () => {
    if (!data?.invoices) return;
    const headers = ['Invoice Number', 'Issue Date', 'Grand Total', 'Amount Paid', 'Balance Due', 'Status'];
    const rows = data.invoices.map((i: any) => [
      i.invoice_number,
      i.issue_date,
      i.grand_total,
      i.amount_paid,
      i.balance_due,
      i.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Keuangan_HypeZone_${startDate}_sd_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Laporan Keuangan Agency</h2>
          <p className="text-xs text-brand-muted">
            Analisis pendapatan kotor, penerimaan kas nyata, piutang, dan arus kas bersih
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-brand-surface border border-brand-border hover:bg-brand-border text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-brand-card p-4 rounded-2xl border border-brand-border flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-brand-muted font-semibold">Periode:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-brand-surface border border-brand-border rounded-xl px-3 py-1.5 text-white"
          />
          <span className="text-brand-muted">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-brand-surface border border-brand-border rounded-xl px-3 py-1.5 text-white"
          />
        </div>
        <button
          onClick={loadData}
          className="px-4 py-1.5 rounded-xl bg-brand-electric text-white text-xs font-bold"
        >
          Terapkan Filter
        </button>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border">
          <div className="flex justify-between items-center text-xs text-brand-muted mb-2">
            <span>Gross Revenue (Billed)</span>
            <DollarSign size={16} className="text-brand-electric" />
          </div>
          <div className="text-xl font-black text-white">
            {formatIDR(data?.gross_revenue || 0)}
          </div>
          <div className="text-[10px] text-brand-muted mt-1">Total nilai tagihan periode ini</div>
        </div>

        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border">
          <div className="flex justify-between items-center text-xs text-brand-muted mb-2">
            <span>Cash Received (Uang Masuk)</span>
            <TrendingUp size={16} className="text-brand-success" />
          </div>
          <div className="text-xl font-black text-brand-success">
            {formatIDR(data?.cash_received || 0)}
          </div>
          <div className="text-[10px] text-brand-muted mt-1">Kas riil diterima di rekening</div>
        </div>

        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border">
          <div className="flex justify-between items-center text-xs text-brand-muted mb-2">
            <span>Total Beban Operasional</span>
            <TrendingDown size={16} className="text-brand-danger" />
          </div>
          <div className="text-xl font-black text-brand-danger">
            {formatIDR(data?.total_expenses || 0)}
          </div>
          <div className="text-[10px] text-brand-muted mt-1">Pengeluaran & subscriptions</div>
        </div>

        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border">
          <div className="flex justify-between items-center text-xs text-brand-muted mb-2">
            <span>Net Cash Flow (Laba Kas)</span>
            <BarChart3 size={16} className="text-brand-cyan" />
          </div>
          <div
            className={`text-xl font-black ${
              (data?.net_cash_flow || 0) >= 0 ? 'text-brand-success' : 'text-brand-danger'
            }`}
          >
            {formatIDR(data?.net_cash_flow || 0)}
          </div>
          <div className="text-[10px] text-brand-muted mt-1">Penerimaan Kas - Beban</div>
        </div>
      </div>

      {/* Invoices List for Selected Period */}
      <div className="bg-brand-card rounded-2xl border border-brand-border overflow-hidden">
        <div className="p-5 border-b border-brand-border">
          <h3 className="text-sm font-bold text-white">Rincian Invoice Periode Ini</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-surface text-brand-muted text-[11px] font-bold uppercase tracking-wider border-b border-brand-border">
                <th className="py-3 px-6">No. Invoice</th>
                <th className="py-3 px-6">Tanggal</th>
                <th className="py-3 px-6 text-right">Nilai Tagihan</th>
                <th className="py-3 px-6 text-right">Sudah Dibayar</th>
                <th className="py-3 px-6 text-right">Sisa Piutang</th>
                <th className="py-3 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-xs">
              {data?.invoices && data.invoices.length > 0 ? (
                data.invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-brand-surface/40">
                    <td className="py-3.5 px-6 font-bold text-brand-electric font-mono">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-6 text-brand-muted">{inv.issue_date}</td>
                    <td className="py-3.5 px-6 text-right font-bold text-white">
                      {formatIDR(inv.grand_total)}
                    </td>
                    <td className="py-3.5 px-6 text-right text-brand-success">
                      {formatIDR(inv.amount_paid)}
                    </td>
                    <td className="py-3.5 px-6 text-right font-bold text-brand-danger">
                      {formatIDR(inv.balance_due)}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-brand-surface text-brand-muted">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brand-muted">
                    Tidak ada transaksi dalam rentang tanggal ini.
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
