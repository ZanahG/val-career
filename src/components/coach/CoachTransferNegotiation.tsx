import {useMemo,useState} from "react";
import type {CoachCareerState,CoachPlayer} from "../../types/coach";
import type {GameCurrency} from "../../types/settings";
import {getCoachMinimumAcceptedTransferFee,getCoachPlayerBuyout} from "../../logic/coachTransferEconomy";
import {getCoachPlayerMarketValue} from "../../logic/coachPlayerValue";
import {getTeamById} from "../../data/teams";
import {useGameSettings} from "../../context/GameSettingsContext";
import {GameSettingsControls} from "../shared/GameSettingsControls";
import {formatCurrency} from "../../utils/currency";
import {getTeamLogo} from "../../utils/teamLogo";
import "../../styles/CoachTransferNegotiation.css";

interface CoachTransferNegotiationProps {
  career:CoachCareerState;
  playerId:string;
  onUpdateCareer:(career:CoachCareerState)=>void;
  onCancel:()=>void;
  onComplete:()=>void;
}

type NegotiationStep="Club"|"Player"|"Squad"|"Complete";
type NegotiationMood="Neutral"|"Positive"|"Warning"|"Rejected"|"Accepted";
type Language="es"|"en";

const MAX_ROSTER_SIZE=5;
const MAX_NEGOTIATION_ROUNDS=3;

export function CoachTransferNegotiation({career,playerId,onUpdateCareer,onCancel,onComplete}:CoachTransferNegotiationProps) {
  const {language,currency}=useGameSettings();
  const es=language==="es";

  const sourcePlayer=useMemo(()=>career.playerPool.find(player=>player.id===playerId)??null,[career.playerPool,playerId]);
  const player=sourcePlayer?normalizeMarketPlayer(sourcePlayer):null;

  const transferRequests=
    career.midseasonMarket&&!career.midseasonMarket.completed
      ?career.midseasonMarket.transferRequests
      :career.offseason&&!career.offseason.completed&&career.offseason.phase==="Market"
        ?career.offseason.transferRequests
        :[];

  const transferRequested=Boolean(player&&transferRequests.some(request=>request.playerId===player.id));

  const sellerRoster=useMemo(()=>{
    if(!player||player.teamId==="free-agent")return [];
    return career.playerPool.filter(current=>current.teamId===player.teamId);
  },[career.playerPool,player]);

  const freeAgent=player?.teamId==="free-agent";

  const minimumTransferFee=player&&!freeAgent?getCoachMinimumAcceptedTransferFee(player,sellerRoster,transferRequested):0;
  const buyout=player&&!freeAgent?getCoachPlayerBuyout(player):0;
  const clubAskingPrice=player&&!freeAgent?getClubAskingPrice(player,minimumTransferFee,buyout,career.coach.season,transferRequested):0;
  const expectedSalary=player?getExpectedSalary(player,career.coach.season):0;

  const [step,setStep]=useState<NegotiationStep>(freeAgent?"Player":"Club");

  const [clubOffer,setClubOffer]=useState(()=>roundTransferFee(Math.max(player?.marketValue??0,minimumTransferFee*.80)));
  const [clubCounterOffer,setClubCounterOffer]=useState<number|null>(null);
  const [agreedTransferFee,setAgreedTransferFee]=useState(0);
  const [clubRounds,setClubRounds]=useState(0);
  const [clubNegotiationEnded,setClubNegotiationEnded]=useState(false);

  const [salaryOffer,setSalaryOffer]=useState(()=>roundSalary(expectedSalary*.90));
  const [playerCounterSalary,setPlayerCounterSalary]=useState<number|null>(null);
  const [contractYears,setContractYears]=useState(2);
  const [agreedSalary,setAgreedSalary]=useState(0);
  const [playerRounds,setPlayerRounds]=useState(0);
  const [playerNegotiationEnded,setPlayerNegotiationEnded]=useState(false);

  const [replacePlayerId,setReplacePlayerId]=useState("");
  const [mood,setMood]=useState<NegotiationMood>("Neutral");

  const [message,setMessage]=useState(
    freeAgent
      ?es?"El agente está preparado para escuchar tu propuesta.":"The agent is ready to hear your proposal."
      :es?"El club está dispuesto a escuchar una oferta.":"The club is willing to hear an offer.",
  );

  if(!player){
    return (
      <main className="coach-negotiation">
        <div className="coach-negotiation__scene"/>
        <div className="coach-negotiation__overlay"/>

        <header className="coach-negotiation__topbar">
          <GameSettingsControls/>
        </header>

        <section className="coach-negotiation__missing">
          <strong>{es?"JUGADOR NO DISPONIBLE":"PLAYER UNAVAILABLE"}</strong>
          <p>{es?"El jugador ya no se encuentra disponible para negociar.":"The player is no longer available for negotiation."}</p>
          <button onClick={onCancel}>{es?"VOLVER AL MERCADO":"BACK TO MARKET"}</button>
        </section>
      </main>
    );
  }

  const currentTeam=getTeamById(player.teamId);
  const currentTeamLogo=getTeamLogo(currentTeam?.logo);
  const yourTeam=getTeamById(career.team.teamId);
  const yourTeamLogo=getTeamLogo(yourTeam?.logo);

  const rosterFull=career.team.roster.length>=MAX_ROSTER_SIZE;
  const replacePlayer=career.team.roster.find(current=>current.id===replacePlayerId)??null;

  const finalTransferFee=freeAgent?0:agreedTransferFee;
  const finalSalary=agreedSalary;

  const projectedPayroll=career.team.finances.currentMonthlyPayroll-(replacePlayer?.salary??0)+finalSalary;
  const projectedTransferBudget=career.team.finances.transferBudget-finalTransferFee;

  const validSquadDecision=!rosterFull||Boolean(replacePlayer);

  const canConfirm=
    step==="Complete"&&
    validSquadDecision&&
    projectedPayroll<=career.team.finances.monthlyBudget&&
    projectedTransferBudget>=0;

  const tension=getNegotiationTension({
    step,
    clubOffer,
    minimumTransferFee,
    salaryOffer,
    expectedSalary:getContractSalaryExpectation(expectedSalary,contractYears),
    mood,
  });

  const changeClubOffer=(value:number)=>{
    if(clubNegotiationEnded)return;
    setClubOffer(Math.max(0,roundTransferFee(value)));
    setClubCounterOffer(null);
  };

  const handleClubOffer=()=>{
    if(step!=="Club"||clubNegotiationEnded)return;

    const nextRound=clubRounds+1;
    setClubRounds(nextRound);
    setClubCounterOffer(null);

    if(buyout>0&&clubOffer>=buyout){
      setAgreedTransferFee(clubOffer);
      setMood("Accepted");
      setMessage(
        es
          ?`Has alcanzado la cláusula de salida. ${currentTeam?.name??"El club"} no puede impedir la negociación.`
          :`You have met the buyout clause. ${currentTeam?.name??"The club"} cannot block the negotiation.`,
      );
      setStep("Player");
      return;
    }

    if(clubOffer>=minimumTransferFee){
      setAgreedTransferFee(clubOffer);
      setMood("Accepted");
      setMessage(
        es
          ?`${currentTeam?.name??"El club"} ha aceptado tu oferta de ${formatCurrency(clubOffer,currency)}.`
          :`${currentTeam?.name??"The club"} has accepted your offer of ${formatCurrency(clubOffer,currency)}.`,
      );
      setStep("Player");
      return;
    }

    const ratio=minimumTransferFee>0?clubOffer/minimumTransferFee:1;

    if(nextRound>=MAX_NEGOTIATION_ROUNDS&&ratio<.93){
      setClubNegotiationEnded(true);
      setMood("Rejected");
      setMessage(
        es
          ?`${currentTeam?.name??"El club"} considera que las negociaciones no están avanzando y abandona la mesa.`
          :`${currentTeam?.name??"The club"} believes negotiations are not progressing and walks away.`,
      );
      return;
    }

    if(ratio>=.85){
      const counter=getClubCounterOffer(minimumTransferFee,clubAskingPrice,clubOffer,nextRound);

      setClubCounterOffer(counter);
      setMood("Warning");
      setMessage(
        es
          ?`${currentTeam?.name??"El club"} rechaza tu propuesta y responde con una contraoferta de ${formatCurrency(counter,currency)}.`
          :`${currentTeam?.name??"The club"} rejects your proposal and responds with a counteroffer of ${formatCurrency(counter,currency)}.`,
      );
      return;
    }

    setMood("Rejected");

    setMessage(
      nextRound>=MAX_NEGOTIATION_ROUNDS
        ?es
          ?`${currentTeam?.name??"El club"} rechaza la oferta y termina las conversaciones.`
          :`${currentTeam?.name??"The club"} rejects the offer and ends negotiations.`
        :es
          ?`La oferta de ${formatCurrency(clubOffer,currency)} está demasiado alejada de la valoración del club.`
          :`The offer of ${formatCurrency(clubOffer,currency)} is too far from the club's valuation.`,
    );

    if(nextRound>=MAX_NEGOTIATION_ROUNDS)setClubNegotiationEnded(true);
  };

  const acceptClubCounter=()=>{
    if(step!=="Club"||clubNegotiationEnded||clubCounterOffer===null)return;

    setAgreedTransferFee(clubCounterOffer);
    setClubOffer(clubCounterOffer);
    setClubCounterOffer(null);
    setMood("Accepted");
    setMessage(
      es
        ?`Acuerdo alcanzado con ${currentTeam?.name??"el club"} por ${formatCurrency(clubCounterOffer,currency)}.`
        :`Agreement reached with ${currentTeam?.name??"the club"} for ${formatCurrency(clubCounterOffer,currency)}.`,
    );
    setStep("Player");
  };

  const changeSalaryOffer=(value:number)=>{
    if(playerNegotiationEnded)return;
    setSalaryOffer(Math.max(1000,roundSalary(value)));
    setPlayerCounterSalary(null);
  };

  const changeContractYears=(years:number)=>{
    if(playerNegotiationEnded)return;

    const expectation=getContractSalaryExpectation(expectedSalary,years);

    setContractYears(years);
    setSalaryOffer(roundSalary(expectation*.90));
    setPlayerCounterSalary(null);
  };

  const handlePlayerOffer=()=>{
    if(step!=="Player"||playerNegotiationEnded)return;

    const nextRound=playerRounds+1;
    const adjustedExpectation=getContractSalaryExpectation(expectedSalary,contractYears);
    const ratio=salaryOffer/adjustedExpectation;

    setPlayerRounds(nextRound);
    setPlayerCounterSalary(null);

    if(salaryOffer>=adjustedExpectation){
      setAgreedSalary(salaryOffer);
      setMood("Accepted");
      setMessage(
        es
          ?`${player.ign} acepta un contrato de ${formatYears(contractYears,language)} por ${formatCurrency(salaryOffer,currency)} mensuales.`
          :`${player.ign} accepts a ${formatYears(contractYears,language)} contract worth ${formatCurrency(salaryOffer,currency)} per month.`,
      );
      setStep(rosterFull?"Squad":"Complete");
      return;
    }

    if(nextRound>=MAX_NEGOTIATION_ROUNDS&&ratio<.93){
      setPlayerNegotiationEnded(true);
      setMood("Rejected");
      setMessage(
        es
          ?`${player.ign} y su agente han decidido terminar las conversaciones.`
          :`${player.ign} and his agent have decided to end negotiations.`,
      );
      return;
    }

    if(ratio>=.88){
      const counterSalary=getPlayerCounterSalary(adjustedExpectation,nextRound);

      setPlayerCounterSalary(counterSalary);
      setMood("Warning");
      setMessage(
        es
          ?`${player.ign} está interesado, pero su agente solicita ${formatCurrency(counterSalary,currency)} al mes.`
          :`${player.ign} is interested, but his agent is requesting ${formatCurrency(counterSalary,currency)} per month.`,
      );
      return;
    }

    setMood("Rejected");

    setMessage(
      nextRound>=MAX_NEGOTIATION_ROUNDS
        ?es
          ?`${player.ign} considera insuficiente la propuesta y abandona las negociaciones.`
          :`${player.ign} considers the proposal insufficient and walks away.`
        :es
          ?`${player.ign} considera que la propuesta salarial no refleja su valor actual.`
          :`${player.ign} believes the salary proposal does not reflect his current value.`,
    );

    if(nextRound>=MAX_NEGOTIATION_ROUNDS)setPlayerNegotiationEnded(true);
  };

  const acceptPlayerCounter=()=>{
    if(step!=="Player"||playerNegotiationEnded||playerCounterSalary===null)return;

    setAgreedSalary(playerCounterSalary);
    setSalaryOffer(playerCounterSalary);
    setPlayerCounterSalary(null);
    setMood("Accepted");
    setMessage(es?`${player.ign} acepta el contrato propuesto.`:`${player.ign} accepts the proposed contract.`);
    setStep(rosterFull?"Squad":"Complete");
  };

  const handleSquadContinue=()=>{
    if(step!=="Squad"||!replacePlayer)return;

    setMood("Positive");
    setMessage(
      es
        ?`${replacePlayer.ign} será liberado para registrar a ${player.ign}.`
        :`${replacePlayer.ign} will be released to register ${player.ign}.`,
    );
    setStep("Complete");
  };

  const handleConfirm=()=>{
    if(!canConfirm)return;

    const updated=completeTransfer(
      career,
      player,
      finalTransferFee,
      finalSalary,
      contractYears,
      replacePlayer?.id,
      transferRequested,
    );

    if(!updated){
      setMood("Rejected");
      setMessage(
        es
          ?"La operación ya no puede completarse. La plantilla, el presupuesto o las condiciones del mercado han cambiado."
          :"The deal can no longer be completed. The roster, budget or market conditions have changed.",
      );
      return;
    }

    onUpdateCareer(updated);
    onComplete();
  };

  return (
    <main className="coach-negotiation">
      <div className="coach-negotiation__scene"/>
      <div className="coach-negotiation__overlay"/>

      <header className="coach-negotiation__topbar">
        <div className="coach-negotiation__budget">
          {yourTeamLogo&&<img src={yourTeamLogo} alt=""/>}
          <span>{es?"PRESUPUESTO":"BUDGET"}</span>
          <strong>{formatCurrency(career.team.finances.transferBudget,currency)}</strong>
        </div>

        <div className="coach-negotiation__topbar-actions">
          <GameSettingsControls/>
          <button className="coach-negotiation__exit" onClick={onCancel}>✕</button>
        </div>
      </header>

      <aside className="coach-negotiation__sidebar">
        <div className="coach-negotiation__tabs">
          <span className="active">
            {step==="Club"
              ?es?"OFERTA":"OFFER"
              :es?"CONTRATO":"CONTRACT"}
          </span>

          <span>
            {step==="Club"
              ?es?"COMPRAR":"BUY"
              :es?"NEGOCIAR":"NEGOTIATE"}
          </span>
        </div>

        <div className="coach-negotiation__sidebar-player">
          <div className="coach-negotiation__sidebar-avatar">{player.ign.slice(0,1).toUpperCase()}</div>

          <div>
            <small>{es?"Edad":"Age"}: {player.age}</small>
            <strong>{player.ign}</strong>
            <span>{getRoleLabel(player.role,language)}{player.isIGL?" · IGL":""} · OVR {player.overall}</span>
          </div>

          <div className="coach-negotiation__sidebar-team">
            {currentTeamLogo&&<img src={currentTeamLogo} alt=""/>}
          </div>
        </div>

        <SidebarRow label={es?"SUELDO ACTUAL":"CURRENT SALARY"} value={`${formatCurrency(player.salary,currency)} / ${es?"MES":"MONTH"}`}/>
        <SidebarRow label={es?"CONTRATO":"CONTRACT"} value={freeAgent?(es?"SIN CONTRATO":"NO CONTRACT"):formatYears(player.contractSeasonsRemaining??0,language)}/>
        <SidebarRow label={es?"RELEVANCIA":"ROLE STATUS"} value={player.starter?(es?"CLAVE":"KEY PLAYER"):(es?"ROTACIÓN":"ROTATION")}/>
        <SidebarRow label={es?"VALOR":"VALUE"} value={formatCurrency(player.marketValue,currency)}/>

        {!freeAgent&&<SidebarRow label="BUYOUT" value={formatCurrency(buyout,currency)}/>}
        {transferRequested&&<div className="coach-negotiation__request">{es?"SOLICITÓ TRANSFERENCIA":"TRANSFER REQUEST"}</div>}
      </aside>

      <section className="coach-negotiation__scene-center">
        <div className="coach-negotiation__character coach-negotiation__character--agent">
          <div className="coach-negotiation__character-head"/>
          <div className="coach-negotiation__character-body"/>
        </div>

        <div className="coach-negotiation__character coach-negotiation__character--coach">
          <div className="coach-negotiation__character-head"/>
          <div className="coach-negotiation__character-body"/>
        </div>
      </section>

      <div className={`coach-negotiation__tension coach-negotiation__tension--${tension.toLowerCase()}`}>
        <span>{es?"TENSIÓN":"TENSION"}</span>
        <strong>{getTensionLabel(tension,language)}</strong>
        <div><i/></div>
      </div>

      <section className={`coach-negotiation__dialogue coach-negotiation__dialogue--${mood.toLowerCase()}`}>
        <span>
          {step==="Club"
            ?es?"DIRECTOR DEPORTIVO":"SPORTING DIRECTOR"
            :step==="Player"
              ?es?"AGENTE":"AGENT"
              :step==="Squad"
                ?"STAFF"
                :"TRANSFER DEPARTMENT"}
        </span>

        <strong>{message}</strong>
      </section>

      {step==="Club"&&(
        <ClubNegotiation
          player={player}
          askingPrice={clubAskingPrice}
          buyout={buyout}
          offer={clubOffer}
          counterOffer={clubCounterOffer}
          rounds={clubRounds}
          ended={clubNegotiationEnded}
          transferBudget={career.team.finances.transferBudget}
          language={language}
          currency={currency}
          onChange={changeClubOffer}
          onSubmit={handleClubOffer}
          onAcceptCounter={acceptClubCounter}
          onCancel={onCancel}
        />
      )}

      {step==="Player"&&(
        <PlayerNegotiation
          player={player}
          expectedSalary={expectedSalary}
          salaryOffer={salaryOffer}
          counterSalary={playerCounterSalary}
          contractYears={contractYears}
          rounds={playerRounds}
          ended={playerNegotiationEnded}
          payroll={career.team.finances.currentMonthlyPayroll}
          monthlyBudget={career.team.finances.monthlyBudget}
          language={language}
          currency={currency}
          onSalaryChange={changeSalaryOffer}
          onContractChange={changeContractYears}
          onSubmit={handlePlayerOffer}
          onAcceptCounter={acceptPlayerCounter}
          onCancel={onCancel}
        />
      )}

      {step==="Squad"&&(
        <SquadDecision
          roster={career.team.roster}
          selectedId={replacePlayerId}
          incomingSalary={agreedSalary}
          payroll={career.team.finances.currentMonthlyPayroll}
          monthlyBudget={career.team.finances.monthlyBudget}
          language={language}
          currency={currency}
          onChange={setReplacePlayerId}
          onContinue={handleSquadContinue}
        />
      )}

      {step==="Complete"&&(
        <CompleteAgreement
          career={career}
          player={player}
          transferFee={finalTransferFee}
          salary={finalSalary}
          contractYears={contractYears}
          replacePlayer={replacePlayer}
          projectedPayroll={projectedPayroll}
          projectedTransferBudget={projectedTransferBudget}
          canConfirm={canConfirm}
          language={language}
          currency={currency}
          onConfirm={handleConfirm}
          onCancel={onCancel}
        />
      )}
    </main>
  );
}

function ClubNegotiation({player,askingPrice,buyout,offer,counterOffer,rounds,ended,transferBudget,language,currency,onChange,onSubmit,onAcceptCounter,onCancel}:{
  player:CoachPlayer;
  askingPrice:number;
  buyout:number;
  offer:number;
  counterOffer:number|null;
  rounds:number;
  ended:boolean;
  transferBudget:number;
  language:Language;
  currency:GameCurrency;
  onChange:(value:number)=>void;
  onSubmit:()=>void;
  onAcceptCounter:()=>void;
  onCancel:()=>void;
}) {
  const es=language==="es";

  return (
    <section className="coach-negotiation__action-panel">
      <header>
        <span>{es?"PRECIO DEL TRASPASO":"TRANSFER PRICE"}</span>
        <small>
          {ended
            ?es?"NEGOCIACIÓN TERMINADA":"NEGOTIATION ENDED"
            :`${es?"RONDA":"ROUND"} ${Math.min(MAX_NEGOTIATION_ROUNDS,rounds+1)} / ${MAX_NEGOTIATION_ROUNDS}`}
        </small>
      </header>

      <div className="coach-negotiation__action-values">
        <CompactValue label={es?"VALOR":"VALUE"} value={player.marketValue} currency={currency}/>
        <CompactValue label={es?"PETICIÓN CLUB":"CLUB ASKING"} value={askingPrice} currency={currency}/>
        <CompactValue label="BUYOUT" value={buyout} currency={currency}/>
      </div>

      {counterOffer!==null&&(
        <div className="coach-negotiation__counter">
          <span>{es?"CONTRAOFERTA":"COUNTEROFFER"}</span>
          <strong>{formatCurrency(counterOffer,currency)}</strong>
        </div>
      )}

      <div className="coach-negotiation__edit-row">
        <span>{es?"OFERTA":"OFFER"}</span>
        <strong>{formatCurrency(offer,currency)}</strong>

        <div>
          <button disabled={ended} onClick={()=>onChange(offer-250000)}>−250K</button>
          <button disabled={ended} onClick={()=>onChange(offer-50000)}>−50K</button>
          <button disabled={ended} onClick={()=>onChange(offer+50000)}>+50K</button>
          <button disabled={ended} onClick={()=>onChange(offer+250000)}>+250K</button>
        </div>
      </div>

      <footer>
        <button className="coach-negotiation__secondary" onClick={onCancel}>{es?"ABANDONAR":"WALK AWAY"}</button>

        {counterOffer!==null&&(
          <button className="coach-negotiation__secondary" disabled={ended||counterOffer>transferBudget} onClick={onAcceptCounter}>
            {es?"ACEPTAR":"ACCEPT"} {formatCurrency(counterOffer,currency)}
          </button>
        )}

        <button className="coach-negotiation__primary" disabled={ended||offer>transferBudget} onClick={onSubmit}>
          {es?"ENVIAR OFERTA":"SEND OFFER"} →
        </button>
      </footer>
    </section>
  );
}

function PlayerNegotiation({player,expectedSalary,salaryOffer,counterSalary,contractYears,rounds,ended,payroll,monthlyBudget,language,currency,onSalaryChange,onContractChange,onSubmit,onAcceptCounter,onCancel}:{
  player:CoachPlayer;
  expectedSalary:number;
  salaryOffer:number;
  counterSalary:number|null;
  contractYears:number;
  rounds:number;
  ended:boolean;
  payroll:number;
  monthlyBudget:number;
  language:Language;
  currency:GameCurrency;
  onSalaryChange:(value:number)=>void;
  onContractChange:(years:number)=>void;
  onSubmit:()=>void;
  onAcceptCounter:()=>void;
  onCancel:()=>void;
}) {
  const es=language==="es";

  return (
    <section className="coach-negotiation__action-panel">
      <header>
        <span>{es?"SALARIO Y CONTRATO":"SALARY & CONTRACT"}</span>
        <small>
          {ended
            ?es?"NEGOCIACIÓN TERMINADA":"NEGOTIATION ENDED"
            :`${es?"RONDA":"ROUND"} ${Math.min(MAX_NEGOTIATION_ROUNDS,rounds+1)} / ${MAX_NEGOTIATION_ROUNDS}`}
        </small>
      </header>

      <div className="coach-negotiation__action-values">
        <CompactValue label={es?"SALARIO ACTUAL":"CURRENT SALARY"} value={player.salary} currency={currency}/>
        <CompactValue label={es?"ESPACIO SALARIAL":"PAYROLL SPACE"} value={Math.max(0,monthlyBudget-payroll)} currency={currency}/>
        <CompactValue label="OVR" value={player.overall} currency={currency} money={false}/>
      </div>

      <div className="coach-negotiation__contract-years">
        {[1,2,3].map(years=>(
          <button key={years} disabled={ended} className={contractYears===years?"active":""} onClick={()=>onContractChange(years)}>
            {formatYears(years,language)}
          </button>
        ))}
      </div>

      {counterSalary!==null&&(
        <div className="coach-negotiation__counter">
          <span>{es?"PETICIÓN DEL AGENTE":"AGENT REQUEST"}</span>
          <strong>{formatCurrency(counterSalary,currency)} / {es?"MES":"MONTH"}</strong>
        </div>
      )}

      <div className="coach-negotiation__edit-row">
        <span>{es?"SALARIO":"SALARY"}</span>
        <strong>{formatCurrency(salaryOffer,currency)} / {es?"MES":"MONTH"}</strong>

        <div>
          <button disabled={ended} onClick={()=>onSalaryChange(salaryOffer-2000)}>−2K</button>
          <button disabled={ended} onClick={()=>onSalaryChange(salaryOffer-500)}>−500</button>
          <button disabled={ended} onClick={()=>onSalaryChange(salaryOffer+500)}>+500</button>
          <button disabled={ended} onClick={()=>onSalaryChange(salaryOffer+2000)}>+2K</button>
        </div>
      </div>

      <footer>
        <button className="coach-negotiation__secondary" onClick={onCancel}>{es?"ABANDONAR":"WALK AWAY"}</button>

        {counterSalary!==null&&(
          <button className="coach-negotiation__secondary" disabled={ended} onClick={onAcceptCounter}>
            {es?"ACEPTAR":"ACCEPT"} {formatCurrency(counterSalary,currency)}
          </button>
        )}

        <button className="coach-negotiation__primary" disabled={ended} onClick={onSubmit}>
          {es?"ENVIAR CONTRATO":"SEND CONTRACT"} →
        </button>
      </footer>
    </section>
  );
}

function SquadDecision({roster,selectedId,incomingSalary,payroll,monthlyBudget,language,currency,onChange,onContinue}:{
  roster:CoachPlayer[];
  selectedId:string;
  incomingSalary:number;
  payroll:number;
  monthlyBudget:number;
  language:Language;
  currency:GameCurrency;
  onChange:(id:string)=>void;
  onContinue:()=>void;
}) {
  const es=language==="es";
  const selected=roster.find(player=>player.id===selectedId)??null;
  const projectedPayroll=selected?payroll-selected.salary+incomingSalary:payroll+incomingSalary;

  return (
    <section className="coach-negotiation__action-panel">
      <header>
        <span>{es?"LIBERAR CUPO":"FREE ROSTER SLOT"}</span>
        <small>{roster.length}/{MAX_ROSTER_SIZE}</small>
      </header>

      <div className="coach-negotiation__squad-list">
        {roster.map(player=>(
          <button key={player.id} className={selectedId===player.id?"active":""} onClick={()=>onChange(player.id)}>
            <div>
              <strong>{player.ign}</strong>
              <small>{getRoleLabel(player.role,language)}{player.isIGL?" · IGL":""} · OVR {player.overall}</small>
            </div>

            <span>{formatCurrency(player.salary,currency)} / {es?"MES":"MONTH"}</span>
          </button>
        ))}
      </div>

      {selected&&(
        <div className="coach-negotiation__counter">
          <span>{es?"NÓMINA RESULTANTE":"PROJECTED PAYROLL"}</span>
          <strong>{formatCurrency(projectedPayroll,currency)} / {formatCurrency(monthlyBudget,currency)}</strong>
        </div>
      )}

      <footer>
        <button className="coach-negotiation__primary" disabled={!selectedId} onClick={onContinue}>
          {es?"CONFIRMAR SALIDA":"CONFIRM RELEASE"} →
        </button>
      </footer>
    </section>
  );
}

function CompleteAgreement({career,player,transferFee,salary,contractYears,replacePlayer,projectedPayroll,projectedTransferBudget,canConfirm,language,currency,onConfirm,onCancel}:{
  career:CoachCareerState;
  player:CoachPlayer;
  transferFee:number;
  salary:number;
  contractYears:number;
  replacePlayer:CoachPlayer|null;
  projectedPayroll:number;
  projectedTransferBudget:number;
  canConfirm:boolean;
  language:Language;
  currency:GameCurrency;
  onConfirm:()=>void;
  onCancel:()=>void;
}) {
  const es=language==="es";

  return (
    <section className="coach-negotiation__action-panel">
      <header>
        <span>{es?"ACUERDO COMPLETO":"DEAL COMPLETE"}</span>
        <small>{player.ign}</small>
      </header>

      <div className="coach-negotiation__action-values">
        <CompactValue label="TRANSFER FEE" value={transferFee} currency={currency}/>
        <CompactValue label={es?"SALARIO":"SALARY"} value={salary} currency={currency}/>
        <CompactValue label={es?"CONTRATO":"CONTRACT"} value={contractYears} currency={currency} money={false} suffix={` ${formatYears(contractYears,language)}`}/>
      </div>

      <div className="coach-negotiation__complete-grid">
        <SidebarRow label={es?"NÓMINA RESULTANTE":"PROJECTED PAYROLL"} value={`${formatCurrency(projectedPayroll,currency)} / ${formatCurrency(career.team.finances.monthlyBudget,currency)}`}/>
        <SidebarRow label={es?"BUDGET RESTANTE":"REMAINING BUDGET"} value={formatCurrency(Math.max(0,projectedTransferBudget),currency)}/>
        {replacePlayer&&<SidebarRow label={es?"SALE DEL EQUIPO":"LEAVING TEAM"} value={replacePlayer.ign}/>}
      </div>

      {!canConfirm&&(
        <div className="coach-negotiation__warning">
          {es
            ?"La operación supera alguno de los límites financieros del club."
            :"The deal exceeds one of the club's financial limits."}
        </div>
      )}

      <footer>
        <button className="coach-negotiation__secondary" onClick={onCancel}>{es?"CANCELAR":"CANCEL"}</button>
        <button className="coach-negotiation__primary" disabled={!canConfirm} onClick={onConfirm}>
          {es?"CONFIRMAR FICHAJE":"CONFIRM SIGNING"} →
        </button>
      </footer>
    </section>
  );
}

function SidebarRow({label,value}:{label:string;value:string}) {
  return (
    <div className="coach-negotiation__sidebar-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CompactValue({label,value,currency,money=true,suffix=""}:{label:string;value:number;currency:GameCurrency;money?:boolean;suffix?:string}) {
  return (
    <div>
      <span>{label}</span>
      <strong>{money?formatCurrency(value,currency):`${value}${suffix}`}</strong>
    </div>
  );
}

function completeTransfer(career:CoachCareerState,player:CoachPlayer,transferFee:number,salary:number,contractYears:number,replacePlayerId:string|undefined,transferRequested:boolean):CoachCareerState|null {
  const offseason=career.offseason;
  const midseason=career.midseasonMarket;

  const offseasonMarket=Boolean(offseason&&!offseason.completed&&offseason.phase==="Market");
  const midseasonMarket=Boolean(midseason&&!midseason.completed&&midseason.phase==="Market");

  if(!offseasonMarket&&!midseasonMarket)return null;
  if(player.teamId===career.team.teamId)return null;

  const replacePlayer=replacePlayerId?career.team.roster.find(current=>current.id===replacePlayerId):undefined;

  if(career.team.roster.length>=MAX_ROSTER_SIZE&&!replacePlayer)return null;

  const previousTeamId=player.teamId;
  const freeAgent=previousTeamId==="free-agent";
  const sellerRoster=freeAgent?[]:career.playerPool.filter(current=>current.teamId===previousTeamId);

  if(!freeAgent){
    if(sellerRoster.length<5)return null;

    const minimumFee=getCoachMinimumAcceptedTransferFee(player,sellerRoster,transferRequested);
    if(transferFee<minimumFee)return null;
  }

  if(transferFee>career.team.finances.transferBudget)return null;

  const projectedPayroll=career.team.finances.currentMonthlyPayroll-(replacePlayer?.salary??0)+salary;

  if(projectedPayroll>career.team.finances.monthlyBudget)return null;

  const signedPlayer:CoachPlayer=normalizeMarketPlayer({...player,teamId:career.team.teamId,salary,starter:true,contractSeasonsRemaining:contractYears});

  const releasedPlayer:CoachPlayer|undefined=replacePlayer
    ?normalizeMarketPlayer({...replacePlayer,teamId:"free-agent",starter:false,contractSeasonsRemaining:0})
    :undefined;

  const roster=[...career.team.roster.filter(current=>current.id!==replacePlayerId),signedPlayer];

  const playerPool=career.playerPool.map(current=>{
    if(current.id===player.id)return signedPlayer;
    if(releasedPlayer&&current.id===releasedPlayer.id)return releasedPlayer;
    return current;
  });

  let cpuFinancesByTeam={...career.cpuFinancesByTeam};

  if(!freeAgent){
    const sellerFinances=cpuFinancesByTeam[previousTeamId];

    if(sellerFinances){
      const sellerPayroll=playerPool.filter(current=>current.teamId===previousTeamId).reduce((total,current)=>total+current.salary,0);

      cpuFinancesByTeam={
        ...cpuFinancesByTeam,
        [previousTeamId]:{
          ...sellerFinances,
          transferBudget:sellerFinances.transferBudget+transferFee,
          currentMonthlyPayroll:sellerPayroll,
        },
      };
    }
  }

  const transfer={playerId:player.id,playerName:player.ign,fromTeamId:previousTeamId,toTeamId:career.team.teamId,salary,transferFee};

  const releaseTransfer=releasedPlayer
    ?{playerId:releasedPlayer.id,playerName:releasedPlayer.ign,fromTeamId:career.team.teamId,toTeamId:"free-agent",salary:0,transferFee:0}
    :null;

  const sourceFreeAgentIds=offseasonMarket?offseason!.freeAgentIds:midseason!.freeAgentIds;

  const freeAgentIds=[
    ...sourceFreeAgentIds.filter(id=>id!==player.id&&id!==releasedPlayer?.id),
    ...(releasedPlayer?[releasedPlayer.id]:[]),
  ];

  const baseCareer:CoachCareerState={
    ...career,
    team:{
      ...career.team,
      roster,
      finances:{
        ...career.team.finances,
        currentMonthlyPayroll:projectedPayroll,
        transferBudget:Math.max(0,career.team.finances.transferBudget-transferFee),
      },
    },
    playerPool,
    cpuFinancesByTeam,
  };

  if(offseasonMarket&&offseason){
    return {
      ...baseCareer,
      offseason:{
        ...offseason,
        departures:releasedPlayer
          ?[...offseason.departures,{playerId:releasedPlayer.id,playerName:releasedPlayer.ign,previousTeamId:career.team.teamId,reason:"Released"}]
          :offseason.departures,
        transfers:[...offseason.transfers,transfer,...(releaseTransfer?[releaseTransfer]:[])],
        freeAgentIds:Array.from(new Set(freeAgentIds)),
      },
    };
  }

  if(midseasonMarket&&midseason){
    return {
      ...baseCareer,
      midseasonMarket:{
        ...midseason,
        transfers:[...midseason.transfers,transfer,...(releaseTransfer?[releaseTransfer]:[])],
        freeAgentIds:Array.from(new Set(freeAgentIds)),
      },
    };
  }

  return null;
}

function getClubAskingPrice(player:CoachPlayer,minimum:number,buyout:number,season:number,transferRequested:boolean) {
  if(minimum<=0)return 0;

  const roll=deterministicNumber(`${player.id}-${season}-asking-price`)%9;
  const premium=1.05+roll/100;
  const requestMultiplier=transferRequested?0.96:1;

  return roundTransferFee(Math.min(buyout,minimum*premium*requestMultiplier));
}

function getClubCounterOffer(minimum:number,askingPrice:number,currentOffer:number,round:number) {
  const target=round===1?askingPrice:round===2?minimum+(askingPrice-minimum)*.40:minimum;
  return roundTransferFee(Math.max(minimum,Math.min(askingPrice,Math.max(currentOffer,target))));
}

function getExpectedSalary(player:CoachPlayer,season:number) {
  const overallMultiplier=player.overall>=92?1.35:player.overall>=88?1.22:player.overall>=84?1.12:player.overall>=80?1.05:1;
  const potentialMultiplier=player.age<=21&&player.potential>=90?1.15:player.potential>=88?1.08:1;
  const seasonVariance=1+((deterministicNumber(`${player.id}-${season}-salary-demand`)%11)-5)/100;

  return roundSalary(Math.max(player.salary,player.salary*overallMultiplier*potentialMultiplier*seasonVariance));
}

function getContractSalaryExpectation(baseSalary:number,years:number) {
  const multiplier=years===1?1.05:years===2?1:.97;
  return roundSalary(baseSalary*multiplier);
}

function getPlayerCounterSalary(expectation:number,round:number) {
  const multiplier=round===1?1.04:round===2?1.02:1;
  return roundSalary(expectation*multiplier);
}

function getNegotiationTension({step,clubOffer,minimumTransferFee,salaryOffer,expectedSalary,mood}:{
  step:NegotiationStep;
  clubOffer:number;
  minimumTransferFee:number;
  salaryOffer:number;
  expectedSalary:number;
  mood:NegotiationMood;
}) {
  if(mood==="Rejected")return "High";
  if(mood==="Warning")return "Medium";
  if(mood==="Accepted"||mood==="Positive")return "Low";

  if(step==="Club"&&minimumTransferFee>0){
    const ratio=clubOffer/minimumTransferFee;
    if(ratio<.75)return "High";
    if(ratio<.90)return "Medium";
  }

  if(step==="Player"&&expectedSalary>0){
    const ratio=salaryOffer/expectedSalary;
    if(ratio<.80)return "High";
    if(ratio<.93)return "Medium";
  }

  return "Low";
}

function getTensionLabel(value:string,language:Language) {
  if(language==="en")return value.toUpperCase();
  if(value==="High")return "ALTA";
  if(value==="Medium")return "MEDIA";
  return "BAJA";
}

function getRoleLabel(role:CoachPlayer["role"],language:Language) {
  if(language==="en")return role.toUpperCase();

  if(role==="Duelist")return "DUELISTA";
  if(role==="Initiator")return "INICIADOR";
  if(role==="Controller")return "CONTROLADOR";
  if(role==="Sentinel")return "CENTINELA";

  return "FLEX";
}

function formatYears(years:number,language:Language) {
  if(language==="es")return `${years} ${years===1?"AÑO":"AÑOS"}`;
  return `${years} ${years===1?"YEAR":"YEARS"}`;
}

function roundTransferFee(value:number) {
  return Math.max(0,Math.ceil(value/50000)*50000);
}

function roundSalary(value:number) {
  return Math.max(1000,Math.round(value/500)*500);
}

function normalizeMarketPlayer(player:CoachPlayer):CoachPlayer {
  const marketValue=Number.isFinite(player.marketValue)&&player.marketValue>0
    ?player.marketValue
    :getCoachPlayerMarketValue({...player,marketValue:0});

  return {...player,marketValue};
}

function deterministicNumber(value:string) {
  let hash=2166136261;

  for(let i=0;i<value.length;i++){
    hash^=value.charCodeAt(i);
    hash=Math.imul(hash,16777619);
  }

  return Math.abs(hash>>>0);
}