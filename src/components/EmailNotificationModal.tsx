/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Asset, EmailNotificationLog, EmailNotificationSettings } from '../types';
import {
  checkAndDispatchNotifications,
  createMailtoLink,
  getDaysRemaining,
} from '../utils/notificationEngine';
import { saveStoredEmailLogs, saveStoredEmailSettings } from '../utils/storage';
import {
  Mail,
  X,
  BellRing,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Settings2,
  ListFilter,
  FileText,
  ArrowLeft,
} from 'lucide-react';

interface EmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  settings: EmailNotificationSettings;
  logs: EmailNotificationLog[];
  onUpdateSettings: (newSettings: EmailNotificationSettings) => void;
  onUpdateLogs: (newLogs: EmailNotificationLog[]) => void;
  onOpenGmail?: () => void;
}

export const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({
  isOpen,
  onClose,
  assets,
  settings,
  logs,
  onUpdateSettings,
  onUpdateLogs,
  onOpenGmail,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'logs' | 'settings'>('status');
  const [primaryEmail, setPrimaryEmail] = useState(settings.primaryEmail);
  const [additionalEmailsInput, setAdditionalEmailsInput] = useState(
    settings.additionalEmails.join(', ')
  );
  const [alert7Days, setAlert7Days] = useState(settings.alert7Days);
  const [alert3Days, setAlert3Days] = useState(settings.alert3Days);
  const [alertDueDay, setAlertDueDay] = useState(settings.alertDueDay);
  const [alertOverdue, setAlertOverdue] = useState(settings.alertOverdue);
  const [selectedLogPreview, setSelectedLogPreview] = useState<EmailNotificationLog | null>(null);
  const [dispatchToast, setDispatchToast] = useState<string | null>(null);

  if (!isOpen) return null;

  // Compute eligible assets
  const pendingNotificationAssets = assets
    .map((asset) => ({
      asset,
      days: getDaysRemaining(asset.nextMaintenanceDate, '2026-10-14'),
    }))
    .filter(({ days }) => days <= 7);

  const handleSaveSettings = () => {
    const additional = additionalEmailsInput
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 3);

    const newSettings: EmailNotificationSettings = {
      ...settings,
      primaryEmail,
      additionalEmails: additional,
      alert7Days,
      alert3Days,
      alertDueDay,
      alertOverdue,
      lastCheckedTime: new Date().toISOString(),
    };

    saveStoredEmailSettings(newSettings);
    onUpdateSettings(newSettings);
    setDispatchToast('Pengaturan notifikasi email berhasil disimpan.');
    setTimeout(() => setDispatchToast(null), 3000);
  };

  const handleRunManualDispatch = () => {
    const result = checkAndDispatchNotifications(assets, settings, '2026-10-14');
    if (result.dispatchedCount > 0) {
      const updatedLogs = [...result.newLogs, ...logs];
      onUpdateLogs(updatedLogs);
      setDispatchToast(`Berhasil mengirimkan ${result.dispatchedCount} notifikasi email otomatis!`);
    } else {
      setDispatchToast('Semua notifikasi untuk jadwal hari ini sudah terkirim sebelumnya.');
    }
    setTimeout(() => setDispatchToast(null), 4000);
  };

  const handleOpenClient = (log: EmailNotificationLog) => {
    const mailto = createMailtoLink(log.recipient, log.subject, log.previewBody);
    window.open(mailto, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        {/* Header with Back button */}
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
              <Mail className="w-5 h-5 text-slate-800" />
              <div>
                <h3 className="font-semibold text-slate-900 text-base leading-tight">
                  Pusat Notifikasi Email Otomatis GA
                </h3>
                <p className="text-xs text-slate-500">
                  Pengingat jadwal perawatan fasilitas kantor & eskalasi keterlambatan
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
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 bg-white shrink-0">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'status'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Jadwal Siap Notifikasi ({pendingNotificationAssets.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'logs'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Riwayat Email Terkirim ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Konfigurasi & Penerima
          </button>
        </div>

        {/* Toast feedback */}
        {dispatchToast && (
          <div className="mx-6 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between">
            <span>{dispatchToast}</span>
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Gmail API Integration Banner */}
              {onOpenGmail && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Integrasi Gmail (Google Workspace)
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        Kirim email langsung dari akun Gmail resmi Anda, lihat kotak masuk, dan buat SPK.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenGmail();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Buka Gmail Hub</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Penerima Utama Otomatis
                  </div>
                  <div className="text-xs font-mono text-slate-600 mt-0.5">
                    {settings.primaryEmail}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Aturan: H-7 hari, H-3 hari, Hari H, dan Notifikasi Terlambat (Overdue).
                  </div>
                </div>
                <button
                  onClick={handleRunManualDispatch}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" />
                  Kirim Notifikasi Sekarang
                </button>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-900 mb-2">
                  Daftar Fasilitas Masuk Periode Pengingat Servis:
                </h4>
                <div className="space-y-2">
                  {pendingNotificationAssets.map(({ asset, days }) => {
                    const isOverdue = days < 0;
                    const isToday = days === 0;

                    return (
                      <div
                        key={asset.id}
                        className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
                          isOverdue
                            ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                            : isToday
                            ? 'bg-amber-50/50 border-amber-200 text-amber-950'
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{asset.code}</span>
                            <span>·</span>
                            <span className="font-semibold">{asset.name}</span>
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            Lokasi: {asset.location} · Vendor: {asset.vendor}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-medium">
                            {isOverdue ? (
                              <span className="text-rose-600 font-semibold">
                                Terlambat {Math.abs(days)} Hari
                              </span>
                            ) : isToday ? (
                              <span className="text-amber-600 font-semibold">Jatuh Tempo Hari Ini</span>
                            ) : (
                              <span className="text-slate-700">Tersisa {days} Hari</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Due: {asset.nextMaintenanceDate}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Belum ada log pengiriman email. Klik "Kirim Notifikasi Sekarang" untuk memicu pengiriman pertama.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{log.subject}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          Kepada: <span className="font-mono text-slate-700">{log.recipient}</span> ·{' '}
                          {log.timestamp}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setSelectedLogPreview(log)}
                          className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-700 transition-colors"
                        >
                          Lihat Pesan
                        </button>
                        <button
                          onClick={() => handleOpenClient(log)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors"
                          title="Buka pada aplikasi email Anda"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Mailto
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Email Utama PIC General Affairs:
                </label>
                <input
                  type="email"
                  value={primaryEmail}
                  onChange={(e) => setPrimaryEmail(e.target.value)}
                  placeholder="Riyadirama88@gmail.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Email ini akan menerima alert jadwal servis, eskalasi keterlambatan, dan laporan audit mingguan.
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Email Tambahan (Pisahkan dengan koma):
                </label>
                <input
                  type="text"
                  value={additionalEmailsInput}
                  onChange={(e) => setAdditionalEmailsInput(e.target.value)}
                  placeholder="ga.staff@kantor.id, vendor.service@mitra.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-2.5">
                <div className="font-semibold text-slate-800">Kriteria Pemicu Notifikasi Otomatis:</div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alert7Days}
                    onChange={(e) => setAlert7Days(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span>Kirim pengingat H-7 sebelum jadwal servis</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alert3Days}
                    onChange={(e) => setAlert3Days(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span>Kirim peringatan segera H-3 sebelum servis</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertDueDay}
                    onChange={(e) => setAlertDueDay(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span>Kirim notifikasi pada hari H servis (Due Today)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertOverdue}
                    onChange={(e) => setAlertOverdue(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span>Eskalasi harian jika servis terlewat / overdue</span>
                </label>
              </div>

              <div className="pt-3">
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs"
                >
                  Simpan Konfigurasi Notifikasi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal preview of single email */}
        {selectedLogPreview && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col border border-slate-200">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="font-semibold text-slate-900 text-xs">
                  Pratinjau Pesan Email Otomatis
                </div>
                <button
                  onClick={() => setSelectedLogPreview(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Subjek: </span>
                  <span className="font-semibold text-slate-900">{selectedLogPreview.subject}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Penerima: </span>
                  <span className="font-mono text-slate-800">{selectedLogPreview.recipient}</span>
                </div>
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-800">
                  {selectedLogPreview.previewBody}
                </div>
              </div>
              <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                <button
                  onClick={() => handleOpenClient(selectedLogPreview)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka di Email App
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-200/50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Sebelumnya</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
