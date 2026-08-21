import type {CompetitiveCircuit, PlayerRegion} from "../types/career";

export const getCircuitFromRegion = (region: PlayerRegion): CompetitiveCircuit => {
  if (region === "LATAM" || region === "Brazil" || region === "North America") return "Americas";
  if (region === "Europe" || region === "MENA" || region === "Turkey" || region === "CIS") return "EMEA";
  if (region === "China") return "China";
  return "Pacific";
};