/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Asset, MaintenanceTicket, UserProfile } from '../types';
import { LifeBuoy, X, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface TicketRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  currentUser: UserProfile;
  onSubmitTicket: (ticket: MaintenanceTicket) => void;
}

export const TicketRequestModal: React.FC<TicketRequestModalProps> = ({
  isOpen,
  onClose,
  assets,
  currentUser,
  onSubmitTicket,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
  const [priority, setPriority] = useState<MaintenanceTicket['priority']>('medium');
  const [description, setDescription] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const chosenAsset = assets.find((a) => a.id === selectedAssetId) || assets[0];

    const newTicket: MaintenanceTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber: `TCK-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      assetId: chosenAsset.id,
      assetName: chosenAsset.name,
      branchId: chosenAsset.branchId || 'branch-rad',
      location: chosenAsset.location,
      reportedBy: currentUser.name,
      reportedEmail: currentUser.email,
      reportedDate: `${new Date().toISOString().slice(0, 10)} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
      priority,
      issueDescription: description.trim(),
      status: 'open',
      assignedTechnician: '',
      resolutionNotes: '',
    };

    onSubmitTicket(newTicket);
    setSubmittedMessage(true);
    setTimeout(() => {
      setSubmittedMessage(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-slate-800" />
            <h3 className="font-semibold text-slate-900 text-base">
              Lapor Kerusakan / Permintaan Servis GA
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedMessage ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <div className="font-semibold text-slate-900 text-base">
              Tiket Keluhan Berhasil Dikirimkan ke Tim GA!
            </div>
            <p className="text-xs text-slate-500">
              Tim fasilitas GA akan segera meninjau dan menugaskan teknisi terkait.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Pilih Fasilitas / Peralatan Kantor yang Bermasalah:
              </label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name} ({a.location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Tingkat Urgensi / Prioritas:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`py-2 px-1 text-center capitalize rounded-lg border font-medium transition-colors ${
                      priority === p
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p === 'urgent' ? 'Darurat' : p === 'high' ? 'Tinggi' : p === 'medium' ? 'Sedang' : 'Rendah'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Jelaskan Masalah / Gejala Kerusakan:
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: AC bocor menetes ke meja kerja atau suhu udara tetap panas meskipun disetel 18°C..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-[11px]">
              Pelapor: <span className="font-semibold text-slate-800">{currentUser.name}</span> ({currentUser.email}) · Departemen: {currentUser.department}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-900"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold"
              >
                <Send className="w-3.5 h-3.5" />
                Kirim Tiket ke Tim GA
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
