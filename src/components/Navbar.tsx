/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  ScanLine,
  Bell,
  LogOut,
  ShieldCheck,
  FolderTree,
  Menu,
  X,
  LayoutDashboard,
  Building2,
  Wrench,
  FileBarChart2,
  Cloud,
  ChevronRight,
  Clock,
  Mail,
  Database,
} from 'lucide-react';
import { useRealtimeJakarta } from '../utils/time';

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
  onOpenCategories?: () => void;
  onOpenGmail?: () => void;
  onOpenSupabase?: () => void;
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
  onOpenCategories,
  onOpenGmail,
  onOpenSupabase,
  dueAlertCount,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const realtimeJakarta = useRealtimeJakarta();

  const handleMobileNav = (action: () => void) => {
    action();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-6 h-16">
        
        {/* Zone 1 (Left): Brand Badge (Text "GA-Ops Commander" removed on mobile as requested) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-2xs">
            GA
          </div>
          {/* Text is hidden on mobile screens to save space and avoid clutter */}
          <span className="hidden md:inline text-base font-bold tracking-tight text-slate-950 whitespace-nowrap">
            GA-Ops Commander
          </span>
        </div>

        {/* Zone 2 (Center): On Mobile, Notification and Scan are centered */}
        <div className="flex items-center justify-center gap-2 flex-1 md:flex-initial">
          {/* Notification Alert Bell Button */}
          <button
            onClick={onOpenEmailNotifications}
            className="relative p-2 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors border border-slate-200 md:border-transparent"
            title="Pusat Notifikasi Email Otomatis"
          >
            <Bell className="w-4 h-4" />
            {dueAlertCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            )}
          </button>

          {/* Scanner Button (Primary Action) */}
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs whitespace-nowrap active:scale-95"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Scan Barcode</span>
          </button>
        </div>

        {/* Desktop Navigation Links */}
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
          {onOpenCategories && (
            <button
              onClick={onOpenCategories}
              className="whitespace-nowrap transition-colors hover:text-slate-950 text-slate-600 flex items-center gap-1"
            >
              <FolderTree className="w-3.5 h-3.5 text-slate-600" />
              <span>Kategori Fasilitas</span>
            </button>
          )}
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
          {onOpenGmail && (
            <button
              onClick={onOpenGmail}
              className="whitespace-nowrap transition-colors hover:text-slate-950 text-slate-700 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 shadow-2xs"
              title="Buka Gmail Workspace Hub (Kirim Email & Notifikasi)"
            >
              <Mail className="w-3.5 h-3.5 text-rose-600" />
              <span className="font-semibold text-slate-900">Gmail Hub</span>
            </button>
          )}
          {onOpenSupabase && (
            <button
              onClick={onOpenSupabase}
              className="whitespace-nowrap transition-colors hover:text-slate-950 text-slate-700 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shadow-2xs"
              title="Buka Pengaturan & Migrasi Supabase Cloud"
            >
              <Database className="w-3.5 h-3.5 text-emerald-700" />
              <span className="font-semibold text-emerald-950">Supabase</span>
            </button>
          )}
        </nav>

        {/* Zone 3 (Right): Live Real-Time Clock + Desktop User Profile + Lock & Mobile Hamburger Menu Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Live Real-Time Clock (Asia/Jakarta) */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-lg text-xs font-mono text-slate-800 border border-slate-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
            <span className="font-semibold">{realtimeJakarta}</span>
            <span className="text-[10px] text-slate-500 font-sans font-medium">WIB</span>
          </div>

          {/* Desktop User Profile Info */}
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

          {/* Desktop Logout Button */}
          <button
            onClick={onLogoutPin}
            className="hidden md:flex items-center gap-1 p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Kunci Dashboard (Kembali ke Layar PIN)"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile Hamburger Menu Button (Right Corner as requested) */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors border border-slate-200 flex items-center justify-center"
            title="Buka Menu Navigasi"
            aria-label="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5 text-slate-800" />
          </button>
        </div>
      </div>

      {/* Mobile Hamburger Drawer / Sheet */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Menu Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-[300px] bg-white shadow-2xl flex flex-col border-l border-slate-200 z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  GA
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">Menu Navigasi</h3>
                  <p className="text-[10px] text-slate-500">GA-Ops Commander</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                aria-label="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current User Card */}
            <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center gap-3">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-bold font-mono shrink-0">
                  {currentUser.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 text-xs truncate">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {currentUser.roleLabel}
                </div>
                <div className="text-[10px] text-emerald-700 font-medium">
                  {currentUser.department}
                </div>
              </div>
            </div>

            {/* Live Real-Time Clock Bar in Mobile Drawer */}
            <div className="px-4 py-2.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
                <span className="text-[11px] font-medium">Waktu Realtime:</span>
              </div>
              <div className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] flex items-center gap-1">
                <span>{realtimeJakarta}</span>
                <span className="text-[9px] text-slate-500 font-sans font-normal">WIB</span>
              </div>
            </div>

            {/* Navigation List: Exactly the 6 requested items */}
            <div className="p-3 overflow-y-auto flex-1 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                Menu Utama
              </div>

              {/* 1. Dashboard */}
              <button
                onClick={() => handleMobileNav(() => onSelectTab('dashboard'))}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  currentTab === 'dashboard'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              {/* 2. Inventaris Fasilitas */}
              <button
                onClick={() => handleMobileNav(() => onSelectTab('assets'))}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  currentTab === 'assets'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4" />
                  <span>Inventaris Fasilitas</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              {/* 3. Tiket Perbaikan */}
              <button
                onClick={() => handleMobileNav(() => onSelectTab('tickets'))}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  currentTab === 'tickets'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Wrench className="w-4 h-4" />
                  <span>Tiket Perbaikan</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              {/* 4. Kategori Fasilitas */}
              {onOpenCategories && (
                <button
                  onClick={() => handleMobileNav(onOpenCategories)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FolderTree className="w-4 h-4 text-slate-600" />
                    <span>Kategori Fasilitas</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              )}

              {/* 5. Laporan Berkala */}
              <button
                onClick={() => handleMobileNav(onOpenReports)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileBarChart2 className="w-4 h-4 text-slate-600" />
                  <span>Laporan Berkala</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              {/* 6. Role & Akses PIN */}
              <button
                onClick={() => handleMobileNav(onOpenUserManagement)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Role & Akses PIN</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <div className="pt-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                  Sistem & Keamanan
                </div>

                {/* Gmail Workspace Hub */}
                {onOpenGmail && (
                  <button
                    onClick={() => handleMobileNav(onOpenGmail)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-100 hover:text-slate-950 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-rose-600" />
                      <span>Gmail Workspace Hub</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                )}

                {/* Supabase Cloud */}
                {onOpenSupabase && (
                  <button
                    onClick={() => handleMobileNav(onOpenSupabase)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-100 hover:text-slate-950 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Database className="w-4 h-4 text-emerald-700" />
                      <span>Supabase Cloud Sync</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                )}

                {/* Cloud Backup */}
                <button
                  onClick={() => handleMobileNav(onOpenBackup)}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Cloud className="w-4 h-4 text-slate-500" />
                    <span>Cloud Backup E2EE</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </div>
            </div>

            {/* Drawer Footer with PIN Lock */}
            <div className="p-3 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => handleMobileNav(onLogoutPin)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Kunci Layar (Keluar PIN)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
