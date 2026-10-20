/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_SUPABASE_CONFIG = 'ga_ops_supabase_config_v1';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

// In-memory Supabase client instance
let cachedClient: SupabaseClient | null = null;
let lastUrl: string | null = null;
let lastKey: string | null = null;
let lastSessionToken: string | null = null;

export function resetCachedSupabaseClient(): void {
  cachedClient = null;
  lastUrl = null;
  lastKey = null;
  lastSessionToken = null;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUPABASE_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        url: parsed.url || envUrl,
        anonKey: parsed.anonKey || envKey,
        enabled: parsed.enabled !== undefined ? parsed.enabled : Boolean(envUrl && envKey),
      };
    }
  } catch (e) {
    console.error('Failed to read Supabase config from storage', e);
  }

  return {
    url: envUrl,
    anonKey: envKey,
    enabled: Boolean(envUrl && envKey),
  };
}

export function saveStoredSupabaseConfig(config: SupabaseConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_SUPABASE_CONFIG, JSON.stringify(config));
    // Invalidate cached client when config changes
    if (config.url !== lastUrl || config.anonKey !== lastKey) {
      resetCachedSupabaseClient();
    }
  } catch (e) {
    console.error('Failed to save Supabase config', e);
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.enabled || !config.url || !config.anonKey) {
    return null;
  }

  // Check if session token changed
  let currentSessionToken: string | null = null;
  try {
    currentSessionToken = sessionStorage.getItem('ga_ops_session_token_v1');
  } catch {}

  // Return cached client if credentials and session token match
  if (
    cachedClient &&
    lastUrl === config.url &&
    lastKey === config.anonKey &&
    lastSessionToken === currentSessionToken
  ) {
    return cachedClient;
  }

  try {
    const globalHeaders: Record<string, string> = {};
    if (currentSessionToken) {
      globalHeaders['x-session-token'] = currentSessionToken;
    }

    cachedClient = createClient(config.url.trim(), config.anonKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: globalHeaders,
      },
    });
    lastUrl = config.url;
    lastKey = config.anonKey;
    lastSessionToken = currentSessionToken;
    return cachedClient;
  } catch (err) {
    console.error('Error creating Supabase client:', err);
    return null;
  }
}

/**
 * Tests connection to the configured Supabase instance
 */
export async function testSupabaseConnection(url: string, anonKey: string): Promise<{
  success: boolean;
  message: string;
}> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL dan Anon Key wajib diisi.' };
  }

  try {
    const client = createClient(url.trim(), anonKey.trim());
    // Test a lightweight query on ga_branches
    const { error } = await client.from('ga_branches').select('id').limit(1);

    if (error) {
      if (error.code === '42501') {
        return {
          success: true,
          message:
            'Koneksi URL & Anon Key valid ke Supabase! (Catatan: Hak akses RLS untuk role anon belum terpasang. Jalankan SQL Keamanan di Tab "Skrip SQL Migrasi" agar tabel dapat diakses).',
        };
      }
      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message?.includes('does not exist')
      ) {
        return {
          success: true,
          message:
            'Kredensial URL & Key valid dan terhubung ke Supabase! (Tabel public.ga_branches belum ada di database).',
        };
      }
      return {
        success: false,
        message: `Koneksi ditolak: ${error.message} (Kode: ${error.code})`,
      };
    }

    return {
      success: true,
      message: 'Koneksi ke Supabase Cloud berhasil & tabel public.ga_branches siap digunakan!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal menghubungi server Supabase. Periksa URL dan koneksi internet.',
    };
  }
}
