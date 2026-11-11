import { useIsFocused } from 'expo-router';
import { useEffect } from 'react';
import { APP_NAME } from './app-info';

const isServer = typeof window === 'undefined';

// The static HTML gets a real <title> (React 19 hoists it into <head>). On the client the focused
// screen sets document.title instead: tabs and screens under a pushed page stay mounted, and the
// app hydrates #root, not <head>, so a rendered <title> would pile up next to the server's.
export function DocumentTitle({ title }: { title?: string }) {
  const focused = useIsFocused();
  const text = title === undefined ? APP_NAME : `${title} · ${APP_NAME}`;
  useEffect(() => {
    if (focused) document.title = text;
  }, [focused, text]);
  return isServer ? <title>{text}</title> : null;
}
