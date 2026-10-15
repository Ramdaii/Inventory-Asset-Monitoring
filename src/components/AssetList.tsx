/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Asset, AssetCategory, AssetStatus, Branch, UserProfile } from '../types';
import { getDaysRemaining } from '../utils/notificationEngine';
import { BranchSelector } from './BranchSelector';
import {
  Search,
  Filter,
  Plus,
  Tag,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ScanLine,
  Building,
  Upload,
} from 'lucide-react';

interface AssetListProps {
  assets: Asset[];
  branches: Branch[];
  currentUser: UserProfile;
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onSelectAsset: (asset: Asset) => void;
  onOpenBarcode: (asset: Asset) => void;
  onOpenNewAsset: () => void;
  onOpenScanner: () => void;
}

export const AssetList: React.FC<AssetListProps> = ({
  assets,
  branches,
  currentUser,
  selectedBranchId,
  onSelectBranch,
  onSelectAsset,
  onOpenBarcode,
  onOpenNewAsset,
  onOpenScanner,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AssetStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | AssetCategory>('all');

  // Filter logic including branch
  const filteredAssets = assets.filter((asset) => {
    const matchesBranch = selectedBranchId === 'all' || asset.branchId === selectedBranchId;
    const matchesSearch =
      asset.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.brandModel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;

    return matchesBranch && matchesSearch && matchesStatus && matchesCategory;
  });

  const canCreate =
    currentUser.roleId === 'full_admin' ||
    currentUser.roleId === 'ga_manager' ||
    currentUser.roleId === 'ga_staff';

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kode aset, nama fasilitas, ruangan, atau vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="all">Semua Kategori</option>
                <option value="hvac">HVAC / AC Chiller</option>
                <option value="power_genset">Genset & Power</option>
                <option value="elevator">Lift & Eskalator</option>
                <option value="fire_safety">Sistem APAR</option>
                <option value="it_network">IT Network & Server</option>
                <option value="office_facility">Pantry & Kantor</option>
                <option value="vehicle">Kendaraan GA</option>
                <option value="plumbing">Plumbing & Pompa</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canCreate && (
              <button
                onClick={onOpenNewAsset}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-2xs whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Aset Baru
              </button>
            )}
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs whitespace-nowrap"
            >
              <ScanLine className="w-3.5 h-3.5" />
              Scan Barcode
            </button>
          </div>
        </div>

        {/* Branch Filter Selector Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <BranchSelector
            branches={branches}
            selectedBranchId={selectedBranchId}
            onSelectBranch={onSelectBranch}
          />

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit text-xs self-start sm:self-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({assets.length})
            </button>
            <button
              onClick={() => setStatusFilter('optimal')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                statusFilter === 'optimal'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Optimal ({assets.filter((a) => a.status === 'optimal').length})
            </button>
            <button
              onClick={() => setStatusFilter('service_due')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                statusFilter === 'service_due'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Perlu Servis ({assets.filter((a) => a.status === 'service_due').length})
            </button>
            <button
              onClick={() => setStatusFilter('critical_overdue')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                statusFilter === 'critical_overdue'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kritis ({assets.filter((a) => a.status === 'critical_overdue').length})
            </button>
          </div>
        </div>
      </div>

      {/* High-Density Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Kode & Barcode</th>
                <th className="px-4 py-3 font-medium">Cabang</th>
                <th className="px-4 py-3 font-medium">Nama Fasilitas & Spesifikasi</th>
                <th className="px-4 py-3 font-medium">Lokasi Ruangan</th>
                <th className="px-4 py-3 font-medium text-center">Kesehatan</th>
                <th className="px-4 py-3 font-medium">Servis Berikutnya</th>
                <th className="px-4 py-3 font-medium">Vendor Rekanan</th>
                <th className="px-4 py-3 font-medium text-right">Total Biaya</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    Tidak ada fasilitas inventaris yang sesuai dengan filter pencarian atau cabang terpilih.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const days = getDaysRemaining(asset.nextMaintenanceDate, '2026-10-14');
                  const isOverdue = days < 0;
                  const isToday = days === 0;
                  const assetBranch = branches.find((b) => b.id === asset.branchId);

                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      onClick={() => onSelectAsset(asset)}
                    >
                      {/* Code and Barcode icon */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenBarcode(asset);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                            title="Buka / Cetak Label Tag Barcode"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono font-bold text-slate-900">{asset.code}</span>
                          {asset.customBarcodeImage && (
                            <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                              Custom
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Branch Badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {assetBranch ? assetBranch.code : 'RAD'}
                        </span>
                      </td>

                      {/* Name & Category */}
                      <td className="px-4 py-3 min-w-[200px]">
                        <div className="font-semibold text-slate-900 group-hover:text-slate-950">
                          {asset.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {asset.brandModel} · <span className="uppercase">{asset.category}</span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate">
                        {asset.location}
                      </td>

                      {/* Health Score */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-800">
                          {asset.healthScore}%
                        </span>
                        <div className="w-16 bg-slate-200 h-1 rounded-full mx-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full ${
                              asset.healthScore >= 80
                                ? 'bg-emerald-500'
                                : asset.healthScore >= 60
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${asset.healthScore}%` }}
                          />
                        </div>
                      </td>

                      {/* Next Service Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-mono font-medium text-slate-900">
                          {asset.nextMaintenanceDate}
                        </div>
                        <div className="text-[10px]">
                          {isOverdue ? (
                            <span className="text-rose-600 font-semibold">
                              Overdue {Math.abs(days)} Hari
                            </span>
                          ) : isToday ? (
                            <span className="text-amber-600 font-semibold">Hari Ini</span>
                          ) : (
                            <span className="text-slate-400">Tersisa {days} Hari</span>
                          )}
                        </div>
                      </td>

                      {/* Vendor */}
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap truncate max-w-[140px]">
                        {asset.vendor}
                      </td>

                      {/* Cost */}
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-900 whitespace-nowrap">
                        Rp {asset.actualCostTotal.toLocaleString('id-ID')}
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onOpenBarcode(asset)}
                            className="px-2 py-1 text-[11px] font-medium bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-700 transition-colors"
                          >
                            Barcode
                          </button>
                          <button
                            onClick={() => onSelectAsset(asset)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors"
                          >
                            Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
