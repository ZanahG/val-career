import playersData from "./vctTier1Players.json";
import type {VCTRosterState} from "../types/vctRosters";
import type {CareerPlayer} from "../types/career";

export interface VCTRealPlayer {
  ign:string;
  team:string;
  region:string;
  role:string;
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

const VCT_PLAYERS = playersData.vct_players as VCTRealPlayer[];

export function createInitialVCTRosterState(season:number):VCTRosterState {
  return {
    season,
    initialized:true,
    players:VCT_PLAYERS.map((player) => ({...player,stats:{...player.stats}})),
    transfers:[],
  };
}

export function getVCTTeamPlayers(teamName:string,rosterState?:VCTRosterState) {
  const players = rosterState?.players ?? VCT_PLAYERS;
  return players.filter((player) => player.team === teamName);
}

export function getEffectiveVCTRoster(teamName:string,careerPlayer?:CareerPlayer,rosterState?:VCTRosterState):VCTMatchPlayer[] {
  const roster = getVCTTeamPlayers(teamName,rosterState);

  if (!careerPlayer || careerPlayer.currentTeam !== teamName) return roster;

  const replacementIndex = findReplacementIndex(roster,careerPlayer.role);

  const careerEntry:VCTMatchPlayer = {
    ign:careerPlayer.nickname,
    team:teamName,
    region:"",
    role:careerPlayer.role,
    isCareerPlayer:true,
    stats:{...careerPlayer.stats},
  };

  if (replacementIndex === -1) return [...roster.slice(0,4),careerEntry];

  return roster.map((player,index) => index === replacementIndex ? careerEntry : player);
}

function findReplacementIndex(roster:VCTRealPlayer[],careerRole:string) {
  const wantedRole = mapCareerRoleToRosterRole(careerRole);

  const exactIndex = roster.findIndex((player) => normalizeRole(player.role) === wantedRole);
  if (exactIndex !== -1) return exactIndex;

  const flexIndex = roster.findIndex((player) => normalizeRole(player.role) === "Flex");
  if (flexIndex !== -1) return flexIndex;

  return roster.length ? Math.floor(Math.random() * roster.length) : -1;
}

function mapCareerRoleToRosterRole(role:string) {
  if (role === "Duelist") return "Duelista";
  if (role === "Controller") return "Controlador";
  if (role === "Initiator") return "Iniciador";
  if (role === "Sentinel") return "Centinela";
  return "Flex";
}

function normalizeRole(role:string) {
  return role;
}