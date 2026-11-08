'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** A scrolling chat window that opens on its newest line, at the bottom. */
export function ChatWindow({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, []);
  return <ol className="chat" ref={ref}>{children}</ol>;
}
