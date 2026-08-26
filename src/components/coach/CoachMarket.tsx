import {useMemo,useState} from "react";
import type {CoachCareerState,CoachPlayer} from "../../types/coach";
import type {CoachMarketRoleFilter} from "../../logic/coachMarket";
import {canAffordCoachTransfer,getCoachMarketPlayers,signCoachPlayer} from "../../logic/coachMarket";
import {completeCoachOffseason,openCoachOffseasonMarket,renewCoachPlayerContract} from "../../logic/coachCareerProgression";
import {getTeamById} from "../../data/teams";
import {getTeamLogo} from "../../utils/teamLogo";
import "../../styles/CoachMarket.css";

interface CoachMarketProps {
  career:CoachCareerState;
  onUpdateCareer:(career:CoachCareerState)=>void;
  onBack:()=>void;
  onOffseasonComplete?:()=>void;
}

const ROLE_FILTERS:CoachMarketRoleFilter[]=["ALL","Duelist","Initiator","Controller","Sentinel","Flex","IGL"];
const MAX_ROSTER_SIZE=5;

export function CoachMarket({career,onUpdateCareer,onBack,onOffseasonComplete}:CoachMarketProps) {
  const [roleFilter,setRoleFilter]=useState<CoachMarketRoleFilter>("ALL");
  const [selectedPlayerId,setSelectedPlayerId]=useState<string|null>(null);
  const [replacePlayerId,setReplacePlayerId]=useState("");

  const team=getTeamById(career.team.teamId);
  const teamLogo=getTeamLogo(team?.logo);

  const offseason=career.offseason;
  const offseasonActive=Boolean(offseason&&!offseason.completed);
  const contractsPhase=offseasonActive&&offseason?.phase==="Contracts";
  const marketPhase=offseasonActive&&offseason?.phase==="Market";

  const expiredPlayers=useMemo(()=>{
    if(!contractsPhase||!offseason)return [];

    const ids=new Set(
      offseason.departures
        .filter(departure=>departure.reason==="Contract Expired")
        .map(departure=>departure.playerId),
    );

    return career.playerPool.filter(player=>ids.has(player.id));
  },[career.playerPool,contractsPhase,offseason]);

  const regularMarketPlayers=useMemo(
    ()=>getCoachMarketPlayers(career.playerPool,career,roleFilter),
    [career,roleFilter],
  );

  const offseasonMarketPlayers=useMemo(()=>{
    if(!marketPhase)return [];

    return career.playerPool
      .filter(player=>player.teamId==="free-agent")
      .filter(player=>roleFilter==="ALL"||player.role===roleFilter)
      .filter(player=>!career.team.roster.some(current=>current.id===player.id))
      .sort((a,b)=>b.overall-a.overall);
  },[career.playerPool,career.team.roster,marketPhase,roleFilter]);

  const marketPlayers=marketPhase?offseasonMarketPlayers:regularMarketPlayers;
  const selectedPlayer=marketPlayers.find(player=>player.id===selectedPlayerId)??null;
  const replacePlayer=career.team.roster.find(player=>player.id===replacePlayerId)??null;

  const rosterFull=career.team.roster.length>=MAX_ROSTER_SIZE;
  const payroll=career.team.finances.currentMonthlyPayroll;
  const monthlyBudget=career.team.finances.monthlyBudget;
  const payrollUsage=monthlyBudget>0?Math.min(100,Math.round(payroll/monthlyBudget*100)):0;

  const projectedPayroll=
    selectedPlayer
      ?replacePlayer
        ?payroll-replacePlayer.salary+selectedPlayer.salary
        :payroll+selectedPlayer.salary
      :payroll;

  const canAffordRegular=Boolean(
    selectedPlayer&&
    replacePlayer&&
    canAffordCoachTransfer(career,selectedPlayer,replacePlayer),
  );

  const canAffordOffseason=Boolean(
    selectedPlayer&&
    (!rosterFull||replacePlayer)&&
    projectedPayroll<=monthlyBudget,
  );

  const canAfford=marketPhase?canAffordOffseason:canAffordRegular;

  const handleSelectPlayer=(playerId:string)=>{
    setSelectedPlayerId(playerId);
    setReplacePlayerId("");
  };

  const handleSign=()=>{
    if(!selectedPlayer)return;

    if(marketPhase){
      if(rosterFull&&!replacePlayer)return;

      const updated=signOffseasonPlayer(
        career,
        selectedPlayer,
        replacePlayer?.id,
      );

      if(!updated)return;

      onUpdateCareer(updated);
      setSelectedPlayerId(null);
      setReplacePlayerId("");
      return;
    }

    if(!replacePlayer)return;

    const result=signCoachPlayer(career,selectedPlayer,replacePlayer.id);
    if(!result)return;

    const updatedPool=career.playerPool.map(player=>{
      if(player.id===selectedPlayer.id)return {...player,teamId:career.team.teamId};
      if(player.id===replacePlayer.id)return {...player,teamId:"free-agent"};
      return player;
    });

    onUpdateCareer({...result.career,playerPool:updatedPool});
    setSelectedPlayerId(null);
    setReplacePlayerId("");
  };

  const handleRenew=(player:CoachPlayer,seasons:number)=>{
    const salary=getRenewalSalary(player.salary,seasons);

    const updated=renewCoachPlayerContract(
      career,
      player.id,
      seasons,
      salary,
    );

    onUpdateCareer(updated);
  };

  const handleOpenMarket=()=>{
    const updated=openCoachOffseasonMarket(career);

    onUpdateCareer(updated);
    setSelectedPlayerId(null);
    setReplacePlayerId("");
  };

  const handleCloseMarket=()=>{
    const updated=completeCoachOffseason(career);

    onUpdateCareer(updated);
    setSelectedPlayerId(null);
    setReplacePlayerId("");

    if(onOffseasonComplete){
      onOffseasonComplete();
      return;
    }

    onBack();
  };

  return (
    <main className="coach-market">
      <div className="coach-market__bg"/>
      <div className="coach-market__overlay"/>

      <div className="coach-market__shell">
        <header className="coach-market__topbar">
          <div className="coach-market__club">
            <div className="coach-market__club-logo">
              {teamLogo?<img src={teamLogo} alt={team?.name??""}/>:<span>{team?.shortName??"TBD"}</span>}
            </div>

            <div>
              <span>{offseasonActive?"OFFSEASON MANAGEMENT":"SCOUTING & TRANSFERS"}</span>
              <strong>{team?.name??"Equipo"}</strong>
              <small>{team?.circuit} · {team?.marketRegion}</small>
            </div>
          </div>

          <button className="coach-market__back" onClick={onBack}>
            ← {offseasonActive?"TEMPORADA":"DASHBOARD"}
          </button>
        </header>

        <section className="coach-market__hero">
          <div>
            <span className="coach-market__eyebrow">
              {contractsPhase?"OFFSEASON · CONTRATOS":marketPhase?"OFFSEASON · MERCADO":"CENTRO DE TRASPASOS"}
            </span>

            <h1>{contractsPhase?"CONTRATOS":marketPhase?"AGENTES LIBRES":"MERCADO"}</h1>

            <p>
              {contractsPhase
                ?"Decide qué jugadores con contrato vencido seguirán formando parte del equipo la próxima temporada."
                :marketPhase
                  ?"Completa tu plantilla antes de comenzar la próxima temporada y mantén la nómina dentro del presupuesto."
                  :"Explora jugadores disponibles, compara perfiles y mejora tu plantilla sin superar el presupuesto mensual."}
            </p>
          </div>

          <div className="coach-market__budget-summary">
            <div>
              <span>NÓMINA ACTUAL</span>
              <strong>${payroll.toLocaleString("en-US")}</strong>
              <small>USD / MES</small>
            </div>

            <div>
              <span>LÍMITE MENSUAL</span>
              <strong>${monthlyBudget.toLocaleString("en-US")}</strong>
              <small>USD / MES</small>
            </div>

            <div className="coach-market__budget-progress">
              <div><span style={{width:`${payrollUsage}%`}}/></div>
              <small>{payrollUsage}% UTILIZADO</small>
            </div>
          </div>
        </section>

        {contractsPhase?(
          <ContractsPanel
            career={career}
            players={expiredPlayers}
            onRenew={handleRenew}
            onContinue={handleOpenMarket}
          />
        ):(
          <>
            <nav className="coach-market__filters">
              {ROLE_FILTERS.map(role=>(
                <button key={role} className={roleFilter===role?"active":""} onClick={()=>{
                  setRoleFilter(role);
                  setSelectedPlayerId(null);
                  setReplacePlayerId("");
                }}>
                  {getRoleLabel(role)}
                </button>
              ))}
            </nav>

            <div className="coach-market__layout">
              <section className="coach-market__list-panel">
                <header className="coach-market__list-title">
                  <div>
                    <span>{marketPhase?"AGENTES LIBRES":"JUGADORES DISPONIBLES"}</span>
                    <strong>{marketPlayers.length} RESULTADOS</strong>
                  </div>

                  <span>{getRoleLabel(roleFilter)}</span>
                </header>

                <div className="coach-market__list">
                  <div className="coach-market__list-header">
                    <span>JUGADOR</span>
                    <span>EQUIPO</span>
                    <span>ROL</span>
                    <span>OVR</span>
                    <span>EDAD</span>
                    <span>SUELDO</span>
                  </div>

                  {marketPlayers.map(player=>{
                    const playerTeam=getTeamById(player.teamId);
                    const logo=getTeamLogo(playerTeam?.logo);
                    const selected=selectedPlayerId===player.id;

                    return (
                      <button key={player.id} className={`coach-market__player${selected?" coach-market__player--active":""}`} onClick={()=>handleSelectPlayer(player.id)}>
                        <div className="coach-market__player-name">
                          <div className="coach-market__player-avatar">{player.ign.slice(0,1).toUpperCase()}</div>

                          <div>
                            <strong>{player.ign}</strong>
                            <small>{player.teamId==="free-agent"?"AGENTE LIBRE":player.starter?"TITULAR":"SUPLENTE"}</small>
                          </div>
                        </div>

                        <div className="coach-market__team">
                          <div>{logo&&<img src={logo} alt=""/>}</div>
                          <span>{player.teamId==="free-agent"?"FA":playerTeam?.shortName??"FA"}</span>
                        </div>

                        <span className="coach-market__role">{getRoleLabel(player.role)}</span>

                        <strong className={`coach-market__overall ${getOverallClass(player.overall)}`}>
                          {player.overall}
                        </strong>

                        <span>{player.age}</span>

                        <strong className="coach-market__salary">
                          ${player.salary.toLocaleString("en-US")}
                        </strong>
                      </button>
                    );
                  })}

                  {!marketPlayers.length&&(
                    <div className="coach-market__no-results">
                      {marketPhase
                        ?"No hay agentes libres disponibles con este filtro."
                        :"No hay jugadores disponibles con este filtro."}
                    </div>
                  )}
                </div>
              </section>

              <aside className="coach-market__detail">
                {!selectedPlayer?(
                  <div className="coach-market__empty">
                    <div className="coach-market__empty-icon">⌕</div>
                    <span>SCOUTING</span>
                    <strong>SELECCIONA UN JUGADOR</strong>
                    <p>Elige un jugador de la lista para revisar sus atributos, salario y encaje dentro de tu roster.</p>
                  </div>
                ):(
                  <PlayerDetail
                    career={career}
                    player={selectedPlayer}
                    replacePlayerId={replacePlayerId}
                    replacePlayer={replacePlayer}
                    projectedPayroll={projectedPayroll}
                    canAfford={canAfford}
                    offseason={marketPhase}
                    rosterFull={rosterFull}
                    onReplaceChange={setReplacePlayerId}
                    onSign={handleSign}
                  />
                )}
              </aside>
            </div>

            {marketPhase&&(
              <section className="coach-market__offseason-footer">
                <div>
                  <span>PLANTILLA</span>
                  <strong>{career.team.roster.length}/{MAX_ROSTER_SIZE} JUGADORES</strong>
                  <small>Completa tus movimientos antes de cerrar la offseason.</small>
                </div>

                <button className="coach-market__close-market" disabled={career.team.roster.length<MAX_ROSTER_SIZE} onClick={handleCloseMarket}>
                  <span>
                    <small>{career.team.roster.length<MAX_ROSTER_SIZE?"PLANTILLA INCOMPLETA":"OFFSEASON"}</small>
                    CERRAR MERCADO
                  </span>

                  <b>→</b>
                </button>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

/* =========================================================
   CONTRACTS
========================================================= */

function ContractsPanel({career,players,onRenew,onContinue}:{
  career:CoachCareerState;
  players:CoachPlayer[];
  onRenew:(player:CoachPlayer,seasons:number)=>void;
  onContinue:()=>void;
}) {
  const unresolvedPlayers=players.filter(player=>!career.team.roster.some(current=>current.id===player.id));

  return (
    <section className="coach-market__contracts-panel">
      <header className="coach-market__contracts-head">
        <div>
          <span>CONTRATOS VENCIDOS</span>
          <strong>{unresolvedPlayers.length} PENDIENTES</strong>
        </div>

        <small>RENUEVA A LOS JUGADORES QUE QUIERAS CONSERVAR</small>
      </header>

      <div className="coach-market__contracts-list">
        {players.map(player=>{
          const renewed=career.team.roster.some(current=>current.id===player.id);
          const current=career.team.roster.find(current=>current.id===player.id)??player;

          return (
            <article key={player.id} className={`coach-market__contract-player${renewed?" coach-market__contract-player--renewed":""}`}>
              <div className="coach-market__contract-player-main">
                <div className="coach-market__player-avatar">
                  {player.ign.slice(0,1).toUpperCase()}
                </div>

                <div>
                  <span>{getRoleLabel(player.role)} · {player.age} AÑOS</span>
                  <strong>{player.ign}</strong>
                  <small>OVR {player.overall}</small>
                </div>
              </div>

              <div className="coach-market__contract-old">
                <span>SUELDO ANTERIOR</span>
                <strong>${player.salary.toLocaleString("en-US")}</strong>
              </div>

              {renewed?(
                <div className="coach-market__contract-renewed">
                  <span>RENOVADO</span>
                  <strong>{current.contractSeasonsRemaining??1} AÑOS</strong>
                  <small>${current.salary.toLocaleString("en-US")} / MES</small>
                </div>
              ):(
                <div className="coach-market__contract-options">
                  {[1,2,3].map(seasons=>{
                    const salary=getRenewalSalary(player.salary,seasons);
                    const projected=career.team.finances.currentMonthlyPayroll+salary;
                    const affordable=projected<=career.team.finances.monthlyBudget;

                    return (
                      <button key={seasons} disabled={!affordable} onClick={()=>onRenew(player,seasons)}>
                        <span>{seasons} {seasons===1?"AÑO":"AÑOS"}</span>
                        <strong>${salary.toLocaleString("en-US")}</strong>
                        <small>{affordable?"USD / MES":"SIN PRESUPUESTO"}</small>
                      </button>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}

        {!players.length&&(
          <div className="coach-market__contracts-empty">
            <span>✓</span>
            <strong>NO HAY CONTRATOS VENCIDOS</strong>
            <p>Todos los jugadores de tu plantilla mantienen contrato para la próxima temporada.</p>
          </div>
        )}
      </div>

      <footer className="coach-market__contracts-footer">
        <div>
          <span>PLANTILLA ACTUAL</span>
          <strong>{career.team.roster.length}/{MAX_ROSTER_SIZE}</strong>
        </div>

        <button onClick={onContinue}>
          IR AL MERCADO <span>→</span>
        </button>
      </footer>
    </section>
  );
}

/* =========================================================
   PLAYER DETAIL
========================================================= */

function PlayerDetail({career,player,replacePlayerId,replacePlayer,projectedPayroll,canAfford,offseason,rosterFull,onReplaceChange,onSign}:{
  career:CoachCareerState;
  player:CoachPlayer;
  replacePlayerId:string;
  replacePlayer:CoachPlayer|null;
  projectedPayroll:number;
  canAfford:boolean;
  offseason:boolean;
  rosterFull:boolean;
  onReplaceChange:(id:string)=>void;
  onSign:()=>void;
}) {
  const playerTeam=getTeamById(player.teamId);
  const playerTeamLogo=getTeamLogo(playerTeam?.logo);

  return (
    <>
      <header className="coach-market__detail-header">
        <div className="coach-market__detail-team">
          <div>{playerTeamLogo&&<img src={playerTeamLogo} alt={playerTeam?.name??""}/>}</div>
          <span>{player.teamId==="free-agent"?"FREE AGENT":playerTeam?.name??"FREE AGENT"}</span>
        </div>

        <div className="coach-market__detail-player">
          <div className="coach-market__detail-avatar">{player.ign.slice(0,1).toUpperCase()}</div>

          <div>
            <span>{getRoleLabel(player.role)} · {player.age} AÑOS</span>
            <h2>{player.ign}</h2>
          </div>

          <div className={`coach-market__detail-overall ${getOverallClass(player.overall)}`}>
            <strong>{player.overall}</strong>
            <span>OVR</span>
          </div>
        </div>
      </header>

      <section className="coach-market__attributes">
        <header>
          <span>INFORME DE SCOUTING</span>
          <strong>ATRIBUTOS</strong>
        </header>

        <div className="coach-market__stats">
          <Stat label="AIM" value={player.stats.aim}/>
          <Stat label="GAME SENSE" value={player.stats.gameSense}/>
          <Stat label="COMMS" value={player.stats.communication}/>
          <Stat label="CLUTCH" value={player.stats.clutch}/>
          <Stat label="CONSISTENCY" value={player.stats.consistency}/>
          <Stat label="MENTAL" value={player.stats.mental}/>
        </div>
      </section>

      <section className="coach-market__contract">
        <div>
          <span>{offseason?"SALARIO":"SUELDO SOLICITADO"}</span>
          <strong>${player.salary.toLocaleString("en-US")}</strong>
          <small>USD / MES</small>
        </div>

        <div>
          <span>ROL</span>
          <strong>{getRoleLabel(player.role)}</strong>
        </div>

        {offseason&&(
          <div>
            <span>CONTRATO</span>
            <strong>2 AÑOS</strong>
          </div>
        )}
      </section>

      {(!offseason||rosterFull)&&(
        <label className="coach-market__replace">
          <span>{offseason?"PLANTILLA COMPLETA · REEMPLAZAR":"REEMPLAZAR JUGADOR"}</span>

          <select value={replacePlayerId} onChange={e=>onReplaceChange(e.target.value)}>
            <option value="">Selecciona jugador del roster</option>

            {career.team.roster.map(current=>(
              <option key={current.id} value={current.id}>
                {current.ign} · {getRoleLabel(current.role)} · ${current.salary.toLocaleString("en-US")}
              </option>
            ))}
          </select>
        </label>
      )}

      {offseason&&!rosterFull&&(
        <div className="coach-market__open-slot">
          <span>PLANTILLA</span>
          <strong>SLOT DISPONIBLE</strong>
          <small>{career.team.roster.length}/{MAX_ROSTER_SIZE} jugadores</small>
        </div>
      )}

      {(replacePlayer||offseason)&&(
        <section className={`coach-market__projection${canAfford?"":" coach-market__projection--error"}`}>
          <div>
            <span>NÓMINA PROYECTADA</span>
            <strong>${projectedPayroll.toLocaleString("en-US")}</strong>
            <small>USD / MES</small>
          </div>

          <div>
            <span>ESTADO</span>
            <strong>
              {canAfford
                ?"DENTRO DEL PRESUPUESTO"
                :rosterFull&&!replacePlayer
                  ?"SELECCIONA UN REEMPLAZO"
                  :"PRESUPUESTO SUPERADO"}
            </strong>
          </div>
        </section>
      )}

      <button className="coach-market__sign" disabled={!canAfford} onClick={onSign}>
        <span>
          <small>{offseason?"CONTRATO · 2 AÑOS":"CONFIRMAR TRANSFERENCIA"}</small>
          {offseason?"FICHAR AGENTE LIBRE":"FICHAR JUGADOR"}
        </span>

        <b>→</b>
      </button>
    </>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function signOffseasonPlayer(career:CoachCareerState,player:CoachPlayer,replacePlayerId?:string):CoachCareerState|null {
  const offseason=career.offseason;
  if(!offseason||offseason.phase!=="Market"||offseason.completed)return null;

  const replacePlayer=replacePlayerId
    ?career.team.roster.find(current=>current.id===replacePlayerId)
    :undefined;

  if(career.team.roster.length>=MAX_ROSTER_SIZE&&!replacePlayer)return null;

  const projectedPayroll=
    career.team.finances.currentMonthlyPayroll
    -(replacePlayer?.salary??0)
    +player.salary;

  if(projectedPayroll>career.team.finances.monthlyBudget)return null;

  const signedPlayer:CoachPlayer={
    ...player,
    teamId:career.team.teamId,
    starter:career.team.roster.length<MAX_ROSTER_SIZE?true:player.starter,
    contractSeasonsRemaining:2,
  };

  const roster=[
    ...career.team.roster.filter(current=>current.id!==replacePlayerId),
    signedPlayer,
  ];

  const playerPool=career.playerPool.map(current=>{
    if(current.id===player.id)return signedPlayer;

    if(replacePlayer&&current.id===replacePlayer.id){
      return {
        ...current,
        teamId:"free-agent",
        starter:false,
        contractSeasonsRemaining:0,
      };
    }

    return current;
  });

  return {
    ...career,
    team:{
      ...career.team,
      roster,
      finances:{
        ...career.team.finances,
        currentMonthlyPayroll:projectedPayroll,
      },
    },
    playerPool,
    offseason:{
      ...offseason,
      departures:replacePlayer
        ?[
            ...offseason.departures,
            {
              playerId:replacePlayer.id,
              playerName:replacePlayer.ign,
              previousTeamId:career.team.teamId,
              reason:"Released",
            },
          ]
        :offseason.departures,
      transfers:[
        ...offseason.transfers,
        {
          playerId:player.id,
          playerName:player.ign,
          fromTeamId:"free-agent",
          toTeamId:career.team.teamId,
          salary:player.salary,
        },
      ],
      freeAgentIds:[
        ...offseason.freeAgentIds.filter(id=>id!==player.id),
        ...(replacePlayer?[replacePlayer.id]:[]),
      ],
    },
  };
}

function getRenewalSalary(currentSalary:number,seasons:number) {
  const multiplier=seasons===1?1.05:seasons===2?1.1:1.15;
  return Math.round(currentSalary*multiplier/100)*100;
}

function Stat({label,value}:{label:string;value:number}) {
  return (
    <div className="coach-market__stat">
      <div>
        <span>{label}</span>
        <strong className={getStatClass(value)}>{value}</strong>
      </div>

      <div className="coach-market__stat-bar">
        <span style={{width:`${value}%`}}/>
      </div>
    </div>
  );
}

function getRoleLabel(role:CoachMarketRoleFilter|CoachPlayer["role"]) {
  if(role==="ALL")return "TODOS";
  if(role==="Duelist")return "DUELISTA";
  if(role==="Initiator")return "INICIADOR";
  if(role==="Controller")return "CONTROLADOR";
  if(role==="Sentinel")return "CENTINELA";
  if(role==="IGL")return "IGL";
  return "FLEX";
}

function getOverallClass(overall:number) {
  if(overall>=90)return "coach-market__overall--elite";
  if(overall>=85)return "coach-market__overall--star";
  if(overall>=80)return "coach-market__overall--good";
  return "";
}

function getStatClass(value:number) {
  if(value>=90)return "coach-market__stat-value--elite";
  if(value>=85)return "coach-market__stat-value--high";
  if(value<70)return "coach-market__stat-value--low";
  return "";
}