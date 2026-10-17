/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  testSupabaseConnection,
  SupabaseConfig,
} from '../utils/supabaseClient';
import { migrateAllLocalDataToSupabase } from '../utils/supabaseStorage';
import {
  Database,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UploadCloud,
  FileCode,
  Copy,
  Check,
  ShieldCheck,
  ArrowLeft,
  Server,
  Info,
} from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataSynced?: () => void;
}

const SUPABASE_SCHEMA_SQL = `-- ========================================================
-- ROTARY AUTO - GA-OPS COMMANDER SUPABASE DATABASE SCHEMA
-- Skrip DDL Non-Destruktif (CREATE TABLE IF NOT EXISTS)
-- ========================================================

-- 1. Tabel Cabang (Branches)
CREATE TABLE IF NOT EXISTS public.branches (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT,
    pic_name TEXT,
    pic_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Role & Perizinan (Roles)
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel Profil Pengguna (Users)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    role_id TEXT REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    role_label TEXT NOT NULL,
    department TEXT NOT NULL,
    branch_id TEXT REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    pin TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel Kategori Fasilitas (Categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabel Utama Aset & Inventaris (Assets)
CREATE TABLE IF NOT EXISTS public.assets (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    branch_id TEXT NOT NULL REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    branch_name TEXT NOT NULL,
    location TEXT NOT NULL,
    brand_model TEXT,
    serial_number TEXT,
    status TEXT NOT NULL DEFAULT 'optimal',
    health_score INTEGER NOT NULL DEFAULT 100,
    last_maintenance_date DATE,
    next_maintenance_date DATE NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'monthly',
    vendor TEXT,
    vendor_contact TEXT,
    assigned_staff TEXT,
    estimated_cost NUMERIC(15,2) DEFAULT 0,
    actual_cost_total NUMERIC(15,2) DEFAULT 0,
    photo_url TEXT,
    custom_barcode_image TEXT,
    notes TEXT,
    documents JSONB DEFAULT '[]'::jsonb,
    maintenance_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assets_branch ON public.assets(branch_id);
CREATE INDEX IF NOT EXISTS idx_assets_code ON public.assets(code);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);

-- 6. Tabel Tiket Perbaikan Fasilitas (Maintenance Tickets)
CREATE TABLE IF NOT EXISTS public.maintenance_tickets (
    id TEXT PRIMARY KEY,
    ticket_number TEXT NOT NULL UNIQUE,
    asset_id TEXT NOT NULL REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    asset_name TEXT NOT NULL,
    branch_id TEXT NOT NULL REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    location TEXT NOT NULL,
    reported_by TEXT NOT NULL,
    reported_email TEXT,
    reported_date DATE NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    issue_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    assigned_technician TEXT,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Aktifkan Row Level Security (RLS)
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;

-- Buat Kebijakan Akses (RLS) Aman
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow read access') THEN
        CREATE POLICY "Allow read access" ON public.branches FOR SELECT USING (true);
        CREATE POLICY "Allow read access" ON public.roles FOR SELECT USING (true);
        CREATE POLICY "Allow read access" ON public.users FOR SELECT USING (true);
        CREATE POLICY "Allow read access" ON public.categories FOR SELECT USING (true);
        CREATE POLICY "Allow read access" ON public.assets FOR SELECT USING (true);
        CREATE POLICY "Allow read access" ON public.maintenance_tickets FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow mutate for authenticated client') THEN
        CREATE POLICY "Allow mutate for authenticated client" ON public.branches FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Allow mutate for authenticated client" ON public.roles FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Allow mutate for authenticated client" ON public.users FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Allow mutate for authenticated client" ON public.categories FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Allow mutate for authenticated client" ON public.assets FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Allow mutate for authenticated client" ON public.maintenance_tickets FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
`;

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onDataSynced,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'migration' | 'sql'>('config');

  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [enabled, setEnabled] = useState(false);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<{ step: string; percent: number }>({
    step: '',
    percent: 0,
  });
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    message: string;
    counts?: Record<string, number>;
  } | null>(null);

  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredSupabaseConfig();
      setUrl(stored.url);
      setAnonKey(stored.anonKey);
      setEnabled(stored.enabled);
      setTestResult(null);
      setMigrationResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    saveStoredSupabaseConfig({
      url: url.trim(),
      anonKey: anonKey.trim(),
      enabled,
    });
    setTestResult({
      success: true,
      message: 'Pengaturan koneksi Supabase berhasil disimpan di browser Anda.',
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(url, anonKey);
      setTestResult(res);
      if (res.success) {
        setEnabled(true);
        saveStoredSupabaseConfig({
          url: url.trim(),
          anonKey: anonKey.trim(),
          enabled: true,
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || 'Gagal menghubungi Supabase.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRunMigration = async () => {
    setIsMigrating(true);
    setMigrationResult(null);
    try {
      // Auto save first
      handleSaveConfig();
      const res = await migrateAllLocalDataToSupabase((step, percent) => {
        setMigrationProgress({ step, percent });
      });
      setMigrationResult(res);
      if (onDataSynced) onDataSynced();
    } catch (err: any) {
      setMigrationResult({
        success: false,
        message: err.message || 'Gagal melakukan migrasi data ke Supabase.',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
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
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-950 text-base leading-tight flex items-center gap-2">
                  <span>Supabase Cloud Integration</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    enabled && url
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {enabled && url ? 'Mode Hybrid Aktif' : 'Mode Offline LocalStorage'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Sinkronisasi database PostgreSQL Cloud dengan fallback Offline-First
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 sm:px-6 pt-3 border-b border-slate-200 bg-white shrink-0">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'border-slate-900 text-slate-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Koneksi & Pengaturan</span>
          </button>

          <button
            onClick={() => setActiveTab('migration')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'migration'
                ? 'border-slate-900 text-slate-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Migrasi & Sinkronisasi Data</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'sql'
                ? 'border-slate-900 text-slate-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Skrip SQL Database</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/50 space-y-4">
          {activeTab === 'config' && (
            <div className="max-w-xl mx-auto space-y-4">
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Keamanan Kredensial:</span> Masukkan hanya <strong>Supabase URL</strong> dan <strong>Anon/Public Key</strong>. Jangan pernah memasukkan <em>service_role secret key</em>. Kredensial disimpan secara aman di browser lokal Anda.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supabase Project URL:
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzcompany.supabase.co"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supabase Anon / Public Key:
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
                    />
                    <span>Aktifkan Sinkronisasi Supabase Cloud</span>
                  </label>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-medium">{testResult.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting || !url || !anonKey}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Menguji Koneksi...' : 'Uji Koneksi'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan Pengaturan</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'migration' && (
            <div className="max-w-xl mx-auto space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Migrasikan Seluruh Data Lokal ke Supabase
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mengunggah seluruh Cabang, Peran, Pengguna, Kategori, Aset Inventaris, dan Tiket yang ada di LocalStorage ke Supabase Cloud secara aman menggunakan metode non-destruktif (*upsert*).
                  </p>
                </div>

                {isMigrating && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{migrationProgress.step}</span>
                      <span>{migrationProgress.percent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full transition-all duration-300"
                        style={{ width: `${migrationProgress.percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {migrationResult && (
                  <div
                    className={`p-3.5 rounded-lg text-xs border space-y-2 ${
                      migrationResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {migrationResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{migrationResult.message}</span>
                    </div>

                    {migrationResult.counts && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-200 text-[11px] font-mono">
                        <div>Aset: <strong>{migrationResult.counts.assets}</strong></div>
                        <div>Cabang: <strong>{migrationResult.counts.branches}</strong></div>
                        <div>Tiket: <strong>{migrationResult.counts.tickets}</strong></div>
                        <div>Kategori: <strong>{migrationResult.counts.categories}</strong></div>
                        <div>Pengguna: <strong>{migrationResult.counts.users}</strong></div>
                        <div>Peran: <strong>{migrationResult.counts.roles}</strong></div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleRunMigration}
                    disabled={isMigrating || !url || !anonKey}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isMigrating ? 'Sedang Memigrasikan Data...' : 'Mulai Migrasi Data Sekarang'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Skrip DDL Database Supabase (PostgreSQL)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Jalankan skrip ini di <strong>SQL Editor Supabase Dashboard</strong> untuk membuat tabel jika belum ada.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Skrip SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[380px] border border-slate-800">
                  {SUPABASE_SCHEMA_SQL}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
