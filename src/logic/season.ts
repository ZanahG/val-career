import type {CareerPlayer} from "../types/career";
import type {MatchResult,SeasonState,StandingRow} from "../types/season";
import {TEAMS,getTeamById} from "../data/teams";
import {getPlayerOverallExact} from "../utils/playerOverall";

const clamp = (value:number,min:number,max:number) => Math.max(min,Math.min(max,value));
const randomBetween = (min:number,max:number) => Math.random() * (max - min) + min;
const randomInt = (min:number,max:number) => Math.floor(randomBetween(min,max + 1));

export function createSeason(player:CareerPlayer):SeasonState {
  const currentTeam = getTeamById(player.currentTeamId);
  if (!currentTeam) throw new Error("Cannot create season without a valid current team.");

  const validOpponents = TEAMS.filter((team) => team.id !== currentTeam.id && team.tier === currentTeam.tier && (currentTeam.tier === 1 ? team.circuit === currentTeam.circuit : team.marketRegion === currentTeam.marketRegion));
  const opponents = [...validOpponents].sort(() => Math.random() - .5).slice(0,Math.min(6,validOpponents.length));

  const standings:StandingRow[] = [
    {teamId:currentTeam.id,wins:0,losses:0,roundsWon:0,roundsLost:0},
    ...opponents.map((team) => ({teamId:team.id,wins:0,losses:0,roundsWon:0,roundsLost:0})),
  ];

  return {
    season:player.season,
    phase:"Regular Season",
    week:1,
    schedule:opponents.map((team) => team.id),
    playedMatches:[],
    standings,
    ascensionSchedule:[],
    ascensionMatches:[],
    ascensionQualified:false,
    ascensionWon:false,
  };
}

export function simulateMatch(player:CareerPlayer,opponentId:string):MatchResult {
  const team = getTeamById(player.currentTeamId);
  const opponent = getTeamById(opponentId);

  if (!team || !opponent) throw new Error("Invalid team or opponent.");

  const overall = getPlayerOverallExact(player);
  const starterMultiplier = player.rosterRole === "Starter" ? 1 : .35;

  const aim = player.stats.aim;
  const gameSense = player.stats.gameSense;
  const communication = player.stats.communication;
  const clutch = player.stats.clutch;
  const consistency = player.stats.consistency;
  const mental = player.stats.mental;

  const overallImpact = (overall - 60) * .28;
  const communicationImpact = (communication - 50) * .025;
  const gameSenseImpact = (gameSense - 50) * .02;
  const mentalImpact = (mental - 50) * .015;

  const playerImpact = (overallImpact + communicationImpact + gameSenseImpact + mentalImpact) * starterMultiplier;

  const teamVariance = clamp(6 - consistency * .035,2.5,6);
  const teamStrength = team.strength + playerImpact + randomBetween(-teamVariance,teamVariance);
  const opponentStrength = opponent.strength + randomBetween(-5,5);

  const strengthDifference = teamStrength - opponentStrength;
  const pressureMatch = Math.abs(strengthDifference) <= 6;

  const clutchPressureBonus = pressureMatch ? (clutch - 50) * .0015 : 0;
  const mentalPressureBonus = pressureMatch ? (mental - 50) * .001 : 0;

  const winProbability = clamp(.5 + strengthDifference / 40 + clutchPressureBonus + mentalPressureBonus,.12,.88);
  const won = Math.random() < winProbability;

  const closeMatchChance = clamp(.62 - Math.abs(strengthDifference) * .035,.25,.72);
  const closeMatch = pressureMatch || Math.random() < closeMatchChance;

  const scoreFor = won ? 13 : closeMatch ? randomInt(9,12) : randomInt(5,8);
  const scoreAgainst = won ? closeMatch ? randomInt(9,12) : randomInt(5,8) : 13;

  const consistencyNoise = clamp(.18 - consistency * .001,.07,.18);
  const ratingNoise = randomBetween(-consistencyNoise,consistencyNoise);

  const aimRatingImpact = (aim - 50) * .0018;
  const gameSenseRatingImpact = (gameSense - 50) * .0014;
  const clutchRatingImpact = closeMatch ? (clutch - 50) * .0012 : 0;
  const mentalRatingImpact = (mental - 50) * .001;
  const communicationRatingImpact = (communication - 50) * .0007;

  const ratingBase = .82
    + (overall - 50) / 75
    + aimRatingImpact
    + gameSenseRatingImpact
    + clutchRatingImpact
    + mentalRatingImpact
    + communicationRatingImpact
    + (won ? .10 : -.04)
    + ratingNoise;

  const playerRating = Number(clamp(ratingBase,.62,1.58).toFixed(2));

  const killVariance = clamp(4.5 - consistency * .025,2,4.5);
  const deathVariance = clamp(3.5 - consistency * .018,1.7,3.5);
  const assistVariance = clamp(3 - consistency * .012,1.5,3);

  const kills = Math.round(clamp(
    13
    + (aim - 50) * .08
    + (clutch - 50) * (closeMatch ? .025 : .01)
    + (playerRating - .9) * 18
    + randomBetween(-killVariance,killVariance),
    6,
    35,
  ));

  const deaths = Math.round(clamp(
    20
    - (gameSense - 50) * .055
    - (mental - 50) * .02
    - (playerRating - .9) * 7
    + randomBetween(-deathVariance,deathVariance),
    8,
    28,
  ));

  const assists = Math.round(clamp(
    4
    + communication * .07
    + gameSense * .02
    + randomBetween(-assistVariance,assistVariance),
    2,
    18,
  ));

  const acs = Math.round(clamp(
    150
    + (aim - 50) * 1
    + (clutch - 50) * (closeMatch ? .2 : .08)
    + (playerRating - .85) * 160
    + randomBetween(-10,10),
    110,
    360,
  ));

  return {
    id:`${player.season}-${Date.now()}-${opponent.id}`,
    opponentId:opponent.id,
    won,
    scoreFor,
    scoreAgainst,
    playerRating,
    acs,
    kills,
    deaths,
    assists,
    summary:getMatchSummary(playerRating,won),
  };
}

export function updateStandings(standings:StandingRow[],currentTeamId:string,opponentId:string,result:MatchResult):StandingRow[] {
  return standings.map((row) => {
    if (row.teamId === currentTeamId) {
      return {...row,wins:row.wins + (result.won ? 1 : 0),losses:row.losses + (result.won ? 0 : 1),roundsWon:row.roundsWon + result.scoreFor,roundsLost:row.roundsLost + result.scoreAgainst};
    }

    if (row.teamId === opponentId) {
      return {...row,wins:row.wins + (result.won ? 0 : 1),losses:row.losses + (result.won ? 1 : 0),roundsWon:row.roundsWon + result.scoreAgainst,roundsLost:row.roundsLost + result.scoreFor};
    }

    const simulatedWin = Math.random() >= .5;
    const roundsWon = simulatedWin ? 13 : randomInt(6,12);
    const roundsLost = simulatedWin ? randomInt(6,12) : 13;

    return {...row,wins:row.wins + (simulatedWin ? 1 : 0),losses:row.losses + (simulatedWin ? 0 : 1),roundsWon:row.roundsWon + roundsWon,roundsLost:row.roundsLost + roundsLost};
  });
}

export function playNextMatch(player:CareerPlayer,season:SeasonState):SeasonState {
  if (season.phase === "Regular Season") return playRegularSeasonMatch(player,season);
  if (season.phase === "Ascension") return playAscensionMatch(player,season);
  return season;
}

function playRegularSeasonMatch(player:CareerPlayer,season:SeasonState):SeasonState {
  const nextOpponentId = season.schedule[season.playedMatches.length];

  if (!nextOpponentId) return finishRegularSeason(player,season);

  const result = simulateMatch(player,nextOpponentId);
  const standings = updateStandings(season.standings,player.currentTeamId!,nextOpponentId,result);
  const playedMatches = [...season.playedMatches,result];

  const updatedSeason:SeasonState = {...season,week:season.week + 1,playedMatches,standings};

  if (playedMatches.length >= season.schedule.length) return finishRegularSeason(player,updatedSeason);

  return updatedSeason;
}

function finishRegularSeason(player:CareerPlayer,season:SeasonState):SeasonState {
  const team = getTeamById(player.currentTeamId);

  if (!team || team.tier !== 2) return {...season,phase:"Complete"};

  const standings = getSortedStandings(season.standings);
  const placement = standings.findIndex((row) => row.teamId === player.currentTeamId) + 1;

  if (placement <= 2) {
    const ascensionSchedule = createAscensionSchedule(player);

    if (ascensionSchedule.length > 0) {
      return {...season,phase:"Ascension",week:1,ascensionQualified:true,ascensionSchedule};
    }
  }

  return {...season,phase:"Complete"};
}

function createAscensionSchedule(player:CareerPlayer) {
  const currentTeam = getTeamById(player.currentTeamId);
  if (!currentTeam) return [];

  const foreignRegionalTeams = TEAMS.filter((team) => team.id !== currentTeam.id && team.tier === 2 && team.circuit === currentTeam.circuit && team.marketRegion !== currentTeam.marketRegion);
  const sameRegionalTeams = TEAMS.filter((team) => team.id !== currentTeam.id && team.tier === 2 && team.circuit === currentTeam.circuit && team.marketRegion === currentTeam.marketRegion);

  return [
    ...foreignRegionalTeams.sort(() => Math.random() - .5),
    ...sameRegionalTeams.sort(() => Math.random() - .5),
  ].slice(0,3).map((team) => team.id);
}

function playAscensionMatch(player:CareerPlayer,season:SeasonState):SeasonState {
  const nextOpponentId = season.ascensionSchedule[season.ascensionMatches.length];

  if (!nextOpponentId) return finishAscension(season);

  const result = simulateMatch(player,nextOpponentId);
  const ascensionMatches = [...season.ascensionMatches,result];
  const updatedSeason:SeasonState = {...season,week:season.week + 1,ascensionMatches};

  if (ascensionMatches.length >= season.ascensionSchedule.length) return finishAscension(updatedSeason);

  return updatedSeason;
}

function finishAscension(season:SeasonState):SeasonState {
  const wins = season.ascensionMatches.filter((match) => match.won).length;

  return {
    ...season,
    phase:"Complete",
    ascensionWon:wins >= 2,
  };
}

export function getSortedStandings(standings:StandingRow[]) {
  return [...standings].sort((a,b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;

    const roundDifferenceA = a.roundsWon - a.roundsLost;
    const roundDifferenceB = b.roundsWon - b.roundsLost;

    return roundDifferenceB - roundDifferenceA;
  });
}

export function getPlayerSeasonStats(season:SeasonState) {
  const matches = [...season.playedMatches,...season.ascensionMatches];

  if (matches.length === 0) return {matches:0,wins:0,losses:0,averageRating:0,averageACS:0,kills:0,deaths:0,assists:0,kd:0};

  const wins = matches.filter((match) => match.won).length;
  const losses = matches.length - wins;
  const kills = matches.reduce((total,match) => total + match.kills,0);
  const deaths = matches.reduce((total,match) => total + match.deaths,0);
  const assists = matches.reduce((total,match) => total + match.assists,0);
  const averageRating = matches.reduce((total,match) => total + match.playerRating,0) / matches.length;
  const averageACS = matches.reduce((total,match) => total + match.acs,0) / matches.length;

  return {
    matches:matches.length,
    wins,
    losses,
    averageRating:Number(averageRating.toFixed(2)),
    averageACS:Math.round(averageACS),
    kills,
    deaths,
    assists,
    kd:deaths > 0 ? Number((kills / deaths).toFixed(2)) : kills,
  };
}

function getMatchSummary(rating:number,won:boolean) {
  if (rating >= 1.35) return won ? "Star performance. You completely took over the series." : "Huge individual performance despite the loss.";
  if (rating >= 1.15) return won ? "Excellent series with major impact in key rounds." : "Strong individual series, but the team could not close it out.";
  if (rating >= .95) return won ? "Solid performance and a useful contribution to the victory." : "A respectable performance in a difficult defeat.";
  if (rating >= .8) return "A quiet series with limited impact.";
  return "A difficult performance. Your form may become a concern if this continues.";
}