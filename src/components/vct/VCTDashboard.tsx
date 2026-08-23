import type {CareerPlayer} from "../../types/career";
import type {VCTPhase,VCTSeasonState} from "../../types/vct";
import {VCT_EVENT_ORDER,getVCTSeasonDefinition} from "../../data/vctSeasons";
import {getTeamById} from "../../data/teams";
import {getTeamLogo} from "../../utils/teamLogo";
import {getVCTSeasonStats} from "../../logic/vctSeason";
import {getNextPlayerStageBracketMatch,getNextPlayerStageGroupMatch} from "../../logic/stageFormat";
import {getNextPlayerMastersBracketMatch,getNextPlayerMastersSwissMatch} from "../../logic/mastersFormat";
import {getNextPlayerChampionsBracketMatch,getNextPlayerChampionsGroupMatch} from "../../logic/championsFormat";
import {getNextPlayerKickoffMatch} from "../../logic/kickoffBracket";
import {GameSettingsControls} from "../shared/GameSettingsControls";
import {useGameSettings} from "../../context/GameSettingsContext";
import type {VCTNarrativeChoice} from "../../data/vctEvents";
import {getVCTNarrativeEvent} from "../../data/vctEvents";
import {getEffectLabel,getEffectPreviews} from "../../utils/effectLabels";
import {PlayerCareerSidebar} from "../player/PlayerCareerSidebar";
import {VCTBracket} from "./VCTBracket";
import {VCTStageBracket} from "./VCTStageBracket";
import {VCTStageGroups} from "./VCTStageGroups";
import {VCTMastersSwiss} from "./VCTMastersSwiss";
import {VCTMastersBracket} from "./VCTMastersBracket";
import {VCTMastersQualified} from "./VCTMastersQualified";
import {VCTChampionsGroups} from "./VCTChampionsGroups";
import {VCTChampionsBracket} from "./VCTChampionsBracket";
import {VCTChampionsQualified} from "./VCTChampionsQualified";
import {MatchPlayButton} from "../match/MatchPlayButton";
import "../../styles/VCTDashboard.css";

type PlayableVCTPhase = Exclude<VCTPhase,"Complete">;

interface VCTDashboardProps {
  player:CareerPlayer;
  season:VCTSeasonState;
  onPlayMatch:() => void;
  onFinishSeason:() => void;
  onOpenProfile:() => void;
  onOpenLeaderboard:() => void;
  onChooseEvent:(choice:VCTNarrativeChoice) => void;
  onUpdatePlayer:(player:CareerPlayer) => void;
}

export function VCTDashboard({player,season,onPlayMatch,onFinishSeason,onOpenProfile,onOpenLeaderboard,onChooseEvent,onUpdatePlayer}:VCTDashboardProps) {
  const {language,t} = useGameSettings();

  const team = getTeamById(player.currentTeamId);
  const teamLogo = getTeamLogo(team?.logo);
  const definition = getVCTSeasonDefinition(player.season);
  const stats = getVCTSeasonStats(season);

  const finished = season.phase === "Complete";
  const activePhase:PlayableVCTPhase | null = finished ? null : season.phase as PlayableVCTPhase;
  const activeEvent = activePhase ? season.events[activePhase] : null;

  const kickoffBracket = season.events.Kickoff.bracket;
  const kickoffMatch = season.phase === "Kickoff" && kickoffBracket ? getNextPlayerKickoffMatch(kickoffBracket) : undefined;
  const kickoffOpponentId = kickoffMatch ? (kickoffMatch.teamAId === player.currentTeamId ? kickoffMatch.teamBId : kickoffMatch.teamAId) : undefined;

  const mastersSwissMatch = activeEvent?.masters && player.currentTeamId ? getNextPlayerMastersSwissMatch(activeEvent.masters,player.currentTeamId) : undefined;
  const mastersSwissOpponentId = mastersSwissMatch ? (mastersSwissMatch.teamAId === player.currentTeamId ? mastersSwissMatch.teamBId : mastersSwissMatch.teamAId) : undefined;

  const mastersBracketMatch = activeEvent?.masters?.bracket && player.currentTeamId ? getNextPlayerMastersBracketMatch(activeEvent.masters.bracket,player.currentTeamId) : undefined;
  const mastersBracketOpponentId = mastersBracketMatch ? (mastersBracketMatch.teamAId === player.currentTeamId ? mastersBracketMatch.teamBId : mastersBracketMatch.teamAId) : undefined;

  const championsGroupMatch = activeEvent?.champions && !activeEvent.champions.groups.complete ? getNextPlayerChampionsGroupMatch(activeEvent.champions.groups) : undefined;
  const championsGroupOpponentId = championsGroupMatch ? (championsGroupMatch.teamAId === player.currentTeamId ? championsGroupMatch.teamBId : championsGroupMatch.teamAId) : undefined;

  const championsBracketMatch = activeEvent?.champions?.bracket && player.currentTeamId ? getNextPlayerChampionsBracketMatch(activeEvent.champions.bracket,player.currentTeamId) : undefined;
  const championsBracketOpponentId = championsBracketMatch ? (championsBracketMatch.teamAId === player.currentTeamId ? championsBracketMatch.teamBId : championsBracketMatch.teamAId) : undefined;

  const stageGroupMatch = activeEvent?.stageGroups ? getNextPlayerStageGroupMatch(activeEvent.stageGroups) : undefined;
  const stageGroupOpponentId = stageGroupMatch ? (stageGroupMatch.teamAId === player.currentTeamId ? stageGroupMatch.teamBId : stageGroupMatch.teamAId) : undefined;

  const stageBracketMatch = activeEvent?.stageBracket ? getNextPlayerStageBracketMatch(activeEvent.stageBracket) : undefined;
  const stageBracketOpponentId = stageBracketMatch ? (stageBracketMatch.teamAId === player.currentTeamId ? stageBracketMatch.teamBId : stageBracketMatch.teamAId) : undefined;

  const nextOpponentId = kickoffOpponentId ?? mastersSwissOpponentId ?? mastersBracketOpponentId ?? championsGroupOpponentId ?? championsBracketOpponentId ?? stageGroupOpponentId ?? stageBracketOpponentId ?? activeEvent?.schedule[activeEvent.matches.length];
  const nextOpponent = getTeamById(nextOpponentId);
  const nextOpponentLogo = getTeamLogo(nextOpponent?.logo);

  const isMastersPhase = season.phase === "Masters 1" || season.phase === "Masters 2";
  const isMastersDirectSeedWaiting = Boolean(isMastersPhase && activeEvent?.masters && player.currentTeamId && activeEvent.masters.directPlayoffTeamIds.includes(player.currentTeamId) && !activeEvent.masters.bracket);

  const mastersPlayerStanding = isMastersPhase && activeEvent?.masters && player.currentTeamId ? activeEvent.masters.swiss.standings.find((row) => row.teamId === player.currentTeamId) : undefined;
  const isMastersSwissResolved = Boolean(mastersPlayerStanding?.qualified || mastersPlayerStanding?.eliminated);

  const allMatches = Object.values(season.events).flatMap((event) => event.matches);
  const lastMatch = activeEvent?.matches.at(-1) ?? allMatches.at(-1);
  const narrativeEvent = season.pendingEvent ? getVCTNarrativeEvent(season.pendingEvent.eventId) : undefined;

  const championshipPoints = team ? season.championshipPointsByTeam[team.id] ?? 0 : 0;

  const championshipRanking = Object.entries(season.championshipPointsByTeam).sort(([,a],[,b]) => b - a);
  const championshipRank = team ? championshipRanking.findIndex(([teamId]) => teamId === team.id) + 1 : 0;

  const useFloatingPlay = season.phase === "Kickoff" || season.phase === "Masters 1" || season.phase === "Masters 2" || season.phase === "Stage 1" || season.phase === "Stage 1 Playoffs" || season.phase === "Stage 2" || season.phase === "Stage 2 Playoffs" || season.phase === "Champions";

  return (
    <main className="vct-screen">
      <header className="vct-topbar">
        <div className="vct-brand">
          <div className="brand-mark brand-mark--small">TCV</div>
          <div><strong>{team?.name}</strong><span>VCT {season.circuit.toUpperCase()}</span></div>
        </div>

        <div className="vct-topbar__right">
          <nav className="vct-topbar-nav">
            <button className="vct-topbar-nav__button" onClick={onOpenProfile}>
              <span className="vct-topbar-nav__icon">👤</span>
              <span>{language==="es" ? "CARRERA" : "CAREER"}</span>
            </button>

            <button className="vct-topbar-nav__button vct-topbar-nav__button--featured" onClick={onOpenLeaderboard}>
              <span className="vct-topbar-nav__icon"></span>
              <span>{language==="es" ? "CLASIFICACIÓN" : "LEADERBOARD"}</span>
              <small className="vct-topbar-nav__badge">{language==="es" ? "TOP" : "TOP"}</small>
            </button>
          </nav>

          <div className="vct-topbar-settings">
            <GameSettingsControls />
            <div className="vct-year"><span>{t("season")}</span><strong>{player.season}</strong></div>
          </div>
        </div>
      </header>

      <div className="vct-career-layout">
        <PlayerCareerSidebar player={player} language={language} matches={stats.matches} wins={stats.wins} losses={stats.losses} averageRating={stats.averageRating} averageACS={stats.averageACS} kd={stats.kd} onUpdatePlayer={onUpdatePlayer}/>

        <section className="vct-content">
          <header className="vct-heading">
            <div>
              <span className="eyebrow">VALORANT CHAMPIONS TOUR</span>
              <h1>{season.circuit} {season.season}</h1>
              <p>{player.nickname} · {team?.name} · {player.rosterRole}</p>
            </div>

            <div className="vct-points">
              <span>CHAMPIONSHIP POINTS</span>
              <strong>{championshipPoints}</strong>
            </div>
          </header>

          <section className="vct-calendar">
            {VCT_EVENT_ORDER.map((phase) => {
              const event = season.events[phase];
              const location = getEventLocation(phase,definition);
              const wins = event.matches.filter((match) => match.won).length;
              const losses = event.matches.length - wins;

              return (
                <article key={phase} className={`vct-calendar-event vct-calendar-event--${event.status.toLowerCase()}`}>
                  <span>{event.status.toUpperCase()}</span>
                  <strong>{getEventName(phase,definition)}</strong>
                  <small>{location}</small>
                  {event.matches.length > 0 && <div><b>{wins}-{losses}</b>{event.placement !== undefined && event.placement > 0 && <em>#{event.placement}</em>}</div>}
                </article>
              );
            })}
          </section>

          {season.phase === "Kickoff" && !narrativeEvent && (
            <section className="vct-kickoff-action">
              <div className="vct-kickoff-action__content">
                <span className="eyebrow">{kickoffMatch?.roundName?.toUpperCase() ?? "KICKOFF"}</span>
                <h2>{language === "es" ? "PRÓXIMO PARTIDO" : "NEXT MATCH"}</h2>

                <div className="vct-next-match-teams">
                  <div className="vct-next-match-team">
                    {teamLogo ? <img src={teamLogo} alt={team?.name ?? ""} /> : <span className="vct-next-match-fallback">{team?.shortName ?? "TBD"}</span>}
                    <strong>{team?.name ?? "TBD"}</strong>
                  </div>

                  <span className="vct-next-match-vs">VS</span>

                  <div className="vct-next-match-team">
                    {nextOpponentLogo ? <img src={nextOpponentLogo} alt={nextOpponent?.name ?? ""} /> : <span className="vct-next-match-fallback">{nextOpponent?.shortName ?? "TBD"}</span>}
                    <strong>{nextOpponent?.name ?? "TBD"}</strong>
                  </div>
                </div>
              </div>
            </section>
          )}

          {narrativeEvent && (
            <section className="vct-narrative-event">
              <div className="vct-narrative-event__header"><span className="eyebrow">{narrativeEvent.eyebrow[language]}</span><span>VCT EVENT</span></div>
              <h2>{narrativeEvent.title[language]}</h2>
              <p>{narrativeEvent.description[language]}</p>

              <div className="vct-narrative-choices">
                {narrativeEvent.choices.map((choice,index) => {
                  const effects = getEffectPreviews(choice.effects);

                  return (
                    <button key={choice.id} onClick={() => onChooseEvent(choice)}>
                      <span>0{index + 1}</span>
                      <div>
                        <strong>{choice.label[language]}</strong>
                        <p>{choice.description[language]}</p>
                        <div className="vct-choice-effects">{effects.map((effect) => <small key={effect.key} className={effect.direction === "up" ? "vct-effect vct-effect--up" : "vct-effect vct-effect--down"}>{getEffectLabel(effect.key,language)} <b>{effect.direction === "up" ? "↑" : "↓"}</b></small>)}</div>
                      </div>
                      <b className="vct-choice-arrow">→</b>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {season.phase !== "Kickoff" && !narrativeEvent && (
            <div className="vct-layout">
              <section className="vct-main-card">
                <span className="eyebrow">{finished ? (language === "es" ? "TEMPORADA COMPLETADA" : "SEASON COMPLETE") : activePhase?.toUpperCase()}</span>
                <h2>{finished ? (language === "es" ? "La temporada VCT terminó." : "The VCT season is over.") : activePhase ? getEventName(activePhase,definition) : ""}</h2>

                {!finished && nextOpponent && (
                  <div className="vct-next-match-teams vct-next-match-teams--compact">
                    <div className="vct-next-match-team">
                      {teamLogo ? <img src={teamLogo} alt={team?.name ?? ""} /> : <span className="vct-next-match-fallback">{team?.shortName ?? "TBD"}</span>}
                      <strong>{team?.name ?? "TBD"}</strong>
                    </div>

                    <span className="vct-next-match-vs">VS</span>

                    <div className="vct-next-match-team">
                      {nextOpponentLogo ? <img src={nextOpponentLogo} alt={nextOpponent?.name ?? ""} /> : <span className="vct-next-match-fallback">{nextOpponent?.shortName ?? "TBD"}</span>}
                      <strong>{nextOpponent?.name ?? "TBD"}</strong>
                    </div>
                  </div>
                )}

                {finished && <p>{language === "es" ? "Revisa los resultados finales de tu temporada profesional." : "Review the final results of your professional season."}</p>}
                {!finished && !season.pendingEvent && !useFloatingPlay && <button className="primary-button" onClick={onPlayMatch}>{language === "es" ? "JUGAR PARTIDO" : "PLAY MATCH"} <span>▶</span></button>}
                {finished && <button className="primary-button" onClick={onFinishSeason}>{language === "es" ? "VER RESUMEN" : "SEASON RECAP"} <span>→</span></button>}
              </section>

              <aside className="vct-stats">
                <div><span>{language === "es" ? "PARTIDOS" : "MATCHES"}</span><strong>{stats.matches}</strong></div>
                <div><span>W / L</span><strong>{stats.wins}-{stats.losses}</strong></div>
                <div><span>AVG RATING</span><strong>{stats.averageRating.toFixed(2)}</strong></div>
                <div><span>AVG ACS</span><strong>{stats.averageACS}</strong></div>
                <div><span>K / D</span><strong>{stats.kd.toFixed(2)}</strong></div>
              </aside>
            </div>
          )}

          {season.phase === "Kickoff" && !narrativeEvent && (
            <aside className="vct-kickoff-stats">
              <div><span>{language === "es" ? "PARTIDOS" : "MATCHES"}</span><strong>{stats.matches}</strong></div>
              <div><span>W / L</span><strong>{stats.wins}-{stats.losses}</strong></div>
              <div><span>AVG RATING</span><strong>{stats.averageRating.toFixed(2)}</strong></div>
              <div><span>AVG ACS</span><strong>{stats.averageACS}</strong></div>
              <div><span>K / D</span><strong>{stats.kd.toFixed(2)}</strong></div>
            </aside>
          )}

          {!narrativeEvent && (season.phase === "Masters 1" || season.phase === "Masters 2") && activeEvent?.masters && !activeEvent.masters.bracket && <VCTMastersQualified teams={activeEvent.masters.qualifiedTeams} playerTeamId={player.currentTeamId} />}
          {!narrativeEvent && (season.phase === "Masters 1" || season.phase === "Masters 2") && activeEvent?.masters && !activeEvent.masters.bracket && <VCTMastersSwiss swiss={activeEvent.masters.swiss} playerTeamId={player.currentTeamId} />}
          {!narrativeEvent && (season.phase === "Masters 1" || season.phase === "Masters 2") && activeEvent?.masters?.bracket && <VCTMastersBracket bracket={activeEvent.masters.bracket} playerTeamId={player.currentTeamId} />}

          {!narrativeEvent && season.phase === "Champions" && activeEvent?.champions && !activeEvent.champions.bracket && <VCTChampionsQualified teams={activeEvent.champions.qualifiedTeams} playerTeamId={player.currentTeamId} />}
          {!narrativeEvent && season.phase === "Champions" && activeEvent?.champions && !activeEvent.champions.bracket && <VCTChampionsGroups state={activeEvent.champions.groups} playerTeamId={player.currentTeamId} />}
          {!narrativeEvent && season.phase === "Champions" && activeEvent?.champions?.bracket && <VCTChampionsBracket bracket={activeEvent.champions.bracket} playerTeamId={player.currentTeamId} />}

          {!narrativeEvent && (season.phase === "Stage 1" || season.phase === "Stage 2") && activeEvent?.stageGroups && <VCTStageGroups groups={activeEvent.stageGroups} playerTeamId={player.currentTeamId} />}
          {!narrativeEvent && (season.phase === "Stage 1 Playoffs" || season.phase === "Stage 2 Playoffs") && activeEvent?.stageBracket && <VCTStageBracket bracket={activeEvent.stageBracket} playerTeamId={player.currentTeamId} />}

          {!narrativeEvent && season.phase === "Kickoff" && kickoffBracket && (
            <section className="vct-bracket-wrapper">
              <div className="vct-bracket-wrapper__header"><div><span className="eyebrow">KICKOFF</span><h2>{language === "es" ? "BRACKET COMPLETO" : "FULL BRACKET"}</h2></div></div>
              <VCTBracket bracket={kickoffBracket} />
            </section>
          )}
        </section>
      </div>

      {!finished && !narrativeEvent && useFloatingPlay && (nextOpponent || isMastersDirectSeedWaiting || isMastersSwissResolved) && (
        isMastersSwissResolved && !nextOpponent ? (
          <MatchPlayButton language={language} onClick={onPlayMatch} mode="simulate" simulateLabel={language === "es" ? "SIMULAR SWISS" : "SIMULATE SWISS"} />
        ) : (
          <MatchPlayButton opponentName={nextOpponent?.name} opponentShortName={nextOpponent?.shortName} opponentLogo={nextOpponentLogo} language={language} onClick={onPlayMatch} />
        )
      )}
    </main>
  );
}

function getEventName(phase:PlayableVCTPhase,definition:ReturnType<typeof getVCTSeasonDefinition>) {
  if (phase === "Masters 1") return definition.masters1.name;
  if (phase === "Masters 2") return definition.masters2.name;
  if (phase === "Champions") return definition.champions.name;
  return phase;
}

function getEventLocation(phase:PlayableVCTPhase,definition:ReturnType<typeof getVCTSeasonDefinition>) {
  if (phase === "Masters 1") return definition.masters1.location;
  if (phase === "Masters 2") return definition.masters2.location;
  if (phase === "Champions") return definition.champions.location;
  return phase.includes("Stage") || phase === "Kickoff" ? "Regional" : "";
}