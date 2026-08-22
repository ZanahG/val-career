import {useEffect,useState} from "react";

import {AimTrainerMinigame} from "./components/AimTrainerMinigame";
import {CareerDashboard} from "./components/CareerDashboard";
import {CareerProfile} from "./components/CareerProfile";
import {ClutchDefuseMinigame} from "./components/ClutchDefuseMinigame";
import {CommsFilterMinigame} from "./components/CommsFilterMinigame";
import {CreatePlayer} from "./components/CreatePlayer";
import {EconomyDecisionMinigame} from "./components/EconomyDecisionMinigame";
import {MarketWindowScreen} from "./components/MarketWindowScreen";
import {MatchStatsModal} from "./components/MatchStatsModal";
import {OfferScreen} from "./components/OfferScreen";
import {PlayerCardEditor} from "./components/PlayerCardEditor";
import {SeasonDashboard} from "./components/SeasonDashboard";
import {SeasonRecap} from "./components/SeasonRecap";
import {TiltControlMinigame} from "./components/TiltControlMinigame";
import {VCTDashboard} from "./components/VCTDashboard";
import {VCTOffseasonMoves} from "./components/VCTOffseasonMoves";
import {VCTSeasonRecap} from "./components/VCTSeasonRecap";
import {WarmupSequenceMinigame} from "./components/WarmupSequenceMinigame";
import {PlantTimingMinigame} from "./components/PlantTimingMinigame";
import {VCTLeaderboard} from "./components/VCTLeaderboard";
import {getPlayerBanner,getPlayerTitle,isPlayerBannerUnlocked,isPlayerTitleUnlocked} from "./data/cosmetics";
import {getEventById,getRandomCareerStartEventId} from "./data/events";
import {generateMidseasonOffers,generateOffers,generateRenewalOffer} from "./data/offers";
import {getTeamById} from "./data/teams";
import {createInitialVCTRosterState} from "./data/vctPlayers";
import type {VCTNarrativeChoice} from "./data/vctEvents";
import {rollVCTMinigame} from "./data/vctMinigames";
import type {VCTMinigameType} from "./data/vctMinigames";

import {createMatchBoxScore} from "./logic/matchBoxScore";
import {createSeason,getSortedStandings,playNextMatch} from "./logic/season";
import {simulateVCTOffseason} from "./logic/vctRosterMarket";
import {continueVCTAfterNarrativeEvent,createVCTSeason,getVCTSeasonStats,migrateVCTMastersState,migrateVCTStageState,playNextVCTMatch,resumeVCTAfterMidseasonMarket} from "./logic/vctSeason";

import type {CareerChoice,CareerEffects,CareerHistoryEntry,CareerPlayer,ContractOffer} from "./types/career";
import type {MatchBoxScore} from "./types/matchStats";
import type {SeasonState} from "./types/season";
import type {PlayableVCTPhase,VCTSeasonState} from "./types/vct";
import type {VCTRosterState} from "./types/vctRosters";

import {applyOffseasonRegression,applyPlayerStatChange} from "./utils/playerStatsProgression";
import {deleteCareerSave,hasCareerSave,loadCareer,saveCareer} from "./utils/saveGame";

type GameScreen = "create"|"career"|"offers"|"season"|"vct"|"recap"|"vctRecap"|"profile"|"market"|"vctOffseason"|"leaderboard";
type ProfileReturnScreen = "career"|"season"|"vct"|"recap"|"vctRecap";
type MarketWindow = "midseason"|"offseason"|null;

const MAX_INITIAL_CAREER_EVENTS = 5;
const INTRO_EVENT_COUNT_STORAGE_KEY = "tu-carrera-valorant:intro-events-played";
const MAX_CAREER_SEASON = 2032;

const clamp = (value:number) => Math.max(0,Math.min(100,value));

const loadIntroEventCount = () => {
  const stored = Number(window.localStorage.getItem(INTRO_EVENT_COUNT_STORAGE_KEY));
  return Number.isFinite(stored) && stored >= 0 ? stored : 0;
};

function applyEffects(player:CareerPlayer,effects:CareerEffects):CareerPlayer {
  return {
    ...player,
    stats:{
      aim:applyPlayerStatChange(player.stats.aim,effects.aim ?? 0),
      gameSense:applyPlayerStatChange(player.stats.gameSense,effects.gameSense ?? 0),
      communication:applyPlayerStatChange(player.stats.communication,effects.communication ?? 0),
      clutch:applyPlayerStatChange(player.stats.clutch,effects.clutch ?? 0),
      consistency:applyPlayerStatChange(player.stats.consistency,effects.consistency ?? 0),
      mental:applyPlayerStatChange(player.stats.mental,effects.mental ?? 0),
    },
    reputationStats:{
      reputation:clamp(player.reputationStats.reputation + (effects.reputation ?? 0)),
      popularity:clamp(player.reputationStats.popularity + (effects.popularity ?? 0)),
      professionalism:clamp(player.reputationStats.professionalism + (effects.professionalism ?? 0)),
      teamwork:clamp(player.reputationStats.teamwork + (effects.teamwork ?? 0)),
      toxicity:clamp(player.reputationStats.toxicity + (effects.toxicity ?? 0)),
    },
    followers:Math.max(0,player.followers + (effects.followers ?? 0)),
    earnings:Math.max(0,player.earnings + (effects.earnings ?? 0)),
    careerPoints:Math.max(0,player.careerPoints + (effects.careerPoints ?? 0)),
    currentTeam:effects.currentTeam ?? player.currentTeam,
    currentStage:effects.currentStage ?? player.currentStage,
  };
}

function normalizePlayerCosmetics(player:CareerPlayer):CareerPlayer {
  return {
    ...player,
    equippedBannerId:player.equippedBannerId ?? "rookie",
    equippedTitleId:player.equippedTitleId ?? "unknown-prospect",
    unlockedBannerIds:player.unlockedBannerIds?.length ? player.unlockedBannerIds : ["rookie"],
    unlockedTitleIds:player.unlockedTitleIds?.length ? player.unlockedTitleIds : ["unknown-prospect"],
  };
}

export default function App() {
  const [player,setPlayer] = useState<CareerPlayer|null>(null);
  const [screen,setScreen] = useState<GameScreen>("create");
  const [profileReturnScreen,setProfileReturnScreen] = useState<ProfileReturnScreen>("career");
  const [currentEventId,setCurrentEventId] = useState("");
  const [introEventsPlayed,setIntroEventsPlayed] = useState(loadIntroEventCount);
  const [season,setSeason] = useState<SeasonState|null>(null);
  const [vctSeason,setVCTSeason] = useState<VCTSeasonState|null>(null);
  const [vctRosters,setVCTRosters] = useState<VCTRosterState|undefined>(undefined);
  const [matchBoxScore,setMatchBoxScore] = useState<MatchBoxScore|null>(null);
  const [playerCardEditorOpen,setPlayerCardEditorOpen] = useState(false);
  const [saveAvailable,setSaveAvailable] = useState(() => hasCareerSave());

  const [activeMinigame,setActiveMinigame] = useState<VCTMinigameType|null>(null);
  const [queuedMinigame,setQueuedMinigame] = useState<VCTMinigameType|null>(null);
  const [lastVCTMinigame,setLastVCTMinigame] = useState<VCTMinigameType|null>(null);
  const [vctMinigameCooldown,setVCTMinigameCooldown] = useState(0);

  const [marketWindow,setMarketWindow] = useState<MarketWindow>(null);
  const [marketOffers,setMarketOffers] = useState<ContractOffer[]>([]);
  const [renewalOffer,setRenewalOffer] = useState<ContractOffer|null>(null);

  const currentEvent = getEventById(currentEventId);
  const initialCareerEventsComplete = !currentEvent;
  const hasActiveSeason = Boolean(season || vctSeason);
  const canOpenOffers = initialCareerEventsComplete && !hasActiveSeason && !player?.currentTeamId;

  useEffect(() => {
    window.localStorage.setItem(INTRO_EVENT_COUNT_STORAGE_KEY,String(introEventsPlayed));
  },[introEventsPlayed]);

  useEffect(() => {
    if (!player || screen === "create" || screen === "profile") return;

    saveCareer({
      version:1,
      player,
      screen,
      currentEventId,
      season,
      vctSeason,
      marketWindow,
      marketOffers,
      savedAt:Date.now(),
      renewalOffer,
      vctRosters,
    });

    setSaveAvailable(true);
  },[player,screen,currentEventId,season,vctSeason,marketWindow,marketOffers,renewalOffer,vctRosters]);

  useEffect(() => {
    const debugWindow = window as typeof window & {spawnMinigame?:(type:VCTMinigameType) => void};

    debugWindow.spawnMinigame = (type) => {
      setQueuedMinigame(null);
      setActiveMinigame(type);
    };

    return () => {
      delete debugWindow.spawnMinigame;
    };
  },[]);

  useEffect(() => {
    if (!player || !vctSeason || screen !== "vct") return;

    let migrated = migrateVCTStageState(player,vctSeason);
    migrated = migrateVCTMastersState(player,migrated);

    if (migrated !== vctSeason) setVCTSeason(migrated);
  },[player,vctSeason,screen]);

  const resetMinigameState = () => {
    setActiveMinigame(null);
    setQueuedMinigame(null);
    setLastVCTMinigame(null);
    setVCTMinigameCooldown(0);
  };

  const ensureVCTRosters = (seasonNumber:number) => {
    if (vctRosters) return vctRosters;

    const initial = createInitialVCTRosterState(seasonNumber);
    setVCTRosters(initial);
    return initial;
  };

  const stayWithCurrentTeam = () => {
    if (!player || !vctSeason || marketWindow !== "midseason") return;

    setVCTSeason(resumeVCTAfterMidseasonMarket(player,vctSeason));
    setMarketWindow(null);
    setMarketOffers([]);
    setScreen("vct");
  };

  const exploreMarketOffers = () => {
    if (!player || !marketWindow) return;

    if (!marketOffers.length) {
      setMarketOffers(marketWindow === "midseason" ? generateMidseasonOffers(player) : generateOffers(player));
    }

    setScreen("offers");
  };

  const returnToMarket = () => {
    if (!marketWindow) return;
    setScreen("market");
  };

  const continueAfterVCTOffseason = () => {
    setScreen("market");
  };

  const handleCreate = (createdPlayer:CareerPlayer) => {
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

  const handleChoice = (choice:CareerChoice) => {
    if (!player) return;

    const updatedPlayer = applyEffects(player,choice.effects);
    const nextCount = introEventsPlayed + 1;
    const reachedLimit = nextCount >= MAX_INITIAL_CAREER_EVENTS;
    const chainFinished = !choice.nextEventId;

    setPlayer(updatedPlayer);
    setIntroEventsPlayed(nextCount);

    if (reachedLimit || chainFinished) {
      setCurrentEventId("");
      setScreen("offers");
      return;
    }

    setCurrentEventId(choice.nextEventId ?? "");
  };

  const openOffers = () => {
    if (!canOpenOffers) return;
    setScreen("offers");
  };

  const resumeCompetition = () => {
    if (vctSeason && player?.currentStage === "VCT") {
      setScreen("vct");
      return;
    }

    if (season) setScreen("season");
  };

  const openProfile = (returnScreen:ProfileReturnScreen) => {
    setProfileReturnScreen(returnScreen);
    setScreen("profile");
  };

  const openLeaderboard = () => {
    setScreen("leaderboard");
  };

  const closeLeaderboard = () => {
    setScreen("vct");
  };

  const closeProfile = () => setScreen(profileReturnScreen);

  const equipPlayerBanner = (id:string) => {
    if (!player) return;

    const banner = getPlayerBanner(id);
    if (!banner || !isPlayerBannerUnlocked(banner,player)) return;

    setPlayer({...player,equippedBannerId:id});
  };

  const equipPlayerTitle = (id:string) => {
    if (!player) return;

    const title = getPlayerTitle(id);
    if (!title || !isPlayerTitleUnlocked(title,player)) return;

    setPlayer({...player,equippedTitleId:id});
  };

  const acceptOffer = (offer:ContractOffer) => {
    if (!player) return;

    const team = getTeamById(offer.teamId);
    if (!team) return;

    const updatedPlayer:CareerPlayer = {
      ...player,
      currentTeamId:team.id,
      currentTeam:team.name,
      currentStage:team.tier === 1 ? "VCT" : "Tier 2",
      rosterRole:offer.rosterRole,
      salary:offer.salary,
      contractSeasonsRemaining:offer.duration,
      earnings:player.earnings + offer.signingBonus,
    };

    if (marketWindow === "midseason" && vctSeason) {
      if (team.tier !== 1) return;

      ensureVCTRosters(updatedPlayer.season);

      const updatedVCTSeason = resumeVCTAfterMidseasonMarket(updatedPlayer,vctSeason);

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

    if (marketWindow === "offseason") {
      const nextSeasonPlayer:CareerPlayer = {
        ...updatedPlayer,
        season:player.season + 1,
        age:player.age + 1,
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

      if (team.tier === 1) {
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

    if (team.tier === 1) {
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

  const handleVCTNarrativeChoice = (choice:VCTNarrativeChoice) => {
    if (!player || !vctSeason?.pendingEvent) return;

    setPlayer(applyEffects(player,choice.effects));
    setVCTSeason(continueVCTAfterNarrativeEvent(vctSeason));
  };

  const handleMinigameComplete = (effects:CareerEffects) => {
    if (!player || !activeMinigame) return;

    setPlayer(applyEffects(player,effects));
    setActiveMinigame(null);
  };

  const skipMinigame = () => {
    setActiveMinigame(null);
    setQueuedMinigame(null);
  };

  const closeMatchBoxScore = () => {
    setMatchBoxScore(null);

    if (!queuedMinigame) return;

    setActiveMinigame(queuedMinigame);
    setQueuedMinigame(null);
  };

  const handlePlayMatch = () => {
    if (!player || !season) return;

    const previousRegularMatches = season.playedMatches.length;
    const previousAscensionMatches = season.ascensionMatches.length;
    const updatedSeason = playNextMatch(player,season);

    const newRegularMatch = updatedSeason.playedMatches.length > previousRegularMatches ? updatedSeason.playedMatches.at(-1) : undefined;
    const newAscensionMatch = updatedSeason.ascensionMatches.length > previousAscensionMatches ? updatedSeason.ascensionMatches.at(-1) : undefined;
    const result = newAscensionMatch ?? newRegularMatch;

    if (result) {
      const boxScore = createMatchBoxScore(player,result);
      if (boxScore) setMatchBoxScore(boxScore);

      setPlayer({
        ...player,
        stats:{
          ...player.stats,
          mental:applyPlayerStatChange(player.stats.mental,result.won ? 1 : -1),
          consistency:applyPlayerStatChange(player.stats.consistency,result.playerRating >= 1.05 ? 1 : result.playerRating < .8 ? -1 : 0),
        },
      });
    }

    setSeason(updatedSeason);
  };

  const handleFinishSeason = () => {
    if (!player || !season) return;

    const team = getTeamById(player.currentTeamId);
    const standings = getSortedStandings(season.standings);
    const placement = standings.findIndex((row) => row.teamId === player.currentTeamId) + 1;
    const regularWins = season.playedMatches.filter((match) => match.won).length;
    const regularLosses = season.playedMatches.length - regularWins;
    const ascensionWins = season.ascensionMatches.filter((match) => match.won).length;
    const ascensionLosses = season.ascensionMatches.length - ascensionWins;
    const trophies:string[] = [];

    if (team?.tier === 2 && placement === 1) trophies.push(`${player.season} Challengers ${team.marketRegion} Champion`);
    if (season.ascensionWon) trophies.push(`${player.season} ${team?.circuit ?? ""} Ascension Winner`);

    const historyEntry:CareerHistoryEntry = {
      season:player.season,
      teamId:player.currentTeamId ?? "free-agent",
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

    const finishedPlayer:CareerPlayer = {
      ...player,
      vctEligible:player.vctEligible || season.ascensionWon,
      earnings:player.earnings + player.salary * 12,
      history:[...player.history,historyEntry],
      trophies:[...player.trophies,...trophies],
    };

    setPlayer(finishedPlayer);

    if (player.season >= MAX_CAREER_SEASON) {
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

  const continueCareer = () => {
    if (!player) return;

    if (player.season >= MAX_CAREER_SEASON) {
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

    if (season?.ascensionWon && player.currentStage === "Tier 2") {
      const updatedPlayer:CareerPlayer = {
        ...player,
        season:player.season + 1,
        age:player.age + 1,
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

    const seasonsRemaining = Math.max(0,player.contractSeasonsRemaining - 1);

    const updatedPlayer:CareerPlayer = {
      ...player,
      season:player.season + 1,
      age:player.age + 1,
      contractSeasonsRemaining:seasonsRemaining,
      stats:applyOffseasonRegression(player.stats),
    };

    if (seasonsRemaining > 0 && updatedPlayer.currentTeamId) {
      const team = getTeamById(updatedPlayer.currentTeamId);

      setPlayer(updatedPlayer);

      if (team?.tier === 1) {
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

  const handlePlayVCTMatch = () => {
    if (!player || !vctSeason || vctSeason.phase === "Complete") return;

    const previousPhase = vctSeason.phase as PlayableVCTPhase;
    const previousMatchCount = vctSeason.events[previousPhase].matches.length;
    const updatedSeason = playNextVCTMatch(player,vctSeason);
    const updatedEvent = updatedSeason.events[previousPhase];
    const result = updatedEvent.matches.length > previousMatchCount ? updatedEvent.matches.at(-1) : undefined;

    if (result) {
      const boxScore = createMatchBoxScore(player,result,3,vctRosters);
      if (boxScore) setMatchBoxScore(boxScore);

      setPlayer({
        ...player,
        stats:{
          ...player.stats,
          mental:applyPlayerStatChange(player.stats.mental,result.won ? 1 : -1),
          consistency:applyPlayerStatChange(player.stats.consistency,result.playerRating >= 1.1 ? 1 : result.playerRating < .8 ? -1 : 0),
        },
      });

      if (vctMinigameCooldown > 0) {
        setVCTMinigameCooldown((value) => Math.max(0,value - 1));
      } else {
        const minigame = rollVCTMinigame(previousPhase,lastVCTMinigame ?? undefined);

        if (minigame) {
          setLastVCTMinigame(minigame);
          setVCTMinigameCooldown(5);

          if (boxScore) setQueuedMinigame(minigame);
          else setActiveMinigame(minigame);
        }
      }
    }

    setVCTSeason(updatedSeason);

    if (updatedSeason.marketWindowPending === "midseason") {
      setMarketWindow("midseason");
      setMarketOffers([]);
      setScreen("market");
    }
  };

  const handleFinishVCTSeason = () => {
    if (!player || !vctSeason) return;

    const stats = getVCTSeasonStats(vctSeason);

    const vctEvents = Object.entries(vctSeason.events).map(([name,event]) => ({
      name,
      wins:event.matches.filter((match) => match.won).length,
      losses:event.matches.filter((match) => !match.won).length,
      placement:event.placement,
      status:event.status,
    }));

    const championsPlacement = vctSeason.events.Champions.placement ?? 0;
    const trophies:string[] = [];

    if (vctSeason.events.Kickoff.placement === 1) trophies.push(`${player.season} VCT ${vctSeason.circuit} Kickoff Champion`);
    if (vctSeason.events["Masters 1"].placement === 1) trophies.push(`${player.season} Masters 1 Champion`);
    if (vctSeason.events["Masters 2"].placement === 1) trophies.push(`${player.season} Masters 2 Champion`);
    if (championsPlacement === 1) trophies.push(`${player.season} Valorant World Champion`);

    const championshipPoints = player.currentTeamId ? (vctSeason.championshipPointsByTeam[player.currentTeamId] ?? 0) : 0;

    const historyEntry:CareerHistoryEntry = {
      season:player.season,
      teamId:player.currentTeamId ?? "free-agent",
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

    const finishedPlayer:CareerPlayer = {
      ...player,
      earnings:player.earnings + player.salary * 12,
      history:[...player.history,historyEntry],
      trophies:[...player.trophies,...trophies],
    };

    setPlayer(finishedPlayer);
    setMatchBoxScore(null);
    setPlayerCardEditorOpen(false);
    resetMinigameState();

    if (player.season >= MAX_CAREER_SEASON) {
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

  const continueVCTCareer = () => {
    if (!player) return;

    if (player.season >= MAX_CAREER_SEASON) {
      setSeason(null);
      setVCTSeason(null);
      setMarketWindow(null);
      setMarketOffers([]);
      setRenewalOffer(null);
      setProfileReturnScreen("career");
      setScreen("profile");
      return;
    }

    const nextSeason = player.season + 1;

    if (vctRosters) {
      const updatedRosters = simulateVCTOffseason(vctRosters,nextSeason);
      setVCTRosters(updatedRosters);
    }

    resetMinigameState();
    setMarketWindow("offseason");
    setMarketOffers([]);
    setRenewalOffer(generateRenewalOffer(player));
    setScreen("vctOffseason");
  };

  const acceptRenewal = () => {
    if (!player || !renewalOffer || marketWindow !== "offseason") return;

    const team = getTeamById(renewalOffer.teamId);
    if (!team) return;

    const updatedPlayer:CareerPlayer = {
      ...player,
      season:player.season + 1,
      age:player.age + 1,
      stats:applyOffseasonRegression(player.stats),
      currentTeamId:team.id,
      currentTeam:team.name,
      currentStage:team.tier === 1 ? "VCT" : "Tier 2",
      rosterRole:renewalOffer.rosterRole,
      salary:renewalOffer.salary,
      contractSeasonsRemaining:renewalOffer.duration,
      earnings:player.earnings + renewalOffer.signingBonus,
    };

    setPlayer(updatedPlayer);
    setSeason(null);
    setMarketWindow(null);
    setMarketOffers([]);
    setRenewalOffer(null);
    setMatchBoxScore(null);
    setPlayerCardEditorOpen(false);
    resetMinigameState();

    if (team.tier === 1) {
      ensureVCTRosters(updatedPlayer.season);
      setVCTSeason(createVCTSeason(updatedPlayer));
      setScreen("vct");
      return;
    }

    setVCTSeason(null);
    setSeason(createSeason(updatedPlayer));
    setScreen("season");
  };

  const continueSavedCareer = () => {
    const save = loadCareer();
    if (!save) return;

    const normalizedPlayer = normalizePlayerCosmetics(save.player);
    const restoredMarketWindow:MarketWindow = save.marketWindow ?? save.vctSeason?.marketWindowPending ?? null;
    const restoredRenewalOffer = save.renewalOffer ?? (restoredMarketWindow === "offseason" ? generateRenewalOffer(normalizedPlayer) : null);

    let restoredMarketOffers = save.marketOffers ?? [];

    if (save.screen === "offers" && restoredMarketWindow && !restoredMarketOffers.length) {
      restoredMarketOffers = restoredMarketWindow === "midseason" ? generateMidseasonOffers(normalizedPlayer) : generateOffers(normalizedPlayer);
    }

    const restoredVCTRosters = save.vctRosters ?? (normalizedPlayer.currentStage === "VCT" ? createInitialVCTRosterState(normalizedPlayer.season) : undefined);

    setRenewalOffer(restoredRenewalOffer);
    setPlayer(normalizedPlayer);
    setCurrentEventId(save.currentEventId);
    setIntroEventsPlayed(loadIntroEventCount());
    setSeason(save.season ?? null);
    setVCTSeason(save.vctSeason ?? null);
    setVCTRosters(restoredVCTRosters);
    setMarketWindow(restoredMarketWindow);
    setMarketOffers(restoredMarketOffers);
    setMatchBoxScore(null);
    setPlayerCardEditorOpen(false);
    resetMinigameState();
    setScreen(save.screen);
  };

  const resetCareer = () => {
    deleteCareerSave();
    window.localStorage.removeItem(INTRO_EVENT_COUNT_STORAGE_KEY);

    setSaveAvailable(false);
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

  const renderScreen = () => {
    if (!player || screen === "create") return <CreatePlayer onCreate={handleCreate} onContinue={continueSavedCareer} hasSave={saveAvailable} />;

    if (screen === "profile") return <CareerProfile player={player} onBack={closeProfile} onEditPlayerCard={() => setPlayerCardEditorOpen(true)} />;

    if (screen === "vctOffseason" && vctRosters) {
      return <VCTOffseasonMoves season={player.season + 1} transfers={vctRosters.transfers ?? []} onContinue={continueAfterVCTOffseason} />;
    }

    if (screen === "market" && marketWindow) return <MarketWindowScreen player={player} type={marketWindow} renewalOffer={renewalOffer} onStay={stayWithCurrentTeam} onRenew={acceptRenewal} onExploreOffers={exploreMarketOffers} />;

    if (screen === "offers") {
      const offers = marketWindow ? marketOffers : generateOffers(player);
      return <OfferScreen player={player} offers={offers} onAccept={acceptOffer} onBack={marketWindow ? returnToMarket : undefined} />;
    }

    if (screen === "leaderboard" && vctRosters) {
      return <VCTLeaderboard player={player} rosters={vctRosters} onBack={closeLeaderboard} />;
    }

    if (screen === "vct" && vctSeason) return <VCTDashboard player={player} season={vctSeason} onPlayMatch={handlePlayVCTMatch} onFinishSeason={handleFinishVCTSeason} onOpenProfile={() => openProfile("vct")} onOpenLeaderboard={openLeaderboard} onChooseEvent={handleVCTNarrativeChoice} onUpdatePlayer={setPlayer} />;

    if (screen === "season" && season) return <SeasonDashboard player={player} season={season} onPlayMatch={handlePlayMatch} onFinishSeason={handleFinishSeason} onOpenProfile={() => openProfile("season")} onGoHome={() => setScreen("career")} onUpdatePlayer={setPlayer} />;

    if (screen === "recap" && season) return <SeasonRecap player={player} season={season} onContinue={continueCareer} />;

    if (screen === "vctRecap" && vctSeason) return <VCTSeasonRecap player={player} season={vctSeason} onContinue={continueVCTCareer} />;

    return <CareerDashboard player={player} event={currentEvent} onChoose={handleChoice} onReset={resetCareer} onOpenOffers={openOffers} onOpenProfile={() => openProfile("career")} onEditPlayerCard={() => setPlayerCardEditorOpen(true)} canOpenOffers={canOpenOffers} hasActiveSeason={hasActiveSeason} onResumeSeason={resumeCompetition} onUpdatePlayer={setPlayer} />;
  };

  return (
    <>
      {renderScreen()}

      {activeMinigame === "clutch-defuse" && <ClutchDefuseMinigame onComplete={handleMinigameComplete} onSkip={skipMinigame} />}
      {activeMinigame === "aim-trainer" && <AimTrainerMinigame onComplete={handleMinigameComplete} onSkip={skipMinigame} />}
      {activeMinigame === "economy-decision" && <EconomyDecisionMinigame onComplete={handleMinigameComplete} onSkip={skipMinigame} />}
      {activeMinigame === "comms-filter" && <CommsFilterMinigame onComplete={handleMinigameComplete} onSkip={skipMinigame} />}
      {activeMinigame === "warmup-sequence" && <WarmupSequenceMinigame onComplete={handleMinigameComplete} onSkip={skipMinigame} />}
      {activeMinigame === "tilt-control" && <TiltControlMinigame onComplete={handleMinigameComplete} onSkip={skipMinigame} />}
      {activeMinigame === "plant-timing" && <PlantTimingMinigame onComplete={handleMinigameComplete} onSkip={skipMinigame} />}

      {matchBoxScore && <MatchStatsModal match={matchBoxScore} playerTeamId={player?.currentTeamId} onClose={closeMatchBoxScore} />}

      {player && playerCardEditorOpen && <PlayerCardEditor player={player} onEquipBanner={equipPlayerBanner} onEquipTitle={equipPlayerTitle} onClose={() => setPlayerCardEditorOpen(false)} />}
    </>
  );
}