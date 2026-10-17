/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Branch, PermissionKey, RoleDefinition, UserProfile } from '../types';
import {
  Users,
  ShieldCheck,
  Building2,
  X,
  Plus,
  KeyRound,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  AlertCircle,
  Check,
  Lock,
  Pencil,
  Phone,
  ArrowLeft,
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  roles: RoleDefinition[];
  branches: Branch[];
  currentUser: UserProfile;
  initialTab?: 'users' | 'roles' | 'branches';
  initialBranchIdToEdit?: string | null;
  onSaveUsers: (users: UserProfile[]) => void;
  onSaveRoles: (roles: RoleDefinition[]) => void;
  onSaveBranches: (branches: Branch[]) => void;
}

const ALL_PERMISSIONS: { key: PermissionKey; label: string; desc: string }[] = [
  { key: 'view_assets', label: 'Melihat Fasilitas & Aset', desc: 'Akses melihat inventaris, spesifikasi, dan status kesehatan.' },
  { key: 'create_assets', label: 'Menambah Aset Baru', desc: 'Mendaftarkan fasilitas baru ke inventaris kantor.' },
  { key: 'edit_assets', label: 'Mengedit Informasi Aset', desc: 'Mengubah jadwal servis, vendor, dan lokasi aset.' },
  { key: 'delete_assets', label: 'Menghapus Aset', desc: 'Menghapus fasilitas dari database inventaris kantor.' },
  { key: 'log_maintenance', label: 'Mencatat Servis / Perawatan', desc: 'Input hasil servis teknisi, biaya pengerjaan, dan suku cadang.' },
  { key: 'upload_documents', label: 'Unggah Dokumen Cloud Vault', desc: 'Menyimpan manual, garansi, SPK/invoice ke cloud vault.' },
  { key: 'manage_barcodes', label: 'Kelola & Upload Barcode Sendiri', desc: 'Upload custom barcode image dan cetak label tag fisik.' },
  { key: 'manage_branches', label: 'Kelola Percabangan Kantor', desc: 'Menambah kantor cabang dan memindahkan penempatan aset.' },
  { key: 'email_notifications', label: 'Kirim Notifikasi Email Otomatis', desc: 'Memicu pengingat jadwal servis berkala ke vendor & tim.' },
  { key: 'export_reports', label: 'Ekspor Laporan Audit', desc: 'Mengunduh rekap bulanan/tahunan format CSV & cetak PDF.' },
  { key: 'manage_backups', label: 'Kelola Cadangan Data E2EE', desc: 'Membuat snapshot cadangan terenkripsi dan restore database.' },
  { key: 'manage_users', label: 'Manajemen Pengguna, Role & PIN', desc: 'Membuat akun GA Manager/Staff, set PIN akses, dan batasan role.' },
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  roles,
  branches,
  currentUser,
  initialTab = 'users',
  initialBranchIdToEdit,
  onSaveUsers,
  onSaveRoles,
  onSaveBranches,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'branches'>(initialTab);
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

  // New User Form State
  const [showAddUser, setShowAddUser] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userDept, setUserDept] = useState('General Affairs');
  const [userBranch, setUserBranch] = useState(branches[0]?.id || 'branch-rad');
  const [userRole, setUserRole] = useState(roles[1]?.id || 'ga_manager');
  const [userPin, setUserPin] = useState('');

  // New Role Form State
  const [showAddRole, setShowAddRole] = useState(false);
  const [roleLabel, setRoleLabel] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>([
    'view_assets',
    'log_maintenance',
  ]);

  // New Branch Form State
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [branchCode, setBranchCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchCity, setBranchCity] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPic, setBranchPic] = useState('');
  const [branchPhone, setBranchPhone] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      if (initialBranchIdToEdit) {
        const found = branches.find((b) => b.id === initialBranchIdToEdit);
        if (found) {
          setEditingBranch({ ...found });
        }
      }
    }
  }, [isOpen, initialTab, initialBranchIdToEdit, branches]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const togglePinVisibility = (userId: string) => {
    setVisiblePins((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Add User handler
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail || userPin.length !== 6) {
      alert('Nama, email, dan PIN akses 6-digit harus diisi.');
      return;
    }

    const matchedRole = roles.find((r) => r.id === userRole) || roles[0];
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: userName.trim(),
      email: userEmail.trim(),
      roleId: matchedRole.id,
      roleLabel: matchedRole.label,
      department: userDept.trim() || 'General Affairs',
      branchId: userBranch,
      pin: userPin.trim(),
      avatarUrl: '',
    };

    const updated = [...users, newUser];
    onSaveUsers(updated);
    setShowAddUser(false);
    setUserName('');
    setUserEmail('');
    setUserPin('');
    showToast(`Akun ${newUser.name} berhasil dibuat dengan PIN ${newUser.pin}!`);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }
    if (confirm('Hapus akun pengguna ini? Pengguna tidak akan bisa login lagi.')) {
      const updated = users.filter((u) => u.id !== userId);
      onSaveUsers(updated);
      showToast('Akun pengguna berhasil dihapus.');
    }
  };

  // Add Custom Role handler
  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleLabel.trim()) return;

    const roleId = `role_${Date.now()}`;
    const newRole: RoleDefinition = {
      id: roleId,
      name: roleId,
      label: roleLabel.trim(),
      description: roleDesc.trim() || 'Role kustom dengan batasan izin khusus.',
      permissions: selectedPermissions,
      isSystem: false,
    };

    const updated = [...roles, newRole];
    onSaveRoles(updated);
    setShowAddRole(false);
    setRoleLabel('');
    setRoleDesc('');
    showToast(`Role "${newRole.label}" berhasil dibuat dengan ${selectedPermissions.length} batasan hak akses!`);
  };

  const handleTogglePermission = (key: PermissionKey) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Add Branch handler
  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchCode || !branchName) return;

    const newBranch: Branch = {
      id: `branch-${Date.now()}`,
      code: branchCode.trim().toUpperCase(),
      name: branchName.trim(),
      city: branchCity.trim() || 'Indonesia',
      address: branchAddress.trim() || '-',
      picName: branchPic.trim() || currentUser.name,
      picPhone: branchPhone.trim() || '-',
    };

    const updated = [...branches, newBranch];
    onSaveBranches(updated);
    setShowAddBranch(false);
    setBranchCode('');
    setBranchName('');
    setBranchCity('');
    setBranchAddress('');
    showToast(`Cabang "${newBranch.name}" berhasil ditambahkan!`);
  };

  // Edit Branch handlers
  const handleStartEditBranch = (branch: Branch) => {
    setEditingBranch({ ...branch });
    setShowAddBranch(false);
  };

  const handleSaveEditBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    const updated = branches.map((b) => (b.id === editingBranch.id ? editingBranch : b));
    onSaveBranches(updated);
    setEditingBranch(null);
    showToast(`Data cabang "${editingBranch.name}" berhasil diperbarui!`);
  };

  const handleDeleteBranch = (branchId: string) => {
    if (branches.length <= 1) {
      alert('Minimal harus ada 1 kantor cabang terdaftar dalam sistem.');
      return;
    }
    const b = branches.find((item) => item.id === branchId);
    if (confirm(`Apakah Anda yakin ingin menghapus kantor cabang "${b?.name}"?`)) {
      const updated = branches.filter((item) => item.id !== branchId);
      onSaveBranches(updated);
      showToast('Kantor cabang berhasil dihapus.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header with Back button */}
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
              <ShieldCheck className="w-5 h-5 text-slate-800" />
              <div>
                <h3 className="font-semibold text-slate-900 text-base leading-tight">
                  Manajemen Pengguna, Batasan Role & Percabangan
                </h3>
                <p className="text-xs text-slate-500">
                  Kelola akun GA Manager/Staff, nomor PIN akses masuk, dan batasan hak fitur sistem
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

        {/* Tab Controls */}
        <div className="flex items-center gap-1 px-3 sm:px-6 pt-2 border-b border-slate-200 bg-white shrink-0 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 sm:px-4 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'users'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Akun Pengguna & PIN Masuk ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3 sm:px-4 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'roles'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Role & Batasan Hak Akses ({roles.length})
          </button>
          <button
            onClick={() => setActiveTab('branches')}
            className={`px-3 sm:px-4 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'branches'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Kantor Cabang ({branches.length})
          </button>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="mx-6 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between shrink-0">
            <span>{toastMessage}</span>
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* TAB 1: USERS & PIN */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Daftar Akun & PIN Akses</h4>
                  <p className="text-slate-500 text-[11px]">
                    Setiap akun memiliki nomor PIN 6-digit untuk autentikasi saat mengakses link dashboard.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Buat Akun Baru
                </button>
              </div>

              {/* Add User Form */}
              {showAddUser && (
                <form
                  onSubmit={handleAddUser}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                >
                  <div className="font-semibold text-slate-900">
                    Registrasi Akun Baru (GA Manager / Staff GA / Vendor):
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-700 block mb-1">Nama Lengkap:</label>
                      <input
                        type="text"
                        placeholder="Contoh: Ahmad Maulana"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 block mb-1">Email Kantor:</label>
                      <input
                        type="email"
                        placeholder="ahmad.maulana@perusahaan.co.id"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 block mb-1">Departemen:</label>
                      <input
                        type="text"
                        value={userDept}
                        onChange={(e) => setUserDept(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 block mb-1">Cabang Penempatan:</label>
                      <select
                        value={userBranch}
                        onChange={(e) => setUserBranch(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-700 block mb-1">Role / Peran:</label>
                      <select
                        value={userRole}
                        onChange={(e) => setUserRole(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-700 block mb-1 font-semibold text-emerald-800">
                        PIN Akses 6-Digit (Wajib Angka):
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        pattern="\d{6}"
                        placeholder="Contoh: 123456"
                        value={userPin}
                        onChange={(e) => setUserPin(e.target.value.replace(/\D/g, ''))}
                        required
                        className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold tracking-widest text-emerald-950"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setShowAddUser(false)}
                      className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium"
                    >
                      Simpan Akun & PIN
                    </button>
                  </div>
                </form>
              )}

              {/* Users Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-3 font-medium">Nama Pengguna</th>
                      <th className="px-4 py-3 font-medium">Role & Batasan</th>
                      <th className="px-4 py-3 font-medium">Cabang</th>
                      <th className="px-4 py-3 font-medium">PIN Akses</th>
                      <th className="px-4 py-3 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => {
                      const branch = branches.find((b) => b.id === u.branchId);
                      const isPinVisible = visiblePins[u.id];

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{u.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-800">{u.roleLabel}</span>
                            <div className="text-[10px] text-slate-400">{u.department}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {branch ? branch.name : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 tracking-wider">
                                {isPinVisible ? u.pin : '••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePinVisibility(u.id)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                title={isPinVisible ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                              >
                                {isPinVisible ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {u.id !== currentUser.id && (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Hapus Akun"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ROLES & PERMISSIONS */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Manajemen Role & Batasan Hak Akses Fitur
                  </h4>
                  <p className="text-slate-500 text-[11px]">
                    Sebagai Full Administrator, Anda dapat membuat role baru dan menentukan fitur apa saja yang boleh dan tidak boleh diakses.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddRole(!showAddRole)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Buat Role Kustom
                </button>
              </div>

              {/* Add Custom Role Form */}
              {showAddRole && (
                <form
                  onSubmit={handleAddRole}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4"
                >
                  <div className="font-semibold text-slate-900">
                    Definisikan Role Kustom & Atur Batasan Fitur:
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-700 block mb-1">Nama / Label Role:</label>
                      <input
                        type="text"
                        placeholder="Contoh: Auditor Fasilitas Eksternal"
                        value={roleLabel}
                        onChange={(e) => setRoleLabel(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 block mb-1">Deskripsi Tugas & Batasan:</label>
                      <input
                        type="text"
                        placeholder="Contoh: Hanya boleh melihat laporan dan mengunduh audit berkala"
                        value={roleDesc}
                        onChange={(e) => setRoleDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-700 block font-semibold mb-2">
                      Pilih Batasan Izin Fitur (Centang untuk Memberikan Akses):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {ALL_PERMISSIONS.map((perm) => {
                        const isChecked = selectedPermissions.includes(perm.key);
                        return (
                          <div
                            key={perm.key}
                            onClick={() => handleTogglePermission(perm.key)}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between font-semibold">
                              <span>{perm.label}</span>
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center border ${
                                  isChecked ? 'bg-emerald-400 border-emerald-400 text-slate-900' : 'border-slate-300'
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                            <p
                              className={`text-[10px] mt-1 leading-normal ${
                                isChecked ? 'text-slate-300' : 'text-slate-400'
                              }`}
                            >
                              {perm.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setShowAddRole(false)}
                      className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium"
                    >
                      Simpan Role Baru
                    </button>
                  </div>
                </form>
              )}

              {/* Roles List Cards */}
              <div className="space-y-3">
                {roles.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{r.label}</span>
                        {r.isSystem ? (
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            Role Sistem Bawaan
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                            Role Kustom Admin
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {r.permissions.length} dari {ALL_PERMISSIONS.length} Fitur Terbuka
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px]">{r.description}</p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {ALL_PERMISSIONS.map((p) => {
                        const hasAccess = r.permissions.includes(p.key);
                        return (
                          <span
                            key={p.key}
                            className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                              hasAccess
                                ? 'bg-slate-100 text-slate-800 border border-slate-200'
                                : 'bg-slate-50 text-slate-300 line-through'
                            }`}
                          >
                            {p.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BRANCHES */}
          {activeTab === 'branches' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Manajemen Percabangan Kantor (Multi-Branch)
                  </h4>
                  <p className="text-slate-500 text-[11px]">
                    Fasilitas dan jadwal servis AC, genset, dan inventaris dapat dipantau dan difilter per cabang (contoh: Cabang RAD).
                  </p>
                </div>
                <button
                  onClick={() => setShowAddBranch(!showAddBranch)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Cabang
                </button>
              </div>

              {/* Add Branch Form */}
              {showAddBranch && (
                <form
                  onSubmit={handleAddBranch}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                >
                  <div className="font-semibold text-slate-900">Tambah Percabangan Baru:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-700 block mb-1">Kode Cabang (Singkat):</label>
                      <input
                        type="text"
                        placeholder="Contoh: RAD / SBY / SMG"
                        value={branchCode}
                        onChange={(e) => setBranchCode(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono uppercase font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 block mb-1">Nama Kantor Cabang:</label>
                      <input
                        type="text"
                        placeholder="Contoh: Cabang RAD (Riyadi Asset District)"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 block mb-1">Kota / Wilayah:</label>
                      <input
                        type="text"
                        placeholder="Contoh: Jakarta Timur"
                        value={branchCity}
                        onChange={(e) => setBranchCity(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 block mb-1">PIC Fasilitas Cabang:</label>
                      <input
                        type="text"
                        placeholder="Nama penanggung jawab cabang"
                        value={branchPic}
                        onChange={(e) => setBranchPic(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-slate-700 block mb-1">Alamat Gedung Cabang:</label>
                      <input
                        type="text"
                        placeholder="Alamat lengkap lokasi kantor cabang"
                        value={branchAddress}
                        onChange={(e) => setBranchAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setShowAddBranch(false)}
                      className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium"
                    >
                      Simpan Cabang
                    </button>
                  </div>
                </form>
              )}

              {/* Branches Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {branches.map((b) => {
                  const isEditingThis = editingBranch?.id === b.id;

                  if (isEditingThis && editingBranch) {
                    return (
                      <form
                        key={b.id}
                        onSubmit={handleSaveEditBranch}
                        className="p-4 bg-slate-50 border-2 border-slate-900 rounded-xl space-y-3 shadow-sm text-xs"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Pencil className="w-3.5 h-3.5 text-slate-700" />
                            <span>Edit Data Cabang: {b.code}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingBranch(null)}
                            className="text-slate-400 hover:text-slate-600 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                              Nama Cabang:
                            </label>
                            <input
                              type="text"
                              value={editingBranch.name}
                              onChange={(e) =>
                                setEditingBranch({ ...editingBranch, name: e.target.value })
                              }
                              required
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                              Kode Cabang:
                            </label>
                            <input
                              type="text"
                              value={editingBranch.code}
                              onChange={(e) =>
                                setEditingBranch({
                                  ...editingBranch,
                                  code: e.target.value.toUpperCase(),
                                })
                              }
                              required
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono uppercase font-bold text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                              Kota / Wilayah:
                            </label>
                            <input
                              type="text"
                              value={editingBranch.city}
                              onChange={(e) =>
                                setEditingBranch({ ...editingBranch, city: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                              PIC Fasilitas Cabang:
                            </label>
                            <input
                              type="text"
                              value={editingBranch.picName}
                              onChange={(e) =>
                                setEditingBranch({ ...editingBranch, picName: e.target.value })
                              }
                              required
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none text-xs"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                              No. Telepon / WhatsApp PIC:
                            </label>
                            <input
                              type="text"
                              value={editingBranch.picPhone}
                              onChange={(e) =>
                                setEditingBranch({ ...editingBranch, picPhone: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono text-xs"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                              Alamat Gedung Cabang:
                            </label>
                            <textarea
                              rows={2}
                              value={editingBranch.address}
                              onChange={(e) =>
                                setEditingBranch({ ...editingBranch, address: e.target.value })
                              }
                              required
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                          <button
                            type="button"
                            onClick={() => setEditingBranch(null)}
                            className="px-3 py-1.5 text-slate-600 hover:text-slate-800 rounded"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold shadow-2xs"
                          >
                            Simpan Perubahan Cabang
                          </button>
                        </div>
                      </form>
                    );
                  }

                  return (
                    <div
                      key={b.id}
                      className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition-colors flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">{b.name}</span>
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {b.code}
                          </span>
                        </div>
                        <div className="text-slate-600 text-[11px] leading-relaxed">
                          {b.address}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <div>
                          <div className="text-slate-700 font-medium">PIC: {b.picName}</div>
                          <div className="text-slate-400 text-[10px] flex items-center gap-1 font-mono">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{b.picPhone || '-'}</span>
                            <span>·</span>
                            <span>{b.city}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditBranch(b)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium transition-colors"
                            title="Edit Alamat & PIC Cabang"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Edit Cabang</span>
                          </button>

                          {branches.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteBranch(b.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Hapus Cabang"
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
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-200/50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Sebelumnya</span>
          </button>
          <div className="flex items-center gap-3">
            <span>Otorisasi: {currentUser.name} ({currentUser.roleLabel})</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
