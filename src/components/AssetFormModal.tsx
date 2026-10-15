/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Asset, AssetCategory, Branch, MaintenanceFrequency } from '../types';
import { X, Plus, Building, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';

interface AssetFormModalProps {
  isOpen: boolean;
  branches: Branch[];
  selectedBranchId?: string;
  onClose: () => void;
  onSave: (asset: Asset) => void;
  existingCount: number;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  isOpen,
  branches,
  selectedBranchId,
  onClose,
  onSave,
  existingCount,
}) => {
  const nextNum = String(existingCount + 1).padStart(3, '0');
  
  const [branchId, setBranchId] = useState<string>(
    selectedBranchId && selectedBranchId !== 'all' ? selectedBranchId : branches[0]?.id || 'branch-rad'
  );
  const [code, setCode] = useState(`RAD-AC-${nextNum}`);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('hvac');
  const [location, setLocation] = useState('');
  const [brandModel, setBrandModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('2026-01-10');
  const [warrantyExpiry, setWarrantyExpiry] = useState('2028-01-10');
  const [frequency, setFrequency] = useState<MaintenanceFrequency>('quarterly');
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState('2026-11-15');
  const [vendor, setVendor] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [assignedStaff, setAssignedStaff] = useState('Denny Pratama');
  const [estimatedCost, setEstimatedCost] = useState(1200000);
  const [customBarcodeImage, setCustomBarcodeImage] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleBranchChange = (newBranchId: string) => {
    setBranchId(newBranchId);
    const matched = branches.find((b) => b.id === newBranchId);
    const prefix = matched ? matched.code : 'RAD';
    setCode(`${prefix}-AC-${nextNum}`);
  };

  const handleCustomBarcodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      if (dataUri) {
        setCustomBarcodeImage(dataUri);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const matchedBranch = branches.find((b) => b.id === branchId);

    const newAsset: Asset = {
      id: `ast-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      branchId,
      category,
      location: location.trim() || (matchedBranch ? matchedBranch.name : 'Cabang RAD'),
      brandModel: brandModel.trim() || '-',
      serialNumber: serialNumber.trim() || '-',
      purchaseDate,
      warrantyExpiry,
      status: 'optimal',
      healthScore: 100,
      lastMaintenanceDate: purchaseDate,
      nextMaintenanceDate,
      frequency,
      vendor: vendor.trim() || 'Internal General Affairs',
      vendorContact: vendorContact.trim() || '-',
      assignedStaff,
      estimatedCost: Number(estimatedCost) || 0,
      actualCostTotal: 0,
      customBarcodeImage,
      notes: notes.trim(),
      documents: [
        {
          id: `doc-${Date.now()}`,
          title: `Surat Registrasi Inventaris ${code}.pdf`,
          type: 'sop',
          uploadDate: new Date().toISOString().slice(0, 10),
          fileSize: '1.2 MB',
          encrypted: true,
          description: 'Dokumen pencatatan aset inventaris resmi.',
        },
      ],
      maintenanceHistory: [],
    };

    onSave(newAsset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-slate-800" />
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                Registrasi Fasilitas & Aset Baru
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan inventaris cabang, jadwal servis preventif, dan upload barcode kustom Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Kantor Percabangan:
              </label>
              <select
                value={branchId}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-semibold"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Kode Aset (Barcode):</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono font-bold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">
                Nama Fasilitas / Peralatan Kantor:
              </label>
              <input
                type="text"
                placeholder="Contoh: AC Cassette 4 PK Ruang Operasional (Cabang RAD)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Kategori Fasilitas:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="hvac">HVAC & Tata Udara (AC / Chiller)</option>
                <option value="power_genset">Kelistrikan & Genset Cadangan</option>
                <option value="elevator">Lift & Eskalator Gedung</option>
                <option value="fire_safety">Keselamatan Kebakaran & APAR</option>
                <option value="it_network">IT Network & Server Infrastructure</option>
                <option value="office_facility">Fasilitas Pantry & Kantor</option>
                <option value="vehicle">Kendaraan Operasional GA</option>
                <option value="plumbing">Plumbing & Pompa Booster Air</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Lokasi Ruangan:</label>
              <input
                type="text"
                placeholder="Contoh: Cabang RAD - Lantai 1 Ruang Kerja"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Merk & Tipe Model:</label>
              <input
                type="text"
                placeholder="Contoh: Daikin SkyAir Inverter 4 PK"
                value={brandModel}
                onChange={(e) => setBrandModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nomor Seri Pabrik (SN):</label>
              <input
                type="text"
                placeholder="Contoh: DK-RAD-2024-AC01"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Siklus Perawatan Berkala:</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as MaintenanceFrequency)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="weekly">Mingguan (Weekly)</option>
                <option value="biweekly">Dua Mingguan (Bi-weekly)</option>
                <option value="monthly">Bulanan (Monthly)</option>
                <option value="quarterly">Triwulanan (Quarterly - 3 Bulan)</option>
                <option value="biannually">Semesteran (6 Bulan)</option>
                <option value="annually">Tahunan (Annually)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Jadwal Servis Pertama / Berikutnya:
              </label>
              <input
                type="date"
                value={nextMaintenanceDate}
                onChange={(e) => setNextMaintenanceDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Vendor Rekanan Terkait:</label>
              <input
                type="text"
                placeholder="Contoh: PT Daikin Partner Cabang RAD"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Estimasi Biaya Servis (Rp):</label>
              <input
                type="number"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
              />
            </div>

            {/* Custom Barcode Upload Section (User Requirement 5) */}
            <div className="md:col-span-2 p-3.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">
                    Upload Barcode Kustom Anda Sendiri (Opsional)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Anda dapat mengunggah file gambar barcode atau stiker QR Anda sendiri untuk barang inventaris ini.
                  </span>
                </div>

                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-lg cursor-pointer transition-colors font-medium">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih Gambar Barcode</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomBarcodeUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {customBarcodeImage && (
                <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                  <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg p-1 flex items-center justify-center overflow-hidden">
                    <img
                      src={customBarcodeImage}
                      alt="Preview Barcode"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-emerald-700 font-semibold text-xs block">
                      Barcode Kustom Terpilih
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Gambar ini akan digunakan pada tag label dan scanner aset.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomBarcodeImage(undefined)}
                    className="text-rose-600 hover:text-rose-800 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Catatan Tambahan:</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Petunjuk khusus pengoperasian fasilitas..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold shadow-2xs"
            >
              Simpan & Cetak Barcode
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
