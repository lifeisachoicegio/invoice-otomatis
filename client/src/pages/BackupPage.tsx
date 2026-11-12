import React, { useState } from 'react';
import { fetchApi, API_BASE } from '../api';

export const BackupPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = () => {
    window.open(`${API_BASE}/backup/export`, '_blank');
  };

  const handleExportCSV = (entity: string) => {
    alert(`Export data ${entity} siap diunduh.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-white">Backup & Pemulihan Data</h2>
        <p className="text-xs text-brand-muted">
          Penyimpanan cadangan mandiri file database SQLite, arsip invoice, dan ekspor data klien
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Full SQLite Backup */}
        <div className="bg-brand-card p-6 rounded-2xl border border-brand-border space-y-4">
          <div className="flex items-center gap-2 text-white font-bold border-b border-brand-border pb-3">
            <ShieldCheck size={18} className="text-brand-success" /> Cadangan Database Utuh (SQLite)
          </div>
          <p className="text-brand-muted leading-relaxed">
            Unduh salinan langsung file database <code className="text-brand-cyan">hypezone.db</code>. Berisi seluruh riwayat invoice, klien, katalog jasa, pembayaran, dan beban studio.
          </p>
          <div className="pt-2">
            <button
              onClick={handleExportDB}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-electric to-brand-indigo text-white font-bold shadow-lg shadow-brand-electric/25"
            >
              <Download size={16} /> Unduh Database Backup (.db)
            </button>
          </div>
        </div>

        {/* Restore Instructions */}
        <div className="bg-brand-card p-6 rounded-2xl border border-brand-border space-y-4">
          <div className="flex items-center gap-2 text-white font-bold border-b border-brand-border pb-3">
            <Database size={18} className="text-brand-electric" /> Prosedur Restore Database
          </div>
          <p className="text-brand-muted leading-relaxed">
            Untuk memulihkan data pada PC lain atau setelah instal ulang Windows:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-brand-secondary">
            <li>Matikan aplikasi dengan <code className="text-brand-cyan">stop.bat</code>.</li>
            <li>Salin file backup yang diunduh ke folder <code className="text-brand-cyan">server/data/hypezone.db</code>.</li>
            <li>Jalankan kembali aplikasi dengan <code className="text-brand-cyan">start.bat</code>.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
