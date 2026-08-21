import type {VCTPhase, VCTSeasonDefinition} from "../types/vct";

export const VCT_EVENT_ORDER: Exclude<VCTPhase, "Complete">[] = ["Kickoff","Masters 1","Stage 1","Stage 1 Playoffs","Masters 2","Stage 2","Stage 2 Playoffs","Champions"];

export const VCT_SEASONS: Record<number, VCTSeasonDefinition> = {
  2026: {
    year: 2026,
    masters1: {name: "Masters Santiago", location: "Santiago, Chile"},
    masters2: {name: "Masters London", location: "London, United Kingdom"},
    champions: {name: "Champions Shanghai", location: "Shanghai, China"},
  },
};

export const getVCTSeasonDefinition = (year: number): VCTSeasonDefinition => VCT_SEASONS[year] ?? {
  year,
  masters1: {name: "Masters 1", location: "TBD"},
  masters2: {name: "Masters 2", location: "TBD"},
  champions: {name: "Champions", location: "TBD"},
};