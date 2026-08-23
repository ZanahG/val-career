import {INTRO_EVENT_COUNT_STORAGE_KEY} from "../config/career";

export function loadIntroEventCount() {
  const stored = Number(window.localStorage.getItem(INTRO_EVENT_COUNT_STORAGE_KEY));
  return Number.isFinite(stored) && stored >= 0 ? stored : 0;
}

export function saveIntroEventCount(value:number) {
  window.localStorage.setItem(INTRO_EVENT_COUNT_STORAGE_KEY,String(value));
}

export function clearIntroEventCount() {
  window.localStorage.removeItem(INTRO_EVENT_COUNT_STORAGE_KEY);
}