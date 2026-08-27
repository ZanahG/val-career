import type {CoachCareerState,CoachMastersState,CoachStageState,CoachVCTEventState,CoachVCTPhase,CoachVCTSeasonState} from "../types/coach";
import {TEAMS} from "../data/teams";
import {createCoachChampions,getChampionsPlacement,getNextPlayerChampionsMatch} from "./championsBracket";
import {createKickoffBracket,getKickoffPlacement,getNextPlayerKickoffMatch} from "./kickoffBracket";
import {getCoachCompetitiveStrengthTable} from "./coachTeamStrength";
import {createCoachMasters1,createCoachMasters2,getMastersPlacement,getMastersPlayerRecord,getNextPlayerMastersMatch} from "./mastersBracket";
import {createCoachStage1,createCoachStage2,getNextPlayerStageMatch,getStagePlacement,getStagePlayerRecord} from "./coachStage";

const PHASE_ORDER:CoachVCTPhase[]=[
  "Kickoff",
  "Masters 1",
  "Stage 1",
  "Stage 1 Playoffs",
  "Masters 2",
  "Stage 2",
  "Stage 2 Playoffs",
  "Champions",
  "Complete",
];

const KICKOFF_POINTS_BY_PLACEMENT:Record<number,number>={
  1:4,
  2:3,
  3:2,
  4:1,
};

const MASTERS_POINTS_BY_PLACEMENT:Record<number,number>={
  1:6,
  2:4,
  3:3,
  4:2,
  5:1,
  6:1,
};

const STAGE_PLAYOFF_POINTS_BY_PLACEMENT:Record<number,number>={
  1:5,
  2:3,
  3:2,
  4:1,
};

export function createCoachVCTSeason(career:CoachCareerState):CoachVCTSeasonState {
  return {
    season:career.coach.season,
    circuit:career.coach.circuit,
    phase:"Kickoff",
    events:{
      Kickoff:createEvent("Active",true),
      "Masters 1":createEvent("Locked",false),
      "Stage 1":createEvent("Locked",true),
      "Stage 1 Playoffs":createEvent("Locked",false),
      "Masters 2":createEvent("Locked",false),
      "Stage 2":createEvent("Locked",true),
      "Stage 2 Playoffs":createEvent("Locked",false),
      Champions:createEvent("Locked",false),
    },
    kickoffBracket:createKickoffBracket(
      career.coach.circuit,
      career.team.teamId,
      career.coach.season,
      getCoachCompetitiveStrengthTable(career),
    ),
    championshipPointsByTeam:createChampionshipPointsTable(career.coach.circuit),
  };
}

export function getNextCoachOpponent(career:CoachCareerState) {
  const season=career.seasonState;

  if(!season||season.phase==="Complete")return undefined;

  if(season.phase==="Kickoff"){
    const bracket=season.kickoffBracket;
    if(!bracket)return undefined;

    const match=getNextPlayerKickoffMatch(bracket);
    if(!match)return undefined;

    const opponentId=
      match.teamAId===career.team.teamId
        ?match.teamBId
        :match.teamAId;

    return opponentId
      ?TEAMS.find(team=>team.id===opponentId)
      :undefined;
  }

  if(season.phase==="Masters 1"||season.phase==="Masters 2"){
    const masters=
      season.phase==="Masters 1"
        ?season.masters1
        :season.masters2;

    if(!masters)return undefined;

    const match=getNextPlayerMastersMatch(masters);
    if(!match)return undefined;

    const opponentId=
      match.teamAId===career.team.teamId
        ?match.teamBId
        :match.teamAId;

    return opponentId
      ?TEAMS.find(team=>team.id===opponentId)
      :undefined;
  }

  if(
    season.phase==="Stage 1"||
    season.phase==="Stage 1 Playoffs"||
    season.phase==="Stage 2"||
    season.phase==="Stage 2 Playoffs"
  ){
    const stage=
      season.phase==="Stage 1"||season.phase==="Stage 1 Playoffs"
        ?season.stage1
        :season.stage2;

    if(!stage)return undefined;

    const match=getNextPlayerStageMatch(stage);
    if(!match)return undefined;

    const opponentId=
      match.teamAId===career.team.teamId
        ?match.teamBId
        :match.teamAId;

    return opponentId
      ?TEAMS.find(team=>team.id===opponentId)
      :undefined;
  }

  if(season.phase==="Champions"){
    const champions=season.champions;
    if(!champions)return undefined;

    const match=getNextPlayerChampionsMatch(champions);
    if(!match)return undefined;

    const opponentId=
      match.teamAId===career.team.teamId
        ?match.teamBId
        :match.teamAId;

    return opponentId
      ?TEAMS.find(team=>team.id===opponentId)
      :undefined;
  }

  return undefined;
}

/* =========================================================
   KICKOFF
========================================================= */

export function resolveCoachKickoff(career:CoachCareerState):CoachCareerState {
  const season=career.seasonState;

  if(!season||season.phase!=="Kickoff"||!season.kickoffBracket)return career;

  const bracket=season.kickoffBracket;

  if(!bracket.complete)return career;
  if(season.events.Kickoff.status==="Complete")return career;

  const playerTeamId=career.team.teamId;
  const placement=getKickoffPlacement(bracket,playerTeamId);
  const qualifiedToMasters1=placement<=3;

  const championshipPointsByTeam=awardKickoffChampionshipPoints(
    season,
    bracket,
  );

  const kickoffEvent:CoachVCTEventState={
    ...season.events.Kickoff,
    status:"Complete",
    placement,
    qualified:true,
  };

  if(qualifiedToMasters1){
    const masters1Event:CoachVCTEventState={
      ...season.events["Masters 1"],
      status:"Active",
      qualified:true,
    };

    const nextSeason:CoachVCTSeasonState={
      ...season,
      phase:"Masters 1",
      championshipPointsByTeam,
      events:{
        ...season.events,
        Kickoff:kickoffEvent,
        "Masters 1":masters1Event,
      },
    };

    const nextCareer:CoachCareerState={
      ...career,
      seasonState:nextSeason,
    };

    return {
      ...nextCareer,
      seasonState:{
        ...nextSeason,
        masters1:createCoachMasters1(nextCareer),
      },
    };
  }

  const masters1Event:CoachVCTEventState={
    ...season.events["Masters 1"],
    status:"Not Qualified",
    qualified:false,
  };

  const stage1Event:CoachVCTEventState={
    ...season.events["Stage 1"],
    status:"Active",
    qualified:true,
  };

  const nextSeason:CoachVCTSeasonState={
    ...season,
    phase:"Stage 1",
    championshipPointsByTeam,
    events:{
      ...season.events,
      Kickoff:kickoffEvent,
      "Masters 1":masters1Event,
      "Stage 1":stage1Event,
    },
  };

  const nextCareer:CoachCareerState={
    ...career,
    seasonState:nextSeason,
  };

  return {
    ...nextCareer,
    seasonState:{
      ...nextSeason,
      stage1:createCoachStage1(nextCareer),
    },
  };
}

/* =========================================================
   MASTERS 1
========================================================= */

export function resolveCoachMasters1(career:CoachCareerState):CoachCareerState {
  const season=career.seasonState;
  const masters=season?.masters1;

  if(!season||season.phase!=="Masters 1"||!masters)return career;
  if(!masters.complete)return career;
  if(season.events["Masters 1"].status==="Complete")return career;

  const placement=getMastersPlacement(
    masters,
    career.team.teamId,
  );

  const championshipPointsByTeam=awardMastersChampionshipPoints(
    season,
    masters,
  );

  const masters1Event:CoachVCTEventState={
    ...season.events["Masters 1"],
    status:"Complete",
    qualified:true,
    placement,
  };

  const stage1Event:CoachVCTEventState={
    ...season.events["Stage 1"],
    status:"Active",
    qualified:true,
  };

  const nextSeason:CoachVCTSeasonState={
    ...season,
    phase:"Stage 1",
    championshipPointsByTeam,
    events:{
      ...season.events,
      "Masters 1":masters1Event,
      "Stage 1":stage1Event,
    },
  };

  const nextCareer:CoachCareerState={
    ...career,
    seasonState:nextSeason,
  };

  return {
    ...nextCareer,
    seasonState:{
      ...nextSeason,
      stage1:createCoachStage1(nextCareer),
    },
  };
}

/* =========================================================
   STAGE 1
========================================================= */

export function syncCoachStage1Phase(career:CoachCareerState):CoachCareerState {
  return syncCoachStagePhase(
    career,
    "Stage 1",
    "Stage 1 Playoffs",
    career.seasonState?.stage1,
  );
}

export function resolveCoachStage1(career:CoachCareerState):CoachCareerState {
  const season=career.seasonState;
  const stage=season?.stage1;

  if(!season||!stage)return career;

  if(
    season.phase!=="Stage 1"&&
    season.phase!=="Stage 1 Playoffs"
  )return career;

  if(!stage.complete)return career;
  if(season.events["Stage 1 Playoffs"].status==="Complete")return career;

  const placement=getStagePlacement(
    stage,
    career.team.teamId,
  );

  const qualifiedToPlayoffs=stage.playoffSeeds.includes(
    career.team.teamId,
  );

  const qualifiedToMasters2=placement<=3;

  const championshipPointsByTeam=awardStageChampionshipPoints(
    season,
    stage,
  );

  const stage1Event:CoachVCTEventState={
    ...season.events["Stage 1"],
    status:"Complete",
    qualified:true,
  };

  const stage1PlayoffsEvent:CoachVCTEventState={
    ...season.events["Stage 1 Playoffs"],
    status:"Complete",
    qualified:qualifiedToPlayoffs,
    placement,
  };

  if(qualifiedToMasters2){
    const masters2Event:CoachVCTEventState={
      ...season.events["Masters 2"],
      status:"Active",
      qualified:true,
    };

    const nextSeason:CoachVCTSeasonState={
      ...season,
      phase:"Masters 2",
      championshipPointsByTeam,
      events:{
        ...season.events,
        "Stage 1":stage1Event,
        "Stage 1 Playoffs":stage1PlayoffsEvent,
        "Masters 2":masters2Event,
      },
    };

    const nextCareer:CoachCareerState={
      ...career,
      seasonState:nextSeason,
    };

    return {
      ...nextCareer,
      seasonState:{
        ...nextSeason,
        masters2:createCoachMasters2(nextCareer),
      },
    };
  }

  const masters2Event:CoachVCTEventState={
    ...season.events["Masters 2"],
    status:"Not Qualified",
    qualified:false,
  };

  const stage2Event:CoachVCTEventState={
    ...season.events["Stage 2"],
    status:"Active",
    qualified:true,
  };

  const nextSeason:CoachVCTSeasonState={
    ...season,
    phase:"Stage 2",
    championshipPointsByTeam,
    events:{
      ...season.events,
      "Stage 1":stage1Event,
      "Stage 1 Playoffs":stage1PlayoffsEvent,
      "Masters 2":masters2Event,
      "Stage 2":stage2Event,
    },
  };

  const nextCareer:CoachCareerState={
    ...career,
    seasonState:nextSeason,
  };

  return {
    ...nextCareer,
    seasonState:{
      ...nextSeason,
      stage2:createCoachStage2(nextCareer),
    },
  };
}

/* =========================================================
   MASTERS 2
========================================================= */

export function resolveCoachMasters2(career:CoachCareerState):CoachCareerState {
  const season=career.seasonState;
  const masters=season?.masters2;

  if(!season||season.phase!=="Masters 2"||!masters)return career;
  if(!masters.complete)return career;
  if(season.events["Masters 2"].status==="Complete")return career;

  const placement=getMastersPlacement(
    masters,
    career.team.teamId,
  );

  const championshipPointsByTeam=awardMastersChampionshipPoints(
    season,
    masters,
  );

  const masters2Event:CoachVCTEventState={
    ...season.events["Masters 2"],
    status:"Complete",
    qualified:true,
    placement,
  };

  const stage2Event:CoachVCTEventState={
    ...season.events["Stage 2"],
    status:"Active",
    qualified:true,
  };

  const nextSeason:CoachVCTSeasonState={
    ...season,
    phase:"Stage 2",
    championshipPointsByTeam,
    events:{
      ...season.events,
      "Masters 2":masters2Event,
      "Stage 2":stage2Event,
    },
  };

  const nextCareer:CoachCareerState={
    ...career,
    seasonState:nextSeason,
  };

  return {
    ...nextCareer,
    seasonState:{
      ...nextSeason,
      stage2:createCoachStage2(nextCareer),
    },
  };
}

/* =========================================================
   STAGE 2
========================================================= */

export function syncCoachStage2Phase(career:CoachCareerState):CoachCareerState {
  return syncCoachStagePhase(
    career,
    "Stage 2",
    "Stage 2 Playoffs",
    career.seasonState?.stage2,
  );
}

export function resolveCoachStage2(career:CoachCareerState):CoachCareerState {
  const season=career.seasonState;
  const stage=season?.stage2;

  if(!season||!stage)return career;
  if(season.phase!=="Stage 2"&&season.phase!=="Stage 2 Playoffs")return career;
  if(!stage.complete)return career;
  if(season.events["Stage 2 Playoffs"].status==="Complete")return career;

  const placement=getStagePlacement(stage,career.team.teamId);
  const qualifiedToPlayoffs=stage.playoffSeeds.includes(career.team.teamId);

  const championshipPointsByTeam=awardStageChampionshipPoints(
    season,
    stage,
  );

  const stage2Event:CoachVCTEventState={
    ...season.events["Stage 2"],
    status:"Complete",
    qualified:true,
  };

  const stage2PlayoffsEvent:CoachVCTEventState={
    ...season.events["Stage 2 Playoffs"],
    status:"Complete",
    qualified:qualifiedToPlayoffs,
    placement,
  };

  const baseSeason:CoachVCTSeasonState={
    ...season,
    championshipPointsByTeam,
    events:{
      ...season.events,
      "Stage 2":stage2Event,
      "Stage 2 Playoffs":stage2PlayoffsEvent,
    },
  };

  const baseCareer:CoachCareerState={
    ...career,
    seasonState:baseSeason,
  };

  const champions=createCoachChampions(baseCareer);

  const playerQualified=champions.qualifiers.some(
    qualifier=>qualifier.teamId===career.team.teamId,
  );

  if(!playerQualified){
    const championsEvent:CoachVCTEventState={
      ...season.events.Champions,
      status:"Not Qualified",
      qualified:false,
    };

    return {
      ...career,
      seasonState:{
        ...baseSeason,
        phase:"Complete",
        champions,
        events:{
          ...baseSeason.events,
          Champions:championsEvent,
        },
      },
    };
  }

  const championsEvent:CoachVCTEventState={
    ...season.events.Champions,
    status:"Active",
    qualified:true,
  };

  return {
    ...career,
    seasonState:{
      ...baseSeason,
      phase:"Champions",
      champions,
      events:{
        ...baseSeason.events,
        Champions:championsEvent,
      },
    },
  };
}

export function resolveCoachChampions(career:CoachCareerState):CoachCareerState {
  const season=career.seasonState;
  const champions=season?.champions;

  if(!season||season.phase!=="Champions"||!champions)return career;
  if(!champions.complete)return career;
  if(season.events.Champions.status==="Complete")return career;

  const placement=getChampionsPlacement(
    champions,
    career.team.teamId,
  );

  const championsEvent:CoachVCTEventState={
    ...season.events.Champions,
    status:"Complete",
    qualified:true,
    placement,
  };

  return {
    ...career,
    seasonState:{
      ...season,
      phase:"Complete",
      events:{
        ...season.events,
        Champions:championsEvent,
      },
    },
  };
}

/* =========================================================
   SUMMARIES
========================================================= */

export function getCoachKickoffSummary(career:CoachCareerState) {
  const season=career.seasonState;
  const bracket=season?.kickoffBracket;

  if(!season||!bracket||!bracket.complete)return undefined;

  const teamId=career.team.teamId;
  const placement=getKickoffPlacement(bracket,teamId);
  const points=KICKOFF_POINTS_BY_PLACEMENT[placement]??0;

  return {
    placement,
    championshipPoints:points,
    qualifiedToMasters:placement<=3,
    wins:season.events.Kickoff.matches.filter(match=>match.won).length,
    losses:season.events.Kickoff.matches.filter(match=>!match.won).length,
  };
}

export function getCoachMasters1Summary(career:CoachCareerState) {
  const season=career.seasonState;

  if(!season?.masters1)return undefined;

  return getCoachMastersSummary(
    season.masters1,
    career.team.teamId,
  );
}

export function getCoachMasters2Summary(career:CoachCareerState) {
  const season=career.seasonState;

  if(!season?.masters2)return undefined;

  return getCoachMastersSummary(
    season.masters2,
    career.team.teamId,
  );
}

export function getCoachStage1Summary(career:CoachCareerState) {
  const season=career.seasonState;

  if(!season?.stage1)return undefined;

  return getCoachStageSummary(
    season.stage1,
    career.team.teamId,
  );
}

export function getCoachStage2Summary(career:CoachCareerState) {
  const season=career.seasonState;

  if(!season?.stage2)return undefined;

  return getCoachStageSummary(
    season.stage2,
    career.team.teamId,
  );
}

/* =========================================================
   DEBUG / PHASE HELPERS
========================================================= */

export function advanceCoachVCTPhase(state:CoachVCTSeasonState):CoachVCTSeasonState {
  if(state.phase==="Complete")return state;

  const currentPhase=state.phase;
  const currentIndex=PHASE_ORDER.indexOf(currentPhase);
  const nextPhase=PHASE_ORDER[currentIndex+1]??"Complete";

  const events={
    ...state.events,
    [currentPhase]:{
      ...state.events[currentPhase],
      status:"Complete" as const,
    },
  };

  if(nextPhase==="Complete"){
    return {
      ...state,
      phase:"Complete",
      events,
    };
  }

  return {
    ...state,
    phase:nextPhase,
    events:{
      ...events,
      [nextPhase]:{
        ...events[nextPhase],
        status:"Active",
      },
    },
  };
}

export function getCoachVCTPhaseIndex(phase:CoachVCTPhase) {
  return PHASE_ORDER.indexOf(phase);
}

export function getCoachVCTPhases() {
  return PHASE_ORDER.filter(
    (phase):phase is Exclude<CoachVCTPhase,"Complete">=>
      phase!=="Complete",
  );
}

/* =========================================================
   SHARED STAGE HELPERS
========================================================= */

function syncCoachStagePhase(
  career:CoachCareerState,
  regularPhase:"Stage 1"|"Stage 2",
  playoffPhase:"Stage 1 Playoffs"|"Stage 2 Playoffs",
  stage:CoachStageState|undefined,
):CoachCareerState {
  const season=career.seasonState;

  if(!season||!stage)return career;

  if(
    season.phase!==regularPhase&&
    season.phase!==playoffPhase
  )return career;

  if(stage.complete)return career;

  if(stage.phase!=="Playoffs"||season.phase!==regularPhase){
    return career;
  }

  return {
    ...career,
    seasonState:{
      ...season,
      phase:playoffPhase,
      events:{
        ...season.events,
        [regularPhase]:{
          ...season.events[regularPhase],
          status:"Complete",
        },
        [playoffPhase]:{
          ...season.events[playoffPhase],
          status:"Active",
          qualified:true,
        },
      },
    },
  };
}

/* =========================================================
   SHARED SUMMARIES
========================================================= */

function getCoachMastersSummary(
  masters:CoachMastersState,
  teamId:string,
) {
  if(!masters.complete)return undefined;

  const placement=getMastersPlacement(
    masters,
    teamId,
  );

  const record=getMastersPlayerRecord(masters);

  const qualifiedToPlayoffs=
    masters.playoffQualifiedIds.includes(teamId)||
    masters.qualifiers.some(
      qualifier=>
        qualifier.teamId===teamId&&
        qualifier.seed===1,
    );

  return {
    event:masters.event,
    placement,
    championshipPoints:MASTERS_POINTS_BY_PLACEMENT[placement]??0,
    wins:record.wins,
    losses:record.losses,
    qualifiedToPlayoffs,
  };
}

function getCoachStageSummary(
  stage:CoachStageState,
  teamId:string,
) {
  if(!stage.complete)return undefined;

  const placement=getStagePlacement(
    stage,
    teamId,
  );

  const record=getStagePlayerRecord(stage);

  const regularWins=stage.matches.filter(match=>
    match.phase==="Regular Season"&&
    match.status==="Complete"&&
    match.winnerId===teamId
  ).length;

  const playoffPoints=
    STAGE_PLAYOFF_POINTS_BY_PLACEMENT[placement]??0;

  return {
    event:stage.event,
    placement,
    wins:record.wins,
    losses:record.losses,
    regularSeasonWins:regularWins,
    playoffPoints,
    championshipPoints:regularWins+playoffPoints,
    qualifiedToPlayoffs:stage.playoffSeeds.includes(teamId),
    qualifiedToMasters:stage.event==="Stage 1"&&placement<=3,
  };
}

/* =========================================================
   CHAMPIONSHIP POINTS
========================================================= */

function awardKickoffChampionshipPoints(
  season:CoachVCTSeasonState,
  bracket:NonNullable<CoachVCTSeasonState["kickoffBracket"]>,
) {
  const updated={...season.championshipPointsByTeam};

  const teams=TEAMS.filter(
    team=>
      team.tier===1&&
      team.circuit===season.circuit,
  );

  for(const team of teams){
    const placement=getKickoffPlacement(
      bracket,
      team.id,
    );

    const points=
      KICKOFF_POINTS_BY_PLACEMENT[placement]??0;

    if(points>0){
      updated[team.id]=(updated[team.id]??0)+points;
    }
  }

  return updated;
}

function awardMastersChampionshipPoints(
  season:CoachVCTSeasonState,
  masters:CoachMastersState,
) {
  const updated={...season.championshipPointsByTeam};

  for(const [teamId,placement] of Object.entries(
    masters.placementByTeam,
  )){
    const points=
      MASTERS_POINTS_BY_PLACEMENT[placement]??0;

    if(points>0){
      updated[teamId]=(updated[teamId]??0)+points;
    }
  }

  return updated;
}

function awardStageChampionshipPoints(
  season:CoachVCTSeasonState,
  stage:CoachStageState,
) {
  const updated={...season.championshipPointsByTeam};

  for(const match of stage.matches){
    if(
      match.phase!=="Regular Season"||
      match.status!=="Complete"||
      !match.winnerId
    )continue;

    updated[match.winnerId]=
      (updated[match.winnerId]??0)+1;
  }

  for(const [teamId,placement] of Object.entries(
    stage.placementByTeam,
  )){
    const points=
      STAGE_PLAYOFF_POINTS_BY_PLACEMENT[placement]??0;

    if(points>0){
      updated[teamId]=(updated[teamId]??0)+points;
    }
  }

  return updated;
}

/* =========================================================
   INTERNAL
========================================================= */

function createEvent(
  status:CoachVCTEventState["status"],
  qualified:boolean,
):CoachVCTEventState {
  return {
    status,
    matches:[],
    qualified,
  };
}

function createChampionshipPointsTable(
  circuit:CoachVCTSeasonState["circuit"],
) {
  return Object.fromEntries(
    TEAMS
      .filter(
        team=>
          team.tier===1&&
          team.circuit===circuit,
      )
      .map(team=>[team.id,0]),
  );
}