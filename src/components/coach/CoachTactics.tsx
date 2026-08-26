import type {CSSProperties,ReactNode} from "react";
import type {CoachAttackStyle,CoachCareerState,CoachDefenseStyle,CoachOperatorUsage,CoachPace,CoachPlayerTacticalRole,CoachRisk,CoachTacticalStyle} from "../../types/coach";
import {getTeamById} from "../../data/teams";
import {getCoachTacticalFit,getTacticalIdentityDescription} from "../../logic/coachTactics";
import {assignCoachPlayerTacticalRole,getCoachPlayerTacticalRole,getCoachRoleAssignmentFit,getCoachRoleStructureScore} from "../../logic/coachPlayerRoles";
import {getTeamLogo} from "../../utils/teamLogo";
import playerChair from "../../images/ui/chair.png";
import "../../styles/CoachTactics.css";

import {runCoachBalanceDebug} from "../../logic/runCoachBalanceDebug";

interface CoachTacticsProps {
  career:CoachCareerState;
  onUpdateCareer:(career:CoachCareerState)=>void;
  onBack:()=>void;
}

const STYLES:CoachTacticalStyle[]=["Balanced","Aggressive","Controlled","Reactive","Anti-Strat"];
const PACES:CoachPace[]=["Slow","Balanced","Fast"];
const RISKS:CoachRisk[]=["Low","Medium","High"];
const ATTACKS:CoachAttackStyle[]=["Defaults","Executions","Map Control","Explosive"];
const DEFENSES:CoachDefenseStyle[]=["Passive","Standard","Aggressive","Retake"];
const OPERATORS:CoachOperatorUsage[]=["Rare","Situational","Priority"];
const PLAYER_ROLES:CoachPlayerTacticalRole[]=["Entry","Secondary Entry","Main Operator","IGL","Lurker","Anchor","Flex"];

export function CoachTactics({career,onUpdateCareer,onBack}:CoachTacticsProps) {
  const fit=getCoachTacticalFit(career);
  const team=getTeamById(career.team.teamId);
  const logo=getTeamLogo(team?.logo);
  const starters=career.team.roster.filter(player=>player.starter).slice(0,5);
  const assignments=career.team.playerAssignments??[];
  const roleStructure=getCoachRoleStructureScore(starters,assignments);
  const rosterTacticalNotes=getRosterTacticalNotes(career);

  const setStyle=(tacticalStyle:CoachTacticalStyle)=>{
    onUpdateCareer({...career,team:{...career.team,tacticalStyle}});
  };

  const updateTactic=<K extends keyof typeof career.team.tactics>(key:K,value:(typeof career.team.tactics)[K])=>{
    onUpdateCareer({...career,team:{...career.team,tactics:{...career.team.tactics,[key]:value}}});
  };

  const updatePlayerRole=(playerId:string,tacticalRole:CoachPlayerTacticalRole)=>{
    const playerAssignments=assignCoachPlayerTacticalRole(assignments,playerId,tacticalRole);
    onUpdateCareer({...career,team:{...career.team,playerAssignments}});
  };

  return (
    <main className="coach-tactics">
      <div className="coach-tactics__bg"/>
      <div className="coach-tactics__overlay"/>

      <div className="coach-tactics__shell">
        <header className="coach-tactics__topbar">
          <div className="coach-tactics__club">
            <div className="coach-tactics__club-logo">
              {logo?<img src={logo} alt={team?.name??""}/>:<span>{team?.shortName??"TBD"}</span>}
            </div>

            <div>
              <span>COACH CAREER</span>
              <strong>EDITAR TÁCTICA</strong>
              <small>{team?.name??"Equipo"} · {team?.circuit}</small>
            </div>
          </div>

          <nav className="coach-tactics__tabs">
            <button className="active">TEAM TACTICS</button>
            <button className="coach-tactics__roles-tab">PLAYER ROLES</button>
          </nav>

          <div>
            <button onClick={()=>runCoachBalanceDebug(career,getDebugOpponent(career),["Ascent","Haven","Lotus"])}>BALANCE TEST</button>
            <button className="coach-tactics__back" onClick={onBack}>← DASHBOARD</button>
          </div>
        </header>

        <section className="coach-tactics__titlebar">
          <div>
            <span>TACTICAL SYSTEM</span>
            <h1>{getStyleLabel(career.team.tacticalStyle)}</h1>
            <small>{fit>=85?"SISTEMA MUY COHERENTE":fit>=70?"SISTEMA COMPETITIVO":"REQUIERE AJUSTES"}</small>
          </div>

          <div className="coach-tactics__title-metrics">
            <div className={`coach-tactics__fit-badge${roleStructure>=85?" coach-tactics__fit-badge--good":roleStructure<65?" coach-tactics__fit-badge--bad":""}`}>
              <span>ROLE STRUCTURE</span>
              <strong>{roleStructure}</strong>
            </div>

            <div className={`coach-tactics__fit-badge${fit>=85?" coach-tactics__fit-badge--good":fit<65?" coach-tactics__fit-badge--bad":""}`}>
              <span>TACTICAL FIT</span>
              <strong>{fit}</strong>
            </div>
          </div>
        </section>

        <div className="coach-tactics__workspace">
          <section className="coach-tactics__editor">
            <article className="coach-tactics__preset-panel">
              <header>
                <div>
                  <span>TACTICAL PRESET</span>
                  <strong>{getStyleLabel(career.team.tacticalStyle)}</strong>
                </div>

                <div className="coach-tactics__preset-arrows">
                  <button onClick={()=>changeStyle(career.team.tacticalStyle,-1,setStyle)}>‹</button>
                  <button onClick={()=>changeStyle(career.team.tacticalStyle,1,setStyle)}>›</button>
                </div>
              </header>

              <p>{getTacticalIdentityDescription(career.team.tacticalStyle)}</p>

              <div className="coach-tactics__preset-icon">
                <span/>
                <span/>
                <span/>
              </div>

              <div className="coach-tactics__preset-list">
                {STYLES.map(style=>(
                  <button key={style} className={career.team.tacticalStyle===style?"active":""} onClick={()=>setStyle(style)}>
                    <span>{getStyleIndex(style)}</span>
                    <strong>{getStyleLabel(style)}</strong>
                  </button>
                ))}
              </div>
            </article>

            <section className="coach-tactics__settings">
              <TacticSetting title="RITMO DE JUEGO" value={getPaceLabel(career.team.tactics.pace)}>
                {PACES.map(value=>(
                  <OptionButton key={value} active={career.team.tactics.pace===value} onClick={()=>updateTactic("pace",value)}>
                    {getPaceLabel(value)}
                  </OptionButton>
                ))}
              </TacticSetting>

              <TacticSetting title="RIESGO" value={getRiskLabel(career.team.tactics.risk)}>
                {RISKS.map(value=>(
                  <OptionButton key={value} active={career.team.tactics.risk===value} onClick={()=>updateTactic("risk",value)}>
                    {getRiskLabel(value)}
                  </OptionButton>
                ))}
              </TacticSetting>

              <TacticSetting title="ATAQUE" value={getAttackLabel(career.team.tactics.attackStyle)}>
                {ATTACKS.map(value=>(
                  <OptionButton key={value} active={career.team.tactics.attackStyle===value} onClick={()=>updateTactic("attackStyle",value)}>
                    {getAttackLabel(value)}
                  </OptionButton>
                ))}
              </TacticSetting>

              <TacticSetting title="DEFENSA" value={getDefenseLabel(career.team.tactics.defenseStyle)}>
                {DEFENSES.map(value=>(
                  <OptionButton key={value} active={career.team.tactics.defenseStyle===value} onClick={()=>updateTactic("defenseStyle",value)}>
                    {getDefenseLabel(value)}
                  </OptionButton>
                ))}
              </TacticSetting>

              <TacticSetting title="OPERATOR" value={getOperatorLabel(career.team.tactics.operatorUsage)}>
                {OPERATORS.map(value=>(
                  <OptionButton key={value} active={career.team.tactics.operatorUsage===value} onClick={()=>updateTactic("operatorUsage",value)}>
                    {getOperatorLabel(value)}
                  </OptionButton>
                ))}
              </TacticSetting>
            </section>
          </section>

          <section className="coach-tactics__board">
            <header className="coach-tactics__board-head">
              <div>
                <span>TEAM SETUP</span>
                <strong>STARTING FIVE</strong>
              </div>

              <div className="coach-tactics__board-status">
                <span>{starters.length}/5 TITULARES</span>
                <strong className={roleStructure>=85?"good":roleStructure<65?"bad":""}>ROLE STRUCTURE {roleStructure}</strong>
              </div>
            </header>

            <div className="coach-tactics__team-room">
              <div className="coach-tactics__room-grid"/>

              <div className="coach-tactics__stage-title">
                <span>COMPETITIVE SETUP</span>
                <strong>{team?.shortName??team?.name}</strong>
              </div>

              <div className="coach-tactics__seat-row">
                {starters.map((player,index)=>{
                  const tacticalRole=getCoachPlayerTacticalRole(player,assignments);
                  const roleFit=getCoachRoleAssignmentFit(player,tacticalRole);

                  return (
                    <PlayerSeat
                      key={player.id}
                      player={player}
                      index={index}
                      tacticalRole={tacticalRole}
                      roleFit={roleFit}
                      onChangeRole={role=>updatePlayerRole(player.id,role)}
                    />
                  );
                })}

                {!starters.length&&(
                  <div className="coach-tactics__map-empty">
                    <strong>SIN TITULARES</strong>
                    <span>Configura tu plantilla para visualizar el setup.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="coach-tactics__analysis">
              <div className="coach-tactics__notes">
                <span>LECTURA TÁCTICA</span>

                {getRoleNotes(starters,assignments).map(note=>(
                  <div key={note.text} className={`coach-tactics__note ${note.good?"coach-tactics__note--good":"coach-tactics__note--warning"}`}>
                    <b>{note.good?"✓":"!"}</b>
                    <span>{note.text}</span>
                  </div>
                ))}

                {rosterTacticalNotes.map(note=>(
                  <div key={note.text} className={`coach-tactics__note ${note.good?"coach-tactics__note--good":"coach-tactics__note--warning"}`}>
                    <b>{note.good?"✓":"!"}</b>
                    <span>{note.text}</span>
                  </div>
                ))}
              </div>

              <div className="coach-tactics__radar">
                <div className="coach-tactics__radar-shape">
                  <span style={{"--fit":`${fit}%`} as CSSProperties}/>
                </div>

                <div className="coach-tactics__radar-labels">
                  <span>ATK</span>
                  <span>DEF</span>
                  <span>PACE</span>
                  <span>CTRL</span>
                </div>

                <strong>{fit}</strong>
                <small>FIT</small>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function PlayerSeat({
  player,
  index,
  tacticalRole,
  roleFit,
  onChangeRole,
}:{
  player:CoachCareerState["team"]["roster"][number];
  index:number;
  tacticalRole:CoachPlayerTacticalRole;
  roleFit:number;
  onChangeRole:(role:CoachPlayerTacticalRole)=>void;
}) {
  return (
    <article className="coach-tactics__player-seat">
      <div className="coach-tactics__seat-info">
        <span>{String(index+1).padStart(2,"0")}</span>
        <strong>{player.ign}</strong>
        <small>{getRoleLabel(player.role)}</small>
      </div>

      <div className="coach-tactics__chair">
        <img src={playerChair} alt=""/>
      </div>

      <div className="coach-tactics__seat-overall">
        <span>OVR</span>
        <strong>{player.overall}</strong>
      </div>

      <div className="coach-tactics__seat-stats">
        <div>
          <span>AIM</span>
          <strong>{player.stats.aim}</strong>
        </div>

        <div>
          <span>GAME</span>
          <strong>{player.stats.gameSense}</strong>
        </div>

        <div>
          <span>MENTAL</span>
          <strong>{player.stats.mental}</strong>
        </div>
      </div>

      <div className="coach-tactics__player-role">
        <div className="coach-tactics__player-role-head">
          <span>PLAYER ROLE</span>
          <strong className={roleFit>=85?"good":roleFit<70?"bad":""}>{roleFit} FIT</strong>
        </div>

        <select value={tacticalRole} onChange={event=>onChangeRole(event.target.value as CoachPlayerTacticalRole)}>
          {PLAYER_ROLES.map(role=>(
            <option key={role} value={role}>{getPlayerRoleLabel(role)}</option>
          ))}
        </select>
      </div>
    </article>
  );
}

function TacticSetting({title,value,children}:{title:string;value:string;children:ReactNode}) {
  return (
    <article className="coach-tactics__setting">
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>

      <div className="coach-tactics__options">{children}</div>
    </article>
  );
}

function OptionButton({active,onClick,children}:{active:boolean;onClick:()=>void;children:ReactNode}) {
  return <button className={active?"active":""} onClick={onClick}>{children}</button>;
}

function changeStyle(current:CoachTacticalStyle,direction:-1|1,onChange:(style:CoachTacticalStyle)=>void) {
  const index=STYLES.indexOf(current);
  const next=(index+direction+STYLES.length)%STYLES.length;
  onChange(STYLES[next]);
}

function getRoleNotes(starters:CoachCareerState["team"]["roster"],assignments:CoachCareerState["team"]["playerAssignments"]) {
  const roles=starters.map(player=>getCoachPlayerTacticalRole(player,assignments));
  const notes:{text:string;good:boolean}[]=[];

  if(roles.includes("IGL"))notes.push({text:"Existe un IGL definido para dirigir el sistema",good:true});
  else notes.push({text:"No hay ningún IGL asignado",good:false});

  if(roles.includes("Entry"))notes.push({text:"El equipo tiene un Entry principal definido",good:true});
  else notes.push({text:"Falta un Entry principal para abrir rondas",good:false});

  if(roles.includes("Main Operator"))notes.push({text:"Main Operator definido dentro de la estructura",good:true});

  const igls=roles.filter(role=>role==="IGL").length;
  if(igls>1)notes.push({text:"Más de un IGL puede generar conflictos de liderazgo",good:false});

  const operators=roles.filter(role=>role==="Main Operator").length;
  if(operators>1)notes.push({text:"Más de un Main Operator reduce la eficiencia del setup",good:false});

  return notes.slice(0,3);
}

function getRosterTacticalNotes(career:CoachCareerState) {
  const roster=career.team.roster.filter(player=>player.starter).slice(0,5);
  const assignments=career.team.playerAssignments??[];
  const tactics=career.team.tactics;

  if(roster.length<5)return [{text:"Configura cinco titulares para analizar el sistema",good:false}];

  const average=(values:number[])=>values.reduce((sum,value)=>sum+value,0)/values.length;

  const aim=average(roster.map(player=>player.stats.aim));
  const mental=average(roster.map(player=>player.stats.mental));
  const consistency=average(roster.map(player=>player.stats.consistency));
  const communication=average(roster.map(player=>player.stats.communication));
  const gameSense=average(roster.map(player=>player.stats.gameSense));
  const clutch=average(roster.map(player=>player.stats.clutch));

  const getRolePlayer=(role:CoachPlayerTacticalRole)=>roster.find(player=>getCoachPlayerTacticalRole(player,assignments)===role);
  const getRoleFit=(role:CoachPlayerTacticalRole)=>{
    const player=getRolePlayer(role);
    return player?getCoachRoleAssignmentFit(player,role):null;
  };

  const entryFit=getRoleFit("Entry");
  const secondaryEntryFit=getRoleFit("Secondary Entry");
  const iglFit=getRoleFit("IGL");
  const lurkerFit=getRoleFit("Lurker");
  const anchorFit=getRoleFit("Anchor");
  const operatorFit=getRoleFit("Main Operator");

  const notes:{text:string;good:boolean}[]=[];

  if(tactics.pace==="Fast"){
    if(aim>=84&&mental>=80)notes.push({text:"El roster se adapta bien a un ritmo rápido",good:true});
    if(aim<78)notes.push({text:"El Aim promedio limita la efectividad de un ritmo rápido",good:false});
    if(mental<75)notes.push({text:"El Mental bajo aumenta el riesgo de colapsar jugando rápido",good:false});
  }

  if(tactics.pace==="Slow"){
    if(gameSense>=83&&communication>=82)notes.push({text:"El roster tiene buena lectura para jugar rondas lentas",good:true});
    if(gameSense<77)notes.push({text:"El GameSense promedio dificulta aprovechar un ritmo lento",good:false});
  }

  if(tactics.pace==="Balanced"){
    const weakest=Math.min(aim,mental,consistency,communication,gameSense);
    if(weakest>=80)notes.push({text:"El roster es equilibrado y encaja bien con un ritmo balanceado",good:true});
  }

  if(tactics.risk==="High"){
    if(mental>=83&&clutch>=82)notes.push({text:"Mental y Clutch permiten asumir mayor riesgo",good:true});
    if(mental<75)notes.push({text:"High Risk puede castigar a un roster con Mental bajo",good:false});
  }

  if(tactics.risk==="Low"){
    if(consistency>=83&&gameSense>=82)notes.push({text:"La consistencia del roster favorece un estilo de bajo riesgo",good:true});
    if(consistency<76)notes.push({text:"Low Risk pierde eficacia con jugadores poco consistentes",good:false});
  }

  if(tactics.attackStyle==="Explosive"){
    if(entryFit!==null&&entryFit>=85)notes.push({text:"El Entry está muy bien preparado para un ataque explosivo",good:true});
    if(entryFit===null)notes.push({text:"El ataque explosivo necesita un Entry definido",good:false});
    else if(entryFit<72)notes.push({text:"El Entry actual tiene bajo FIT para abrir rondas",good:false});

    if(secondaryEntryFit!==null&&secondaryEntryFit>=82)notes.push({text:"El Secondary Entry complementa bien las entradas",good:true});
  }

  if(tactics.attackStyle==="Defaults"){
    if(iglFit!==null&&iglFit>=82&&lurkerFit!==null&&lurkerFit>=82)notes.push({text:"IGL y Lurker forman una buena estructura para Defaults",good:true});
    if(iglFit===null)notes.push({text:"Los Defaults necesitan un IGL definido",good:false});
  }

  if(tactics.attackStyle==="Map Control"){
    if(gameSense>=84&&communication>=82)notes.push({text:"GameSense y comunicación favorecen el control de mapa",good:true});
    if(gameSense<77)notes.push({text:"El roster tiene poca lectura para sostener Map Control",good:false});
  }

  if(tactics.attackStyle==="Executions"){
    if(communication>=84)notes.push({text:"La comunicación permite ejecutar setups coordinados",good:true});
    if(communication<76)notes.push({text:"Las ejecuciones sufren por baja comunicación",good:false});
  }

  if(tactics.defenseStyle==="Retake"){
    if(anchorFit!==null&&anchorFit>=80&&communication>=82)notes.push({text:"La estructura defensiva está bien preparada para Retake",good:true});
    if(communication<76)notes.push({text:"Retake necesita mejor coordinación entre jugadores",good:false});
  }

  if(tactics.defenseStyle==="Passive"){
    if(anchorFit!==null&&anchorFit>=82)notes.push({text:"El Anchor encaja bien en una defensa pasiva",good:true});
    if(consistency<76)notes.push({text:"Una defensa pasiva exige mayor consistencia",good:false});
  }

  if(tactics.defenseStyle==="Aggressive"){
    if(aim>=84&&mental>=80)notes.push({text:"El roster tiene herramientas para buscar duelos defensivos",good:true});
    if(consistency<75)notes.push({text:"La defensa agresiva puede exponer demasiado a este roster",good:false});
  }

  if(tactics.operatorUsage==="Priority"){
    if(operatorFit!==null&&operatorFit>=85)notes.push({text:"El Main Operator encaja bien como pieza central",good:true});
    if(operatorFit===null)notes.push({text:"Operator Priority necesita un Main Operator asignado",good:false});
    else if(operatorFit<72)notes.push({text:"El Main Operator actual no tiene suficiente FIT",good:false});
  }

  if(career.team.tacticalStyle==="Anti-Strat"){
    const preparation=career.team.mapPool.maps.length
      ?average(career.team.mapPool.maps.map(map=>map.preparation))
      :70;

    if(preparation>=82)notes.push({text:"La preparación del map pool favorece una identidad Anti-Strat",good:true});
    if(preparation<70)notes.push({text:"Anti-Strat necesita mayor preparación del map pool",good:false});
  }

  return notes.slice(0,6);
}

function getStyleIndex(value:CoachTacticalStyle) {
  return String(STYLES.indexOf(value)+1).padStart(2,"0");
}

function getStyleLabel(value:CoachTacticalStyle) {
  if(value==="Aggressive")return "AGRESIVO";
  if(value==="Controlled")return "CONTROLADO";
  if(value==="Reactive")return "REACTIVO";
  if(value==="Anti-Strat")return "ANTI-STRAT";
  return "BALANCEADO";
}

function getPaceLabel(value:CoachPace) {
  return value==="Slow"?"LENTO":value==="Fast"?"RÁPIDO":"BALANCEADO";
}

function getRiskLabel(value:CoachRisk) {
  return value==="Low"?"BAJO":value==="High"?"ALTO":"MEDIO";
}

function getAttackLabel(value:CoachAttackStyle) {
  return value==="Defaults"?"DEFAULTS":value==="Executions"?"EXECUCIONES":value==="Map Control"?"CONTROL DE MAPA":"EXPLOSIVO";
}

function getDefenseLabel(value:CoachDefenseStyle) {
  return value==="Passive"?"PASIVA":value==="Aggressive"?"AGRESIVA":value==="Retake"?"RETAKE":"ESTÁNDAR";
}

function getOperatorLabel(value:CoachOperatorUsage) {
  return value==="Rare"?"OCASIONAL":value==="Priority"?"PRIORIDAD":"SITUACIONAL";
}

function getRoleLabel(role:CoachCareerState["team"]["roster"][number]["role"]) {
  if(role==="Duelist")return "DUELISTA";
  if(role==="Initiator")return "INICIADOR";
  if(role==="Controller")return "CONTROLADOR";
  if(role==="Sentinel")return "CENTINELA";
  if(role==="IGL")return "IGL";
  return "FLEX";
}

function getPlayerRoleLabel(role:CoachPlayerTacticalRole) {
  if(role==="Entry")return "ENTRY";
  if(role==="Secondary Entry")return "SECONDARY ENTRY";
  if(role==="Main Operator")return "MAIN OPERATOR";
  if(role==="IGL")return "IGL";
  if(role==="Lurker")return "LURKER";
  if(role==="Anchor")return "ANCHOR";
  return "FLEX";
}

function getDebugOpponent(career:CoachCareerState) {
  return career.playerPool.find(player=>player.teamId&&player.teamId!==career.team.teamId)?.teamId??"";
}