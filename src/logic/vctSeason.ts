import type {CareerPlayer,TeamDefinition} from "../types/career";
import type {PlayableVCTPhase,VCTEventState,VCTSeasonState} from "../types/vct";
import {TEAMS,getTeamById} from "../data/teams";
import {getVCTNarrativeEventId} from "../data/vctEvents";
import {createKickoffBracket,getKickoffPlacement,getNextPlayerKickoffMatch,playPlayerKickoffMatch} from "./kickoffBracket";
import {createStageBracket,createStageGroups,getPlayerStageBracketPlacement,getPlayerStageGroupPlacement,getPlayerStageSchedule,playStageBracketMatch,playStageGroupMatch} from "./stageFormat";
import {simulateMatch} from "./season";
import {createChampionsBracket,createChampionsState,createDefaultChampionsQualifiedTeams,getChampionsGroupPlacement,getChampionsPlacement,getChampionsQualifiedTeamIds,playChampionsBracketMatch,playChampionsGroupMatch} from "./championsFormat";
import {createDefaultMastersQualifiedTeams,createMastersBracket,createMastersState,getMastersBracketPlacement,getMastersSwissQualifiedTeamIds,playNextMastersBracketMatch,playNextMastersSwissMatch,simulateMastersSwissWithoutPlayer} from "./mastersFormat";

const emptyEvent = (): VCTEventState => ({status: "Locked",schedule: [],matches: [],championshipPointsEarned: 0});
const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - .5);

export function createVCTSeason(player: CareerPlayer): VCTSeasonState {
  const team = getTeamById(player.currentTeamId);
  if (!team || team.tier !== 1) throw new Error("Cannot create a VCT season without a Tier 1 team.");

  const kickoffBracket = createKickoffBracket(team.circuit,team.id,player.season);

  return {
    season: player.season,
    circuit: team.circuit,
    phase: "Kickoff",
    championshipPoints: 0,
    events: {
      Kickoff: {...emptyEvent(),status: "Active",schedule: kickoffBracket ? [] : createRegionalSchedule(team,4),bracket: kickoffBracket},
      "Masters 1": emptyEvent(),
      "Stage 1": emptyEvent(),
      "Stage 1 Playoffs": emptyEvent(),
      "Masters 2": emptyEvent(),
      "Stage 2": emptyEvent(),
      "Stage 2 Playoffs": emptyEvent(),
      Champions: emptyEvent(),
    },
  };
}

export function playNextVCTMatch(player: CareerPlayer,season: VCTSeasonState): VCTSeasonState {
  if (season.phase === "Complete" || season.pendingEvent) return season;

  if (season.phase === "Kickoff" && season.events.Kickoff.bracket) return playNextKickoffMatch(player,season);

  const phase = season.phase as PlayableVCTPhase;
  const event = season.events[phase];

  if ((phase === "Masters 1" || phase === "Masters 2") && event.masters) {
    const playerTeamId = player.currentTeamId;
    if (!playerTeamId) return season;

    const isDirectSeed = event.masters.directPlayoffTeamIds.includes(playerTeamId);
    const isSwissTeam = event.masters.swissTeamIds.includes(playerTeamId);

    if (isSwissTeam && !event.masters.swiss.complete) {
      const {masters,result} = playNextMastersSwissMatch(player,event.masters);
      const matches = result ? [...event.matches,result] : event.matches;

      let updatedSeason:VCTSeasonState = {...season,events:{...season.events,[phase]:{...event,masters,matches}}};

      const playerStanding = masters.swiss.standings.find((row) => row.teamId === playerTeamId);
      const playerQualified = Boolean(playerStanding?.qualified);
      const playerEliminated = Boolean(playerStanding?.eliminated);

      if (playerQualified || playerEliminated) {
        const simulatedMasters = masters.swiss.complete ? masters : simulateMastersSwissWithoutPlayer(masters);

        updatedSeason = {
          ...updatedSeason,
          events:{
            ...updatedSeason.events,
            [phase]:{
              ...updatedSeason.events[phase],
              masters:simulatedMasters,
            },
          },
        };

        if (playerEliminated) return finishEvent(player,updatedSeason,phase);

        const bracket = createMastersBracket(simulatedMasters);
        const mastersWithBracket = {...simulatedMasters,bracket};

        return {
          ...updatedSeason,
          events:{
            ...updatedSeason.events,
            [phase]:{
              ...updatedSeason.events[phase],
              masters:mastersWithBracket,
            },
          },
        };
      }

      if (masters.swiss.complete) {
        const qualified = getMastersSwissQualifiedTeamIds(masters.swiss);

        if (!qualified.includes(playerTeamId)) return finishEvent(player,updatedSeason,phase);

        const bracket = createMastersBracket(masters);

        return {
          ...updatedSeason,
          events:{
            ...updatedSeason.events,
            [phase]:{
              ...updatedSeason.events[phase],
              masters:{...masters,bracket},
            },
          },
        };
      }

      return updatedSeason;
    }

    if (isDirectSeed && !event.masters.bracket) {
      const simulated = simulateMastersSwissWithoutPlayer(event.masters);
      const bracket = createMastersBracket(simulated);
      const masters = {...simulated,bracket};

      return {...season,events:{...season.events,[phase]:{...event,masters}}};
    }

    if (event.masters.bracket && !event.masters.bracket.complete) {
      const {masters,result} = playNextMastersBracketMatch(player,event.masters);
      const matches = result ? [...event.matches,result] : event.matches;
      const updatedSeason:VCTSeasonState = {...season,events:{...season.events,[phase]:{...event,masters,matches}}};

      if (masters.bracket?.complete) return finishEvent(player,updatedSeason,phase);

      const playerLosses = masters.bracket?.matches.filter((match) => match.loserId === playerTeamId).length ?? 0;

      if (playerLosses >= 2) return finishEvent(player,updatedSeason,phase);

      return updatedSeason;
    }

    return finishEvent(player,season,phase);
  }

  if (phase === "Champions" && event.champions) {
    const playerTeamId = player.currentTeamId;
    if (!playerTeamId) return season;

    if (!event.champions.groups.complete) {
      const {state: groups,result} = playChampionsGroupMatch(player,event.champions.groups);
      const matches = result ? [...event.matches,result] : event.matches;

      let champions = {...event.champions,groups};
      let updatedSeason: VCTSeasonState = {...season,events: {...season.events,Champions: {...event,champions,matches}}};

      if (groups.complete) {
        const qualified = getChampionsQualifiedTeamIds(groups);

        if (!qualified.includes(playerTeamId)) return finishEvent(player,updatedSeason,"Champions");

        const bracket = createChampionsBracket(groups);
        champions = {...champions,bracket};

        updatedSeason = {
          ...updatedSeason,
          events: {
            ...updatedSeason.events,
            Champions: {...updatedSeason.events.Champions,champions},
          },
        };
      }

      return updatedSeason;
    }

    if (!event.champions.bracket) {
      const qualified = getChampionsQualifiedTeamIds(event.champions.groups);

      if (!qualified.includes(playerTeamId)) return finishEvent(player,season,"Champions");

      const bracket = createChampionsBracket(event.champions.groups);
      const champions = {...event.champions,bracket};

      return {
        ...season,
        events: {
          ...season.events,
          Champions: {...event,champions},
        },
      };
    }

    if (!event.champions.bracket.complete) {
      const {state: bracket,result} = playChampionsBracketMatch(player,event.champions.bracket);
      const matches = result ? [...event.matches,result] : event.matches;
      const champions = {...event.champions,bracket,complete: bracket.complete};

      const updatedSeason: VCTSeasonState = {
        ...season,
        events: {
          ...season.events,
          Champions: {...event,champions,matches},
        },
      };

      if (bracket.complete) return finishEvent(player,updatedSeason,"Champions");

      const playerLosses = bracket.matches.filter((match) => match.loserId === playerTeamId).length;

      if (playerLosses >= 2) return finishEvent(player,updatedSeason,"Champions");

      return updatedSeason;
    }

    return finishEvent(player,season,"Champions");
  }

  if ((phase === "Stage 1" || phase === "Stage 2") && event.stageGroups) {
    const {state: stageGroups,result} = playStageGroupMatch(player,event.stageGroups);
    const matches = result ? [...event.matches,result] : event.matches;
    const updatedSeason: VCTSeasonState = {...season,events: {...season.events,[phase]: {...event,stageGroups,matches}}};

    if (stageGroups.complete) return finishEvent(player,updatedSeason,phase);

    return updatedSeason;
  }

  if ((phase === "Stage 1 Playoffs" || phase === "Stage 2 Playoffs") && event.stageBracket) {
    const {state: stageBracket,result} = playStageBracketMatch(player,event.stageBracket);
    const matches = result ? [...event.matches,result] : event.matches;
    const updatedSeason: VCTSeasonState = {...season,events: {...season.events,[phase]: {...event,stageBracket,matches}}};

    if (stageBracket.complete) return finishEvent(player,updatedSeason,phase);

    return updatedSeason;
  }

  const opponentId = event.schedule[event.matches.length];

  if (!opponentId) return finishEvent(player,season,phase);

  const result = simulateMatch(player,opponentId);
  const matches = [...event.matches,result];
  const updatedSeason: VCTSeasonState = {...season,events: {...season.events,[phase]: {...event,matches}}};

  if (matches.length >= event.schedule.length) return finishEvent(player,updatedSeason,phase);

  return updatedSeason;
}

export function continueVCTAfterNarrativeEvent(season: VCTSeasonState): VCTSeasonState {
  const pending = season.pendingEvent;
  if (!pending) return season;

  if (pending.nextPhase === "Complete") return {...season,phase: "Complete",pendingEvent: undefined};

  const nextEvent = season.events[pending.nextPhase];

  return {
    ...season,
    phase: pending.nextPhase,
    pendingEvent: undefined,
    events: {
      ...season.events,
      [pending.nextPhase]: {...nextEvent,status: "Active",schedule: nextEvent.schedule.length ? nextEvent.schedule : pending.nextSchedule},
    },
  };
}

export function resumeVCTAfterMidseasonMarket(player:CareerPlayer,season:VCTSeasonState):VCTSeasonState {
  const team = getTeamById(player.currentTeamId);
  if (!team || team.tier !== 1) return season;

  const previousCircuit = season.circuit;
  const changedCircuit = previousCircuit !== team.circuit;
  const masters2 = season.events["Masters 2"].masters;
  const qualifiedForMasters2 = Boolean(masters2?.qualifiedTeams.some((entry) => entry.teamId === team.id));

  let updatedSeason:VCTSeasonState = {
    ...season,
    circuit:team.circuit,
    marketWindowPending:undefined,
  };

  if (qualifiedForMasters2 && masters2) {
    const pendingEvent = updatedSeason.pendingEvent
      ? {...updatedSeason.pendingEvent,nextPhase:"Masters 2" as const,nextSchedule:[]}
      : undefined;

    return {
      ...updatedSeason,
      pendingEvent,
      events:{
        ...updatedSeason.events,
        "Masters 2":{...updatedSeason.events["Masters 2"],masters:masters2},
      },
    };
  }

  updatedSeason = prepareStageGroups(updatedSeason,"Stage 2",team);

  updatedSeason = {
    ...updatedSeason,
    events:{
      ...updatedSeason.events,
      "Masters 2":{...emptyEvent(),status:"Skipped"},
    },
  };

  if (updatedSeason.pendingEvent) {
    return {
      ...updatedSeason,
      pendingEvent:{
        ...updatedSeason.pendingEvent,
        nextPhase:"Stage 2",
        nextSchedule:updatedSeason.events["Stage 2"].schedule,
      },
    };
  }

  if (changedCircuit || season.phase === "Stage 1 Playoffs") {
    return activatePhase(updatedSeason,"Stage 2",updatedSeason.events["Stage 2"].schedule);
  }

  return updatedSeason;
}

function playNextKickoffMatch(player: CareerPlayer,season: VCTSeasonState): VCTSeasonState {
  const event = season.events.Kickoff;
  const bracket = event.bracket;
  if (!bracket) return season;

  const bracketMatch = getNextPlayerKickoffMatch(bracket);

  if (!bracketMatch) {
    if (bracket.complete) return finishKickoffBracket(player,season);
    return season;
  }

  const opponentId = bracketMatch.teamAId === player.currentTeamId ? bracketMatch.teamBId : bracketMatch.teamAId;
  if (!opponentId) return season;

  const result = simulateMatch(player,opponentId);
  const updatedBracket = playPlayerKickoffMatch(bracket,result.won);

  const updatedSeason: VCTSeasonState = {
    ...season,
    events: {...season.events,Kickoff: {...event,matches: [...event.matches,result],bracket: updatedBracket}},
  };

  if (updatedBracket.complete) return finishKickoffBracket(player,updatedSeason);

  return updatedSeason;
}

function finishKickoffBracket(player: CareerPlayer,season: VCTSeasonState): VCTSeasonState {
  const team = getTeamById(player.currentTeamId);
  const event = season.events.Kickoff;
  const bracket = event.bracket;
  if (!team || !bracket) return season;

  const placement = getKickoffPlacement(bracket,team.id);
  const points = placement === 1 ? 4 : placement === 2 ? 3 : placement === 3 ? 2 : placement === 4 ? 1 : 0;

  let updatedSeason: VCTSeasonState = {
    ...season,
    championshipPoints: season.championshipPoints + points,
    events: {...season.events,Kickoff: {...event,status: "Complete",placement,championshipPointsEarned: points}},
  };

  if (placement <= 3) {
    updatedSeason = prepareMasters(updatedSeason,"Masters 1",team,placement as 1 | 2 | 3);
    return queueTransition(updatedSeason,"Kickoff",placement,"Masters 1",[]);
  }

  updatedSeason = prepareStageGroups(updatedSeason,"Stage 1",team);

  return queueSkippedTransition(updatedSeason,"Kickoff",placement,"Masters 1","Stage 1",updatedSeason.events["Stage 1"].schedule);
}

function finishEvent(player: CareerPlayer,season: VCTSeasonState,phase: PlayableVCTPhase): VCTSeasonState {
  const team = getTeamById(player.currentTeamId);
  if (!team) return season;

  const event = season.events[phase];
  const wins = event.matches.filter((match) => match.won).length;
  const losses = event.matches.length - wins;

  let placement = getPlacement(phase,wins,losses);

  if (phase === "Champions" && event.champions?.bracket) {
    placement = getChampionsPlacement(event.champions.bracket,team.id);
  }

  if (phase === "Champions" && event.champions && !event.champions.bracket) {
    const groupPlacement = getChampionsGroupPlacement(event.champions.groups,team.id);

    placement = groupPlacement === 3 ? 9 : groupPlacement === 4 ? 13 : 9;
  }

  if ((phase === "Masters 1" || phase === "Masters 2") && event.masters?.bracket) placement = getMastersBracketPlacement(event.masters.bracket,team.id);
  if ((phase === "Masters 1" || phase === "Masters 2") && event.masters && !event.masters.bracket) placement = 9;

  if ((phase === "Stage 1" || phase === "Stage 2") && event.stageGroups) placement = getPlayerStageGroupPlacement(event.stageGroups);
  if ((phase === "Stage 1 Playoffs" || phase === "Stage 2 Playoffs") && event.stageBracket) placement = getPlayerStageBracketPlacement(event.stageBracket);

  const points = getChampionshipPoints(phase,wins,placement);

  let updatedSeason: VCTSeasonState = {
    ...season,
    championshipPoints: season.championshipPoints + points,
    events: {...season.events,[phase]: {...event,status: "Complete",placement,championshipPointsEarned: points}},
  };

  if (phase === "Masters 1") {
    updatedSeason = prepareStageGroups(updatedSeason,"Stage 1",team);
    return queueTransition(updatedSeason,phase,placement,"Stage 1",updatedSeason.events["Stage 1"].schedule);
  }

  if (phase === "Stage 1") {
    if (placement <= 4) {
      updatedSeason = prepareStagePlayoffs(updatedSeason,"Stage 1","Stage 1 Playoffs");
      return queueTransition(updatedSeason,phase,placement,"Stage 1 Playoffs",[]);
    }

    updatedSeason = prepareStageGroups(updatedSeason,"Stage 2",team);
    return queueSkippedTransition(updatedSeason,phase,placement,"Stage 1 Playoffs","Stage 2",updatedSeason.events["Stage 2"].schedule);
  }

  if (phase === "Stage 1 Playoffs") {
    if (placement <= 3) {
      updatedSeason = prepareMasters(updatedSeason,"Masters 2",team,placement as 1 | 2 | 3);

      const transitionedSeason = queueTransition(updatedSeason,phase,placement,"Masters 2",[]);

      return {...transitionedSeason,marketWindowPending:"midseason"};
    }

    updatedSeason = prepareStageGroups(updatedSeason,"Stage 2",team);

    const transitionedSeason = queueSkippedTransition(updatedSeason,phase,placement,"Masters 2","Stage 2",updatedSeason.events["Stage 2"].schedule);

    return {...transitionedSeason,marketWindowPending:"midseason"};
  }

  if (phase === "Masters 2") {
    updatedSeason = prepareStageGroups(updatedSeason,"Stage 2",team);
    return queueTransition(updatedSeason,phase,placement,"Stage 2",updatedSeason.events["Stage 2"].schedule);
  }

  if (phase === "Stage 2") {
    if (placement <= 4) {
      updatedSeason = prepareStagePlayoffs(updatedSeason,"Stage 2","Stage 2 Playoffs");
      return queueTransition(updatedSeason,phase,placement,"Stage 2 Playoffs",[]);
    }

    return resolveChampionsQualification(updatedSeason,team,phase,placement);
  }

  if (phase === "Stage 2 Playoffs") return resolveChampionsQualification(updatedSeason,team,phase,placement);

  if (phase === "Champions") return queueTransition(updatedSeason,phase,placement,"Complete",[]);

  return updatedSeason;
}

function prepareStageGroups(season: VCTSeasonState,phase: "Stage 1" | "Stage 2",team: TeamDefinition): VCTSeasonState {
  const stageGroups = createStageGroups(team.circuit,team.id);
  const schedule = getPlayerStageSchedule(stageGroups);

  return {
    ...season,
    events: {
      ...season.events,
      [phase]: {...season.events[phase],schedule,stageGroups},
    },
  };
}

function prepareMasters(season: VCTSeasonState,phase: "Masters 1" | "Masters 2",team: TeamDefinition,playerSeed: 1 | 2 | 3): VCTSeasonState {
  const qualifiedTeams = createDefaultMastersQualifiedTeams();

  const currentPlayerEntry = qualifiedTeams.find((entry) => entry.teamId === team.id);

  if (currentPlayerEntry) {
    const targetSeedEntry = qualifiedTeams.find((entry) => entry.circuit === team.circuit && entry.seed === playerSeed);

    if (targetSeedEntry && targetSeedEntry.teamId !== team.id) {
      const oldSeed = currentPlayerEntry.seed;
      currentPlayerEntry.seed = playerSeed;
      targetSeedEntry.seed = oldSeed;
    }
  } else {
    const targetSeedEntry = qualifiedTeams.find((entry) => entry.circuit === team.circuit && entry.seed === playerSeed);

    if (targetSeedEntry) targetSeedEntry.teamId = team.id;
  }

  const masters = createMastersState(qualifiedTeams);

  return {
    ...season,
    events: {
      ...season.events,
      [phase]: {...season.events[phase],schedule: [],masters},
    },
  };
}

function prepareChampions(season: VCTSeasonState,team: TeamDefinition,playerSeed: 1 | 2 | 3 | 4): VCTSeasonState {
  const qualifiedTeams = createDefaultChampionsQualifiedTeams();

  const currentPlayerEntry = qualifiedTeams.find((entry) => entry.teamId === team.id);

  if (currentPlayerEntry) {
    const targetSeedEntry = qualifiedTeams.find((entry) => entry.circuit === team.circuit && entry.seed === playerSeed);

    if (targetSeedEntry && targetSeedEntry.teamId !== team.id) {
      const oldSeed = currentPlayerEntry.seed;
      currentPlayerEntry.seed = playerSeed;
      targetSeedEntry.seed = oldSeed;
    }
  } else {
    const targetSeedEntry = qualifiedTeams.find((entry) => entry.circuit === team.circuit && entry.seed === playerSeed);

    if (targetSeedEntry) targetSeedEntry.teamId = team.id;
  }

  const champions = createChampionsState(qualifiedTeams,team.id);

  return {
    ...season,
    events: {
      ...season.events,
      Champions: {...season.events.Champions,schedule: [],champions},
    },
  };
}

function prepareStagePlayoffs(season: VCTSeasonState,sourcePhase: "Stage 1" | "Stage 2",playoffPhase: "Stage 1 Playoffs" | "Stage 2 Playoffs"): VCTSeasonState {
  const groups = season.events[sourcePhase].stageGroups;
  if (!groups) return season;

  const stageBracket = createStageBracket(groups);

  return {
    ...season,
    events: {
      ...season.events,
      [playoffPhase]: {...season.events[playoffPhase],schedule: [],stageBracket},
    },
  };
}

export function migrateVCTStageState(player: CareerPlayer,season: VCTSeasonState): VCTSeasonState {
  const team = getTeamById(player.currentTeamId);
  if (!team) return season;

  if (season.phase === "Stage 1" && !season.events["Stage 1"].stageGroups) {
    const migrated = prepareStageGroups(season,"Stage 1",team);

    return {
      ...migrated,
      events: {
        ...migrated.events,
        "Stage 1": {...migrated.events["Stage 1"],status: "Active"},
      },
    };
  }

  if (season.phase === "Stage 2" && !season.events["Stage 2"].stageGroups) {
    const migrated = prepareStageGroups(season,"Stage 2",team);

    return {
      ...migrated,
      events: {
        ...migrated.events,
        "Stage 2": {...migrated.events["Stage 2"],status: "Active"},
      },
    };
  }

  return season;
}

export function migrateVCTMastersState(player: CareerPlayer,season: VCTSeasonState): VCTSeasonState {
  if (season.phase !== "Masters 1" && season.phase !== "Masters 2") return season;

  const team = getTeamById(player.currentTeamId);
  if (!team) return season;

  const phase = season.phase;
  const event = season.events[phase];

  if (event.masters?.qualifiedTeams.length === 12) return season;

  const previousPhase = phase === "Masters 1" ? season.events.Kickoff : season.events["Stage 1 Playoffs"];
  const placement = previousPhase.placement;

  if (!placement || placement < 1 || placement > 3) return season;

  const migrated = prepareMasters(season,phase,team,placement as 1 | 2 | 3);

  return {
    ...migrated,
    events: {
      ...migrated.events,
      [phase]: {
        ...migrated.events[phase],
        status: "Active",
        matches: [],
      },
    },
  };
}

function resolveChampionsQualification(season: VCTSeasonState,team: TeamDefinition,sourcePhase: PlayableVCTPhase,placement: number): VCTSeasonState {
  const playoffs = season.events["Stage 2 Playoffs"];
  const playoffPlacement = playoffs.placement ?? 99;

  const directQualification = playoffs.status === "Complete" && playoffPlacement <= 3;
  const pointsQualification = season.championshipPoints >= 10;

  if (directQualification || pointsQualification) {
    const seed: 1 | 2 | 3 | 4 = directQualification ? playoffPlacement as 1 | 2 | 3 : 4;

    const updatedSeason = prepareChampions(season,team,seed);

    return queueTransition(updatedSeason,sourcePhase,placement,"Champions",[]);
  }

  return {
    ...season,
    phase: "Complete",
    events: {
      ...season.events,
      Champions: {...season.events.Champions,status: "Eliminated"},
    },
  };
}

function queueTransition(season: VCTSeasonState,sourcePhase: PlayableVCTPhase,placement: number,nextPhase: PlayableVCTPhase | "Complete",schedule: string[]): VCTSeasonState {
  const eventId = getVCTNarrativeEventId(sourcePhase,placement,nextPhase);

  if (!eventId) {
    if (nextPhase === "Complete") return {...season,phase: "Complete"};
    return activatePhase(season,nextPhase,schedule);
  }

  return {...season,pendingEvent: {eventId,nextPhase,nextSchedule: schedule}};
}

function queueSkippedTransition(season: VCTSeasonState,sourcePhase: PlayableVCTPhase,placement: number,skippedPhase: PlayableVCTPhase,nextPhase: PlayableVCTPhase,schedule: string[]): VCTSeasonState {
  const updated: VCTSeasonState = {
    ...season,
    events: {...season.events,[skippedPhase]: {...season.events[skippedPhase],status: "Skipped"}},
  };

  return queueTransition(updated,sourcePhase,placement,nextPhase,schedule);
}

function activatePhase(season: VCTSeasonState,phase: PlayableVCTPhase,schedule: string[]): VCTSeasonState {
  return {
    ...season,
    phase,
    events: {...season.events,[phase]: {...season.events[phase],status: "Active",schedule}},
  };
}

function createRegionalSchedule(team: TeamDefinition,matches: number) {
  return shuffle(TEAMS.filter((opponent) => opponent.id !== team.id && opponent.tier === 1 && opponent.circuit === team.circuit)).slice(0,matches).map((opponent) => opponent.id);
}

function createGlobalSchedule(team: TeamDefinition,matches: number) {
  const foreignTeams = shuffle(TEAMS.filter((opponent) => opponent.id !== team.id && opponent.tier === 1 && opponent.circuit !== team.circuit));
  const regionalTeams = shuffle(TEAMS.filter((opponent) => opponent.id !== team.id && opponent.tier === 1 && opponent.circuit === team.circuit));

  return [...foreignTeams,...regionalTeams].slice(0,matches).map((opponent) => opponent.id);
}

function getPlacement(phase: PlayableVCTPhase,wins: number,losses: number) {
  const matches = wins + losses;

  if (!matches) return 0;
  if (wins === matches) return 1;
  if (wins >= Math.ceil(matches * .7)) return 2;
  if (wins >= Math.ceil(matches * .5)) return 4;

  return phase === "Champions" ? 9 : 8;
}

function getChampionshipPoints(phase: PlayableVCTPhase,wins: number,placement: number) {
  if (phase === "Stage 1" || phase === "Stage 2") return wins;
  if (phase === "Stage 1 Playoffs" || phase === "Stage 2 Playoffs") return placement === 1 ? 6 : placement === 2 ? 4 : placement <= 4 ? 2 : 0;
  if (phase === "Masters 1" || phase === "Masters 2") return placement === 1 ? 8 : placement === 2 ? 6 : placement <= 4 ? 4 : 2;

  return 0;
}

export function getVCTSeasonStats(season: VCTSeasonState) {
  const matches = Object.values(season.events).flatMap((event) => event.matches);
  const wins = matches.filter((match) => match.won).length;
  const losses = matches.length - wins;
  const kills = matches.reduce((total,match) => total + match.kills,0);
  const deaths = matches.reduce((total,match) => total + match.deaths,0);
  const assists = matches.reduce((total,match) => total + match.assists,0);
  const averageRating = matches.length ? matches.reduce((total,match) => total + match.playerRating,0) / matches.length : 0;
  const averageACS = matches.length ? matches.reduce((total,match) => total + match.acs,0) / matches.length : 0;

  return {
    matches: matches.length,
    wins,
    losses,
    kills,
    deaths,
    assists,
    averageRating: Number(averageRating.toFixed(2)),
    averageACS: Math.round(averageACS),
    kd: deaths ? Number((kills / deaths).toFixed(2)) : kills,
  };
}