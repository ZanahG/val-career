import {useState} from "react";
import type {CoachCareerState,CoachChampionsMatch,CoachChampionsState,CoachMastersMatch,CoachMastersState,CoachStageMatch,CoachStageState,CoachVCTPhase} from "../../types/coach";
import {getTeamById} from "../../data/teams";
import {getNextPlayerChampionsMatch} from "../../logic/championsBracket";
import {isCoachSeasonFinished} from "../../logic/coachCareerProgression";
import {getNextCoachOpponent} from "../../logic/coachVCTSeason";
import {getNextPlayerKickoffMatch} from "../../logic/kickoffBracket";
import {getNextPlayerMastersMatch} from "../../logic/mastersBracket";
import {getNextPlayerStageMatch} from "../../logic/coachStage";
import {getTeamLogo} from "../../utils/teamLogo";
import kickoffImage from "../../images/season/kickoff.png";
import masters1Image from "../../images/season/masters1.png";
import stage1Image from "../../images/season/stage1.png";
import masters2Image from "../../images/season/masters2.png";
import stage2Image from "../../images/season/stage2.png";
import championsImage from "../../images/season/champions.png";
import {VCTBracket} from "../vct/VCTBracket";
import "../../styles/CoachSeason.css";

interface CoachSeasonProps {
  career:CoachCareerState;
  onStartSeason:()=>void;
  onAdvancePhase:()=>void;
  onPrepareMatch:()=>void;
  onFinishSeason:()=>void;
  onEnterOffseason:()=>void;
  onNextSeason:()=>void;
  onBack:()=>void;
}

type CoachSeasonBannerKey="Kickoff"|"Masters 1"|"Stage 1"|"Masters 2"|"Stage 2"|"Champions";
type TournamentMatch=CoachMastersMatch|CoachStageMatch|CoachChampionsMatch;

interface SeasonTile {
  phase:CoachSeasonBannerKey;
  label:string;
  image:string;
}

const SEASON_TILES:SeasonTile[]=[
  {phase:"Kickoff",label:"Kickoff",image:kickoffImage},
  {phase:"Masters 1",label:"Masters 1",image:masters1Image},
  {phase:"Stage 1",label:"Stage 1",image:stage1Image},
  {phase:"Masters 2",label:"Masters 2",image:masters2Image},
  {phase:"Stage 2",label:"Stage 2",image:stage2Image},
  {phase:"Champions",label:"Champions",image:championsImage},
];

/* =========================================================
   CHAMPIONS
========================================================= */

function ChampionsPanel({champions,playerTeamId}:{champions:CoachChampionsState;playerTeamId:string}) {
  const groupMatches=champions.matches.filter(match=>match.stage==="Groups");
  const playoffMatches=champions.matches.filter(match=>match.stage==="Playoffs");

  return (
    <section className="coach-season__champions">
      <header className="coach-season__masters-head">
        <div>
          <span className="coach-season__eyebrow">VALORANT CHAMPIONS</span>
          <h2>{champions.phase==="Groups"?"GROUP STAGE":champions.phase==="Playoffs"?"PLAYOFFS":"EVENTO COMPLETADO"}</h2>
        </div>

        <div className="coach-season__masters-format">
          <span>FORMATO</span>
          <strong>{champions.phase==="Groups"?"4 GRUPOS · GSL":"DOUBLE ELIMINATION"}</strong>
        </div>
      </header>

      {champions.phase==="Groups"&&(
        <>
          <ChampionsGroups champions={champions} playerTeamId={playerTeamId}/>
          <ChampionsGroupMatches matches={groupMatches} playerTeamId={playerTeamId}/>
        </>
      )}

      {champions.phase==="Playoffs"&&(
        <ChampionsPlayoffs matches={playoffMatches} playerTeamId={playerTeamId}/>
      )}

      {champions.phase==="Complete"&&(
        <>
          <ChampionsPlayoffs matches={playoffMatches} playerTeamId={playerTeamId}/>

          <div className="coach-season__masters-complete">
            <span>VALORANT CHAMPIONS FINALIZADO</span>
            <strong>{champions.championTeamId===playerTeamId?"CAMPEÓN DEL MUNDO":"EVENTO COMPLETADO"}</strong>
          </div>
        </>
      )}
    </section>
  );
}

function ChampionsGroups({champions,playerTeamId}:{champions:CoachChampionsState;playerTeamId:string}) {
  return (
    <div className="coach-season__champions-groups">
      {(["A","B","C","D"] as const).map(group=>(
        <ChampionsGroup key={group} champions={champions} group={group} playerTeamId={playerTeamId}/>
      ))}
    </div>
  );
}

function ChampionsGroup({champions,group,playerTeamId}:{champions:CoachChampionsState;group:"A"|"B"|"C"|"D";playerTeamId:string}) {
  const standings=champions.groupStandings
    .filter(standing=>standing.group===group)
    .sort((a,b)=>{
      if(a.qualified!==b.qualified)return a.qualified?-1:1;
      if(a.eliminated!==b.eliminated)return a.eliminated?1:-1;
      if(b.wins!==a.wins)return b.wins-a.wins;

      const diffA=a.mapsWon-a.mapsLost;
      const diffB=b.mapsWon-b.mapsLost;

      if(diffB!==diffA)return diffB-diffA;
      return b.mapsWon-a.mapsWon;
    });

  return (
    <section className="coach-season__champions-group">
      <header className="coach-season__subsection-head">
        <div>
          <span>CHAMPIONS</span>
          <strong>GROUP {group}</strong>
        </div>

        <small>TOP 2 → PLAYOFFS</small>
      </header>

      <div className="coach-season__champions-group-table">
        {standings.map((standing,index)=>{
          const team=getTeamById(standing.teamId);
          const logo=getTeamLogo(team?.logo);
          const player=standing.teamId===playerTeamId;
          const diff=standing.mapsWon-standing.mapsLost;

          return (
            <div key={standing.teamId} className={`coach-season__champions-group-row${player?" coach-season__champions-group-row--player":""}`}>
              <strong>{index+1}</strong>

              <div>
                <span>{logo&&<img src={logo} alt={team?.name??""}/>}</span>
                <strong>{team?.shortName??"TBD"}</strong>
              </div>

              <b>{standing.wins}-{standing.losses}</b>

              <small>{standing.mapsWon}-{standing.mapsLost}</small>

              <span className={diff>0?"positive":diff<0?"negative":""}>{diff>0?"+":""}{diff}</span>

              <em className={standing.qualified?"qualified":standing.eliminated?"eliminated":"active"}>
                {standing.qualified?"PLAYOFFS":standing.eliminated?"OUT":"LIVE"}
              </em>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ChampionsGroupMatches({matches,playerTeamId}:{matches:CoachChampionsMatch[];playerTeamId:string}) {
  const groups=["A","B","C","D"] as const;

  return (
    <section className="coach-season__champions-matches">
      <header className="coach-season__subsection-head">
        <div>
          <span>GROUP STAGE</span>
          <strong>PARTIDOS</strong>
        </div>

        <small>OPENING · WINNERS · ELIMINATION · DECIDER</small>
      </header>

      <div className="coach-season__champions-match-groups">
        {groups.map(group=>{
          const groupMatches=matches.filter(match=>match.group===group);

          return (
            <div key={group} className="coach-season__champions-match-group">
              <span>GROUP {group}</span>

              <div>
                {groupMatches.map(match=>(
                  <TournamentMatchCard key={match.id} match={match} playerTeamId={playerTeamId}/>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ChampionsPlayoffs({matches,playerTeamId}:{matches:CoachChampionsMatch[];playerTeamId:string}) {
  return (
    <section className="coach-season__masters-playoffs">
      <header className="coach-season__subsection-head">
        <div>
          <span>CHAMPIONS PLAYOFFS</span>
          <strong>DOUBLE ELIMINATION</strong>
        </div>

        <small>LOWER FINAL + GRAND FINAL · BO5</small>
      </header>

      <div className="coach-season__playoff-groups">
        <PlayoffSection
          title="UPPER BRACKET"
          rounds={["Upper Quarterfinal","Upper Semifinal","Upper Final"]}
          matches={matches}
          playerTeamId={playerTeamId}
        />

        <PlayoffSection
          title="LOWER BRACKET"
          rounds={["Lower Round 1","Lower Round 2","Lower Round 3","Lower Final"]}
          matches={matches}
          playerTeamId={playerTeamId}
        />

        <PlayoffSection
          title="GRAND FINAL"
          rounds={["Grand Final"]}
          matches={matches}
          playerTeamId={playerTeamId}
        />
      </div>
    </section>
  );
}
export function CoachSeason({career,onStartSeason,onPrepareMatch,onFinishSeason,onEnterOffseason,onNextSeason,onBack}:CoachSeasonProps) {
  const season=career.seasonState;
  const team=getTeamById(career.team.teamId);
  const teamLogo=getTeamLogo(team?.logo);

  if(!season){
    return (
      <main className="coach-season">
        <div className="coach-season__bg"/>
        <div className="coach-season__overlay"/>

        <button className="coach-season__floating-back" onClick={onBack}>
          <span>←</span>
          DASHBOARD
        </button>

        <div className="coach-season__shell">
          <header className="coach-season__topbar">
            <div className="coach-season__club">
              <div className="coach-season__club-logo">{teamLogo?<img src={teamLogo} alt={team?.name??""}/>:<span>{team?.shortName??"TBD"}</span>}</div>
              <div><span>VCT {career.coach.circuit}</span><strong>{team?.name} · {career.coach.season}</strong></div>
            </div>
          </header>

          <section className="coach-season__start">
            <span className="coach-season__eyebrow">TEMPORADA {career.coach.season}</span>
            <h1>COMENZAR TEMPORADA</h1>
            <p>Comienza un nuevo año competitivo al mando de {team?.name}.</p>

            <div className="coach-season__phase-strip">
              {SEASON_TILES.map((tile,index)=><SeasonPhaseTile key={tile.phase} tile={tile} state={index===0?"active":"locked"}/>)}
            </div>

            <button className="coach-season__start-button" onClick={onStartSeason}>COMENZAR TEMPORADA <span>→</span></button>
          </section>
        </div>
      </main>
    );
  }

  const seasonArchived=isCoachSeasonFinished(career);
  const offseasonStarted=Boolean(career.offseason);
  const offseasonComplete=career.offseason?.completed===true;
  const nextOpponent=getNextCoachOpponent(career);
  const nextOpponentLogo=getTeamLogo(nextOpponent?.logo);
  const annualWins=getWins(career);
  const annualLosses=getLosses(career);

  const kickoffNextMatch=season.phase==="Kickoff"&&season.kickoffBracket?getNextPlayerKickoffMatch(season.kickoffBracket):undefined;

  const currentMasters=
    season.phase==="Masters 1"?season.masters1:
    season.phase==="Masters 2"?season.masters2:
    undefined;

  const mastersNextMatch=currentMasters?getNextPlayerMastersMatch(currentMasters):undefined;

  const currentStage=
    season.phase==="Stage 1"||season.phase==="Stage 1 Playoffs"?season.stage1:
    season.phase==="Stage 2"||season.phase==="Stage 2 Playoffs"?season.stage2:
    undefined;

  const stageNextMatch=currentStage?getNextPlayerStageMatch(currentStage):undefined;

  const championsNextMatch=
    season.phase==="Champions"&&season.champions
      ?getNextPlayerChampionsMatch(season.champions)
      :undefined;

  const roundLabel=
    kickoffNextMatch?.roundName?.toUpperCase()??
    mastersNextMatch?.round.toUpperCase()??
    stageNextMatch?.round.toUpperCase()??
    championsNextMatch?.round.toUpperCase()??
    getMatchRoundLabel(season.phase);

  const bestOf=
    kickoffNextMatch?.bestOf??
    mastersNextMatch?.bestOf??
    stageNextMatch?.bestOf??
    championsNextMatch?.bestOf??
    3;

  const international=season.phase==="Masters 1"||season.phase==="Masters 2"||season.phase==="Champions";

  return (
    <main className="coach-season">
      <div className="coach-season__bg"/>
      <div className="coach-season__overlay"/>

      <button className="coach-season__floating-back" onClick={onBack}>
        <span>←</span>
        DASHBOARD
      </button>

      {season.phase!=="Complete"&&(
        <button className="coach-season__floating-prepare" disabled={!nextOpponent} onClick={onPrepareMatch}>
          {nextOpponentLogo&&<img src={nextOpponentLogo} alt={nextOpponent?.name??""}/>}
          <span>
            <small>PRÓXIMO PASO</small>
            PREPARAR PARTIDO
          </span>
          <b>→</b>
        </button>
      )}

      <div className="coach-season__shell">
        <header className="coach-season__topbar">
          <div className="coach-season__club">
            <div className="coach-season__club-logo">{teamLogo?<img src={teamLogo} alt={team?.name??""}/>:<span>{team?.shortName??"TBD"}</span>}</div>
            <div><span>VCT {season.circuit}</span><strong>{team?.name} · {season.season}</strong></div>
          </div>
        </header>

        <section className="coach-season__hero">
          <div>
            <span className="coach-season__eyebrow">TEMPORADA {season.season}</span>
            <h1>{getPhaseHeroTitle(season.phase)}</h1>
            <p>{getPhaseDescription(season.phase)}</p>
          </div>

          <div className="coach-season__record">
            <span>RÉCORD ANUAL</span>
            <strong>{annualWins} - {annualLosses}</strong>
          </div>
        </section>

        <div className="coach-season__phase-strip">
          {SEASON_TILES.map(tile=>{
            const active=isTileActive(season.phase,tile.phase);
            const completed=isTileCompleted(season.phase,tile.phase);
            const state=active?"active":completed?"complete":"locked";
            return <SeasonPhaseTile key={tile.phase} tile={tile} state={state}/>;
          })}
        </div>

        {season.phase!=="Complete"&&(
          <section className="coach-season__match-center">
            <header className="coach-season__match-center-head">
              <div><span>{roundLabel}</span><h2>PRÓXIMO PARTIDO</h2></div>
              <div className="coach-season__match-format"><span>{getCompetitionLabel(season.phase)}</span><strong>BO{bestOf}</strong></div>
            </header>

            {nextOpponent?(
              <>
                <div className="coach-season__match-center-body">
                  <MatchTeam teamId={career.team.teamId}/>
                  <div className="coach-season__match-vs"><span>VS</span></div>
                  <MatchTeam teamId={nextOpponent.id} reverse/>
                </div>

                <footer className="coach-season__match-center-footer">
                  <div><span>TORNEO</span><strong>{getCompetitionLabel(season.phase)}</strong></div>
                  <div><span>FORMATO</span><strong>Best of {bestOf}</strong></div>
                  <div><span>REGIÓN</span><strong>{international?"INTERNACIONAL":season.circuit}</strong></div>
                  <div><span>RÉCORD</span><strong>{annualWins}-{annualLosses}</strong></div>
                </footer>
              </>
            ):(
              <div className="coach-season__match-empty">
                {getNoOpponentMessage(
                  season.phase,
                  season.kickoffBracket?.playerQualified,
                  season.kickoffBracket?.playerEliminated,
                  currentMasters,
                  currentStage,
                  career.team.teamId,
                )}
              </div>
            )}
          </section>
        )}

        {season.phase==="Kickoff"&&season.kickoffBracket&&(
          <section className="coach-season__bracket-panel">
            <VCTBracket bracket={season.kickoffBracket}/>
          </section>
        )}

        {(season.phase==="Masters 1"||season.phase==="Masters 2")&&currentMasters&&(
          <MastersPanel masters={currentMasters} playerTeamId={career.team.teamId}/>
        )}

        {(season.phase==="Stage 1"||season.phase==="Stage 1 Playoffs"||season.phase==="Stage 2"||season.phase==="Stage 2 Playoffs")&&currentStage&&(
          <StagePanel stage={currentStage} playerTeamId={career.team.teamId}/>
        )}

        {season.phase==="Champions"&&season.champions&&(
          <ChampionsPanel champions={season.champions} playerTeamId={career.team.teamId}/>
        )}

        {season.phase==="Complete"&&(
          <section className="coach-season__complete">
            <span className="coach-season__eyebrow">FIN DE TEMPORADA</span>
            <h2>{season.season} COMPLETADO</h2>

            {!seasonArchived&&(
              <>
                <p>La temporada competitiva ha finalizado. Guarda los resultados del año antes de continuar.</p>

                <button className="coach-season__complete-action" onClick={onFinishSeason}>
                  FINALIZAR TEMPORADA <span>→</span>
                </button>
              </>
            )}

            {seasonArchived&&!offseasonStarted&&(
              <>
                <p>La temporada quedó guardada. Es momento de preparar el plantel para el próximo año.</p>

                <button className="coach-season__complete-action" onClick={onEnterOffseason}>
                  ENTRAR A OFFSEASON <span>→</span>
                </button>
              </>
            )}

            {seasonArchived&&offseasonStarted&&!offseasonComplete&&(
              <>
                <p>La offseason está en curso. Revisa contratos y mercado antes de comenzar el próximo año.</p>

                <button className="coach-season__complete-action" onClick={onEnterOffseason}>
                  CONTINUAR OFFSEASON <span>→</span>
                </button>
              </>
            )}

            {seasonArchived&&offseasonComplete&&(
              <>
                <p>El mercado cerró y tu plantilla está preparada para la próxima temporada.</p>

                <button className="coach-season__complete-action" onClick={onNextSeason}>
                  CONTINUAR A {season.season+1} <span>→</span>
                </button>
              </>
            )}
          </section>
        )}

      </div>
    </main>
  );
}

/* =========================================================
   MASTERS
========================================================= */

function MastersPanel({masters,playerTeamId}:{masters:CoachMastersState;playerTeamId:string}) {
  const swissMatches=masters.matches.filter(match=>match.stage==="Swiss");
  const playoffMatches=masters.matches.filter(match=>match.stage==="Playoffs");

  return (
    <section className="coach-season__masters">
      <header className="coach-season__masters-head">
        <div>
          <span className="coach-season__eyebrow">{masters.event.toUpperCase()}</span>
          <h2>{masters.phase==="Swiss"?"SWISS STAGE":masters.phase==="Playoffs"?"PLAYOFFS":"EVENTO COMPLETADO"}</h2>
        </div>

        <div className="coach-season__masters-format">
          <span>FORMATO</span>
          <strong>{masters.phase==="Swiss"?"2 VICTORIAS / 2 DERROTAS":"DOUBLE ELIMINATION"}</strong>
        </div>
      </header>

      {masters.phase==="Swiss"&&(
        <>
          <SwissStandings masters={masters} playerTeamId={playerTeamId}/>
          <SwissMatches matches={swissMatches} playerTeamId={playerTeamId}/>
        </>
      )}

      {masters.phase==="Playoffs"&&<MastersPlayoffs matches={playoffMatches} playerTeamId={playerTeamId}/>}

      {masters.phase==="Complete"&&(
        <>
          <MastersPlayoffs matches={playoffMatches} playerTeamId={playerTeamId}/>
          <div className="coach-season__masters-complete">
            <span>{masters.event.toUpperCase()} FINALIZADO</span>
            <strong>EVENTO COMPLETADO</strong>
          </div>
        </>
      )}
    </section>
  );
}

function SwissStandings({masters,playerTeamId}:{masters:CoachMastersState;playerTeamId:string}) {
  const standings=[...masters.swissStandings].sort((a,b)=>{
    if(a.qualified!==b.qualified)return a.qualified?-1:1;
    if(a.eliminated!==b.eliminated)return a.eliminated?1:-1;
    if(b.wins!==a.wins)return b.wins-a.wins;
    return a.losses-b.losses;
  });

  return (
    <section className="coach-season__swiss">
      <header className="coach-season__subsection-head">
        <div><span>SWISS STAGE</span><strong>CLASIFICACIÓN</strong></div>
        <small>2W CLASIFICA · 2L ELIMINA</small>
      </header>

      <div className="coach-season__swiss-table">
        <div className="coach-season__swiss-row coach-season__swiss-row--header">
          <span>#</span><span>EQUIPO</span><span>RÉCORD</span><span>ESTADO</span>
        </div>

        {standings.map((standing,index)=><SwissStandingRow key={standing.teamId} standing={standing} rank={index+1} player={standing.teamId===playerTeamId}/>)}
      </div>
    </section>
  );
}

function SwissStandingRow({standing,rank,player}:{standing:CoachMastersState["swissStandings"][number];rank:number;player:boolean}) {
  const team=getTeamById(standing.teamId);
  const logo=getTeamLogo(team?.logo);

  return (
    <div className={`coach-season__swiss-row${player?" coach-season__swiss-row--player":""}`}>
      <strong>{rank}</strong>

      <div className="coach-season__swiss-team">
        <div>{logo&&<img src={logo} alt={team?.name??""}/>}</div>
        <span>{team?.name??"TBD"}</span>
      </div>

      <strong className="coach-season__swiss-record">{standing.wins}-{standing.losses}</strong>

      <span className={`coach-season__swiss-status ${standing.qualified?"qualified":standing.eliminated?"eliminated":"active"}`}>
        {standing.qualified?"PLAYOFFS":standing.eliminated?"ELIMINADO":"EN JUEGO"}
      </span>
    </div>
  );
}

function SwissMatches({matches,playerTeamId}:{matches:CoachMastersMatch[];playerTeamId:string}) {
  const rounds=["Swiss Round 1","Swiss Round 2","Swiss Round 3"];

  return (
    <section className="coach-season__swiss-matches">
      <header className="coach-season__subsection-head">
        <div><span>RESULTADOS</span><strong>PARTIDOS SWISS</strong></div>
      </header>

      <div className="coach-season__swiss-rounds">
        {rounds.map(round=>{
          const roundMatches=matches.filter(match=>match.round===round);
          if(!roundMatches.length)return null;

          return (
            <div key={round} className="coach-season__swiss-round">
              <span>{round.toUpperCase()}</span>
              <div>{roundMatches.map(match=><TournamentMatchCard key={match.id} match={match} playerTeamId={playerTeamId}/>)}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MastersPlayoffs({matches,playerTeamId}:{matches:CoachMastersMatch[];playerTeamId:string}) {
  return (
    <section className="coach-season__masters-playoffs">
      <header className="coach-season__subsection-head">
        <div><span>PLAYOFFS</span><strong>DOUBLE ELIMINATION</strong></div>
        <small>LOWER FINAL + GRAND FINAL · BO5</small>
      </header>

      <div className="coach-season__playoff-groups">
        <PlayoffSection title="UPPER BRACKET" rounds={["Upper Quarterfinal","Upper Semifinal","Upper Final"]} matches={matches} playerTeamId={playerTeamId}/>
        <PlayoffSection title="LOWER BRACKET" rounds={["Lower Round 1","Lower Round 2","Lower Round 3","Lower Final"]} matches={matches} playerTeamId={playerTeamId}/>
        <PlayoffSection title="GRAND FINAL" rounds={["Grand Final"]} matches={matches} playerTeamId={playerTeamId}/>
      </div>
    </section>
  );
}

/* =========================================================
   STAGE 1 / STAGE 2
========================================================= */

function StagePanel({stage,playerTeamId}:{stage:CoachStageState;playerTeamId:string}) {
  const regularMatches=stage.matches.filter(match=>match.phase==="Regular Season");
  const playoffMatches=stage.matches.filter(match=>match.phase==="Playoffs");

  return (
    <section className="coach-season__stage">
      <header className="coach-season__masters-head">
        <div>
          <span className="coach-season__eyebrow">{stage.event.toUpperCase()}</span>
          <h2>{stage.phase==="Regular Season"?"REGULAR SEASON":stage.phase==="Playoffs"?"PLAYOFFS":"EVENTO COMPLETADO"}</h2>
        </div>

        <div className="coach-season__masters-format">
          <span>FORMATO</span>
          <strong>{stage.phase==="Regular Season"?"GROUP STAGE · TOP 4":"DOUBLE ELIMINATION"}</strong>
        </div>
      </header>

      {stage.phase==="Regular Season"&&(
        <>
          <StageStandings stage={stage} playerTeamId={playerTeamId}/>
          <StageSchedule matches={regularMatches} playerTeamId={playerTeamId}/>
        </>
      )}

      {stage.phase==="Playoffs"&&<StagePlayoffs matches={playoffMatches} playerTeamId={playerTeamId}/>}

      {stage.phase==="Complete"&&(
        <>
          <StageStandings stage={stage} playerTeamId={playerTeamId}/>
          <StagePlayoffs matches={playoffMatches} playerTeamId={playerTeamId}/>

          <div className="coach-season__masters-complete">
            <span>{stage.event.toUpperCase()} FINALIZADO</span>
            <strong>EVENTO COMPLETADO</strong>
          </div>
        </>
      )}
    </section>
  );
}

function StageStandings({stage,playerTeamId}:{stage:CoachStageState;playerTeamId:string}) {
  return (
    <div className="coach-season__stage-groups">
      <StageGroupTable stage={stage} group="Alpha" playerTeamId={playerTeamId}/>
      <StageGroupTable stage={stage} group="Omega" playerTeamId={playerTeamId}/>
    </div>
  );
}

function StageGroupTable({stage,group,playerTeamId}:{stage:CoachStageState;group:"Alpha"|"Omega";playerTeamId:string}) {
  const standings=stage.standings
    .filter(standing=>standing.group===group)
    .sort((a,b)=>{
      if(b.wins!==a.wins)return b.wins-a.wins;
      const diffA=a.mapsWon-a.mapsLost;
      const diffB=b.mapsWon-b.mapsLost;
      if(diffB!==diffA)return diffB-diffA;
      return b.mapsWon-a.mapsWon;
    });

  return (
    <section className="coach-season__stage-group">
      <header className="coach-season__subsection-head">
        <div><span>GROUP</span><strong>{group.toUpperCase()}</strong></div>
        <small>TOP 4 → PLAYOFFS</small>
      </header>

      <div className="coach-season__stage-table">
        <div className="coach-season__stage-row coach-season__stage-row--header">
          <span>#</span><span>EQUIPO</span><span>W-L</span><span>MAPAS</span><span>DIFF</span>
        </div>

        {standings.map((standing,index)=>{
          const team=getTeamById(standing.teamId);
          const logo=getTeamLogo(team?.logo);
          const difference=standing.mapsWon-standing.mapsLost;
          const player=standing.teamId===playerTeamId;

          return (
            <div key={standing.teamId} className={`coach-season__stage-row${player?" coach-season__stage-row--player":""}${index<4?" coach-season__stage-row--qualified":""}`}>
              <strong>{index+1}</strong>

              <div className="coach-season__stage-team">
                <span>{logo&&<img src={logo} alt={team?.name??""}/>}</span>
                <strong>{team?.shortName??"TBD"}</strong>
              </div>

              <strong>{standing.wins}-{standing.losses}</strong>
              <span>{standing.mapsWon}-{standing.mapsLost}</span>
              <b className={difference>0?"positive":difference<0?"negative":""}>{difference>0?"+":""}{difference}</b>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StageSchedule({matches,playerTeamId}:{matches:CoachStageMatch[];playerTeamId:string}) {
  const [expanded,setExpanded]=useState(false);
  const rounds=Array.from(new Set(matches.map(match=>match.round)));

  return (
    <section className={`coach-season__stage-schedule${expanded?" coach-season__stage-schedule--expanded":""}`}>
      <button className="coach-season__stage-schedule-toggle" onClick={()=>setExpanded(value=>!value)}>
        <div>
          <span>REGULAR SEASON</span>
          <strong>CALENDARIO</strong>
          <small>{expanded?"OCULTAR PARTIDOS":"VER CALENDARIO COMPLETO"}</small>
        </div>

        <b className={expanded?"expanded":""}>⌄</b>
      </button>

      {expanded&&(
        <div className="coach-season__stage-weeks">
          {rounds.map(round=>{
            const roundMatches=matches.filter(match=>match.round===round);

            return (
              <div key={round} className="coach-season__stage-week">
                <span>{round.toUpperCase()}</span>
                <div>{roundMatches.map(match=><TournamentMatchCard key={match.id} match={match} playerTeamId={playerTeamId}/>)}</div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function StagePlayoffs({matches,playerTeamId}:{matches:CoachStageMatch[];playerTeamId:string}) {
  return (
    <section className="coach-season__masters-playoffs">
      <header className="coach-season__subsection-head">
        <div><span>PLAYOFFS</span><strong>DOUBLE ELIMINATION</strong></div>
        <small>LOWER FINAL + GRAND FINAL · BO5</small>
      </header>

      <div className="coach-season__playoff-groups">
        <PlayoffSection title="UPPER BRACKET" rounds={["Upper Round 1","Upper Semifinal","Upper Final"]} matches={matches} playerTeamId={playerTeamId}/>
        <PlayoffSection title="LOWER BRACKET" rounds={["Lower Round 1","Lower Round 2","Lower Round 3","Lower Final"]} matches={matches} playerTeamId={playerTeamId}/>
        <PlayoffSection title="GRAND FINAL" rounds={["Grand Final"]} matches={matches} playerTeamId={playerTeamId}/>
      </div>
    </section>
  );
}

/* =========================================================
   SHARED MATCHES
========================================================= */

function PlayoffSection({title,rounds,matches,playerTeamId}:{title:string;rounds:string[];matches:TournamentMatch[];playerTeamId:string}) {
  return (
    <div className="coach-season__playoff-section">
      <header>{title}</header>

      <div className="coach-season__playoff-rounds">
        {rounds.map(round=>{
          const roundMatches=matches.filter(match=>match.round===round);
          if(!roundMatches.length)return null;

          return (
            <div key={round} className="coach-season__playoff-round">
              <span>{round.toUpperCase()}</span>
              <div>{roundMatches.map(match=><TournamentMatchCard key={match.id} match={match} playerTeamId={playerTeamId}/>)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TournamentMatchCard({match,playerTeamId}:{match:TournamentMatch;playerTeamId:string}) {
  const playerMatch=match.teamAId===playerTeamId||match.teamBId===playerTeamId;

  return (
    <article className={`coach-season__masters-match${playerMatch?" coach-season__masters-match--player":""}`}>
      <header>
        <span>BO{match.bestOf}</span>
        <small>{match.status==="Complete"?"FINAL":match.status==="Ready"?"LISTO":"PENDIENTE"}</small>
      </header>

      <TournamentMatchTeam teamId={match.teamAId} score={match.scoreA} winner={Boolean(match.teamAId)&&match.winnerId===match.teamAId}/>
      <TournamentMatchTeam teamId={match.teamBId} score={match.scoreB} winner={Boolean(match.teamBId)&&match.winnerId===match.teamBId}/>
    </article>
  );
}

function TournamentMatchTeam({teamId,score,winner}:{teamId:string|null;score:number|null;winner:boolean}) {
  const team=teamId?getTeamById(teamId):undefined;
  const logo=getTeamLogo(team?.logo);

  return (
    <div className={`coach-season__masters-match-team${winner?" coach-season__masters-match-team--winner":""}`}>
      <div>
        <span className="coach-season__masters-match-logo">{logo&&<img src={logo} alt={team?.name??""}/>}</span>
        <strong>{team?.shortName??"TBD"}</strong>
      </div>

      <b>{score??"-"}</b>
    </div>
  );
}

/* =========================================================
   GENERAL
========================================================= */

function SeasonPhaseTile({tile,state}:{tile:SeasonTile;state:"active"|"complete"|"locked"}) {
  return (
    <article className={`coach-season__phase-tile coach-season__phase-tile--${state}`}>
      <img src={tile.image} alt={tile.label}/>
      <div className="coach-season__phase-overlay"/>
      <div className="coach-season__phase-content"><strong>{tile.label}</strong><small>{state==="active"?"ACTIVO":state==="complete"?"COMPLETADO":"BLOQUEADO"}</small></div>
    </article>
  );
}

function MatchTeam({teamId,reverse=false}:{teamId:string;reverse?:boolean}) {
  const team=getTeamById(teamId);
  const logo=getTeamLogo(team?.logo);

  return (
    <div className={`coach-season__match-team ${reverse?"coach-season__match-team--reverse":""}`}>
      <div className="coach-season__match-logo">{logo?<img src={logo} alt={team?.name??""}/>:<span>{team?.shortName??"TBD"}</span>}</div>
      <div className="coach-season__match-team-info"><strong>{team?.name??"TBD"}</strong><small>{team?.shortName??"-"}</small></div>
    </div>
  );
}

function getWins(career:CoachCareerState) {
  if(!career.seasonState)return 0;
  return Object.values(career.seasonState.events).flatMap(event=>event.matches).filter(match=>match.won).length;
}

function getLosses(career:CoachCareerState) {
  if(!career.seasonState)return 0;
  return Object.values(career.seasonState.events).flatMap(event=>event.matches).filter(match=>!match.won).length;
}

function isTileActive(currentPhase:CoachVCTPhase,tilePhase:CoachSeasonBannerKey) {
  if(currentPhase==="Stage 1 Playoffs")return tilePhase==="Stage 1";
  if(currentPhase==="Stage 2 Playoffs")return tilePhase==="Stage 2";
  if(currentPhase==="Complete")return false;
  return currentPhase===tilePhase;
}

function isTileCompleted(currentPhase:CoachVCTPhase,tilePhase:CoachSeasonBannerKey) {
  if(currentPhase==="Complete")return true;

  const order:CoachSeasonBannerKey[]=["Kickoff","Masters 1","Stage 1","Masters 2","Stage 2","Champions"];
  const currentIndex=order.indexOf(getBroadPhase(currentPhase));
  const tileIndex=order.indexOf(tilePhase);

  return tileIndex<currentIndex;
}

function getBroadPhase(phase:CoachVCTPhase):CoachSeasonBannerKey {
  if(phase==="Kickoff")return "Kickoff";
  if(phase==="Masters 1")return "Masters 1";
  if(phase==="Stage 1"||phase==="Stage 1 Playoffs")return "Stage 1";
  if(phase==="Masters 2")return "Masters 2";
  if(phase==="Stage 2"||phase==="Stage 2 Playoffs")return "Stage 2";
  return "Champions";
}

function getPhaseHeroTitle(phase:CoachVCTPhase) {
  if(phase==="Stage 1 Playoffs")return "STAGE 1";
  if(phase==="Stage 2 Playoffs")return "STAGE 2";
  if(phase==="Complete")return "TEMPORADA COMPLETA";
  return phase.toUpperCase();
}

function getPhaseDescription(phase:CoachVCTPhase) {
  if(phase==="Kickoff")return "El primer torneo del año. Tres derrotas significan eliminación y los mejores equipos avanzan al primer Masters.";
  if(phase==="Masters 1")return "Primer evento internacional del año. Los seeds 2 y 3 disputan Swiss mientras los campeones regionales esperan en Playoffs.";
  if(phase==="Stage 1"||phase==="Stage 1 Playoffs")return "Primer Stage regional de la temporada con fase regular y playoffs.";
  if(phase==="Masters 2")return "Segundo evento internacional del año con el mismo formato competitivo del primer Masters.";
  if(phase==="Stage 2"||phase==="Stage 2 Playoffs")return "Último Stage regional antes de Champions, con fase regular y playoffs.";
  if(phase==="Champions")return "El torneo más importante de la temporada. Aquí se corona al campeón mundial.";
  return "La temporada competitiva ha terminado.";
}

function getMatchRoundLabel(phase:CoachVCTPhase) {
  if(phase==="Masters 1"||phase==="Masters 2")return "INTERNATIONAL MATCH";
  if(phase==="Stage 1")return "STAGE 1";
  if(phase==="Stage 1 Playoffs")return "STAGE 1 PLAYOFFS";
  if(phase==="Stage 2")return "STAGE 2";
  if(phase==="Stage 2 Playoffs")return "STAGE 2 PLAYOFFS";
  if(phase==="Champions")return "CHAMPIONS";
  return "KICKOFF";
}

function getCompetitionLabel(phase:CoachVCTPhase) {
  if(phase==="Kickoff")return "VCT Kickoff";
  if(phase==="Masters 1")return "Masters 1";
  if(phase==="Stage 1"||phase==="Stage 1 Playoffs")return "VCT Stage 1";
  if(phase==="Masters 2")return "Masters 2";
  if(phase==="Stage 2"||phase==="Stage 2 Playoffs")return "VCT Stage 2";
  if(phase==="Champions")return "Valorant Champions";
  return "VCT";
}

function getNoOpponentMessage(
  phase:CoachVCTPhase,
  qualified?:boolean,
  eliminated?:boolean,
  masters?:CoachMastersState,
  stage?:CoachStageState,
  playerTeamId?:string,
) {
  if(phase==="Kickoff"){
    if(qualified)return "Clasificaste a Masters. No quedan partidos pendientes de Kickoff.";
    if(eliminated)return "Tu equipo fue eliminado del Kickoff.";
    return "No hay un partido disponible en este momento.";
  }

  if((phase==="Masters 1"||phase==="Masters 2")&&masters){
    const qualifier=masters.qualifiers.find(team=>team.teamId===playerTeamId);

    if(masters.phase==="Swiss"&&qualifier?.seed===1)return "Clasificaste directamente a Playoffs como campeón regional. El Swiss se está disputando.";
    if(masters.phase==="Complete")return `${masters.event} ha terminado.`;
    return "No hay un partido disponible en este momento.";
  }

  if((phase==="Stage 1"||phase==="Stage 1 Playoffs"||phase==="Stage 2"||phase==="Stage 2 Playoffs")&&stage){
    if(stage.complete)return `${stage.event} ha terminado.`;
    if(stage.phase==="Playoffs"&&!stage.playoffSeeds.includes(playerTeamId??""))return "Tu equipo no clasificó a los Playoffs.";
    return "No hay un partido disponible en este momento.";
  }

  if(phase==="Champions")return "Champions todavía no está implementado.";

  return "No hay rival disponible.";
}