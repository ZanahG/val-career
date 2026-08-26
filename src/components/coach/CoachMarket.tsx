import {useMemo,useState} from "react";
import type {CoachCareerState,CoachPlayer} from "../../types/coach";
import type {CoachMarketRoleFilter} from "../../logic/coachMarket";
import {getCoachMarketPlayers} from "../../logic/coachMarket";
import {getCoachPlayerMarketValue} from "../../logic/coachPlayerValue";
import {getCoachMinimumAcceptedTransferFee,getCoachPlayerBuyout} from "../../logic/coachTransferEconomy";
import {completeCoachOffseason,openCoachOffseasonMarket,renewCoachPlayerContract} from "../../logic/coachCareerProgression";
import {getTeamById} from "../../data/teams";
import {getTeamLogo} from "../../utils/teamLogo";
import "../../styles/CoachMarket.css";

interface CoachMarketProps {
  career:CoachCareerState;
  onUpdateCareer:(career:CoachCareerState)=>void;
  onBack:()=>void;
  onOffseasonComplete?:()=>void;
  onNegotiatePlayer:(playerId:string)=>void;
}

const ROLE_FILTERS:CoachMarketRoleFilter[]=["ALL","Duelist","Initiator","Controller","Sentinel","Flex","IGL"];
const MAX_ROSTER_SIZE=5;

export function CoachMarket({career,onUpdateCareer,onBack,onOffseasonComplete,onNegotiatePlayer}:CoachMarketProps) {
  const [roleFilter,setRoleFilter]=useState<CoachMarketRoleFilter>("ALL");
  const [selectedPlayerId,setSelectedPlayerId]=useState<string|null>(null);

  const team=getTeamById(career.team.teamId);
  const teamLogo=getTeamLogo(team?.logo);
  const offseason=career.offseason;
  const midseasonMarket=career.midseasonMarket;

  const offseasonActive=Boolean(offseason&&!offseason.completed);
  const midseasonActive=Boolean(midseasonMarket&&!midseasonMarket.completed);
  const contractsPhase=Boolean(offseasonActive&&offseason?.phase==="Contracts");
  const offseasonMarketPhase=Boolean(offseasonActive&&offseason?.phase==="Market");
  const marketWindowActive=midseasonActive||offseasonMarketPhase;

  const activeTransferRequests=
    midseasonActive
      ?midseasonMarket?.transferRequests??[]
      :offseasonMarketPhase
        ?offseason?.transferRequests??[]
        :[];

  const transferRequestIds=useMemo(()=>new Set(activeTransferRequests.map(request=>request.playerId)),[activeTransferRequests]);

  const expiredPlayers=useMemo(()=>{
    if(!contractsPhase||!offseason)return [];

    const ids=new Set(
      offseason.departures
        .filter(departure=>departure.reason==="Contract Expired")
        .map(departure=>departure.playerId),
    );

    return career.playerPool.filter(player=>ids.has(player.id)).map(normalizeMarketPlayer);
  },[career.playerPool,contractsPhase,offseason]);

  const regularMarketPlayers=useMemo(
    ()=>getCoachMarketPlayers(career.playerPool,career,roleFilter).map(normalizeMarketPlayer),
    [career,roleFilter],
  );

  const windowMarketPlayers=useMemo(()=>{
    if(!marketWindowActive)return [];

    return career.playerPool
      .filter(player=>player.teamId!==career.team.teamId)
      .filter(player=>roleFilter==="ALL"||player.role===roleFilter)
      .map(normalizeMarketPlayer)
      .sort((a,b)=>{
        const requestA=transferRequestIds.has(a.id)?1:0;
        const requestB=transferRequestIds.has(b.id)?1:0;
        if(requestB!==requestA)return requestB-requestA;
        if(b.overall!==a.overall)return b.overall-a.overall;
        return b.marketValue-a.marketValue;
      });
  },[career.playerPool,career.team.teamId,marketWindowActive,roleFilter,transferRequestIds]);

  const marketPlayers=marketWindowActive?windowMarketPlayers:regularMarketPlayers;
  const selectedPlayer=marketPlayers.find(player=>player.id===selectedPlayerId)??marketPlayers[0]??null;

  const payroll=career.team.finances.currentMonthlyPayroll;
  const monthlyBudget=career.team.finances.monthlyBudget;
  const transferBudget=career.team.finances.transferBudget;
  const payrollUsage=monthlyBudget>0?Math.min(100,Math.round(payroll/monthlyBudget*100)):0;

  const selectedPlayerTransferRequested=Boolean(selectedPlayer&&transferRequestIds.has(selectedPlayer.id));

  const selectedPlayerSellerRoster=useMemo(()=>{
    if(!selectedPlayer||selectedPlayer.teamId==="free-agent")return [];
    return career.playerPool.filter(player=>player.teamId===selectedPlayer.teamId);
  },[career.playerPool,selectedPlayer]);

  const selectedTransferFee=
    selectedPlayer&&selectedPlayer.teamId!=="free-agent"
      ?getCoachMinimumAcceptedTransferFee(selectedPlayer,selectedPlayerSellerRoster,selectedPlayerTransferRequested)
      :0;

  const selectedBuyout=
    selectedPlayer&&selectedPlayer.teamId!=="free-agent"
      ?getCoachPlayerBuyout(selectedPlayer)
      :0;

  const sellerCanSell=
    !selectedPlayer||
    selectedPlayer.teamId==="free-agent"||
    selectedPlayerSellerRoster.length>=5;

  const handleRenew=(player:CoachPlayer,seasons:number)=>{
    const salary=getRenewalSalary(player.salary,seasons);
    onUpdateCareer(renewCoachPlayerContract(career,player.id,seasons,salary));
  };

  const handleOpenMarket=()=>{
    onUpdateCareer(openCoachOffseasonMarket(career));
    setSelectedPlayerId(null);
  };

  const handleCloseMarket=()=>{
    setSelectedPlayerId(null);

    if(midseasonActive){
      if(onOffseasonComplete){onOffseasonComplete();return;}
      onBack();
      return;
    }

    if(offseasonMarketPhase){
      onUpdateCareer(completeCoachOffseason(career));
      if(onOffseasonComplete){onOffseasonComplete();return;}
      onBack();
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
          <div className="coach-market__nav-brand">
            <div className="coach-market__club-logo">{teamLogo?<img src={teamLogo} alt={team?.name??""}/>:<span>{team?.shortName??"TCV"}</span>}</div>
            <span className="coach-market__nav-muted">Transfers</span>
            <strong>GLOBAL TRANSFER NETWORK</strong>
          </div>

          <div className="coach-market__club-budget">
            <div className="coach-market__club-mini">
              {teamLogo&&<img src={teamLogo} alt=""/>}
              <span>{team?.name??"Equipo"}</span>
            </div>
            <div className="coach-market__budget-bar"><span style={{width:`${Math.min(100,Math.round((transferBudget/Math.max(1,transferBudget+payroll*12))*100))}%`}}/></div>
            <strong>${transferBudget.toLocaleString("en-US")}</strong>
            <button onClick={onBack}>VOLVER</button>
          </div>
        </header>

        {contractsPhase?(
          <ContractsPanel career={career} players={expiredPlayers} onRenew={handleRenew} onContinue={handleOpenMarket}/>
        ):(
          <>
            <section className="coach-market__subnav">
              <div className="coach-market__window-copy">
                <span>{marketWindowActive?"TRANSFER WINDOW":"SCOUTING DATABASE"}</span>
                <strong>{marketWindowActive?"MERCADO DE FICHAJES":"RED GLOBAL DE SCOUTING"}</strong>
              </div>

              <nav className="coach-market__filters">
                {ROLE_FILTERS.map(role=>(
                  <button key={role} className={roleFilter===role?"active":""} onClick={()=>{
                    setRoleFilter(role);
                    setSelectedPlayerId(null);
                  }}>{getRoleLabel(role)}</button>
                ))}
              </nav>

              <div className="coach-market__payroll-mini">
                <span>NÓMINA</span>
                <strong>{payrollUsage}%</strong>
              </div>
            </section>

            <div className="coach-market__layout">
              <section className="coach-market__results-panel">
                <header className="coach-market__panel-head">
                  <div>
                    <span>SEARCH RESULTS</span>
                    <strong>{marketPlayers.length} JUGADORES</strong>
                  </div>
                  <small>{marketWindowActive?"VENTANA ABIERTA":"SOLO SCOUTING"}</small>
                </header>

                <div className="coach-market__results-grid">
                  {marketPlayers.map(player=>(
                    <PlayerResultCard
                      key={player.id}
                      player={player}
                      selected={selectedPlayer?.id===player.id}
                      requested={transferRequestIds.has(player.id)}
                      onClick={()=>setSelectedPlayerId(player.id)}
                    />
                  ))}

                  {!marketPlayers.length&&<div className="coach-market__no-results">No hay jugadores disponibles con este filtro.</div>}
                </div>
              </section>

              <aside className="coach-market__report-panel">
                {selectedPlayer?(
                  <PlayerDetail
                    career={career}
                    player={selectedPlayer}
                    transferFee={selectedTransferFee}
                    buyout={selectedBuyout}
                    transferRequested={selectedPlayerTransferRequested}
                    marketWindowActive={marketWindowActive}
                    midseason={midseasonActive}
                    sellerCanSell={sellerCanSell}
                    onNegotiate={()=>onNegotiatePlayer(selectedPlayer.id)}
                  />
                ):(
                  <div className="coach-market__empty">
                    <span>SCOUT REPORT</span>
                    <strong>SELECCIONA UN JUGADOR</strong>
                    <p>Selecciona un resultado para abrir su informe completo.</p>
                  </div>
                )}
              </aside>
            </div>

            <footer className="coach-market__footer-bar">
              <div>
                <span>PRESUPUESTO TRANSFERENCIAS</span>
                <strong>${transferBudget.toLocaleString("en-US")}</strong>
              </div>
              <div>
                <span>NÓMINA</span>
                <strong>${payroll.toLocaleString("en-US")} / ${monthlyBudget.toLocaleString("en-US")}</strong>
              </div>

              {marketWindowActive&&(
                <button className="coach-market__close-market" disabled={career.team.roster.length<MAX_ROSTER_SIZE} onClick={handleCloseMarket}>
                  {career.team.roster.length<MAX_ROSTER_SIZE?"PLANTILLA INCOMPLETA":"CERRAR MERCADO"} <span>→</span>
                </button>
              )}
            </footer>
          </>
        )}
      </div>
    </main>
  );
}

function PlayerResultCard({player,selected,requested,onClick}:{player:CoachPlayer;selected:boolean;requested:boolean;onClick:()=>void}) {
  const team=getTeamById(player.teamId);
  const logo=getTeamLogo(team?.logo);

  return (
    <button className={`coach-market__result-card${selected?" coach-market__result-card--active":""}`} onClick={onClick}>
      <div className="coach-market__result-avatar">{player.ign.slice(0,1).toUpperCase()}</div>

      <div className="coach-market__result-main">
        <span>{getRoleLabel(player.role)} · {player.age} AÑOS</span>
        <strong>{player.ign}</strong>
        <small>{player.teamId==="free-agent"?"AGENTE LIBRE":requested?"SOLICITÓ TRANSFERENCIA":team?.name??"EQUIPO"}</small>
      </div>

      <div className="coach-market__result-side">
        {logo&&<img src={logo} alt=""/>}
        <strong className={getOverallClass(player.overall)}>{player.overall}</strong>
      </div>
    </button>
  );
}

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
        <div><span>CONTRATOS VENCIDOS</span><strong>{unresolvedPlayers.length} PENDIENTES</strong></div>
        <small>RENUEVA A LOS JUGADORES QUE QUIERAS CONSERVAR</small>
      </header>

      <div className="coach-market__contracts-list">
        {players.map(player=>{
          const renewed=career.team.roster.some(current=>current.id===player.id);
          const current=career.team.roster.find(current=>current.id===player.id)??player;

          return (
            <article key={player.id} className={`coach-market__contract-player${renewed?" coach-market__contract-player--renewed":""}`}>
              <div className="coach-market__contract-player-main">
                <div className="coach-market__player-avatar">{player.ign.slice(0,1).toUpperCase()}</div>
                <div><span>{getRoleLabel(player.role)} · {player.age} AÑOS</span><strong>{player.ign}</strong><small>OVR {player.overall}</small></div>
              </div>

              <div className="coach-market__contract-old"><span>SUELDO ANTERIOR</span><strong>${player.salary.toLocaleString("en-US")}</strong></div>

              {renewed?(
                <div className="coach-market__contract-renewed"><span>RENOVADO</span><strong>{current.contractSeasonsRemaining??1} AÑOS</strong><small>${current.salary.toLocaleString("en-US")} / MES</small></div>
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

        {!players.length&&<div className="coach-market__contracts-empty"><span>✓</span><strong>NO HAY CONTRATOS VENCIDOS</strong><p>Todos los jugadores de tu plantilla mantienen contrato para la próxima temporada.</p></div>}
      </div>

      <footer className="coach-market__contracts-footer">
        <div><span>PLANTILLA ACTUAL</span><strong>{career.team.roster.length}/{MAX_ROSTER_SIZE}</strong></div>
        <button onClick={onContinue}>IR AL MERCADO <span>→</span></button>
      </footer>
    </section>
  );
}

function PlayerDetail({career,player,transferFee,buyout,transferRequested,marketWindowActive,midseason,sellerCanSell,onNegotiate}:{
  career:CoachCareerState;
  player:CoachPlayer;
  transferFee:number;
  buyout:number;
  transferRequested:boolean;
  marketWindowActive:boolean;
  midseason:boolean;
  sellerCanSell:boolean;
  onNegotiate:()=>void;
}) {
  const playerTeam=getTeamById(player.teamId);
  const playerTeamLogo=getTeamLogo(playerTeam?.logo);
  const freeAgent=player.teamId==="free-agent";

  return (
    <>
      <header className="coach-market__report-head">
        <div className="coach-market__report-player">
          <div className="coach-market__report-avatar">{player.ign.slice(0,1).toUpperCase()}</div>
          <div>
            <span>{getRoleLabel(player.role)} · {player.age} AÑOS</span>
            <h2>{player.ign}</h2>
            <small>{transferRequested?"SOLICITÓ TRANSFERENCIA":freeAgent?"AGENTE LIBRE":playerTeam?.name??"EQUIPO"}</small>
          </div>
        </div>

        <div className="coach-market__report-overall">
          <strong>{player.overall}</strong>
          <span>OVR</span>
        </div>

        <div className="coach-market__report-team">
          {playerTeamLogo&&<img src={playerTeamLogo} alt=""/>}
          <strong>{freeAgent?"FA":playerTeam?.shortName??"TBD"}</strong>
        </div>
      </header>

      <div className="coach-market__report-divider"/>

      <section className="coach-market__report-summary">
        <div className="coach-market__summary-stats">
          <span>SUMMARY</span>
          <Stat label="Aim" value={player.stats.aim}/>
          <Stat label="Game Sense" value={player.stats.gameSense}/>
          <Stat label="Communication" value={player.stats.communication}/>
          <Stat label="Clutch" value={player.stats.clutch}/>
          <Stat label="Consistency" value={player.stats.consistency}/>
          <Stat label="Mental" value={player.stats.mental}/>
        </div>

        <div className="coach-market__report-meta">
          <span>PROFILE</span>
          <div><span>Rol</span><strong>{getRoleLabel(player.role)}</strong></div>
          <div><span>Edad</span><strong>{player.age}</strong></div>
          <div><span>Potencial</span><strong>{player.potential}</strong></div>
          <div><span>Contrato</span><strong>{freeAgent?"—":`${player.contractSeasonsRemaining??0} AÑOS`}</strong></div>
        </div>
      </section>

      <section className="coach-market__financial">
        <span>FINANCIAL</span>
        <div><span>Valor</span><strong>${player.marketValue.toLocaleString("en-US")}</strong></div>
        <div><span>Salario</span><strong>${player.salary.toLocaleString("en-US")}</strong></div>
        <div><span>Valoración club</span><strong>{freeAgent?"FREE":`$${transferFee.toLocaleString("en-US")}`}</strong></div>
        <div><span>Buyout</span><strong>{freeAgent?"—":`$${buyout.toLocaleString("en-US")}`}</strong></div>
      </section>

      <section className="coach-market__availability">
        <span>{marketWindowActive?"NEGOCIACIÓN":"SCOUTING"}</span>
        <strong>{!marketWindowActive?"VENTANA CERRADA":!sellerCanSell?"NO DISPONIBLE":freeAgent?"DISPUESTO A NEGOCIAR":"CLUB DISPUESTO A ESCUCHAR"}</strong>
        <small>{!marketWindowActive?"Puedes seguir evaluando al jugador para futuras ventanas.":!sellerCanSell?"El club no puede vender porque quedaría sin plantilla suficiente.":career.team.roster.length>=MAX_ROSTER_SIZE?"Si cierras el acuerdo deberás liberar un jugador de tu plantilla.":"Tienes espacio disponible en la plantilla."}</small>
      </section>

      <button className="coach-market__sign" disabled={!marketWindowActive||!sellerCanSell} onClick={onNegotiate}>
        <span><small>{freeAgent?"CONTRATO":"TRANSFERENCIA"}</small>{!marketWindowActive?"MERCADO CERRADO":!sellerCanSell?"NO DISPONIBLE":freeAgent?"NEGOCIAR CONTRATO":midseason?"NEGOCIAR MID-SEASON":"INICIAR NEGOCIACIÓN"}</span>
        <b>→</b>
      </button>
    </>
  );
}

function getRenewalSalary(currentSalary:number,seasons:number) {
  const multiplier=seasons===1?1.05:seasons===2?1.10:1.15;
  return Math.round(currentSalary*multiplier/100)*100;
}

function Stat({label,value}:{label:string;value:number}) {
  return (
    <div className="coach-market__stat">
      <div><span>{label}</span><strong className={getStatClass(value)}>{value}</strong></div>
      <div className="coach-market__stat-bar"><span style={{width:`${value}%`}}/></div>
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

function normalizeMarketPlayer(player:CoachPlayer):CoachPlayer {
  const marketValue=Number.isFinite(player.marketValue)&&player.marketValue>0
    ?player.marketValue
    :getCoachPlayerMarketValue({...player,marketValue:0});

  return {...player,marketValue};
}