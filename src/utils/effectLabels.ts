import type {CareerEffects} from "../types/career";

export interface EffectPreview {
  key: keyof CareerEffects;
  direction: "up" | "down";
}

const EFFECT_KEYS: Array<keyof CareerEffects> = [
  "aim","gameSense","communication","clutch","consistency","mental",
  "reputation","popularity","professionalism","teamwork","toxicity",
  "followers","earnings","careerPoints",
];

export function getEffectPreviews(effects: CareerEffects): EffectPreview[] {
  return EFFECT_KEYS.flatMap((key) => {
    const value = effects[key];
    if (typeof value !== "number" || value === 0) return [];
    return [{key, direction: value > 0 ? "up" : "down"}];
  });
}

export function getEffectLabel(key: keyof CareerEffects, language: "es" | "en") {
  const labels: Partial<Record<keyof CareerEffects, {es: string; en: string}>> = {
    aim: {es: "AIM", en: "AIM"},
    gameSense: {es: "GAME SENSE", en: "GAME SENSE"},
    communication: {es: "COMUNICACIÓN", en: "COMMUNICATION"},
    clutch: {es: "CLUTCH", en: "CLUTCH"},
    consistency: {es: "CONSISTENCIA", en: "CONSISTENCY"},
    mental: {es: "MENTAL", en: "MENTAL"},
    reputation: {es: "REPUTACIÓN", en: "REPUTATION"},
    popularity: {es: "POPULARIDAD", en: "POPULARITY"},
    professionalism: {es: "PROFESIONALISMO", en: "PROFESSIONALISM"},
    teamwork: {es: "TRABAJO EN EQUIPO", en: "TEAMWORK"},
    toxicity: {es: "TOXICIDAD", en: "TOXICITY"},
    followers: {es: "SEGUIDORES", en: "FOLLOWERS"},
    earnings: {es: "GANANCIAS", en: "EARNINGS"},
    careerPoints: {es: "PTS CARRERA", en: "CAREER PTS"},
  };

  return labels[key]?.[language] ?? String(key).toUpperCase();
}