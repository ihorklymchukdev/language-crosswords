import { useIsFocused } from 'expo-router';
import { useEffect } from 'react';
import { APP_NAME } from './app-info';

const isServer = typeof window === 'undefined';

// React 19 hoists <title> into <head>, including in the static export; expo-router's Head
// only sets it after hydration there. The browser uses the first <title>, so only the focused
// screen renders one: tabs and screens under a pushed page stay mounted.
// The app hydrates #root, not <head>, so the server's copy is never adopted; drop it on the client.
export function DocumentTitle({ title }: { title?: string }) {
  const focused = useIsFocused();
  useEffect(() => {
    document.querySelectorAll('title[data-ssr]').forEach((t) => t.remove());
  }, []);
  if (!focused) return null;
  const text = title === undefined ? APP_NAME : `${title} · ${APP_NAME}`;
  return isServer ? <title data-ssr="">{text}</title> : <title>{text}</title>;
}
