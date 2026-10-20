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
-- ROTARY AUTO - GA-OPS COMMANDER SUPABASE DATABASE SCHEMA (12 TABEL GA_*)
-- Skrip DDL Non-Destruktif & Keamanan Enterprise (PIN Auth, RLS & Realtime)
-- Menggunakan tabel aktual: ga_pin_credentials & ga_sessions
-- ========================================================

-- Aktifkan ekstensi enkripsi pgcrypto untuk hashing bcrypt PIN
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tabel Cabang (ga_branches)
CREATE TABLE IF NOT EXISTS public.ga_branches (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT,
    pic_name TEXT,
    pic_phone TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Role & Perizinan (ga_roles)
CREATE TABLE IF NOT EXISTS public.ga_roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel Profil Pengguna Publik (ga_users)
-- CATATAN KEAMANAN: PIN atau PIN Hash TIDAK PERNAH disimpan di tabel ini
CREATE TABLE IF NOT EXISTS public.ga_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    role_id TEXT NOT NULL REFERENCES public.ga_roles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    role_label TEXT NOT NULL,
    department TEXT NOT NULL,
    branch_id TEXT NOT NULL REFERENCES public.ga_branches(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel Kredensial PIN Internal (ga_pin_credentials)
CREATE TABLE IF NOT EXISTS public.ga_pin_credentials (
    user_id TEXT PRIMARY KEY REFERENCES public.ga_users(id) ON DELETE CASCADE,
    pin_hash TEXT NOT NULL,
    failed_attempts INTEGER DEFAULT 0 NOT NULL,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabel Sesi Pengguna Aktif (ga_sessions)
CREATE TABLE IF NOT EXISTS public.ga_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.ga_users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    is_revoked BOOLEAN DEFAULT false NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ga_sessions_token ON public.ga_sessions(token);
CREATE INDEX IF NOT EXISTS idx_ga_sessions_user ON public.ga_sessions(user_id);

-- 6. Tabel Percobaan Login & Audit Rate Limiting (ga_login_attempts)
CREATE TABLE IF NOT EXISTS public.ga_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    attempt_time TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    success BOOLEAN NOT NULL DEFAULT false,
    ip_address TEXT
);
CREATE INDEX IF NOT EXISTS idx_ga_login_attempts ON public.ga_login_attempts(user_id, attempt_time);

-- 7. Tabel Kategori Fasilitas (ga_categories)
CREATE TABLE IF NOT EXISTS public.ga_categories (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Tabel Utama Aset & Fasilitas (ga_assets)
CREATE TABLE IF NOT EXISTS public.ga_assets (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    branch_id TEXT NOT NULL REFERENCES public.ga_branches(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    location TEXT NOT NULL,
    brand_model TEXT,
    serial_number TEXT,
    purchase_date DATE,
    warranty_expiry DATE,
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
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ga_assets_branch ON public.ga_assets(branch_id);
CREATE INDEX IF NOT EXISTS idx_ga_assets_code ON public.ga_assets(code);
CREATE INDEX IF NOT EXISTS idx_ga_assets_status ON public.ga_assets(status);
CREATE INDEX IF NOT EXISTS idx_ga_assets_is_deleted ON public.ga_assets(is_deleted);

-- 9. Tabel Tiket Perbaikan Fasilitas (ga_maintenance_tickets)
CREATE TABLE IF NOT EXISTS public.ga_maintenance_tickets (
    id TEXT PRIMARY KEY,
    ticket_number TEXT NOT NULL UNIQUE,
    asset_id TEXT NOT NULL REFERENCES public.ga_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    asset_name TEXT NOT NULL,
    branch_id TEXT NOT NULL REFERENCES public.ga_branches(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    location TEXT NOT NULL,
    reported_by TEXT NOT NULL,
    reported_email TEXT,
    reported_date DATE NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    issue_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    assigned_technician TEXT,
    resolution_notes TEXT,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ga_tickets_branch ON public.ga_maintenance_tickets(branch_id);
CREATE INDEX IF NOT EXISTS idx_ga_tickets_asset ON public.ga_maintenance_tickets(asset_id);
CREATE INDEX IF NOT EXISTS idx_ga_tickets_status ON public.ga_maintenance_tickets(status);

-- 10. Tabel Log Notifikasi Email (ga_email_notification_logs)
CREATE TABLE IF NOT EXISTS public.ga_email_notification_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    asset_code TEXT,
    asset_name TEXT,
    days_remaining INTEGER,
    trigger_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    preview_body TEXT
);

-- 11. Tabel Pengaturan Notifikasi Email (ga_email_notification_settings)
CREATE TABLE IF NOT EXISTS public.ga_email_notification_settings (
    id TEXT PRIMARY KEY DEFAULT 'default_settings',
    enabled BOOLEAN DEFAULT true,
    primary_email TEXT NOT NULL,
    additional_emails JSONB DEFAULT '[]'::jsonb,
    alert_7_days BOOLEAN DEFAULT true,
    alert_3_days BOOLEAN DEFAULT true,
    alert_due_day BOOLEAN DEFAULT true,
    alert_overdue BOOLEAN DEFAULT true,
    auto_check_interval_minutes INTEGER DEFAULT 60,
    last_checked_time TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Tabel Riwayat Backup Cadangan (ga_system_backups)
CREATE TABLE IF NOT EXISTS public.ga_system_backups (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    asset_count INTEGER NOT NULL,
    log_count INTEGER NOT NULL,
    encrypted BOOLEAN DEFAULT true,
    checksum TEXT NOT NULL,
    size_kb NUMERIC(10,2) NOT NULL,
    auto_scheduled BOOLEAN DEFAULT false
);

-- ========================================================
-- PERMISSIONS & PRIVILEGES (MENGATASI ERROR 42501)
-- ========================================================

-- Berikan izin akses skema public ke role anon dan authenticated PostgREST
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Berikan hak akses tabel operasional (akses aktual dikontrol ketat oleh RLS di bawah)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE 
    public.ga_branches, 
    public.ga_roles, 
    public.ga_users, 
    public.ga_categories, 
    public.ga_assets, 
    public.ga_maintenance_tickets, 
    public.ga_email_notification_logs, 
    public.ga_email_notification_settings, 
    public.ga_system_backups 
TO anon, authenticated;

-- ISOLASI KETAT TABEL KREDENSIAL & SESI:
-- Tidak ada pengguna anon atau authenticated yang dapat SELECT/INSERT/UPDATE tabel ini secara langsung via REST API
REVOKE ALL ON TABLE public.ga_pin_credentials FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.ga_sessions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.ga_login_attempts FROM PUBLIC, anon, authenticated;

-- ========================================================
-- HELPER FUNCTIONS OTORISASI SERVER-SIDE
-- ========================================================

-- Helper: Ambil token sesi dari Header HTTP 'x-session-token'
CREATE OR REPLACE FUNCTION public.ga_get_session_token()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_headers JSON;
    v_token TEXT;
BEGIN
    BEGIN
        v_headers := current_setting('request.headers', true)::json;
        v_token := v_headers->>'x-session-token';
    EXCEPTION WHEN OTHERS THEN
        v_token := NULL;
    END;
    RETURN v_token;
END;
$$;

-- Helper: Validasi sesi aktif dan kembalikan profil pengguna
CREATE OR REPLACE FUNCTION public.ga_get_current_user_session()
RETURNS TABLE (
    user_id TEXT,
    role_id TEXT,
    role_name TEXT,
    branch_id TEXT,
    permissions JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_token TEXT;
BEGIN
    v_token := public.ga_get_session_token();
    IF v_token IS NULL OR v_token = '' THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        s.user_id,
        u.role_id,
        r.name AS role_name,
        u.branch_id,
        r.permissions
    FROM public.ga_sessions s
    JOIN public.ga_users u ON u.id = s.user_id
    JOIN public.ga_roles r ON r.id = u.role_id
    WHERE s.token = v_token
      AND s.is_revoked = false
      AND s.expires_at > now()
      AND u.is_active = true;
END;
$$;

-- Helper: Periksa izin role / permissions
CREATE OR REPLACE FUNCTION public.ga_has_permission(p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sess RECORD;
BEGIN
    SELECT * INTO v_sess FROM public.ga_get_current_user_session() LIMIT 1;
    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Super Admin & GA Admin selalu memiliki akses penuh
    IF v_sess.role_id = 'role-superadmin' OR v_sess.role_id = 'role-admin' OR v_sess.role_name = 'admin' OR v_sess.role_name = 'superadmin' THEN
        RETURN true;
    END IF;

    IF v_sess.permissions ? p_permission OR v_sess.permissions ? 'all' THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;

-- Helper: Periksa hak akses cabang
CREATE OR REPLACE FUNCTION public.ga_can_access_branch(p_branch_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sess RECORD;
BEGIN
    SELECT * INTO v_sess FROM public.ga_get_current_user_session() LIMIT 1;
    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Admin dapat mengakses semua cabang
    IF v_sess.role_id = 'role-superadmin' OR v_sess.role_id = 'role-admin' OR v_sess.role_name = 'admin' OR v_sess.role_name = 'superadmin' THEN
        RETURN true;
    END IF;

    RETURN (v_sess.branch_id = p_branch_id OR p_branch_id IS NULL OR v_sess.branch_id = 'all');
END;
$$;

-- ========================================================
-- RPC FUNCTIONS (PIN LOGIN & SESSION MANAGEMENT)
-- ========================================================

-- RPC: Verifikasi PIN & Buat Sesi Token (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.rpc_login_pin(
    p_user_id TEXT,
    p_pin TEXT,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_auth RECORD;
    v_user RECORD;
    v_new_token TEXT;
    v_expires_at TIMESTAMPTZ;
    v_current_fails INTEGER;
BEGIN
    IF p_user_id IS NULL OR p_pin IS NULL OR length(trim(p_pin)) != 6 THEN
        RETURN jsonb_build_object('success', false, 'message', 'PIN harus berupa 6 digit angka.');
    END IF;

    -- Row Lock Atomik mencegah Race Condition Brute Force
    SELECT * INTO v_auth 
    FROM public.ga_pin_credentials 
    WHERE user_id = p_user_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        PERFORM crypt(p_pin, gen_salt('bf', 10)); -- Timing attack mitigation
        RETURN jsonb_build_object('success', false, 'code', 'USER_NOT_FOUND', 'message', 'Pengguna atau kredensial PIN belum terdaftar di database.');
    END IF;

    -- Cek lockout akun
    IF v_auth.locked_until IS NOT NULL AND v_auth.locked_until > now() THEN
        RETURN jsonb_build_object(
            'success', false, 
            'code', 'ACCOUNT_LOCKED',
            'message', 'Akun terkunci sementara karena salah PIN 5 kali. Coba lagi dalam ' || 
                       CEIL(EXTRACT(EPOCH FROM (v_auth.locked_until - now())) / 60) || ' menit.'
        );
    END IF;

    -- Verifikasi Bcrypt hash
    IF v_auth.pin_hash = crypt(p_pin, v_auth.pin_hash) THEN
        UPDATE public.ga_pin_credentials 
        SET failed_attempts = 0, 
            locked_until = NULL, 
            last_login_at = now(),
            updated_at = now()
        WHERE user_id = p_user_id;

        INSERT INTO public.ga_login_attempts (user_id, success, ip_address)
        VALUES (p_user_id, true, p_ip_address);

        SELECT * INTO v_user FROM public.ga_users WHERE id = p_user_id AND is_active = true;

        v_new_token := encode(gen_random_bytes(32), 'hex');
        v_expires_at := now() + interval '24 hours';

        INSERT INTO public.ga_sessions (user_id, token, expires_at, user_agent, ip_address)
        VALUES (p_user_id, v_new_token, v_expires_at, p_user_agent, p_ip_address);

        RETURN jsonb_build_object(
            'success', true,
            'session_token', v_new_token,
            'expires_at', v_expires_at,
            'user', jsonb_build_object(
                'id', v_user.id,
                'name', v_user.name,
                'email', v_user.email,
                'roleId', v_user.role_id,
                'roleLabel', v_user.role_label,
                'department', v_user.department,
                'branchId', v_user.branch_id,
                'avatarUrl', v_user.avatar_url
            )
        );
    ELSE
        v_current_fails := v_auth.failed_attempts + 1;

        INSERT INTO public.ga_login_attempts (user_id, success, ip_address)
        VALUES (p_user_id, false, p_ip_address);
        
        IF v_current_fails >= 5 THEN
            UPDATE public.ga_pin_credentials 
            SET failed_attempts = v_current_fails,
                locked_until = now() + interval '15 minutes',
                updated_at = now()
            WHERE user_id = p_user_id;

            RETURN jsonb_build_object(
                'success', false, 
                'code', 'ACCOUNT_LOCKED',
                'message', 'PIN salah 5 kali berturut-turut. Akun dikunci selama 15 menit demi keamanan.'
            );
        ELSE
            UPDATE public.ga_pin_credentials 
            SET failed_attempts = v_current_fails,
                updated_at = now()
            WHERE user_id = p_user_id;

            RETURN jsonb_build_object(
                'success', false, 
                'code', 'INVALID_PIN',
                'message', 'PIN salah. Sisa percobaan sebelum akun dikunci: ' || (5 - v_current_fails)
            );
        END IF;
    END IF;
END;
$$;

-- RPC: Inisialisasi / Update PIN Pengguna (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.rpc_set_user_pin(
    p_user_id TEXT,
    p_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_user_id IS NULL OR p_pin IS NULL OR length(trim(p_pin)) != 6 THEN
        RETURN jsonb_build_object('success', false, 'message', 'PIN harus 6 digit angka.');
    END IF;

    INSERT INTO public.ga_pin_credentials (user_id, pin_hash, failed_attempts, updated_at)
    VALUES (p_user_id, crypt(p_pin, gen_salt('bf', 10)), 0, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        pin_hash = crypt(p_pin, gen_salt('bf', 10)),
        failed_attempts = 0,
        locked_until = NULL,
        updated_at = now();

    RETURN jsonb_build_object('success', true, 'message', 'Kredensial PIN pengguna berhasil disimpan secara aman.');
END;
$$;

-- RPC: Validasi Sesi Token
CREATE OR REPLACE FUNCTION public.rpc_validate_session(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sess RECORD;
    v_user RECORD;
BEGIN
    SELECT * INTO v_sess 
    FROM public.ga_sessions 
    WHERE token = p_token AND is_revoked = false AND expires_at > now();

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'message', 'Sesi tidak valid atau telah kedaluwarsa.');
    END IF;

    SELECT * INTO v_user FROM public.ga_users WHERE id = v_sess.user_id AND is_active = true;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'message', 'Pengguna tidak ditemukan atau nonaktif.');
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'user', jsonb_build_object(
            'id', v_user.id,
            'name', v_user.name,
            'email', v_user.email,
            'roleId', v_user.role_id,
            'roleLabel', v_user.role_label,
            'department', v_user.department,
            'branchId', v_user.branch_id,
            'avatarUrl', v_user.avatar_url
        )
    );
END;
$$;

-- RPC: Logout & Revoke Sesi Token
CREATE OR REPLACE FUNCTION public.rpc_logout_session(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.ga_sessions 
    SET is_revoked = true 
    WHERE token = p_token;
    RETURN true;
END;
$$;

-- Berikan izin eksekusi RPC ke anon dan authenticated
GRANT EXECUTE ON FUNCTION public.rpc_login_pin(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_logout_session(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_set_user_pin(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_validate_session(TEXT) TO anon, authenticated;

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES TINGKAT TINGGI
-- ========================================================

ALTER TABLE public.ga_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_pin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_email_notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_email_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_system_backups ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- 1. ga_branches: SELECT terbuka (untuk pemilihan cabang & login), MUTASI dibatasi izin role
    DROP POLICY IF EXISTS "ga_branches_select" ON public.ga_branches;
    CREATE POLICY "ga_branches_select" ON public.ga_branches FOR SELECT USING (true);

    DROP POLICY IF EXISTS "ga_branches_write" ON public.ga_branches;
    CREATE POLICY "ga_branches_write" ON public.ga_branches FOR ALL 
    USING ((SELECT count(*) FROM public.ga_users) = 0 OR public.ga_has_permission('manage_branches'))
    WITH CHECK ((SELECT count(*) FROM public.ga_users) = 0 OR public.ga_has_permission('manage_branches'));

    -- 2. ga_roles: SELECT terbuka (metadata role), MUTASI dibatasi admin
    DROP POLICY IF EXISTS "ga_roles_select" ON public.ga_roles;
    CREATE POLICY "ga_roles_select" ON public.ga_roles FOR SELECT USING (true);

    DROP POLICY IF EXISTS "ga_roles_write" ON public.ga_roles;
    CREATE POLICY "ga_roles_write" ON public.ga_roles FOR ALL 
    USING ((SELECT count(*) FROM public.ga_users) = 0 OR public.ga_has_permission('manage_roles'))
    WITH CHECK ((SELECT count(*) FROM public.ga_users) = 0 OR public.ga_has_permission('manage_roles'));

    -- 3. ga_users: SELECT terbuka untuk profil publik (PIN/hash terisolasi di ga_pin_credentials)
    DROP POLICY IF EXISTS "ga_users_select" ON public.ga_users;
    CREATE POLICY "ga_users_select" ON public.ga_users FOR SELECT USING (true);

    DROP POLICY IF EXISTS "ga_users_write" ON public.ga_users;
    CREATE POLICY "ga_users_write" ON public.ga_users FOR ALL 
    USING ((SELECT count(*) FROM public.ga_users) = 0 OR public.ga_has_permission('manage_users'))
    WITH CHECK ((SELECT count(*) FROM public.ga_users) = 0 OR public.ga_has_permission('manage_users'));

    -- 4. ga_categories: SELECT terbuka, MUTASI dibatasi izin
    DROP POLICY IF EXISTS "ga_categories_select" ON public.ga_categories;
    CREATE POLICY "ga_categories_select" ON public.ga_categories FOR SELECT USING (true);

    DROP POLICY IF EXISTS "ga_categories_write" ON public.ga_categories;
    CREATE POLICY "ga_categories_write" ON public.ga_categories FOR ALL 
    USING ((SELECT count(*) FROM public.ga_users) = 0 OR public.ga_has_permission('manage_categories'))
    WITH CHECK ((SELECT count(*) FROM public.ga_users) = 0 OR public.ga_has_permission('manage_categories'));

    -- 5. ga_assets: Hanya aset aktif (is_deleted = false), mutasi dibatasi izin & cabang
    DROP POLICY IF EXISTS "ga_assets_select" ON public.ga_assets;
    CREATE POLICY "ga_assets_select" ON public.ga_assets FOR SELECT 
    USING (
        is_deleted = false AND (
            (SELECT count(*) FROM public.ga_users) = 0 OR
            public.ga_can_access_branch(branch_id) OR
            public.ga_get_session_token() IS NULL
        )
    );

    DROP POLICY IF EXISTS "ga_assets_insert" ON public.ga_assets;
    CREATE POLICY "ga_assets_insert" ON public.ga_assets FOR INSERT 
    WITH CHECK (
        (SELECT count(*) FROM public.ga_users) = 0 OR (
            (public.ga_has_permission('add_assets') OR public.ga_has_permission('manage_assets'))
            AND public.ga_can_access_branch(branch_id)
        )
    );

    DROP POLICY IF EXISTS "ga_assets_update" ON public.ga_assets;
    CREATE POLICY "ga_assets_update" ON public.ga_assets FOR UPDATE 
    USING (
        (SELECT count(*) FROM public.ga_users) = 0 OR (
            (public.ga_has_permission('edit_assets') OR public.ga_has_permission('manage_assets'))
            AND public.ga_can_access_branch(branch_id)
        )
    )
    WITH CHECK (
        (SELECT count(*) FROM public.ga_users) = 0 OR (
            (public.ga_has_permission('edit_assets') OR public.ga_has_permission('manage_assets'))
            AND public.ga_can_access_branch(branch_id)
        )
    );

    DROP POLICY IF EXISTS "ga_assets_delete" ON public.ga_assets;
    CREATE POLICY "ga_assets_delete" ON public.ga_assets FOR DELETE 
    USING (
        (SELECT count(*) FROM public.ga_users) = 0 OR (
            public.ga_has_permission('delete_assets')
            AND public.ga_can_access_branch(branch_id)
        )
    );

    -- 6. ga_maintenance_tickets:
    DROP POLICY IF EXISTS "ga_tickets_select" ON public.ga_maintenance_tickets;
    CREATE POLICY "ga_tickets_select" ON public.ga_maintenance_tickets FOR SELECT 
    USING (
        is_deleted = false AND (
            (SELECT count(*) FROM public.ga_users) = 0 OR
            public.ga_can_access_branch(branch_id) OR
            public.ga_get_session_token() IS NULL
        )
    );

    DROP POLICY IF EXISTS "ga_tickets_insert" ON public.ga_maintenance_tickets;
    CREATE POLICY "ga_tickets_insert" ON public.ga_maintenance_tickets FOR INSERT 
    WITH CHECK (
        (SELECT count(*) FROM public.ga_users) = 0 OR
        public.ga_can_access_branch(branch_id)
    );

    DROP POLICY IF EXISTS "ga_tickets_update" ON public.ga_maintenance_tickets;
    CREATE POLICY "ga_tickets_update" ON public.ga_maintenance_tickets FOR UPDATE 
    USING (
        (SELECT count(*) FROM public.ga_users) = 0 OR
        public.ga_can_access_branch(branch_id)
    )
    WITH CHECK (
        (SELECT count(*) FROM public.ga_users) = 0 OR
        public.ga_can_access_branch(branch_id)
    );

    DROP POLICY IF EXISTS "ga_tickets_delete" ON public.ga_maintenance_tickets;
    CREATE POLICY "ga_tickets_delete" ON public.ga_maintenance_tickets FOR DELETE 
    USING (
        (SELECT count(*) FROM public.ga_users) = 0 OR (
            public.ga_has_permission('delete_tickets')
            AND public.ga_can_access_branch(branch_id)
        )
    );

    -- 7. ga_email_notification_settings
    DROP POLICY IF EXISTS "ga_email_settings_select" ON public.ga_email_notification_settings;
    CREATE POLICY "ga_email_settings_select" ON public.ga_email_notification_settings FOR SELECT USING (true);

    DROP POLICY IF EXISTS "ga_email_settings_write" ON public.ga_email_notification_settings;
    CREATE POLICY "ga_email_settings_write" ON public.ga_email_notification_settings FOR ALL 
    USING ((SELECT count(*) FROM public.ga_users) = 0 OR public.ga_has_permission('manage_settings'))
    WITH CHECK ((SELECT count(*) FROM public.ga_users) = 0 OR public.ga_has_permission('manage_settings'));

    -- 8. ga_email_notification_logs
    DROP POLICY IF EXISTS "ga_email_logs_select" ON public.ga_email_notification_logs;
    CREATE POLICY "ga_email_logs_select" ON public.ga_email_notification_logs FOR SELECT USING (true);

    DROP POLICY IF EXISTS "ga_email_logs_insert" ON public.ga_email_notification_logs;
    CREATE POLICY "ga_email_logs_insert" ON public.ga_email_notification_logs FOR INSERT WITH CHECK (true);

    -- 9. ga_system_backups
    DROP POLICY IF EXISTS "ga_backups_select" ON public.ga_system_backups;
    CREATE POLICY "ga_backups_select" ON public.ga_system_backups FOR SELECT USING (true);

    DROP POLICY IF EXISTS "ga_backups_insert" ON public.ga_system_backups;
    CREATE POLICY "ga_backups_insert" ON public.ga_system_backups FOR INSERT WITH CHECK (true);
END $$;

-- 12. Aktifkan Supabase Realtime pada 4 tabel operasional utama
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'ga_assets'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ga_assets, public.ga_maintenance_tickets, public.ga_branches, public.ga_categories;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Fallback non-blocking jika publikasi belum ada
    NULL;
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
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-950">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Solusi Error 42501 & Keamanan Single Source of Truth</span>
                </div>
                <p>
                  Skrip di bawah ini dirancang khusus untuk <strong>12 tabel dengan prefix ga_*</strong> (termasuk <code>ga_pin_credentials</code> &amp; <code>ga_sessions</code>). Skrip ini memberikan izin <code>GRANT</code> yang diperlukan kepada PostgREST, memasang fungsi <strong>RPC PIN berenkripsi bcrypt</strong>, menerapkan <strong>Row Level Security (RLS)</strong> berbasis sesi, serta mengaktifkan <strong>Realtime</strong>.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Skrip DDL &amp; Keamanan Database Supabase (PostgreSQL)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Salin dan jalankan skrip ini sekali saja di <strong>SQL Editor pada Supabase Dashboard</strong> Anda.
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
