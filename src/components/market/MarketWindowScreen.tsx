import type {CareerPlayer,ContractOffer} from "../../types/career";
import {getTeamById} from "../../data/teams";
import {useGameSettings} from "../../context/GameSettingsContext";
import {formatCurrency} from "../../utils/currency";
import "../../styles/MarketWindowScreen.css";
import {getTeamLogo} from "../../utils/teamLogo";

interface MarketWindowScreenProps {
  player:CareerPlayer;
  type:"midseason"|"offseason";
  renewalOffer?:ContractOffer|null;
  onStay:() => void;
  onRenew?:() => void;
  onExploreOffers:() => void;
}

export function MarketWindowScreen({player,type,renewalOffer,onStay,onRenew,onExploreOffers}:MarketWindowScreenProps) {
  const {language,currency} = useGameSettings();
  const team = getTeamById(player.currentTeamId);
  const teamLogo = getTeamLogo(team?.logo);
  const isMidseason = type === "midseason";

  const eyebrow = language === "es" ? "VENTANA DE TRANSFERENCIAS" : "TRANSFER WINDOW";
  const title = isMidseason
    ? language === "es" ? "MITAD DE TEMPORADA" : "MIDSEASON"
    : language === "es" ? "FIN DE TEMPORADA" : "OFFSEASON";

  const description = isMidseason
    ? language === "es"
      ? "Stage 1 ha terminado. Puedes continuar con tu proyecto actual o escuchar nuevas propuestas antes de la segunda mitad de la temporada."
      : "Stage 1 is over. You can continue with your current project or listen to new offers before the second half of the season."
    : language === "es"
      ? "La temporada ha terminado. Tu organización quiere definir tu futuro antes de comenzar el próximo año competitivo."
      : "The season is over. Your organization wants to define your future before the next competitive year begins.";

  return (
    <main className="market-window-screen">
      <section className="market-window-card">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>

        <div className="market-window-current-team">
          <span>{language === "es" ? "EQUIPO ACTUAL" : "CURRENT TEAM"}</span>
          <div className="market-window-current-team__identity">
            {teamLogo && <img src={teamLogo} alt={team?.name ?? player.currentTeam} />}
            <strong>{team?.name ?? player.currentTeam}</strong>
          </div>
        </div>

        {!isMidseason && renewalOffer && (
          <div className="market-renewal">
            <div className="market-renewal__header">
              <div>
                <span>{language === "es" ? "OFERTA DE RENOVACIÓN" : "RENEWAL OFFER"}</span>
                <strong>{team?.name ?? player.currentTeam}</strong>
              </div>

              <div className="market-renewal__status">
                {language === "es" ? "CONTRATO PROPUESTO" : "PROPOSED CONTRACT"}
              </div>
            </div>

            <div className="market-renewal__details">
              <div>
                <span>{language === "es" ? "SALARIO MENSUAL" : "MONTHLY SALARY"}</span>
                <strong>{formatCurrency(renewalOffer.salary,currency)}</strong>
              </div>

              <div>
                <span>{language === "es" ? "DURACIÓN" : "DURATION"}</span>
                <strong>{renewalOffer.duration} {getDurationLabel(renewalOffer.duration,language)}</strong>
              </div>

              <div>
                <span>{language === "es" ? "ROL" : "ROLE"}</span>
                <strong>{renewalOffer.rosterRole === "Starter" ? language === "es" ? "TITULAR" : "STARTER" : language === "es" ? "SUPLENTE" : "SUBSTITUTE"}</strong>
              </div>

              <div>
                <span>{language === "es" ? "BONO DE FIRMA" : "SIGNING BONUS"}</span>
                <strong>{formatCurrency(renewalOffer.signingBonus,currency)}</strong>
              </div>
            </div>

            <button className="market-renewal__accept" onClick={onRenew}>
              <span>{language === "es" ? "CONTINUAR EL PROYECTO" : "CONTINUE THE PROJECT"}</span>
              <strong>{language === "es" ? "RENOVAR CONTRATO" : "RENEW CONTRACT"}</strong>
            </button>
          </div>
        )}

        <div className={`market-window-actions ${!isMidseason ? "market-window-actions--offseason" : ""}`}>
          {isMidseason && (
            <button onClick={onStay}>
              <div className="market-window-stay-team">
                {teamLogo && <img src={teamLogo} alt="" />}
                <strong>{language === "es" ? `SEGUIR EN ${team?.name ?? player.currentTeam}` : `STAY WITH ${team?.name ?? player.currentTeam}`}</strong>
              </div>
            </button>
          )}

          <button className="market-window-actions__offers" onClick={onExploreOffers}>
            <strong>{language === "es" ? "VER 3 NUEVAS OFERTAS" : "VIEW 3 NEW OFFERS"}</strong>
          </button>
        </div>
      </section>
    </main>
  );
}

function getDurationLabel(duration:number,language:"es"|"en") {
  if (language === "es") return duration === 1 ? "AÑO" : "AÑOS";
  return duration === 1 ? "YEAR" : "YEARS";
}