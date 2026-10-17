/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SystemRoleType = 'full_admin' | 'ga_manager' | 'ga_staff' | 'technician' | 'employee_viewer' | string;

export type PermissionKey =
  | 'view_assets'
  | 'create_assets'
  | 'edit_assets'
  | 'delete_assets'
  | 'log_maintenance'
  | 'upload_documents'
  | 'manage_barcodes'
  | 'manage_branches'
  | 'manage_categories'
  | 'email_notifications'
  | 'export_reports'
  | 'manage_backups'
  | 'manage_users';

export interface RoleDefinition {
  id: string;
  name: string;
  label: string;
  description: string;
  permissions: PermissionKey[];
  isSystem: boolean;
}

export interface Branch {
  id: string;
  code: string; // e.g. 'RAD', 'HO-JKT', 'SBY', 'BDG'
  name: string; // e.g. 'Cabang RAD', 'Kantor Pusat Jakarta'
  city: string;
  address: string;
  picName: string;
  picPhone: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleLabel: string;
  department: string;
  branchId: string;
  pin: string; // 6-digit access PIN e.g. '199199'
  avatarUrl: string;
}

export interface CategoryDefinition {
  id: string; // e.g. 'hvac', 'power_genset', 'fire_safety', or custom
  code: string; // e.g. 'AC/HVAC', 'GEN', 'APAR', 'NET'
  name: string; // e.g. 'HVAC / Pendingin Ruangan (AC)'
  description: string;
  color?: string;
  icon?: string;
  key?: string;
  label?: string;
}

export type AssetCategory = 
  | 'hvac' 
  | 'power_genset' 
  | 'fire_safety' 
  | 'elevator' 
  | 'it_network' 
  | 'office_facility' 
  | 'vehicle' 
  | 'plumbing'
  | string;

export type AssetStatus = 
  | 'optimal' 
  | 'service_due' 
  | 'maintenance_in_progress' 
  | 'critical_overdue' 
  | 'decommissioned';

export type MaintenanceFrequency = 
  | 'weekly' 
  | 'biweekly' 
  | 'monthly' 
  | 'quarterly' 
  | 'biannually' 
  | 'annually' 
  | 'custom';

export interface AssetDocument {
  id: string;
  title: string;
  type: 'manual' | 'warranty' | 'spk_invoice' | 'sop' | 'inspection_photo';
  uploadDate: string;
  fileSize: string;
  encrypted: boolean;
  dataUri?: string;
  description?: string;
}

export interface MaintenanceLog {
  id: string;
  date: string;
  type: 'routine_preventive' | 'corrective_repair' | 'emergency_call' | 'calibration';
  technicianName: string;
  vendorCompany: string;
  cost: number;
  description: string;
  partsReplaced: string[];
  conditionBefore: string;
  conditionAfter: string;
  verifiedBy: string;
  status: 'completed' | 'in_progress' | 'scheduled';
  receiptAttached?: boolean;
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  branchId: string; // Associated office branch
  category: AssetCategory;
  location: string;
  brandModel: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyExpiry: string;
  status: AssetStatus;
  healthScore: number; // 0 - 100
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  frequency: MaintenanceFrequency;
  vendor: string;
  vendorContact: string;
  assignedStaff: string;
  estimatedCost: number;
  actualCostTotal: number;
  photoUrl?: string;
  customBarcodeImage?: string; // Custom barcode image uploaded by user
  notes: string;
  documents: AssetDocument[];
  maintenanceHistory: MaintenanceLog[];
}

export interface MaintenanceTicket {
  id: string;
  ticketNumber: string;
  assetId: string;
  assetName: string;
  branchId: string;
  location: string;
  reportedBy: string;
  reportedEmail: string;
  reportedDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  issueDescription: string;
  status: 'open' | 'in_review' | 'assigned' | 'resolved' | 'closed';
  assignedTechnician?: string;
  resolutionNotes?: string;
}

export interface EmailNotificationLog {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  assetCode: string;
  assetName: string;
  daysRemaining: number;
  triggerType: '7_days_alert' | '3_days_alert' | 'due_today' | 'overdue_escalation' | 'manual_test' | 'gmail_direct';
  status: 'delivered' | 'simulated' | 'sent';
  previewBody: string;
}

export interface SystemBackupRecord {
  id: string;
  timestamp: string;
  assetCount: number;
  logCount: number;
  encrypted: boolean;
  checksum: string;
  sizeKb: number;
  autoScheduled: boolean;
}

export interface EmailNotificationSettings {
  enabled: boolean;
  primaryEmail: string;
  additionalEmails: string[];
  alert7Days: boolean;
  alert3Days: boolean;
  alertDueDay: boolean;
  alertOverdue: boolean;
  autoCheckIntervalMinutes: number;
  lastCheckedTime?: string;
}
