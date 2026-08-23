import type {CareerPlayer} from "../../types/career";
import type {SeasonState} from "../../types/season";
import {GameSettingsControls} from "../shared/GameSettingsControls";
import {getTeamById} from "../../data/teams";
import {getPlayerSeasonStats, getSortedStandings} from "../../logic/season";
import {useGameSettings} from "../../context/GameSettingsContext";
import {formatCurrency} from "../../utils/currency";
import "../../styles/SeasonRecap.css";

interface SeasonRecapProps {
  player: CareerPlayer;
  season: SeasonState;
  onContinue: () => void;
}

export function SeasonRecap({player, season, onContinue}: SeasonRecapProps) {
  const {language, currency} = useGameSettings();

  const team = getTeamById(player.currentTeamId);
  const totalStats = getPlayerSeasonStats(season);
  const standings = getSortedStandings(season.standings);
  const placement = standings.findIndex((row) => row.teamId === player.currentTeamId) + 1;
  const regularWins = season.playedMatches.filter((match) => match.won).length;
  const regularLosses = season.playedMatches.length - regularWins;
  const ascensionWins = season.ascensionMatches.filter((match) => match.won).length;
  const ascensionLosses = season.ascensionMatches.length - ascensionWins;
  const seasonSalary = player.salary * 12;
  const tierLabel = team?.tier === 1 ? `VCT ${team.circuit}` : `CHALLENGERS ${getMarketLabel(team?.marketRegion)}`;

  return (
    <main className="recap-screen">
      <header className="recap-topbar">
        <div className="recap-topbar__brand">
          <div className="brand-mark brand-mark--small">TCV</div>

          <div>
            <strong>{language === "es" ? "RESUMEN DE TEMPORADA" : "SEASON RECAP"}</strong>
            <span>{team?.name ?? player.currentTeam}</span>
          </div>
        </div>

        <GameSettingsControls />
      </header>

      <section className="recap-content">
        <div className="recap-heading">
          <span className="eyebrow">{language === "es" ? `TEMPORADA ${player.season} COMPLETADA` : `SEASON ${player.season} COMPLETE`}</span>
          <h1>{player.nickname}</h1>
          <p>{team?.name} · {tierLabel} · {player.rosterRole}</p>
        </div>

        <section className="recap-placement">
          <span>{team?.tier === 1 ? "VCT" : "CHALLENGERS"}</span>
          <strong>#{placement}</strong>
          <small>{getPlacementLabel(placement, language)}</small>

          <div className="recap-placement__record">
            <span>{language === "es" ? "RÉCORD TEMPORADA REGULAR" : "REGULAR SEASON RECORD"}</span>
            <strong>{regularWins}-{regularLosses}</strong>
          </div>
        </section>

        {season.ascensionQualified && (
          <section className={season.ascensionWon ? "recap-ascension recap-ascension--win" : "recap-ascension recap-ascension--loss"}>
            <div className="recap-ascension__header">
              <div>
                <span className="eyebrow">ASCENSION {team?.circuit?.toUpperCase()}</span>
                <h2>{season.ascensionWon ? (language === "es" ? "ASCENSION GANADO" : "ASCENSION WON") : (language === "es" ? "ASCENSION PERDIDO" : "ASCENSION LOST")}</h2>
              </div>

              <strong>{ascensionWins}-{ascensionLosses}</strong>
            </div>

            <p>
              {season.ascensionWon
                ? language === "es"
                  ? "Superaste Ascension. Tu jugador ahora puede recibir ofertas de organizaciones Tier 1 del VCT."
                  : "You conquered Ascension. Your player can now receive offers from Tier 1 VCT organizations."
                : language === "es"
                  ? "No lograste superar Ascension esta temporada. Tendrás otra oportunidad si vuelves a clasificar."
                  : "You were unable to conquer Ascension this season. You'll get another chance if you qualify again."}
            </p>
          </section>
        )}

        <section className="recap-stats">
          <div><span>{language === "es" ? "PARTIDOS TOTALES" : "TOTAL MATCHES"}</span><strong>{totalStats.matches}</strong></div>
          <div><span>{language === "es" ? "RÉCORD TOTAL" : "TOTAL RECORD"}</span><strong>{totalStats.wins}-{totalStats.losses}</strong></div>
          <div><span>AVG RATING</span><strong>{totalStats.averageRating.toFixed(2)}</strong></div>
          <div><span>AVG ACS</span><strong>{totalStats.averageACS}</strong></div>
          <div><span>K / D</span><strong>{totalStats.kd.toFixed(2)}</strong></div>
          <div><span>K / D / A</span><strong>{totalStats.kills} / {totalStats.deaths} / {totalStats.assists}</strong></div>
          <div><span>{language === "es" ? "SALARIO TEMPORADA" : "SEASON SALARY"}</span><strong>{formatCurrency(seasonSalary, currency)}</strong></div>
          <div><span>{language === "es" ? "CONTRATO RESTANTE" : "CONTRACT LEFT"}</span><strong>{Math.max(0, player.contractSeasonsRemaining - 1)}Y</strong></div>
        </section>

        {season.ascensionWon && (
          <section className="recap-vct-status">
            <div className="recap-vct-status__icon">V</div>

            <div>
              <span>{language === "es" ? "ESTADO VCT" : "VCT STATUS"}</span>
              <strong>{language === "es" ? "ELEGIBLE PARA TIER 1" : "TIER 1 ELIGIBLE"}</strong>
              <p>{language === "es" ? `Has desbloqueado el mercado VCT ${team?.circuit ?? ""}.` : `You have unlocked the VCT ${team?.circuit ?? ""} market.`}</p>
            </div>
          </section>
        )}

        {!season.ascensionQualified && team?.tier === 2 && (
          <section className="recap-vct-status recap-vct-status--locked">
            <div className="recap-vct-status__icon">×</div>

            <div>
              <span>{language === "es" ? "ASCENSION" : "ASCENSION"}</span>
              <strong>{language === "es" ? "NO CLASIFICADO" : "NOT QUALIFIED"}</strong>
              <p>{language === "es" ? "Necesitas terminar entre los dos mejores de Challengers para llegar a Ascension." : "You need a top-two Challengers finish to reach Ascension."}</p>
            </div>
          </section>
        )}

        <footer className="recap-footer">
          <div>
            <span>{language === "es" ? "SIGUIENTE PASO" : "NEXT STEP"}</span>

            <strong>
              {season.ascensionWon
                ? language === "es" ? "Entrar al mercado VCT" : "Enter the VCT market"
                : player.contractSeasonsRemaining > 1
                  ? language === "es" ? "Continuar con el equipo" : "Return under contract"
                  : language === "es" ? "Entrar al mercado de fichajes" : "Enter the offseason market"}
            </strong>
          </div>

          <button className="primary-button" onClick={onContinue}>{language === "es" ? "CONTINUAR CARRERA" : "CONTINUE CAREER"} <span>→</span></button>
        </footer>
      </section>
    </main>
  );
}

function getPlacementLabel(placement: number, language: "es" | "en") {
  if (placement === 1) return language === "es" ? "CAMPEÓN" : "CHAMPION";
  if (placement === 2) return language === "es" ? "SUBCAMPEÓN" : "RUNNER-UP";
  if (placement <= 4) return language === "es" ? "PARTE ALTA" : "TOP FINISH";
  return language === "es" ? "TEMPORADA DIFÍCIL" : "ROUGH SEASON";
}

function getMarketLabel(region?: string) {
  if (!region) return "";
  if (region === "LATAM") return "LATAM";
  if (region === "Brazil") return "BR";
  if (region === "North America") return "NA";
  if (region === "Southeast Asia") return "SEA";
  if (region === "South Asia") return "SA";
  return region.toUpperCase();
}