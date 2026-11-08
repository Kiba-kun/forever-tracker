import rosterFile from '../../config/roster.json' with { type: 'json' };
import type { RosterEntry } from './model.ts';

export const roster: RosterEntry[] = rosterFile.characters as RosterEntry[];
