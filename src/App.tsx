/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Asset,
  Branch,
  EmailNotificationLog,
  EmailNotificationSettings,
  MaintenanceTicket,
  RoleDefinition,
  UserProfile,
} from './types';
import {
  getStoredAssets,
  saveStoredAssets,
  getStoredBranches,
  saveStoredBranches,
  getStoredRoles,
  saveStoredRoles,
  getStoredUsers,
  saveStoredUsers,
  getStoredAuthUser,
  saveStoredAuthUser,
  getStoredTickets,
  saveStoredTickets,
  getStoredEmailSettings,
  saveStoredEmailSettings,
  getStoredEmailLogs,
  saveStoredEmailLogs,
} from './utils/storage';
import { checkAndDispatchNotifications, getDaysRemaining } from './utils/notificationEngine';

import { PinLockScreen } from './components/PinLockScreen';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { AssetList } from './components/AssetList';
import { TicketsList } from './components/TicketsList';
import { AssetDetailModal } from './components/AssetDetailModal';
import { BarcodeModal } from './components/BarcodeModal';
import { ScannerModal } from './components/ScannerModal';
import { AssetFormModal } from './components/AssetFormModal';
import { EmailNotificationModal } from './components/EmailNotificationModal';
import { ReportsModal } from './components/ReportsModal';
import { BackupModal } from './components/BackupModal';
import { TicketRequestModal } from './components/TicketRequestModal';
import { UserManagementModal } from './components/UserManagementModal';

export default function App() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'assets' | 'tickets'>('dashboard');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  const [assets, setAssets] = useState<Asset[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [emailSettings, setEmailSettings] = useState<EmailNotificationSettings>(getStoredEmailSettings());
  const [emailLogs, setEmailLogs] = useState<EmailNotificationLog[]>([]);

  // Modals state
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<Asset | null>(null);
  const [selectedAssetForBarcode, setSelectedAssetForBarcode] = useState<Asset | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNewAssetOpen, setIsNewAssetOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    const loadedUsers = getStoredUsers();
    const loadedBranches = getStoredBranches();
    const loadedRoles = getStoredRoles();
    const loadedAssets = getStoredAssets();
    const loadedTickets = getStoredTickets();
    const loadedSettings = getStoredEmailSettings();
    const loadedLogs = getStoredEmailLogs();
    const storedAuth = getStoredAuthUser();

    setUsers(loadedUsers);
    setBranches(loadedBranches);
    setRoles(loadedRoles);
    setAssets(loadedAssets);
    setTickets(loadedTickets);
    setEmailSettings(loadedSettings);
    setEmailLogs(loadedLogs);

    if (storedAuth) {
      setCurrentUser(storedAuth);
      setIsAuthenticated(true);
    }

    // Run scheduled notification scan for date 2026-10-14
    if (loadedSettings.enabled) {
      const dispatchResult = checkAndDispatchNotifications(loadedAssets, loadedSettings, '2026-10-14');
      if (dispatchResult.dispatchedCount > 0) {
        setEmailLogs((prev) => [...dispatchResult.newLogs, ...prev]);
      }
    }
  }, []);

  const handleAuthenticated = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    saveStoredAuthUser(user);
  };

  const handleLogoutPin = () => {
    saveStoredAuthUser(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const handleUpdateAsset = (updatedAsset: Asset) => {
    const updatedList = assets.map((a) => (a.id === updatedAsset.id ? updatedAsset : a));
    setAssets(updatedList);
    saveStoredAssets(updatedList);
    setSelectedAssetForDetail(updatedAsset);
  };

  const handleDeleteAsset = (assetId: string) => {
    const updatedList = assets.filter((a) => a.id !== assetId);
    setAssets(updatedList);
    saveStoredAssets(updatedList);
    setSelectedAssetForDetail(null);
  };

  const handleSaveNewAsset = (newAsset: Asset) => {
    const updatedList = [newAsset, ...assets];
    setAssets(updatedList);
    saveStoredAssets(updatedList);
    setSelectedAssetForBarcode(newAsset);
  };

  const handleSubmitTicket = (newTicket: MaintenanceTicket) => {
    const updatedTickets = [newTicket, ...tickets];
    setTickets(updatedTickets);
    saveStoredTickets(updatedTickets);
  };

  const handleUpdateTicket = (updatedTicket: MaintenanceTicket) => {
    const updatedList = tickets.map((t) => (t.id === updatedTicket.id ? updatedTicket : t));
    setTickets(updatedList);
    saveStoredTickets(updatedList);
  };

  const handleSaveUsers = (newUsers: UserProfile[]) => {
    setUsers(newUsers);
    saveStoredUsers(newUsers);
    // If current user is updated, keep in sync
    if (currentUser) {
      const found = newUsers.find((u) => u.id === currentUser.id);
      if (found) {
        setCurrentUser(found);
        saveStoredAuthUser(found);
      }
    }
  };

  const handleSaveRoles = (newRoles: RoleDefinition[]) => {
    setRoles(newRoles);
    saveStoredRoles(newRoles);
  };

  const handleSaveBranches = (newBranches: Branch[]) => {
    setBranches(newBranches);
    saveStoredBranches(newBranches);
  };

  const handleDataRestored = () => {
    setAssets(getStoredAssets());
    setBranches(getStoredBranches());
    setRoles(getStoredRoles());
    setUsers(getStoredUsers());
    setTickets(getStoredTickets());
    setEmailLogs(getStoredEmailLogs());
    setEmailSettings(getStoredEmailSettings());
  };

  const handleAssetFoundFromScanner = (scannedAsset: Asset) => {
    setSelectedAssetForDetail(scannedAsset);
  };

  // Due alerts count for navbar badge
  const dueAlertCount = assets.filter(
    (a) => getDaysRemaining(a.nextMaintenanceDate, '2026-10-14') <= 3
  ).length;

  // 1. PIN Lock Screen Authentication Gate (Requirement 1 & 3)
  if (!isAuthenticated || !currentUser) {
    return <PinLockScreen users={users} onAuthenticated={handleAuthenticated} />;
  }

  const selectedBranchForTag = selectedAssetForBarcode
    ? branches.find((b) => b.id === selectedAssetForBarcode.branchId)
    : undefined;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Navbar Contract */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onChangeUser={(u) => {
          setCurrentUser(u);
          saveStoredAuthUser(u);
        }}
        onLogoutPin={handleLogoutPin}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenEmailNotifications={() => setIsEmailModalOpen(true)}
        onOpenReports={() => setIsReportsOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        dueAlertCount={dueAlertCount}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {currentTab === 'dashboard' && (
          <DashboardOverview
            assets={assets}
            branches={branches}
            tickets={tickets}
            currentUser={currentUser}
            selectedBranchId={selectedBranchId}
            onSelectBranch={setSelectedBranchId}
            onSelectAsset={setSelectedAssetForDetail}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenNewAsset={() => setIsNewAssetOpen(true)}
            onOpenEmailNotifications={() => setIsEmailModalOpen(true)}
            onOpenReports={() => setIsReportsOpen(true)}
            onOpenTicketModal={() => setIsTicketModalOpen(true)}
            onOpenUserManagement={() => setIsUserManagementOpen(true)}
          />
        )}

        {currentTab === 'assets' && (
          <AssetList
            assets={assets}
            branches={branches}
            currentUser={currentUser}
            selectedBranchId={selectedBranchId}
            onSelectBranch={setSelectedBranchId}
            onSelectAsset={setSelectedAssetForDetail}
            onOpenBarcode={setSelectedAssetForBarcode}
            onOpenNewAsset={() => setIsNewAssetOpen(true)}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}

        {currentTab === 'tickets' && (
          <TicketsList
            tickets={tickets}
            assets={assets}
            currentUser={currentUser}
            onOpenCreateTicket={() => setIsTicketModalOpen(true)}
            onUpdateTicket={handleUpdateTicket}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-900">GA-Ops Commander</span> · Divisi General Affairs (Cabang RAD & Seluruh Cabang) © 2026
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsBackupOpen(true)}
              className="hover:text-slate-900 transition-colors"
            >
              Cloud Backup E2EE
            </button>
            <span>·</span>
            <button
              onClick={() => setIsReportsOpen(true)}
              className="hover:text-slate-900 transition-colors"
            >
              Laporan Audit
            </button>
            <span>·</span>
            <button
              onClick={handleLogoutPin}
              className="hover:text-slate-900 transition-colors text-rose-600 font-medium"
            >
              Kunci Layar (Keluar)
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <AssetDetailModal
        asset={selectedAssetForDetail}
        branches={branches}
        currentUser={currentUser}
        onClose={() => setSelectedAssetForDetail(null)}
        onUpdateAsset={handleUpdateAsset}
        onOpenBarcode={(asset) => setSelectedAssetForBarcode(asset)}
        onDeleteAsset={handleDeleteAsset}
      />

      <BarcodeModal
        asset={selectedAssetForBarcode}
        branch={selectedBranchForTag}
        onClose={() => setSelectedAssetForBarcode(null)}
        onUpdateAsset={handleUpdateAsset}
      />

      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        assets={assets}
        branches={branches}
        onAssetFound={handleAssetFoundFromScanner}
      />

      <AssetFormModal
        isOpen={isNewAssetOpen}
        branches={branches}
        selectedBranchId={selectedBranchId}
        onClose={() => setIsNewAssetOpen(false)}
        onSave={handleSaveNewAsset}
        existingCount={assets.length}
      />

      <EmailNotificationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        assets={assets}
        settings={emailSettings}
        logs={emailLogs}
        onUpdateSettings={setEmailSettings}
        onUpdateLogs={setEmailLogs}
      />

      <ReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        assets={assets}
        currentUser={currentUser}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        assets={assets}
        onDataRestored={handleDataRestored}
      />

      <TicketRequestModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        assets={assets}
        currentUser={currentUser}
        onSubmitTicket={handleSubmitTicket}
      />

      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        users={users}
        roles={roles}
        branches={branches}
        currentUser={currentUser}
        onSaveUsers={handleSaveUsers}
        onSaveRoles={handleSaveRoles}
        onSaveBranches={handleSaveBranches}
      />
    </div>
  );
}
