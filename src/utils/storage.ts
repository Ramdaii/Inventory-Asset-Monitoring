/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Asset,
  Branch,
  CategoryDefinition,
  EmailNotificationLog,
  EmailNotificationSettings,
  MaintenanceTicket,
  RoleDefinition,
  SystemBackupRecord,
  UserProfile,
} from '../types';
import {
  INITIAL_ASSETS,
  INITIAL_BRANCHES,
  INITIAL_ROLES,
  INITIAL_TICKETS,
  INITIAL_USERS,
import { computeChecksum, encryptData, decryptData } from './crypto';
import { formatJakartaFullDateTime, getJakartaDateString } from './dateTime';

const STORAGE_KEY_ASSETS = 'ga_ops_assets_v3';
const STORAGE_KEY_TICKETS = 'ga_ops_tickets_v3';
const STORAGE_KEY_BRANCHES = 'ga_ops_branches_v3';
const STORAGE_KEY_ROLES = 'ga_ops_roles_v3';
const STORAGE_KEY_USERS = 'ga_ops_users_v3';
const STORAGE_KEY_AUTH_USER = 'ga_ops_auth_user_v3';
const STORAGE_KEY_CATEGORIES = 'ga_ops_categories_v3';
const STORAGE_KEY_EMAIL_SETTINGS = 'ga_ops_email_settings_v3';
const STORAGE_KEY_EMAIL_LOGS = 'ga_ops_email_logs_v3';
const STORAGE_KEY_BACKUPS = 'ga_ops_backups_v3';

export const INITIAL_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'hvac',
    code: 'AC/HVAC',
    name: 'HVAC / Pendingin Ruangan (AC)',
    description: 'Sistem pendingin, AC Split, Cassette, Chiller, dan Ducting ventilasi gedung kantor.',
    color: '#0284c7',
  },
  {
    id: 'power_genset',
    code: 'GENSET',
    name: 'Kelistrikan & Generator Genset',
    description: 'Panel distribusi daya utama, transformator, UPS server, dan mesin genset darurat.',
    color: '#d97706',
  },
  {
    id: 'fire_safety',
    code: 'APAR/HYD',
    name: 'Proteksi Kebakaran (APAR & Hydrant)',
    description: 'Tabung APAR powder/CO2, instalasi sprinkler, alarm asap, dan pompa hydrant gedung.',
    color: '#dc2626',
  },
  {
    id: 'elevator',
    code: 'ELEVATOR',
    name: 'Lift & Elevator Penumpang',
    description: 'Elevator gedung, escalator, sling kabel baja, sensor pintu, dan sertifikasi Depnaker.',
    color: '#7c3aed',
  },
  {
    id: 'it_network',
    code: 'IT-NET',
    name: 'Infrastruktur IT & Server Room',
    description: 'Server rack, switch core, router fiber optic, kabel LAN, dan pendingin PAC data center.',
    color: '#059669',
  },
  {
    id: 'office_facility',
    code: 'FASILITAS',
    name: 'Fasilitas & Interior Gedung',
    description: 'Pintu otomatis, access card reader, furnitur ruang rapat, partisi, dan sanitasi kantor.',
    color: '#475569',
  },
  {
    id: 'vehicle',
    code: 'KENDARAAN',
    name: 'Armada Kendaraan Operasional',
    description: 'Mobil jemputan direksi, van logistik dokumen kantor, motor kurir, dan uji KIR berkala.',
    color: '#ea580c',
  },
  {
    id: 'plumbing',
    code: 'PLUMBING',
    name: 'Sistem Plumbing & Pompa Air',
    description: 'Pompa booster, roof tank penampungan air, pengolahan air bersih (WTP), dan drainase.',
    color: '#0891b2',
  },
];

export function getStoredCategories(): CategoryDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (!raw) {
      saveStoredCategories(INITIAL_CATEGORIES);
      return INITIAL_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveStoredCategories(INITIAL_CATEGORIES);
      return INITIAL_CATEGORIES;
    }
    return parsed;
  } catch (e) {
    console.error('Error loading categories:', e);
    return INITIAL_CATEGORIES;
  }
}

export function saveStoredCategories(categories: CategoryDefinition[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving categories:', e);
  }
}

export const DEFAULT_EMAIL_SETTINGS: EmailNotificationSettings = {
  enabled: true,
  primaryEmail: 'Riyadirama88@gmail.com', // User email
  additionalEmails: ['ga.rad@perusahaan.co.id'],
  alert7Days: true,
  alert3Days: true,
  alertDueDay: true,
  alertOverdue: true,
  autoCheckIntervalMinutes: 60,
  lastCheckedTime: new Date().toISOString(),
};

export function getStoredAssets(): Asset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ASSETS);
    if (!raw) {
      saveStoredAssets(INITIAL_ASSETS);
      return INITIAL_ASSETS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading stored assets:', e);
    return INITIAL_ASSETS;
  }
}

export function saveStoredAssets(assets: Asset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(assets));
  } catch (e) {
    console.error('Error saving assets:', e);
  }
}

export function getStoredBranches(): Branch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BRANCHES);
    if (!raw) {
      saveStoredBranches(INITIAL_BRANCHES);
      return INITIAL_BRANCHES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading branches:', e);
    return INITIAL_BRANCHES;
  }
}

export function saveStoredBranches(branches: Branch[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_BRANCHES, JSON.stringify(branches));
  } catch (e) {
    console.error('Error saving branches:', e);
  }
}

export function getStoredRoles(): RoleDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ROLES);
    if (!raw) {
      saveStoredRoles(INITIAL_ROLES);
      return INITIAL_ROLES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading roles:', e);
    return INITIAL_ROLES;
  }
}

export function saveStoredRoles(roles: RoleDefinition[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(roles));
  } catch (e) {
    console.error('Error saving roles:', e);
  }
}

export function getStoredUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      saveStoredUsers(INITIAL_USERS);
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading users:', e);
    return INITIAL_USERS;
  }
}

export function saveStoredUsers(users: UserProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users:', e);
  }
}

export function getStoredAuthUser(): UserProfile | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading auth user:', e);
    return null;
  }
}

export function saveStoredAuthUser(user: UserProfile | null): void {
  try {
    if (!user) {
      sessionStorage.removeItem(STORAGE_KEY_AUTH_USER);
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    } else {
      sessionStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    }
  } catch (e) {
    console.error('Error saving auth user:', e);
  }
}

export function getStoredTickets(): MaintenanceTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TICKETS);
    if (!raw) {
      saveStoredTickets(INITIAL_TICKETS);
      return INITIAL_TICKETS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading stored tickets:', e);
    return INITIAL_TICKETS;
  }
}

export function saveStoredTickets(tickets: MaintenanceTicket[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(tickets));
  } catch (e) {
    console.error('Error saving tickets:', e);
  }
}

export function getStoredEmailSettings(): EmailNotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EMAIL_SETTINGS);
    if (!raw) {
      saveStoredEmailSettings(DEFAULT_EMAIL_SETTINGS);
      return DEFAULT_EMAIL_SETTINGS;
    }
    return { ...DEFAULT_EMAIL_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error loading email settings:', e);
    return DEFAULT_EMAIL_SETTINGS;
  }
}

export function saveStoredEmailSettings(settings: EmailNotificationSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_EMAIL_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving email settings:', e);
  }
}

export function getStoredEmailLogs(): EmailNotificationLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EMAIL_LOGS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading email logs:', e);
    return [];
  }
}

export function saveStoredEmailLogs(logs: EmailNotificationLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_EMAIL_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving email logs:', e);
  }
}

export function getStoredBackupRecords(): SystemBackupRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BACKUPS);
    if (!raw) {
      const initialBackup: SystemBackupRecord = {
        id: 'bak-init-20261014',
        timestamp: '2026-10-14 08:00 WIB',
        assetCount: INITIAL_ASSETS.length,
        logCount: INITIAL_ASSETS.reduce((acc, a) => acc + a.maintenanceHistory.length, 0),
        encrypted: true,
        checksum: 'sha256-a9f81bc374d6e902b',
        sizeKb: 54.6,
        autoScheduled: true,
      };
      saveStoredBackupRecords([initialBackup]);
      return [initialBackup];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading backup records:', e);
    return [];
  }
}

export function saveStoredBackupRecords(records: SystemBackupRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_BACKUPS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving backup records:', e);
  }
}

export function resetToDefaults(): void {
  saveStoredAssets(INITIAL_ASSETS);
  saveStoredBranches(INITIAL_BRANCHES);
  saveStoredRoles(INITIAL_ROLES);
  saveStoredUsers(INITIAL_USERS);
  saveStoredTickets(INITIAL_TICKETS);
  saveStoredEmailSettings(DEFAULT_EMAIL_SETTINGS);
}

/**
 * Creates an encrypted export package of the entire GA system database
 */
export async function createEncryptedBackupPackage(passphrase: string = 'GA_ENTERPRISE_SECURE_KEY_2026'): Promise<{
  blobData: string;
  checksum: string;
  sizeKb: number;
  fileName: string;
}> {
  const assets = getStoredAssets();
  const branches = getStoredBranches();
  const roles = getStoredRoles();
  const users = getStoredUsers();
  const tickets = getStoredTickets();
  const settings = getStoredEmailSettings();
  const logs = getStoredEmailLogs();

  const payload = JSON.stringify({
    version: '3.0.0',
    timezone: 'Asia/Jakarta (WIB - UTC+7)',
    exportDateWib: formatJakartaFullDateTime(),
    exportDate: new Date().toISOString(),
    system: 'GA-Ops Facility & Inventory Commander (Multi-Branch & RBAC)',
    data: {
      assets,
      branches,
      roles,
      users,
      tickets,
      emailSettings: settings,
      emailLogs: logs,
    },
  });

  const checksum = await computeChecksum(payload);
  const encryptedString = await encryptData(payload, passphrase);
  const sizeKb = Math.round((encryptedString.length / 1024) * 10) / 10;
  const dateStr = getJakartaDateString().replace(/-/g, '');
  const fileName = `ga_ops_backup_${dateStr}_WIB.enc.json`;

  return {
    blobData: encryptedString,
    checksum,
    sizeKb,
    fileName,
  };
}

/**
 * Restores the database from an encrypted or plain JSON backup string
 */
export async function restoreFromBackupPackage(
  fileContent: string,
  passphrase: string = 'GA_ENTERPRISE_SECURE_KEY_2026'
): Promise<{ success: boolean; message: string; assetCount?: number }> {
  try {
    let jsonString = fileContent;
    if (fileContent.includes('"algo":"AES-GCM-256"')) {
      jsonString = await decryptData(fileContent, passphrase);
    }

    const parsed = JSON.parse(jsonString);
    if (!parsed.data || !Array.isArray(parsed.data.assets)) {
      return { success: false, message: 'Format file cadangan tidak valid (struktur data tidak cocok).' };
    }

    saveStoredAssets(parsed.data.assets);
    if (parsed.data.branches) saveStoredBranches(parsed.data.branches);
    if (parsed.data.roles) saveStoredRoles(parsed.data.roles);
    if (parsed.data.users) saveStoredUsers(parsed.data.users);
    if (parsed.data.tickets) saveStoredTickets(parsed.data.tickets);
    if (parsed.data.emailSettings) saveStoredEmailSettings(parsed.data.emailSettings);
    if (parsed.data.emailLogs) saveStoredEmailLogs(parsed.data.emailLogs);

    return {
      success: true,
      message: `Berhasil memulihkan ${parsed.data.assets.length} aset fasilitas, cabang, dan data pengguna.`,
      assetCount: parsed.data.assets.length,
    };
  } catch (error) {
    return {
      success: false,
      message: `Gagal memulihkan cadangan: ${error instanceof Error ? error.message : 'Kesalahan dekripsi'}`,
    };
  }
}
