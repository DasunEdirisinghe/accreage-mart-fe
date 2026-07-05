"use client";

import { useSyncExternalStore } from "react";
import { getDB, subscribe, type DB } from "@/lib/store";

/**
 * Subscribe a client component to the mock store.
 * When the backend is wired, replace usages with data-fetching hooks
 * (e.g. SWR / react-query against Frappe REST endpoints).
 */
export function useDB(): DB {
  return useSyncExternalStore(subscribe, getDB, getDB);
}
