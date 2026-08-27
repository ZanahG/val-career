import type {CoachCareerState} from "../../types/coach";
import {getTeamById} from "../../data/teams";
import {getCoachKickoffSummary,getCoachMasters1Summary,getCoachMasters2Summary,getCoachStage1Summary,getCoachStage2Summary} from "../../logic/coachVCTSeason";
import {getChampionsPlacement,getChampionsPlayerRecord} from "../../logic/championsBracket";
import {getTeamLogo} from "../../utils/teamLogo";
import kickoffImage from "../../images/season/kickoff.png";
import masters1Image from "../../images/season/masters1.png";
import stage1Image from "../../images/season/stage1.png";
import masters2Image from "../../images/season/masters2.png";
import stage2Image from "../../images/season/stage2.png";
import championsImage from "../../images/season/champions.png";
import "../../styles/CoachEventRecap.css";

interface CoachEventRecapProps {
  career:CoachCareerState;
  onContinue:()=>void;
}

type RecapEvent="Kickoff"|"Masters 1"|"Stage 1"|"Masters 2"|"Stage 2"|"Champions";

interface EventRecapData {
  event:RecapEvent;
  placement:number;
  wins:number;
  losses:number;
  championshipPoints:number;
  image:string;
  nextCompetition:string;
  qualificationLabel:string;
  qualificationText:string;
  qualified:boolean;
  pointsDescription:string;
}

export function CoachEventRecap({career,onContinue}:CoachEventRecapProps) {
  const recap=getLatestEventRecap(career);
  const team=getTeamById(career.team.teamId);
  const logo=getTeamLogo(team?.logo);

  if(!recap)return null;

  return (
    <main className="coach-event-recap">
      <div className="coach-event-recap__background">
        <img src={recap.image} alt=""/>
      </div>

      <div className="coach-event-recap__shade"/>

      <div className="coach-event-recap__shell">
        <header className="coach-event-recap__topbar">
          <div>
            <span>{recap.event==="Masters 1"||recap.event==="Masters 2"||recap.event==="Champions"?"INTERNACIONAL":`VCT ${career.coach.circuit}`}</span>
            <strong>{recap.event.toUpperCase()} {career.coach.season}</strong>
          </div>

          <span className="coach-event-recap__status">EVENTO FINALIZADO</span>
        </header>

        <section className="coach-event-recap__hero">
          <span className="coach-event-recap__eyebrow">RESULTADO FINAL</span>

          <div className="coach-event-recap__team-logo">
            {logo
              ?<img src={logo} alt={team?.name??""}/>
              :<span>{team?.shortName??"TBD"}</span>}
          </div>

          <strong className="coach-event-recap__team-name">{team?.name}</strong>

          <div className="coach-event-recap__placement">
            <strong>{formatPlacement(recap.placement)}</strong>
            <span>POSICIÓN</span>
          </div>

          <div className="coach-event-recap__record">
            <div>
              <strong>{recap.wins}</strong>
              <span>VICTORIAS</span>
            </div>

            <div className="coach-event-recap__record-separator"/>

            <div>
              <strong>{recap.losses}</strong>
              <span>DERROTAS</span>
            </div>
          </div>
        </section>

        <section className="coach-event-recap__summary">
          <div className="coach-event-recap__summary-row">
            <div>
              <span>CHAMPIONSHIP POINTS</span>
              <small>{recap.pointsDescription}</small>
            </div>

            <strong className="coach-event-recap__points">
              +{recap.championshipPoints}
            </strong>
          </div>

          <div className="coach-event-recap__summary-row">
            <div>
              <span>{recap.qualificationLabel}</span>
              <small>{recap.qualificationText}</small>
            </div>

            <strong className={recap.qualified?"coach-event-recap__qualified":"coach-event-recap__not-qualified"}>
              {recap.qualified?"CLASIFICADO ✓":"NO CLASIFICADO"}
            </strong>
          </div>

          <div className="coach-event-recap__next">
            <span>PRÓXIMA COMPETICIÓN</span>
            <strong>{recap.nextCompetition}</strong>
          </div>
        </section>

        <button className="coach-event-recap__continue" onClick={onContinue}>
          CONTINUAR <span>→</span>
        </button>
      </div>
    </main>
  );
}

function getLatestEventRecap(career:CoachCareerState):EventRecapData|undefined {
  const season=career.seasonState;
  if(!season)return undefined;

  const teamId=career.team.teamId;

  /*
   * IMPORTANTE:
   * Buscamos desde el evento más avanzado hacia atrás porque los
   * resolvers ya cambian season.phase antes de abrir esta pantalla.
   */

  if(season.events.Champions.status==="Complete"&&season.champions?.complete){
    const placement=getChampionsPlacement(season.champions,teamId);
    const record=getChampionsPlayerRecord(season.champions);

    return {
      event:"Champions",
      placement,
      wins:record.wins,
      losses:record.losses,
      championshipPoints:0,
      image:championsImage,
      nextCompetition:"FIN DE TEMPORADA",
      qualificationLabel:"VALORANT CHAMPIONS",
      qualificationText:placement===1?"Campeones del mundo":`Finalizaste Champions en ${formatPlacement(placement)}`,
      qualified:placement===1,
      pointsDescription:"Champions no entrega Championship Points para esta temporada",
    };
  }

  if(season.events["Stage 2 Playoffs"].status==="Complete"&&season.stage2?.complete){
    const summary=getCoachStage2Summary(career);
    if(!summary)return undefined;

    const qualifiedToChampions=
      season.champions?.qualifiers.some(qualifier=>qualifier.teamId===teamId)??false;

    return {
      event:"Stage 2",
      placement:summary.placement,
      wins:summary.wins,
      losses:summary.losses,
      championshipPoints:summary.championshipPoints,
      image:stage2Image,
      nextCompetition:qualifiedToChampions?"CHAMPIONS":"FIN DE TEMPORADA",
      qualificationLabel:"CHAMPIONS",
      qualificationText:qualifiedToChampions?"Clasificación asegurada":"Tu temporada competitiva ha terminado",
      qualified:qualifiedToChampions,
      pointsDescription:"Puntos obtenidos durante Stage 2",
    };
  }

  if(season.events["Masters 2"].status==="Complete"&&season.masters2?.complete){
    const summary=getCoachMasters2Summary(career);
    if(!summary)return undefined;

    return {
      event:"Masters 2",
      placement:summary.placement,
      wins:summary.wins,
      losses:summary.losses,
      championshipPoints:summary.championshipPoints,
      image:masters2Image,
      nextCompetition:"STAGE 2",
      qualificationLabel:"STAGE 2",
      qualificationText:"La temporada continúa en el último Stage regional",
      qualified:true,
      pointsDescription:"Puntos obtenidos en Masters 2",
    };
  }

  if(season.events["Stage 1 Playoffs"].status==="Complete"&&season.stage1?.complete){
    const summary=getCoachStage1Summary(career);
    if(!summary)return undefined;

    const qualifiedToMasters2=summary.qualifiedToMasters;

    return {
      event:"Stage 1",
      placement:summary.placement,
      wins:summary.wins,
      losses:summary.losses,
      championshipPoints:summary.championshipPoints,
      image:stage1Image,
      nextCompetition:qualifiedToMasters2?"MASTERS 2":"STAGE 2",
      qualificationLabel:"MASTERS 2",
      qualificationText:qualifiedToMasters2?"Clasificación asegurada":"Tu temporada continúa directamente en Stage 2",
      qualified:qualifiedToMasters2,
      pointsDescription:`${summary.regularSeasonWins} por victorias + ${summary.playoffPoints} por Playoffs`,
    };
  }

  if(season.events["Masters 1"].status==="Complete"&&season.masters1?.complete){
    const summary=getCoachMasters1Summary(career);
    if(!summary)return undefined;

    return {
      event:"Masters 1",
      placement:summary.placement,
      wins:summary.wins,
      losses:summary.losses,
      championshipPoints:summary.championshipPoints,
      image:masters1Image,
      nextCompetition:"STAGE 1",
      qualificationLabel:"STAGE 1",
      qualificationText:"La temporada continúa en el primer Stage regional",
      qualified:true,
      pointsDescription:"Puntos obtenidos en Masters 1",
    };
  }

  if(season.events.Kickoff.status==="Complete"&&season.kickoffBracket?.complete){
    const summary=getCoachKickoffSummary(career);
    if(!summary)return undefined;

    return {
      event:"Kickoff",
      placement:summary.placement,
      wins:summary.wins,
      losses:summary.losses,
      championshipPoints:summary.championshipPoints,
      image:kickoffImage,
      nextCompetition:summary.qualifiedToMasters?"MASTERS 1":"STAGE 1",
      qualificationLabel:"MASTERS 1",
      qualificationText:summary.qualifiedToMasters?"Clasificación asegurada":"Tu temporada continúa en Stage 1",
      qualified:summary.qualifiedToMasters,
      pointsDescription:"Puntos obtenidos en Kickoff",
    };
  }

  return undefined;
}

function formatPlacement(placement:number) {
  return `${placement}º`;
}