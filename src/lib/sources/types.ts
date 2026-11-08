import type { CharacterState, RosterEntry, SourceKind } from '../model.ts';

export interface CharacterSource {
  kind: SourceKind;
  fetchCharacter(entry: RosterEntry, at: number): Promise<CharacterState>;
}
