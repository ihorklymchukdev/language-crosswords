import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

// False while hydrating the static web HTML, true afterwards (and always on native). Values that
// differ between the server and this device (colour scheme, window size, today's date) must wait
// for it, or React keeps the server's markup.
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
