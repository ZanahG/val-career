import {useEffect,useMemo,useState} from "react";
import type {CareerEffects} from "../types/career";
import {useGameSettings} from "../context/GameSettingsContext";
import "../styles/CareerMinigames.css";

interface EconomyDecisionMinigameProps {
  onComplete:(effects:CareerEffects) => void;
}

type EconomyChoice = "save"|"half"|"force"|"full";
type Feedback = "correct"|"wrong"|"timeout"|null;

interface EconomyScenario {
  id:string;
  score:string;
  credits:number;
  context:{es:string;en:string};
  answer:EconomyChoice;
}

const TIME_LIMIT = 5;
const FEEDBACK_DELAY = 650;

const SCENARIOS:EconomyScenario[] = [
  {id:"eco-1",score:"0-2",credits:2400,context:{es:"Perdiste la pistol y la anti-eco. El equipo tiene poco dinero.",en:"You lost pistol and the anti-eco. The team has very little money."},answer:"save"},
  {id:"eco-2",score:"11-12",credits:3900,context:{es:"Última ronda de la mitad. No puedes guardar créditos para después.",en:"Last round of the half. You cannot save credits for later."},answer:"force"},
  {id:"eco-3",score:"4-4",credits:4700,context:{es:"Tu equipo tiene créditos suficientes para rifles, escudos y utilidad.",en:"Your team has enough credits for rifles, armor and utility."},answer:"full"},
  {id:"eco-4",score:"7-10",credits:3200,context:{es:"Quieres conservar economía para rifles en la próxima ronda, pero puedes invertir algo.",en:"You want rifles next round but can still invest a little now."},answer:"half"},
  {id:"eco-5",score:"12-12",credits:3600,context:{es:"Overtime. Todo se decide en esta ronda.",en:"Overtime. Everything is decided in this round."},answer:"force"},
];

const shuffle = <T,>(items:T[]) => [...items].sort(() => Math.random() - .5);

export function EconomyDecisionMinigame({onComplete}:EconomyDecisionMinigameProps) {
  const {language} = useGameSettings();
  const scenarios = useMemo(() => shuffle(SCENARIOS),[]);
  const [started,setStarted] = useState(false);
  const [index,setIndex] = useState(0);
  const [correct,setCorrect] = useState(0);
  const [finished,setFinished] = useState(false);
  const [feedback,setFeedback] = useState<Feedback>(null);
  const [timeLeft,setTimeLeft] = useState(TIME_LIMIT);

  const scenario = scenarios[index];
  const locked = feedback !== null;

  useEffect(() => {
    if (!started || finished || locked) return;

    setTimeLeft(TIME_LIMIT);

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0,TIME_LIMIT - elapsed);

      setTimeLeft(remaining);

      if (remaining <= 0) {
        window.clearInterval(interval);
        resolveAnswer(undefined,true);
      }
    },50);

    return () => window.clearInterval(interval);
  },[started,index,finished,locked]);

  const resolveAnswer = (choice?:EconomyChoice,timeout = false) => {
    if (!started || locked || finished) return;

    const success = !timeout && choice === scenario.answer;
    const nextCorrect = correct + (success ? 1 : 0);

    setCorrect(nextCorrect);
    setFeedback(timeout ? "timeout" : success ? "correct" : "wrong");

    window.setTimeout(() => {
      if (index >= scenarios.length - 1) {
        setFinished(true);
        setFeedback(null);
        return;
      }

      setIndex((value) => value + 1);
      setFeedback(null);
    },FEEDBACK_DELAY);
  };

  const reward = correct >= 5 ? 5 : correct === 4 ? 3 : correct === 3 ? 1 : correct === 2 ? 0 : correct === 1 ? -1 : -2;

  return (
    <div className="career-minigame-overlay">
      <section className={`career-minigame ${feedback === "correct" ? "career-minigame--correct" : feedback ? "career-minigame--wrong" : ""}`}>
        {!started ? (
          <EconomyIntro language={language} onStart={() => setStarted(true)} />
        ) : (
          <>
            <header className="career-minigame__header">
              <div><span>GAME SENSE</span><h2>{language === "es" ? "GESTOR DE ECONOMÍA" : "ECONOMY DECISION"}</h2></div>
              {!finished && <strong>{index + 1}/{scenarios.length}</strong>}
            </header>

            {!finished ? (
              <>
                <Timer timeLeft={timeLeft} max={TIME_LIMIT} language={language} />

                <div className="economy-scenario">
                  <div><span>SCORE</span><strong>{scenario.score}</strong></div>
                  <div><span>{language === "es" ? "CRÉDITOS" : "CREDITS"}</span><strong>{scenario.credits.toLocaleString()}</strong></div>
                </div>

                <p className="career-minigame__description">{scenario.context[language]}</p>

                <div className="career-minigame__choices career-minigame__choices--four">
                  <button disabled={locked} onClick={() => resolveAnswer("save")}>FULL SAVE</button>
                  <button disabled={locked} onClick={() => resolveAnswer("half")}>HALF BUY</button>
                  <button disabled={locked} onClick={() => resolveAnswer("force")}>FORCE BUY</button>
                  <button disabled={locked} onClick={() => resolveAnswer("full")}>FULL BUY</button>
                </div>

                <FeedbackMessage feedback={feedback} correctAnswer={getChoiceLabel(scenario.answer)} language={language} />
              </>
            ) : (
              <MinigameResult title="GAME SENSE" score={`${correct}/${scenarios.length}`} reward={reward} language={language} onContinue={() => onComplete({gameSense:reward})} />
            )}
          </>
        )}
      </section>
    </div>
  );
}

function EconomyIntro({language,onStart}:{language:"es"|"en";onStart:() => void}) {
  return (
    <div className="career-minigame-intro">
      <header className="career-minigame__header">
        <div><span>ENTRENAMIENTO DE GAME SENSE</span><h2>{language === "es" ? "GESTOR DE ECONOMÍA" : "ECONOMY DECISION"}</h2></div>
        <strong>{language === "es" ? "LISTO" : "READY"}</strong>
      </header>

      <div className="career-minigame-intro__body">
        <div className="career-minigame-intro__icon">¤</div>

        <h3>{language === "es" ? "TOMA LA DECISIÓN DE COMPRA CORRECTA" : "MAKE THE CORRECT BUY DECISION"}</h3>

        <p>
          {language === "es"
            ? "Analiza el marcador, los créditos disponibles y la situación de la ronda. Tendrás 5 segundos para decidir qué tipo de compra debe realizar el equipo."
            : "Analyze the score, available credits and round situation. You will have 5 seconds to decide what type of buy the team should make."}
        </p>

        <div className="career-minigame-intro__rules">
          <div><strong>FULL SAVE</strong><span>{language === "es" ? "Guardar créditos" : "Save credits"}</span></div>
          <div><strong>HALF BUY</strong><span>{language === "es" ? "Compra limitada" : "Limited investment"}</span></div>
          <div><strong>FORCE BUY</strong><span>{language === "es" ? "Invertir todo lo posible" : "Invest everything possible"}</span></div>
          <div><strong>FULL BUY</strong><span>{language === "es" ? "Compra completa" : "Full equipment"}</span></div>
        </div>

        <div className="career-minigame-intro__rewards">
          <div><strong>5/5</strong><span>+5 GAME SENSE</span></div>
          <div><strong>4/5</strong><span>+4 GAME SENSE</span></div>
          <div><strong>3/5</strong><span>+3 GAME SENSE</span></div>
          <div><strong>2/5</strong><span>+1 GAME SENSE</span></div>
        </div>

        <button className="career-minigame-start" onClick={onStart}>{language === "es" ? "COMENZAR ENTRENAMIENTO" : "START TRAINING"} <span>▶</span></button>
      </div>
    </div>
  );
}

function Timer({timeLeft,max,language}:{timeLeft:number;max:number;language:"es"|"en"}) {
  return (
    <div className="career-minigame-timer">
      <div className="career-minigame-timer__header"><span>{language === "es" ? "TIEMPO" : "TIME"}</span><strong>{timeLeft.toFixed(1)}s</strong></div>
      <div className="career-minigame-timer__track"><span style={{width:`${timeLeft / max * 100}%`}} /></div>
    </div>
  );
}

function FeedbackMessage({feedback,correctAnswer,language}:{feedback:Feedback;correctAnswer:string;language:"es"|"en"}) {
  if (!feedback) return <div className="career-minigame-feedback" />;

  if (feedback === "correct") return <div className="career-minigame-feedback career-minigame-feedback--correct">✓ {language === "es" ? "CORRECTO" : "CORRECT"}</div>;

  return (
    <div className="career-minigame-feedback career-minigame-feedback--wrong">
      ✕ {feedback === "timeout" ? (language === "es" ? "TIEMPO AGOTADO" : "TIME OUT") : (language === "es" ? "INCORRECTO" : "WRONG")} · {language === "es" ? "RESPUESTA:" : "ANSWER:"} {correctAnswer}
    </div>
  );
}

function getChoiceLabel(choice:EconomyChoice) {
  if (choice === "save") return "FULL SAVE";
  if (choice === "half") return "HALF BUY";
  if (choice === "force") return "FORCE BUY";
  return "FULL BUY";
}

function MinigameResult({title,score,reward,language,onContinue}:{title:string;score:string;reward:number;language:"es"|"en";onContinue:() => void}) {
  return (
    <div className="career-minigame-result">
      <span>{title}</span>
      <strong>{score}</strong>
      <p>
        {reward > 0
          ? `+${reward} GAME SENSE`
          : reward < 0
            ? `${reward} GAME SENSE`
            : language === "es"
              ? "Sin cambios esta vez."
              : "No change this time."}
      </p>
      <button onClick={onContinue}>{language === "es" ? "CONTINUAR" : "CONTINUE"} →</button>
    </div>
  );
}