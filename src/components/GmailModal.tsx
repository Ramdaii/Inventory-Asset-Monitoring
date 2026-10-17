/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Asset, Branch, EmailNotificationLog, UserProfile } from '../types';
import {
  googleSignIn,
  googleLogout,
  getAccessToken,
  initAuth,
} from '../utils/googleAuth';
import {
  fetchGmailProfile,
  sendGmailMessage,
  listGmailMessages,
  GmailProfile,
  GmailMessageItem,
} from '../utils/gmailApi';
import { generateEmailTemplate, getDaysRemaining } from '../utils/notificationEngine';
import { User } from 'firebase/auth';
import {
  Mail,
  X,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Inbox,
  LogOut,
  Sparkles,
  Search,
  Building2,
  ShieldCheck,
  Clock,
  ArrowLeft,
  FileText,
  UserCheck,
} from 'lucide-react';

interface GmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  branches: Branch[];
  currentUser: UserProfile;
  onLogAdded?: (newLog: EmailNotificationLog) => void;
}

export const GmailModal: React.FC<GmailModalProps> = ({
  isOpen,
  onClose,
  assets,
  branches,
  currentUser,
  onLogAdded,
}) => {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [gmailProfile, setGmailProfile] = useState<GmailProfile | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'compose' | 'inbox' | 'batch'>('compose');

  // Compose State
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);

  // Mandatory User Confirmation Modal for Destructive/Mutating operations
  const [showConfirmSend, setShowConfirmSend] = useState(false);
  const [confirmPendingPayload, setConfirmPendingPayload] = useState<{
    to: string;
    subject: string;
    body: string;
  } | null>(null);

  // Inbox / Messages State
  const [messages, setMessages] = useState<GmailMessageItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('subject:Pemeliharaan OR subject:GA OR subject:Inventaris');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageItem | null>(null);

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Listen to Google Auth state
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = initAuth(
      async (user, token) => {
        setGoogleUser(user);
        try {
          const profile = await fetchGmailProfile();
          setGmailProfile(profile);
          // Pre-load recent messages
          loadMessages('subject:Pemeliharaan OR subject:GA OR subject:Inventaris');
        } catch (err: any) {
          console.warn('Could not fetch Gmail profile automatically:', err);
        }
      },
      () => {
        setGoogleUser(null);
        setGmailProfile(null);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        const profile = await fetchGmailProfile();
        setGmailProfile(profile);
        showToast(`Berhasil terhubung ke akun Gmail: ${result.user.email}`);
        loadMessages(searchQuery);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setAuthError(err.message || 'Gagal login dengan akun Google. Periksa koneksi internet.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await googleLogout();
      setGoogleUser(null);
      setGmailProfile(null);
      setMessages([]);
      showToast('Berhasil keluar dari akun Google Workspace.');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  const loadMessages = async (queryToSearch: string) => {
    const token = await getAccessToken();
    if (!token) return;

    setIsLoadingMessages(true);
    try {
      const list = await listGmailMessages(queryToSearch, 12);
      setMessages(list);
    } catch (err: any) {
      console.error('Failed to load Gmail messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Quick fill form from an Asset
  const handleSelectAssetPreset = (assetId: string) => {
    setSelectedAssetId(assetId);
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return;

    const daysRemaining = getDaysRemaining(asset.nextMaintenanceDate, '2026-10-14');
    const recipient = asset.vendorContact.includes('@')
      ? asset.vendorContact
      : 'pic.fasilitas@perusahaan.com';

    const template = generateEmailTemplate(asset, daysRemaining, recipient);
    setToEmail(recipient);
    setSubject(template.subject);
    setBody(template.body);
  };

  // Predefined templates
  const applyTemplate = (type: 'spk' | 'urgent' | 'reminder') => {
    const targetAsset = assets.find((a) => a.id === selectedAssetId) || assets[0];
    if (!targetAsset) return;

    if (type === 'spk') {
      setSubject(`[SPK KERJA] Permintaan Servis Fasilitas: ${targetAsset.code} - ${targetAsset.name}`);
      setBody(`Yth. Pimpinan ${targetAsset.vendor},

Sehubungan dengan jadwal perawatan rutin fasilitas operasional kantor, bersama ini kami sampaikan Surat Perintah Kerja (SPK) Servis:

Aset / Fasilitas : ${targetAsset.name} (${targetAsset.code})
Lokasi Gedung    : ${targetAsset.location}
Jadwal Pekerjaan : ${targetAsset.nextMaintenanceDate}
Estimasi Biaya   : Rp ${targetAsset.estimatedCost.toLocaleString('id-ID')}

Mohon konfirmasi kesiapan teknisi dan daftar personel yang akan ditugaskan untuk penerbitan izin masuk gedung (Security Work Permit).

Hormat kami,
Divisi General Affairs`);
    } else if (type === 'urgent') {
      setSubject(`[URGENT ESKALASI] Kendala Kerusakan Fasilitas GA: ${targetAsset.name}`);
      setBody(`Yth. Tim Terkait / Vendor Rekanan,

Kami menginformasikan adanya kendala kritis yang memerlukan penanganan darurat pada:
• Fasilitas: ${targetAsset.name} (${targetAsset.code})
• Lokasi: ${targetAsset.location}
• Status: Memerlukan perbaikan segera di lokasi.

Mohon segera menghubungi Staf GA bertugas (${targetAsset.assignedStaff}) untuk penanganan teknis.

Terima kasih.`);
    } else {
      handleSelectAssetPreset(targetAsset.id);
    }
  };

  // Trigger User Confirmation Dialog before sending
  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim() || !subject.trim() || !body.trim()) {
      showToast('Lengkapi penerima, subjek, dan isi pesan email.', 'error');
      return;
    }

    setConfirmPendingPayload({
      to: toEmail.trim(),
      subject: subject.trim(),
      body: body.trim(),
    });
    setShowConfirmSend(true);
  };

  // Execute sending after explicit user confirmation
  const handleConfirmSendExecute = async () => {
    if (!confirmPendingPayload) return;
    setIsSending(true);
    setShowConfirmSend(false);

    try {
      const res = await sendGmailMessage({
        to: confirmPendingPayload.to,
        subject: confirmPendingPayload.subject,
        body: confirmPendingPayload.body,
        from: googleUser?.email || undefined,
      });

      showToast(`Email berhasil dikirim langsung via Gmail! (ID: ${res.id.substring(0, 8)}...)`);

      // Add to audit log
      if (onLogAdded) {
        const targetAsset = assets.find((a) => a.id === selectedAssetId);
        const newLog: EmailNotificationLog = {
          id: `gmail-${Date.now()}`,
          timestamp: new Date().toISOString(),
          recipient: confirmPendingPayload.to,
          subject: confirmPendingPayload.subject,
          assetCode: targetAsset ? targetAsset.code : 'GMAIL-DIRECT',
          assetName: targetAsset ? targetAsset.name : confirmPendingPayload.subject,
          daysRemaining: targetAsset ? getDaysRemaining(targetAsset.nextMaintenanceDate, '2026-10-14') : 0,
          triggerType: 'gmail_direct',
          status: 'sent',
          previewBody: confirmPendingPayload.body,
        };
        onLogAdded(newLog);
      }

      // Reset form
      setSubject('');
      setBody('');
      setSelectedAssetId('');
      // Reload inbox / sent messages
      loadMessages(searchQuery);
    } catch (err: any) {
      console.error('Failed to send email:', err);
      showToast(err.message || 'Gagal mengirim email via Gmail.', 'error');
    } finally {
      setIsSending(false);
      setConfirmPendingPayload(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-950 text-base leading-tight flex items-center gap-2">
                  <span>Gmail Workspace Hub</span>
                  <span className="text-[10px] font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                    Google OAuth Resmi
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Kirim notifikasi jadwal, SPK vendor, dan eskalasi langsung dari akun Gmail Anda
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div
            className={`mx-6 mt-3 px-3.5 py-2 rounded-lg text-xs flex items-center gap-2 border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </div>
        )}

        {/* Google Authentication Status Card */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50/80 border-b border-slate-200 shrink-0">
          {!googleUser ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Hubungkan Akun Google Anda untuk Mengaktifkan Gmail API
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Kirim email resmi langsung atas nama Anda dengan izin aman melalui Google Workspace.
                  </p>
                </div>
              </div>

              {/* Official "Sign in with Google" Button Style */}
              <button
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="flex items-center gap-2.5 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 active:bg-slate-100 text-xs font-semibold shadow-2xs transition-colors shrink-0 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>{isAuthenticating ? 'Menghubungkan...' : 'Sign in with Google'}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-emerald-200 rounded-xl shadow-2xs">
              <div className="flex items-center gap-3">
                {googleUser.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt={googleUser.displayName || 'Google'}
                    className="w-9 h-9 rounded-full object-cover border border-emerald-300"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                    {(googleUser.email || 'G').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {googleUser.displayName || 'Google Workspace User'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Gmail Aktif
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600">
                    {googleUser.email}
                    {gmailProfile && (
                      <span className="text-slate-400 font-sans ml-2">
                        · Total Pesan: <strong>{gmailProfile.messagesTotal}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadMessages(searchQuery)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Sinkronisasi Ulang Gmail"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sinkron</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                  title="Keluar dari akun Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          )}

          {authError && (
            <div className="mt-2 text-xs text-rose-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{authError}</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 sm:px-6 pt-3 border-b border-slate-200 bg-white shrink-0">
          <button
            onClick={() => setActiveTab('compose')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'compose'
                ? 'border-slate-900 text-slate-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Email (Compose)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('inbox');
              if (googleUser && messages.length === 0) {
                loadMessages(searchQuery);
              }
            }}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'inbox'
                ? 'border-slate-900 text-slate-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Kotak Pesan Gmail</span>
            {messages.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] font-mono text-slate-700">
                {messages.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/50">
          {activeTab === 'compose' && (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Presets & Quick Fill */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Pilih Template & Isi Otomatis Fasilitas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Pilih Fasilitas / Aset Kantor:
                    </label>
                    <select
                      value={selectedAssetId}
                      onChange={(e) => handleSelectAssetPreset(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="">-- Pilih Fasilitas untuk Autofill --</option>
                      {assets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} - {a.name} ({a.location})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Template Pesan GA Cepat:
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => applyTemplate('reminder')}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                      >
                        Jadwal Servis
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate('spk')}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-medium transition-colors"
                      >
                        SPK Vendor
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate('urgent')}
                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-medium transition-colors"
                      >
                        Urgent Kerusakan
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compose Form */}
              <form onSubmit={handleInitiateSend} className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kepada (Alamat Email Penerima):
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contoh: vendor.rekanan@service.com atau pic.ga@kantor.com"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subjek Email:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Subjek email resmi..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Isi Pesan Email:
                  </label>
                  <textarea
                    rows={8}
                    required
                    placeholder="Tuliskan pesan resmi di sini..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[11px] text-slate-500">
                    Dikirim dengan akun: <strong>{googleUser?.email || 'Belum Login'}</strong>
                  </span>

                  <button
                    type="submit"
                    disabled={!googleUser || isSending}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? 'Mengirim...' : 'Kirim via Gmail API'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'inbox' && (
            <div className="space-y-4">
              {/* Search & Refresh */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Cari pesan di Gmail (contoh: subject:Pemeliharaan)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadMessages(searchQuery)}
                    className="text-xs px-2.5 py-1.5 w-full bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => loadMessages(searchQuery)}
                    disabled={!googleUser || isLoadingMessages}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessages ? 'animate-spin' : ''}`} />
                    <span>Cari / Refresh</span>
                  </button>
                </div>
              </div>

              {/* Messages List */}
              {!googleUser ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-700">Silakan login dengan akun Google terlebih dahulu</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Gunakan tombol 'Sign in with Google' di bagian atas untuk melihat pesan Gmail.
                  </p>
                </div>
              ) : isLoadingMessages ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Memuat pesan dari Gmail API...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-800">Tidak ada pesan yang cocok dengan filter pencarian</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Coba ganti kata kunci pencarian atau kirim email baru dari tab Compose.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMessage(m)}
                      className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-900 truncate">
                              {m.from}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {m.date ? new Date(m.date).toLocaleDateString('id-ID') : ''}
                            </span>
                          </div>
                          <h4 className="text-xs font-medium text-slate-800 mt-0.5 truncate">
                            {m.subject}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 font-sans">
                            {m.snippet}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message Detail Drawer */}
        {selectedMessage && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900 truncate">
                  Detail Pesan Gmail
                </h3>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Dari: </span>
                  <span className="font-semibold text-slate-900">{selectedMessage.from}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Subjek: </span>
                  <span className="font-semibold text-slate-900">{selectedMessage.subject}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Waktu: </span>
                  <span className="text-slate-700">{selectedMessage.date}</span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-medium block mb-1">Snippet Pesan:</span>
                  <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-sans text-xs leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.snippet}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MANDATORY Explicit Confirmation Dialog for Sending Email (Mutating User Data) */}
        {showConfirmSend && confirmPendingPayload && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Konfirmasi Pengiriman Email Resmi
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Akan dikirim langsung dari akun Gmail Anda ({googleUser?.email})
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5 font-mono">
                <div>
                  <span className="text-slate-500 font-sans">Penerima: </span>
                  <strong className="text-slate-900">{confirmPendingPayload.to}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-sans">Subjek: </span>
                  <strong className="text-slate-900">{confirmPendingPayload.subject}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-sans">Jumlah Karakter: </span>
                  <span className="text-slate-700">{confirmPendingPayload.body.length} karakter</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-normal">
                Apakah Anda yakin ingin mengirimkan email ini sekarang melalui Google Workspace API?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmSend(false);
                    setConfirmPendingPayload(null);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSendExecute}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ya, Kirim Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
