import type {CareerPlayer,ContractOffer} from "../../types/career";
import {getTeamById} from "../../data/teams";
import {GameSettingsControls} from "../shared/GameSettingsControls";
import {useGameSettings} from "../../context/GameSettingsContext";
import {formatCurrency} from "../../utils/currency";
import {getTeamLogo} from "../../utils/teamLogo";
import "../../styles/OfferScreen.css";

interface OfferScreenProps {
  player:CareerPlayer;
  offers:ContractOffer[];
  onAccept:(offer:ContractOffer) => void;
  onBack?:() => void;
}

export function OfferScreen({player,offers,onAccept,onBack}:OfferScreenProps) {
  const {language, currency, t} = useGameSettings();

  return (
    <main className="offer-screen">
      <header className="offer-header">
        {onBack && <button className="offer-back-button" onClick={onBack}>← {language === "es" ? "VOLVER" : "BACK"}</button>}
        <div>
          <span className="eyebrow">{language === "es" ? "MERCADO DE FICHAJES" : "OFFSEASON MARKET"}</span>
          <h1>{t("contractOffers")}</h1>
          <p>{language === "es" ? `${player.nickname}, elige la organización donde quieres continuar tu carrera.` : `${player.nickname}, choose the organization where you want to continue your career.`}</p>
        </div>

        <div className="offer-header__right">
          <GameSettingsControls />

          <div className="offer-season">
            <span>{t("season")}</span>
            <strong>{player.season}</strong>
          </div>
        </div>
      </header>

      <section className="offer-grid">
        {offers.map((offer) => {
          const team = getTeamById(offer.teamId);
          if (!team) return null;

          const teamLogo = getTeamLogo(team.logo);

          return (
            <article key={offer.id} className="offer-card">
              <div className="offer-card__team">
                <div className="offer-team-logo">
                  {teamLogo ? <img src={teamLogo} alt={`${team.name} logo`} /> : <span>{team.shortName}</span>}
                </div>

                <span className="eyebrow">{team.tier === 1 ? `VCT ${team.circuit.toUpperCase()}` : `CHALLENGERS ${team.marketRegion.toUpperCase()}`}</span>
                <h2>{team.name}</h2>
              </div>

              <div className="offer-card__details">
                <div className="offer-stat">
                  <span>{t("monthlySalary")}</span>
                  <strong>{formatCurrency(offer.salary, currency)}</strong>
                </div>

                <div className="offer-stat">
                  <span>{t("contract")}</span>
                  <strong>{offer.duration} {getDurationLabel(offer.duration, language)}</strong>
                </div>

                <div className="offer-stat">
                  <span>{t("rosterRole")}</span>
                  <strong>{offer.rosterRole === "Starter" ? t("starter") : t("substitute")}</strong>
                </div>

                <div className="offer-stat">
                  <span>{t("signingBonus")}</span>
                  <strong>{formatCurrency(offer.signingBonus, currency)}</strong>
                </div>
              </div>

              <div className="offer-expectations">
                <span>{language === "es" ? "EXPECTATIVAS" : "EXPECTATIONS"}</span>
                <p>{language === "es" ? translateExpectation(offer.expectations) : offer.expectations}</p>
              </div>

              <button className="offer-button" onClick={() => onAccept(offer)}>
                {language === "es" ? "FIRMAR CONTRATO" : "SIGN CONTRACT"}
                <span>→</span>
              </button>
            </article>
          );
        })}
      </section>
    </main>
  );
}

function getDurationLabel(duration: number, language: "es" | "en") {
  if (language === "es") return duration === 1 ? "AÑO" : "AÑOS";
  return duration === 1 ? "YEAR" : "YEARS";
}

function translateExpectation(expectation: string) {
  if (expectation.includes("Qualify for playoffs")) return "Clasificar a playoffs y mantener un buen rendimiento individual.";
  if (expectation.includes("Fight for the starting spot")) return "Competir por un puesto como titular y estar preparado cuando el equipo te necesite.";
  if (expectation.includes("Fight for Challengers playoffs")) return "Competir por los playoffs de Challengers y consolidarte como uno de los mejores jugadores de la región.";
  if (expectation.includes("Compete for international qualification")) return "Competir por la clasificación internacional y rendir al nivel del VCT.";
  return expectation;
}