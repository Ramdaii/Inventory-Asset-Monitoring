/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Asset, Branch, MaintenanceTicket, UserProfile } from '../types';
import { getDaysRemaining } from '../utils/notificationEngine';
import { BranchSelector } from './BranchSelector';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Mail,
  Plus,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Wrench,
  Building2,
  MapPin,
  Tag,
  Pencil,
} from 'lucide-react';

interface DashboardOverviewProps {
  assets: Asset[];
  branches: Branch[];
  tickets: MaintenanceTicket[];
  currentUser: UserProfile;
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onSelectAsset: (asset: Asset) => void;
  onOpenScanner: () => void;
  onOpenNewAsset: () => void;
  onOpenEmailNotifications: () => void;
  onOpenReports: () => void;
  onOpenTicketModal: () => void;
  onOpenUserManagement: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  assets,
  branches,
  tickets,
  currentUser,
  selectedBranchId,
  onSelectBranch,
  onSelectAsset,
  onOpenScanner,
  onOpenNewAsset,
  onOpenEmailNotifications,
  onOpenReports,
  onOpenTicketModal,
  onOpenUserManagement,
}) => {
  // Categorization view mode: 'branch' vs 'type'
  const [categorizationMode, setCategorizationMode] = useState<'branch' | 'type'>('branch');

  // Filter assets by selected branch if not 'all'
  const branchFilteredAssets = selectedBranchId === 'all'
    ? assets
    : assets.filter((a) => a.branchId === selectedBranchId);

  const totalAssets = branchFilteredAssets.length;
  const optimalAssets = branchFilteredAssets.filter((a) => a.status === 'optimal');
  const serviceDueAssets = branchFilteredAssets.filter((a) => a.status === 'service_due');
  const overdueAssets = branchFilteredAssets.filter((a) => a.status === 'critical_overdue');

  const overallHealth = Math.round(
    branchFilteredAssets.reduce((sum, a) => sum + a.healthScore, 0) / (totalAssets || 1)
  );

  const totalCost = branchFilteredAssets.reduce((sum, a) => sum + a.actualCostTotal, 0);

  // Sort assets by upcoming next maintenance date
  const sortedUpcoming = [...branchFilteredAssets].sort(
    (a, b) => new Date(a.nextMaintenanceDate).getTime() - new Date(b.nextMaintenanceDate).getTime()
  );

  const openTickets = tickets.filter(
    (t) =>
      (selectedBranchId === 'all' || t.branchId === selectedBranchId) &&
      (t.status === 'open' || t.status === 'assigned')
  );

  const selectedBranchObj = branches.find((b) => b.id === selectedBranchId);

  return (
    <div className="space-y-6">
      {/* Top Banner & Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <div className="text-xs font-medium text-slate-500">
            Selamat datang, <span className="text-slate-900 font-semibold">{currentUser.name}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-950 mt-0.5">
            Monitoring Fasilitas & Inventaris Multi-Cabang GA
          </h2>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
            <span>Peran: <strong className="text-slate-900">{currentUser.roleLabel}</strong></span>
            <span>·</span>
            <span>Departemen: {currentUser.department}</span>
            <span>·</span>
            <span className="text-emerald-700 font-medium">Sesi Terautentikasi PIN</span>
          </div>
        </div>

        {/* Global Branch Filter Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <BranchSelector
            branches={branches}
            selectedBranchId={selectedBranchId}
            onSelectBranch={onSelectBranch}
          />

          {currentUser.roleId === 'full_admin' && (
            <button
              onClick={onOpenUserManagement}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-200 transition-colors shadow-2xs whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kelola Role & Pengguna</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Branch Highlight Badge */}
      {selectedBranchId !== 'all' && selectedBranchObj && (
        <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>
              Menampilkan khusus: <strong>{selectedBranchObj.name} ({selectedBranchObj.code})</strong> — {selectedBranchObj.address}
            </span>
          </div>
          <button
            onClick={() => onSelectBranch('all')}
            className="text-xs text-slate-300 hover:text-white underline"
          >
            Tampilkan Semua Cabang
          </button>
        </div>
      )}

      {/* Overdue / Critical Alert Ribbon if any */}
      {overdueAssets.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-950">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-rose-600 text-white rounded-lg shrink-0 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-rose-900 text-sm">
                Perhatian: Terdapat {overdueAssets.length} Fasilitas Melewati Jadwal Servis Berkala!
              </div>
              <div className="text-rose-800 mt-0.5">
                {overdueAssets.map((a) => `${a.code} (${a.name})`).join(', ')} memerlukan inspeksi segera.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenEmailNotifications}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium transition-colors"
            >
              Eskalasi Email ke Vendor
            </button>
          </div>
        </div>
      )}

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Health Index */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Kesehatan Inventaris
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-950">
              {overallHealth}%
            </span>
            <span className="text-xs font-medium text-emerald-700">Kondisi Baik</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                overallHealth >= 80 ? 'bg-emerald-500' : overallHealth >= 60 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${overallHealth}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {selectedBranchId === 'all' ? 'Gabungan Seluruh Cabang' : selectedBranchObj?.name}
          </div>
        </div>

        {/* Metric 2: Total Facilities */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Fasilitas
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-950">
              {totalAssets}
            </span>
            <span className="text-xs text-slate-500">Unit Terpasang</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 flex items-center gap-2">
            <span className="text-emerald-700 font-semibold">{optimalAssets.length} Optimal</span>
            <span>·</span>
            <span className="text-amber-700 font-semibold">{serviceDueAssets.length} Servis</span>
            <span>·</span>
            <span className="text-rose-700 font-semibold">{overdueAssets.length} Kritis</span>
          </div>
        </div>

        {/* Metric 3: Upcoming Due in 7 Days */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Jadwal Servis H-7 Hari
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-amber-600">
              {
                branchFilteredAssets.filter(
                  (a) =>
                    getDaysRemaining(a.nextMaintenanceDate, '2026-10-14') <= 7 &&
                    getDaysRemaining(a.nextMaintenanceDate, '2026-10-14') >= 0
                ).length
              }
            </span>
            <span className="text-xs text-slate-500">Aset Mendekati Servis</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-3">
            Termasuk Servis AC Cabang RAD
          </div>
        </div>

        {/* Metric 4: Total Maintenance Expenditure */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Realisasi Biaya Pemeliharaan
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-950 truncate">
              Rp {(totalCost / 1000000).toFixed(1)} Jt
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 flex items-center justify-between">
            <span>Pagu Anggaran GA</span>
            <button
              onClick={onOpenReports}
              className="text-slate-900 font-semibold hover:underline"
            >
              Lihat Laporan
            </button>
          </div>
        </div>
      </div>

      {/* Categorization Mode Switcher (User Requirement 4) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Analitik Kesehatan & Distribusi Inventaris
            </h3>
            <p className="text-xs text-slate-500">
              Pilih mode pengelompokan fasilitas untuk melihat kondisi dan biaya
            </p>
          </div>

          {/* Toggle Button: Sesuai Cabang vs Tipe Barang */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs self-start sm:self-auto">
            <button
              onClick={() => setCategorizationMode('branch')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
                categorizationMode === 'branch'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kategori Berdasarkan Cabang
            </button>
            <button
              onClick={() => setCategorizationMode('type')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
                categorizationMode === 'type'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kategori Tipe Barang
            </button>
          </div>
        </div>

        {/* MODE 1: Kategori Berdasarkan Cabang */}
        {categorizationMode === 'branch' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {branches.map((b) => {
              const bAssets = assets.filter((a) => a.branchId === b.id);
              const bCost = bAssets.reduce((sum, a) => sum + a.actualCostTotal, 0);
              const bHealth = Math.round(
                bAssets.reduce((sum, a) => sum + a.healthScore, 0) / (bAssets.length || 1)
              );
              const nextService = [...bAssets].sort(
                (x, y) => new Date(x.nextMaintenanceDate).getTime() - new Date(y.nextMaintenanceDate).getTime()
              )[0];

              return (
                <div
                  key={b.id}
                  onClick={() => onSelectBranch(b.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-xs ${
                    selectedBranchId === b.id
                      ? 'border-slate-900 bg-slate-50/80 ring-1 ring-slate-900'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{b.name}</span>
                    <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                      {b.code}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>{b.city} · PIC: {b.picName}</span>
                    {currentUser.roleId === 'full_admin' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenUserManagement();
                        }}
                        className="flex items-center gap-1 text-[10px] text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded font-medium transition-colors"
                        title="Edit Alamat atau PIC Cabang Ini"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                        <span>Edit Cabang</span>
                      </button>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Jumlah Aset:</span>
                      <span className="font-mono font-bold text-slate-900">{bAssets.length} Unit</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Kesehatan Cabang:</span>
                      <span className="font-mono font-bold text-emerald-700">{bHealth}%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Total Biaya Servis:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        Rp {(bCost / 1000).toLocaleString('id-ID')} rb
                      </span>
                    </div>

                    {nextService && (
                      <div className="mt-2 p-2 bg-slate-100 rounded-lg text-[11px]">
                        <span className="text-slate-500 block text-[10px]">Jadwal Terdekat:</span>
                        <span className="font-semibold text-slate-800 line-clamp-1">
                          {nextService.name}
                        </span>
                        <span className="font-mono text-slate-600 text-[10px]">
                          Due: {nextService.nextMaintenanceDate}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODE 2: Kategori Tipe Barang */}
        {categorizationMode === 'type' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {['hvac', 'power_genset', 'elevator', 'fire_safety', 'it_network', 'office_facility', 'vehicle', 'plumbing'].map((cat) => {
              const catAssets = branchFilteredAssets.filter((a) => a.category === cat);
              const catCost = catAssets.reduce((sum, a) => sum + a.actualCostTotal, 0);
              const catHealth = Math.round(
                catAssets.reduce((sum, a) => sum + a.healthScore, 0) / (catAssets.length || 1)
              );

              return (
                <div key={cat} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 uppercase text-[11px] truncate">
                    {cat.replace('_', ' ')}
                  </div>
                  <div className="flex items-baseline justify-between mt-2 font-mono">
                    <span className="text-slate-900 font-bold">{catAssets.length} Unit</span>
                    <span className="text-emerald-700 font-semibold">{catHealth}% Sehat</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    Rp {catCost.toLocaleString('id-ID')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upcoming Maintenance Timeline (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-700" />
              <h3 className="font-bold text-slate-900 text-sm">
                Jadwal Pemeliharaan Fasilitas Mendatang (Oktober 2026)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {selectedBranchId === 'all' ? 'Semua Cabang' : selectedBranchObj?.name}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {sortedUpcoming.slice(0, 6).map((asset) => {
              const days = getDaysRemaining(asset.nextMaintenanceDate, '2026-10-14');
              const isOverdue = days < 0;
              const isToday = days === 0;
              const assetBranch = branches.find((b) => b.id === asset.branchId);

              return (
                <div
                  key={asset.id}
                  onClick={() => onSelectAsset(asset)}
                  className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isOverdue
                          ? 'bg-rose-100 text-rose-800'
                          : isToday
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900">{asset.code}</span>
                        {assetBranch && (
                          <span className="text-[10px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                            {assetBranch.code}
                          </span>
                        )}
                        <span className="font-semibold text-slate-800 truncate">{asset.name}</span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5 truncate">
                        Lokasi: {asset.location} · Vendor: {asset.vendor}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-slate-900">
                      {asset.nextMaintenanceDate}
                    </div>
                    <div className="text-[11px] font-medium mt-0.5">
                      {isOverdue ? (
                        <span className="text-rose-600 font-semibold">
                          Lewat {Math.abs(days)} Hari
                        </span>
                      ) : isToday ? (
                        <span className="text-amber-600 font-semibold">Jatuh Tempo Hari Ini</span>
                      ) : (
                        <span className="text-slate-500">Tersisa {days} Hari Lagi</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={() => sortedUpcoming[0] && onSelectAsset(sortedUpcoming[0])}
              className="text-xs font-semibold text-slate-800 hover:text-slate-950"
            >
              Lihat Detail & Mulai Catat Servis →
            </button>
          </div>
        </div>

        {/* Right Column: Active Tickets & E2EE Vault (1/3 width) */}
        <div className="space-y-6">
          {/* Active Tickets Widget */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-sm">Tiket Keluhan Terbuka</h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700">
                {openTickets.length} Tiket
              </span>
            </div>

            <div className="divide-y divide-slate-100 p-2">
              {openTickets.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  Tidak ada keluhan aktif.
                </div>
              ) : (
                openTickets.map((t) => (
                  <div key={t.id} className="p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-slate-800">
                        {t.ticketNumber}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                          t.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : t.priority === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                    <div className="font-medium text-slate-900 line-clamp-1">{t.assetName}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-2">
                      "{t.issueDescription}"
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <button
                onClick={onOpenTicketModal}
                className="text-xs font-semibold text-slate-800 hover:text-slate-950"
              >
                + Buat Laporan Tiket Baru
              </button>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-slate-900 text-white p-5 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div className="font-bold text-sm">Aksi Cepat Fasilitas</div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pindai barcode aset kantor, jadwalkan pemeliharaan, atau kirim pengingat email otomatis ke vendor rekanan.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={onOpenScanner}
                className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors"
              >
                Scan Barcode
              </button>
              <button
                onClick={onOpenEmailNotifications}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                Notifikasi Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
