/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Asset,
  Branch,
  CategoryDefinition,
  MaintenanceTicket,
  RoleDefinition,
  UserProfile,
} from '../types';
import { getSupabaseClient } from './supabaseClient';
import {
  getStoredAssets,
  getStoredBranches,
  getStoredCategories,
  getStoredRoles,
  getStoredTickets,
  getStoredUsers,
  getStoredEmailSettings,
  getStoredEmailLogs,
  saveStoredAssets,
  saveStoredBranches,
  saveStoredCategories,
  saveStoredRoles,
  saveStoredTickets,
  saveStoredUsers,
} from './storage';

// ==========================================
// TABLE NAMES WITH EXACT ga_ PREFIX
// ==========================================
export const TABLE_GA_BRANCHES = 'ga_branches';
export const TABLE_GA_ROLES = 'ga_roles';
export const TABLE_GA_USERS = 'ga_users';
export const TABLE_GA_PIN_CREDENTIALS = 'ga_pin_credentials';
export const TABLE_GA_SESSIONS = 'ga_sessions';
export const TABLE_GA_LOGIN_ATTEMPTS = 'ga_login_attempts';
export const TABLE_GA_CATEGORIES = 'ga_categories';
export const TABLE_GA_ASSETS = 'ga_assets';
export const TABLE_GA_MAINTENANCE_TICKETS = 'ga_maintenance_tickets';
export const TABLE_GA_EMAIL_LOGS = 'ga_email_notification_logs';
export const TABLE_GA_EMAIL_SETTINGS = 'ga_email_notification_settings';
export const TABLE_GA_SYSTEM_BACKUPS = 'ga_system_backups';

// Compatibility aliases
export const TABLE_GA_USERS_AUTH = TABLE_GA_PIN_CREDENTIALS;
export const TABLE_GA_USER_SESSIONS = TABLE_GA_SESSIONS;

// ==========================================
// MAPPERS: Frontend (camelCase) <-> DB ga_* (snake_case)
// ==========================================

export function mapAssetToDb(asset: Asset): Record<string, any> {
  return {
    id: asset.id,
    code: asset.code,
    name: asset.name,
    category: asset.category,
    branch_id: asset.branchId,
    location: asset.location,
    brand_model: asset.brandModel || null,
    serial_number: asset.serialNumber || null,
    purchase_date: asset.purchaseDate && asset.purchaseDate.trim() ? asset.purchaseDate : null,
    warranty_expiry: asset.warrantyExpiry && asset.warrantyExpiry.trim() ? asset.warrantyExpiry : null,
    status: asset.status || 'optimal',
    health_score: Number(asset.healthScore) || 100,
    last_maintenance_date:
      asset.lastMaintenanceDate && asset.lastMaintenanceDate.trim()
        ? asset.lastMaintenanceDate
        : null,
    next_maintenance_date:
      asset.nextMaintenanceDate && asset.nextMaintenanceDate.trim()
        ? asset.nextMaintenanceDate
        : new Date().toISOString().split('T')[0],
    frequency: asset.frequency || 'monthly',
    vendor: asset.vendor || null,
    vendor_contact: asset.vendorContact || null,
    assigned_staff: asset.assignedStaff || null,
    estimated_cost: Number(asset.estimatedCost) || 0,
    actual_cost_total: Number(asset.actualCostTotal) || 0,
    photo_url: asset.photoUrl || null,
    custom_barcode_image: asset.customBarcodeImage || null,
    notes: asset.notes || '',
    documents: Array.isArray(asset.documents) ? asset.documents : [],
    maintenance_history: Array.isArray(asset.maintenanceHistory) ? asset.maintenanceHistory : [],
    is_deleted: false,
    updated_at: new Date().toISOString(),
  };
}

export function mapDbToAsset(row: Record<string, any>): Asset {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    branchId: row.branch_id,
    location: row.location,
    brandModel: row.brand_model || '',
    serialNumber: row.serial_number || '',
    purchaseDate: row.purchase_date || '',
    warrantyExpiry: row.warranty_expiry || '',
    status: row.status || 'optimal',
    healthScore: Number(row.health_score) || 100,
    lastMaintenanceDate: row.last_maintenance_date || '',
    nextMaintenanceDate: row.next_maintenance_date || '',
    frequency: row.frequency || 'monthly',
    vendor: row.vendor || '',
    vendorContact: row.vendor_contact || '',
    assignedStaff: row.assigned_staff || '',
    estimatedCost: Number(row.estimated_cost) || 0,
    actualCostTotal: Number(row.actual_cost_total) || 0,
    photoUrl: row.photo_url || undefined,
    customBarcodeImage: row.custom_barcode_image || undefined,
    notes: row.notes || '',
    documents: Array.isArray(row.documents) ? row.documents : [],
    maintenanceHistory: Array.isArray(row.maintenance_history) ? row.maintenance_history : [],
  };
}

export function mapTicketToDb(ticket: MaintenanceTicket): Record<string, any> {
  return {
    id: ticket.id,
    ticket_number: ticket.ticketNumber,
    asset_id: ticket.assetId,
    asset_name: ticket.assetName,
    branch_id: ticket.branchId,
    location: ticket.location,
    reported_by: ticket.reportedBy,
    reported_email: ticket.reportedEmail || '',
    reported_date:
      ticket.reportedDate && ticket.reportedDate.trim()
        ? ticket.reportedDate
        : new Date().toISOString().split('T')[0],
    priority: ticket.priority || 'medium',
    issue_description: ticket.issueDescription || '',
    status: ticket.status || 'open',
    assigned_technician: ticket.assignedTechnician || null,
    resolution_notes: ticket.resolutionNotes || null,
    is_deleted: false,
    updated_at: new Date().toISOString(),
  };
}

export function mapDbToTicket(row: Record<string, any>): MaintenanceTicket {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    assetId: row.asset_id,
    assetName: row.asset_name,
    branchId: row.branch_id,
    location: row.location,
    reportedBy: row.reported_by,
    reportedEmail: row.reported_email || '',
    reportedDate: row.reported_date,
    priority: row.priority || 'medium',
    issueDescription: row.issue_description || '',
    status: row.status || 'open',
    assignedTechnician: row.assigned_technician || undefined,
    resolutionNotes: row.resolution_notes || undefined,
  };
}

export function mapBranchToDb(b: Branch): Record<string, any> {
  return {
    id: b.id,
    code: b.code,
    name: b.name,
    city: b.city,
    address: b.address || '',
    pic_name: b.picName || '',
    pic_phone: b.picPhone || '',
    is_active: true,
    updated_at: new Date().toISOString(),
  };
}

export function mapDbToBranch(row: Record<string, any>): Branch {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    city: row.city,
    address: row.address || '',
    picName: row.pic_name || '',
    picPhone: row.pic_phone || '',
  };
}

export function mapCategoryToDb(c: CategoryDefinition): Record<string, any> {
  return {
    id: c.id,
    code: c.code,
    name: c.name,
    description: c.description || '',
    color: c.color || '#475569',
    icon: c.icon || null,
    is_active: true,
  };
}

export function mapDbToCategory(row: Record<string, any>): CategoryDefinition {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description || '',
    color: row.color || '#475569',
    icon: row.icon || undefined,
  };
}

export function mapRoleToDb(r: RoleDefinition): Record<string, any> {
  return {
    id: r.id,
    name: r.name,
    label: r.label,
    description: r.description || '',
    permissions: r.permissions || [],
    is_system: Boolean(r.isSystem),
  };
}

export function mapDbToRole(row: Record<string, any>): RoleDefinition {
  return {
    id: row.id,
    name: row.name,
    label: row.label,
    description: row.description || '',
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
    isSystem: Boolean(row.is_system),
  };
}

export function mapUserToDb(u: UserProfile): Record<string, any> {
  return {
    id: u.id,
    name: u.name,
    email: u.email || '',
    role_id: u.roleId,
    role_label: u.roleLabel,
    department: u.department,
    branch_id: u.branchId,
    avatar_url: u.avatarUrl || '',
    is_active: true,
    updated_at: new Date().toISOString(),
  };
}

export function mapDbToUser(row: Record<string, any>): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email || '',
    roleId: row.role_id,
    roleLabel: row.role_label,
    department: row.department,
    branchId: row.branch_id,
    pin: '', // Protected: Hash is stored securely in ga_users_auth
    avatarUrl: row.avatar_url || '',
  };
}

// ==========================================
// ASSETS CRUD (ga_assets)
// ==========================================

export async function getAssetsHybrid(): Promise<Asset[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from(TABLE_GA_ASSETS)
        .select('*')
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('name');
      if (!error && data && data.length > 0) {
        const mapped = data.map(mapDbToAsset);
        saveStoredAssets(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase asset fetch notice (falling back to cache):', e);
    }
  }
  return getStoredAssets();
}

export async function saveAssetHybrid(asset: Asset): Promise<void> {
  // Update local cache immediately
  const localAssets = getStoredAssets();
  const index = localAssets.findIndex((a) => a.id === asset.id);
  const updated = index >= 0
    ? localAssets.map((a) => (a.id === asset.id ? asset : a))
    : [asset, ...localAssets];
  saveStoredAssets(updated);

  // Sync to Supabase ga_assets
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client
        .from(TABLE_GA_ASSETS)
        .upsert(mapAssetToDb(asset), { onConflict: 'id' });
      if (error) {
        console.warn('Supabase ga_assets upsert warning:', error.message);
      }
    } catch (e) {
      console.warn('Could not sync asset to Supabase immediately:', e);
    }
  }
}

export async function deleteAssetHybrid(assetId: string): Promise<void> {
  const localAssets = getStoredAssets().filter((a) => a.id !== assetId);
  saveStoredAssets(localAssets);

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client
        .from(TABLE_GA_ASSETS)
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', assetId);
      if (error) {
        console.warn('Supabase soft delete ga_assets warning:', error.message);
      }
    } catch (e) {
      console.warn('Could not soft delete asset on Supabase:', e);
    }
  }
}

// ==========================================
// TICKETS CRUD (ga_maintenance_tickets)
// ==========================================

export async function getTicketsHybrid(): Promise<MaintenanceTicket[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from(TABLE_GA_MAINTENANCE_TICKETS)
        .select('*')
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('reported_date', { ascending: false });
      if (!error && data && data.length > 0) {
        const mapped = data.map(mapDbToTicket);
        saveStoredTickets(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase ticket fetch notice:', e);
    }
  }
  return getStoredTickets();
}

export async function saveTicketHybrid(ticket: MaintenanceTicket): Promise<void> {
  const localTickets = getStoredTickets();
  const index = localTickets.findIndex((t) => t.id === ticket.id);
  const updated = index >= 0
    ? localTickets.map((t) => (t.id === ticket.id ? ticket : t))
    : [ticket, ...localTickets];
  saveStoredTickets(updated);

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client
        .from(TABLE_GA_MAINTENANCE_TICKETS)
        .upsert(mapTicketToDb(ticket), { onConflict: 'id' });
      if (error) {
        console.warn('Supabase ga_maintenance_tickets upsert warning:', error.message);
      }
    } catch (e) {
      console.warn('Could not sync ticket to Supabase immediately:', e);
    }
  }
}

// ==========================================
// BRANCHES CRUD (ga_branches)
// ==========================================

export async function getBranchesHybrid(): Promise<Branch[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from(TABLE_GA_BRANCHES)
        .select('*')
        .order('name');
      if (!error && data && data.length > 0) {
        const mapped = data.map(mapDbToBranch);
        saveStoredBranches(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase ga_branches fetch notice:', e);
    }
  }
  return getStoredBranches();
}

export async function saveBranchesHybrid(branches: Branch[]): Promise<void> {
  saveStoredBranches(branches);
  const client = getSupabaseClient();
  if (client && branches.length > 0) {
    try {
      const dbRows = branches.map(mapBranchToDb);
      const { error } = await client.from(TABLE_GA_BRANCHES).upsert(dbRows, { onConflict: 'id' });
      if (error) console.warn('Supabase ga_branches batch upsert warning:', error.message);
    } catch (e) {
      console.warn('Could not sync branches to Supabase:', e);
    }
  }
}

export async function saveBranchHybrid(branch: Branch): Promise<void> {
  const current = getStoredBranches();
  const index = current.findIndex((b) => b.id === branch.id);
  const updated = index >= 0
    ? current.map((b) => (b.id === branch.id ? branch : b))
    : [...current, branch];
  await saveBranchesHybrid(updated);
}

// ==========================================
// CATEGORIES CRUD (ga_categories)
// ==========================================

export async function getCategoriesHybrid(): Promise<CategoryDefinition[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from(TABLE_GA_CATEGORIES)
        .select('*')
        .order('name');
      if (!error && data && data.length > 0) {
        const mapped = data.map(mapDbToCategory);
        saveStoredCategories(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase ga_categories fetch notice:', e);
    }
  }
  return getStoredCategories();
}

export async function saveCategoriesHybrid(categories: CategoryDefinition[]): Promise<void> {
  saveStoredCategories(categories);
  const client = getSupabaseClient();
  if (client && categories.length > 0) {
    try {
      const dbRows = categories.map(mapCategoryToDb);
      const { error } = await client
        .from(TABLE_GA_CATEGORIES)
        .upsert(dbRows, { onConflict: 'id' });
      if (error) console.warn('Supabase ga_categories batch upsert warning:', error.message);
    } catch (e) {
      console.warn('Could not sync categories to Supabase:', e);
    }
  }
}

// ==========================================
// ROLES CRUD (ga_roles)
// ==========================================

export async function getRolesHybrid(): Promise<RoleDefinition[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from(TABLE_GA_ROLES)
        .select('*')
        .order('name');
      if (!error && data && data.length > 0) {
        const mapped = data.map(mapDbToRole);
        saveStoredRoles(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase ga_roles fetch notice:', e);
    }
  }
  return getStoredRoles();
}

export async function saveRolesHybrid(roles: RoleDefinition[]): Promise<void> {
  saveStoredRoles(roles);
  const client = getSupabaseClient();
  if (client && roles.length > 0) {
    try {
      const dbRows = roles.map(mapRoleToDb);
      const { error } = await client.from(TABLE_GA_ROLES).upsert(dbRows, { onConflict: 'id' });
      if (error) console.warn('Supabase ga_roles batch upsert warning:', error.message);
    } catch (e) {
      console.warn('Could not sync roles to Supabase:', e);
    }
  }
}

// ==========================================
// USERS CRUD (ga_users)
// ==========================================

export async function getUsersHybrid(): Promise<UserProfile[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from(TABLE_GA_USERS)
        .select('*')
        .order('name');
      if (!error && data && data.length > 0) {
        const localUsers = getStoredUsers();
        const mapped = data.map((row) => {
          const user = mapDbToUser(row);
          // Preserve local pin if present for local offline testing
          const localMatch = localUsers.find((l) => l.id === user.id);
          if (localMatch) user.pin = localMatch.pin;
          return user;
        });
        saveStoredUsers(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase ga_users fetch notice:', e);
    }
  }
  return getStoredUsers();
}

export async function saveUsersHybrid(users: UserProfile[]): Promise<void> {
  saveStoredUsers(users);
  const client = getSupabaseClient();
  if (client && users.length > 0) {
    try {
      const dbRows = users.map(mapUserToDb);
      const { error } = await client.from(TABLE_GA_USERS).upsert(dbRows, { onConflict: 'id' });
      if (error) console.warn('Supabase ga_users batch upsert warning:', error.message);
    } catch (e) {
      console.warn('Could not sync users to Supabase:', e);
    }
  }
}

// ==========================================
// REALTIME MULTI-USER / CROSS-BROWSER SYNC (ga_* tables)
// ==========================================

export function subscribeToSupabaseRealtime(
  onAssetChange?: (asset: Asset, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void,
  onTicketChange?: (ticket: MaintenanceTicket, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void,
  onBranchChange?: (branch: Branch, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void,
  onCategoryChange?: (category: CategoryDefinition, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const channelName = `ga_realtime_sync_${Date.now()}`;
    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE_GA_ASSETS },
        (payload: any) => {
          if (payload.new && onAssetChange) {
            const mapped = mapDbToAsset(payload.new);
            onAssetChange(mapped, payload.eventType as any);
          } else if (payload.old && payload.eventType === 'DELETE' && onAssetChange) {
            onAssetChange(mapDbToAsset(payload.old), 'DELETE');
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE_GA_MAINTENANCE_TICKETS },
        (payload: any) => {
          if (payload.new && onTicketChange) {
            const mapped = mapDbToTicket(payload.new);
            onTicketChange(mapped, payload.eventType as any);
          } else if (payload.old && payload.eventType === 'DELETE' && onTicketChange) {
            onTicketChange(mapDbToTicket(payload.old), 'DELETE');
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE_GA_BRANCHES },
        (payload: any) => {
          if (payload.new && onBranchChange) {
            const mapped = mapDbToBranch(payload.new);
            onBranchChange(mapped, payload.eventType as any);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE_GA_CATEGORIES },
        (payload: any) => {
          if (payload.new && onCategoryChange) {
            const mapped = mapDbToCategory(payload.new);
            onCategoryChange(mapped, payload.eventType as any);
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Could not subscribe to Supabase Realtime channel:', err);
    return null;
  }
}

// ==========================================
// MIGRATION HELPER (Safe, Order-Enforced Upsert into ga_* Tables)
// ==========================================

export async function migrateAllLocalDataToSupabase(
  onProgress?: (step: string, percent: number) => void
): Promise<{ success: boolean; message: string; counts: Record<string, number> }> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase belum terhubung. Silakan masukkan URL dan Anon Key di tab Koneksi.');
  }

  const counts: Record<string, number> = {
    branches: 0,
    roles: 0,
    categories: 0,
    users: 0,
    assets: 0,
    tickets: 0,
  };

  try {
    // 1. Branches (ga_branches)
    onProgress?.('Mengunggah data Cabang (public.ga_branches)...', 15);
    const branches = getStoredBranches();
    if (branches.length > 0) {
      const dbBranches = branches.map(mapBranchToDb);
      const { error } = await client.from(TABLE_GA_BRANCHES).upsert(dbBranches, { onConflict: 'id' });
      if (error) throw new Error(`Gagal mengunggah ga_branches: ${error.message} (Kode: ${error.code})`);
      counts.branches = branches.length;
    }

    // 2. Roles (ga_roles)
    onProgress?.('Mengunggah data Peran & Role (public.ga_roles)...', 30);
    const roles = getStoredRoles();
    if (roles.length > 0) {
      const dbRoles = roles.map(mapRoleToDb);
      const { error } = await client.from(TABLE_GA_ROLES).upsert(dbRoles, { onConflict: 'id' });
      if (error) throw new Error(`Gagal mengunggah ga_roles: ${error.message} (Kode: ${error.code})`);
      counts.roles = roles.length;
    }

    // 3. Categories (ga_categories)
    onProgress?.('Mengunggah data Kategori Fasilitas (public.ga_categories)...', 45);
    const categories = getStoredCategories();
    if (categories.length > 0) {
      const dbCategories = categories.map(mapCategoryToDb);
      const { error } = await client.from(TABLE_GA_CATEGORIES).upsert(dbCategories, { onConflict: 'id' });
      if (error) throw new Error(`Gagal mengunggah ga_categories: ${error.message} (Kode: ${error.code})`);
      counts.categories = categories.length;
    }

    // 4. Users (ga_users) & Kredensial PIN (ga_pin_credentials)
    onProgress?.('Mengunggah data Profil Pengguna (public.ga_users)...', 60);
    const users = getStoredUsers();
    if (users.length > 0) {
      const dbUsers = users.map(mapUserToDb);
      const { error } = await client.from(TABLE_GA_USERS).upsert(dbUsers, { onConflict: 'id' });
      if (error) throw new Error(`Gagal mengunggah ga_users: ${error.message} (Kode: ${error.code})`);
      counts.users = users.length;

      // Inisialisasi hash PIN di ga_pin_credentials secara aman melalui RPC (tanpa mengekspos PIN di public.ga_users)
      for (const u of users) {
        if (u.pin && u.pin.length === 6) {
          try {
            await client.rpc('rpc_set_user_pin', { p_user_id: u.id, p_pin: u.pin });
          } catch (pinErr) {
            console.warn(`Pemberitahuan: Registrasi PIN cloud untuk ${u.name} ditunda:`, pinErr);
          }
        }
      }
    }

    // 5. Assets (ga_assets)
    onProgress?.('Mengunggah seluruh Inventaris Aset (public.ga_assets)...', 75);
    const assets = getStoredAssets();
    if (assets.length > 0) {
      const dbAssets = assets.map(mapAssetToDb);
      const { error } = await client.from(TABLE_GA_ASSETS).upsert(dbAssets, { onConflict: 'id' });
      if (error) throw new Error(`Gagal mengunggah ga_assets: ${error.message} (Kode: ${error.code})`);
      counts.assets = assets.length;
    }

    // 6. Maintenance Tickets (ga_maintenance_tickets)
    onProgress?.('Mengunggah data Tiket Perbaikan (public.ga_maintenance_tickets)...', 90);
    const tickets = getStoredTickets();
    if (tickets.length > 0) {
      const dbTickets = tickets.map(mapTicketToDb);
      const { error } = await client.from(TABLE_GA_MAINTENANCE_TICKETS).upsert(dbTickets, { onConflict: 'id' });
      if (error) throw new Error(`Gagal mengunggah ga_maintenance_tickets: ${error.message} (Kode: ${error.code})`);
      counts.tickets = tickets.length;
    }

    // 7. Settings & Email Logs (Optional / Non-blocking)
    try {
      const settings = getStoredEmailSettings();
      if (settings) {
        await client.from(TABLE_GA_EMAIL_SETTINGS).upsert({
          id: 'default_settings',
          enabled: settings.enabled,
          primary_email: settings.primaryEmail,
          additional_emails: settings.additionalEmails || [],
          alert_7_days: settings.alert7Days,
          alert_3_days: settings.alert3Days,
          alert_due_day: settings.alertDueDay,
          alert_overdue: settings.alertOverdue,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      }

      const logs = getStoredEmailLogs();
      if (logs && logs.length > 0) {
        await client.from(TABLE_GA_EMAIL_LOGS).upsert(
          logs.map((l) => ({
            id: l.id,
            timestamp: l.timestamp,
            recipient: l.recipient,
            subject: l.subject,
            asset_code: l.assetCode || null,
            asset_name: l.assetName || null,
            days_remaining: l.daysRemaining !== undefined ? l.daysRemaining : null,
            trigger_type: l.triggerType || 'manual',
            status: l.status || 'sent',
            preview_body: l.previewBody || null,
          })),
          { onConflict: 'id' }
        );
      }
    } catch (e) {
      console.warn('Optional settings/logs sync notice:', e);
    }

    onProgress?.('Migrasi data ke 12 tabel ga_* selesai!', 100);

    return {
      success: true,
      message: 'Seluruh data lokal berhasil dimigrasikan ke tabel Supabase (prefix ga_*)!',
      counts,
    };
  } catch (err: any) {
    throw err;
  }
}
