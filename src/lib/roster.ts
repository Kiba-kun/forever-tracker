import recordedFile from '../../config/recorded-milestones.json' with { type: 'json' };
import rosterFile from '../../config/roster.json' with { type: 'json' };
import type { RecordedMilestone } from './milestones.ts';
import type { RosterEntry } from './model.ts';

/** The Group's Mains, in the fixed order the dashboard shows them. */
export const roster: RosterEntry[] = rosterFile.characters as RosterEntry[];

const unnamed = roster.filter((r) => typeof r.player !== 'string' || !r.player.trim());
if (unnamed.length) {
  throw new Error(
    `config/roster.json: every Main needs a "player" (the person it belongs to). Missing for: ${unnamed.map((r) => r.name).join(', ')}`,
  );
}

/** Milestones from before the tracker could see them, written down by hand. */
export const recordedMilestones: RecordedMilestone[] = recordedFile.milestones as RecordedMilestone[];

const badRecord = recordedMilestones.find(
  (m) =>
    !/^\d{4}-\d{2}-\d{2}$/.test(m.day) ||
    !roster.some((r) => r.player === m.player) ||
    m.kind !== 'gear' ||
    !['Rare', 'Epic'].includes(m.quality) ||
    // Items, when written down, are of the Milestone's own Quality.
    (m.items !== undefined && !m.items.every((i) => Number.isInteger(i.id) && typeof i.name === 'string' && i.quality === m.quality)),
);
if (badRecord) throw new Error(`config/recorded-milestones.json: can't read ${JSON.stringify(badRecord)}`);
