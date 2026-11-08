// Game things shown the way WoW shows them: items and mounts in their Quality colour, names in class colour.
// Item links go to Wowhead's Forever database, whose script (loaded in the layout) adds only the hover tooltip.
// We colour, name and iconise links from our own armory data, so they look right even if that script is blocked.

import type { CollectedMount, EquippedItem, GearQuality } from '../lib/model.ts';

/** Quality colours, as the game uses them. */
export const QUALITY_COLOR: Record<GearQuality, string> = {
  Poor: '#9d9d9d',
  Common: '#ffffff',
  Uncommon: '#1eff00',
  Rare: '#0070dd',
  Epic: '#a335ee',
  Legendary: '#ff8000',
};

/** Class colours, as the game uses them. */
const CLASS_COLOR: Record<string, string> = {
  Druid: '#ff7c0a',
  Hunter: '#aad372',
  Mage: '#3fc7eb',
  Paladin: '#f48cba',
  Priest: '#ffffff',
  Rogue: '#fff468',
  Shaman: '#0070dd',
  Warlock: '#8788ee',
  Warrior: '#c69b6d',
};

export const classColor = (className: string | undefined) => (className ? CLASS_COLOR[className] : undefined);

export function ItemLink({ item }: { item: EquippedItem }) {
  return (
    <a
      className="game-link"
      href={`https://www.wowhead.com/forever/item=${item.id}`}
      // The bonus list makes Wowhead's tooltip show the random suffix ("of Stamina") and its stats.
      data-wowhead={item.bonus?.length ? `bonus=${item.bonus.join(':')}` : undefined}
      target="_blank"
      rel="noreferrer"
      style={{ color: QUALITY_COLOR[item.quality] }}>
      {item.icon && <img className="game-icon" src={item.icon} alt="" />}[{item.name}]
    </a>
  );
}

/** Mounts get their Quality colour but no link: Wowhead needs a spell id the armory doesn't give us. */
export function MountName({ mount }: { mount: CollectedMount }) {
  return <span className="game-link" style={{ color: QUALITY_COLOR[mount.quality] }}>[{mount.name}]</span>;
}

/** A Player's name in their Main's class colour. */
export function PlayerName({ player, className }: { player: string; className: string | undefined }) {
  return <span style={{ color: classColor(className) }}>{player}</span>;
}

/** A Character's name in their class colour. */
export function CharacterName({ name, className }: { name: string; className: string }) {
  return <span style={{ color: classColor(className) }}>{name}</span>;
}
