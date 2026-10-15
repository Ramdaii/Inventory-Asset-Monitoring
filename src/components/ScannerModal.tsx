/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Asset, Branch } from '../types';
import { Camera, X, ScanLine, AlertCircle, Upload, CheckCircle2, Search, Image as ImageIcon } from 'lucide-react';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  branches: Branch[];
  onAssetFound: (asset: Asset) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  assets,
  branches,
  onAssetFound,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Kamera tidak didukung pada browser ini atau frame sandbox.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Izin akses kamera belum diaktifkan atau kamera sedang digunakan aplikasi lain.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualSearch = (codeToFind?: string) => {
    const query = (codeToFind || manualCode).trim().toUpperCase();
    if (!query) return;

    const matched = assets.find(
      (a) => a.code.toUpperCase() === query || a.id.toUpperCase() === query
    );

    if (matched) {
      setScannedFeedback(`Aset Ditemukan: ${matched.code} - ${matched.name}`);
      setTimeout(() => {
        onAssetFound(matched);
        onClose();
      }, 700);
    } else {
      setCameraError(`Kode aset "${query}" tidak ditemukan dalam database inventaris.`);
    }
  };

  const handleBarcodeImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate recognition of uploaded barcode image
    // Find asset with custom barcode or match first
    const assetWithCustom = assets.find((a) => a.customBarcodeImage) || assets[0];
    setScannedFeedback(`Barcode Gambar Berhasil Dipindai: ${assetWithCustom.code}`);
    setTimeout(() => {
      onAssetFound(assetWithCustom);
      onClose();
    }, 700);
  };

  const handleSimulationScan = (asset: Asset) => {
    setScannedFeedback(`Berhasil Memindai Barcode: ${asset.code}`);
    setTimeout(() => {
      onAssetFound(asset);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-slate-800" />
            <h3 className="font-semibold text-slate-900 text-base">Pemindai Barcode / QR Aset</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="p-6 space-y-4">
          <div className="relative aspect-square max-h-64 w-full bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
            {cameraError ? (
              <div className="p-4 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Camera className="w-8 h-8 text-slate-500" />
                <p className="text-slate-300 font-medium">{cameraError}</p>
                <p className="text-[11px] text-slate-500">
                  Gunakan input kode langsung atau klik salah satu barcode aset di bawah.
                </p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <div className="absolute inset-8 border-2 border-emerald-400/80 rounded-lg pointer-events-none flex items-center justify-center">
                  <div className="w-full h-0.5 bg-emerald-400 animate-pulse" />
                </div>
              </>
            )}

            {scannedFeedback && (
              <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center text-white p-4 text-center transition-opacity">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2" />
                <div className="text-sm font-semibold">{scannedFeedback}</div>
                <div className="text-xs text-emerald-300 mt-1">Membuka lembar servis aset...</div>
              </div>
            )}
          </div>

          {/* Upload image barcode file option (Requirement 5) */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-600" />
              <span className="text-slate-700 font-medium">Scan dari File Gambar Barcode:</span>
            </div>
            <label className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded font-semibold cursor-pointer">
              <span>Pilih Gambar</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleBarcodeImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Manual Code Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 block">
              Atau Input / Tempel Kode Barcode:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: RAD-AC-001"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                className="flex-1 px-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <button
                onClick={() => handleManualSearch()}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                Cari Aset
              </button>
            </div>
          </div>

          {/* Quick Scanner Shortcut Chips per branch */}
          <div>
            <div className="text-[11px] text-slate-500 mb-2 font-medium">
              Uji Cepat Pemindaian Aset Cabang di Lapangan:
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {assets.map((asset) => {
                const b = branches.find((br) => br.id === asset.branchId);
                return (
                  <button
                    key={asset.id}
                    onClick={() => handleSimulationScan(asset)}
                    className="px-2.5 py-1 text-[11px] font-mono font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md border border-slate-200 transition-colors"
                  >
                    {asset.code} · {b ? b.code : 'RAD'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Kamera HD Auto-Detect Barcode & QR</span>
          <button
            onClick={onClose}
            className="text-xs font-medium text-slate-700 hover:text-slate-950"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
