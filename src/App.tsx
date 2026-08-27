import {useEffect,useState} from "react";
import {CareerDashboard,CareerProfile,CreatePlayer} from "./components/career";
import {CoachDashboard,CoachEventRecap,CoachJobMarket,CoachMapPool,CoachMapVeto,CoachMarket,CoachMidseasonRecap,CoachOffseasonRecap,CoachRoster,CoachSeason,CoachTactics,CoachTeamSelect,CoachTransferNegotiation,CoachProfile} from "./components/coach";
import {MarketWindowScreen,OfferScreen} from "./components/market";
import {MatchStatsModal} from "./components/match";
import {MinigameRenderer} from "./components/minigames";
import {PlayerCardEditor} from "./components/player";
import {SeasonDashboard,SeasonRecap} from "./components/season";
import {GameModeSelect} from "./components/shared/GameModeSelect";
import {VCTDashboard,VCTLeaderboard,VCTOffseasonMoves,VCTSeasonRecap} from "./components/vct";
import {MAX_CAREER_SEASON,MAX_INITIAL_CAREER_EVENTS} from "./config/career";
import {getPlayerBanner,getPlayerTitle,isPlayerBannerUnlocked,isPlayerTitleUnlocked} from "./data/cosmetics";
import {getEventById,getRandomCareerStartEventId} from "./data/events";
import {generateMidseasonOffers,generateOffers,generateRenewalOffer} from "./data/offers";
import {getTeamById} from "./data/teams";
import type {VCTNarrativeChoice} from "./data/vctEvents";
import {createInitialVCTRosterState} from "./data/vctPlayers";
import {useCareerSave} from "./hooks/useCareerSave";
import {useCoachSave} from "./hooks/useCoachSave";
import {loadCoachCareer} from "./utils/coachSaveGame";
import {useVCTMinigames} from "./hooks/useVCTMinigames";
import {applyCareerEffects,normalizePlayerCosmetics,scaleIntroCareerEffects} from "./logic/careerPlayer";
import {simulateCoachSeries} from "./logic/coachMatchSimulation";
import {getNextPlayerStageMatch,playPlayerStageMatchWithScore} from "./logic/coachStage";
import {advanceCoachVCTPhase,createCoachVCTSeason,getNextCoachOpponent,resolveCoachChampions,resolveCoachKickoff,resolveCoachMasters1,resolveCoachMasters2,resolveCoachStage1,resolveCoachStage2,syncCoachStage1Phase,syncCoachStage2Phase} from "./logic/coachVCTSeason";
import {getNextPlayerKickoffMatch,playPlayerKickoffMatchWithScore} from "./logic/kickoffBracket";
import {getNextPlayerMastersMatch,playPlayerMastersMatchWithScore} from "./logic/mastersBracket";
import {getNextPlayerChampionsMatch,playPlayerChampionsMatchWithScore} from "./logic/championsBracket";
import {beginCoachMidseasonMarket,beginCoachOffseason,clearCoachMidseasonMarket,completeCoachMidseasonMarket,finishCoachSeason,startNextCoachSeason} from "./logic/coachCareerProgression";
import {createMatchBoxScore} from "./logic/matchBoxScore";
import {restoreCareerSave} from "./logic/restoreCareerSave";
import {acceptCoachJobOffer} from "./logic/coachJobMarket";
import {createSeason,getSortedStandings,playNextMatch} from "./logic/season";
import {refreshCoachTrainingPeriod} from "./logic/coachTraining";
import {simulateVCTOffseason} from "./logic/vctRosterMarket";
import {continueVCTAfterNarrativeEvent,createVCTSeason,getVCTSeasonStats,migrateVCTMastersState,migrateVCTStageState,playNextVCTMatch,resumeVCTAfterMidseasonMarket} from "./logic/vctSeason";
import type {CareerChoice,CareerEffects,CareerHistoryEntry,CareerPlayer,ContractOffer} from "./types/career";
import type {CoachCareerState,CoachMapVetoState,CoachTacticalStyle} from "./types/coach";
import {applyCoachBoardEventEvaluation,applyCoachBoardMatchResult,applyCoachBoardStreakPressure,evaluateCoachBoardProgress} from "./logic/coachBoard";
import type {MatchBoxScore} from "./types/matchStats";
import type {GameScreen,MarketWindow,ProfileReturnScreen} from "./types/navigation";
import type {SeasonState} from "./types/season";
import type {PlayableVCTPhase,VCTSeasonState} from "./types/vct";
import type {VCTRosterState} from "./types/vctRosters";
import {clearIntroEventCount,loadIntroEventCount,saveIntroEventCount} from "./utils/careerStorage";
import {applyOffseasonRegression,applyPlayerStatChange} from "./utils/playerStatsProgression";
import {loadCareer} from "./utils/saveGame";

export default function App() {
  const [player,setPlayer]=useState<CareerPlayer|null>(null);
  const [screen,setScreen]=useState<GameScreen>("menu");
  const [profileReturnScreen,setProfileReturnScreen]=useState<ProfileReturnScreen>("career");
  const [currentEventId,setCurrentEventId]=useState("");
  const [introEventsPlayed,setIntroEventsPlayed]=useState(loadIntroEventCount);
  const [season,setSeason]=useState<SeasonState|null>(null);
  const [vctSeason,setVCTSeason]=useState<VCTSeasonState|null>(null);
  const [vctRosters,setVCTRosters]=useState<VCTRosterState|undefined>(undefined);
  const [matchBoxScore,setMatchBoxScore]=useState<MatchBoxScore|null>(null);
  const [playerCardEditorOpen,setPlayerCardEditorOpen]=useState(false);
  const [marketWindow,setMarketWindow]=useState<MarketWindow>(null);
  const [marketOffers,setMarketOffers]=useState<ContractOffer[]>([]);
  const [renewalOffer,setRenewalOffer]=useState<ContractOffer|null>(null);

  const [coachCareer,setCoachCareer]=useState<CoachCareerState|null>(null);
  const [coachOpponentTeamId,setCoachOpponentTeamId]=useState<string|null>(null);
  const [coachMatchBoxScore,setCoachMatchBoxScore]=useState<MatchBoxScore|null>(null);
  const [coachNegotiationPlayerId,setCoachNegotiationPlayerId]=useState<string|null>(null);

  const {activeMinigame,resetMinigameState,skipMinigame,completeMinigame,queueMinigameAfterMatch,openQueuedMinigame}=useVCTMinigames();
  const {saveAvailable,clearCareerSave}=useCareerSave({player,screen,currentEventId,season,vctSeason,marketWindow,marketOffers,renewalOffer,vctRosters});

  const {coachSaveAvailable,clearCoachSave}=useCoachSave({
    career:coachCareer,
    screen,
  });

  const currentEvent=getEventById(currentEventId);
  const initialCareerEventsComplete=!currentEvent;
  const hasActiveSeason=Boolean(season||vctSeason);
  const canOpenOffers=initialCareerEventsComplete&&!hasActiveSeason&&!player?.currentTeamId;

  useEffect(()=>{
    saveIntroEventCount(introEventsPlayed);
  },[introEventsPlayed]);

  useEffect(()=>{
    if(!player||!vctSeason||screen!=="vct")return;

    let migrated=migrateVCTStageState(player,vctSeason);
    migrated=migrateVCTMastersState(player,migrated);

    if(migrated!==vctSeason)setVCTSeason(migrated);
  },[player,vctSeason,screen]);

  const updateCoachTacticalStyle=(style:CoachTacticalStyle)=>{
    setCoachCareer(current=>current?{...current,team:{...current.team,tacticalStyle:style}}:current);
  };

  const startCoachSeason=()=>{
    if(!coachCareer)return;

    const startedCareer:CoachCareerState={
      ...coachCareer,
      seasonState:createCoachVCTSeason(coachCareer),
    };

    setCoachCareer(refreshCoachTrainingPeriod(startedCareer));
  };

  const finishCurrentCoachSeason=()=>{
    if(!coachCareer)return;

    const finished=finishCoachSeason(coachCareer);

    setCoachCareer(finished);
    setCoachOpponentTeamId(null);
    setCoachMatchBoxScore(null);
    setCoachNegotiationPlayerId(null);

    if(finished.board.employmentStatus==="Dismissed"&&finished.jobMarket?.active){
      setScreen("coachJobMarket");
    }
  };

  const handleAcceptCoachJobOffer=(offerId:string)=>{
    if(!coachCareer)return;

    const updated=acceptCoachJobOffer(coachCareer,offerId);

    if(updated===coachCareer)return;

    setCoachCareer(updated);
    setCoachOpponentTeamId(null);
    setCoachMatchBoxScore(null);
    setCoachNegotiationPlayerId(null);
    setScreen("coachDashboard");
  };

  const continueToNextCoachSeason=()=>{
    if(!coachCareer)return;

    setCoachCareer(current=>current?startNextCoachSeason(current):current);
    setCoachOpponentTeamId(null);
    setCoachMatchBoxScore(null);
    setCoachNegotiationPlayerId(null);
    setScreen("coachDashboard");
  };

  const prepareCoachMatch=()=>{
    if(!coachCareer)return;

    const opponent=getNextCoachOpponent(coachCareer);
    if(!opponent)return;

    setCoachOpponentTeamId(opponent.id);
    setScreen("coachMapVeto");
  };

  const openCoachTransferNegotiation=(playerId:string)=>{
    if(!coachCareer)return;

    const target=coachCareer.playerPool.find(player=>player.id===playerId);
    if(!target)return;

    setCoachNegotiationPlayerId(playerId);
    setScreen("coachTransferNegotiation");
  };

  const closeCoachTransferNegotiation=()=>{
    setCoachNegotiationPlayerId(null);
    setScreen("coachMarket");
  };

  const completeCoachTransferNegotiation=()=>{
    setCoachNegotiationPlayerId(null);
    setScreen("coachMarket");
  };

  const enterCoachOffseason=()=>{
    if(!coachCareer)return;

    setCoachCareer(current=>current?beginCoachOffseason(current):current);
    setCoachOpponentTeamId(null);
    setCoachMatchBoxScore(null);
    setCoachNegotiationPlayerId(null);
    setScreen("coachMarket");
  };

  const continueAfterCoachEvent=()=>{
    if(!coachCareer)return;

    if(coachCareer.midseasonMarket&&!coachCareer.midseasonMarket.completed){
      setCoachNegotiationPlayerId(null);
      setScreen("coachMarket");
      return;
    }

    setScreen("coachSeason");
  };

  const handleCoachMarketComplete=()=>{
    if(!coachCareer)return;

    setCoachNegotiationPlayerId(null);

    if(coachCareer.midseasonMarket&&!coachCareer.midseasonMarket.completed){
      setCoachCareer(current=>current?completeCoachMidseasonMarket(current):current);
      setCoachOpponentTeamId(null);
      setCoachMatchBoxScore(null);
      setScreen("coachMidseasonRecap");
      return;
    }

    setScreen("coachOffseasonRecap");
  };

  const continueAfterCoachMidseasonRecap=()=>{
    setCoachCareer(current=>current?clearCoachMidseasonMarket(current):current);
    setCoachOpponentTeamId(null);
    setCoachMatchBoxScore(null);
    setCoachNegotiationPlayerId(null);
    setScreen("coachSeason");
  };

  const handleCoachMarketBack=()=>{
    if(!coachCareer)return;

    setCoachNegotiationPlayerId(null);

    if(coachCareer.midseasonMarket&&!coachCareer.midseasonMarket.completed){
      setScreen("coachEventRecap");
      return;
    }

    if(coachCareer.offseason){
      setScreen("coachSeason");
      return;
    }

    setScreen("coachDashboard");
  };

  const advanceCoachSeasonPhase=()=>{
    if(!coachCareer?.seasonState)return;

    setCoachCareer({
      ...coachCareer,
      seasonState:advanceCoachVCTPhase(coachCareer.seasonState),
    });
  };

  const handleCoachVetoComplete=(veto:CoachMapVetoState)=>{
    if(!coachCareer||!coachCareer.seasonState||!coachOpponentTeamId||!veto.completed)return;

    const simulation=simulateCoachSeries(coachCareer,coachOpponentTeamId,veto.seriesMaps);
    if(!simulation)return;

    const phase=coachCareer.seasonState.phase;
    if(phase==="Complete")return;

    let kickoffBracket=coachCareer.seasonState.kickoffBracket;
    let masters1=coachCareer.seasonState.masters1;
    let masters2=coachCareer.seasonState.masters2;
    let stage1=coachCareer.seasonState.stage1;
    let stage2=coachCareer.seasonState.stage2;
    let champions=coachCareer.seasonState.champions;

    if(phase==="Kickoff"&&kickoffBracket){
      kickoffBracket=playPlayerKickoffMatchWithScore(kickoffBracket,simulation.result.won,simulation.result.mapsWon,simulation.result.mapsLost);
    }

    if(phase==="Masters 1"&&masters1){
      masters1=playPlayerMastersMatchWithScore(masters1,simulation.result.won,simulation.result.mapsWon,simulation.result.mapsLost);
    }

    if((phase==="Stage 1"||phase==="Stage 1 Playoffs")&&stage1){
      stage1=playPlayerStageMatchWithScore(stage1,simulation.result.won,simulation.result.mapsWon,simulation.result.mapsLost);
    }

    if(phase==="Masters 2"&&masters2){
      masters2=playPlayerMastersMatchWithScore(masters2,simulation.result.won,simulation.result.mapsWon,simulation.result.mapsLost);
    }

    if((phase==="Stage 2"||phase==="Stage 2 Playoffs")&&stage2){
      stage2=playPlayerStageMatchWithScore(stage2,simulation.result.won,simulation.result.mapsWon,simulation.result.mapsLost);
    }

    if(phase==="Champions"&&champions){
      champions=playPlayerChampionsMatchWithScore(champions,simulation.result.won,simulation.result.mapsWon,simulation.result.mapsLost);
    }

    let updatedCareer:CoachCareerState={
      ...coachCareer,
      seasonState:{
        ...coachCareer.seasonState,
        kickoffBracket,
        masters1,
        masters2,
        stage1,
        stage2,
        champions,
        events:{
          ...coachCareer.seasonState.events,
          [phase]:{
            ...coachCareer.seasonState.events[phase],
            matches:[
              ...coachCareer.seasonState.events[phase].matches,
              {
                id:`${phase}-${Date.now()}`,
                opponentTeamId:coachOpponentTeamId,
                won:simulation.result.won,
                mapsWon:simulation.result.mapsWon,
                mapsLost:simulation.result.mapsLost,
                maps:simulation.result.maps,
              },
            ],
          },
        },
      },
    };

    if(phase==="Kickoff"){
      updatedCareer=resolveCoachKickoff(updatedCareer);
    }

    if(phase==="Masters 1"){
      updatedCareer=resolveCoachMasters1(updatedCareer);
    }

    if(phase==="Stage 1"||phase==="Stage 1 Playoffs"){
      updatedCareer=syncCoachStage1Phase(updatedCareer);
      updatedCareer=resolveCoachStage1(updatedCareer);

      const stage1PlayoffsComplete=
        updatedCareer.seasonState?.events["Stage 1 Playoffs"].status==="Complete";

      if(stage1PlayoffsComplete&&!updatedCareer.midseasonMarket){
        updatedCareer=beginCoachMidseasonMarket(updatedCareer);
      }
    }

    if(phase==="Masters 2"){
      updatedCareer=resolveCoachMasters2(updatedCareer);
    }

    if(phase==="Stage 2"||phase==="Stage 2 Playoffs"){
      updatedCareer=syncCoachStage2Phase(updatedCareer);
      updatedCareer=resolveCoachStage2(updatedCareer);
    }

    if(phase==="Champions"){
      updatedCareer=resolveCoachChampions(updatedCareer);
    }

    updatedCareer=applyCoachBoardMatchResult(
      updatedCareer,
      coachOpponentTeamId,
      simulation.result.won,
    );

    updatedCareer=applyCoachBoardStreakPressure(updatedCareer);

    updatedCareer=evaluateCoachBoardProgress(updatedCareer);
    updatedCareer=refreshCoachTrainingPeriod(updatedCareer);

    const eventFinished=
      (phase==="Kickoff"&&kickoffBracket?.complete===true)||
      (phase==="Masters 1"&&masters1?.complete===true)||
      ((phase==="Stage 1"||phase==="Stage 1 Playoffs")&&stage1?.complete===true)||
      (phase==="Masters 2"&&masters2?.complete===true)||
      ((phase==="Stage 2"||phase==="Stage 2 Playoffs")&&stage2?.complete===true)||
      (phase==="Champions"&&champions?.complete===true);

    if(eventFinished){
      updatedCareer=applyCoachBoardEventEvaluation(updatedCareer,phase);
    }  

    setCoachCareer(updatedCareer);
    setCoachMatchBoxScore(simulation.boxScore);
    setCoachOpponentTeamId(null);
    setCoachNegotiationPlayerId(null);
    setScreen(eventFinished?"coachEventRecap":"coachSeason");
  };

  const ensureVCTRosters=(seasonNumber:number)=>{
    if(vctRosters)return vctRosters;

    const initial=createInitialVCTRosterState(seasonNumber);
    setVCTRosters(initial);
    return initial;
  };

  const stayWithCurrentTeam=()=>{
    if(!player||!vctSeason||marketWindow!=="midseason")return;

    setVCTSeason(resumeVCTAfterMidseasonMarket(player,vctSeason));
    setMarketWindow(null);
    setMarketOffers([]);
    setScreen("vct");
  };

  const exploreMarketOffers=()=>{
    if(!player||!marketWindow)return;

    if(!marketOffers.length){
      setMarketOffers(marketWindow==="midseason"?generateMidseasonOffers(player):generateOffers(player));
    }

    setScreen("offers");
  };

  const returnToMarket=()=>{
    if(!marketWindow)return;
    setScreen("market");
  };

  const continueAfterVCTOffseason=()=>{
    setScreen("market");
  };

  const handleCreate=(createdPlayer:CareerPlayer)=>{
    setPlayer(normalizePlayerCosmetics(createdPlayer));
    setCurrentEventId(getRandomCareerStartEventId());
    setIntroEventsPlayed(0);
    setSeason(null);
    setVCTSeason(null);
    setVCTRosters(undefined);
    setMatchBoxScore(null);
    setPlayerCardEditorOpen(false);
    resetMinigameState();
    setMarketWindow(null);
    setMarketOffers([]);
    setScreen("career");
    setRenewalOffer(null);
  };

  const handleChoice=(choice:CareerChoice)=>{
    if(!player)return;

    const updatedPlayer=applyCareerEffects(player,scaleIntroCareerEffects(choice.effects));
    const nextCount=introEventsPlayed+1;
    const reachedLimit=nextCount>=MAX_INITIAL_CAREER_EVENTS;
    const chainFinished=!choice.nextEventId;

    setPlayer(updatedPlayer);
    setIntroEventsPlayed(nextCount);

    if(reachedLimit||chainFinished){
      setCurrentEventId("");
      setScreen("offers");
      return;
    }

    setCurrentEventId(choice.nextEventId??"");
  };

  const openOffers=()=>{
    if(!canOpenOffers)return;
    setScreen("offers");
  };

  const resumeCompetition=()=>{
    if(vctSeason&&player?.currentStage==="VCT"){
      setScreen("vct");
      return;
    }

    if(season)setScreen("season");
  };

  const openProfile=(returnScreen:ProfileReturnScreen)=>{
    setProfileReturnScreen(returnScreen);
    setScreen("profile");
  };

  const openLeaderboard=()=>{
    setScreen("leaderboard");
  };

  const closeLeaderboard=()=>{
    setScreen("vct");
  };

  const closeProfile=()=>setScreen(profileReturnScreen);

  const equipPlayerBanner=(id:string)=>{
    if(!player)return;

    const banner=getPlayerBanner(id);
    if(!banner||!isPlayerBannerUnlocked(banner,player))return;

    setPlayer({...player,equippedBannerId:id});
  };

  const equipPlayerTitle=(id:string)=>{
    if(!player)return;

    const title=getPlayerTitle(id);
    if(!title||!isPlayerTitleUnlocked(title,player))return;

    setPlayer({...player,equippedTitleId:id});
  };

  const acceptOffer=(offer:ContractOffer)=>{
    if(!player)return;

    const team=getTeamById(offer.teamId);
    if(!team)return;

    const updatedPlayer:CareerPlayer={
      ...player,
      currentTeamId:team.id,
      currentTeam:team.name,
      currentStage:team.tier===1?"VCT":"Tier 2",
      rosterRole:offer.rosterRole,
      salary:offer.salary,
      contractSeasonsRemaining:offer.duration,
      earnings:player.earnings+offer.signingBonus,
    };

    if(marketWindow==="midseason"&&vctSeason){
      if(team.tier!==1)return;

      ensureVCTRosters(updatedPlayer.season);

      const updatedVCTSeason=resumeVCTAfterMidseasonMarket(updatedPlayer,vctSeason);

      setPlayer(updatedPlayer);
      setVCTSeason(updatedVCTSeason);
      setSeason(null);
      setMarketWindow(null);
      setMarketOffers([]);
      setMatchBoxScore(null);
      setPlayerCardEditorOpen(false);
      resetMinigameState();
      setScreen("vct");
      setRenewalOffer(null);
      return;
    }

    if(marketWindow==="offseason"){
      const nextSeasonPlayer:CareerPlayer={
        ...updatedPlayer,
        season:player.season+1,
        age:player.age+1,
        stats:applyOffseasonRegression(player.stats),
      };

      setPlayer(nextSeasonPlayer);
      setSeason(null);
      setMarketWindow(null);
      setMarketOffers([]);
      setRenewalOffer(null);
      setMatchBoxScore(null);
      setPlayerCardEditorOpen(false);
      resetMinigameState();

      if(team.tier===1){
        ensureVCTRosters(nextSeasonPlayer.season);
        setVCTSeason(createVCTSeason(nextSeasonPlayer));
        setScreen("vct");
        return;
      }

      setVCTSeason(null);
      setSeason(createSeason(nextSeasonPlayer));
      setScreen("season");
      return;
    }

    setPlayer(updatedPlayer);
    setMatchBoxScore(null);
    setPlayerCardEditorOpen(false);
    resetMinigameState();
    setMarketWindow(null);
    setMarketOffers([]);

    if(team.tier===1){
      ensureVCTRosters(updatedPlayer.season);
      setSeason(null);
      setVCTSeason(createVCTSeason(updatedPlayer));
      setScreen("vct");
      return;
    }

    setVCTSeason(null);
    setSeason(createSeason(updatedPlayer));
    setScreen("season");
  };

  const handleVCTNarrativeChoice=(choice:VCTNarrativeChoice)=>{
    if(!player||!vctSeason?.pendingEvent)return;

    setPlayer(applyCareerEffects(player,choice.effects));
    setVCTSeason(continueVCTAfterNarrativeEvent(vctSeason));
  };

  const handleMinigameComplete=(effects:CareerEffects)=>{
    if(!player||!activeMinigame)return;

    setPlayer(applyCareerEffects(player,effects));
    completeMinigame();
  };

  const closeMatchBoxScore=()=>{
    setMatchBoxScore(null);
    openQueuedMinigame();
  };

  const handlePlayMatch=()=>{
    if(!player||!season)return;

    const previousRegularMatches=season.playedMatches.length;
    const previousAscensionMatches=season.ascensionMatches.length;
    const updatedSeason=playNextMatch(player,season);

    const newRegularMatch=updatedSeason.playedMatches.length>previousRegularMatches?updatedSeason.playedMatches.at(-1):undefined;
    const newAscensionMatch=updatedSeason.ascensionMatches.length>previousAscensionMatches?updatedSeason.ascensionMatches.at(-1):undefined;
    const result=newAscensionMatch??newRegularMatch;

    if(result){
      const boxScore=createMatchBoxScore(player,result);
      if(boxScore)setMatchBoxScore(boxScore);

      setPlayer({
        ...player,
        stats:{
          ...player.stats,
          mental:applyPlayerStatChange(player.stats.mental,result.won?1:-1),
          consistency:applyPlayerStatChange(player.stats.consistency,result.playerRating>=1.05?1:result.playerRating<.8?-1:0),
        },
      });
    }

    setSeason(updatedSeason);
  };

  const handleFinishSeason=()=>{
    if(!player||!season)return;

    const team=getTeamById(player.currentTeamId);
    const standings=getSortedStandings(season.standings);
    const placement=standings.findIndex(row=>row.teamId===player.currentTeamId)+1;
    const regularWins=season.playedMatches.filter(match=>match.won).length;
    const regularLosses=season.playedMatches.length-regularWins;
    const ascensionWins=season.ascensionMatches.filter(match=>match.won).length;
    const ascensionLosses=season.ascensionMatches.length-ascensionWins;
    const trophies:string[]=[];

    if(team?.tier===2&&placement===1)trophies.push(`${player.season} Challengers ${team.marketRegion} Champion`);
    if(season.ascensionWon)trophies.push(`${player.season} ${team?.circuit??""} Ascension Winner`);

    const historyEntry:CareerHistoryEntry={
      season:player.season,
      teamId:player.currentTeamId??"free-agent",
      teamName:player.currentTeam,
      rosterRole:player.rosterRole,
      salary:player.salary,
      wins:regularWins,
      losses:regularLosses,
      placement,
      trophies,
      stage:player.currentStage,
      ascensionQualified:season.ascensionQualified,
      ascensionWon:season.ascensionWon,
      ascensionWins,
      ascensionLosses,
    };

    const finishedPlayer:CareerPlayer={
      ...player,
      vctEligible:player.vctEligible||season.ascensionWon,
      earnings:player.earnings+player.salary*12,
      history:[...player.history,historyEntry],
      trophies:[...player.trophies,...trophies],
    };

    setPlayer(finishedPlayer);

    if(player.season>=MAX_CAREER_SEASON){
      setSeason(null);
      setVCTSeason(null);
      setMarketWindow(null);
      setMarketOffers([]);
      setRenewalOffer(null);
      setMatchBoxScore(null);
      resetMinigameState();
      setProfileReturnScreen("career");
      setScreen("profile");
      return;
    }

    setScreen("recap");
  };

  const continueCareer=()=>{
    if(!player)return;

    if(player.season>=MAX_CAREER_SEASON){
      setSeason(null);
      setVCTSeason(null);
      setMarketWindow(null);
      setMarketOffers([]);
      setRenewalOffer(null);
      resetMinigameState();
      setProfileReturnScreen("career");
      setScreen("profile");
      return;
    }

    resetMinigameState();
    setMarketWindow(null);
    setMarketOffers([]);

    if(season?.ascensionWon&&player.currentStage==="Tier 2"){
      const updatedPlayer:CareerPlayer={
        ...player,
        season:player.season+1,
        age:player.age+1,
        stats:applyOffseasonRegression(player.stats),
        vctEligible:true,
        contractSeasonsRemaining:0,
        currentTeamId:undefined,
        currentTeam:"Free Agent",
        salary:0,
      };

      setPlayer(updatedPlayer);
      setSeason(null);
      setVCTSeason(null);
      setMatchBoxScore(null);
      setPlayerCardEditorOpen(false);
      setScreen("offers");
      return;
    }

    const seasonsRemaining=Math.max(0,player.contractSeasonsRemaining-1);

    const updatedPlayer:CareerPlayer={
      ...player,
      season:player.season+1,
      age:player.age+1,
      contractSeasonsRemaining:seasonsRemaining,
      stats:applyOffseasonRegression(player.stats),
    };

    if(seasonsRemaining>0&&updatedPlayer.currentTeamId){
      const team=getTeamById(updatedPlayer.currentTeamId);

      setPlayer(updatedPlayer);

      if(team?.tier===1){
        ensureVCTRosters(updatedPlayer.season);
        setSeason(null);
        setVCTSeason(createVCTSeason(updatedPlayer));
        setMatchBoxScore(null);
        setPlayerCardEditorOpen(false);
        setScreen("vct");
        return;
      }

      setVCTSeason(null);
      setSeason(createSeason(updatedPlayer));
      setMatchBoxScore(null);
      setPlayerCardEditorOpen(false);
      setScreen("season");
      return;
    }

    setPlayer({...updatedPlayer,currentTeamId:undefined,currentTeam:"Free Agent",salary:0});
    setSeason(null);
    setVCTSeason(null);
    setMatchBoxScore(null);
    setPlayerCardEditorOpen(false);
    setScreen("offers");
  };

  const handlePlayVCTMatch=()=>{
    if(!player||!vctSeason||vctSeason.phase==="Complete")return;

    const previousPhase=vctSeason.phase as PlayableVCTPhase;
    const previousMatchCount=vctSeason.events[previousPhase].matches.length;
    const updatedSeason=playNextVCTMatch(player,vctSeason);
    const updatedEvent=updatedSeason.events[previousPhase];
    const result=updatedEvent.matches.length>previousMatchCount?updatedEvent.matches.at(-1):undefined;

    if(result){
      const boxScore=createMatchBoxScore(player,result,3,vctRosters);
      if(boxScore)setMatchBoxScore(boxScore);

      setPlayer({
        ...player,
        stats:{
          ...player.stats,
          mental:applyPlayerStatChange(player.stats.mental,result.won?1:-1),
          consistency:applyPlayerStatChange(player.stats.consistency,result.playerRating>=1.1?1:result.playerRating<.8?-1:0),
        },
      });

      queueMinigameAfterMatch(previousPhase,Boolean(boxScore));
    }

    setVCTSeason(updatedSeason);

    if(updatedSeason.marketWindowPending==="midseason"){
      setMarketWindow("midseason");
      setMarketOffers([]);
      setScreen("market");
    }
  };

  const handleFinishVCTSeason=()=>{
    if(!player||!vctSeason)return;

    const stats=getVCTSeasonStats(vctSeason);

    const vctEvents=Object.entries(vctSeason.events).map(([name,event])=>({
      name,
      wins:event.matches.filter(match=>match.won).length,
      losses:event.matches.filter(match=>!match.won).length,
      placement:event.placement,
      status:event.status,
    }));

    const championsPlacement=vctSeason.events.Champions.placement??0;
    const trophies:string[]=[];

    if(vctSeason.events.Kickoff.placement===1)trophies.push(`${player.season} VCT ${vctSeason.circuit} Kickoff Champion`);
    if(vctSeason.events["Stage 1 Playoffs"].placement===1)trophies.push(`${player.season} VCT ${vctSeason.circuit} Stage 1 Champion`);
    if(vctSeason.events["Masters 1"].placement===1)trophies.push(`${player.season} Masters 1 Champion`);
    if(vctSeason.events["Masters 2"].placement===1)trophies.push(`${player.season} Masters 2 Champion`);
    if(vctSeason.events["Stage 2 Playoffs"].placement===1)trophies.push(`${player.season} VCT ${vctSeason.circuit} Stage 2 Champion`);
    if(championsPlacement===1)trophies.push(`${player.season} Valorant World Champion`);

    const championshipPoints=player.currentTeamId?(vctSeason.championshipPointsByTeam[player.currentTeamId]??0):0;

    const historyEntry:CareerHistoryEntry={
      season:player.season,
      teamId:player.currentTeamId??"free-agent",
      teamName:player.currentTeam,
      rosterRole:player.rosterRole,
      salary:player.salary,
      wins:stats.wins,
      losses:stats.losses,
      placement:championsPlacement,
      trophies,
      stage:"VCT",
      vctCircuit:vctSeason.circuit,
      championshipPoints,
      vctEvents,
    };

    const finishedPlayer:CareerPlayer={
      ...player,
      earnings:player.earnings+player.salary*12,
      history:[...player.history,historyEntry],
      trophies:[...player.trophies,...trophies],
    };

    setPlayer(finishedPlayer);
    setMatchBoxScore(null);
    setPlayerCardEditorOpen(false);
    resetMinigameState();

    if(player.season>=MAX_CAREER_SEASON){
      setSeason(null);
      setVCTSeason(null);
      setMarketWindow(null);
      setMarketOffers([]);
      setRenewalOffer(null);
      setProfileReturnScreen("career");
      setScreen("profile");
      return;
    }

    setScreen("vctRecap");
  };

  const continueVCTCareer=()=>{
    if(!player)return;

    if(player.season>=MAX_CAREER_SEASON){
      setSeason(null);
      setVCTSeason(null);
      setMarketWindow(null);
      setMarketOffers([]);
      setRenewalOffer(null);
      setProfileReturnScreen("career");
      setScreen("profile");
      return;
    }

    const nextSeason=player.season+1;

    if(vctRosters){
      const updatedRosters=simulateVCTOffseason(vctRosters,nextSeason);
      setVCTRosters(updatedRosters);
    }

    resetMinigameState();
    setMarketWindow("offseason");
    setMarketOffers([]);
    setRenewalOffer(generateRenewalOffer(player));
    setScreen("vctOffseason");
  };

  const acceptRenewal=()=>{
    if(!player||!renewalOffer||marketWindow!=="offseason")return;

    const team=getTeamById(renewalOffer.teamId);
    if(!team)return;

    const updatedPlayer:CareerPlayer={
      ...player,
      season:player.season+1,
      age:player.age+1,
      stats:applyOffseasonRegression(player.stats),
      currentTeamId:team.id,
      currentTeam:team.name,
      currentStage:team.tier===1?"VCT":"Tier 2",
      rosterRole:renewalOffer.rosterRole,
      salary:renewalOffer.salary,
      contractSeasonsRemaining:renewalOffer.duration,
      earnings:player.earnings+renewalOffer.signingBonus,
    };

    setPlayer(updatedPlayer);
    setSeason(null);
    setMarketWindow(null);
    setMarketOffers([]);
    setRenewalOffer(null);
    setMatchBoxScore(null);
    setPlayerCardEditorOpen(false);
    resetMinigameState();

    if(team.tier===1){
      ensureVCTRosters(updatedPlayer.season);
      setVCTSeason(createVCTSeason(updatedPlayer));
      setScreen("vct");
      return;
    }

    setVCTSeason(null);
    setSeason(createSeason(updatedPlayer));
    setScreen("season");
  };

  const continueSavedCareer=()=>{
    const save=loadCareer();
    if(!save)return;

    const restored=restoreCareerSave(save);

    setRenewalOffer(restored.renewalOffer);
    setPlayer(restored.player);
    setCurrentEventId(save.currentEventId);
    setIntroEventsPlayed(loadIntroEventCount());
    setSeason(save.season??null);
    setVCTSeason(save.vctSeason??null);
    setVCTRosters(restored.vctRosters);
    setMarketWindow(restored.marketWindow);
    setMarketOffers(restored.marketOffers);
    setMatchBoxScore(null);
    setPlayerCardEditorOpen(false);
    resetMinigameState();
    setScreen(save.screen);
  };

  const resetCareer=()=>{
    clearCareerSave();
    clearIntroEventCount();

    setPlayer(null);
    setSeason(null);
    setVCTSeason(null);
    setVCTRosters(undefined);
    setMatchBoxScore(null);
    setPlayerCardEditorOpen(false);
    setCurrentEventId("");
    setIntroEventsPlayed(0);
    resetMinigameState();
    setProfileReturnScreen("career");
    setMarketWindow(null);
    setMarketOffers([]);
    setScreen("create");
    setRenewalOffer(null);
  };

  const startPlayerCareer=()=>{
    setScreen("create");
  };

  const openCoachMode=()=>{
    setCoachNegotiationPlayerId(null);
    setScreen("coachSelect");
  };

  const continueCoachCareer=()=>{
    const save=loadCoachCareer();
    if(!save)return;

    setCoachCareer(save.career);
    setCoachOpponentTeamId(null);
    setCoachMatchBoxScore(null);
    setCoachNegotiationPlayerId(null);

    const restoredScreen=
      save.screen==="coachTransferNegotiation"
        ?"coachMarket"
        :save.screen;

    setScreen(restoredScreen);
  };

  const handleCreateCoachCareer=(career:CoachCareerState)=>{
    clearCoachSave();

    setCoachCareer(career);
    setCoachOpponentTeamId(null);
    setCoachMatchBoxScore(null);
    setCoachNegotiationPlayerId(null);
    setScreen("coachDashboard");
  };

  const returnToMainMenu=()=>{
    setCoachOpponentTeamId(null);
    setCoachMatchBoxScore(null);
    setCoachNegotiationPlayerId(null);
    setScreen("menu");
  };

  const renderScreen=()=>{
    if(screen==="menu"){
      return <GameModeSelect onPlayerCareer={startPlayerCareer} onCoachCareer={openCoachMode} onContinueCoachCareer={continueCoachCareer} hasCoachSave={coachSaveAvailable}/>;
    }

    if(screen==="coachSelect"){
      return <CoachTeamSelect onStart={handleCreateCoachCareer}/>;
    }

    if(screen==="coachJobMarket"&&coachCareer){
      return (
        <CoachJobMarket
          career={coachCareer}
          onAccept={handleAcceptCoachJobOffer}
          onExit={returnToMainMenu}
        />
      );
    }

    if(screen==="coachDashboard"&&coachCareer){
      return (
        <CoachDashboard
          career={coachCareer}
          onChangeTacticalStyle={updateCoachTacticalStyle}
          onOpenCoachProfile={()=>setScreen("coachProfile")}
          onOpenRoster={()=>setScreen("coachRoster")}
          onOpenMarket={()=>setScreen("coachMarket")}
          onOpenTactics={()=>setScreen("coachTactics")}
          onOpenMapPool={()=>setScreen("coachMapPool")}
          onOpenSeason={()=>setScreen("coachSeason")}
          onExit={returnToMainMenu}
        />
      );
    }

    if(screen==="coachProfile"&&coachCareer){
      return <CoachProfile career={coachCareer} onBack={()=>setScreen("coachDashboard")}/>;
    }

    if(screen==="coachRoster"&&coachCareer){
      return <CoachRoster career={coachCareer} onBack={()=>setScreen("coachDashboard")}/>;
    }

    if(screen==="coachMarket"&&coachCareer){
      return (
        <CoachMarket
          career={coachCareer}
          onUpdateCareer={setCoachCareer}
          onBack={handleCoachMarketBack}
          onOffseasonComplete={handleCoachMarketComplete}
          onNegotiatePlayer={openCoachTransferNegotiation}
        />
      );
    }

    if(screen==="coachTransferNegotiation"&&coachCareer){
      if(!coachNegotiationPlayerId){
        return (
          <CoachMarket
            career={coachCareer}
            onUpdateCareer={setCoachCareer}
            onBack={handleCoachMarketBack}
            onOffseasonComplete={handleCoachMarketComplete}
            onNegotiatePlayer={openCoachTransferNegotiation}
          />
        );
      }

      return (
        <CoachTransferNegotiation
          career={coachCareer}
          playerId={coachNegotiationPlayerId}
          onUpdateCareer={setCoachCareer}
          onCancel={closeCoachTransferNegotiation}
          onComplete={completeCoachTransferNegotiation}
        />
      );
    }

    if(screen==="coachOffseasonRecap"&&coachCareer){
      return <CoachOffseasonRecap career={coachCareer} onContinue={()=>setScreen("coachSeason")}/>;
    }

    if(screen==="coachMidseasonRecap"&&coachCareer){
      return <CoachMidseasonRecap career={coachCareer} onContinue={continueAfterCoachMidseasonRecap}/>;
    }

    if(screen==="coachTactics"&&coachCareer){
      return <CoachTactics career={coachCareer} onUpdateCareer={setCoachCareer} onBack={()=>setScreen("coachDashboard")}/>;
    }

    if(screen==="coachMapPool"&&coachCareer){
      return <CoachMapPool career={coachCareer} onUpdateCareer={setCoachCareer} onBack={()=>setScreen("coachDashboard")} onOpenVeto={()=>setScreen("coachSeason")}/>;
    }

    if(screen==="coachEventRecap"&&coachCareer){
      return <CoachEventRecap career={coachCareer} onContinue={continueAfterCoachEvent}/>;
    }

    if(screen==="coachSeason"&&coachCareer){
      return (
        <CoachSeason
          career={coachCareer}
          onStartSeason={startCoachSeason}
          onAdvancePhase={advanceCoachSeasonPhase}
          onPrepareMatch={prepareCoachMatch}
          onFinishSeason={finishCurrentCoachSeason}
          onEnterOffseason={enterCoachOffseason}
          onNextSeason={continueToNextCoachSeason}
          onBack={()=>setScreen("coachDashboard")}
        />
      );
    }

    if(screen==="coachMapVeto"&&coachCareer&&coachOpponentTeamId){
      return (
        <CoachMapVeto
          career={coachCareer}
          opponentTeamId={coachOpponentTeamId}
          bestOf={getCurrentCoachMatchBestOf(coachCareer)}
          onComplete={handleCoachVetoComplete}
          onBack={()=>{
            setCoachOpponentTeamId(null);
            setScreen("coachSeason");
          }}
        />
      );
    }

    if(screen==="coachMapVeto"&&coachCareer){
      return (
        <CoachSeason
          career={coachCareer}
          onStartSeason={startCoachSeason}
          onAdvancePhase={advanceCoachSeasonPhase}
          onPrepareMatch={prepareCoachMatch}
          onFinishSeason={finishCurrentCoachSeason}
          onEnterOffseason={enterCoachOffseason}
          onNextSeason={continueToNextCoachSeason}
          onBack={()=>setScreen("coachDashboard")}
        />
      );
    }

    if(!player||screen==="create"){
      return <CreatePlayer onCreate={handleCreate} onContinue={continueSavedCareer} hasSave={saveAvailable}/>;
    }

    if(screen==="profile"){
      return <CareerProfile player={player} onBack={closeProfile} onEditPlayerCard={()=>setPlayerCardEditorOpen(true)}/>;
    }

    if(screen==="vctOffseason"&&vctRosters){
      return <VCTOffseasonMoves season={player.season+1} transfers={vctRosters.transfers??[]} onContinue={continueAfterVCTOffseason}/>;
    }

    if(screen==="market"&&marketWindow){
      return <MarketWindowScreen player={player} type={marketWindow} renewalOffer={renewalOffer} onStay={stayWithCurrentTeam} onRenew={acceptRenewal} onExploreOffers={exploreMarketOffers}/>;
    }

    if(screen==="offers"){
      const offers=marketWindow?marketOffers:generateOffers(player);
      return <OfferScreen player={player} offers={offers} onAccept={acceptOffer} onBack={marketWindow?returnToMarket:undefined}/>;
    }

    if(screen==="leaderboard"&&vctRosters){
      return <VCTLeaderboard player={player} rosters={vctRosters} onBack={closeLeaderboard}/>;
    }

    if(screen==="vct"&&vctSeason){
      return <VCTDashboard player={player} season={vctSeason} onPlayMatch={handlePlayVCTMatch} onFinishSeason={handleFinishVCTSeason} onOpenProfile={()=>openProfile("vct")} onOpenLeaderboard={openLeaderboard} onChooseEvent={handleVCTNarrativeChoice} onUpdatePlayer={setPlayer}/>;
    }

    if(screen==="season"&&season){
      return <SeasonDashboard player={player} season={season} onPlayMatch={handlePlayMatch} onFinishSeason={handleFinishSeason} onOpenProfile={()=>openProfile("season")} onGoHome={()=>setScreen("career")} onUpdatePlayer={setPlayer}/>;
    }

    if(screen==="recap"&&season){
      return <SeasonRecap player={player} season={season} onContinue={continueCareer}/>;
    }

    if(screen==="vctRecap"&&vctSeason){
      return <VCTSeasonRecap player={player} season={vctSeason} onContinue={continueVCTCareer}/>;
    }

    return <CareerDashboard player={player} event={currentEvent} onChoose={handleChoice} onReset={resetCareer} onOpenOffers={openOffers} onOpenProfile={()=>openProfile("career")} onEditPlayerCard={()=>setPlayerCardEditorOpen(true)} canOpenOffers={canOpenOffers} hasActiveSeason={hasActiveSeason} onResumeSeason={resumeCompetition} onUpdatePlayer={setPlayer}/>;
  };

  return (
    <>
      {renderScreen()}

      {player&&<MinigameRenderer type={activeMinigame} player={player} onComplete={handleMinigameComplete} onSkip={skipMinigame}/>}

      {matchBoxScore&&<MatchStatsModal match={matchBoxScore} playerTeamId={player?.currentTeamId} onClose={closeMatchBoxScore}/>}

      {player&&playerCardEditorOpen&&<PlayerCardEditor player={player} onEquipBanner={equipPlayerBanner} onEquipTitle={equipPlayerTitle} onClose={()=>setPlayerCardEditorOpen(false)}/>}

      {coachMatchBoxScore&&<MatchStatsModal match={coachMatchBoxScore} onClose={()=>setCoachMatchBoxScore(null)}/>}
    </>
  );
}
function getCurrentCoachMatchBestOf(career:CoachCareerState):3|5 {
  const season=career.seasonState;
  if(!season)return 3;

  if(season.phase==="Kickoff"&&season.kickoffBracket){
    return getNextPlayerKickoffMatch(season.kickoffBracket)?.bestOf??3;
  }

  if(season.phase==="Masters 1"&&season.masters1){
    return getNextPlayerMastersMatch(season.masters1)?.bestOf??3;
  }

  if(season.phase==="Masters 2"&&season.masters2){
    return getNextPlayerMastersMatch(season.masters2)?.bestOf??3;
  }

  if((season.phase==="Stage 1"||season.phase==="Stage 1 Playoffs")&&season.stage1){
    return getNextPlayerStageMatch(season.stage1)?.bestOf??3;
  }

  if((season.phase==="Stage 2"||season.phase==="Stage 2 Playoffs")&&season.stage2){
    return getNextPlayerStageMatch(season.stage2)?.bestOf??3;
  }

  if(season.phase==="Champions"&&season.champions){
    return getNextPlayerChampionsMatch(season.champions)?.bestOf??3;
  }

  return 3;
}