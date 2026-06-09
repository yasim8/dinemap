"use client";
import { useEffect, useState } from "react";

// Lightweight client-side auth flag. Persisted to localStorage so the signed-in
// state survives the full-page navigation to /login and back (each route mount
// re-reads it). There's no backend yet — this just tracks "is someone signed in".
const KEY = "dinemap.authed";
const EVENT = "dinemap:authed-change";

export function isAuthed() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setAuthed(value) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
  } catch {
    /* ignore storage failures (private mode, etc.) */
  }
  // localStorage's native "storage" event doesn't fire in the same tab, so notify
  // listeners in this tab explicitly.
  window.dispatchEvent(new Event(EVENT));
}

// Reactive auth flag. Initialises to false for a stable server/first-client render,
// then syncs from localStorage after mount to avoid hydration mismatches.
export function useAuthed() {
  const [authed, setState] = useState(false);
  useEffect(() => {
    const sync = () => setState(isAuthed());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return authed;
}
