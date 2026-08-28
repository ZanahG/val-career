import tier1Data from "./vctTier1Players.json";
import tier2Data from "./challengersTier2Players.json";
import type {VCTRosterState} from "../types/vctRosters";
import type {CareerPlayer} from "../types/career";

export interface VCTRealPlayer {
  ign:string;
  teamId?:string;
  team:string;
  tier:1|2;
  circuit:string;
  region:string;
  role:string;
  age:number;
  stats:{
    aim:number;
    clutch:number;
    gameSense:number;
    communication:number;
    consistency:number;
    mental:number;
  };
}

export interface VCTMatchPlayer extends VCTRealPlayer {
  isCareerPlayer?:boolean;
}

const TIER1_PLAYERS:VCTRealPlayer[]=tier1Data.vct_players.map(player=>({
  ...player,
  tier:1 as const,
  circuit:getCircuitFromRegion(player.region),
}));

const TIER2_PLAYERS:VCTRealPlayer[]=tier2Data.players.map(player=>({
  ...player,
  tier:2 as const,
}));

export const PRO_PLAYERS:VCTRealPlayer[]=[...TIER1_PLAYERS,...TIER2_PLAYERS];

export function createInitialVCTRosterState(season:number):VCTRosterState {
  return {
    season,
    initialized:true,
    players:PRO_PLAYERS.map(player=>({...player,stats:{...player.stats}})),
    transfers:[],
  };
}

export function getVCTTeamPlayers(teamName:string,rosterState?:VCTRosterState) {
  const players=rosterState?.players??PRO_PLAYERS;
  return players.filter(player=>player.team===teamName);
}

export function getTier1Players(rosterState?:VCTRosterState) {
  const players=rosterState?.players??PRO_PLAYERS;
  return players.filter(player=>player.tier===1);
}

export function getTier2Players(rosterState?:VCTRosterState) {
  const players=rosterState?.players??PRO_PLAYERS;
  return players.filter(player=>player.tier===2);
}

export function getEffectiveVCTRoster(teamName:string,careerPlayer?:CareerPlayer,rosterState?:VCTRosterState):VCTMatchPlayer[] {
  const roster=getVCTTeamPlayers(teamName,rosterState);

  if(!careerPlayer||careerPlayer.currentTeam!==teamName)return roster;

  const replacementIndex=findReplacementIndex(roster,careerPlayer.role);

  const careerEntry:VCTMatchPlayer={
    ign:careerPlayer.nickname,
    teamId:careerPlayer.currentTeamId,
    team:teamName,
    tier:careerPlayer.currentStage==="VCT"?1:2,
    circuit:getCareerCircuit(careerPlayer),
    region:careerPlayer.region,
    role:careerPlayer.role,
    age:careerPlayer.age,
    isCareerPlayer:true,
    stats:{...careerPlayer.stats},
  };

  if(replacementIndex===-1)return [...roster.slice(0,4),careerEntry];

  return roster.map((player,index)=>index===replacementIndex?careerEntry:player);
}

function findReplacementIndex(roster:VCTRealPlayer[],careerRole:string) {
  const wantedRole=mapCareerRoleToRosterRole(careerRole);

  const exactIndex=roster.findIndex(player=>normalizeRole(player.role)===wantedRole);
  if(exactIndex!==-1)return exactIndex;

  const flexIndex=roster.findIndex(player=>normalizeRole(player.role)==="Flex");
  if(flexIndex!==-1)return flexIndex;

  return roster.length?Math.floor(Math.random()*roster.length):-1;
}

function mapCareerRoleToRosterRole(role:string) {
  if(role==="Duelist")return "Duelista";
  if(role==="Controller")return "Controlador";
  if(role==="Initiator")return "Iniciador";
  if(role==="Sentinel")return "Centinela";
  return "Flex";
}

function normalizeRole(role:string) {
  if(role==="Duelist"||role==="Duelista")return "Duelista";
  if(role==="Controller"||role==="Controlador")return "Controlador";
  if(role==="Initiator"||role==="Iniciador")return "Iniciador";
  if(role==="Sentinel"||role==="Centinela")return "Centinela";
  if(role==="IGL")return "IGL";
  return "Flex";
}

function getCircuitFromRegion(region:string) {
  if(region==="VCT Americas")return "Americas";
  if(region==="VCT EMEA")return "EMEA";
  if(region==="VCT Pacific")return "Pacific";
  if(region==="VCT China")return "China";
  return "Americas";
}

function getCareerCircuit(player:CareerPlayer) {
  if(player.region==="LATAM"||player.region==="Brazil"||player.region==="North America")return "Americas";
  if(player.region==="Europe"||player.region==="MENA"||player.region==="Turkey"||player.region==="CIS")return "EMEA";
  if(player.region==="China")return "China";
  return "Pacific";
}