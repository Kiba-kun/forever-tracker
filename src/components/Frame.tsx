import type { ReactNode } from 'react';

/** A stone-and-gold window with its title on a plaque, like the game's own windows. */
export function Frame({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`frame${className ? ` ${className}` : ''}`}>
      <h2 className="plaque">{title}</h2>
      {children}
    </section>
  );
}
