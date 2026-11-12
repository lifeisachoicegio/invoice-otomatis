import React, { useState, useEffect } from 'react';
import { fetchApi, formatIDR } from '../api';
import { Plus, Search, Edit, Trash2, Tag, Check, X } from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Form
  const [serviceName, setServiceName] = useState('');
  const [category, setCategory] = useState('VIDEO PRODUCTION');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [unit, setUnit] = useState('project');

  const categories = [
    'ALL',
    'VIDEO PRODUCTION',
    'DESIGN',
    'DIGITAL MARKETING',
    'WEB DEVELOPMENT',
    'OTHER SERVICES',
  ];

  const loadData = () => {
    fetchApi('/services')
      .then((res) => {
        setServices(res.data || []);
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
    setServiceName('');
    setCategory('VIDEO PRODUCTION');
    setDescription('');
    setPrice(0);
    setUnit('project');
    setShowModal(true);
  };

  const openEdit = (s: any) => {
    setEditId(s.id);
    setServiceName(s.service_name);
    setCategory(s.category);
    setDescription(s.description || '');
    setPrice(s.price);
    setUnit(s.unit || 'project');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      alert('Nama layanan wajib diisi!');
      return;
    }

    const payload = {
      service_name: serviceName,
      category,
      description,
      price,
      unit,
    };

    try {
      if (editId) {
        await fetchApi(`/services/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi('/services', {
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
    if (!confirm('Yakin ingin menghapus layanan ini?')) return;
    try {
      await fetchApi(`/services/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const filtered = services.filter((s) => {
    const matchesSearch =
      s.service_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCat === 'ALL' || s.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Katalog Jasa & Produk</h2>
          <p className="text-xs text-brand-muted">
            Kelola paket layanan, tarif agency, dan deskripsi deliverables
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-electric to-brand-indigo text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-brand-electric/25"
        >
          <Plus size={16} /> Tambah Layanan
        </button>
      </div>

      <div className="bg-brand-card p-4 rounded-2xl border border-brand-border flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-3 text-brand-muted" />
          <input
            type="text"
            placeholder="Cari layanan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-electric"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCat === cat
                  ? 'bg-brand-electric text-white'
                  : 'bg-brand-surface text-brand-muted hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="bg-brand-card p-5 rounded-2xl border border-brand-border hover:border-brand-electric/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-brand-electric/15 text-brand-electric font-bold text-[10px] tracking-wider uppercase">
                  {s.category}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(s)}
                    className="p-1.5 rounded-lg bg-brand-surface hover:bg-brand-border text-brand-muted hover:text-white"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-1.5 rounded-lg bg-brand-surface hover:bg-rose-500/20 text-brand-muted hover:text-rose-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-bold text-white mt-3">{s.service_name}</h3>
              <p className="text-xs text-brand-muted mt-1.5 line-clamp-2">{s.description}</p>
            </div>

            <div className="mt-5 pt-4 border-t border-brand-border flex items-baseline justify-between">
              <span className="text-xs text-brand-muted">Tarif Standar</span>
              <div className="text-right">
                <span className="text-base font-black text-white">{formatIDR(s.price)}</span>
                <span className="text-[11px] text-brand-muted ml-1">/ {s.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-card w-full max-w-lg rounded-2xl border border-brand-border p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-base font-bold text-white">
                {editId ? 'Edit Layanan' : 'Tambah Layanan Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-brand-muted mb-1">
                  Nama Layanan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-electric"
                />
              </div>

              <div>
                <label className="block font-semibold text-brand-muted mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-electric"
                >
                  <option value="VIDEO PRODUCTION">VIDEO PRODUCTION</option>
                  <option value="DESIGN">DESIGN</option>
                  <option value="DIGITAL MARKETING">DIGITAL MARKETING</option>
                  <option value="WEB DEVELOPMENT">WEB DEVELOPMENT</option>
                  <option value="OTHER SERVICES">OTHER SERVICES</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-brand-muted mb-1">Tarif (Rp)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-brand-muted mb-1">Satuan</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="project, video, bulan, dll"
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-brand-muted mb-1">Deskripsi Layanan</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
