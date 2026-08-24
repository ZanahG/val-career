export type PlayerRole = "Duelist"|"Initiator"|"Controller"|"Sentinel"|"Flex";

export type CareerStage = "Ranked"|"Amateur"|"Tier 2"|"VCT"|"Retired";

export type CompetitiveCircuit = "Americas"|"EMEA"|"Pacific"|"China";

export type TeamRegion = "LATAM"|"LATAM North"|"BR"|"NA"|"EMEA"|"Pacific"|"China";

export type PlayerRegion =
  | "LATAM"
  | "LATAM North"
  | "Brazil"
  | "North America"
  | "Europe"
  | "MENA"
  | "Turkey"
  | "CIS"
  | "Korea"
  | "Japan"
  | "Southeast Asia"
  | "South Asia"
  | "Oceania"
  | "China";

export type MarketRegion =
  | "LATAM"
  | "LATAM North"
  | "Brazil"
  | "North America"
  | "Europe"
  | "MENA"
  | "Turkey"
  | "CIS"
  | "Korea"
  | "Japan"
  | "Southeast Asia"
  | "South Asia"
  | "Oceania"
  | "China";

export type RosterRole = "Starter"|"Substitute";

export interface PlayerStats {
  aim:number;
  gameSense:number;
  communication:number;
  clutch:number;
  consistency:number;
  mental:number;
}

export interface ReputationStats {
  reputation:number;
  popularity:number;
  professionalism:number;
  teamwork:number;
  toxicity:number;
}

export interface TeamDefinition {
  id:string;
  name:string;
  shortName:string;
  country:string;
  region:TeamRegion;
  marketRegion:MarketRegion;
  circuit:CompetitiveCircuit;
  tier:1|2;
  prestige:number;
  strength:number;
  salaryMin:number;
  salaryMax:number;
  logo?:string;
  academy?:boolean;
  ascensionEligible?:boolean;
}

export interface ContractOffer {
  id:string;
  teamId:string;
  salary:number;
  duration:number;
  rosterRole:RosterRole;
  signingBonus:number;
  expectations:string;
}

export interface CareerHistoryEntry {
  season:number;
  teamId:string;
  teamName:string;
  rosterRole:RosterRole;
  salary:number;
  wins:number;
  losses:number;
  placement:number;
  trophies:string[];
  stage?:CareerStage;
  ascensionQualified?:boolean;
  ascensionWon?:boolean;
  ascensionWins?:number;
  ascensionLosses?:number;
  vctCircuit?:CompetitiveCircuit;
  championshipPoints?:number;
  vctEvents?:CareerVCTEventHistory[];
}

export interface CareerVCTEventHistory {
  name:string;
  wins:number;
  losses:number;
  placement?:number;
  status:string;
}

export interface CareerPlayer {
  nickname:string;
  country:string;
  region:PlayerRegion;
  age:number;
  role:PlayerRole;
  mainAgent:string;
  stats:PlayerStats;
  reputationStats:ReputationStats;
  followers:number;
  earnings:number;
  currentTeamId?:string;
  currentTeam:string;
  currentStage:CareerStage;
  rosterRole:RosterRole;
  salary:number;
  contractSeasonsRemaining:number;
  season:number;
  careerPoints:number;
  history:CareerHistoryEntry[];
  trophies:string[];
  vctEligible?:boolean;
  equippedBannerId:string;
  equippedTitleId:string;
  unlockedBannerIds:string[];
  unlockedTitleIds:string[];
  photo?:string;
}

export interface CareerEffects {
  aim?:number;
  gameSense?:number;
  communication?:number;
  clutch?:number;
  consistency?:number;
  mental?:number;
  reputation?:number;
  popularity?:number;
  professionalism?:number;
  teamwork?:number;
  toxicity?:number;
  followers?:number;
  earnings?:number;
  careerPoints?:number;
  currentTeam?:string;
  currentStage?:CareerStage;
}

export interface LocalizedText {
  es:string;
  en:string;
}

export interface CareerChoice {
  id:string;
  label:LocalizedText;
  description:LocalizedText;
  effects:CareerEffects;
  nextEventId?:string;
}

export interface CareerEvent {
  id:string;
  eyebrow:LocalizedText;
  title:LocalizedText;
  description:LocalizedText;
  choices:CareerChoice[];
}