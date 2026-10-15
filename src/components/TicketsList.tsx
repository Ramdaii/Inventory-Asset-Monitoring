/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Asset, MaintenanceTicket, UserProfile } from '../types';
import { Wrench, CheckCircle, Clock, AlertTriangle, Plus, Search } from 'lucide-react';

interface TicketsListProps {
  tickets: MaintenanceTicket[];
  assets: Asset[];
  currentUser: UserProfile;
  onOpenCreateTicket: () => void;
  onUpdateTicket: (updated: MaintenanceTicket) => void;
}

export const TicketsList: React.FC<TicketsListProps> = ({
  tickets,
  assets,
  currentUser,
  onOpenCreateTicket,
  onUpdateTicket,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [assigneeInput, setAssigneeInput] = useState('');
  const [resolutionInput, setResolutionInput] = useState('');

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  const canManageTickets = currentUser.roleId !== 'employee_viewer';

  const handleSaveResolution = (ticket: MaintenanceTicket, newStatus: MaintenanceTicket['status']) => {
    const updated: MaintenanceTicket = {
      ...ticket,
      status: newStatus,
      assignedTechnician: assigneeInput || ticket.assignedTechnician,
      resolutionNotes: resolutionInput || ticket.resolutionNotes,
    };
    onUpdateTicket(updated);
    setSelectedTicket(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">
            Manajemen Tiket Keluhan & Perbaikan Fasilitas
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar laporan kerusakan fasilitas yang diajukan karyawan kantor untuk ditindaklanjuti GA
          </p>
        </div>

        <button
          onClick={onOpenCreateTicket}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-2xs whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajukan Tiket Perbaikan
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit text-xs">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
            filterStatus === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Semua Tiket ({tickets.length})
        </button>
        <button
          onClick={() => setFilterStatus('open')}
          className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
            filterStatus === 'open'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Terbuka / Menunggu ({tickets.filter((t) => t.status === 'open').length})
        </button>
        <button
          onClick={() => setFilterStatus('assigned')}
          className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
            filterStatus === 'assigned'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Ditugaskan ke Vendor ({tickets.filter((t) => t.status === 'assigned').length})
        </button>
        <button
          onClick={() => setFilterStatus('resolved')}
          className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
            filterStatus === 'resolved'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Selesai Diperbaiki ({tickets.filter((t) => t.status === 'resolved').length})
        </button>
      </div>

      {/* Ticket List Cards */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
            Tidak ada tiket dalam kategori ini.
          </div>
        ) : (
          filteredTickets.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-slate-200 p-4 text-xs space-y-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">{t.ticketNumber}</span>
                  <span>·</span>
                  <span className="font-semibold text-slate-800">{t.assetName}</span>
                  <span>·</span>
                  <span className="text-slate-500">{t.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[10px] uppercase ${
                      t.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-800'
                        : t.priority === 'high'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Urgensi: {t.priority}
                  </span>
                  <span className="font-medium text-slate-600 capitalize bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                    Status: {t.status}
                  </span>
                </div>
              </div>

              <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                "{t.issueDescription}"
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <div>
                  Pelapor: <span className="font-medium text-slate-700">{t.reportedBy}</span> ({t.reportedEmail}) · {t.reportedDate}
                </div>

                <div className="flex items-center gap-2">
                  {t.assignedTechnician ? (
                    <span className="text-slate-700 font-medium">
                      Ditugaskan ke: {t.assignedTechnician}
                    </span>
                  ) : (
                    <span className="text-amber-700 italic">Belum ada teknisi ditugaskan</span>
                  )}

                  {canManageTickets && (
                    <button
                      onClick={() => {
                        setSelectedTicket(t);
                        setAssigneeInput(t.assignedTechnician || '');
                        setResolutionInput(t.resolutionNotes || '');
                      }}
                      className="px-2.5 py-1 text-slate-900 bg-slate-100 hover:bg-slate-200 rounded font-medium transition-colors"
                    >
                      Kelola Tiket
                    </button>
                  )}
                </div>
              </div>

              {t.resolutionNotes && (
                <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-emerald-950 text-[11px]">
                  <span className="font-semibold">Catatan Solusi GA: </span>
                  {t.resolutionNotes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Ticket Management Dialog */}
      {selectedTicket && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-xs space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 text-sm">
                Kelola Tiket: {selectedTicket.ticketNumber}
              </h4>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Tugaskan Teknisi / Vendor Rekanan:
              </label>
              <input
                type="text"
                placeholder="Contoh: Hendra Setiawan (PT Daikin)"
                value={assigneeInput}
                onChange={(e) => setAssigneeInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Catatan Penanganan / Solusi:
              </label>
              <textarea
                rows={3}
                placeholder="Deskripsikan tindakan perbaikan atau instruksi untuk teknisi..."
                value={resolutionInput}
                onChange={(e) => setResolutionInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => handleSaveResolution(selectedTicket, 'assigned')}
                className="px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg font-medium hover:bg-slate-200"
              >
                Simpan & Tugaskan
              </button>
              <button
                onClick={() => handleSaveResolution(selectedTicket, 'resolved')}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800"
              >
                Tandai Selesai (Resolved)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
