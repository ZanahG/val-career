import {useState} from "react";
import type {CoachCareerState,CoachChampionsMatch,CoachChampionsState,CoachMastersMatch,CoachMastersState,CoachStageMatch,CoachStageState,CoachVCTPhase} from "../../types/coach";
import {getTeamById} from "../../data/teams";
import {getNextPlayerChampionsMatch} from "../../logic/championsBracket";
import {isCoachSeasonFinished} from "../../logic/coachCareerProgression";
import {getNextCoachOpponent} from "../../logic/coachVCTSeason";
import {getNextPlayerKickoffMatch} from "../../logic/kickoffBracket";
import {getNextPlayerMastersMatch} from "../../logic/mastersBracket";
import {getNextPlayerStageMatch} from "../../logic/coachStage";
import {useGameSettings} from "../../context/GameSettingsContext";
import {GameSettingsControls} from "../shared/GameSettingsControls";
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

type Language="es"|"en";
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

function ChampionsPanel({champions,playerTeamId,language}:{champions:CoachChampionsState;playerTeamId:string;language:Language}) {
  const es=language==="es";
  const groupMatches=champions.matches.filter(match=>match.stage==="Groups");
  const playoffMatches=champions.matches.filter(match=>match.stage==="Playoffs");

  return (
    <section className="coach-season__champions">
      <header className="coach-season__masters-head">
        <div>
          <span className="coach-season__eyebrow">VALORANT CHAMPIONS</span>
          <h2>{champions.phase==="Groups"?(es?"FASE DE GRUPOS":"GROUP STAGE"):champions.phase==="Playoffs"?"PLAYOFFS":es?"EVENTO COMPLETADO":"EVENT COMPLETE"}</h2>
        </div>

        <div className="coach-season__masters-format">
          <span>{es?"FORMATO":"FORMAT"}</span>
          <strong>{champions.phase==="Groups"?(es?"4 GRUPOS · GSL":"4 GROUPS · GSL"):"DOUBLE ELIMINATION"}</strong>
        </div>
      </header>

      {champions.phase==="Groups"&&(
        <>
          <ChampionsGroups champions={champions} playerTeamId={playerTeamId} language={language}/>
          <ChampionsGroupMatches matches={groupMatches} playerTeamId={playerTeamId} language={language}/>
        </>
      )}

      {champions.phase==="Playoffs"&&<ChampionsPlayoffs matches={playoffMatches} playerTeamId={playerTeamId} language={language}/>}

      {champions.phase==="Complete"&&(
        <>
          <ChampionsPlayoffs matches={playoffMatches} playerTeamId={playerTeamId} language={language}/>

          <div className="coach-season__masters-complete">
            <span>{es?"VALORANT CHAMPIONS FINALIZADO":"VALORANT CHAMPIONS COMPLETE"}</span>
            <strong>{champions.championTeamId===playerTeamId?(es?"CAMPEÓN DEL MUNDO":"WORLD CHAMPION"):(es?"EVENTO COMPLETADO":"EVENT COMPLETE")}</strong>
          </div>
        </>
      )}
    </section>
  );
}

function ChampionsGroups({champions,playerTeamId,language}:{champions:CoachChampionsState;playerTeamId:string;language:Language}) {
  return (
    <div className="coach-season__champions-groups">
      {(["A","B","C","D"] as const).map(group=>(
        <ChampionsGroup key={group} champions={champions} group={group} playerTeamId={playerTeamId} language={language}/>
      ))}
    </div>
  );
}

function ChampionsGroup({champions,group,playerTeamId,language}:{champions:CoachChampionsState;group:"A"|"B"|"C"|"D";playerTeamId:string;language:Language}) {
  const es=language==="es";

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
          <strong>{es?"GRUPO":"GROUP"} {group}</strong>
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
                {standing.qualified?"PLAYOFFS":standing.eliminated?(es?"FUERA":"OUT"):(es?"EN JUEGO":"LIVE")}
              </em>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ChampionsGroupMatches({matches,playerTeamId,language}:{matches:CoachChampionsMatch[];playerTeamId:string;language:Language}) {
  const es=language==="es";
  const groups=["A","B","C","D"] as const;

  return (
    <section className="coach-season__champions-matches">
      <header className="coach-season__subsection-head">
        <div>
          <span>{es?"FASE DE GRUPOS":"GROUP STAGE"}</span>
          <strong>{es?"PARTIDOS":"MATCHES"}</strong>
        </div>

        <small>OPENING · WINNERS · ELIMINATION · DECIDER</small>
      </header>

      <div className="coach-season__champions-match-groups">
        {groups.map(group=>{
          const groupMatches=matches.filter(match=>match.group===group);

          return (
            <div key={group} className="coach-season__champions-match-group">
              <span>{es?"GRUPO":"GROUP"} {group}</span>

              <div>
                {groupMatches.map(match=><TournamentMatchCard key={match.id} match={match} playerTeamId={playerTeamId} language={language}/>)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ChampionsPlayoffs({matches,playerTeamId,language}:{matches:CoachChampionsMatch[];playerTeamId:string;language:Language}) {
  return (
    <section className="coach-season__masters-playoffs">
      <header className="coach-season__subsection-head">
        <div><span>CHAMPIONS PLAYOFFS</span><strong>DOUBLE ELIMINATION</strong></div>
        <small>LOWER FINAL + GRAND FINAL · BO5</small>
      </header>

      <div className="coach-season__playoff-groups">
        <PlayoffSection title="UPPER BRACKET" rounds={["Upper Quarterfinal","Upper Semifinal","Upper Final"]} matches={matches} playerTeamId={playerTeamId} language={language}/>
        <PlayoffSection title="LOWER BRACKET" rounds={["Lower Round 1","Lower Round 2","Lower Round 3","Lower Final"]} matches={matches} playerTeamId={playerTeamId} language={language}/>
        <PlayoffSection title="GRAND FINAL" rounds={["Grand Final"]} matches={matches} playerTeamId={playerTeamId} language={language}/>
      </div>
    </section>
  );
}

/* =========================================================
   MAIN
========================================================= */

export function CoachSeason({career,onStartSeason,onPrepareMatch,onFinishSeason,onEnterOffseason,onNextSeason,onBack}:CoachSeasonProps) {
  const {language}=useGameSettings();
  const es=language==="es";

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
          {es?"MENÚ":"MENU"}
        </button>

        <div className="coach-season__shell">
          <header className="coach-season__topbar">
            <div className="coach-season__club">
              <div className="coach-season__club-logo">{teamLogo?<img src={teamLogo} alt={team?.name??""}/>:<span>{team?.shortName??"TBD"}</span>}</div>
              <div><span>VCT {career.coach.circuit}</span><strong>{team?.name} · {career.coach.season}</strong></div>
            </div>

            <GameSettingsControls/>
          </header>

          <section className="coach-season__start">
            <span className="coach-season__eyebrow">{es?"TEMPORADA":"SEASON"} {career.coach.season}</span>
            <h1>{es?"COMENZAR TEMPORADA":"START SEASON"}</h1>
            <p>{es?`Comienza un nuevo año competitivo al mando de ${team?.name}.`:`Begin a new competitive year in charge of ${team?.name}.`}</p>

            <div className="coach-season__phase-strip">
              {SEASON_TILES.map((tile,index)=><SeasonPhaseTile key={tile.phase} tile={tile} state={index===0?"active":"locked"} language={language}/>)}
            </div>

            <button className="coach-season__start-button" onClick={onStartSeason}>
              {es?"COMENZAR TEMPORADA":"START SEASON"} <span>→</span>
            </button>
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
    getMatchRoundLabel(season.phase,language);

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
          <span>{es?"PREPARAR PARTIDO":"PREPARE MATCH"}</span>
          <b>→</b>
        </button>
      )}

      <div className="coach-season__shell">
        <header className="coach-season__topbar">
          <div className="coach-season__club">
            <div className="coach-season__club-logo">{teamLogo?<img src={teamLogo} alt={team?.name??""}/>:<span>{team?.shortName??"TBD"}</span>}</div>
            <div><span>VCT {season.circuit}</span><strong>{team?.name} · {season.season}</strong></div>
          </div>

          <GameSettingsControls/>
        </header>

        <div className="coach-season__phase-strip">
          {SEASON_TILES.map(tile=>{
            const active=isTileActive(season.phase,tile.phase);
            const completed=isTileCompleted(season.phase,tile.phase);
            const state=active?"active":completed?"complete":"locked";

            return <SeasonPhaseTile key={tile.phase} tile={tile} state={state} language={language}/>;
          })}
        </div>

        {season.phase!=="Complete"&&(
          <section className="coach-season__match-center">
            <header className="coach-season__match-center-head">
              <div><span>{roundLabel}</span><h2>{es?"PRÓXIMO PARTIDO":"NEXT MATCH"}</h2></div>
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
                  <div><span>{es?"TORNEO":"TOURNAMENT"}</span><strong>{getCompetitionLabel(season.phase)}</strong></div>
                  <div><span>{es?"FORMATO":"FORMAT"}</span><strong>Best of {bestOf}</strong></div>
                  <div><span>{es?"REGIÓN":"REGION"}</span><strong>{international?(es?"INTERNACIONAL":"INTERNATIONAL"):season.circuit}</strong></div>
                  <div><span>{es?"RÉCORD":"RECORD"}</span><strong>{annualWins}-{annualLosses}</strong></div>
                </footer>
              </>
            ):(
              <div className="coach-season__match-empty">
                {getNoOpponentMessage(
                  season.phase,
                  language,
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
          <MastersPanel masters={currentMasters} playerTeamId={career.team.teamId} language={language}/>
        )}

        {(season.phase==="Stage 1"||season.phase==="Stage 1 Playoffs"||season.phase==="Stage 2"||season.phase==="Stage 2 Playoffs")&&currentStage&&(
          <StagePanel stage={currentStage} playerTeamId={career.team.teamId} language={language}/>
        )}

        {season.phase==="Champions"&&season.champions&&(
          <ChampionsPanel champions={season.champions} playerTeamId={career.team.teamId} language={language}/>
        )}

        {season.phase==="Complete"&&(
          <section className="coach-season__complete">
            <span className="coach-season__eyebrow">{es?"FIN DE TEMPORADA":"END OF SEASON"}</span>
            <h2>{season.season} {es?"COMPLETADO":"COMPLETE"}</h2>

            {!seasonArchived&&(
              <>
                <p>{es?"La temporada competitiva ha finalizado. Guarda los resultados del año antes de continuar.":"The competitive season has ended. Save the year's results before continuing."}</p>

                <button className="coach-season__complete-action" onClick={onFinishSeason}>
                  {es?"FINALIZAR TEMPORADA":"FINISH SEASON"} <span>→</span>
                </button>
              </>
            )}

            {seasonArchived&&!offseasonStarted&&(
              <>
                <p>{es?"La temporada quedó guardada. Es momento de preparar el plantel para el próximo año.":"The season has been archived. It is time to prepare the roster for next year."}</p>

                <button className="coach-season__complete-action" onClick={onEnterOffseason}>
                  {es?"ENTRAR A OFFSEASON":"ENTER OFFSEASON"} <span>→</span>
                </button>
              </>
            )}

            {seasonArchived&&offseasonStarted&&!offseasonComplete&&(
              <>
                <p>{es?"La offseason está en curso. Revisa contratos y mercado antes de comenzar el próximo año.":"The offseason is in progress. Review contracts and the market before starting next year."}</p>

                <button className="coach-season__complete-action" onClick={onEnterOffseason}>
                  {es?"CONTINUAR OFFSEASON":"CONTINUE OFFSEASON"} <span>→</span>
                </button>
              </>
            )}

            {seasonArchived&&offseasonComplete&&(
              <>
                <p>{es?"El mercado cerró y tu plantilla está preparada para la próxima temporada.":"The market is closed and your roster is ready for next season."}</p>

                <button className="coach-season__complete-action" onClick={onNextSeason}>
                  {es?"CONTINUAR A":"CONTINUE TO"} {season.season+1} <span>→</span>
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

function MastersPanel({masters,playerTeamId,language}:{masters:CoachMastersState;playerTeamId:string;language:Language}) {
  const es=language==="es";
  const swissMatches=masters.matches.filter(match=>match.stage==="Swiss");
  const playoffMatches=masters.matches.filter(match=>match.stage==="Playoffs");

  return (
    <section className="coach-season__masters">
      <header className="coach-season__masters-head">
        <div>
          <span className="coach-season__eyebrow">{masters.event.toUpperCase()}</span>
          <h2>{masters.phase==="Swiss"?"SWISS STAGE":masters.phase==="Playoffs"?"PLAYOFFS":es?"EVENTO COMPLETADO":"EVENT COMPLETE"}</h2>
        </div>

        <div className="coach-season__masters-format">
          <span>{es?"FORMATO":"FORMAT"}</span>
          <strong>{masters.phase==="Swiss"?(es?"2 VICTORIAS / 2 DERROTAS":"2 WINS / 2 LOSSES"):"DOUBLE ELIMINATION"}</strong>
        </div>
      </header>

      {masters.phase==="Swiss"&&(
        <>
          <SwissStandings masters={masters} playerTeamId={playerTeamId} language={language}/>
          <SwissMatches matches={swissMatches} playerTeamId={playerTeamId} language={language}/>
        </>
      )}

      {masters.phase==="Playoffs"&&<MastersPlayoffs matches={playoffMatches} playerTeamId={playerTeamId} language={language}/>}

      {masters.phase==="Complete"&&(
        <>
          <MastersPlayoffs matches={playoffMatches} playerTeamId={playerTeamId} language={language}/>

          <div className="coach-season__masters-complete">
            <span>{masters.event.toUpperCase()} {es?"FINALIZADO":"COMPLETE"}</span>
            <strong>{es?"EVENTO COMPLETADO":"EVENT COMPLETE"}</strong>
          </div>
        </>
      )}
    </section>
  );
}

function SwissStandings({masters,playerTeamId,language}:{masters:CoachMastersState;playerTeamId:string;language:Language}) {
  const es=language==="es";

  const standings=[...masters.swissStandings].sort((a,b)=>{
    if(a.qualified!==b.qualified)return a.qualified?-1:1;
    if(a.eliminated!==b.eliminated)return a.eliminated?1:-1;
    if(b.wins!==a.wins)return b.wins-a.wins;
    return a.losses-b.losses;
  });

  return (
    <section className="coach-season__swiss">
      <header className="coach-season__subsection-head">
        <div><span>SWISS STAGE</span><strong>{es?"CLASIFICACIÓN":"STANDINGS"}</strong></div>
        <small>{es?"2W CLASIFICA · 2L ELIMINA":"2W QUALIFIES · 2L ELIMINATES"}</small>
      </header>

      <div className="coach-season__swiss-table">
        <div className="coach-season__swiss-row coach-season__swiss-row--header">
          <span>#</span><span>{es?"EQUIPO":"TEAM"}</span><span>{es?"RÉCORD":"RECORD"}</span><span>{es?"ESTADO":"STATUS"}</span>
        </div>

        {standings.map((standing,index)=>(
          <SwissStandingRow key={standing.teamId} standing={standing} rank={index+1} player={standing.teamId===playerTeamId} language={language}/>
        ))}
      </div>
    </section>
  );
}

function SwissStandingRow({standing,rank,player,language}:{standing:CoachMastersState["swissStandings"][number];rank:number;player:boolean;language:Language}) {
  const es=language==="es";
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
        {standing.qualified?"PLAYOFFS":standing.eliminated?(es?"ELIMINADO":"ELIMINATED"):(es?"EN JUEGO":"ACTIVE")}
      </span>
    </div>
  );
}

function SwissMatches({matches,playerTeamId,language}:{matches:CoachMastersMatch[];playerTeamId:string;language:Language}) {
  const es=language==="es";
  const rounds=["Swiss Round 1","Swiss Round 2","Swiss Round 3"];

  return (
    <section className="coach-season__swiss-matches">
      <header className="coach-season__subsection-head">
        <div><span>{es?"RESULTADOS":"RESULTS"}</span><strong>{es?"PARTIDOS SWISS":"SWISS MATCHES"}</strong></div>
      </header>

      <div className="coach-season__swiss-rounds">
        {rounds.map(round=>{
          const roundMatches=matches.filter(match=>match.round===round);
          if(!roundMatches.length)return null;

          return (
            <div key={round} className="coach-season__swiss-round">
              <span>{round.toUpperCase()}</span>
              <div>{roundMatches.map(match=><TournamentMatchCard key={match.id} match={match} playerTeamId={playerTeamId} language={language}/>)}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MastersPlayoffs({matches,playerTeamId,language}:{matches:CoachMastersMatch[];playerTeamId:string;language:Language}) {
  return (
    <section className="coach-season__masters-playoffs">
      <header className="coach-season__subsection-head">
        <div><span>PLAYOFFS</span><strong>DOUBLE ELIMINATION</strong></div>
        <small>LOWER FINAL + GRAND FINAL · BO5</small>
      </header>

      <div className="coach-season__playoff-groups">
        <PlayoffSection title="UPPER BRACKET" rounds={["Upper Quarterfinal","Upper Semifinal","Upper Final"]} matches={matches} playerTeamId={playerTeamId} language={language}/>
        <PlayoffSection title="LOWER BRACKET" rounds={["Lower Round 1","Lower Round 2","Lower Round 3","Lower Final"]} matches={matches} playerTeamId={playerTeamId} language={language}/>
        <PlayoffSection title="GRAND FINAL" rounds={["Grand Final"]} matches={matches} playerTeamId={playerTeamId} language={language}/>
      </div>
    </section>
  );
}

/* =========================================================
   STAGE 1 / STAGE 2
========================================================= */

function StagePanel({stage,playerTeamId,language}:{stage:CoachStageState;playerTeamId:string;language:Language}) {
  const es=language==="es";
  const regularMatches=stage.matches.filter(match=>match.phase==="Regular Season");
  const playoffMatches=stage.matches.filter(match=>match.phase==="Playoffs");

  return (
    <section className="coach-season__stage">
      <header className="coach-season__masters-head">
        <div>
          <span className="coach-season__eyebrow">{stage.event.toUpperCase()}</span>
          <h2>{stage.phase==="Regular Season"?(es?"TEMPORADA REGULAR":"REGULAR SEASON"):stage.phase==="Playoffs"?"PLAYOFFS":es?"EVENTO COMPLETADO":"EVENT COMPLETE"}</h2>
        </div>

        <div className="coach-season__masters-format">
          <span>{es?"FORMATO":"FORMAT"}</span>
          <strong>{stage.phase==="Regular Season"?(es?"FASE DE GRUPOS · TOP 4":"GROUP STAGE · TOP 4"):"DOUBLE ELIMINATION"}</strong>
        </div>
      </header>

      {stage.phase==="Regular Season"&&(
        <>
          <StageStandings stage={stage} playerTeamId={playerTeamId} language={language}/>
          <StageSchedule matches={regularMatches} playerTeamId={playerTeamId} language={language}/>
        </>
      )}

      {stage.phase==="Playoffs"&&<StagePlayoffs matches={playoffMatches} playerTeamId={playerTeamId} language={language}/>}

      {stage.phase==="Complete"&&(
        <>
          <StageStandings stage={stage} playerTeamId={playerTeamId} language={language}/>
          <StagePlayoffs matches={playoffMatches} playerTeamId={playerTeamId} language={language}/>

          <div className="coach-season__masters-complete">
            <span>{stage.event.toUpperCase()} {es?"FINALIZADO":"COMPLETE"}</span>
            <strong>{es?"EVENTO COMPLETADO":"EVENT COMPLETE"}</strong>
          </div>
        </>
      )}
    </section>
  );
}

function StageStandings({stage,playerTeamId,language}:{stage:CoachStageState;playerTeamId:string;language:Language}) {
  return (
    <div className="coach-season__stage-groups">
      <StageGroupTable stage={stage} group="Alpha" playerTeamId={playerTeamId} language={language}/>
      <StageGroupTable stage={stage} group="Omega" playerTeamId={playerTeamId} language={language}/>
    </div>
  );
}

function StageGroupTable({stage,group,playerTeamId,language}:{stage:CoachStageState;group:"Alpha"|"Omega";playerTeamId:string;language:Language}) {
  const es=language==="es";

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
        <div><span>{es?"GRUPO":"GROUP"}</span><strong>{group.toUpperCase()}</strong></div>
        <small>TOP 4 → PLAYOFFS</small>
      </header>

      <div className="coach-season__stage-table">
        <div className="coach-season__stage-row coach-season__stage-row--header">
          <span>#</span><span>{es?"EQUIPO":"TEAM"}</span><span>W-L</span><span>{es?"MAPAS":"MAPS"}</span><span>DIFF</span>
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

function StageSchedule({matches,playerTeamId,language}:{matches:CoachStageMatch[];playerTeamId:string;language:Language}) {
  const es=language==="es";
  const [expanded,setExpanded]=useState(false);
  const rounds=Array.from(new Set(matches.map(match=>match.round)));

  return (
    <section className={`coach-season__stage-schedule${expanded?" coach-season__stage-schedule--expanded":""}`}>
      <button className="coach-season__stage-schedule-toggle" onClick={()=>setExpanded(value=>!value)}>
        <div>
          <span>{es?"TEMPORADA REGULAR":"REGULAR SEASON"}</span>
          <strong>{es?"CALENDARIO":"SCHEDULE"}</strong>
          <small>{expanded?(es?"OCULTAR PARTIDOS":"HIDE MATCHES"):(es?"VER CALENDARIO COMPLETO":"VIEW FULL SCHEDULE")}</small>
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
                <div>{roundMatches.map(match=><TournamentMatchCard key={match.id} match={match} playerTeamId={playerTeamId} language={language}/>)}</div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function StagePlayoffs({matches,playerTeamId,language}:{matches:CoachStageMatch[];playerTeamId:string;language:Language}) {
  return (
    <section className="coach-season__masters-playoffs">
      <header className="coach-season__subsection-head">
        <div><span>PLAYOFFS</span><strong>DOUBLE ELIMINATION</strong></div>
        <small>LOWER FINAL + GRAND FINAL · BO5</small>
      </header>

      <div className="coach-season__playoff-groups">
        <PlayoffSection title="UPPER BRACKET" rounds={["Upper Round 1","Upper Semifinal","Upper Final"]} matches={matches} playerTeamId={playerTeamId} language={language}/>
        <PlayoffSection title="LOWER BRACKET" rounds={["Lower Round 1","Lower Round 2","Lower Round 3","Lower Final"]} matches={matches} playerTeamId={playerTeamId} language={language}/>
        <PlayoffSection title="GRAND FINAL" rounds={["Grand Final"]} matches={matches} playerTeamId={playerTeamId} language={language}/>
      </div>
    </section>
  );
}

/* =========================================================
   SHARED MATCHES
========================================================= */

function PlayoffSection({title,rounds,matches,playerTeamId,language}:{title:string;rounds:string[];matches:TournamentMatch[];playerTeamId:string;language:Language}) {
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
              <div>{roundMatches.map(match=><TournamentMatchCard key={match.id} match={match} playerTeamId={playerTeamId} language={language}/>)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TournamentMatchCard({match,playerTeamId,language}:{match:TournamentMatch;playerTeamId:string;language:Language}) {
  const es=language==="es";
  const playerMatch=match.teamAId===playerTeamId||match.teamBId===playerTeamId;

  return (
    <article className={`coach-season__masters-match${playerMatch?" coach-season__masters-match--player":""}`}>
      <header>
        <span>BO{match.bestOf}</span>
        <small>{match.status==="Complete"?"FINAL":match.status==="Ready"?(es?"LISTO":"READY"):(es?"PENDIENTE":"PENDING")}</small>
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

function SeasonPhaseTile({tile,state,language}:{tile:SeasonTile;state:"active"|"complete"|"locked";language:Language}) {
  const es=language==="es";

  return (
    <article className={`coach-season__phase-tile coach-season__phase-tile--${state}`}>
      <img src={tile.image} alt={tile.label}/>
      <div className="coach-season__phase-overlay"/>

      <div className="coach-season__phase-content">
        <strong>{tile.label}</strong>
        <small>{state==="active"?(es?"ACTIVO":"ACTIVE"):state==="complete"?(es?"COMPLETADO":"COMPLETE"):(es?"BLOQUEADO":"LOCKED")}</small>
      </div>
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

function getPhaseHeroTitle(phase:CoachVCTPhase,language:Language) {
  if(phase==="Stage 1 Playoffs")return "STAGE 1";
  if(phase==="Stage 2 Playoffs")return "STAGE 2";
  if(phase==="Complete")return language==="es"?"TEMPORADA COMPLETA":"SEASON COMPLETE";
  return phase.toUpperCase();
}

function getPhaseDescription(phase:CoachVCTPhase,language:Language) {
  if(language==="en"){
    if(phase==="Kickoff")return "The first tournament of the year. Three losses mean elimination and the best teams advance to the first Masters.";
    if(phase==="Masters 1")return "The first international event of the year. Seeds 2 and 3 play through Swiss while regional champions wait in Playoffs.";
    if(phase==="Stage 1"||phase==="Stage 1 Playoffs")return "The first regional Stage of the season with a regular phase and playoffs.";
    if(phase==="Masters 2")return "The second international event of the year using the same competitive format as the first Masters.";
    if(phase==="Stage 2"||phase==="Stage 2 Playoffs")return "The final regional Stage before Champions, featuring a regular phase and playoffs.";
    if(phase==="Champions")return "The most important tournament of the season. The world champion is crowned here.";
    return "The competitive season has ended.";
  }

  if(phase==="Kickoff")return "El primer torneo del año. Tres derrotas significan eliminación y los mejores equipos avanzan al primer Masters.";
  if(phase==="Masters 1")return "Primer evento internacional del año. Los seeds 2 y 3 disputan Swiss mientras los campeones regionales esperan en Playoffs.";
  if(phase==="Stage 1"||phase==="Stage 1 Playoffs")return "Primer Stage regional de la temporada con fase regular y playoffs.";
  if(phase==="Masters 2")return "Segundo evento internacional del año con el mismo formato competitivo del primer Masters.";
  if(phase==="Stage 2"||phase==="Stage 2 Playoffs")return "Último Stage regional antes de Champions, con fase regular y playoffs.";
  if(phase==="Champions")return "El torneo más importante de la temporada. Aquí se corona al campeón mundial.";
  return "La temporada competitiva ha terminado.";
}

function getMatchRoundLabel(phase:CoachVCTPhase,language:Language) {
  if(phase==="Masters 1"||phase==="Masters 2")return language==="es"?"PARTIDO INTERNACIONAL":"INTERNATIONAL MATCH";
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
  language:Language,
  qualified?:boolean,
  eliminated?:boolean,
  masters?:CoachMastersState,
  stage?:CoachStageState,
  playerTeamId?:string,
) {
  const es=language==="es";

  if(phase==="Kickoff"){
    if(qualified)return es?"Clasificaste a Masters. No quedan partidos pendientes de Kickoff.":"You qualified for Masters. There are no remaining Kickoff matches.";
    if(eliminated)return es?"Tu equipo fue eliminado del Kickoff.":"Your team was eliminated from Kickoff.";
    return es?"No hay un partido disponible en este momento.":"There is no match available right now.";
  }

  if((phase==="Masters 1"||phase==="Masters 2")&&masters){
    const qualifier=masters.qualifiers.find(team=>team.teamId===playerTeamId);

    if(masters.phase==="Swiss"&&qualifier?.seed===1)return es?"Clasificaste directamente a Playoffs como campeón regional. El Swiss se está disputando.":"You qualified directly to Playoffs as regional champion. The Swiss stage is currently being played.";
    if(masters.phase==="Complete")return es?`${masters.event} ha terminado.`:`${masters.event} has ended.`;

    return es?"No hay un partido disponible en este momento.":"There is no match available right now.";
  }

  if((phase==="Stage 1"||phase==="Stage 1 Playoffs"||phase==="Stage 2"||phase==="Stage 2 Playoffs")&&stage){
    if(stage.complete)return es?`${stage.event} ha terminado.`:`${stage.event} has ended.`;
    if(stage.phase==="Playoffs"&&!stage.playoffSeeds.includes(playerTeamId??""))return es?"Tu equipo no clasificó a los Playoffs.":"Your team did not qualify for Playoffs.";

    return es?"No hay un partido disponible en este momento.":"There is no match available right now.";
  }

  if(phase==="Champions")return es?"No hay un partido disponible de Champions en este momento.":"There is no Champions match available right now.";

  return es?"No hay rival disponible.":"No opponent available.";
}