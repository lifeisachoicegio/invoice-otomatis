import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { Building, CreditCard, Sliders, Database, Save, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    company_name: 'HypeZone Studio',
    tagline: 'Creative & Digital Agency',
    address: 'Jl. Creative No. 88, Jakarta Selatan',
    email: 'finance@hypezone.studio',
    phone: '+62 812-3456-7890',
    website: 'https://hypezone.studio',
    tax_number: '01.234.567.8-901.000',
    bank_name: 'Bank Central Asia (BCA)',
    account_number: '8830-192-831',
    account_holder: 'HypeZone Studio CV',
    branch: 'KCU Jakarta',
    additional_payment_instructions: 'Harap sertakan nomor invoice pada berita transfer.',
    invoice_prefix: 'HZS-INV',
    invoice_format: '{PREFIX}-{YEAR}-{NUM}',
    default_currency: 'IDR',
    default_payment_terms: 'Net 14',
    default_tax_rate: 11,
    default_template: 'neobrutalism',
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchApi('/settings')
      .then((res) => {
        if (res.data) setSettings(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleChange = (field: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      alert(`Gagal menyimpan: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Pengaturan Sistem Studio</h2>
          <p className="text-xs text-brand-muted">
            Profil perusahaan, informasi rekening perbankan, dan format penomoran invoice
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-electric to-brand-indigo text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-brand-electric/25"
        >
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? 'Tersimpan!' : 'Simpan Perubahan'}
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Identitas Studio */}
        <div className="bg-brand-card p-6 rounded-2xl border border-brand-border space-y-4">
          <div className="flex items-center gap-2 text-white font-bold border-b border-brand-border pb-3">
            <Building size={16} className="text-brand-electric" /> Profil & Legalitas Studio
          </div>

          <div>
            <label className="block text-brand-muted mb-1 font-semibold">Nama Bisnis / Brand</label>
            <input
              type="text"
              value={settings.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-brand-muted mb-1 font-semibold">Tagline</label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => handleChange('tagline', e.target.value)}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-brand-muted mb-1 font-semibold">Email Billing</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-brand-muted mb-1 font-semibold">Telepon / WhatsApp</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-brand-muted mb-1 font-semibold">Website</label>
            <input
              type="text"
              value={settings.website}
              onChange={(e) => handleChange('website', e.target.value)}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-brand-muted mb-1 font-semibold">NPWP / Tax ID</label>
            <input
              type="text"
              value={settings.tax_number}
              onChange={(e) => handleChange('tax_number', e.target.value)}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-brand-muted mb-1 font-semibold">Alamat Lengkap</label>
            <textarea
              rows={2}
              value={settings.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full bg-brand-surface border border-brand-border rounded-xl p-3 text-white"
            />
          </div>
        </div>

        {/* Akun Rekening Bank */}
        <div className="bg-brand-card p-6 rounded-2xl border border-brand-border space-y-4">
          <div className="flex items-center gap-2 text-white font-bold border-b border-brand-border pb-3">
            <CreditCard size={16} className="text-brand-electric" /> Rekening Pembayaran Resmi
          </div>

          <div>
            <label className="block text-brand-muted mb-1 font-semibold">Nama Bank</label>
            <input
              type="text"
              value={settings.bank_name}
              onChange={(e) => handleChange('bank_name', e.target.value)}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-brand-muted mb-1 font-semibold">Nomor Rekening</label>
              <input
                type="text"
                value={settings.account_number}
                onChange={(e) => handleChange('account_number', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-brand-muted mb-1 font-semibold">Atas Nama (A/N)</label>
              <input
                type="text"
                value={settings.account_holder}
                onChange={(e) => handleChange('account_holder', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-brand-muted mb-1 font-semibold">Kantor Cabang</label>
            <input
              type="text"
              value={settings.branch}
              onChange={(e) => handleChange('branch', e.target.value)}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-brand-muted mb-1 font-semibold">Instruksi Pembayaran</label>
            <textarea
              rows={3}
              value={settings.additional_payment_instructions}
              onChange={(e) => handleChange('additional_payment_instructions', e.target.value)}
              className="w-full bg-brand-surface border border-brand-border rounded-xl p-3 text-white"
            />
          </div>
        </div>

        {/* Invoice Preferences */}
        <div className="bg-brand-card p-6 rounded-2xl border border-brand-border space-y-4">
          <div className="flex items-center gap-2 text-white font-bold border-b border-brand-border pb-3">
            <Sliders size={16} className="text-brand-electric" /> Default Penomoran & Tagihan
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-brand-muted mb-1 font-semibold">Prefix Invoice</label>
              <input
                type="text"
                value={settings.invoice_prefix}
                onChange={(e) => handleChange('invoice_prefix', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-brand-muted mb-1 font-semibold">PPN / Pajak Default (%)</label>
              <input
                type="number"
                value={settings.default_tax_rate}
                onChange={(e) => handleChange('default_tax_rate', Number(e.target.value))}
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-brand-muted mb-1 font-semibold">Template PDF Bawaan</label>
              <select
                value={settings.default_template || 'neobrutalism'}
                onChange={(e) => handleChange('default_template', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white"
              >
                <option value="neobrutalism">Neo-Brutalism (Retro Pop / Poster Design)</option>
                <option value="premium">Template A — HypeZone Premium (Putih Elegan)</option>
                <option value="dark">Template B — HypeZone Dark (Navy Mewah)</option>
                <option value="minimal">Template C — HypeZone Minimalis</option>
              </select>
            </div>
            <div>
              <label className="block text-brand-muted mb-1 font-semibold">Termin Bayar Default</label>
              <input
                type="text"
                value={settings.default_payment_terms}
                onChange={(e) => handleChange('default_payment_terms', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Database & Backup Info */}
        <div className="bg-brand-card p-6 rounded-2xl border border-brand-border space-y-4">
          <div className="flex items-center gap-2 text-white font-bold border-b border-brand-border pb-3">
            <Database size={16} className="text-brand-electric" /> Database Lokal & Keamanan
          </div>
          <p className="text-brand-muted">
            Semua data tersimpan aman secara offline pada database lokal SQLite (<code className="text-brand-cyan">data/hypezone.db</code>).
            Sistem beroperasi tanpa koneksi cloud eksternal demi privasi finansial studio.
          </p>
          <div className="p-3 bg-brand-surface rounded-xl border border-brand-border text-brand-secondary">
            Mode WAL (Write-Ahead Logging) diaktifkan untuk mencegah korupsi data saat sistem Windows restart mendadak.
          </div>
        </div>
      </form>
    </div>
  );
};
