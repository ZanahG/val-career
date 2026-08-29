import type {CoachCareerState} from "../../types/coach";
import {getTeamById} from "../../data/teams";
import {getCoachKickoffSummary,getCoachMasters1Summary,getCoachMasters2Summary,getCoachStage1Summary,getCoachStage2Summary} from "../../logic/coachVCTSeason";
import {getChampionsPlacement,getChampionsPlayerRecord} from "../../logic/championsBracket";
import {getTeamLogo} from "../../utils/teamLogo";
import {useGameSettings} from "../../context/GameSettingsContext";
import {GameSettingsControls} from "../shared/GameSettingsControls";
import kickoffImage from "../../images/season/kickoff.webp";
import masters1Image from "../../images/season/masters1.webp";
import stage1Image from "../../images/season/stage1.webp";
import masters2Image from "../../images/season/masters2.webp";
import stage2Image from "../../images/season/stage2.webp";
import championsImage from "../../images/season/champions.webp";
import "../../styles/CoachEventRecap.css";

interface CoachEventRecapProps {
  career:CoachCareerState;
  onContinue:()=>void;
}

type Language="es"|"en";
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
  const {language}=useGameSettings();
  const es=language==="es";
  const recap=getLatestEventRecap(career,language);
  const team=getTeamById(career.team.teamId);
  const logo=getTeamLogo(team?.logo);

  if(!recap)return null;

  const international=recap.event==="Masters 1"||recap.event==="Masters 2"||recap.event==="Champions";

  return (
    <main className="coach-event-recap">
      <div className="coach-event-recap__background">
        <img src={recap.image} alt=""/>
      </div>

      <div className="coach-event-recap__shade"/>

      <div className="coach-event-recap__shell">
        <header className="coach-event-recap__topbar">
          <div className="coach-event-recap__brand">
            <div className="coach-event-recap__brand-mark">
              {logo?<img src={logo} alt={team?.name??""}/>:<span>{team?.shortName??"TCV"}</span>}
            </div>

            <div>
              <span>{international?(es?"EVENTO INTERNACIONAL":"INTERNATIONAL EVENT"):`VCT ${career.coach.circuit}`}</span>
              <strong>{recap.event.toUpperCase()} · {career.coach.season}</strong>
            </div>
          </div>

          <div className="coach-event-recap__topbar-right">
            <div className="coach-event-recap__status">
              <i/>
              <span>{es?"EVENTO FINALIZADO":"EVENT COMPLETE"}</span>
            </div>

            <GameSettingsControls/>
          </div>
        </header>

        <section className="coach-event-recap__hero">
          <div className="coach-event-recap__event-info">
            <span className="coach-event-recap__eyebrow">{es?"RESULTADO FINAL":"FINAL RESULT"}</span>
            <strong>{recap.event}</strong>
            <small>{international?(es?"COMPETENCIA INTERNACIONAL":"INTERNATIONAL COMPETITION"):`VCT ${career.coach.circuit}`}</small>
          </div>

          <div className="coach-event-recap__team">
            <div className="coach-event-recap__team-logo">
              {logo?<img src={logo} alt={team?.name??""}/>:<span>{team?.shortName??"TBD"}</span>}
            </div>

            <div>
              <span>{es?"TU EQUIPO":"YOUR TEAM"}</span>
              <strong>{team?.name??"Team"}</strong>
            </div>
          </div>

          <div className="coach-event-recap__placement">
            <span>{es?"POSICIÓN FINAL":"FINAL PLACEMENT"}</span>
            <strong>{formatPlacement(recap.placement,language)}</strong>
          </div>
        </section>

        <section className="coach-event-recap__metrics">
          <MetricCard index="01" label={es?"VICTORIAS":"WINS"} value={recap.wins}/>
          <MetricCard index="02" label={es?"DERROTAS":"LOSSES"} value={recap.losses}/>
          <MetricCard index="03" label={es?"CHAMPIONSHIP POINTS":"CHAMPIONSHIP POINTS"} value={`+${recap.championshipPoints}`}/>
        </section>

        <div className="coach-event-recap__section-label">
          <span>01</span>
          <strong>{es?"RESUMEN DEL EVENTO":"EVENT SUMMARY"}</strong>
          <i/>
        </div>

        <section className="coach-event-recap__summary">
          <article className="coach-event-recap__summary-card">
            <div className="coach-event-recap__summary-icon">CP</div>

            <div>
              <span>CHAMPIONSHIP POINTS</span>
              <strong>+{recap.championshipPoints}</strong>
              <small>{recap.pointsDescription}</small>
            </div>
          </article>

          <article className={`coach-event-recap__summary-card ${recap.qualified?"coach-event-recap__summary-card--success":"coach-event-recap__summary-card--danger"}`}>
            <div className="coach-event-recap__summary-icon">{recap.qualified?"✓":"×"}</div>

            <div>
              <span>{recap.qualificationLabel}</span>
              <strong>{recap.qualified?(es?"CLASIFICADO":"QUALIFIED"):(es?"NO CLASIFICADO":"NOT QUALIFIED")}</strong>
              <small>{recap.qualificationText}</small>
            </div>
          </article>
        </section>

        <div className="coach-event-recap__section-label">
          <span>02</span>
          <strong>{es?"SIGUIENTE PASO":"WHAT'S NEXT"}</strong>
          <i/>
        </div>

        <section className="coach-event-recap__next">
          <div>
            <span>{es?"PRÓXIMA COMPETICIÓN":"NEXT COMPETITION"}</span>
            <strong>{recap.nextCompetition}</strong>
          </div>

          <div className="coach-event-recap__next-arrow">→</div>
        </section>

        <footer className="coach-event-recap__footer">
          <div>
            <span>{es?"EVENTO COMPLETADO":"EVENT COMPLETE"}</span>
            <strong>{recap.event} · {formatPlacement(recap.placement,language)}</strong>
          </div>

          <button className="coach-event-recap__continue" onClick={onContinue}>
            <span>{es?"CONTINUAR":"CONTINUE"}</span>
            <b>→</b>
          </button>
        </footer>
      </div>
    </main>
  );
}

function MetricCard({index,label,value}:{index:string;label:string;value:string|number}) {
  return (
    <article className="coach-event-recap__metric">
      <span>{index}</span>

      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function getLatestEventRecap(career:CoachCareerState,language:Language):EventRecapData|undefined {
  const season=career.seasonState;
  if(!season)return undefined;

  const es=language==="es";
  const teamId=career.team.teamId;

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
      nextCompetition:es?"FIN DE TEMPORADA":"END OF SEASON",
      qualificationLabel:"VALORANT CHAMPIONS",
      qualificationText:
        placement===1
          ?es?"Campeones del mundo":"World Champions"
          :es
            ?`Finalizaste Champions en ${formatPlacement(placement,language)}`
            :`You finished Champions in ${formatPlacement(placement,language)}`,
      qualified:placement===1,
      pointsDescription:
        es
          ?"Champions no entrega Championship Points para esta temporada"
          :"Champions does not award Championship Points for this season",
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
      nextCompetition:qualifiedToChampions?"CHAMPIONS":es?"FIN DE TEMPORADA":"END OF SEASON",
      qualificationLabel:"CHAMPIONS",
      qualificationText:
        qualifiedToChampions
          ?es?"Clasificación asegurada":"Qualification secured"
          :es?"Tu temporada competitiva ha terminado":"Your competitive season has ended",
      qualified:qualifiedToChampions,
      pointsDescription:
        es?"Puntos obtenidos durante Stage 2":"Points earned during Stage 2",
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
      qualificationText:
        es
          ?"La temporada continúa en el último Stage regional"
          :"The season continues in the final regional Stage",
      qualified:true,
      pointsDescription:
        es?"Puntos obtenidos en Masters 2":"Points earned at Masters 2",
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
      qualificationText:
        qualifiedToMasters2
          ?es?"Clasificación asegurada":"Qualification secured"
          :es?"Tu temporada continúa directamente en Stage 2":"Your season continues directly into Stage 2",
      qualified:qualifiedToMasters2,
      pointsDescription:
        es
          ?`${summary.regularSeasonWins} por victorias + ${summary.playoffPoints} por Playoffs`
          :`${summary.regularSeasonWins} from wins + ${summary.playoffPoints} from Playoffs`,
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
      qualificationText:
        es
          ?"La temporada continúa en el primer Stage regional"
          :"The season continues in the first regional Stage",
      qualified:true,
      pointsDescription:
        es?"Puntos obtenidos en Masters 1":"Points earned at Masters 1",
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
      qualificationText:
        summary.qualifiedToMasters
          ?es?"Clasificación asegurada":"Qualification secured"
          :es?"Tu temporada continúa en Stage 1":"Your season continues in Stage 1",
      qualified:summary.qualifiedToMasters,
      pointsDescription:
        es?"Puntos obtenidos en Kickoff":"Points earned during Kickoff",
    };
  }

  return undefined;
}

function formatPlacement(placement:number,language:Language) {
  if(language==="en"){
    const mod100=placement%100;

    if(mod100>=11&&mod100<=13)return `${placement}th`;

    const mod10=placement%10;

    if(mod10===1)return `${placement}st`;
    if(mod10===2)return `${placement}nd`;
    if(mod10===3)return `${placement}rd`;

    return `${placement}th`;
  }

  return `${placement}º`;
}