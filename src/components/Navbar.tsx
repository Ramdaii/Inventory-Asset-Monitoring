/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ScanLine, ChevronDown, Bell, LogOut, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'assets' | 'tickets';
  onSelectTab: (tab: 'dashboard' | 'assets' | 'tickets') => void;
  currentUser: UserProfile;
  onChangeUser: (user: UserProfile) => void;
  onLogoutPin: () => void;
  onOpenScanner: () => void;
  onOpenEmailNotifications: () => void;
  onOpenReports: () => void;
  onOpenBackup: () => void;
  onOpenUserManagement: () => void;
  dueAlertCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onChangeUser,
  onLogoutPin,
  onOpenScanner,
  onOpenEmailNotifications,
  onOpenReports,
  onOpenBackup,
  onOpenUserManagement,
  dueAlertCount,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-6 h-16">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-wider">
            GA
          </div>
          <span className="text-base font-bold tracking-tight text-slate-950 whitespace-nowrap">
            GA-Ops Commander
          </span>
        </div>

        {/* Zone 2: Navigation Links (single line whitespace-nowrap) */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-600">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`whitespace-nowrap transition-colors hover:text-slate-950 ${
              currentTab === 'dashboard' ? 'text-slate-950 border-b-2 border-slate-950 py-5' : ''
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onSelectTab('assets')}
            className={`whitespace-nowrap transition-colors hover:text-slate-950 ${
              currentTab === 'assets' ? 'text-slate-950 border-b-2 border-slate-950 py-5' : ''
            }`}
          >
            Inventaris Fasilitas
          </button>
          <button
            onClick={() => onSelectTab('tickets')}
            className={`whitespace-nowrap transition-colors hover:text-slate-950 ${
              currentTab === 'tickets' ? 'text-slate-950 border-b-2 border-slate-950 py-5' : ''
            }`}
          >
            Tiket Perbaikan
          </button>
          <button
            onClick={onOpenReports}
            className="whitespace-nowrap transition-colors hover:text-slate-950 text-slate-600"
          >
            Laporan Berkala
          </button>
          {currentUser.roleId === 'full_admin' && (
            <button
              onClick={onOpenUserManagement}
              className="whitespace-nowrap transition-colors hover:text-slate-950 text-slate-600 flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Role & Akses PIN</span>
            </button>
          )}
          <button
            onClick={onOpenBackup}
            className="whitespace-nowrap transition-colors hover:text-slate-950 text-slate-600"
          >
            Cloud Backup
          </button>
        </nav>

        {/* Zone 3: Actions & Role Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Email Alert Trigger Button */}
          <button
            onClick={onOpenEmailNotifications}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Pusat Notifikasi Email Otomatis"
          >
            <Bell className="w-4 h-4" />
            {dueAlertCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-600" />
            )}
          </button>

          {/* Scanner Button (Primary Action) */}
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs whitespace-nowrap"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pindai Barcode</span>
            <span className="sm:hidden">Scan</span>
          </button>

          {/* Lock / Logout to PIN Screen */}
          <button
            onClick={onLogoutPin}
            className="flex items-center gap-1 p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Kunci Dashboard (Kembali ke Layar PIN)"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* User Profile Info */}
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-7 h-7 rounded-md object-cover border border-slate-200"
              />
            ) : (
              <div className="w-7 h-7 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold font-mono">
                {currentUser.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="text-xs leading-none">
              <div className="font-semibold text-slate-900 truncate max-w-[110px]">
                {currentUser.name.split(' ')[0]}
              </div>
              <div className="text-[10px] text-slate-500 truncate max-w-[110px] mt-0.5">
                {currentUser.roleLabel.split(' ')[0]}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
