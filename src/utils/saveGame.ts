import type {CareerSave} from "../types/save";

const SAVE_KEY = "tu-carrera-valorant-save";

export function saveCareer(save: CareerSave) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function loadCareer(): CareerSave | null {
  const stored = localStorage.getItem(SAVE_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as CareerSave;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasCareerSave() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function deleteCareerSave() {
  localStorage.removeItem(SAVE_KEY);
}