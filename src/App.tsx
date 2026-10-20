/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Asset,
  Branch,
  CategoryDefinition,
  EmailNotificationLog,
  EmailNotificationSettings,
  MaintenanceTicket,
  RoleDefinition,
  UserProfile,
} from './types';
import {
  getStoredAssets,
  getStoredBranches,
  getStoredCategories,
  getStoredRoles,
  getStoredUsers,
  getStoredAuthUser,
  saveStoredAuthUser,
  getStoredTickets,
  getStoredEmailSettings,
  saveStoredEmailSettings,
  getStoredEmailLogs,
  saveStoredEmailLogs,
} from './utils/storage';
import { checkAndDispatchNotifications, getDaysRemaining } from './utils/notificationEngine';
import { exportCleanExcelReport } from './utils/excelExport';

import { PinLockScreen } from './components/PinLockScreen';
import { Navbar } from './components/Navbar';
import { Clock, Mail, Database } from 'lucide-react';
import { useRealtimeJakarta } from './utils/time';
import { GmailModal } from './components/GmailModal';
import { SupabaseModal } from './components/SupabaseModal';
import {
  getAssetsHybrid,
  saveAssetHybrid,
  deleteAssetHybrid,
  getTicketsHybrid,
  saveTicketHybrid,
  getBranchesHybrid,
  saveBranchesHybrid,
  getCategoriesHybrid,
  saveCategoriesHybrid,
  getRolesHybrid,
  saveRolesHybrid,
  getUsersHybrid,
  saveUsersHybrid,
  subscribeToSupabaseRealtime,
} from './utils/supabaseStorage';
import { logoutSupabaseSession } from './utils/supabaseAuth';
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
import { CategoryManagementModal } from './components/CategoryManagementModal';

export default function App() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const realtimeJakarta = useRealtimeJakarta();

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'assets' | 'tickets'>('dashboard');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<CategoryDefinition[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [emailSettings, setEmailSettings] = useState<EmailNotificationSettings>(getStoredEmailSettings());
  const [emailLogs, setEmailLogs] = useState<EmailNotificationLog[]>([]);

  // Modals state
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<Asset | null>(null);
  const [selectedAssetForBarcode, setSelectedAssetForBarcode] = useState<Asset | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNewAssetOpen, setIsNewAssetOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isGmailOpen, setIsGmailOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [userMgmtInitialTab, setUserMgmtInitialTab] = useState<'users' | 'roles' | 'branches'>('users');
  const [userMgmtInitialBranchId, setUserMgmtInitialBranchId] = useState<string | null>(null);

  const handleOpenBranchManagement = (branchId?: string) => {
    setUserMgmtInitialTab('branches');
    setUserMgmtInitialBranchId(branchId || null);
    setIsUserManagementOpen(true);
  };

  const handleOpenUserManagement = (tab: 'users' | 'roles' | 'branches' = 'users') => {
    setUserMgmtInitialTab(tab);
    setUserMgmtInitialBranchId(null);
    setIsUserManagementOpen(true);
  };

  // Synchronize state from Supabase Cloud (Single Source of Truth)
  const refreshAllDataFromCloud = async () => {
    try {
      const [
        remoteBranches,
        remoteCategories,
        remoteRoles,
        remoteUsers,
        remoteAssets,
        remoteTickets,
      ] = await Promise.all([
        getBranchesHybrid(),
        getCategoriesHybrid(),
        getRolesHybrid(),
        getUsersHybrid(),
        getAssetsHybrid(),
        getTicketsHybrid(),
      ]);

      if (remoteBranches.length > 0) setBranches(remoteBranches);
      if (remoteCategories.length > 0) setCategories(remoteCategories);
      if (remoteRoles.length > 0) setRoles(remoteRoles);
      if (remoteUsers.length > 0) setUsers(remoteUsers);
      if (remoteAssets.length > 0) setAssets(remoteAssets);
      if (remoteTickets.length > 0) setTickets(remoteTickets);
    } catch (err) {
      console.warn('Initial cloud sync notice:', err);
    }
  };

  // Initialize data on mount & subscribe to Supabase Realtime
  useEffect(() => {
    // 1. Initial immediate paint from local storage cache for instant UX
    const loadedUsers = getStoredUsers();
    const loadedBranches = getStoredBranches();
    const loadedCategories = getStoredCategories();
    const loadedRoles = getStoredRoles();
    const loadedAssets = getStoredAssets();
    const loadedTickets = getStoredTickets();
    const loadedSettings = getStoredEmailSettings();
    const loadedLogs = getStoredEmailLogs();
    const storedAuth = getStoredAuthUser();

    setUsers(loadedUsers);
    setBranches(loadedBranches);
    setCategories(loadedCategories);
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

    // 2. Fetch latest data from Supabase Cloud
    refreshAllDataFromCloud();

    // 3. Connect Supabase Realtime channel for instant cross-device synchronization
    const unsubscribe = subscribeToSupabaseRealtime(
      (changedAsset, eventType) => {
        setAssets((prev) => {
          if (eventType === 'DELETE') {
            return prev.filter((a) => a.id !== changedAsset.id);
          }
          const exists = prev.some((a) => a.id === changedAsset.id);
          return exists
            ? prev.map((a) => (a.id === changedAsset.id ? changedAsset : a))
            : [changedAsset, ...prev];
        });
      },
      (changedTicket, eventType) => {
        setTickets((prev) => {
          if (eventType === 'DELETE') {
            return prev.filter((t) => t.id !== changedTicket.id);
          }
          const exists = prev.some((t) => t.id === changedTicket.id);
          return exists
            ? prev.map((t) => (t.id === changedTicket.id ? changedTicket : t))
            : [changedTicket, ...prev];
        });
      },
      (changedBranch) => {
        setBranches((prev) => {
          const exists = prev.some((b) => b.id === changedBranch.id);
          return exists
            ? prev.map((b) => (b.id === changedBranch.id ? changedBranch : b))
            : [...prev, changedBranch];
        });
      },
      (changedCategory) => {
        setCategories((prev) => {
          const exists = prev.some((c) => c.id === changedCategory.id);
          return exists
            ? prev.map((c) => (c.id === changedCategory.id ? changedCategory : c))
            : [...prev, changedCategory];
        });
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleAuthenticated = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    saveStoredAuthUser(user);
    refreshAllDataFromCloud();
  };

  const handleLogoutPin = async () => {
    await logoutSupabaseSession();
    saveStoredAuthUser(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const handleUpdateAsset = async (updatedAsset: Asset) => {
    setAssets((prev) => prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a)));
    setSelectedAssetForDetail(updatedAsset);
    await saveAssetHybrid(updatedAsset);
  };

  const handleDeleteAsset = async (assetId: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
    setSelectedAssetForDetail(null);
    await deleteAssetHybrid(assetId);
  };

  const handleSaveNewAsset = async (newAsset: Asset) => {
    setAssets((prev) => [newAsset, ...prev]);
    setSelectedAssetForBarcode(newAsset);
    await saveAssetHybrid(newAsset);
  };

  const handleSubmitTicket = async (newTicket: MaintenanceTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
    await saveTicketHybrid(newTicket);
  };

  const handleUpdateTicket = async (updatedTicket: MaintenanceTicket) => {
    setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
    await saveTicketHybrid(updatedTicket);
  };

  const handleSaveUsers = async (newUsers: UserProfile[]) => {
    setUsers(newUsers);
    await saveUsersHybrid(newUsers);
    // If current user is updated, keep in sync
    if (currentUser) {
      const found = newUsers.find((u) => u.id === currentUser.id);
      if (found) {
        setCurrentUser(found);
        saveStoredAuthUser(found);
      }
    }
  };

  const handleSaveRoles = async (newRoles: RoleDefinition[]) => {
    setRoles(newRoles);
    await saveRolesHybrid(newRoles);
  };

  const handleSaveBranches = async (newBranches: Branch[]) => {
    setBranches(newBranches);
    await saveBranchesHybrid(newBranches);
  };

  const handleSaveCategories = async (newCategories: CategoryDefinition[]) => {
    setCategories(newCategories);
    await saveCategoriesHybrid(newCategories);
  };

  const handleExportExcel = () => {
    exportCleanExcelReport(
      assets,
      branches,
      categories,
      tickets,
      'Laporan Inventaris & Audit Fasilitas GA-Ops'
    );
  };

  const handleDataRestored = () => {
    setAssets(getStoredAssets());
    setBranches(getStoredBranches());
    setCategories(getStoredCategories());
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
    return (
      <>
        <PinLockScreen
          users={users}
          onAuthenticated={handleAuthenticated}
          onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)}
        />
        <SupabaseModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
          onDataSynced={() => {
            refreshAllDataFromCloud();
          }}
        />
      </>
    );
  }

  const selectedBranchForTag = selectedAssetForBarcode
    ? branches.find((b) => b.id === selectedAssetForBarcode.branchId)
    : undefined;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 w-full overflow-x-hidden">
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
        onOpenCategories={() => setIsCategoryModalOpen(true)}
        onOpenGmail={() => setIsGmailOpen(true)}
        onOpenSupabase={() => setIsSupabaseModalOpen(true)}
        dueAlertCount={dueAlertCount}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-3.5 sm:py-6">
        {currentTab === 'dashboard' && (
          <DashboardOverview
            assets={assets}
            branches={branches}
            categories={categories}
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
            onOpenUserManagement={() => handleOpenUserManagement('users')}
            onOpenBranchManagement={handleOpenBranchManagement}
            onOpenCategoryManagement={() => setIsCategoryModalOpen(true)}
            onExportExcel={handleExportExcel}
          />
        )}

        {currentTab === 'assets' && (
          <AssetList
            assets={assets}
            branches={branches}
            categories={categories}
            currentUser={currentUser}
            selectedBranchId={selectedBranchId}
            onSelectBranch={setSelectedBranchId}
            onSelectAsset={setSelectedAssetForDetail}
            onOpenBarcode={setSelectedAssetForBarcode}
            onOpenNewAsset={() => setIsNewAssetOpen(true)}
            onOpenScanner={() => setIsScannerOpen(true)}
            onBackToDashboard={() => setCurrentTab('dashboard')}
            onOpenCategoryManagement={() => setIsCategoryModalOpen(true)}
            onExportExcel={handleExportExcel}
          />
        )}

        {currentTab === 'tickets' && (
          <TicketsList
            tickets={tickets}
            assets={assets}
            currentUser={currentUser}
            onOpenCreateTicket={() => setIsTicketModalOpen(true)}
            onUpdateTicket={handleUpdateTicket}
            onBackToDashboard={() => setCurrentTab('dashboard')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 sm:py-5">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 text-center sm:text-left">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-semibold text-slate-900">GA-Ops Commander</span> · Divisi General Affairs © 2026
            <span className="hidden sm:inline text-slate-300">·</span>
            <span className="font-mono text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1 shadow-2xs">
              <Clock className="w-3 h-3 text-emerald-600 animate-pulse shrink-0" />
              <span>{realtimeJakarta}</span>
              <span className="text-[9px] text-slate-500 font-sans font-medium">WIB</span>
            </span>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => setIsGmailOpen(true)}
              className="hover:text-rose-600 transition-colors text-slate-700 font-medium flex items-center gap-1"
            >
              <Mail className="w-3.5 h-3.5 text-rose-600" />
              <span>Gmail Hub</span>
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setIsBackupOpen(true)}
              className="hover:text-slate-900 transition-colors text-slate-600"
            >
              Cloud Backup
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="hover:text-emerald-800 transition-colors text-emerald-700 font-semibold flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5 text-emerald-700" />
              <span>Supabase Cloud</span>
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setIsReportsOpen(true)}
              className="hover:text-slate-900 transition-colors text-slate-600"
            >
              Laporan Audit
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={handleLogoutPin}
              className="hover:text-rose-700 transition-colors text-rose-600 font-semibold"
            >
              Kunci Layar (PIN)
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
        categories={categories}
        selectedBranchId={selectedBranchId}
        onClose={() => setIsNewAssetOpen(false)}
        onSave={handleSaveNewAsset}
        onOpenCategoryManagement={() => {
          setIsNewAssetOpen(false);
          setIsCategoryModalOpen(true);
        }}
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
        onOpenGmail={() => {
          setIsEmailModalOpen(false);
          setIsGmailOpen(true);
        }}
      />

      <GmailModal
        isOpen={isGmailOpen}
        onClose={() => setIsGmailOpen(false)}
        assets={assets}
        branches={branches}
        currentUser={currentUser}
        onLogAdded={(newLog) => {
          const updated = [newLog, ...emailLogs];
          setEmailLogs(updated);
          saveStoredEmailLogs(updated);
        }}
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

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onDataSynced={() => {
          refreshAllDataFromCloud();
        }}
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
        onClose={() => {
          setIsUserManagementOpen(false);
          setUserMgmtInitialBranchId(null);
        }}
        users={users}
        roles={roles}
        branches={branches}
        currentUser={currentUser}
        initialTab={userMgmtInitialTab}
        initialBranchIdToEdit={userMgmtInitialBranchId}
        onSaveUsers={handleSaveUsers}
        onSaveRoles={handleSaveRoles}
        onSaveBranches={handleSaveBranches}
      />

      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        assets={assets}
        currentUser={currentUser}
        onSaveCategories={handleSaveCategories}
      />
    </div>
  );
}
