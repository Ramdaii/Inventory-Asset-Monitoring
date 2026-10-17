/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Asset, AssetCategory, AssetStatus, Branch, CategoryDefinition, UserProfile } from '../types';
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
  ArrowLeft,
  FolderTree,
  FileSpreadsheet,
} from 'lucide-react';

interface AssetListProps {
  assets: Asset[];
  branches: Branch[];
  categories?: CategoryDefinition[];
  currentUser: UserProfile;
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onSelectAsset: (asset: Asset) => void;
  onOpenBarcode: (asset: Asset) => void;
  onOpenNewAsset: () => void;
  onOpenScanner: () => void;
  onBackToDashboard?: () => void;
  onOpenCategoryManagement?: () => void;
  onExportExcel?: () => void;
}

export const AssetList: React.FC<AssetListProps> = ({
  assets,
  branches,
  categories = [],
  currentUser,
  selectedBranchId,
  onSelectBranch,
  onSelectAsset,
  onOpenBarcode,
  onOpenNewAsset,
  onOpenScanner,
  onBackToDashboard,
  onOpenCategoryManagement,
  onExportExcel,
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
      {/* Page Navigation & Action Bar with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors shadow-2xs"
              title="Kembali ke Ringkasan Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
          )}
          <span className="text-xs text-slate-500">
            Inventaris: <strong className="text-slate-900 font-semibold">{filteredAssets.length}</strong> fasilitas
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCategoryManagement && (
            <button
              onClick={onOpenCategoryManagement}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs"
              title="Kelola & Edit Kategori Fasilitas"
            >
              <FolderTree className="w-3.5 h-3.5 text-slate-600" />
              <span>Kelola Kategori</span>
            </button>
          )}

          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs"
              title="Unduh Data Inventaris Rapi ke Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Tarik Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kode aset, nama, ruangan, vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 shrink-0"
            >
              <option value="all">Semua Kategori ({assets.length})</option>
              {(categories.length > 0 ? categories : [
                { id: 'hvac', name: 'HVAC / AC Chiller' },
                { id: 'power_genset', name: 'Genset & Power' },
                { id: 'elevator', name: 'Lift & Eskalator' },
                { id: 'fire_safety', name: 'Sistem APAR' },
                { id: 'it_network', name: 'IT Network & Server' },
                { id: 'office_facility', name: 'Pantry & Kantor' },
                { id: 'vehicle', name: 'Kendaraan GA' },
                { id: 'plumbing', name: 'Plumbing & Pompa' },
              ]).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {canCreate && (
              <button
                onClick={onOpenNewAsset}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-2xs whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Aset Baru</span>
              </button>
            )}
            <button
              onClick={onOpenScanner}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs whitespace-nowrap"
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>Scan Barcode</span>
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
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto text-xs overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 sm:px-3 py-1 font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({assets.length})
            </button>
            <button
              onClick={() => setStatusFilter('optimal')}
              className={`px-2.5 sm:px-3 py-1 font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === 'optimal'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Optimal ({assets.filter((a) => a.status === 'optimal').length})
            </button>
            <button
              onClick={() => setStatusFilter('service_due')}
              className={`px-2.5 sm:px-3 py-1 font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === 'service_due'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Servis ({assets.filter((a) => a.status === 'service_due').length})
            </button>
            <button
              onClick={() => setStatusFilter('critical_overdue')}
              className={`px-2.5 sm:px-3 py-1 font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === 'critical_overdue'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kritis ({assets.filter((a) => a.status === 'critical_overdue').length})
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Card View (block md:hidden) - Zero horizontal scroll on mobile */}
      <div className="block md:hidden space-y-3">
        {filteredAssets.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
            Tidak ada fasilitas inventaris yang sesuai dengan filter pencarian atau cabang terpilih.
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const days = getDaysRemaining(asset.nextMaintenanceDate);
            const isOverdue = days < 0;
            const isToday = days === 0;
            const assetBranch = branches.find((b) => b.id === asset.branchId);

            return (
              <div
                key={asset.id}
                onClick={() => onSelectAsset(asset)}
                className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:border-slate-300 transition-colors active:bg-slate-50 cursor-pointer"
              >
                {/* Card Top: Code, Branch & Barcode */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded">
                      {asset.code}
                    </span>
                    {assetBranch && (
                      <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                        {assetBranch.code}
                      </span>
                    )}
                    {asset.customBarcodeImage && (
                      <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                        Custom
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenBarcode(asset);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                  >
                    <Tag className="w-3 h-3 text-slate-500" />
                    <span>Barcode</span>
                  </button>
                </div>

                {/* Card Body: Name, Model, Category, Location */}
                <div className="py-2.5">
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">
                    {asset.name}
                  </h4>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                    <span>{asset.brandModel}</span>
                    <span>·</span>
                    <span className="uppercase text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                      {asset.category}
                    </span>
                    <span>·</span>
                    <span>{asset.location}</span>
                  </div>
                </div>

                {/* Card Bottom: Health Score, Next Service, Cost */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Kesehatan:</span>
                      <span className="font-mono font-bold text-slate-800">{asset.healthScore}%</span>
                    </div>
                    <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
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
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] font-mono text-slate-800 font-medium">
                      Due: {asset.nextMaintenanceDate}
                    </div>
                    <div className="text-[10px] mt-0.5">
                      {isOverdue ? (
                        <span className="text-rose-600 font-semibold">Lewat {Math.abs(days)} Hari</span>
                      ) : isToday ? (
                        <span className="text-amber-600 font-semibold">Jatuh Tempo Hari Ini</span>
                      ) : (
                        <span className="text-slate-400">Tersisa {days} Hari</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* High-Density Data Table (hidden on mobile, visible on md+) */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
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
                  const days = getDaysRemaining(asset.nextMaintenanceDate);
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
