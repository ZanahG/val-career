export interface PlayerBannerDefinition {
  id: string;
  name: {es: string; en: string};
  image: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
}

export interface PlayerTitleDefinition {
  id: string;
  name: {es: string; en: string};
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
}

const bannerImages = import.meta.glob("../images/playercards/*.{png,jpg,jpeg,webp}", {eager: true, import: "default"}) as Record<string,string>;

const getBannerImage = (file: string) => bannerImages[`../images/playercards/${file}`] ?? "";

export const PLAYER_BANNERS: PlayerBannerDefinition[] = [
  {id: "rookie", name: {es: "Primer paso", en: "First Step"}, image: getBannerImage("rookie.png"), rarity: "Common"},
  {id: "radiant", name: {es: "Radiant", en: "Radiant"}, image: getBannerImage("radiant.png"), rarity: "Rare"},
  {id: "challenger", name: {es: "Challenger", en: "Challenger"}, image: getBannerImage("challenger.png"), rarity: "Rare"},
  {id: "ascension", name: {es: "Ascension", en: "Ascension"}, image: getBannerImage("ascension.png"), rarity: "Epic"},
  {id: "vct", name: {es: "VCT", en: "VCT"}, image: getBannerImage("vct.png"), rarity: "Epic"},
  {id: "masters", name: {es: "Masters", en: "Masters"}, image: getBannerImage("masters.png"), rarity: "Legendary"},
  {id: "champion", name: {es: "Campeón mundial", en: "World Champion"}, image: getBannerImage("champion.png"), rarity: "Legendary"},
];

export const PLAYER_TITLES: PlayerTitleDefinition[] = [
  {id: "unknown-prospect", name: {es: "Promesa desconocida", en: "Unknown Prospect"}, rarity: "Common"},
  {id: "radiant-player", name: {es: "Radiant", en: "Radiant"}, rarity: "Rare"},
  {id: "challengers-player", name: {es: "Jugador de Challengers", en: "Challengers Player"}, rarity: "Rare"},
  {id: "ascension-winner", name: {es: "Ganador de Ascension", en: "Ascension Winner"}, rarity: "Epic"},
  {id: "vct-player", name: {es: "Jugador VCT", en: "VCT Player"}, rarity: "Epic"},
  {id: "masters-winner", name: {es: "Campeón de Masters", en: "Masters Champion"}, rarity: "Legendary"},
  {id: "world-champion", name: {es: "Campeón del mundo", en: "World Champion"}, rarity: "Legendary"},
];

export const getPlayerBanner = (id: string) => PLAYER_BANNERS.find((banner) => banner.id === id);
export const getPlayerTitle = (id: string) => PLAYER_TITLES.find((title) => title.id === id);