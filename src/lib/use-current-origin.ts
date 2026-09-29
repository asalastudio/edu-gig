"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientOrigin = () => window.location.origin;
const getServerOrigin = () => undefined;

/**
 * `window.location.origin` without a hydration mismatch: the server render and
 * the hydration pass both see `undefined`, then React re-renders with the real
 * origin. Reading `window` directly during render made server and client HTML
 * disagree (e.g. auth switch links dropping `?next=`).
 */
export function useCurrentOrigin(): string | undefined {
    return useSyncExternalStore(subscribe, getClientOrigin, getServerOrigin);
}
