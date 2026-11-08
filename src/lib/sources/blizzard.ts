import { blizzard, BlizzardApiError } from '../blizzard/client.ts';
import { normalize, RULESET_IDS } from '../model.ts';
import type { CharacterSource } from './types.ts';

export const blizzardSource: CharacterSource = {
  kind: 'blizzard',
  async fetchCharacter(entry) {
    const realm = entry.realmSegment ?? process.env.BNET_FOREVER_REALM_SEGMENT ?? String(RULESET_IDS[entry.ruleset]);
    const profile = await blizzard.characterProfile(realm, entry.name);
    // Media is cosmetic: a missing avatar must not fail the whole character.
    const media = await blizzard.characterMedia(realm, entry.name).catch((e) => {
      if (e instanceof BlizzardApiError) return null;
      throw e;
    });
    return normalize(entry, profile, media);
  },
};
