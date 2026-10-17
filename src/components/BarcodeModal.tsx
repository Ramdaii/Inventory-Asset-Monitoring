/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Asset, Branch } from '../types';
import { Printer, Download, X, QrCode, ShieldCheck, Tag, Upload, Image as ImageIcon, Trash2, ArrowLeft } from 'lucide-react';

interface BarcodeModalProps {
  asset: Asset | null;
  branch?: Branch;
  onClose: () => void;
  onUpdateAsset?: (updated: Asset) => void;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({
  asset,
  branch,
  onClose,
  onUpdateAsset,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [uploadToast, setUploadToast] = useState<string | null>(null);

  useEffect(() => {
    if (!asset) return;

    const qrPayload = JSON.stringify({
      code: asset.code,
      id: asset.id,
      name: asset.name,
      branch: branch?.name || 'Cabang RAD',
      location: asset.location,
      cat: asset.category,
      nextDue: asset.nextMaintenanceDate,
      sys: 'GA-OPS-E2EE-2026',
    });

    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrPayload, {
        width: 170,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
    }

    QRCode.toDataURL(qrPayload, { width: 400, margin: 2 }).then(setQrUrl).catch(console.error);
  }, [asset, branch]);

  if (!asset) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const downloadUrl = asset.customBarcodeImage || qrUrl;
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `BARCODE_${asset.code}.png`;
    a.click();
  };

  // Handle uploading custom barcode image directly
  const handleCustomBarcodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      if (dataUri && onUpdateAsset) {
        const updated: Asset = {
          ...asset,
          customBarcodeImage: dataUri,
        };
        onUpdateAsset(updated);
        setUploadToast('Gambar barcode kustom Anda berhasil diunggah!');
        setTimeout(() => setUploadToast(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomBarcode = () => {
    if (onUpdateAsset) {
      const updated: Asset = {
        ...asset,
        customBarcodeImage: undefined,
      };
      onUpdateAsset(updated);
      setUploadToast('Barcode kustom dihapus, beralih ke barcode sistem bawaan.');
      setTimeout(() => setUploadToast(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Top Header with Back button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
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
              <Tag className="w-5 h-5 text-slate-700" />
              <div>
                <h3 className="font-semibold text-slate-900 text-base leading-tight">Label Barcode & QR Tag Aset</h3>
                <p className="text-[11px] text-slate-500">
                  {asset.customBarcodeImage ? 'Menggunakan Barcode Kustom Anda' : 'Barcode Standar Terverifikasi'}
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

        {/* Upload feedback */}
        {uploadToast && (
          <div className="mx-6 mt-3 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs">
            {uploadToast}
          </div>
        )}

        {/* Printable Label Area */}
        <div className="p-6">
          <div
            id="printable-asset-tag"
            className="border-2 border-dashed border-slate-300 rounded-xl p-5 bg-white shadow-xs text-slate-900"
          >
            {/* Tag Header */}
            <div className="flex items-center justify-between border-b border-slate-300 pb-3 mb-4">
              <div>
                <div className="text-xs uppercase tracking-wider font-bold text-slate-700">
                  {branch ? branch.name : 'CABANG RAD'}
                </div>
                <div className="text-sm font-extrabold text-slate-950">GENERAL AFFAIRS DIVISION</div>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>TERVERIFIKASI E2EE</span>
              </div>
            </div>

            {/* Tag Body: Barcode image (Custom or Generated QR) */}
            <div className="flex items-center gap-5">
              <div className="shrink-0 bg-white p-1 border border-slate-200 rounded-lg shadow-2xs flex flex-col items-center">
                {asset.customBarcodeImage ? (
                  <div className="w-[140px] h-[140px] flex items-center justify-center overflow-hidden bg-white p-1">
                    <img
                      src={asset.customBarcodeImage}
                      alt="Custom Barcode Upload"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <canvas ref={canvasRef} className="w-[140px] h-[140px]" />
                )}
                <span className="text-[10px] text-slate-500 font-mono mt-1">
                  {asset.customBarcodeImage ? 'BARCODE KUSTOM' : 'SCAN UNTUK SERVIS'}
                </span>
              </div>

              <div className="flex-1 space-y-1.5 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Kode Aset (Barcode)</div>
                  <div className="font-mono text-base font-bold text-slate-900 tracking-wider">
                    {asset.code}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Nama Fasilitas</div>
                  <div className="font-semibold text-slate-800 line-clamp-1">{asset.name}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Lokasi / Cabang</div>
                  <div className="text-slate-700 text-[11px] line-clamp-1">
                    {branch ? `${branch.code} - ${asset.location}` : asset.location}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[9px]">Siklus Servis</span>
                    <span className="font-medium capitalize">{asset.frequency}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">Jadwal Berikutnya</span>
                    <span className="font-mono font-medium">{asset.nextMaintenanceDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 1D Barcode Strip */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col items-center">
              <div className="flex items-end justify-center h-7 gap-[2px] w-full max-w-[260px] opacity-85">
                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 4, 1, 2, 3].map(
                  (width, i) => (
                    <div
                      key={i}
                      className="bg-slate-900"
                      style={{
                        width: `${width * 1.5}px`,
                        height: i % 5 === 0 ? '100%' : '85%',
                      }}
                    />
                  )
                )}
              </div>
              <div className="font-mono text-[10px] text-slate-600 tracking-widest mt-1">
                *{asset.code}*
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-[9px] text-center text-slate-400 mt-2 border-t border-slate-100 pt-1">
              Hak Milik Perusahaan · Hubungi Tim GA jika terjadi kerusakan atau pemindahan aset.
            </div>
          </div>

          {/* User Barcode Upload Action */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg cursor-pointer transition-colors font-medium">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Barcode Sendiri</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCustomBarcodeUpload}
                className="hidden"
              />
            </label>

            {asset.customBarcodeImage && (
              <button
                type="button"
                onClick={handleRemoveCustomBarcode}
                className="flex items-center gap-1 text-rose-600 hover:text-rose-800"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Barcode Kustom</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Sebelumnya</span>
          </button>
          <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh Barcode (PNG)
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Label Tag Fisik
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};
