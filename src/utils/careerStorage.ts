import {INTRO_EVENT_COUNT_STORAGE_KEY} from "../config/career";
import {readStorage,removeStorage,writeStorage} from "./saveStorage";

export function loadIntroEventCount() {
  const raw = readStorage(INTRO_EVENT_COUNT_STORAGE_KEY);
  const stored = Number(raw);
  return raw !== null && Number.isFinite(stored) && stored >= 0 ? stored : 0;
}

export function saveIntroEventCount(value:number) {
  writeStorage(INTRO_EVENT_COUNT_STORAGE_KEY,String(value));
}

export function clearIntroEventCount() {
  removeStorage(INTRO_EVENT_COUNT_STORAGE_KEY);
}
