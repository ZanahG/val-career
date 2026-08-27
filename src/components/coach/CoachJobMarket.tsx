import type {CoachCareerState} from "../../types/coach";
import {getTeamById} from "../../data/teams";
import {getTeamLogo} from "../../utils/teamLogo";
import "../../styles/CoachJobMarket.css";

interface CoachJobMarketProps {
  career:CoachCareerState;
  onAccept:(offerId:string)=>void;
  onExit:()=>void;
}

export function CoachJobMarket({career,onAccept,onExit}:CoachJobMarketProps) {
  const previousTeam=getTeamById(career.team.teamId);
  const previousLogo=getTeamLogo(previousTeam?.logo);
  const offers=career.jobMarket?.offers??[];
  const reason=getDismissalReasonLabel(career.board.dismissal.reason);

  return (
    <main className="coach-job-market">
      <div className="coach-job-market__bg"/>
      <div className="coach-job-market__overlay"/>

      <div className="coach-job-market__shell">
        <header className="coach-job-market__topbar">
          <div>
            <span>COACH CAREER</span>
            <strong>MERCADO DE ENTRENADORES</strong>
          </div>

          <button onClick={onExit}>SALIR</button>
        </header>

        <section className="coach-job-market__dismissal">
          <div className="coach-job-market__dismissal-logo">
            {previousLogo?<img src={previousLogo} alt={previousTeam?.name??""}/>:<span>{previousTeam?.shortName??"TCV"}</span>}
          </div>

          <div className="coach-job-market__dismissal-copy">
            <span>DECISIÓN DE LA DIRECTIVA</span>
            <h1>HAS SIDO DESTITUIDO</h1>
            <p>{previousTeam?.name??"Tu club"} ha decidido finalizar tu etapa como head coach.</p>

            <div className="coach-job-market__dismissal-meta">
              <div><span>MOTIVO</span><strong>{reason}</strong></div>
              <div><span>CONFIANZA FINAL</span><strong>{career.board.confidence}</strong></div>
              <div><span>REPUTACIÓN</span><strong>{career.coach.reputation}</strong></div>
            </div>
          </div>
        </section>

        <section className="coach-job-market__content">
          <div className="coach-job-market__heading">
            <div>
              <span>PRÓXIMO CAPÍTULO</span>
              <h2>OFERTAS DE TRABAJO</h2>
            </div>

            <p>{offers.length?`${offers.length} clubes han mostrado interés en contratarte.`:"Actualmente no tienes ofertas disponibles."}</p>
          </div>

          {offers.length>0?(
            <div className="coach-job-market__offers">
              {offers.map(offer=>{
                const team=getTeamById(offer.teamId);
                if(!team)return null;

                const logo=getTeamLogo(team.logo);

                return (
                  <article key={offer.id} className="coach-job-market__offer">
                    <div className="coach-job-market__offer-head">
                      <div className="coach-job-market__offer-logo">{logo?<img src={logo} alt={team.name}/>:<span>{team.shortName}</span>}</div>

                      <div>
                        <span>{team.circuit} · {team.marketRegion}</span>
                        <strong>{team.name}</strong>
                      </div>
                    </div>

                    <div className="coach-job-market__offer-stats">
                      <div><span>PRESTIGIO</span><strong>{team.prestige}</strong></div>
                      <div><span>FUERZA</span><strong>{team.strength}</strong></div>
                      <div><span>CONTRATO</span><strong>{offer.contractYears} {offer.contractYears===1?"AÑO":"AÑOS"}</strong></div>
                    </div>

                    <div className="coach-job-market__offer-footer">
                      <span>Reputación recomendada {offer.reputationRequired}</span>
                      <button onClick={()=>onAccept(offer.id)}>ACEPTAR OFERTA <b>→</b></button>
                    </div>
                  </article>
                );
              })}
            </div>
          ):(
            <div className="coach-job-market__empty">
              <span>SIN OFERTAS</span>
              <strong>NINGÚN CLUB HA PRESENTADO UNA PROPUESTA</strong>
              <p>Tu carrera queda temporalmente sin equipo. Más adelante podremos implementar nuevos ciclos de búsqueda de trabajo.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function getDismissalReasonLabel(reason:CoachCareerState["board"]["dismissal"]["reason"]) {
  if(reason==="Critical Confidence")return "Pérdida de confianza";
  if(reason==="Failed Objectives")return "Objetivos incumplidos";
  if(reason==="Poor Season")return "Resultados insuficientes";

  return "Decisión de la directiva";
}