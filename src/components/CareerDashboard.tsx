import type {CareerChoice, CareerEvent, CareerPlayer} from "../types/career";
import {GameSettingsControls} from "./GameSettingsControls";
import {useGameSettings} from "../context/GameSettingsContext";
import {PlayerCard} from "./PlayerCard";
import {getEffectLabel, getEffectPreviews} from "../utils/effectLabels";
import {PlayerCareerSidebar} from "./PlayerCareerSidebar";
import "../styles/CareerDashboard.css";

interface CareerDashboardProps {
  player: CareerPlayer;
  event?: CareerEvent;
  onChoose: (choice: CareerChoice) => void;
  onReset: () => void;
  onOpenOffers: () => void;
  onOpenProfile: () => void;
  onEditPlayerCard: () => void;
  canOpenOffers: boolean;
  hasActiveSeason: boolean;
  onResumeSeason: () => void;
  onUpdatePlayer:(player:CareerPlayer) => void;
}

export function CareerDashboard({player,event,onChoose,onReset,onOpenOffers,onOpenProfile,onEditPlayerCard,canOpenOffers,hasActiveSeason,onResumeSeason,onUpdatePlayer}:CareerDashboardProps) {
  const {language,t} = useGameSettings();

  return (
    <main className="career-shell">
      <header className="topbar">
        <div className="topbar__brand">
          <div className="brand-mark brand-mark--small">TCV</div>

          <div>
            <strong>{language === "es" ? "TU CARRERA VALORANT" : "YOUR VALORANT CAREER"}</strong>
            <span>{language === "es" ? "SIMULADOR DE CARRERA" : "CAREER SIMULATOR"}</span>
          </div>
        </div>

        <div className="topbar__actions">
          <button className="secondary-button" onClick={onOpenProfile}>{language === "es" ? "CARRERA" : "CAREER"}</button>
          <GameSettingsControls />
          <div className="topbar__season"><span>{t("season")}</span><strong>{player.season}</strong></div>
        </div>
      </header>

      <div className="career-layout">
        <PlayerCareerSidebar player={player} language={language} onUpdatePlayer={onUpdatePlayer} showPerformance={false} />

        <section className="career-main">
          {event ? (
            <section className="event-card">
              <div className="event-card__top">
                <span className="eyebrow">{event.eyebrow[language]}</span>
                <span className="event-index">{language === "es" ? "EVENTO ACTIVO" : "LIVE EVENT"}</span>
              </div>

              <h1>{event.title[language]}</h1>
              <p className="event-description">{event.description[language]}</p>

              <div className="career-event-choices">
                {event.choices.map((choice,index) => {
                  const effects = getEffectPreviews(choice.effects);

                  return (
                    <button key={choice.id} className="career-event-choice" onClick={() => onChoose(choice)}>
                      <span className="career-event-choice__number">0{index + 1}</span>

                      <div className="career-event-choice__content">
                        <strong>{choice.label[language]}</strong>
                        <p>{choice.description[language]}</p>

                        <div className="career-choice-effects">
                          {effects.map((effect) => (
                            <small key={effect.key} className={effect.direction === "up" ? "career-effect career-effect--up" : "career-effect career-effect--down"}>
                              {getEffectLabel(effect.key,language)} <b>{effect.direction === "up" ? "↑" : "↓"}</b>
                            </small>
                          ))}
                        </div>
                      </div>

                      <b className="career-event-choice__arrow">→</b>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : hasActiveSeason ? (
            <section className="event-card event-card--complete">
              <span className="eyebrow">{player.currentStage === "VCT" ? "VALORANT CHAMPIONS TOUR" : language === "es" ? "TEMPORADA EN CURSO" : "SEASON IN PROGRESS"}</span>

              <h1>{language === "es" ? "TU TEMPORADA CONTINÚA." : "YOUR SEASON CONTINUES."}</h1>

              <p className="event-description">
                {language === "es"
                  ? `Actualmente representas a ${player.currentTeam}. Vuelve a la competición para continuar tu temporada ${player.season}.`
                  : `You currently represent ${player.currentTeam}. Return to competition to continue your ${player.season} season.`}
              </p>

              <div className="career-complete-actions">
                <button className="primary-button" onClick={onResumeSeason}>
                  {player.currentStage === "VCT"
                    ? language === "es" ? "VOLVER AL VCT" : "RETURN TO VCT"
                    : language === "es" ? "VOLVER A CHALLENGERS" : "RETURN TO CHALLENGERS"}
                  <span>→</span>
                </button>
              </div>
            </section>
          ) : (
            <section className="event-card event-card--complete">
              <span className="eyebrow">{language === "es" ? "CAPÍTULO COMPLETADO" : "CHAPTER COMPLETE"}</span>

              <h1>{language === "es" ? "TU PRIMER CAPÍTULO TERMINÓ." : "YOUR FIRST CHAPTER IS OVER."}</h1>

              <p className="event-description">
                {language === "es"
                  ? "Has completado la introducción. El mercado de fichajes ya está disponible y puedes continuar desarrollando tu carrera."
                  : "You completed the introduction. The transfer market is now available and you can continue developing your career."}
              </p>

              <div className="career-complete-actions">
                {canOpenOffers && (
                  <button className="primary-button" onClick={onOpenOffers}>
                    {language === "es" ? "VER OFERTAS" : "VIEW OFFERS"}
                    <span>→</span>
                  </button>
                )}

                <button className="secondary-button career-reset-button" onClick={onReset}>
                  {language === "es" ? "NUEVA CARRERA" : "NEW CAREER"}
                  <span>↻</span>
                </button>
              </div>
            </section>
          )}
        </section>

        <aside className="career-player-card-panel">
          <div className="career-player-card-panel__header">
            <span className="eyebrow">{language === "es" ? "IDENTIDAD" : "IDENTITY"}</span>
            <h3>PLAYER CARD</h3>
          </div>

          <PlayerCard player={player} onEdit={onEditPlayerCard} />
        </aside>
      </div>
    </main>
  );
}