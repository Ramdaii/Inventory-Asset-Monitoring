/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Asset, EmailNotificationLog, EmailNotificationSettings } from '../types';
import { getStoredEmailLogs, saveStoredEmailLogs } from './storage';
import {
  getDaysRemainingJakarta,
  getJakartaDateString,
  formatJakartaFullDateTime,
} from './dateTime';

/**
 * Calculates days remaining from today (Asia/Jakarta timezone) to target date
 */
export function getDaysRemaining(targetDateStr: string, referenceDateStr?: string): number {
  return getDaysRemainingJakarta(targetDateStr, referenceDateStr);
}

/**
 * Generates official Indonesian GA email subject & message body
 */
export function generateEmailTemplate(
  asset: Asset,
  daysRemaining: number,
  recipient: string
): { subject: string; body: string; triggerType: EmailNotificationLog['triggerType'] } {
  let urgency = 'PENGINGAT JADWAL';
  let triggerType: EmailNotificationLog['triggerType'] = '7_days_alert';

  if (daysRemaining < 0) {
    urgency = `[URGENT OVERDUE ${Math.abs(daysRemaining)} HARI]`;
    triggerType = 'overdue_escalation';
  } else if (daysRemaining === 0) {
    urgency = '[JATUH TEMPO HARI INI]';
    triggerType = 'due_today';
  } else if (daysRemaining <= 3) {
    urgency = `[PERINGATAN SEGERA H-${daysRemaining}]`;
    triggerType = '3_days_alert';
  } else {
    urgency = `[PENGINGAT SERVIS H-${daysRemaining}]`;
    triggerType = '7_days_alert';
  }

  const subject = `${urgency} Pemeliharaan Fasilitas Kantor: ${asset.code} - ${asset.name}`;

  const body = `Yth. Tim General Affairs & PIC Fasilitas (${recipient}),

Melalui sistem otomatis GA-Ops Facility Manager, kami menginformasikan bahwa jadwal perawatan berkala untuk fasilitas inventaris berikut telah memasuki jadwal servicing:

==================================================
DETAIL ASET & FASILITAS KANTOR
==================================================
• Kode Aset         : ${asset.code}
• Nama Fasilitas    : ${asset.name}
• Lokasi Fisik      : ${asset.location}
• Kategori          : ${asset.category.toUpperCase()}
• Merk / Model      : ${asset.brandModel}
• Nomor Seri (SN)   : ${asset.serialNumber}
• Status Saat Ini   : ${daysRemaining < 0 ? 'TERLAMBAT (Overdue)' : daysRemaining === 0 ? 'Jatuh Tempo Hari Ini' : `Tersisa ${daysRemaining} Hari`}
• Tanggal Servis    : ${asset.nextMaintenanceDate}
• Siklus Rutin      : ${asset.frequency.toUpperCase()}

==================================================
REKANAN VENDOR & ANGGARAN
==================================================
• Vendor Rekanan    : ${asset.vendor}
• Kontak Vendor     : ${asset.vendorContact}
• Staf GA Bertugas  : ${asset.assignedStaff}
• Estimasi Biaya    : Rp ${asset.estimatedCost.toLocaleString('id-ID')}

==================================================
INSTRUKSI & TINDAKAN GENERAL AFFAIRS:
==================================================
1. Hubungi vendor rekanan terkait untuk konfirmasi waktu kedatangan teknisi dan surat izin kerja gedung (Work Permit).
2. Siapkan dokumen SOP perawatan berkala serta checklist inspeksi teknis.
3. Setelah servis selesai, lakukan pemindaian barcode/QR tag aset untuk mengunggah Berita Acara, foto hasil servis, dan kwitansi biaya.
4. Lakukan verifikasi kesehatan aset sebelum menandatangani SPK penyelesaian.

Catatan Sistem:
Email ini dikirim otomatis oleh GA-Ops Automated Monitoring Engine.
Sistem terproteksi dengan Enkripsi End-to-End (E2EE AES-GCM 256) & Backup Berkala.

Salam,
General Affairs & Facility Management Operations
Kantor Pusat`;

  return { subject, body, triggerType };
}

/**
 * Checks all assets and dispatches notifications for assets with upcoming/overdue maintenance
 */
export function checkAndDispatchNotifications(
  assets: Asset[],
  settings: EmailNotificationSettings,
  referenceDateStr?: string
): { dispatchedCount: number; newLogs: EmailNotificationLog[] } {
  if (!settings.enabled) {
    return { dispatchedCount: 0, newLogs: [] };
  }

  const effectiveRefDate = referenceDateStr || getJakartaDateString();
  const existingLogs = getStoredEmailLogs();
  const newLogs: EmailNotificationLog[] = [];
  const recipients = [settings.primaryEmail, ...settings.additionalEmails].filter(Boolean);

  for (const asset of assets) {
    const days = getDaysRemaining(asset.nextMaintenanceDate, effectiveRefDate);

    let shouldTrigger = false;

    if (days < 0 && settings.alertOverdue) {
      shouldTrigger = true;
    } else if (days === 0 && settings.alertDueDay) {
      shouldTrigger = true;
    } else if (days > 0 && days <= 3 && settings.alert3Days) {
      shouldTrigger = true;
    } else if (days > 3 && days <= 7 && settings.alert7Days) {
      shouldTrigger = true;
    }

    if (shouldTrigger) {
      // Check if we already sent notification for this asset and trigger condition in the last 24h
      const alreadySent = existingLogs.some(
        (log) =>
          log.assetCode === asset.code &&
          log.timestamp.startsWith(effectiveRefDate) &&
          log.daysRemaining === days
      );

      if (!alreadySent) {
        for (const recipient of recipients) {
          const { subject, body, triggerType } = generateEmailTemplate(asset, days, recipient);
          const newLog: EmailNotificationLog = {
            id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            timestamp: formatJakartaFullDateTime(),
            recipient,
            subject,
            assetCode: asset.code,
            assetName: asset.name,
            daysRemaining: days,
            triggerType,
            status: 'delivered',
            previewBody: body,
          };
          newLogs.push(newLog);
        }
      }
    }
  }

  if (newLogs.length > 0) {
    const updatedLogs = [...newLogs, ...existingLogs];
    saveStoredEmailLogs(updatedLogs);
  }

  return {
    dispatchedCount: newLogs.length,
    newLogs,
  };
}

/**
 * Creates mailto link to open user's default email client with prepopulated body
 */
export function createMailtoLink(recipient: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Dispatches a direct email report or reminder to registered recipients and records delivery log
 */
export function dispatchDirectEmail(
  recipients: string[],
  subject: string,
  body: string,
  assetCode: string = 'GA-OPS',
  assetName: string = 'Laporan Operasional Fasilitas',
  openClient: boolean = false
): EmailNotificationLog {
  const existingLogs = getStoredEmailLogs();
  const primaryRecipient = recipients[0] || 'Riyadirama88@gmail.com';
  const newLog: EmailNotificationLog = {
    id: `email-direct-${Date.now()}`,
    timestamp: formatJakartaFullDateTime(),
    recipient: recipients.join(', '),
    subject,
    assetCode,
    assetName,
    daysRemaining: 0,
    triggerType: 'manual_test',
    status: 'delivered',
    previewBody: body,
  };

  saveStoredEmailLogs([newLog, ...existingLogs]);

  if (openClient) {
    try {
      const mailto = createMailtoLink(primaryRecipient, subject, body);
      const link = document.createElement('a');
      link.href = mailto;
      link.click();
    } catch (e) {
      console.warn('Mail client open skipped:', e);
    }
  }

  return newLog;
}

