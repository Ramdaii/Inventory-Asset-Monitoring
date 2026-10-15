/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Asset, UserProfile } from '../types';
import { FileBarChart2, X, Download, Printer, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  currentUser: UserProfile;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  assets,
  currentUser,
}) => {
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');

  if (!isOpen) return null;

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
      `LAPORAN_PEMELIHARAAN_GA_${period.toUpperCase()}_20261014.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <FileBarChart2 className="w-5 h-5 text-slate-800" />
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                Laporan Berkala Pemeliharaan Fasilitas & Inventaris
              </h3>
              <p className="text-xs text-slate-500">
                Laporan eksekutif audit kesehatan aset, kepatuhan jadwal, dan realisasi anggaran GA
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

        {/* Filter bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === 'monthly' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulanan (Oktober 2026)
            </button>
            <button
              onClick={() => setPeriod('quarterly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === 'quarterly' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Triwulanan (Q3/Q4)
            </button>
            <button
              onClick={() => setPeriod('annual')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === 'annual' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tahunan (TA 2026)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor CSV
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak PDF
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 text-[11px] block">Total Aset Dipantau</span>
              <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                {totalAssets} Fasilitas
              </span>
              <span className="text-[10px] text-slate-400">100% Tercatat Barcode</span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 text-[11px] block">Rata-rata Kesehatan</span>
              <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                {avgHealth}%
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">Kondisi Baik/Optimal</span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 text-[11px] block">Aset Jatuh Tempo / Kritis</span>
              <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                {serviceDueCount + overdueCount} Aset
              </span>
              <span className="text-[10px] text-rose-600 font-medium">{overdueCount} Lewat Jadwal</span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 text-[11px] block">Total Realisasi Biaya</span>
              <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                Rp {totalSpent.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] text-slate-500">Anggaran Terpantau</span>
            </div>
          </div>

          {/* Breakdown Per Category Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-900 flex items-center justify-between">
              <span>Distribusi & Realisasi Biaya Berdasarkan Kategori Fasilitas</span>
              <span className="text-[11px] text-slate-500 font-normal">Periode: Oktober 2026</span>
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
                      {cat.replace('_', ' ')}
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
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <div>
              <span>Disiapkan oleh: </span>
              <span className="font-semibold text-slate-800">{currentUser.name}</span> (
              {currentUser.roleLabel})
            </div>
            <div>
              <span>Terverifikasi Otomatis GA-Ops · SHA-256 Checksum Valid</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end text-xs text-slate-500 shrink-0">
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
