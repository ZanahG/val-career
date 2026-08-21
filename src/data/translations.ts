import type { GameLanguage } from "../types/settings";

export const translations = {
  es: {
    gameTitle: "Tu Carrera Valorant",
    buildLegacy: "CONSTRUYE TU LEGADO",

    nickname: "Nickname",
    country: "País",
    startingAge: "Edad inicial",
    role: "Rol",
    mainAgent: "Agente principal",

    beginCareer: "COMENZAR CARRERA",

    language: "Idioma",
    currency: "Moneda",

    contractOffers: "Ofertas de contrato",
    monthlySalary: "Sueldo mensual",
    contract: "Contrato",
    rosterRole: "Rol en el equipo",
    signingBonus: "Bono de fichaje",

    starter: "Titular",
    substitute: "Suplente",

    season: "Temporada",
    earnings: "Ganancias",
    followers: "Seguidores",
    reputation: "Reputación",
  },

  en: {
    gameTitle: "Your Valorant Career",
    buildLegacy: "BUILD YOUR LEGACY",

    nickname: "Nickname",
    country: "Country",
    startingAge: "Starting age",
    role: "Role",
    mainAgent: "Main agent",

    beginCareer: "BEGIN CAREER",

    language: "Language",
    currency: "Currency",

    contractOffers: "Contract Offers",
    monthlySalary: "Monthly salary",
    contract: "Contract",
    rosterRole: "Roster role",
    signingBonus: "Signing bonus",

    starter: "Starter",
    substitute: "Substitute",

    season: "Season",
    earnings: "Earnings",
    followers: "Followers",
    reputation: "Reputation",
  },
} satisfies Record<
  GameLanguage,
  Record<string, string>
>;