import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { localDateKey } from '../daily/dates';

function msUntilNextDay(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime() + 1000;
}

// Re-reads the local date on focus, on return from background and at midnight, so a screen left
// open overnight (or an app resumed the next morning) shows the new day.
export function useLocalToday(): string {
  const [today, setToday] = useState(localDateKey);
  const refresh = useCallback(() => setToday(localDateKey()), []);

  useFocusEffect(refresh);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  useEffect(() => {
    const t = setTimeout(refresh, msUntilNextDay(new Date()));
    return () => clearTimeout(t);
  }, [today, refresh]);

  return today;
}
