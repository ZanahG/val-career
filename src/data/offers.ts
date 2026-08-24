import type {CareerPlayer,ContractOffer,TeamDefinition} from "../types/career";
import {getPlayerOverallExact} from "../utils/playerOverall";
import {getCircuitFromRegion} from "./regions";
import {getCareerMarketRegion} from "../utils/marketRegion";
import {TEAMS} from "./teams";

const OFFER_COUNT = 3;

type PlayerExpectationProfile = "aggressive"|"leader"|"tactical"|"reliable"|"clutch"|"complete";

interface ExpectationProfile {
  type:PlayerExpectationProfile;
  score:number;
}

export function generateOffers(player:CareerPlayer):ContractOffer[] {
  const overall = getPlayerOverallExact(player);
  const scoutingScore = getPlayerScoutingScore(player);
  const homeCircuit = getCircuitFromRegion(player.region);
  const marketRegion = getCareerMarketRegion(player.region);
  const hasVCTExperience = player.history.some((entry) => entry.stage === "VCT");
  const firstVCTJump = player.currentStage === "Tier 2" && player.vctEligible && !hasVCTExperience;

  if (firstVCTJump) {
    const regionalPool = TEAMS.filter((team) => team.tier === 1 && team.marketRegion === marketRegion && team.id !== player.currentTeamId);
    const circuitFallbackPool = TEAMS.filter((team) => team.tier === 1 && team.circuit === homeCircuit && team.marketRegion !== marketRegion && team.id !== player.currentTeamId);

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
    return offerTeams.map((team,index) => createOffer(team,player,overall,scoutingScore,index,true));
  }

  if (hasVCTExperience || player.currentStage === "VCT") {
    const worldwidePool = TEAMS.filter((team) => team.tier === 1 && team.id !== player.currentTeamId);
    const eligible = worldwidePool.filter((team) => canOfferContract(team,scoutingScore));

    const preferred = sortTeamsForPlayer(eligible,player,overall,scoutingScore,homeCircuit);
    const fallback = sortTeamsForPlayer(worldwidePool,player,overall,scoutingScore,homeCircuit);
    const offerTeams = fillOffers(preferred,fallback,OFFER_COUNT);

    return offerTeams.map((team,index) => createOffer(team,player,overall,scoutingScore,index));
  }

  const tier2Pool = TEAMS.filter((team) => team.tier === 2 && team.marketRegion === marketRegion && team.id !== player.currentTeamId);
  const eligible = tier2Pool.filter((team) => canOfferContract(team,scoutingScore));

  const preferred = sortTeamsForPlayer(eligible,player,overall,scoutingScore,homeCircuit);
  const fallback = sortTeamsForPlayer(tier2Pool,player,overall,scoutingScore,homeCircuit);
  const offerTeams = fillOffers(preferred,fallback,OFFER_COUNT);

  return offerTeams.map((team,index) => createOffer(team,player,overall,scoutingScore,index));
}

export function generateMidseasonOffers(player:CareerPlayer):ContractOffer[] {
  const overall = getPlayerOverallExact(player);
  const scoutingScore = getPlayerScoutingScore(player);
  const homeCircuit = getCircuitFromRegion(player.region);

  const worldwidePool = TEAMS.filter((team) => team.tier === 1 && team.id !== player.currentTeamId);
  const eligible = worldwidePool.filter((team) => canOfferContract(team,scoutingScore));

  const preferred = sortTeamsForPlayer(eligible,player,overall,scoutingScore,homeCircuit);
  const fallback = sortTeamsForPlayer(worldwidePool,player,overall,scoutingScore,homeCircuit);
  const offerTeams = fillOffers(preferred,fallback,OFFER_COUNT);

  return offerTeams.map((team,index) => createOffer(team,player,overall,scoutingScore,index));
}

export function generateRenewalOffer(player:CareerPlayer):ContractOffer|null {
  if (!player.currentTeamId) return null;

  const team = TEAMS.find((item) => item.id === player.currentTeamId);
  if (!team) return null;

  const overall = getPlayerOverallExact(player);
  const scoutingScore = getPlayerScoutingScore(player);
  const marketSalary = getOfferSalary(team,player,scoutingScore,false);

  const performanceBonus =
    overall >= 95 ? 1.10 :
    overall >= 90 ? 1.07 :
    overall >= 85 ? 1.04 :
    1;

  const salary = team.tier === 1
    ? Math.min(30000,Math.round(marketSalary * performanceBonus))
    : Math.round(marketSalary * performanceBonus);

  const rosterRole:"Starter" = "Starter";
  const duration = scoutingScore >= 85 ? 2 : Math.random() > .5 ? 2 : 1;
  const signingBonus = Math.round(salary * (team.tier === 1 ? .6 : .35));

  return {
    id:`${player.season}-${team.id}-renewal`,
    teamId:team.id,
    salary,
    duration,
    rosterRole,
    signingBonus,
    expectations:getRenewalExpectation(player,team.tier),
  };
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
  const playerMarketRegion = getCareerMarketRegion(player.region);

  const sameCountryBonus = normalizeCountry(team.country) === playerCountry ? 5 : 0;
  const sameRegionBonus = team.marketRegion === playerMarketRegion ? 7 : 0;
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

function createOffer(team:TeamDefinition,player:CareerPlayer,overall:number,scoutingScore:number,index:number,isFirstVCTContract=false):ContractOffer {
  const salary = getOfferSalary(team,player,scoutingScore,isFirstVCTContract);
  const rosterRole:"Starter" = "Starter";

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
    expectations:getOfferExpectation(player,team.tier,index),
  };
}

function getOfferExpectation(player:CareerPlayer,tier:1|2,index:number) {
  const profiles = getPlayerExpectationProfiles(player);
  const profile = profiles[index % profiles.length]?.type ?? "complete";

  return getExpectationText(profile,tier);
}

function getRenewalExpectation(player:CareerPlayer,tier:1|2) {
  const profile = getPlayerExpectationProfiles(player)[0]?.type ?? "complete";

  if (tier === 1) {
    return `El equipo quiere seguir construyendo alrededor de ti. ${getExpectationText(profile,tier)}`;
  }

  return `El club confía en que sigas siendo una pieza importante del proyecto. ${getExpectationText(profile,tier)}`;
}

function getPlayerExpectationProfiles(player:CareerPlayer):ExpectationProfile[] {
  const {aim,gameSense,communication,clutch,consistency,mental} = player.stats;

  const profiles:ExpectationProfile[] = [
    {type:"aggressive",score:aim * .62 + clutch * .23 + mental * .15},
    {type:"leader",score:communication * .50 + gameSense * .35 + mental * .15},
    {type:"tactical",score:gameSense * .55 + consistency * .30 + communication * .15},
    {type:"reliable",score:consistency * .50 + mental * .35 + gameSense * .15},
    {type:"clutch",score:clutch * .52 + mental * .30 + aim * .18},
    {type:"complete",score:(aim + gameSense + communication + clutch + consistency + mental) / 6},
  ];

  return profiles.sort((a,b) => b.score - a.score);
}

function getExpectationText(profile:PlayerExpectationProfile,tier:1|2) {
  if (tier === 1) {
    if (profile === "aggressive") return "El staff espera que seas un referente agresivo, tomando la iniciativa, buscando primeros duelos y creando ventajas para el equipo.";
    if (profile === "leader") return "El staff espera que seas una de las voces del equipo, aportando información, lecturas y responsabilidad en las decisiones importantes.";
    if (profile === "tactical") return "El equipo quiere aprovechar tu lectura del juego para convertirte en una pieza táctica clave dentro de su sistema.";
    if (profile === "reliable") return "Esperan que seas uno de los pilares más estables del roster, manteniendo tu nivel durante series largas y partidos de alta presión.";
    if (profile === "clutch") return "El equipo confía en ti para asumir responsabilidad cuando las rondas se complican y el margen de error desaparece.";

    return "El staff considera que tu perfil completo puede aportar en distintas situaciones durante la temporada VCT.";
  }

  if (profile === "aggressive") return "Tendrás un lugar como titular. El equipo quiere que aproveches tus mecánicas para jugar con iniciativa, buscar duelos y generar espacio desde el primer mapa.";
  if (profile === "leader") return "Tendrás un lugar como titular. El roster espera que aportes una voz activa dentro del servidor, ayudando a ordenar las rondas y comunicar las lecturas del equipo.";
  if (profile === "tactical") return "Tendrás un lugar como titular. El staff cree que tu comprensión del juego puede ayudarte a ejecutar el sistema y tomar mejores decisiones durante las rondas.";
  if (profile === "reliable") return "Tendrás un lugar como titular. El equipo busca en ti estabilidad, disciplina y un rendimiento confiable durante toda la temporada.";
  if (profile === "clutch") return "Tendrás un lugar como titular. Esperan que puedas mantener la calma bajo presión y convertirte en una amenaza cuando las rondas llegan a situaciones decisivas.";

  return "Tendrás un lugar como titular. El equipo valora que puedas adaptarte a distintas necesidades y crecer como una pieza importante del roster.";
}

function normalizeCountry(country:string) {
  return country.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}

function getOfferSalary(team:TeamDefinition,player:CareerPlayer,scoutingScore:number,isFirstVCTContract:boolean) {
  if (team.tier === 2) {
    const progress = Math.max(0,Math.min(1,(scoutingScore - 55) / 30));
    return Math.round(team.salaryMin + (team.salaryMax - team.salaryMin) * progress);
  }

  if (isFirstVCTContract) {
    const progress = Math.max(0,Math.min(1,(scoutingScore - 68) / 15));
    return Math.round(5000 + 2500 * progress);
  }

  const overall = getPlayerOverallExact(player);

  let minSalary = 7500;
  let maxSalary = 15000;

  if (overall >= 95 || scoutingScore >= 94) {
    minSalary = 22000;
    maxSalary = 30000;
  } else if (overall >= 90 || scoutingScore >= 89) {
    minSalary = 15000;
    maxSalary = 22000;
  } else if (overall >= 85 || scoutingScore >= 84) {
    minSalary = 11000;
    maxSalary = 18000;
  } else if (overall >= 80 || scoutingScore >= 79) {
    minSalary = 8500;
    maxSalary = 14000;
  }

  const bandMin = Math.min(overall,scoutingScore);
  const progress = Math.max(0,Math.min(1,(bandMin - 75) / 22));
  const prestigeBonus = Math.max(0,Math.min(1,(team.prestige - 70) / 30));

  const salaryProgress = Math.min(1,progress * .75 + prestigeBonus * .25);

  return Math.min(30000,Math.round(minSalary + (maxSalary - minSalary) * salaryProgress));
}