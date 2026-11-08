// Response contracts for the Battle.net WoW Profile API, as documented for the
// Classic flavours (profile-classic1x / profile-classic) and observed on
// profile-forever-us. Forever is new: fields marked "Forever?" are uncertain
// and handled defensively — validate against a real EU response once live.

export interface KeyRef {
  href: string;
}

export interface NamedRef<T extends string | number = number> {
  key: KeyRef;
  name: string;
  id: T;
}

export interface TypedName<T extends string = string> {
  type: T;
  name: string;
}

export type FactionType = 'ALLIANCE' | 'HORDE';

export interface RealmRef extends NamedRef {
  slug: string;
}

/** GET /profile/wow/character/{realmSlug}/{characterName} */
export interface CharacterProfileSummary {
  _links: { self: KeyRef };
  id: number;
  name: string;
  gender: TypedName<'MALE' | 'FEMALE'>;
  faction: TypedName<FactionType>;
  race: NamedRef;
  character_class: NamedRef;
  /** Forever? characters on mega-realms may come back without a realm. */
  realm?: RealmRef;
  guild?: NamedRef & { realm?: RealmRef; faction?: TypedName<FactionType> };
  level: number;
  /** XP into the current level (Classic profiles). */
  experience?: number;
  achievement_points?: number;
  /** Unix epoch milliseconds. */
  last_login_timestamp: number;
  average_item_level?: number;
  equipped_item_level?: number;
  active_title?: NamedRef & { display_string?: string };
  is_ghost?: boolean;
  is_self_found?: boolean;
}

/** GET /profile/wow/character/{realmSlug}/{characterName}/character-media */
export interface CharacterMediaSummary {
  _links: { self: KeyRef };
  character: NamedRef & { realm?: RealmRef };
  assets?: { key: 'avatar' | 'inset' | 'main' | 'main-raw' | string; value: string }[];
}

/** GET /data/wow/ruleset/{id} (dynamic-forever-{region}) — confirmed live on EU. */
export interface Ruleset {
  _links: { self: KeyRef };
  id: number;
  name: string;
  auctions?: KeyRef;
  status?: TypedName<'UP' | 'DOWN'>;
}

export interface BlizzardErrorBody {
  code: number;
  type: string;
  detail: string;
}
