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

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUPABASE_CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read Supabase config from storage', e);
  }
  return {
    url: '',
    anonKey: '',
    enabled: false,
  };
}

export function saveStoredSupabaseConfig(config: SupabaseConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_SUPABASE_CONFIG, JSON.stringify(config));
    // Invalidate cached client when config changes
    if (config.url !== lastUrl || config.anonKey !== lastKey) {
      cachedClient = null;
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

  // Return cached client if credentials match
  if (cachedClient && lastUrl === config.url && lastKey === config.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url.trim(), config.anonKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUrl = config.url;
    lastKey = config.anonKey;
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
    // Test a lightweight query
    const { error } = await client.from('branches').select('id').limit(1);
    
    if (error) {
      // If table doesn't exist yet, it still proves credentials and network are valid
      if (error.code === '42P01' || error.message.includes('relation "public.branches" does not exist')) {
        return {
          success: true,
          message: 'Terhubung ke Supabase! (Catatan: Tabel belum dibuat, silakan jalankan skrip SQL di Tab SQL).',
        };
      }
      return {
        success: false,
        message: `Koneksi ditolak: ${error.message} (Kode: ${error.code})`,
      };
    }

    return {
      success: true,
      message: 'Koneksi ke Supabase Cloud berhasil & tabel siap digunakan!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal menghubungi server Supabase. Periksa URL dan koneksi internet.',
    };
  }
}
