import React, { useState, useEffect } from 'react';
import { fetchApi, formatIDR } from '../api';
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Building, X } from 'lucide-react';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Form
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = () => {
    fetchApi('/clients')
      .then((res) => {
        setClients(res.data || []);
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
    setEditId(null);
    setClientName('');
    setCompanyName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setTaxId('');
    setNotes('');
    setShowModal(true);
  };

  const openEdit = (c: any) => {
    setEditId(c.id);
    setClientName(c.client_name);
    setCompanyName(c.company_name || '');
    setEmail(c.email || '');
    setPhone(c.phone || '');
    setAddress(c.address || '');
    setTaxId(c.tax_id || '');
    setNotes(c.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('Nama klien wajib diisi!');
      return;
    }

    const payload = {
      client_name: clientName,
      company_name: companyName,
      email,
      phone,
      address,
      tax_id: taxId,
      notes,
    };

    try {
      if (editId) {
        await fetchApi(`/clients/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi('/clients', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus klien ini?')) return;
    try {
      await fetchApi(`/clients/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.client_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company_name && c.company_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Database Klien</h2>
          <p className="text-xs text-brand-muted">
            Kelola data klien, riwayat penagihan, dan piutang agency
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-electric to-brand-indigo text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-brand-electric/25"
        >
          <Plus size={16} /> Tambah Klien Baru
        </button>
      </div>

      <div className="bg-brand-card p-4 rounded-2xl border border-brand-border">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-3 text-brand-muted" />
          <input
            type="text"
            placeholder="Cari nama klien / perusahaan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-electric"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-brand-card p-5 rounded-2xl border border-brand-border hover:border-brand-electric/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{c.client_name}</h3>
                  {c.company_name && (
                    <div className="flex items-center gap-1.5 text-xs text-brand-cyan font-medium mt-0.5">
                      <Building size={13} /> {c.company_name}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(c)}
                    className="p-1.5 rounded-lg bg-brand-surface hover:bg-brand-border text-brand-muted hover:text-white"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 rounded-lg bg-brand-surface hover:bg-rose-500/20 text-brand-muted hover:text-rose-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-brand-muted">
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-brand-electric" /> {c.email}
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-brand-success" /> {c.phone}
                  </div>
                )}
                {c.address && (
                  <div className="flex items-start gap-2 pt-0.5">
                    <MapPin size={13} className="text-brand-warning shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{c.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-brand-border flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-brand-muted block">Total Billed</span>
                <span className="font-bold text-white">{formatIDR(c.total_billed)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-brand-muted block">Piutang Aktif</span>
                <span className={`font-bold ${c.balance_due > 0 ? 'text-brand-danger' : 'text-brand-success'}`}>
                  {formatIDR(c.balance_due)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-card w-full max-w-lg rounded-2xl border border-brand-border p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-base font-bold text-white">
                {editId ? 'Edit Klien' : 'Tambah Klien Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-brand-muted mb-1">
                  Nama Kontak Klien <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-electric"
                />
              </div>

              <div>
                <label className="block font-semibold text-brand-muted mb-1">
                  Nama Perusahaan / Brand
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-electric"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-brand-muted mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-brand-muted mb-1">No. Telepon / WA</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-brand-muted mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-brand-muted mb-1">NPWP / Tax ID</label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none"
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
                  Simpan Klien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
