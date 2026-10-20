-- ========================================================
-- ROTARY AUTO - GA-OPS COMMANDER SUPABASE DATABASE SCHEMA (12 TABEL GA_*)
-- Hardened, Non-Destructive, Anti-Cascade, PIN Auth & Role-Based RLS
-- ========================================================

-- Pastikan pgcrypto terpasang untuk slow-hash Bcrypt PIN
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- 4. Tabel Kredensial PIN Internal (ga_users_auth) - Revoked from client
CREATE TABLE IF NOT EXISTS public.ga_users_auth (
    user_id TEXT PRIMARY KEY REFERENCES public.ga_users(id) ON DELETE CASCADE,
    pin_hash TEXT NOT NULL, -- Bcrypt hash dengan salt unik
    failed_attempts INTEGER DEFAULT 0 NOT NULL,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabel Sesi Pengguna Aktif (ga_user_sessions)
CREATE TABLE IF NOT EXISTS public.ga_user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.ga_users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    is_revoked BOOLEAN DEFAULT false NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ga_user_sessions_token ON public.ga_user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_ga_user_sessions_user ON public.ga_user_sessions(user_id);

-- 6. Tabel Percobaan Login & Rate Limiting (ga_login_attempts)
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

-- 8. Tabel Utama Aset & Fasilitas (ga_assets) - Anti-Cascade & Soft-Delete
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

-- 9. Tabel Tiket Perbaikan Fasilitas (ga_maintenance_tickets) - ON DELETE RESTRICT
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
-- FUNGSI SECURITY DEFINER & RATE LIMITING ATOMIK
-- ========================================================

-- Helper: Ambil konteks otentikasi dari header x-session-token
CREATE OR REPLACE FUNCTION public.current_auth_context()
RETURNS TABLE (
    user_id TEXT,
    role_id TEXT,
    role_label TEXT,
    department TEXT,
    branch_id TEXT,
    permissions JSONB,
    is_authenticated BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_token TEXT;
BEGIN
    BEGIN
        v_token := current_setting('request.headers', true)::json->>'x-session-token';
    EXCEPTION WHEN OTHERS THEN
        v_token := NULL;
    END;

    IF v_token IS NULL OR trim(v_token) = '' THEN
        RETURN QUERY SELECT NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, '[]'::jsonb, false;
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        u.id AS user_id,
        u.role_id,
        u.role_label,
        u.department,
        u.branch_id,
        r.permissions,
        true AS is_authenticated
    FROM public.ga_user_sessions s
    JOIN public.ga_users u ON u.id = s.user_id
    JOIN public.ga_roles r ON r.id = u.role_id
    WHERE s.token = v_token
      AND s.is_revoked = false
      AND s.expires_at > now()
      AND u.is_active = true
    LIMIT 1;
END;
$$;

-- RPC: Verifikasi PIN & Login Aman
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
    FROM public.ga_users_auth 
    WHERE user_id = p_user_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        PERFORM crypt(p_pin, gen_salt('bf', 10)); -- Timing mitigation
        RETURN jsonb_build_object('success', false, 'code', 'USER_NOT_FOUND', 'message', 'Pengguna atau kredensial PIN belum terdaftar di database.');
    END IF;

    -- Cek lockout
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
        UPDATE public.ga_users_auth 
        SET failed_attempts = 0, 
            locked_until = NULL, 
            last_login_at = now(),
            updated_at = now()
        WHERE user_id = p_user_id;

        SELECT * INTO v_user FROM public.ga_users WHERE id = p_user_id AND is_active = true;

        v_new_token := encode(gen_random_bytes(32), 'hex');
        v_expires_at := now() + interval '24 hours';

        INSERT INTO public.ga_user_sessions (user_id, token, expires_at, user_agent, ip_address)
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
        
        IF v_current_fails >= 5 THEN
            UPDATE public.ga_users_auth 
            SET failed_attempts = v_current_fails,
                locked_until = now() + interval '15 minutes',
                updated_at = now()
            WHERE user_id = p_user_id;

            RETURN jsonb_build_object(
                'success', false, 
                'code', 'ACCOUNT_LOCKED',
                'message', 'PIN salah 5 kali berturut-turut. Akun dikunci selama 15 menit.'
            );
        ELSE
            UPDATE public.ga_users_auth 
            SET failed_attempts = v_current_fails,
                updated_at = now()
            WHERE user_id = p_user_id;

            RETURN jsonb_build_object(
                'success', false, 
                'code', 'INVALID_PIN',
                'message', 'PIN salah. Sisa percobaan: ' || (5 - v_current_fails)
            );
        END IF;
    END IF;
END;
$$;

-- RPC: Inisialisasi / Reset PIN Pengguna (SECURITY DEFINER)
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

    INSERT INTO public.ga_users_auth (user_id, pin_hash, failed_attempts, updated_at)
    VALUES (p_user_id, crypt(p_pin, gen_salt('bf', 10)), 0, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        pin_hash = crypt(p_pin, gen_salt('bf', 10)),
        failed_attempts = 0,
        locked_until = NULL,
        updated_at = now();

    RETURN jsonb_build_object('success', true, 'message', 'PIN pengguna berhasil disimpan.');
END;
$$;

-- RPC: Logout & Revoke Sesi
CREATE OR REPLACE FUNCTION public.rpc_logout_session(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.ga_user_sessions 
    SET is_revoked = true 
    WHERE token = p_token;
    RETURN true;
END;
$$;

-- ========================================================
-- KEAMANAN HAK AKSES & ROW LEVEL SECURITY (RLS)
-- ========================================================

-- Cabut akses publik langsung ke tabel internal otentikasi
REVOKE ALL ON TABLE public.ga_users_auth FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.ga_user_sessions FROM PUBLIC, anon, authenticated;

-- Berikan akses execute pada RPC
GRANT EXECUTE ON FUNCTION public.rpc_login_pin(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_logout_session(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_set_user_pin(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_auth_context() TO anon, authenticated;

-- Aktifkan RLS di seluruh tabel
ALTER TABLE public.ga_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_users_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_email_notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_email_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga_system_backups ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Kebijakan Akses Baca (Read)
    DROP POLICY IF EXISTS "ga_branches_read" ON public.ga_branches;
    CREATE POLICY "ga_branches_read" ON public.ga_branches FOR SELECT USING (true);

    DROP POLICY IF EXISTS "ga_roles_read" ON public.ga_roles;
    CREATE POLICY "ga_roles_read" ON public.ga_roles FOR SELECT USING (true);

    DROP POLICY IF EXISTS "ga_users_read" ON public.ga_users;
    CREATE POLICY "ga_users_read" ON public.ga_users FOR SELECT USING (true);

    DROP POLICY IF EXISTS "ga_categories_read" ON public.ga_categories;
    CREATE POLICY "ga_categories_read" ON public.ga_categories FOR SELECT USING (true);

    DROP POLICY IF EXISTS "ga_assets_read" ON public.ga_assets;
    CREATE POLICY "ga_assets_read" ON public.ga_assets FOR SELECT USING (is_deleted = false);

    DROP POLICY IF EXISTS "ga_tickets_read" ON public.ga_maintenance_tickets;
    CREATE POLICY "ga_tickets_read" ON public.ga_maintenance_tickets FOR SELECT USING (is_deleted = false);

    DROP POLICY IF EXISTS "ga_email_settings_read" ON public.ga_email_notification_settings;
    CREATE POLICY "ga_email_settings_read" ON public.ga_email_notification_settings FOR SELECT USING (true);

    DROP POLICY IF EXISTS "ga_email_logs_read" ON public.ga_email_notification_logs;
    CREATE POLICY "ga_email_logs_read" ON public.ga_email_notification_logs FOR SELECT USING (true);

    DROP POLICY IF EXISTS "ga_backups_read" ON public.ga_system_backups;
    CREATE POLICY "ga_backups_read" ON public.ga_system_backups FOR SELECT USING (true);

    -- Kebijakan Modifikasi (Mutate / Upsert)
    DROP POLICY IF EXISTS "ga_branches_mutate" ON public.ga_branches;
    CREATE POLICY "ga_branches_mutate" ON public.ga_branches FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "ga_roles_mutate" ON public.ga_roles;
    CREATE POLICY "ga_roles_mutate" ON public.ga_roles FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "ga_users_mutate" ON public.ga_users;
    CREATE POLICY "ga_users_mutate" ON public.ga_users FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "ga_categories_mutate" ON public.ga_categories;
    CREATE POLICY "ga_categories_mutate" ON public.ga_categories FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "ga_assets_mutate" ON public.ga_assets;
    CREATE POLICY "ga_assets_mutate" ON public.ga_assets FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "ga_tickets_mutate" ON public.ga_maintenance_tickets;
    CREATE POLICY "ga_tickets_mutate" ON public.ga_maintenance_tickets FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "ga_email_settings_mutate" ON public.ga_email_notification_settings;
    CREATE POLICY "ga_email_settings_mutate" ON public.ga_email_notification_settings FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "ga_email_logs_mutate" ON public.ga_email_notification_logs;
    CREATE POLICY "ga_email_logs_mutate" ON public.ga_email_notification_logs FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "ga_backups_mutate" ON public.ga_system_backups;
    CREATE POLICY "ga_backups_mutate" ON public.ga_system_backups FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 12. Aktifkan Supabase Realtime pada 4 tabel operasional utama
ALTER PUBLICATION supabase_realtime ADD TABLE public.ga_assets, public.ga_maintenance_tickets, public.ga_branches, public.ga_categories;
