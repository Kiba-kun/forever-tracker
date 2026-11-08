// Minimal server-side Battle.net API client (client-credentials flow).
// Never import this from client components: it reads the client secret.

import type { CharacterMediaSummary, CharacterProfileSummary, Ruleset } from './types.ts';

export type Region = 'eu' | 'us' | 'kr' | 'tw';

export class BlizzardApiError extends Error {
  readonly status: number;
  readonly url: string;
  constructor(status: number, url: string, detail: string) {
    super(`Blizzard API ${status} for ${url}: ${detail}`);
    this.status = status;
    this.url = url;
  }
}

interface Token {
  value: string;
  expiresAt: number;
}

let cachedToken: Token | null = null;

function credentials() {
  const id = process.env.BNET_CLIENT_ID;
  const secret = process.env.BNET_CLIENT_SECRET;
  if (!id || !secret) throw new Error('BNET_CLIENT_ID / BNET_CLIENT_SECRET are not set (see .env.example)');
  return { id, secret };
}

export function region(): Region {
  return (process.env.BNET_REGION?.trim().toLowerCase() || 'eu') as Region;
}

async function token(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const { id, secret } = credentials();
  const res = await fetch('https://oauth.battle.net/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new BlizzardApiError(res.status, 'oauth/token', await res.text());
  const body = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return cachedToken.value;
}

type NamespaceKind = 'static' | 'dynamic' | 'profile';

/** Forever uses its own namespace family: static-forever-eu, dynamic-forever-eu, profile-forever-eu. */
export function namespace(kind: NamespaceKind, r: Region = region()) {
  return `${kind}-forever-${r}`;
}

async function get<T>(path: string, kind: NamespaceKind): Promise<T> {
  const r = region();
  const url = `https://${r}.api.blizzard.com${path}?namespace=${namespace(kind, r)}&locale=en_US`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${await token()}` }, cache: 'no-store' });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = ((await res.json()) as { detail?: string }).detail ?? detail;
    } catch {}
    throw new BlizzardApiError(res.status, url, detail);
  }
  return (await res.json()) as T;
}

/** Character names in Forever are "First Last"; the API lower-cases and slugifies path segments. */
export function nameSlug(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * Builds the character path. EU Forever profiles 404 as of 2026-11-08, so the exact
 * realm segment for a realm-less mega-realm is unconfirmed. Adjust here once known.
 */
export function characterPath(realmSegment: string, name: string) {
  return `/profile/wow/character/${encodeURIComponent(realmSegment)}/${encodeURIComponent(nameSlug(name))}`;
}

export const blizzard = {
  characterProfile: (realmSegment: string, name: string) =>
    get<CharacterProfileSummary>(characterPath(realmSegment, name), 'profile'),
  characterMedia: (realmSegment: string, name: string) =>
    get<CharacterMediaSummary>(`${characterPath(realmSegment, name)}/character-media`, 'profile'),
  ruleset: (id: number) => get<Ruleset>(`/data/wow/ruleset/${id}`, 'dynamic'),
};
