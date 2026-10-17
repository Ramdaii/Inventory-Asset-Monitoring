/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { Asset, Branch, CategoryDefinition, MaintenanceTicket } from '../types';
import { formatJakartaFullDateTime, getJakartaDateString } from './dateTime';

export function exportCleanExcelReport(
  assets: Asset[],
  branches: Branch[],
  categories: CategoryDefinition[],
  tickets: MaintenanceTicket[],
  reportTitle: string = 'Laporan Audit & Inventaris GA-Ops'
): void {
  // Helper maps
  const branchMap = new Map(branches.map((b) => [b.id, b]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const wb = XLSX.utils.book_new();

  // ----------------------------------------------------
  // SHEET 1: DATA INVENTARIS ASET
  // ----------------------------------------------------
  const assetRows = assets.map((a, idx) => {
    const br = branchMap.get(a.branchId);
    return {
      'No': idx + 1,
      'Kode Aset': a.code,
      'Nama Fasilitas & Aset': a.name,
      'Kantor Cabang': br ? `${br.name} (${br.code})` : a.branchId,
      'Kota Cabang': br ? br.city : '-',
      'Kategori': categoryMap.get(a.category) || a.category,
      'Lokasi Gedung / Ruangan': a.location,
      'Merk & Model': a.brandModel || '-',
      'Nomor Seri / SN': a.serialNumber || '-',
      'Tanggal Pengadaan': a.purchaseDate,
      'Masa Garansi Hingga': a.warrantyExpiry,
      'Skor Kesehatan (%)': a.healthScore,
      'Status Operasional':
        a.status === 'optimal'
          ? 'Optimal (Siap Pakai)'
          : a.status === 'service_due'
          ? 'Jadwal Servis Tiba'
          : a.status === 'critical_overdue'
          ? 'Kritis / Terlambat Servis'
          : a.status === 'maintenance_in_progress'
          ? 'Sedang Dalam Perbaikan'
          : 'Diberhentikan (Decommissioned)',
      'Servis Terakhir': a.lastMaintenanceDate,
      'Jadwal Servis Berikutnya': a.nextMaintenanceDate,
      'Frekuensi Perawatan': a.frequency,
      'Vendor Rekanan': a.vendor,
      'Kontak Vendor': a.vendorContact,
      'Staff Penanggung Jawab': a.assignedStaff,
      'Estimasi Biaya Per Siklus (Rp)': a.estimatedCost,
      'Total Realisasi Biaya Servis (Rp)': a.actualCostTotal,
      'Jumlah Riwayat Servis': a.maintenanceHistory?.length || 0,
      'Jumlah Dokumen Vault': a.documents?.length || 0,
      'Catatan Khusus': a.notes || '-',
    };
  });

  const wsAssets = XLSX.utils.json_to_sheet(assetRows);

  // Set column widths for readable viewing
  wsAssets['!cols'] = [
    { wch: 6 },  // No
    { wch: 16 }, // Kode
    { wch: 32 }, // Nama
    { wch: 28 }, // Cabang
    { wch: 16 }, // Kota
    { wch: 25 }, // Kategori
    { wch: 24 }, // Lokasi
    { wch: 20 }, // Merk
    { wch: 18 }, // SN
    { wch: 16 }, // Tgl Pengadaan
    { wch: 18 }, // Garansi
    { wch: 16 }, // Kesehatan
    { wch: 24 }, // Status
    { wch: 16 }, // Servis Terakhir
    { wch: 20 }, // Jadwal Berikutnya
    { wch: 18 }, // Frekuensi
    { wch: 24 }, // Vendor
    { wch: 18 }, // Kontak Vendor
    { wch: 22 }, // Staff
    { wch: 25 }, // Estimasi Biaya
    { wch: 28 }, // Realisasi Biaya
    { wch: 18 }, // Riwayat
    { wch: 18 }, // Dokumen
    { wch: 30 }, // Catatan
  ];

  XLSX.utils.book_append_sheet(wb, wsAssets, 'Data Inventaris Aset');

  // ----------------------------------------------------
  // SHEET 2: RIWAYAT SERVIS & PEMELIHARAAN (HISTORY)
  // ----------------------------------------------------
  const historyRows: any[] = [];
  let logCounter = 1;

  assets.forEach((a) => {
    const br = branchMap.get(a.branchId);
    if (a.maintenanceHistory && a.maintenanceHistory.length > 0) {
      a.maintenanceHistory.forEach((log) => {
        historyRows.push({
          'No': logCounter++,
          'ID Log Servis': log.id,
          'Kode Aset': a.code,
          'Nama Fasilitas': a.name,
          'Kantor Cabang': br ? br.name : a.branchId,
          'Tanggal Pengerjaan': log.date,
          'Tipe Tindakan Servis':
            log.type === 'routine_preventive'
              ? 'Perawatan Rutin Preventif'
              : log.type === 'corrective_repair'
              ? 'Perbaikan Kerusakan (Korektif)'
              : log.type === 'emergency_call'
              ? 'Panggilan Darurat / Emergency'
              : 'Kalibrasi & Uji Standar',
          'Teknisi Pelaksana': log.technicianName,
          'Vendor Pelaksana': log.vendorCompany,
          'Biaya Perawatan (Rp)': log.cost,
          'Kondisi Sebelum': log.conditionBefore || '-',
          'Kondisi Sesudah': log.conditionAfter || '-',
          'Suku Cadang Diganti': log.partsReplaced?.join(', ') || '-',
          'Diverifikasi Oleh': log.verifiedBy || '-',
          'Status Hasil': log.status === 'completed' ? 'Selesai & Lulus Uji' : log.status,
          'Deskripsi Pengerjaan': log.description,
        });
      });
    }
  });

  const wsHistory = XLSX.utils.json_to_sheet(historyRows.length > 0 ? historyRows : [{ Info: 'Belum ada catatan riwayat pemeliharaan' }]);
  wsHistory['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 16 },
    { wch: 28 },
    { wch: 24 },
    { wch: 16 },
    { wch: 28 },
    { wch: 20 },
    { wch: 24 },
    { wch: 20 },
    { wch: 24 },
    { wch: 24 },
    { wch: 28 },
    { wch: 20 },
    { wch: 20 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsHistory, 'Riwayat Servis & Log');

  // ----------------------------------------------------
  // SHEET 3: REKAP PER CABANG & DISTRIBUSI ANGGARAN
  // ----------------------------------------------------
  const branchSummaryRows = branches.map((b, idx) => {
    const bAssets = assets.filter((a) => a.branchId === b.id);
    const totalCost = bAssets.reduce((sum, a) => sum + a.actualCostTotal, 0);
    const avgHealth = Math.round(
      bAssets.reduce((sum, a) => sum + a.healthScore, 0) / (bAssets.length || 1)
    );
    const serviceDueCount = bAssets.filter((a) => a.status === 'service_due' || a.status === 'critical_overdue').length;

    return {
      'No': idx + 1,
      'Kode Cabang': b.code,
      'Nama Kantor Cabang': b.name,
      'Kota': b.city,
      'Alamat Gedung Cabang': b.address,
      'Penanggung Jawab (PIC)': b.picName,
      'No. Telepon PIC': b.picPhone,
      'Jumlah Aset Terdaftar': bAssets.length,
      'Aset Perlu Servis Segera': serviceDueCount,
      'Rata-rata Kesehatan Fasilitas (%)': avgHealth,
      'Total Realisasi Pengeluaran (Rp)': totalCost,
    };
  });

  const wsBranches = XLSX.utils.json_to_sheet(branchSummaryRows);
  wsBranches['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 32 },
    { wch: 18 },
    { wch: 42 },
    { wch: 22 },
    { wch: 18 },
    { wch: 20 },
    { wch: 24 },
    { wch: 30 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsBranches, 'Rekap Cabang & Biaya');

  // ----------------------------------------------------
  // SHEET 4: TIKET GANGGUAN FASILITAS
  // ----------------------------------------------------
  const ticketRows = tickets.map((t, idx) => {
    const br = branchMap.get(t.branchId);
    return {
      'No': idx + 1,
      'Nomor Tiket': t.ticketNumber,
      'Kode Aset': t.assetId,
      'Nama Fasilitas': t.assetName,
      'Cabang': br ? br.name : t.branchId,
      'Lokasi': t.location,
      'Nama Pelapor': t.reportedBy,
      'Email Pelapor': t.reportedEmail,
      'Tanggal Pelaporan': t.reportedDate,
      'Prioritas': t.priority.toUpperCase(),
      'Status Tiket':
        t.status === 'open'
          ? 'Menunggu Review'
          : t.status === 'in_review'
          ? 'Dalam Analisis GA'
          : t.status === 'assigned'
          ? 'Teknisi Ditugaskan'
          : t.status === 'resolved'
          ? 'Telah Diperbaiki'
          : 'Ditutup (Closed)',
      'Teknisi Ditugaskan': t.assignedTechnician || '-',
      'Keterangan Gangguan': t.issueDescription,
      'Catatan Penyelesaian': t.resolutionNotes || '-',
    };
  });

  const wsTickets = XLSX.utils.json_to_sheet(ticketRows.length > 0 ? ticketRows : [{ Info: 'Tidak ada tiket gangguan' }]);
  wsTickets['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 16 },
    { wch: 28 },
    { wch: 24 },
    { wch: 20 },
    { wch: 20 },
    { wch: 24 },
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
    { wch: 22 },
    { wch: 35 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTickets, 'Tiket Gangguan GA');

  // Metadata Sheet with Asia/Jakarta timezone confirmation
  const wsMeta = XLSX.utils.json_to_sheet([
    { 'Parameter Sistem': 'Judul Laporan', 'Nilai': reportTitle },
    { 'Parameter Sistem': 'Zona Waktu Acuan', 'Nilai': 'Asia/Jakarta (WIB - UTC+7)' },
    { 'Parameter Sistem': 'Waktu Ekspor Dokumen', 'Nilai': formatJakartaFullDateTime() },
    { 'Parameter Sistem': 'Total Unit Fasilitas', 'Nilai': assets.length },
    { 'Parameter Sistem': 'Total Kantor Cabang', 'Nilai': branches.length },
    { 'Parameter Sistem': 'Total Tiket Gangguan', 'Nilai': tickets.length },
    { 'Parameter Sistem': 'Sistem Operasional', 'Nilai': 'GA-Ops Commander Enterprise Facilities Management' },
  ]);
  wsMeta['!cols'] = [{ wch: 25 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Info Audit & Waktu');

  // Generate binary and trigger download
  const dateStr = getJakartaDateString().replace(/-/g, '');
  const fileName = `LAPORAN_GA_OPS_${dateStr}_WIB.xlsx`;
  XLSX.writeFile(wb, fileName);
}
