import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Forever Tracker',
  description: 'Level progress for our WoW Forever group',
};

// Wowhead's script adds the hover tooltip to item links. Its own recolouring, renaming and icons stay off:
// the links are already drawn from armory data (src/components/GameLinks.tsx).
const WOWHEAD_OPTIONS = 'const whTooltips = { colorLinks: false, iconizeLinks: false, renameLinks: false };';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Look-alikes for the game's fonts: Cinzel for titles, PT Sans Narrow for text. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=PT+Sans+Narrow:wght@400;700&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: WOWHEAD_OPTIONS }} />
        <script src="https://wow.zamimg.com/js/tooltips.js" async />
      </head>
      {/* Wowhead's script adds classes to <body>. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
