/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from '../types';
import { getSupabaseClient, resetCachedSupabaseClient } from './supabaseClient';

const SESSION_TOKEN_KEY = 'ga_ops_session_token_v1';

let cachedSessionToken: string | null = null;

export function getSessionToken(): string | null {
  if (cachedSessionToken) return cachedSessionToken;
  try {
    const stored = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (stored) {
      cachedSessionToken = stored;
      return stored;
    }
  } catch (e) {
    console.warn('Could not read session token from sessionStorage', e);
  }
  return null;
}

export function setSessionToken(token: string | null): void {
  cachedSessionToken = token;
  try {
    if (token) {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch (e) {
    console.warn('Could not save session token to sessionStorage', e);
  }
  resetCachedSupabaseClient();
}

/**
 * Authenticate PIN against Supabase backend RPC (rpc_login_pin)
 */
export async function authenticatePinSupabase(
  userId: string,
  pin: string
): Promise<{
  success: boolean;
  message?: string;
  code?: string;
  user?: UserProfile;
  sessionToken?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      code: 'CLOUD_DISCONNECTED',
      message: 'Supabase Cloud belum terhubung atau dinonaktifkan.',
    };
  }

  try {
    const { data, error } = await client.rpc('rpc_login_pin', {
      p_user_id: userId,
      p_pin: pin,
      p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    });

    if (error) {
      // Check if table ga_users is completely empty
      try {
        const { count } = await client
          .from('ga_users')
          .select('id', { count: 'exact', head: true });
        if (count === 0 || count === null) {
          return {
            success: false,
            code: 'DATABASE_EMPTY',
            message:
              'Database Supabase (tabel ga_users) masih kosong. Masuk menggunakan PIN lokal untuk memulai migrasi data.',
          };
        }
      } catch {}

      if (error.code === '42501' || error.message?.includes('permission denied')) {
        return {
          success: false,
          code: '42501',
          message:
            'Akses database ditolak (Error 42501). Izin SELECT atau RLS policy belum dipasang di Supabase. Buka ikon Database Supabase > Tab "Skrip SQL Migrasi" untuk menjalankan skrip keamanan.',
        };
      }

      if (
        error.code === '42883' ||
        error.message?.includes('function public.rpc_login_pin') ||
        error.message?.includes('does not exist')
      ) {
        return {
          success: false,
          code: 'RPC_NOT_INSTALLED',
          message:
            'Fungsi RPC PIN (rpc_login_pin) belum dipasang di Supabase. Buka ikon Database (Supabase) > Tab "Skrip SQL Migrasi" untuk menyalin & menjalankan skrip skema.',
        };
      }
      return {
        success: false,
        code: error.code || 'RPC_ERROR',
        message: error.message || 'Gagal memverifikasi PIN di server Supabase.',
      };
    }

    if (!data || !data.success) {
      if (data?.code === 'USER_NOT_FOUND') {
        try {
          const { count } = await client
            .from('ga_users')
            .select('id', { count: 'exact', head: true });
          if (count === 0 || count === null) {
            return {
              success: false,
              code: 'DATABASE_EMPTY',
              message:
                'Database Supabase (tabel ga_users) masih kosong. Masuk menggunakan PIN lokal untuk memulai migrasi data.',
            };
          }
        } catch {}
      }

      return {
        success: false,
        code: data?.code || 'INVALID_CREDENTIALS',
        message: data?.message || 'PIN yang Anda masukkan salah.',
      };
    }

    // Success: store session token
    if (data.session_token) {
      setSessionToken(data.session_token);
    }

    return {
      success: true,
      user: data.user,
      sessionToken: data.session_token,
    };
  } catch (err: any) {
    return {
      success: false,
      code: 'NETWORK_ERROR',
      message: err.message || 'Koneksi ke Supabase terputus. Periksa jaringan Anda.',
    };
  }
}

/**
 * Validates active session token with Supabase RPC
 */
export async function validateSupabaseSession(): Promise<{ valid: boolean; user?: UserProfile }> {
  const token = getSessionToken();
  const client = getSupabaseClient();
  if (!token || !client) return { valid: false };

  try {
    const { data, error } = await client.rpc('rpc_validate_session', { p_token: token });
    if (!error && data?.valid && data?.user) {
      return { valid: true, user: data.user };
    }
  } catch (e) {
    console.warn('Error validating Supabase session:', e);
  }
  return { valid: false };
}

/**
 * Revokes current session token in Supabase
 */
export async function logoutSupabaseSession(): Promise<void> {
  const token = getSessionToken();
  const client = getSupabaseClient();

  if (token && client) {
    try {
      await client.rpc('rpc_logout_session', { p_token: token });
    } catch (e) {
      console.warn('Could not revoke session on server', e);
    }
  }

  setSessionToken(null);
  resetCachedSupabaseClient();
}
