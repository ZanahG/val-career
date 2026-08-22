import type {CareerPlayer} from "../types/career";
import type {SeasonState} from "../types/season";
import {GameSettingsControls} from "./GameSettingsControls";
import {useGameSettings} from "../context/GameSettingsContext";
import {getTeamById} from "../data/teams";
import {getPlayerSeasonStats,getSortedStandings} from "../logic/season";
import {getTeamLogo} from "../utils/teamLogo";
import {PlayerCareerSidebar} from "./PlayerCareerSidebar";
import "../styles/SeasonDashboard.css";

interface SeasonDashboardProps {
  player: CareerPlayer;
  season: SeasonState;
  onPlayMatch: () => void;
  onFinishSeason: () => void;
  onOpenProfile: () => void;
  onGoHome: () => void;
  onUpdatePlayer: (player: CareerPlayer) => void;
}

export function SeasonDashboard({player,season,onPlayMatch,onFinishSeason,onOpenProfile,onGoHome,onUpdatePlayer}: SeasonDashboardProps) {
  const {language,t} = useGameSettings();

  const currentTeam = getTeamById(player.currentTeamId);
  const currentTeamLogo = getTeamLogo(currentTeam?.logo);
  const isAscension = season.phase === "Ascension";
  const seasonFinished = season.phase === "Complete";

  const activeMatches = isAscension ? season.ascensionMatches : season.playedMatches;
  const activeSchedule = isAscension ? season.ascensionSchedule : season.schedule;
  const nextOpponentId = activeSchedule[activeMatches.length];
  const nextOpponent = getTeamById(nextOpponentId);
  const nextOpponentLogo = getTeamLogo(nextOpponent?.logo);

  const standings = getSortedStandings(season.standings);
  const seasonStats = getPlayerSeasonStats(season);
  const lastMatch = activeMatches.at(-1) ?? season.playedMatches.at(-1);

  const ascensionWins = season.ascensionMatches.filter((match) => match.won).length;
  const ascensionLosses = season.ascensionMatches.length - ascensionWins;

  return (
    <main className="season-screen">
      <header className="season-topbar">
        <div className="season-topbar__left">
          <button className="season-home-button" onClick={onGoHome} aria-label={language === "es" ? "Volver al inicio" : "Back to home"}>←</button>
          <div className="season-brand">
            <div className="brand-mark brand-mark--small">TCV</div>
            <div><strong>{currentTeam?.name ?? player.currentTeam}</strong><span>{player.rosterRole.toUpperCase()} · {player.role.toUpperCase()}</span></div>
          </div>
        </div>

        <div className="season-topbar__right">
          <button className="secondary-button" onClick={onOpenProfile}>{language === "es" ? "CARRERA" : "CAREER"}</button>
          <GameSettingsControls />
          <div className="season-year"><span>{t("season")}</span><strong>{player.season}</strong></div>
        </div>
      </header>

      <div className="season-layout">
        <PlayerCareerSidebar
          player={player}
          language={language}
          onUpdatePlayer={onUpdatePlayer}
          matches={seasonStats.matches}
          wins={seasonStats.wins}
          losses={seasonStats.losses}
          averageRating={seasonStats.averageRating}
          averageACS={seasonStats.averageACS}
          kd={seasonStats.kd}
        />

        <section className="season-main">
          <section className="season-hero">
            <div className="season-hero__content">
              <span className="eyebrow">{isAscension ? "ASCENSION" : seasonFinished ? (language === "es" ? "TEMPORADA COMPLETADA" : "SEASON COMPLETE") : (language === "es" ? "TEMPORADA REGULAR" : "REGULAR SEASON")}</span>

              <h1>{seasonFinished ? (season.ascensionQualified ? (season.ascensionWon ? (language === "es" ? "Ganaste Ascension." : "Ascension won.") : (language === "es" ? "Ascension terminó." : "Ascension complete.")) : (language === "es" ? "Temporada completada." : "Season complete.")) : isAscension ? (language === "es" ? `Partido ${season.ascensionMatches.length + 1} de Ascension` : `Ascension match ${season.ascensionMatches.length + 1}`) : (language === "es" ? `Semana ${season.playedMatches.length + 1}` : `Week ${season.playedMatches.length + 1}`)}</h1>

              {!seasonFinished && (
                <div className="season-next-match">
                  <div className="season-next-team">{currentTeamLogo ? <img src={currentTeamLogo} alt={currentTeam?.name ?? ""} /> : <span>{currentTeam?.shortName ?? "TBD"}</span>}</div>
                  <strong>VS</strong>
                  <div className="season-next-team">{nextOpponentLogo ? <img src={nextOpponentLogo} alt={nextOpponent?.name ?? ""} /> : <span>{nextOpponent?.shortName ?? "TBD"}</span>}</div>
                </div>
              )}

              {seasonFinished && (
                <p>{season.ascensionWon ? (language === "es" ? "Ganaste Ascension y desbloqueaste el mercado de equipos VCT." : "You won Ascension and unlocked the VCT market.") : season.ascensionQualified ? (language === "es" ? "Tu participación en Ascension terminó. Revisa tu temporada y continúa tu carrera." : "Your Ascension run is over. Review your season and continue your career.") : (language === "es" ? "La temporada terminó. Revisa tu posición final y continúa al resumen." : "The season is over. Review your final position and continue to the recap.")}</p>
              )}
            </div>

            {seasonFinished && <button className="primary-button" onClick={onFinishSeason}>{language === "es" ? "VER RESUMEN" : "SEASON RECAP"}<span>→</span></button>}
          </section>

          {isAscension && (
            <div className="ascension-banner">
              <span>ASCENSION</span>
              <strong>{language === "es" ? "Tu oportunidad de llegar al VCT" : "Your opportunity to reach VCT"}</strong>
              <p>{language === "es" ? `Gana al menos 2 de los 3 partidos para desbloquear ofertas Tier 1. Récord actual: ${ascensionWins}-${ascensionLosses}.` : `Win at least 2 of 3 matches to unlock Tier 1 offers. Current record: ${ascensionWins}-${ascensionLosses}.`}</p>
            </div>
          )}

          {seasonFinished && season.ascensionQualified && (
            <div className={season.ascensionWon ? "ascension-result ascension-result--win" : "ascension-result ascension-result--loss"}>
              <span>{season.ascensionWon ? "ASCENSION WON" : "ASCENSION LOST"}</span>
              <strong>{season.ascensionWon ? (language === "es" ? "¡Tu camino hacia VCT está abierto!" : "Your path to VCT is open!") : (language === "es" ? "Tendrás que volver a intentarlo la próxima temporada." : "You'll have to try again next season.")}</strong>
              <p>{season.ascensionWon ? (language === "es" ? "Al continuar tu carrera entrarás al mercado con posibilidad de recibir ofertas Tier 1." : "When you continue your career, you'll enter the market with access to Tier 1 offers.") : (language === "es" ? `Terminaste Ascension con récord ${ascensionWins}-${ascensionLosses}.` : `You finished Ascension with a ${ascensionWins}-${ascensionLosses} record.`)}</p>
            </div>
          )}

          {lastMatch && (
            <section className="last-match-card">
              <div className="last-match-result">
                <span className={lastMatch.won ? "match-status match-status--win" : "match-status match-status--loss"}>{lastMatch.won ? (language === "es" ? "VICTORIA" : "VICTORY") : (language === "es" ? "DERROTA" : "DEFEAT")}</span>

                {(() => {
                  const opponent = getTeamById(lastMatch.opponentId);
                  const logo = getTeamLogo(opponent?.logo);
                  return <div className="last-match-opponent">{logo && <img src={logo} alt={opponent?.name ?? ""} />}<h3>vs {opponent?.name ?? "TBD"}</h3></div>;
                })()}

                <p>{lastMatch.summary}</p>
              </div>

              <div className="last-match-score"><strong>{lastMatch.scoreFor}</strong><span>:</span><strong>{lastMatch.scoreAgainst}</strong></div>

              <div className="last-match-stats">
                <div><span>RATING</span><strong>{lastMatch.playerRating}</strong></div>
                <div><span>ACS</span><strong>{lastMatch.acs}</strong></div>
                <div><span>K / D / A</span><strong>{lastMatch.kills} / {lastMatch.deaths} / {lastMatch.assists}</strong></div>
              </div>
            </section>
          )}

          <div className="season-panels">
            <section className="season-panel">
              <div className="season-panel__title"><span>{language === "es" ? "CLASIFICACIÓN CHALLENGERS" : "CHALLENGERS STANDINGS"}</span><strong>{standings.length} {language === "es" ? "EQUIPOS" : "TEAMS"}</strong></div>

              <div className="standings-list">
                {standings.map((row,index) => {
                  const team = getTeamById(row.teamId);
                  const isCurrentTeam = row.teamId === player.currentTeamId;
                  const roundDiff = row.roundsWon - row.roundsLost;
                  const logo = getTeamLogo(team?.logo);

                  return (
                    <div key={row.teamId} className={isCurrentTeam ? "standing-row standing-row--current" : "standing-row"}>
                      <span className="standing-position">{index + 1}</span>
                      <div className="standing-team">{logo && <img src={logo} alt={team?.name ?? ""} />}<strong>{team?.shortName ?? row.teamId}</strong></div>
                      <span>{row.wins}W</span>
                      <span>{row.losses}L</span>
                      <span className={roundDiff >= 0 ? "standing-positive" : "standing-negative"}>{roundDiff >= 0 ? "+" : ""}{roundDiff}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="season-panel">
              <div className="season-panel__title"><span>{isAscension ? "ASCENSION" : language === "es" ? "RESULTADOS" : "RESULTS"}</span><strong>{activeMatches.length}/{activeSchedule.length}</strong></div>

              <div className="season-results">
                {activeMatches.length === 0 && <p className="season-empty">{language === "es" ? "Todavía no has jugado partidos." : "No matches played yet."}</p>}

                {activeMatches.map((match) => {
                  const opponent = getTeamById(match.opponentId);
                  const logo = getTeamLogo(opponent?.logo);

                  return (
                    <div key={match.id} className="season-result-row">
                      <span className={match.won ? "result-badge result-badge--win" : "result-badge result-badge--loss"}>{match.won ? "W" : "L"}</span>
                      <div className="season-result-team">{logo && <img src={logo} alt={opponent?.name ?? ""} />}<div><strong>vs {opponent?.shortName ?? "TBD"}</strong><small>{opponent?.country} · {match.scoreFor}-{match.scoreAgainst}</small></div></div>
                      <div className="season-result-rating"><span>RATING</span><strong>{match.playerRating.toFixed(2)}</strong></div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </section>
      </div>

      {!seasonFinished && nextOpponent && (
        <button className="season-floating-play" onClick={onPlayMatch}>
          <span className="season-floating-play__opponent">
            {nextOpponentLogo ? <img src={nextOpponentLogo} alt={nextOpponent.name} /> : <span className="season-floating-play__fallback">{nextOpponent.shortName}</span>}
          </span>

          <strong>{language === "es" ? "JUGAR PARTIDO" : "PLAY MATCH"}</strong>
        </button>
      )}
    </main>
  );
}

function getCountryFlag(countryCode: string) {
  if (!countryCode || countryCode.length !== 2) return "🌐";
  return countryCode.toUpperCase().replace(/./g,(char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}