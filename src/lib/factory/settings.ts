// Client-side persisted settings (localStorage). No database by design.
import { useSyncExternalStore } from "react";

export type Settings = { plantName: string; contributionPerUnit: number; horizonHours: number };

export const SETTINGS_KEY = "factorypulse.settings.v1";
export const DEFAULT_SETTINGS: Settings = { plantName: "Plant A — Vadodara", contributionPerUnit: 175, horizonHours: 16 };

export const LIMITS = { contributionPerUnit: { min: 1, max: 100000 }, horizonHours: { min: 1, max: 48 } } as const;

export type SettingsErrors = Partial<Record<keyof Settings, string>>;

/** Validates raw form input. Returns either clean settings or field errors — never a half-valid object. */
export function validateSettings(raw: { plantName: unknown; contributionPerUnit: unknown; horizonHours: unknown }): { ok: true; value: Settings } | { ok: false; errors: SettingsErrors } {
  const errors: SettingsErrors = {};
  const plantName = typeof raw.plantName === "string" ? raw.plantName.trim() : "";
  if (!plantName) errors.plantName = "Enter a plant name.";
  else if (plantName.length > 60) errors.plantName = "Keep the plant name under 60 characters.";
  const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN);
  const c = num(raw.contributionPerUnit);
  if (!Number.isFinite(c) || c < LIMITS.contributionPerUnit.min || c > LIMITS.contributionPerUnit.max) errors.contributionPerUnit = `Enter a value between ₹${LIMITS.contributionPerUnit.min} and ₹${LIMITS.contributionPerUnit.max.toLocaleString("en-IN")}.`;
  const h = num(raw.horizonHours);
  if (!Number.isFinite(h) || !Number.isInteger(h) || h < LIMITS.horizonHours.min || h > LIMITS.horizonHours.max) errors.horizonHours = `Enter whole hours between ${LIMITS.horizonHours.min} and ${LIMITS.horizonHours.max}.`;
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { plantName, contributionPerUnit: c, horizonHours: h } };
}

/** Parses stored JSON; anything corrupt falls back to defaults field by field. */
export function parseStoredSettings(json: string | null): Settings {
  if (!json) return DEFAULT_SETTINGS;
  try {
    const p = JSON.parse(json) as Partial<Settings>;
    const merged = { ...DEFAULT_SETTINGS, ...p };
    const r = validateSettings(merged);
    if (r.ok) return r.value;
    const out = { ...DEFAULT_SETTINGS };
    if (!r.errors.plantName) out.plantName = String(merged.plantName).trim();
    if (!r.errors.contributionPerUnit) out.contributionPerUnit = Number(merged.contributionPerUnit);
    if (!r.errors.horizonHours) out.horizonHours = Number(merged.horizonHours);
    return out;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const listeners = new Set<() => void>();
let cache: { raw: string | null; value: Settings } | null = null;

function read(): Settings {
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(SETTINGS_KEY); } catch { /* storage blocked */ }
  if (!cache || cache.raw !== raw) cache = { raw, value: parseStoredSettings(raw) };
  return cache.value;
}

export function saveSettings(s: Settings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  listeners.forEach(l => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === SETTINGS_KEY) l(); };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
}

const SERVER: { settings: Settings; hydrated: boolean } = { settings: DEFAULT_SETTINGS, hydrated: false };
let clientSnap: { settings: Settings; hydrated: true } | null = null;

/** Returns saved settings; `hydrated` is false during SSR/first paint so queries wait for real values. */
export function useSettings() {
  return useSyncExternalStore(
    subscribe,
    () => { const s = read(); if (!clientSnap || clientSnap.settings !== s) clientSnap = { settings: s, hydrated: true }; return clientSnap; },
    () => SERVER,
  );
}

export function calcOptions(s: Settings) {
  return { contributionPerUnit: s.contributionPerUnit, horizonHours: s.horizonHours };
}

export const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;
