import type { CharacterState, RosterEntry, SourceKind } from '../model.ts';

export interface FetchedCharacter {
  character: CharacterState;
  /** Parts that couldn't be read (e.g. a failed armory sub-page): left unknown in `character`, never fatal. */
  problems?: string[];
}

export interface CharacterSource {
  kind: SourceKind;
  /** Rejects when the Character can't be read at all. */
  fetchCharacter(entry: RosterEntry, at: number): Promise<FetchedCharacter>;
}
