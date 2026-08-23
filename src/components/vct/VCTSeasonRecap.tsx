import type {CareerPlayer} from "../../types/career";
import type {VCTSeasonState} from "../../types/vct";
import {VCT_EVENT_ORDER, getVCTSeasonDefinition} from "../../data/vctSeasons";
import {getTeamById} from "../../data/teams";
import {getVCTSeasonStats} from "../../logic/vctSeason";
import {GameSettingsControls} from "../shared/GameSettingsControls";
import {useGameSettings} from "../../context/GameSettingsContext";
import {formatCurrency} from "../../utils/currency";
import "../../styles/VCTSeasonRecap.css";

interface VCTSeasonRecapProps {
  player: CareerPlayer;
  season: VCTSeasonState;
  onContinue: () => void;
}

export function VCTSeasonRecap({player, season, onContinue}: VCTSeasonRecapProps) {
  const {language, currency} = useGameSettings();
  const team = getTeamById(player.currentTeamId);
  const definition = getVCTSeasonDefinition(season.season);
  const stats = getVCTSeasonStats(season);
  const champions = season.events.Champions;
  const championsPlayed = champions.matches.length > 0;
  const championsPlacement = champions.placement;

  return (
    <main className="vct-recap-screen">
      <header className="vct-recap-topbar">
        <div>
          <div className="brand-mark brand-mark--small">TCV</div>
          <div><strong>VCT {season.circuit} {season.season}</strong><span>{team?.name}</span></div>
        </div>

        <GameSettingsControls />
      </header>

      <section className="vct-recap-content">
        <header className="vct-recap-heading">
          <span className="eyebrow">{language === "es" ? "TEMPORADA PROFESIONAL COMPLETADA" : "PRO SEASON COMPLETE"}</span>
          <h1>{season.circuit} {season.season}</h1>
          <p>{player.nickname}</p>
        </header>

        <section className="vct-recap-summary">
          <div><span>CHAMPIONSHIP POINTS</span><strong>{player.currentTeamId ? (season.championshipPointsByTeam[player.currentTeamId] ?? 0) : 0}</strong></div>
          <div><span>{language === "es" ? "RÉCORD" : "RECORD"}</span><strong>{stats.wins}-{stats.losses}</strong></div>
          <div><span>AVG RATING</span><strong>{stats.averageRating.toFixed(2)}</strong></div>
          <div><span>AVG ACS</span><strong>{stats.averageACS}</strong></div>
          <div><span>K / D</span><strong>{stats.kd.toFixed(2)}</strong></div>
          <div><span>{language === "es" ? "GANADO ESTA TEMPORADA" : "SEASON EARNINGS"}</span><strong>{formatCurrency(player.salary * 12, currency)}</strong></div>
        </section>

        <section className="vct-recap-events">
          {VCT_EVENT_ORDER.map((phase) => {
            const event = season.events[phase];
            const wins = event.matches.filter((match) => match.won).length;
            const losses = event.matches.length - wins;

            return (
              <article key={phase} className={`vct-recap-event vct-recap-event--${event.status.toLowerCase()}`}>
                <span>{event.status.toUpperCase()}</span>
                <strong>{getEventName(phase, definition)}</strong>

                {event.matches.length > 0 ? (
                  <div>
                    <b>{wins}-{losses}</b>
                    {event.placement && <em>#{event.placement}</em>}
                  </div>
                ) : (
                  <small>—</small>
                )}

                {event.championshipPointsEarned > 0 && <p>+{event.championshipPointsEarned} CP</p>}
              </article>
            );
          })}
        </section>

        <footer className="vct-recap-footer">
          <div>
            <span></span>
            <strong></strong>
          </div>

          <button className="primary-button" onClick={onContinue}>{language === "es" ? "CONTINUAR CARRERA" : "CONTINUE CAREER"} <span>→</span></button>
        </footer>
      </section>
    </main>
  );
}

function getEventName(phase: string, definition: ReturnType<typeof getVCTSeasonDefinition>) {
  if (phase === "Masters 1") return definition.masters1.name;
  if (phase === "Masters 2") return definition.masters2.name;
  if (phase === "Champions") return definition.champions.name;
  return phase;
}