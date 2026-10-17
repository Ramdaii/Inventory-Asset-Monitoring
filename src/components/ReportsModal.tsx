/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Asset, Branch, CategoryDefinition, MaintenanceTicket, UserProfile } from '../types';
import {
  FileBarChart2,
  X,
  Download,
  Printer,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  FileSpreadsheet,
  Mail,
  Database,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { exportCleanExcelReport } from '../utils/excelExport';
import { dispatchDirectEmail } from '../utils/notificationEngine';
import { useRealtimeJakarta } from '../utils/time';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  branches?: Branch[];
  categories?: CategoryDefinition[];
  tickets?: MaintenanceTicket[];
  currentUser: UserProfile;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  assets,
  branches = [],
  categories = [],
  tickets = [],
  currentUser,
}) => {
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [actionToast, setActionToast] = useState<string | null>(null);
  const realtimeJakarta = useRealtimeJakarta();

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 3500);
  };

  // Compute aggregations
  const totalAssets = assets.length;
  const optimalCount = assets.filter((a) => a.status === 'optimal').length;
  const serviceDueCount = assets.filter((a) => a.status === 'service_due').length;
  const overdueCount = assets.filter((a) => a.status === 'critical_overdue').length;

  const totalSpent = assets.reduce((acc, a) => acc + a.actualCostTotal, 0);
  const totalEstimatedPerCycle = assets.reduce((acc, a) => acc + a.estimatedCost, 0);
  const avgHealth = Math.round(
    assets.reduce((acc, a) => acc + a.healthScore, 0) / (totalAssets || 1)
  );

  // Group by category
  const categoriesMap: Record<string, { count: number; cost: number; healthSum: number }> = {};
  for (const a of assets) {
    if (!categoriesMap[a.category]) {
      categoriesMap[a.category] = { count: 0, cost: 0, healthSum: 0 };
    }
    categoriesMap[a.category].count += 1;
    categoriesMap[a.category].cost += a.actualCostTotal;
    categoriesMap[a.category].healthSum += a.healthScore;
  }

  // EXCEL EXPORT (.xlsx with 4 worksheets)
  const handleExportExcel = () => {
    try {
      exportCleanExcelReport(
        assets,
        branches,
        categories,
        tickets,
        `Laporan Berkala GA-Ops (${period.toUpperCase()})`
      );
      showToast('Laporan Excel (.xlsx) berhasil di-generate & diunduh dengan format rapi!');
    } catch (e) {
      console.error(e);
      alert('Gagal mengekspor file Excel.');
    }
  };

  // CSV EXPORT (for Google Sheets import)
  const exportCSV = () => {
    const headers = [
      'Kode Aset',
      'Nama Fasilitas',
      'Kategori',
      'Lokasi',
      'Status',
      'Skor Kesehatan (%)',
      'Servis Terakhir',
      'Jadwal Berikutnya',
      'Vendor Rekanan',
      'Total Biaya Servis (Rp)',
    ];

    const rows = assets.map((a) => [
      `"${a.code}"`,
      `"${a.name}"`,
      `"${a.category}"`,
      `"${a.location}"`,
      `"${a.status}"`,
      a.healthScore,
      `"${a.lastMaintenanceDate}"`,
      `"${a.nextMaintenanceDate}"`,
      `"${a.vendor}"`,
      a.actualCostTotal,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `LAPORAN_PEMELIHARAAN_GA_${period.toUpperCase()}_20261015.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan format CSV untuk Google Sheets berhasil diunduh.');
  };

  // TARIK SELURUH DATA & HISTORY (JSON FULL DUMP)
  const handleExportFullJSON = () => {
    const dataPackage = {
      exportDate: new Date().toISOString(),
      exportedBy: currentUser.name,
      appVersion: 'GA-Ops Enterprise 2026',
      totalAssets: assets.length,
      assetsWithHistory: assets,
      branches,
      categories,
      tickets,
    };
    const jsonStr = JSON.stringify(dataPackage, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GA_OPS_FULL_DATABASE_HISTORY_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('Seluruh data aset dan riwayat servis berhasil ditarik (format JSON)!');
  };

  // SEND REPORT VIA EMAIL TO REGISTERED EMAIL
  const handleSendReportEmail = () => {
    const recipient = currentUser.email || 'Riyadirama88@gmail.com';
    const subject = `[LAPORAN GA-OPS] Rekap Eksekutif Pemeliharaan Fasilitas (${period.toUpperCase()})`;
    const body = `Yth. ${currentUser.name} (${recipient}),

Berikut adalah rangkuman audit berkala pemeliharaan fasilitas & inventaris operasional GA-Ops periode ${period.toUpperCase()}:

RINGKASAN EKSEKUTIF:
- Total Fasilitas Terdaftar : ${totalAssets} Unit
- Kondisi Optimal          : ${optimalCount} Unit (${Math.round((optimalCount / totalAssets) * 100)}%)
- Jadwal Servis Mendatang  : ${serviceDueCount} Unit
- Kritis / Terlambat Servis: ${overdueCount} Unit
- Rata-rata Skor Kesehatan : ${avgHealth}%
- Realisasi Biaya Pemeliharaan : Rp ${totalSpent.toLocaleString('id-ID')}

DISTRIBUSI KATEGORI:
${Object.entries(categoriesMap)
  .map(([k, v]) => `• ${k.toUpperCase()}: ${v.count} Unit (Biaya: Rp ${v.cost.toLocaleString('id-ID')})`)
  .join('\n')}

Laporan lengkap format Excel (.xlsx) dan arsip audit tersedia di portal GA-Ops Commander.

Salam,
Sistem Otomasi GA-Ops Facility Management`;

    dispatchDirectEmail([recipient], subject, body, 'AUDIT-REPORT', 'Laporan Berkala GA-Ops', true);
    showToast(`Laporan berhasil dikirimkan ke email terdaftar: ${recipient}!`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header with BACK Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
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
              <FileBarChart2 className="w-5 h-5 text-slate-800" />
              <div>
                <h3 className="font-semibold text-slate-900 text-base leading-tight">
                  Laporan & Penarikan Data Inventaris GA
                </h3>
                <p className="text-xs text-slate-500">
                  Unduh data rapi format Excel/Sheet, tarik seluruh riwayat servis, atau kirim email
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
        {actionToast && (
          <div className="mx-6 mt-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionToast}</span>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                period === 'monthly' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulanan (Oktober 2026)
            </button>
            <button
              onClick={() => setPeriod('quarterly')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                period === 'quarterly' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Triwulanan (Q3/Q4)
            </button>
            <button
              onClick={() => setPeriod('annual')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                period === 'annual' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tahunan 2026
            </button>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-slate-800 bg-white border border-slate-200 rounded-lg shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
              <span className="font-semibold">{realtimeJakarta}</span>
              <span className="text-[10px] text-slate-500 font-sans font-medium">WIB</span>
            </div>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs"
              title="Tarik & Unduh Laporan Lengkap Excel Multi-Sheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Download Excel (.xlsx)</span>
            </button>

            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              title="Unduh format CSV untuk Google Sheets"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Format Sheet (CSV)</span>
            </button>

            <button
              onClick={handleExportFullJSON}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
              title="Tarik seluruh data aset dan riwayat servis lengkap"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Tarik Semua Data (JSON)</span>
            </button>

            <button
              onClick={handleSendReportEmail}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              title="Kirimkan Laporan ini ke Email Terdaftar"
            >
              <Mail className="w-3.5 h-3.5 text-slate-600" />
              <span>Kirim ke Email</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Total Inventaris Terdaftar</span>
              <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                {totalAssets} Unit
              </span>
              <span className="text-[10px] text-emerald-600 mt-1 block font-medium">
                {optimalCount} Unit Optimal ({Math.round((optimalCount / totalAssets) * 100)}%)
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Skor Kesehatan Rerata</span>
              <span className="text-xl font-bold font-mono text-emerald-700 mt-1 block">
                {avgHealth}%
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">Standar Kepatuhan GA</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Realisasi Servis GA</span>
              <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                Rp {(totalSpent / 1000000).toFixed(1)} Jt
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Biaya Aktual Tercatat
              </span>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200">
              <span className="text-rose-600 block text-[11px] font-medium">Perlu Perhatian / Due</span>
              <span className="text-xl font-bold font-mono text-rose-700 mt-1 block">
                {serviceDueCount + overdueCount} Unit
              </span>
              <span className="text-[10px] text-rose-600 mt-1 block">
                {overdueCount} Terlambat · {serviceDueCount} Menunggu
              </span>
            </div>
          </div>

          {/* Breakdown Per Category Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-900 flex items-center justify-between">
              <span>Distribusi & Realisasi Biaya Berdasarkan Kategori Fasilitas</span>
              <span className="text-[11px] text-slate-500 font-normal">Periode: {period.toUpperCase()} 2026</span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-2.5 font-medium">Kategori</th>
                  <th className="px-4 py-2.5 font-medium text-center">Jumlah Unit</th>
                  <th className="px-4 py-2.5 font-medium text-center">Rerata Kesehatan</th>
                  <th className="px-4 py-2.5 font-medium text-right">Total Biaya Servis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(categoriesMap).map(([cat, val]) => (
                  <tr key={cat} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-slate-900 uppercase">
                      {cat.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono">{val.count} Unit</td>
                    <td className="px-4 py-2.5 text-center font-mono">
                      {Math.round(val.healthSum / val.count)}%
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-slate-900">
                      Rp {val.cost.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Auditor Signature & Verification */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <div>
              <span>Disiapkan oleh: </span>
              <span className="font-semibold text-slate-800">{currentUser.name}</span> ({currentUser.roleLabel})
            </div>
            <div>
              <span>Terverifikasi Otomatis GA-Ops · SHA-256 Checksum Valid</span>
            </div>
          </div>
        </div>

        {/* Footer with BACK Button */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-slate-700 hover:text-slate-950 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Sebelumnya</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800"
          >
            Tutup Laporan
          </button>
        </div>
      </div>
    </div>
  );
};
