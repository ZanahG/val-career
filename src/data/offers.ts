import type {CareerPlayer,ContractOffer,TeamDefinition} from "../types/career";
import {getPlayerOverallExact} from "../utils/playerOverall";
import {getCircuitFromRegion} from "./regions";
import {TEAMS} from "./teams";

const OFFER_COUNT = 3;

export function generateOffers(player:CareerPlayer):ContractOffer[] {
  const overall = getPlayerOverallExact(player);
  const scoutingScore = getPlayerScoutingScore(player);
  const homeCircuit = getCircuitFromRegion(player.region);
  const hasVCTExperience = player.history.some((entry) => entry.stage === "VCT");
  const firstVCTJump = player.currentStage === "Tier 2" && player.vctEligible && !hasVCTExperience;

  if (firstVCTJump) {
    const regionalPool = TEAMS.filter((team) => team.tier === 1 && team.marketRegion === player.region && team.id !== player.currentTeamId);
    const circuitFallbackPool = TEAMS.filter((team) => team.tier === 1 && team.circuit === homeCircuit && team.marketRegion !== player.region && team.id !== player.currentTeamId);

    const regionalEligible = regionalPool.filter((team) => canOfferContract(team,scoutingScore));
    const circuitEligible = circuitFallbackPool.filter((team) => canOfferContract(team,scoutingScore));

    const preferred = [
      ...sortTeamsForPlayer(regionalEligible,player,overall,scoutingScore,homeCircuit),
      ...sortTeamsForPlayer(circuitEligible,player,overall,scoutingScore,homeCircuit),
    ];

    const fallback = [
      ...sortTeamsForPlayer(regionalPool,player,overall,scoutingScore,homeCircuit),
      ...sortTeamsForPlayer(circuitFallbackPool,player,overall,scoutingScore,homeCircuit),
    ];

    const offerTeams = fillOffers(preferred,fallback,OFFER_COUNT);
    return offerTeams.map((team,index) => createOffer(team,player,overall,scoutingScore,index));
  }

  if (hasVCTExperience || player.currentStage === "VCT") {
    const worldwidePool = TEAMS.filter((team) => team.tier === 1 && team.id !== player.currentTeamId);
    const eligible = worldwidePool.filter((team) => canOfferContract(team,scoutingScore));

    const preferred = sortTeamsForPlayer(eligible,player,overall,scoutingScore,homeCircuit);
    const fallback = sortTeamsForPlayer(worldwidePool,player,overall,scoutingScore,homeCircuit);
    const offerTeams = fillOffers(preferred,fallback,OFFER_COUNT);

    return offerTeams.map((team,index) => createOffer(team,player,overall,scoutingScore,index));
  }

  const tier2Pool = TEAMS.filter((team) => team.tier === 2 && team.marketRegion === player.region && team.id !== player.currentTeamId);
  const eligible = tier2Pool.filter((team) => canOfferContract(team,scoutingScore));

  const preferred = sortTeamsForPlayer(eligible,player,overall,scoutingScore,homeCircuit);
  const fallback = sortTeamsForPlayer(tier2Pool,player,overall,scoutingScore,homeCircuit);
  const offerTeams = fillOffers(preferred,fallback,OFFER_COUNT);

  return offerTeams.map((team,index) => createOffer(team,player,overall,scoutingScore,index));
}

function getPlayerScoutingScore(player:CareerPlayer) {
  const overall = getPlayerOverallExact(player);
  const roleFit = getRoleFit(player);

  return overall * .75 + roleFit * .25;
}

function getRoleFit(player:CareerPlayer) {
  const role = player.role.trim().toLowerCase();
  const {aim,gameSense,communication,clutch,consistency,mental} = player.stats;

  if (role.includes("duelist")) {
    return aim * .35 + clutch * .20 + consistency * .15 + mental * .15 + gameSense * .10 + communication * .05;
  }

  if (role.includes("initiator")) {
    return gameSense * .25 + communication * .25 + aim * .15 + consistency * .15 + clutch * .10 + mental * .10;
  }

  if (role.includes("controller")) {
    return gameSense * .25 + communication * .25 + consistency * .20 + mental * .15 + aim * .10 + clutch * .05;
  }

  if (role.includes("sentinel")) {
    return gameSense * .25 + consistency * .25 + clutch * .15 + aim * .15 + communication * .10 + mental * .10;
  }

  return aim * .20 + gameSense * .20 + communication * .15 + clutch * .15 + consistency * .15 + mental * .15;
}

function canOfferContract(team:TeamDefinition,scoutingScore:number) {
  if (team.tier === 2) {
    const requiredLevel = 34 + (team.prestige - 50) * .12;
    return scoutingScore >= requiredLevel;
  }

  const requiredLevel = 60 + (team.prestige - 70) * .30;
  return scoutingScore >= requiredLevel;
}

function sortTeamsForPlayer(teams:TeamDefinition[],player:CareerPlayer,overall:number,scoutingScore:number,homeCircuit:string) {
  const playerCountry = normalizeCountry(player.country);

  return [...teams].sort((a,b) => {
    const aScore = getTeamInterestScore(a,player,overall,scoutingScore,homeCircuit,playerCountry);
    const bScore = getTeamInterestScore(b,player,overall,scoutingScore,homeCircuit,playerCountry);

    return bScore - aScore;
  });
}

function getTeamInterestScore(team:TeamDefinition,player:CareerPlayer,overall:number,scoutingScore:number,homeCircuit:string,playerCountry:string) {
  const sameCountryBonus = normalizeCountry(team.country) === playerCountry ? 5 : 0;
  const sameRegionBonus = team.marketRegion === player.region ? 7 : 0;
  const sameCircuitBonus = team.circuit === homeCircuit ? 3 : 0;

  const levelDifference = scoutingScore - team.strength;
  const competitiveFit = 12 - Math.abs(levelDifference) * .45;
  const starterOpportunity = scoutingScore >= team.strength - 4 ? 4 : scoutingScore >= team.strength - 8 ? 1 : -3;

  const overallQuality = (overall - 50) * .15;
  const roleFitQuality = (getRoleFit(player) - 50) * .12;
  const randomVariation = Math.random() * 6;

  return competitiveFit + starterOpportunity + sameCountryBonus + sameRegionBonus + sameCircuitBonus + overallQuality + roleFitQuality + randomVariation;
}

function fillOffers(preferred:TeamDefinition[],fallback:TeamDefinition[],count:number) {
  const selected:TeamDefinition[] = [];
  const seen = new Set<string>();

  const addTeams = (teams:TeamDefinition[]) => {
    for (const team of teams) {
      if (selected.length >= count) break;
      if (seen.has(team.id)) continue;

      selected.push(team);
      seen.add(team.id);
    }
  };

  addTeams(preferred);
  addTeams(fallback);

  return selected.slice(0,count);
}

function createOffer(team:TeamDefinition,player:CareerPlayer,overall:number,scoutingScore:number,index:number):ContractOffer {
  const salaryProgress = Math.max(0,Math.min(1,(scoutingScore - 42) / 40));
  const salary = Math.round(team.salaryMin + (team.salaryMax - team.salaryMin) * salaryProgress);

  const starterThreshold = team.strength - 5;
  const rosterRole:"Starter"|"Substitute" = scoutingScore >= starterThreshold ? "Starter" : "Substitute";

  const duration = team.tier === 1
    ? scoutingScore >= 78 ? 2 : Math.random() > .55 ? 2 : 1
    : index === 0 ? 1 : Math.random() > .5 ? 2 : 1;

  const signingBonusMultiplier = team.tier === 1 ? .75 : .4;
  const qualityBonus = Math.max(0,(overall - 60) / 100);
  const signingBonus = Math.round(salary * (signingBonusMultiplier + qualityBonus));

  return {
    id:`${player.season}-${team.id}-${index}`,
    teamId:team.id,
    salary,
    duration,
    rosterRole,
    signingBonus,
    expectations:getExpectations(team.tier,rosterRole),
  };
}

function getExpectations(tier:1|2,rosterRole:"Starter"|"Substitute") {
  if (tier === 1) {
    return rosterRole === "Starter"
      ? "Compete for international qualification and perform at a VCT level."
      : "Fight for the starting position and prove you belong in VCT.";
  }

  return rosterRole === "Starter"
    ? "Fight for Challengers playoffs and establish yourself as a top regional player."
    : "Earn your place in the starting roster and make an impact when called upon.";
}

function normalizeCountry(country:string) {
  return country.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}