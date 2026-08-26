import type {ReactNode} from "react";
import type {CoachAttackStyle,CoachCareerState,CoachDefenseStyle,CoachOperatorUsage,CoachPace,CoachPlayerTacticalRole,CoachRisk,CoachTacticalStyle} from "../../types/coach";
import {getTeamById} from "../../data/teams";
import {getCoachTacticalFit,getTacticalIdentityDescription} from "../../logic/coachTactics";
import {assignCoachPlayerTacticalRole,getCoachPlayerTacticalRole,getCoachRoleAssignmentFit,getCoachRoleStructureScore} from "../../logic/coachPlayerRoles";
import {useGameSettings} from "../../context/GameSettingsContext";
import {GameSettingsControls} from "../shared/GameSettingsControls";
import {getTeamLogo} from "../../utils/teamLogo";
import playerChair from "../../images/ui/chair.png";
import "../../styles/CoachTactics.css";

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
  const {language}=useGameSettings();
  const es=language==="es";

  const fit=getCoachTacticalFit(career);
  const team=getTeamById(career.team.teamId);
  const logo=getTeamLogo(team?.logo);
  const starters=career.team.roster.filter(player=>player.starter).slice(0,5);
  const assignments=career.team.playerAssignments??[];
  const roleStructure=getCoachRoleStructureScore(starters,assignments);
  const rosterTacticalNotes=getRosterTacticalNotes(career,language);

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
              <strong>{es?"EDITAR TÁCTICA":"EDIT TACTICS"}</strong>
              <small>{team?.name??(es?"Equipo":"Team")} · {team?.circuit}</small>
            </div>
          </div>

          <nav className="coach-tactics__tabs">
            <button className="active">{es?"TÁCTICAS DE EQUIPO":"TEAM TACTICS"}</button>
          </nav>

          <div className="coach-tactics__topbar-actions">
            <GameSettingsControls/>
            <button className="coach-tactics__back" onClick={onBack}>← {es?"MENÚ":"MENU"}</button>
          </div>
        </header>

        <section className="coach-tactics__titlebar">
          <div>
            <span>{es?"SISTEMA TÁCTICO":"TACTICAL SYSTEM"}</span>
            <h1>{getStyleLabel(career.team.tacticalStyle,language)}</h1>
            <small>
              {fit>=85
                ?es?"SISTEMA MUY COHERENTE":"HIGHLY COHERENT SYSTEM"
                :fit>=70
                  ?es?"SISTEMA COMPETITIVO":"COMPETITIVE SYSTEM"
                  :es?"REQUIERE AJUSTES":"NEEDS ADJUSTMENTS"}
            </small>
          </div>

          <div className="coach-tactics__title-metrics">
            <div className={`coach-tactics__fit-badge${roleStructure>=85?" coach-tactics__fit-badge--good":roleStructure<65?" coach-tactics__fit-badge--bad":""}`}>
              <span>{es?"ESTRUCTURA DE ROLES":"ROLE STRUCTURE"}</span>
              <strong>{roleStructure}</strong>
            </div>

            <div className={`coach-tactics__fit-badge${fit>=85?" coach-tactics__fit-badge--good":fit<65?" coach-tactics__fit-badge--bad":""}`}>
              <span>{es?"AJUSTE TÁCTICO":"TACTICAL FIT"}</span>
              <strong>{fit}</strong>
            </div>
          </div>
        </section>

        <div className="coach-tactics__workspace">
          <section className="coach-tactics__editor">
            <article className="coach-tactics__preset-panel">
              <header>
                <div>
                  <span>{es?"PRESET TÁCTICO":"TACTICAL PRESET"}</span>
                  <strong>{getStyleLabel(career.team.tacticalStyle,language)}</strong>
                </div>

                <div className="coach-tactics__preset-arrows">
                  <button onClick={()=>changeStyle(career.team.tacticalStyle,-1,setStyle)}>‹</button>
                  <button onClick={()=>changeStyle(career.team.tacticalStyle,1,setStyle)}>›</button>
                </div>
              </header>

              <p>{getTacticalIdentityDescriptionLocalized(career.team.tacticalStyle,language)}</p>

              <div className="coach-tactics__preset-icon">
                <span/>
                <span/>
                <span/>
              </div>

              <div className="coach-tactics__preset-list">
                {STYLES.map(style=>(
                  <button key={style} className={career.team.tacticalStyle===style?"active":""} onClick={()=>setStyle(style)}>
                    <span>{getStyleIndex(style)}</span>
                    <strong>{getStyleLabel(style,language)}</strong>
                  </button>
                ))}
              </div>
            </article>

            <section className="coach-tactics__settings">
              <TacticSetting title={es?"RITMO DE JUEGO":"GAME PACE"} value={getPaceLabel(career.team.tactics.pace,language)}>
                {PACES.map(value=>(
                  <OptionButton key={value} active={career.team.tactics.pace===value} onClick={()=>updateTactic("pace",value)}>
                    {getPaceLabel(value,language)}
                  </OptionButton>
                ))}
              </TacticSetting>

              <TacticSetting title={es?"RIESGO":"RISK"} value={getRiskLabel(career.team.tactics.risk,language)}>
                {RISKS.map(value=>(
                  <OptionButton key={value} active={career.team.tactics.risk===value} onClick={()=>updateTactic("risk",value)}>
                    {getRiskLabel(value,language)}
                  </OptionButton>
                ))}
              </TacticSetting>

              <TacticSetting title={es?"ATAQUE":"ATTACK"} value={getAttackLabel(career.team.tactics.attackStyle,language)}>
                {ATTACKS.map(value=>(
                  <OptionButton key={value} active={career.team.tactics.attackStyle===value} onClick={()=>updateTactic("attackStyle",value)}>
                    {getAttackLabel(value,language)}
                  </OptionButton>
                ))}
              </TacticSetting>

              <TacticSetting title={es?"DEFENSA":"DEFENSE"} value={getDefenseLabel(career.team.tactics.defenseStyle,language)}>
                {DEFENSES.map(value=>(
                  <OptionButton key={value} active={career.team.tactics.defenseStyle===value} onClick={()=>updateTactic("defenseStyle",value)}>
                    {getDefenseLabel(value,language)}
                  </OptionButton>
                ))}
              </TacticSetting>

              <TacticSetting title="OPERATOR" value={getOperatorLabel(career.team.tactics.operatorUsage,language)}>
                {OPERATORS.map(value=>(
                  <OptionButton key={value} active={career.team.tactics.operatorUsage===value} onClick={()=>updateTactic("operatorUsage",value)}>
                    {getOperatorLabel(value,language)}
                  </OptionButton>
                ))}
              </TacticSetting>
            </section>
          </section>

          <section className="coach-tactics__board">
            <header className="coach-tactics__board-head">
              <div>
                <span>{es?"CONFIGURACIÓN DEL EQUIPO":"TEAM SETUP"}</span>
                <strong>{es?"CINCO TITULARES":"STARTING FIVE"}</strong>
              </div>

              <div className="coach-tactics__board-status">
                <span>{starters.length}/5 {es?"TITULARES":"STARTERS"}</span>
                <strong className={roleStructure>=85?"good":roleStructure<65?"bad":""}>{es?"ESTRUCTURA":"ROLE STRUCTURE"} {roleStructure}</strong>
              </div>
            </header>

            <div className="coach-tactics__team-room">
              <div className="coach-tactics__room-grid"/>

              <div className="coach-tactics__stage-title">
                <span>{es?"SETUP COMPETITIVO":"COMPETITIVE SETUP"}</span>
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
                      language={language}
                      onChangeRole={role=>updatePlayerRole(player.id,role)}
                    />
                  );
                })}

                {!starters.length&&(
                  <div className="coach-tactics__map-empty">
                    <strong>{es?"SIN TITULARES":"NO STARTERS"}</strong>
                    <span>{es?"Configura tu plantilla para visualizar el setup.":"Configure your roster to visualize the setup."}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="coach-tactics__analysis">
              <div className="coach-tactics__notes">
                <span>{es?"LECTURA TÁCTICA":"TACTICAL ANALYSIS"}</span>

                {getRoleNotes(starters,assignments,language).map(note=>(
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
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function PlayerSeat({player,index,tacticalRole,roleFit,language,onChangeRole}:{
  player:CoachCareerState["team"]["roster"][number];
  index:number;
  tacticalRole:CoachPlayerTacticalRole;
  roleFit:number;
  language:"es"|"en";
  onChangeRole:(role:CoachPlayerTacticalRole)=>void;
}) {
  const es=language==="es";

  return (
    <article className="coach-tactics__player-seat">
      <div className="coach-tactics__seat-info">
        <span>{String(index+1).padStart(2,"0")}</span>
        <strong>{player.ign}</strong>
        <small>{getRoleLabel(player.role,language)}</small>
      </div>

      <div className="coach-tactics__chair">
        <img src={playerChair} alt=""/>
      </div>

      <div className="coach-tactics__seat-overall">
        <span>OVR</span>
        <strong>{player.overall}</strong>
      </div>

      <div className="coach-tactics__seat-stats">
        <div><span>AIM</span><strong>{player.stats.aim}</strong></div>
        <div><span>GAME</span><strong>{player.stats.gameSense}</strong></div>
        <div><span>MENTAL</span><strong>{player.stats.mental}</strong></div>
      </div>

      <div className="coach-tactics__player-role">
        <div className="coach-tactics__player-role-head">
          <span>{es?"ROL DEL JUGADOR":"PLAYER ROLE"}</span>
          <strong className={roleFit>=85?"good":roleFit<70?"bad":""}>{roleFit} FIT</strong>
        </div>

        <select value={tacticalRole} onChange={event=>onChangeRole(event.target.value as CoachPlayerTacticalRole)}>
          {PLAYER_ROLES.map(role=>(
            <option key={role} value={role}>{getPlayerRoleLabel(role,language)}</option>
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

function getRoleNotes(starters:CoachCareerState["team"]["roster"],assignments:CoachCareerState["team"]["playerAssignments"],language:"es"|"en") {
  const es=language==="es";
  const roles=starters.map(player=>getCoachPlayerTacticalRole(player,assignments));
  const notes:{text:string;good:boolean}[]=[];

  if(roles.includes("IGL"))notes.push({text:es?"Existe un IGL definido para dirigir el sistema":"An IGL is assigned to lead the system",good:true});
  else notes.push({text:es?"No hay ningún IGL asignado":"No IGL is currently assigned",good:false});

  if(roles.includes("Entry"))notes.push({text:es?"El equipo tiene un Entry principal definido":"The team has a defined primary Entry",good:true});
  else notes.push({text:es?"Falta un Entry principal para abrir rondas":"A primary Entry is needed to open rounds",good:false});

  if(roles.includes("Main Operator"))notes.push({text:es?"Main Operator definido dentro de la estructura":"A Main Operator is defined within the structure",good:true});

  const igls=roles.filter(role=>role==="IGL").length;
  if(igls>1)notes.push({text:es?"Más de un IGL puede generar conflictos de liderazgo":"Multiple IGLs may create leadership conflicts",good:false});

  const operators=roles.filter(role=>role==="Main Operator").length;
  if(operators>1)notes.push({text:es?"Más de un Main Operator reduce la eficiencia del setup":"Multiple Main Operators reduce setup efficiency",good:false});

  return notes.slice(0,3);
}

function getRosterTacticalNotes(career:CoachCareerState,language:"es"|"en") {
  const es=language==="es";
  const roster=career.team.roster.filter(player=>player.starter).slice(0,5);
  const assignments=career.team.playerAssignments??[];
  const tactics=career.team.tactics;

  if(roster.length<5)return [{text:es?"Configura cinco titulares para analizar el sistema":"Configure five starters to analyze the system",good:false}];

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
    if(aim>=84&&mental>=80)notes.push({text:es?"El roster se adapta bien a un ritmo rápido":"The roster adapts well to a fast pace",good:true});
    if(aim<78)notes.push({text:es?"El Aim promedio limita la efectividad de un ritmo rápido":"Average Aim limits the effectiveness of a fast pace",good:false});
    if(mental<75)notes.push({text:es?"El Mental bajo aumenta el riesgo de colapsar jugando rápido":"Low Mental increases the risk of collapsing at a fast pace",good:false});
  }

  if(tactics.pace==="Slow"){
    if(gameSense>=83&&communication>=82)notes.push({text:es?"El roster tiene buena lectura para jugar rondas lentas":"The roster has strong awareness for slow rounds",good:true});
    if(gameSense<77)notes.push({text:es?"El GameSense promedio dificulta aprovechar un ritmo lento":"Average Game Sense makes slow play harder to execute",good:false});
  }

  if(tactics.pace==="Balanced"){
    const weakest=Math.min(aim,mental,consistency,communication,gameSense);
    if(weakest>=80)notes.push({text:es?"El roster es equilibrado y encaja bien con un ritmo balanceado":"The roster is well balanced and fits a balanced pace",good:true});
  }

  if(tactics.risk==="High"){
    if(mental>=83&&clutch>=82)notes.push({text:es?"Mental y Clutch permiten asumir mayor riesgo":"Mental and Clutch allow the team to take greater risks",good:true});
    if(mental<75)notes.push({text:es?"High Risk puede castigar a un roster con Mental bajo":"High Risk can punish a roster with low Mental",good:false});
  }

  if(tactics.risk==="Low"){
    if(consistency>=83&&gameSense>=82)notes.push({text:es?"La consistencia del roster favorece un estilo de bajo riesgo":"Roster consistency favors a low-risk style",good:true});
    if(consistency<76)notes.push({text:es?"Low Risk pierde eficacia con jugadores poco consistentes":"Low Risk becomes less effective with inconsistent players",good:false});
  }

  if(tactics.attackStyle==="Explosive"){
    if(entryFit!==null&&entryFit>=85)notes.push({text:es?"El Entry está muy bien preparado para un ataque explosivo":"The Entry is highly suited to explosive attacks",good:true});
    if(entryFit===null)notes.push({text:es?"El ataque explosivo necesita un Entry definido":"Explosive attacks require a defined Entry",good:false});
    else if(entryFit<72)notes.push({text:es?"El Entry actual tiene bajo FIT para abrir rondas":"The current Entry has low FIT for opening rounds",good:false});

    if(secondaryEntryFit!==null&&secondaryEntryFit>=82)notes.push({text:es?"El Secondary Entry complementa bien las entradas":"The Secondary Entry complements the primary Entry well",good:true});
  }

  if(tactics.attackStyle==="Defaults"){
    if(iglFit!==null&&iglFit>=82&&lurkerFit!==null&&lurkerFit>=82)notes.push({text:es?"IGL y Lurker forman una buena estructura para Defaults":"IGL and Lurker form a strong structure for Defaults",good:true});
    if(iglFit===null)notes.push({text:es?"Los Defaults necesitan un IGL definido":"Defaults require a defined IGL",good:false});
  }

  if(tactics.attackStyle==="Map Control"){
    if(gameSense>=84&&communication>=82)notes.push({text:es?"GameSense y comunicación favorecen el control de mapa":"Game Sense and communication favor strong map control",good:true});
    if(gameSense<77)notes.push({text:es?"El roster tiene poca lectura para sostener Map Control":"The roster lacks the awareness needed to sustain Map Control",good:false});
  }

  if(tactics.attackStyle==="Executions"){
    if(communication>=84)notes.push({text:es?"La comunicación permite ejecutar setups coordinados":"Communication enables coordinated executions",good:true});
    if(communication<76)notes.push({text:es?"Las ejecuciones sufren por baja comunicación":"Executions suffer from poor communication",good:false});
  }

  if(tactics.defenseStyle==="Retake"){
    if(anchorFit!==null&&anchorFit>=80&&communication>=82)notes.push({text:es?"La estructura defensiva está bien preparada para Retake":"The defensive structure is well suited for Retakes",good:true});
    if(communication<76)notes.push({text:es?"Retake necesita mejor coordinación entre jugadores":"Retake requires better coordination between players",good:false});
  }

  if(tactics.defenseStyle==="Passive"){
    if(anchorFit!==null&&anchorFit>=82)notes.push({text:es?"El Anchor encaja bien en una defensa pasiva":"The Anchor fits a passive defense well",good:true});
    if(consistency<76)notes.push({text:es?"Una defensa pasiva exige mayor consistencia":"A passive defense requires greater consistency",good:false});
  }

  if(tactics.defenseStyle==="Aggressive"){
    if(aim>=84&&mental>=80)notes.push({text:es?"El roster tiene herramientas para buscar duelos defensivos":"The roster has the tools to seek defensive duels",good:true});
    if(consistency<75)notes.push({text:es?"La defensa agresiva puede exponer demasiado a este roster":"Aggressive defense may expose this roster too much",good:false});
  }

  if(tactics.operatorUsage==="Priority"){
    if(operatorFit!==null&&operatorFit>=85)notes.push({text:es?"El Main Operator encaja bien como pieza central":"The Main Operator fits well as a central piece",good:true});
    if(operatorFit===null)notes.push({text:es?"Operator Priority necesita un Main Operator asignado":"Operator Priority requires an assigned Main Operator",good:false});
    else if(operatorFit<72)notes.push({text:es?"El Main Operator actual no tiene suficiente FIT":"The current Main Operator does not have enough FIT",good:false});
  }

  if(career.team.tacticalStyle==="Anti-Strat"){
    const preparation=career.team.mapPool.maps.length?average(career.team.mapPool.maps.map(map=>map.preparation)):70;

    if(preparation>=82)notes.push({text:es?"La preparación del map pool favorece una identidad Anti-Strat":"Map pool preparation supports an Anti-Strat identity",good:true});
    if(preparation<70)notes.push({text:es?"Anti-Strat necesita mayor preparación del map pool":"Anti-Strat requires greater map pool preparation",good:false});
  }

  return notes.slice(0,6);
}

function getTacticalIdentityDescriptionLocalized(style:CoachTacticalStyle,language:"es"|"en") {
  if(language==="es")return getTacticalIdentityDescription(style);

  if(style==="Aggressive")return "A high-pressure identity focused on initiative, fast engagements and forcing favorable duels.";
  if(style==="Controlled")return "A structured identity focused on map control, discipline and predictable execution.";
  if(style==="Reactive")return "An adaptive identity built around information, opponent reads and punishing mistakes.";
  if(style==="Anti-Strat")return "An opponent-specific identity focused on preparation, counterplay and neutralizing rival strengths.";

  return "A balanced identity combining initiative, structure and adaptability.";
}

function getStyleIndex(value:CoachTacticalStyle) {
  return String(STYLES.indexOf(value)+1).padStart(2,"0");
}

function getStyleLabel(value:CoachTacticalStyle,language:"es"|"en") {
  if(language==="en")return value.toUpperCase();

  if(value==="Aggressive")return "AGRESIVO";
  if(value==="Controlled")return "CONTROLADO";
  if(value==="Reactive")return "REACTIVO";
  if(value==="Anti-Strat")return "ANTI-STRAT";

  return "BALANCEADO";
}

function getPaceLabel(value:CoachPace,language:"es"|"en") {
  if(language==="en")return value.toUpperCase();
  return value==="Slow"?"LENTO":value==="Fast"?"RÁPIDO":"BALANCEADO";
}

function getRiskLabel(value:CoachRisk,language:"es"|"en") {
  if(language==="en")return value.toUpperCase();
  return value==="Low"?"BAJO":value==="High"?"ALTO":"MEDIO";
}

function getAttackLabel(value:CoachAttackStyle,language:"es"|"en") {
  if(language==="en")return value.toUpperCase();
  return value==="Defaults"?"DEFAULTS":value==="Executions"?"EJECUCIONES":value==="Map Control"?"CONTROL DE MAPA":"EXPLOSIVO";
}

function getDefenseLabel(value:CoachDefenseStyle,language:"es"|"en") {
  if(language==="en")return value.toUpperCase();
  return value==="Passive"?"PASIVA":value==="Aggressive"?"AGRESIVA":value==="Retake"?"RETAKE":"ESTÁNDAR";
}

function getOperatorLabel(value:CoachOperatorUsage,language:"es"|"en") {
  if(language==="en")return value.toUpperCase();
  return value==="Rare"?"OCASIONAL":value==="Priority"?"PRIORIDAD":"SITUACIONAL";
}

function getRoleLabel(role:CoachCareerState["team"]["roster"][number]["role"],language:"es"|"en") {
  if(language==="en")return role.toUpperCase();

  if(role==="Duelist")return "DUELISTA";
  if(role==="Initiator")return "INICIADOR";
  if(role==="Controller")return "CONTROLADOR";
  if(role==="Sentinel")return "CENTINELA";
  if(role==="IGL")return "IGL";

  return "FLEX";
}

function getPlayerRoleLabel(role:CoachPlayerTacticalRole,language:"es"|"en") {
  if(language==="en")return role.toUpperCase();

  if(role==="Entry")return "ENTRY";
  if(role==="Secondary Entry")return "SECONDARY ENTRY";
  if(role==="Main Operator")return "MAIN OPERATOR";
  if(role==="IGL")return "IGL";
  if(role==="Lurker")return "LURKER";
  if(role==="Anchor")return "ANCHOR";

  return "FLEX";
}