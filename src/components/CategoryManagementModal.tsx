/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Asset, CategoryDefinition, UserProfile } from '../types';
import {
  ArrowLeft,
  X,
  Plus,
  Pencil,
  Trash2,
  Tag,
  CheckCircle2,
  AlertTriangle,
  FolderTree,
} from 'lucide-react';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryDefinition[];
  assets: Asset[];
  currentUser: UserProfile;
  onSaveCategories: (categories: CategoryDefinition[]) => void;
  onSelectCategoryFilter?: (catId: string) => void;
}

const PRESET_COLORS = [
  '#0284c7', // Sky Blue
  '#059669', // Emerald Green
  '#d97706', // Amber Yellow
  '#dc2626', // Red
  '#7c3aed', // Violet Purple
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#475569', // Slate Gray
  '#db2777', // Pink
];

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  categories,
  assets,
  currentUser,
  onSaveCategories,
  onSelectCategoryFilter,
}) => {
  // New Category Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  // Edit Category State
  const [editingCategory, setEditingCategory] = useState<CategoryDefinition | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      alert('Kode dan nama kategori wajib diisi.');
      return;
    }

    const id = newName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 24) || `cat_${Date.now()}`;
    if (categories.some((c) => c.id === id || c.code.toLowerCase() === newCode.trim().toLowerCase())) {
      alert('Kode atau nama kategori serupa sudah ada dalam sistem.');
      return;
    }

    const newCat: CategoryDefinition = {
      id,
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      description: newDesc.trim() || 'Kategori inventaris dan fasilitas kantor.',
      color: newColor,
    };

    const updated = [...categories, newCat];
    onSaveCategories(updated);
    setNewCode('');
    setNewName('');
    setNewDesc('');
    setShowAddForm(false);
    showToast(`Kategori "${newCat.name}" berhasil ditambahkan!`);
  };

  const handleStartEdit = (cat: CategoryDefinition) => {
    setEditingCategory({ ...cat });
    setShowAddForm(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const updated = categories.map((c) =>
      c.id === editingCategory.id ? editingCategory : c
    );
    onSaveCategories(updated);
    showToast(`Perubahan kategori "${editingCategory.name}" berhasil disimpan!`);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (catId: string) => {
    if (categories.length <= 1) {
      alert('Minimal harus ada 1 kategori aktif dalam sistem inventaris.');
      return;
    }

    const targetCat = categories.find((c) => c.id === catId);
    const linkedAssets = assets.filter((a) => a.category === catId);

    if (linkedAssets.length > 0) {
      const confirmDelete = confirm(
        `PERINGATAN: Kategori "${targetCat?.name}" saat ini digunakan oleh ${linkedAssets.length} unit aset inventaris.\n\nApakah Anda tetap ingin menghapus kategori ini? Aset terkait akan dialihkan ke kategori default.`
      );
      if (!confirmDelete) return;
    } else {
      if (!confirm(`Hapus kategori "${targetCat?.name}"?`)) return;
    }

    const updated = categories.filter((c) => c.id !== catId);
    onSaveCategories(updated);
    showToast(`Kategori "${targetCat?.name}" berhasil dihapus.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header with BACK Button */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors shadow-2xs"
              title="Kembali ke Halaman Sebelumnya"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>

            <div className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-slate-800" />
              <div>
                <h3 className="font-semibold text-slate-900 text-base leading-tight">
                  Manajemen Kategori Fasilitas & Aset
                </h3>
                <p className="text-xs text-slate-500">
                  Tambah kategori baru, ubah nama/kode, atau hapus kategori inventaris kantor
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="mx-6 mt-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Top Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Total Kategori Terdaftar: {categories.length}
              </span>
              <span className="text-[11px] text-slate-500">
                Pengelompokan ini digunakan di filter aset, label barcode, dan dashboard analitik
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingCategory(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-2xs transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Tutup Form' : 'Tambah Kategori Baru'}</span>
            </button>
          </div>

          {/* Add Category Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddCategory}
              className="p-4 bg-slate-50/80 border-2 border-slate-900 rounded-xl space-y-3 text-xs"
            >
              <div className="font-bold text-slate-900 flex items-center gap-2 text-sm border-b border-slate-200 pb-2">
                <Plus className="w-4 h-4" />
                <span>Form Pendaftaran Kategori Baru</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Nama Kategori Fasilitas:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Sistem CCTV & Keamanan"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Kode Singkat Kategori:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: CCTV / NET / ME"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono uppercase font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Deskripsi & Cakupan Fasilitas:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Kamera keamanan DVR/NVR, access door lock, dan sensor intrusi gedung."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                    Pilih Warna Penanda Kategori:
                  </label>
                  <div className="flex items-center gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          newColor === c ? 'scale-125 ring-2 ring-slate-900 ring-offset-1' : 'hover:scale-110'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold"
                >
                  Simpan Kategori Baru
                </button>
              </div>
            </form>
          )}

          {/* Edit Category Form Modal */}
          {editingCategory && (
            <form
              onSubmit={handleSaveEdit}
              className="p-4 bg-slate-50 border-2 border-slate-900 rounded-xl space-y-3 text-xs shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Data Kategori: {editingCategory.code}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Nama Kategori:
                  </label>
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, name: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Kode Singkat:
                  </label>
                  <input
                    type="text"
                    value={editingCategory.code}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono uppercase font-bold text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Deskripsi:
                  </label>
                  <textarea
                    rows={2}
                    value={editingCategory.description}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                    Warna Penanda:
                  </label>
                  <div className="flex items-center gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() =>
                          setEditingCategory({ ...editingCategory, color: c })
                        }
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          editingCategory.color === c
                            ? 'scale-125 ring-2 ring-slate-900 ring-offset-1'
                            : 'hover:scale-110'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          )}

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories.map((c) => {
              const count = assets.filter((a) => a.category === c.id).length;

              return (
                <div
                  key={c.id}
                  className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: c.color || '#0284c7' }}
                        />
                        <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {c.code}
                      </span>
                    </div>

                    <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">
                      {c.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium text-[11px]">
                      {count} Unit Aset Terdaftar
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(c)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium text-[11px] transition-colors"
                        title="Edit Kategori Ini"
                      >
                        <Pencil className="w-3 h-3 text-slate-600" />
                        <span>Edit</span>
                      </button>

                      {categories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(c.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with BACK Button */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 font-semibold text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Sebelumnya</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
