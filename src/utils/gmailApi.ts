/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAccessToken } from './googleAuth';

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessageItem {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  headers?: Record<string, string>;
  from?: string;
  to?: string;
  subject?: string;
  date?: string;
  bodySnippet?: string;
}

/**
 * Encodes string to UTF-8 Base64URL without padding as required by Gmail API.
 */
function toBase64Url(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Builds standard RFC 2822 email format.
 */
function buildRfc822Message(to: string, subject: string, bodyText: string, from?: string): string {
  const lines: string[] = [];
  if (from) {
    lines.push(`From: ${from}`);
  }
  lines.push(`To: ${to}`);
  // Subject UTF-8 encoding support
  lines.push(`Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`);
  lines.push('MIME-Version: 1.0');
  lines.push('Content-Type: text/plain; charset=UTF-8');
  lines.push('Content-Transfer-Encoding: 7bit');
  lines.push('');
  lines.push(bodyText);

  return lines.join('\r\n');
}

/**
 * Fetch current user's Gmail profile
 */
export async function fetchGmailProfile(): Promise<GmailProfile> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Belum terautentikasi dengan akun Google. Silakan login terlebih dahulu.');
  }

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gagal mengambil profil Gmail (${res.status})`);
  }

  return (await res.json()) as GmailProfile;
}

/**
 * Send an email directly via the Gmail API
 */
export async function sendGmailMessage(options: {
  to: string;
  subject: string;
  body: string;
  from?: string;
}): Promise<{ id: string; threadId: string; labelIds: string[] }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Sesi Google telah berakhir. Silakan login ulang untuk mengirim email.');
  }

  const rawMessage = buildRfc822Message(options.to, options.subject, options.body, options.from);
  const base64UrlEmail = toBase64Url(rawMessage);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: base64UrlEmail }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gagal mengirim email via Gmail API (${res.status})`);
  }

  return await res.json();
}

/**
 * List recent messages matching optional query from Gmail API
 */
export async function listGmailMessages(
  query: string = '',
  maxResults: number = 10
): Promise<GmailMessageItem[]> {
  const token = await getAccessToken();
  if (!token) {
    return [];
  }

  const params = new URLSearchParams({
    maxResults: String(maxResults),
  });
  if (query.trim()) {
    params.set('q', query.trim());
  }

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!listRes.ok) {
    const err = await listRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal memuat pesan Gmail (${listRes.status})`);
  }

  const listData = await listRes.json();
  const messagesSummary = (listData.messages || []) as { id: string; threadId: string }[];

  if (messagesSummary.length === 0) {
    return [];
  }

  // Fetch header details for each message
  const detailedMessages = await Promise.all(
    messagesSummary.slice(0, maxResults).map(async (msg) => {
      try {
        const itemRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!itemRes.ok) return { id: msg.id, threadId: msg.threadId };
        const data = await itemRes.json();

        const headersMap: Record<string, string> = {};
        if (data.payload?.headers) {
          data.payload.headers.forEach((h: { name: string; value: string }) => {
            headersMap[h.name.toLowerCase()] = h.value;
          });
        }

        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: data.snippet,
          internalDate: data.internalDate,
          from: headersMap['from'] || 'Tidak diketahui',
          to: headersMap['to'] || '',
          subject: headersMap['subject'] || '(Tanpa Subjek)',
          date: headersMap['date'] || '',
        };
      } catch {
        return { id: msg.id, threadId: msg.threadId };
      }
    })
  );

  return detailedMessages;
}
