/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Asset, Branch, CategoryDefinition, MaintenanceTicket, RoleDefinition, UserProfile } from '../types';
import { getSupabaseClient } from './supabaseClient';
import {
  getStoredAssets,
  getStoredBranches,
  getStoredCategories,
  getStoredRoles,
  getStoredTickets,
  getStoredUsers,
  saveStoredAssets,
  saveStoredBranches,
  saveStoredCategories,
  saveStoredRoles,
  saveStoredTickets,
  saveStoredUsers,
} from './storage';

/**
 * Maps camelCase frontend Asset to snake_case database schema
 */
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
    purchase_date: asset.purchaseDate || null,
    warranty_expiry: asset.warrantyExpiry || null,
    status: asset.status,
    health_score: asset.healthScore,
    last_maintenance_date: asset.lastMaintenanceDate || null,
    next_maintenance_date: asset.nextMaintenanceDate,
    frequency: asset.frequency,
    vendor: asset.vendor || null,
    vendor_contact: asset.vendorContact || null,
    assigned_staff: asset.assignedStaff || null,
    estimated_cost: asset.estimatedCost || 0,
    actual_cost_total: asset.actualCostTotal || 0,
    photo_url: asset.photoUrl || null,
    custom_barcode_image: asset.customBarcodeImage || null,
    notes: asset.notes || '',
    documents: asset.documents || [],
    maintenance_history: asset.maintenanceHistory || [],
    updated_at: new Date().toISOString(),
  };
}

/**
 * Maps snake_case database record to camelCase frontend Asset
 */
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
    status: row.status,
    healthScore: Number(row.health_score) || 100,
    lastMaintenanceDate: row.last_maintenance_date || '',
    nextMaintenanceDate: row.next_maintenance_date,
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

/**
 * Maps camelCase ticket to database
 */
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
    reported_date: ticket.reportedDate,
    priority: ticket.priority,
    issue_description: ticket.issueDescription,
    status: ticket.status,
    assigned_technician: ticket.assignedTechnician || null,
    resolution_notes: ticket.resolutionNotes || null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Maps database record to frontend ticket
 */
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

/**
 * Maps Branch to database record
 */
export function mapBranchToDb(b: Branch): Record<string, any> {
  return {
    id: b.id,
    code: b.code,
    name: b.name,
    city: b.city,
    address: b.address || '',
    pic_name: b.picName || '',
    pic_phone: b.picPhone || '',
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

/**
 * Maps Category to database record
 */
export function mapCategoryToDb(c: CategoryDefinition): Record<string, any> {
  return {
    id: c.id,
    code: c.code,
    name: c.name,
    description: c.description || '',
    color: c.color || '#475569',
    icon: c.icon || null,
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

/**
 * Fetch all assets from Supabase or fallback to localStorage
 */
export async function getAssetsHybrid(): Promise<Asset[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('assets').select('*').order('name');
      if (!error && data && data.length > 0) {
        const mapped = data.map(mapDbToAsset);
        // Cache to localStorage for offline readiness
        saveStoredAssets(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, using local storage cache:', e);
    }
  }
  return getStoredAssets();
}

/**
 * Save single asset to Supabase & localStorage
 */
export async function saveAssetHybrid(asset: Asset): Promise<void> {
  const localAssets = getStoredAssets();
  const index = localAssets.findIndex((a) => a.id === asset.id);
  const updated = index >= 0
    ? localAssets.map((a) => (a.id === asset.id ? asset : a))
    : [asset, ...localAssets];
  
  saveStoredAssets(updated);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('assets').upsert(mapAssetToDb(asset), { onConflict: 'id' });
    } catch (e) {
      console.warn('Could not sync asset to Supabase immediately:', e);
    }
  }
}

/**
 * Migrates all current local data to Supabase in a safe, non-destructive upsert
 */
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
    users: 0,
    categories: 0,
    assets: 0,
    tickets: 0,
  };

  try {
    // 1. Branches
    onProgress?.('Mengunggah data Cabang...', 15);
    const branches = getStoredBranches();
    if (branches.length > 0) {
      const dbBranches = branches.map(mapBranchToDb);
      const { error } = await client.from('branches').upsert(dbBranches, { onConflict: 'id' });
      if (error) throw new Error(`Gagal mengunggah branches: ${error.message}`);
      counts.branches = branches.length;
    }

    // 2. Roles
    onProgress?.('Mengunggah data Peran & Role...', 30);
    const roles = getStoredRoles();
    if (roles.length > 0) {
      const dbRoles = roles.map((r) => ({
        id: r.id,
        name: r.name,
        label: r.label,
        description: r.description,
        permissions: r.permissions,
        is_system: r.isSystem,
      }));
      const { error } = await client.from('roles').upsert(dbRoles, { onConflict: 'id' });
      if (error) throw new Error(`Gagal mengunggah roles: ${error.message}`);
      counts.roles = roles.length;
    }

    // 3. Categories
    onProgress?.('Mengunggah data Kategori Fasilitas...', 45);
    const categories = getStoredCategories();
    if (categories.length > 0) {
      const dbCategories = categories.map(mapCategoryToDb);
      const { error } = await client.from('categories').upsert(dbCategories, { onConflict: 'id' });
      if (error) throw new Error(`Gagal mengunggah categories: ${error.message}`);
      counts.categories = categories.length;
    }

    // 4. Users
    onProgress?.('Mengunggah data Pengguna...', 60);
    const users = getStoredUsers();
    if (users.length > 0) {
      const dbUsers = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email || '',
        role_id: u.roleId,
        role_label: u.roleLabel,
        department: u.department,
        branch_id: u.branchId,
        pin: u.pin,
        avatar_url: u.avatarUrl || '',
      }));
      const { error } = await client.from('users').upsert(dbUsers, { onConflict: 'id' });
      if (error) throw new Error(`Gagal mengunggah users: ${error.message}`);
      counts.users = users.length;
    }

    // 5. Assets
    onProgress?.('Mengunggah seluruh Inventaris Aset...', 80);
    const assets = getStoredAssets();
    if (assets.length > 0) {
      const dbAssets = assets.map(mapAssetToDb);
      const { error } = await client.from('assets').upsert(dbAssets, { onConflict: 'id' });
      if (error) throw new Error(`Gagal mengunggah assets: ${error.message}`);
      counts.assets = assets.length;
    }

    // 6. Tickets
    onProgress?.('Mengunggah data Tiket Perbaikan...', 95);
    const tickets = getStoredTickets();
    if (tickets.length > 0) {
      const dbTickets = tickets.map(mapTicketToDb);
      const { error } = await client.from('maintenance_tickets').upsert(dbTickets, { onConflict: 'id' });
      if (error) throw new Error(`Gagal mengunggah tickets: ${error.message}`);
      counts.tickets = tickets.length;
    }

    onProgress?.('Migrasi data selesai!', 100);

    return {
      success: true,
      message: 'Seluruh data lokal berhasil dimigrasikan ke Supabase Cloud!',
      counts,
    };
  } catch (err: any) {
    throw err;
  }
}
