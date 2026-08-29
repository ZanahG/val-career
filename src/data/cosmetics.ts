import type {CareerPlayer} from "../types/career";

export type CosmeticRarity = "Common"|"Rare"|"Epic"|"Legendary";
export type CosmeticUnlockType = "default"|"radiant"|"challengers"|"ascension"|"vct"|"masters"|"champions";

interface CosmeticUnlock {
  type:CosmeticUnlockType;
  description:{es:string;en:string};
}

export interface PlayerBannerDefinition {
  id:string;
  name:{es:string;en:string};
  image:string;
  rarity:CosmeticRarity;
  unlock:CosmeticUnlock;
}

export interface PlayerTitleDefinition {
  id:string;
  name:{es:string;en:string};
  rarity:CosmeticRarity;
  unlock:CosmeticUnlock;
}

const bannerImages = import.meta.glob("../images/cards/*.{png,jpg,jpeg,webp}",{eager:true,import:"default"}) as Record<string,string>;

const getBannerImage = (file:string) => bannerImages[`../images/cards/${file}`] ?? "";

export const PLAYER_BANNERS:PlayerBannerDefinition[] = [
  {
    id:"rookie",
    name:{es:"Primer paso",en:"First Step"},
    image:getBannerImage("1.webp"),
    rarity:"Common",
    unlock:{type:"default",description:{es:"Disponible desde el inicio.",en:"Available from the start."}},
  },
  {
    id:"radiant",
    name:{es:"Radiant",en:"Radiant"},
    image:getBannerImage("2.webp"),
    rarity:"Rare",
    unlock:{type:"radiant",description:{es:"Completa tu etapa inicial y entra al circuito competitivo.",en:"Complete your opening chapter and enter competitive play."}},
  },
  {
    id:"challenger",
    name:{es:"Challenger",en:"Challenger"},
    image:getBannerImage("3.webp"),
    rarity:"Rare",
    unlock:{type:"challengers",description:{es:"Conviértete en jugador de Challengers.",en:"Become a Challengers player."}},
  },
  {
    id:"ascension",
    name:{es:"Ascension",en:"Ascension"},
    image:getBannerImage("4.webp"),
    rarity:"Epic",
    unlock:{type:"ascension",description:{es:"Gana Ascension.",en:"Win Ascension."}},
  },
  {
    id:"vct",
    name:{es:"VCT",en:"VCT"},
    image:getBannerImage("5.png"),
    rarity:"Epic",
    unlock:{type:"vct",description:{es:"Llega al Valorant Champions Tour.",en:"Reach the Valorant Champions Tour."}},
  },
  {
    id:"masters",
    name:{es:"Masters",en:"Masters"},
    image:getBannerImage("6.webp"),
    rarity:"Legendary",
    unlock:{type:"masters",description:{es:"Gana un torneo Masters.",en:"Win a Masters tournament."}},
  },
  {
    id:"champion",
    name:{es:"Campeón mundial",en:"World Champion"},
    image:getBannerImage("7.webp"),
    rarity:"Legendary",
    unlock:{type:"champions",description:{es:"Gana VALORANT Champions.",en:"Win VALORANT Champions."}},
  },
];

export const PLAYER_TITLES:PlayerTitleDefinition[] = [
  {
    id:"unknown-prospect",
    name:{es:"Promesa desconocida",en:"Unknown Prospect"},
    rarity:"Common",
    unlock:{type:"default",description:{es:"Disponible desde el inicio.",en:"Available from the start."}},
  },
  {
    id:"radiant-player",
    name:{es:"Radiant",en:"Radiant"},
    rarity:"Rare",
    unlock:{type:"radiant",description:{es:"Completa tu etapa inicial y entra al circuito competitivo.",en:"Complete your opening chapter and enter competitive play."}},
  },
  {
    id:"challengers-player",
    name:{es:"Jugador de Challengers",en:"Challengers Player"},
    rarity:"Rare",
    unlock:{type:"challengers",description:{es:"Conviértete en jugador de Challengers.",en:"Become a Challengers player."}},
  },
  {
    id:"ascension-winner",
    name:{es:"Ganador de Ascension",en:"Ascension Winner"},
    rarity:"Epic",
    unlock:{type:"ascension",description:{es:"Gana Ascension.",en:"Win Ascension."}},
  },
  {
    id:"vct-player",
    name:{es:"Jugador VCT",en:"VCT Player"},
    rarity:"Epic",
    unlock:{type:"vct",description:{es:"Llega al Valorant Champions Tour.",en:"Reach the Valorant Champions Tour."}},
  },
  {
    id:"masters-winner",
    name:{es:"Campeón de Masters",en:"Masters Champion"},
    rarity:"Legendary",
    unlock:{type:"masters",description:{es:"Gana un torneo Masters.",en:"Win a Masters tournament."}},
  },
  {
    id:"world-champion",
    name:{es:"Campeón del mundo",en:"World Champion"},
    rarity:"Legendary",
    unlock:{type:"champions",description:{es:"Gana VALORANT Champions.",en:"Win VALORANT Champions."}},
  },
];

export function isCosmeticUnlocked(type:CosmeticUnlockType,player:CareerPlayer) {
  if (type === "default") return true;

  if (type === "radiant") {
    return player.currentStage !== "Ranked" || player.history.length > 0;
  }

  if (type === "challengers") {
    return player.currentStage === "Amateur" || player.currentStage === "VCT" || player.history.length > 0;
  }

  if (type === "ascension") {
    return player.history.some((season) => season.ascensionWon);
  }

  if (type === "vct") {
    return player.currentStage === "VCT" || hasTrophyContaining(player,"VCT") || hasTrophyContaining(player,"Masters") || hasTrophyContaining(player,"Champions");
  }

  if (type === "masters") {
    return hasTrophyContaining(player,"Masters");
  }

  if (type === "champions") {
    return hasTrophyContaining(player,"Champions") || hasTrophyContaining(player,"World Champion") || hasTrophyContaining(player,"Campeón del mundo");
  }

  return false;
}

export const isPlayerBannerUnlocked = (banner:PlayerBannerDefinition,player:CareerPlayer) => isCosmeticUnlocked(banner.unlock.type,player);
export const isPlayerTitleUnlocked = (title:PlayerTitleDefinition,player:CareerPlayer) => isCosmeticUnlocked(title.unlock.type,player);

export const getPlayerBanner = (id:string) => PLAYER_BANNERS.find((banner) => banner.id === id);
export const getPlayerTitle = (id:string) => PLAYER_TITLES.find((title) => title.id === id);

function hasTrophyContaining(player:CareerPlayer,text:string) {
  const normalizedText = normalize(text);
  return player.trophies.some((trophy) => normalize(trophy).includes(normalizedText));
}

function normalize(value:string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
}