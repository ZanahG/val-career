import type {PlayerRegion} from "../types/career";

export function getCareerMarketRegion(region:PlayerRegion) {
  if (region === "Europe" || region === "MENA" || region === "Turkey" || region === "CIS") return "Europe";
  if (region === "LATAM") return "LATAM";
  if (region === "Brazil") return "Brazil";
  if (region === "North America") return "North America";
  if (region === "Korea") return "Korea";
  if (region === "Japan") return "Japan";
  if (region === "Southeast Asia") return "Southeast Asia";
  if (region === "South Asia") return "South Asia";
  if (region === "Oceania") return "Oceania";
  if (region === "China") return "China";
  return region;
}