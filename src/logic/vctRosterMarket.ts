import type {VCTRealPlayer} from "../data/vctPlayers";
import type {VCTRosterState,VCTTransfer} from "../types/vctRosters";
import {TEAMS} from "../data/teams";

const shuffle = <T,>(items:T[]) => [...items].sort(() => Math.random() - .5);
const clamp = (value:number,min:number,max:number) => Math.max(min,Math.min(max,value));

const REGION_TRANSFER_WEIGHTS:Record<string,Record<string,number>> = {
  Americas:{Americas:1,EMEA:.55,Pacific:.15,China:.05},
  EMEA:{Americas:.55,EMEA:1,Pacific:.25,China:.08},
  Pacific:{Americas:.15,EMEA:.25,Pacific:1,China:.35},
  China:{Americas:.05,EMEA:.08,Pacific:.35,China:1},
};

export function simulateVCTOffseason(state:VCTRosterState,nextSeason:number):VCTRosterState {
  const players = state.players.map((player) => ({...player,stats:{...player.stats}}));
  const transfers:VCTTransfer[] = [];

  const teams = [...new Set(players.map((player) => player.team))];

  for (const teamName of shuffle(teams)) {
    if (Math.random() > .45) continue;

    attemptTeamTransfer(players,teamName,nextSeason,transfers);
  }

  return {
    ...state,
    season:nextSeason,
    players,
    transfers:[...(state.transfers ?? []),...transfers],
  };
}

function attemptTeamTransfer(players:VCTRealPlayer[],teamName:string,season:number,transfers:VCTTransfer[]) {
  const roster = players.filter((player) => player.team === teamName);
  if (roster.length !== 5) return;

  const outgoing = pickTransferCandidate(roster);
  if (!outgoing) return;

  const originRegion = normalizeRegion(outgoing.region);
  const targetTeam = pickTargetTeam(players,teamName,originRegion,outgoing);

  if (!targetTeam) return;

  const targetRoster = players.filter((player) => player.team === targetTeam);
  if (targetRoster.length !== 5) return;

  const incoming = pickCompatibleCandidate(targetRoster,outgoing);
  if (!incoming) return;

  const outgoingName = outgoing.ign;
  const incomingName = incoming.ign;

  outgoing.team = targetTeam;
  incoming.team = teamName;

  transfers.push(
    {season,player:outgoingName,from:teamName,to:targetTeam},
    {season,player:incomingName,from:targetTeam,to:teamName},
  );
}

function pickTargetTeam(players:VCTRealPlayer[],originTeam:string,originRegion:string,outgoing:VCTRealPlayer) {
  const teamNames = [...new Set(players.map((player) => player.team))].filter((team) => team !== originTeam);

  const candidates = teamNames.map((teamName) => {
    const roster = players.filter((player) => player.team === teamName);
    const region = normalizeRegion(roster[0]?.region ?? "");
    const team = TEAMS.find((item) => item.name === teamName);

    const regionWeight = getRegionTransferWeight(originRegion,region);
    const prestigeBonus = team ? getPrestigeBonus(team.prestige) : 0;
    const roleNeed = getRoleNeedScore(roster,outgoing.role);

    const score =
      regionWeight * 60 +
      prestigeBonus * 20 +
      roleNeed * 20 +
      Math.random() * 15;

    return {teamName,score,regionWeight};
  });

  const eligible = candidates.filter((candidate) => {
    const chance = clamp(candidate.regionWeight + .08,0,1);
    return Math.random() < chance;
  });

  if (!eligible.length) return undefined;

  eligible.sort((a,b) => b.score - a.score);

  const topCandidates = eligible.slice(0,Math.min(4,eligible.length));
  return shuffle(topCandidates)[0]?.teamName;
}

function pickTransferCandidate(roster:VCTRealPlayer[]) {
  const scored = roster.map((player) => {
    const skill = getPlayerSkill(player);
    const expendability = 100 - skill;
    const randomFactor = Math.random() * 25;

    return {
      player,
      score:expendability * .65 + randomFactor,
    };
  });

  scored.sort((a,b) => b.score - a.score);

  const candidates = scored.slice(0,Math.min(3,scored.length));

  return shuffle(candidates)[0]?.player;
}

function pickCompatibleCandidate(roster:VCTRealPlayer[],outgoing:VCTRealPlayer) {
  const wantedRole = normalizeRole(outgoing.role);

  const scored = roster.map((candidate) => {
    const candidateRole = normalizeRole(candidate.role);
    const sameRoleBonus = candidateRole === wantedRole ? 35 : 0;
    const flexBonus = candidateRole === "Flex" ? 12 : 0;
    const skill = getPlayerSkill(candidate);

    return {
      player:candidate,
      score:sameRoleBonus + flexBonus + skill * .35 + Math.random() * 15,
    };
  });

  scored.sort((a,b) => b.score - a.score);

  const candidates = scored.slice(0,Math.min(3,scored.length));

  return shuffle(candidates)[0]?.player;
}

function getRoleNeedScore(roster:VCTRealPlayer[],role:string) {
  const wantedRole = normalizeRole(role);

  const exactCount = roster.filter((player) => normalizeRole(player.role) === wantedRole).length;

  if (exactCount === 0) return 1;
  if (exactCount === 1) return .45;

  return .1;
}

function getPrestigeBonus(prestige:number) {
  if (prestige >= 92) return 1;
  if (prestige >= 86) return .75;
  if (prestige >= 80) return .5;
  if (prestige >= 74) return .3;
  return .15;
}

function getRegionTransferWeight(fromRegion:string,toRegion:string) {
  return REGION_TRANSFER_WEIGHTS[fromRegion]?.[toRegion] ?? .05;
}

function normalizeRegion(region:string) {
  const value = region.trim().toLowerCase();

  if (value.includes("america")) return "Americas";
  if (value.includes("emea") || value.includes("europe")) return "EMEA";
  if (value.includes("pacific")) return "Pacific";
  if (value.includes("china")) return "China";

  return region;
}

function normalizeRole(role:string) {
  if (role === "Duelista" || role === "Duelist") return "Duelist";
  if (role === "Iniciador" || role === "Initiator") return "Initiator";
  if (role === "Controlador" || role === "Controller") return "Controller";
  if (role === "Centinela" || role === "Sentinel") return "Sentinel";
  if (role === "IGL") return "IGL";
  return "Flex";
}

function getPlayerSkill(player:VCTRealPlayer) {
  const {aim,clutch,gameSense,communication,consistency,mental} = player.stats;

  return (
    aim * .30 +
    consistency * .20 +
    gameSense * .18 +
    clutch * .12 +
    mental * .10 +
    communication * .10
  );
}