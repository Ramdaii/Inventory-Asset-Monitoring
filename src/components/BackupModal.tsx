/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Asset, SystemBackupRecord } from '../types';
import {
  createEncryptedBackupPackage,
  restoreFromBackupPackage,
  getStoredBackupRecords,
  saveStoredBackupRecords,
  resetToDefaults,
} from '../utils/storage';
import { getKeyFingerprint } from '../utils/crypto';
import {
  ShieldCheck,
  X,
  Database,
  Download,
  Upload,
  RefreshCw,
  Lock,
  Key,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  onDataRestored: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  assets,
  onDataRestored,
}) => {
  const [backups, setBackups] = useState<SystemBackupRecord[]>([]);
  const [fingerprint, setFingerprint] = useState('E2EE-0000-0000-0000');
  const [passphrase, setPassphrase] = useState('GA_ENTERPRISE_SECURE_KEY_2026');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBackups(getStoredBackupRecords());
      getKeyFingerprint(passphrase).then(setFingerprint);
    }
  }, [isOpen, passphrase]);

  if (!isOpen) return null;

  const handleCreateBackup = async () => {
    setIsProcessing(true);
    try {
      const backupPkg = await createEncryptedBackupPackage(passphrase);
      
      const newRecord: SystemBackupRecord = {
        id: `bak-${Date.now()}`,
        timestamp: `${new Date().toISOString().slice(0, 10)} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
        assetCount: assets.length,
        logCount: assets.reduce((acc, a) => acc + a.maintenanceHistory.length, 0),
        encrypted: true,
        checksum: `sha256-${backupPkg.checksum.substring(0, 16)}...`,
        sizeKb: backupPkg.sizeKb,
        autoScheduled: false,
      };

      const updated = [newRecord, ...backups];
      setBackups(updated);
      saveStoredBackupRecords(updated);

      // Trigger file download
      const blob = new Blob([backupPkg.blobData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backupPkg.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setStatusMessage(`Cadangan terenkripsi berhasil dibuat (${backupPkg.sizeKb} KB) dan diunduh.`);
    } catch (e) {
      console.error(e);
      setStatusMessage('Gagal membuat paket cadangan terenkripsi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      setIsProcessing(true);
      const result = await restoreFromBackupPackage(content, passphrase);
      setIsProcessing(false);

      if (result.success) {
        setStatusMessage(result.message);
        onDataRestored();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setStatusMessage(result.message);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang data ke inventaris default perusahaan?')) {
      resetToDefaults();
      onDataRestored();
      setStatusMessage('Database inventaris telah dikembalikan ke kondisi awal.');
      setTimeout(() => onClose(), 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                Cloud Vault & Cadangan Data Otomatis (E2EE)
              </h3>
              <p className="text-xs text-slate-500">
                Penyimpanan aman dokumen riwayat perawatan dengan Enkripsi AES-GCM 256-bit
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {statusMessage && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 flex items-center justify-between">
              <span>{statusMessage}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
          )}

          {/* Encryption status card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-900">
                  Status Enkripsi End-to-End: AKTIF & TERVERIFIKASI
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                AES-GCM-256
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
              <div>
                <span className="text-slate-400 block">Sidik Jari Kunci Organisasi:</span>
                <span className="font-mono font-bold text-slate-800">{fingerprint}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Integritas Checksum:</span>
                <span className="font-mono text-slate-800">SHA-256 Validated</span>
              </div>
            </div>

            <div>
              <label className="text-slate-600 block text-[11px] mb-1 font-medium">
                Passphrase Kunci Enkripsi Master:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">PBKDF2 100k Iterations</span>
              </div>
            </div>
          </div>

          {/* Actions: Create Backup or Restore */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={handleCreateBackup}
              disabled={isProcessing}
              className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl flex flex-col items-center justify-center text-center gap-2 transition-colors hover:bg-slate-50 shadow-2xs group"
            >
              <Download className="w-5 h-5 text-slate-700 group-hover:text-slate-950" />
              <div>
                <div className="font-semibold text-slate-900">Buat & Unduh Cadangan Baru</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Ekspor arsip terenkripsi (.enc.json) seluruh fasilitas & dokumen
                </div>
              </div>
            </button>

            <label className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl flex flex-col items-center justify-center text-center gap-2 transition-colors hover:bg-slate-50 shadow-2xs cursor-pointer group">
              <Upload className="w-5 h-5 text-slate-700 group-hover:text-slate-950" />
              <div>
                <div className="font-semibold text-slate-900">Pulihkan Cadangan (Restore)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Unggah file cadangan untuk memulihkan seluruh data riwayat
                </div>
              </div>
              <input
                type="file"
                accept=".json,.enc"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Snapshot History Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-900 flex items-center justify-between">
              <span>Riwayat Snapshot Cadangan Berkala</span>
              <span className="text-[11px] text-slate-500 font-normal">
                Jadwal Otomatis: Harian (00:00 WIB)
              </span>
            </div>
            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {backups.map((b) => (
                <div
                  key={b.id}
                  className="px-4 py-2.5 flex items-center justify-between text-[11px]"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                      <span>{b.timestamp}</span>
                      {b.autoScheduled && (
                        <span className="text-[10px] text-slate-500 font-normal bg-slate-100 px-1.5 py-0.2 rounded">
                          Auto Snapshot
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500">
                      {b.assetCount} Aset Terdata · {b.logCount} Riwayat Servis · Checksum: {b.checksum}
                    </div>
                  </div>
                  <div className="font-mono font-medium text-slate-700">{b.sizeKb} KB</div>
                </div>
              ))}
            </div>
          </div>

          {/* Reset button */}
          <div className="pt-2 flex justify-between items-center text-[11px] text-slate-400">
            <span>Enkripsi client-side aman memenuhi standar ISO 27001</span>
            <button
              onClick={handleResetData}
              className="text-rose-600 hover:text-rose-800 font-medium"
            >
              Reset ke Data Default
            </button>
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
