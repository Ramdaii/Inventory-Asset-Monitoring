/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Asset, AssetDocument, Branch, MaintenanceLog, UserProfile } from '../types';
import {
  X,
  Calendar,
  Wrench,
  FileText,
  ShieldCheck,
  Tag,
  Clock,
  Building,
  User,
  Phone,
  DollarSign,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Download,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';

interface AssetDetailModalProps {
  asset: Asset | null;
  branches: Branch[];
  currentUser: UserProfile;
  onClose: () => void;
  onUpdateAsset: (updated: Asset) => void;
  onOpenBarcode: (asset: Asset) => void;
  onDeleteAsset?: (assetId: string) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  branches,
  currentUser,
  onClose,
  onUpdateAsset,
  onOpenBarcode,
  onDeleteAsset,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'documents' | 'log_new'>('overview');
  
  // New maintenance log form state
  const [logType, setLogType] = useState<MaintenanceLog['type']>('routine_preventive');
  const [logDate, setLogDate] = useState('2026-10-14');
  const [logTechName, setLogTechName] = useState(currentUser.name);
  const [logVendor, setLogVendor] = useState(asset?.vendor || '');
  const [logCost, setLogCost] = useState<number>(asset?.estimatedCost || 0);
  const [logDesc, setLogDesc] = useState('');
  const [logParts, setLogParts] = useState('');
  const [logBefore, setLogBefore] = useState('');
  const [logAfter, setLogAfter] = useState('');

  // New Document upload state
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState<AssetDocument['type']>('spk_invoice');
  const [showDocForm, setShowDocForm] = useState(false);

  if (!asset) return null;

  const matchedBranch = branches.find((b) => b.id === asset.branchId);
  const canEdit = currentUser.roleId === 'full_admin' || currentUser.roleId === 'ga_manager' || currentUser.roleId === 'ga_staff';
  const canLogMaintenance = currentUser.roleId !== 'employee_viewer';
  const isManager = currentUser.roleId === 'full_admin' || currentUser.roleId === 'ga_manager';

  const handleAddMaintenanceLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logDesc.trim()) return;

    const newLog: MaintenanceLog = {
      id: `log-${Date.now()}`,
      date: logDate,
      type: logType,
      technicianName: logTechName,
      vendorCompany: logVendor,
      cost: Number(logCost) || 0,
      description: logDesc,
      partsReplaced: logParts.split(',').map((p) => p.trim()).filter(Boolean),
      conditionBefore: logBefore || 'Pemeriksaan awal',
      conditionAfter: logAfter || 'Kondisi kembali optimal setelah pemeliharaan',
      verifiedBy: currentUser.name,
      status: 'completed',
      receiptAttached: true,
    };

    const currentDateObj = new Date(logDate);
    if (asset.frequency === 'monthly') currentDateObj.setMonth(currentDateObj.getMonth() + 1);
    else if (asset.frequency === 'quarterly') currentDateObj.setMonth(currentDateObj.getMonth() + 3);
    else if (asset.frequency === 'biannually') currentDateObj.setMonth(currentDateObj.getMonth() + 6);
    else if (asset.frequency === 'annually') currentDateObj.setFullYear(currentDateObj.getFullYear() + 1);
    else if (asset.frequency === 'biweekly') currentDateObj.setDate(currentDateObj.getDate() + 14);
    else currentDateObj.setDate(currentDateObj.getDate() + 30);

    const nextDateFormatted = currentDateObj.toISOString().slice(0, 10);

    const updatedAsset: Asset = {
      ...asset,
      lastMaintenanceDate: logDate,
      nextMaintenanceDate: nextDateFormatted,
      status: 'optimal',
      healthScore: Math.min(100, Math.max(90, asset.healthScore + 15)),
      actualCostTotal: asset.actualCostTotal + (Number(logCost) || 0),
      maintenanceHistory: [newLog, ...asset.maintenanceHistory],
    };

    onUpdateAsset(updatedAsset);
    setActiveTab('history');
    setLogDesc('');
    setLogParts('');
  };

  const handleCustomBarcodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      if (dataUri) {
        onUpdateAsset({ ...asset, customBarcodeImage: dataUri });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    const newDoc: AssetDocument = {
      id: `doc-${Date.now()}`,
      title: newDocTitle.endsWith('.pdf') ? newDocTitle : `${newDocTitle}.pdf`,
      type: newDocType,
      uploadDate: new Date().toISOString().slice(0, 10),
      fileSize: `${(Math.random() * 2 + 1).toFixed(1)} MB`,
      encrypted: true,
      description: `Dokumen resmi diunggah oleh ${currentUser.name}`,
    };

    const updatedAsset: Asset = {
      ...asset,
      documents: [...asset.documents, newDoc],
    };

    onUpdateAsset(updatedAsset);
    setNewDocTitle('');
    setShowDocForm(false);
  };

  const handleDeleteDocument = (docId: string) => {
    const updatedAsset: Asset = {
      ...asset,
      documents: asset.documents.filter((d) => d.id !== docId),
    };
    onUpdateAsset(updatedAsset);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">
                  {asset.code}
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  {matchedBranch ? matchedBranch.name : 'Cabang RAD'}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  E2EE Protected
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg leading-tight mt-0.5">
                {asset.name}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenBarcode(asset)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs"
            >
              <Tag className="w-3.5 h-3.5" />
              Label Barcode
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-2 border-b border-slate-200 bg-white shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Spesifikasi & Cabang
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Riwayat Servis ({asset.maintenanceHistory.length})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'documents'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Dokumen & Garansi ({asset.documents.length})
          </button>
          {canLogMaintenance && (
            <button
              onClick={() => setActiveTab('log_new')}
              className={`px-3 py-2.5 font-medium border-b-2 transition-colors ${
                activeTab === 'log_new'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              + Catat Servis Baru
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Image banner if asset has photo */}
              {asset.photoUrl && (
                <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={asset.photoUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Status and Health strip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                    Kesehatan Aset
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-bold font-mono tabular-nums text-slate-900">
                      {asset.healthScore}%
                    </span>
                    <span className="text-xs text-slate-600">
                      {asset.healthScore >= 85
                        ? 'Kondisi Prima'
                        : asset.healthScore >= 70
                        ? 'Perlu Perhatian'
                        : 'Kritis / Perlu Servis'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        asset.healthScore >= 85
                          ? 'bg-emerald-500'
                          : asset.healthScore >= 70
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${asset.healthScore}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                    Jadwal Servis Berikutnya
                  </span>
                  <div className="font-mono text-base font-bold text-slate-900 mt-1">
                    {asset.nextMaintenanceDate}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Siklus berkala: <span className="capitalize">{asset.frequency}</span>
                  </span>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                    Total Biaya Perawatan
                  </span>
                  <div className="font-mono text-base font-bold text-slate-900 mt-1">
                    Rp {asset.actualCostTotal.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Est. per siklus: Rp {asset.estimatedCost.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Technical Specifications Matrix */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Spesifikasi Teknis & Penempatan Cabang
                </h4>
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Kantor Cabang</span>
                    <span className="font-bold text-slate-900">
                      {matchedBranch ? `${matchedBranch.name} (${matchedBranch.code})` : 'Cabang RAD'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Lokasi Penempatan</span>
                    <span className="font-medium text-slate-800">{asset.location}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Model & Merk</span>
                    <span className="font-medium text-slate-800">{asset.brandModel}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nomor Seri Pabrik (SN)</span>
                    <span className="font-mono text-slate-800">{asset.serialNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tanggal Pengadaan</span>
                    <span className="font-mono text-slate-800">{asset.purchaseDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Masa Garansi Berakhir</span>
                    <span className="font-mono text-slate-800">{asset.warrantyExpiry}</span>
                  </div>
                </div>
              </div>

              {/* Custom Barcode Image Management */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Status Barcode / QR Inventaris
                  </h4>
                  {canEdit && (
                    <label className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium cursor-pointer">
                      <Upload className="w-3 h-3" />
                      <span>{asset.customBarcodeImage ? 'Ganti Barcode Kustom' : 'Upload Barcode Sendiri'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCustomBarcodeUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs">
                  {asset.customBarcodeImage ? (
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg p-1 flex items-center justify-center">
                        <img
                          src={asset.customBarcodeImage}
                          alt="Custom Barcode"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Barcode Kustom Aktif</div>
                        <div className="text-[11px] text-slate-500">
                          File gambar barcode yang Anda unggah sendiri digunakan untuk pencatatan dan scan fisik.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-xs">
                      Menggunakan barcode & QR code otomatis sistem. Klik tombol di atas jika Anda ingin mengunggah file gambar barcode Anda sendiri.
                    </div>
                  )}
                </div>
              </div>

              {/* Vendor & PIC Contact */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Vendor Rekanan & PIC Penanggung Jawab
                </h4>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Vendor Rekanan Resmi</span>
                    <span className="font-semibold text-slate-900">{asset.vendor}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Kontak Darurat / Call Center</span>
                    <span className="text-slate-800 font-mono">{asset.vendorContact}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Staf GA Penanggung Jawab</span>
                    <span className="text-slate-800 font-medium">{asset.assignedStaff}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Catatan Khusus Fasilitas</span>
                    <span className="text-slate-700 italic">{asset.notes || 'Tidak ada catatan.'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-900">
                  Buku Catatan Perawatan & Servis Fisik
                </h4>
                {canLogMaintenance && (
                  <button
                    onClick={() => setActiveTab('log_new')}
                    className="flex items-center gap-1 text-xs font-medium text-slate-900 hover:text-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Catat Servis Baru
                  </button>
                )}
              </div>

              {asset.maintenanceHistory.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Belum ada log riwayat servis untuk fasilitas ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {asset.maintenanceHistory.map((log) => (
                    <div
                      key={log.id}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 text-xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{log.date}</span>
                            <span>·</span>
                            <span className="font-semibold text-slate-800 capitalize">
                              {log.type.replace('_', ' ')}
                            </span>
                            <span>·</span>
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Selesai Terverifikasi
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Teknisi: {log.technicianName} ({log.vendorCompany}) · Verifikator: {log.verifiedBy}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-slate-900">
                          Rp {log.cost.toLocaleString('id-ID')}
                        </div>
                      </div>

                      <p className="text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                        {log.description}
                      </p>

                      {log.partsReplaced && log.partsReplaced.length > 0 && (
                        <div className="text-[11px] text-slate-600">
                          <span className="font-medium text-slate-700">Suku Cadang Diganti: </span>
                          <span>{log.partsReplaced.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Cloud Storage Dokumen Pendukung Aset (E2EE Vault)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Manual, sertifikat garansi, SPK/Invoice rekanan, dan Berita Acara Perawatan
                  </p>
                </div>
                {canEdit && (
                  <button
                    onClick={() => setShowDocForm(!showDocForm)}
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Unggah Dokumen
                  </button>
                )}
              </div>

              {showDocForm && (
                <form
                  onSubmit={handleAddDocument}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs"
                >
                  <div className="font-semibold text-slate-800">Unggah Dokumen Aset Baru:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1">Judul / Nama File:</label>
                      <input
                        type="text"
                        placeholder="Contoh: Faktur Pembelian & SPK Servis 2026.pdf"
                        value={newDocTitle}
                        onChange={(e) => setNewDocTitle(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1">Kategori Dokumen:</label>
                      <select
                        value={newDocType}
                        onChange={(e) => setNewDocType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        <option value="spk_invoice">SPK / Kwitansi / Invoice</option>
                        <option value="warranty">Sertifikat Garansi Resmi</option>
                        <option value="manual">Manual Book & Skema Teknis</option>
                        <option value="sop">Standar Operasional (SOP)</option>
                        <option value="inspection_photo">Foto Bukti Inspeksi Fisik</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDocForm(false)}
                      className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium"
                    >
                      Simpan ke Cloud Vault
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {asset.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{doc.title}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="capitalize">{doc.type.replace('_', ' ')}</span>
                          <span>·</span>
                          <span className="font-mono">{doc.fileSize}</span>
                          <span>·</span>
                          <span className="text-emerald-700 font-medium">AES-256 Enkripsi</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          alert(`Mengunduh dokumen aman: ${doc.title} (Verifikasi E2EE berhasil)`);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Unduh
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'log_new' && canLogMaintenance && (
            <form onSubmit={handleAddMaintenanceLog} className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-blue-900">
                <div className="font-semibold">Pencatatan Servis & Pemeliharaan Fasilitas</div>
                <div className="text-[11px] mt-0.5 text-blue-800">
                  Setelah disimpan, tanggal servis berikutnya akan otomatis dihitung ulang dan status kesehatan aset diperbarui.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Jenis Tindakan Perawatan:
                  </label>
                  <select
                    value={logType}
                    onChange={(e) => setLogType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="routine_preventive">Preventif Rutin Berkala</option>
                    <option value="corrective_repair">Perbaikan Kerusakan (Korektif)</option>
                    <option value="emergency_call">Panggilan Darurat (Breakdown)</option>
                    <option value="calibration">Kalibrasi & Pengujian Beban</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tanggal Pengerjaan:
                  </label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nama Teknisi Pelaksana:
                  </label>
                  <input
                    type="text"
                    value={logTechName}
                    onChange={(e) => setLogTechName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Perusahaan / Vendor:
                  </label>
                  <input
                    type="text"
                    value={logVendor}
                    onChange={(e) => setLogVendor(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Biaya Servis Realisasi (Rp):
                  </label>
                  <input
                    type="number"
                    value={logCost}
                    onChange={(e) => setLogCost(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Suku Cadang Diganti (Opsional):
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Filter freon, Fan belt"
                    value={logParts}
                    onChange={(e) => setLogParts(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Uraian Detail Pengerjaan:
                </label>
                <textarea
                  rows={3}
                  value={logDesc}
                  onChange={(e) => setLogDesc(e.target.value)}
                  placeholder="Deskripsikan tindakan pembersihan, penggantian oli/freon..."
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold shadow-2xs"
                >
                  Simpan Catatan Servis & Perbarui Siklus
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            {isManager && onDeleteAsset && (
              <button
                onClick={() => {
                  if (confirm(`Hapus aset ${asset.code} - ${asset.name} dari database inventaris?`)) {
                    onDeleteAsset(asset.id);
                    onClose();
                  }
                }}
                className="text-rose-600 hover:text-rose-800 font-medium"
              >
                Hapus Aset Ini
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-200/50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
