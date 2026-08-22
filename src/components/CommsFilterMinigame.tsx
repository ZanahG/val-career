import {useEffect,useMemo,useState} from "react";
import type {CareerEffects} from "../types/career";
import {useGameSettings} from "../context/GameSettingsContext";
import "../styles/CareerMinigames.css";

interface CommsFilterMinigameProps {
  onComplete:(effects:CareerEffects) => void;
}

type Feedback = "correct"|"wrong"|"timeout"|null;

interface CommMessage {
  id:string;
  text:{es:string;en:string};
  useful:boolean;
}

const TIME_LIMIT = 3;
const FEEDBACK_DELAY = 650;

const MESSAGES:CommMessage[] = [
  {id:"comm-1",text:{es:"Jett 40 HP",en:"Jett 40 HP"},useful:true},
  {id:"comm-2",text:{es:"Spike caída en A",en:"Spike down A"},useful:true},
  {id:"comm-3",text:{es:"Dos entrando Heaven",en:"Two pushing Heaven"},useful:true},
  {id:"comm-4",text:{es:"Rotando por CT",en:"Rotating through CT"},useful:true},
  {id:"comm-5",text:{es:"Omen sin humo por 20 segundos",en:"Omen has no smoke for 20 seconds"},useful:true},
  {id:"comm-6",text:{es:"Operator visto en Mid",en:"Operator spotted Mid"},useful:true},
  {id:"comm-7",text:{es:"Killjoy tiene ultimate",en:"Killjoy has ultimate"},useful:true},
  {id:"comm-8",text:{es:"Uno lurkeando B",en:"One lurking B"},useful:true},
  {id:"comm-9",text:{es:"gg team diff",en:"gg team diff"},useful:false},
  {id:"comm-10",text:{es:"por qué no curas?",en:"why don't you heal?"},useful:false},
  {id:"comm-11",text:{es:"mi mouse anda mal",en:"my mouse is broken"},useful:false},
  {id:"comm-12",text:{es:"report duelist",en:"report duelist"},useful:false},
  {id:"comm-13",text:{es:"ff",en:"ff"},useful:false},
  {id:"comm-14",text:{es:"este equipo es horrible",en:"this team is terrible"},useful:false},
  {id:"comm-15",text:{es:"qué suerte tuvo",en:"he got so lucky"},useful:false},
  {id:"comm-16",text:{es:"voy 3-12 qué desastre",en:"I'm 3-12 this is awful"},useful:false},
];

const shuffle = <T,>(items:T[]) => [...items].sort(() => Math.random() - .5);

export function CommsFilterMinigame({onComplete}:CommsFilterMinigameProps) {
  const {language} = useGameSettings();
  const messages = useMemo(() => shuffle(MESSAGES).slice(0,8),[]);
  const [started,setStarted] = useState(false);
  const [index,setIndex] = useState(0);
  const [correct,setCorrect] = useState(0);
  const [finished,setFinished] = useState(false);
  const [feedback,setFeedback] = useState<Feedback>(null);
  const [timeLeft,setTimeLeft] = useState(TIME_LIMIT);

  const message = messages[index];
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
        resolveChoice(undefined,true);
      }
    },50);

    return () => window.clearInterval(interval);
  },[started,index,finished,locked]);

  const resolveChoice = (choice?:boolean,timeout = false) => {
    if (!started || locked || finished) return;

    const success = !timeout && choice === message.useful;
    const nextCorrect = correct + (success ? 1 : 0);

    setCorrect(nextCorrect);
    setFeedback(timeout ? "timeout" : success ? "correct" : "wrong");

    window.setTimeout(() => {
      if (index >= messages.length - 1) {
        setFinished(true);
        setFeedback(null);
        return;
      }

      setIndex((value) => value + 1);
      setFeedback(null);
    },FEEDBACK_DELAY);
  };

  const reward = correct >= 8 ? 5 : correct === 7 ? 4 : correct >= 6 ? 3 : correct >= 4 ? 1 : correct >= 2 ? -1 : -2;

  return (
    <div className="career-minigame-overlay">
      <section className={`career-minigame ${feedback === "correct" ? "career-minigame--correct" : feedback ? "career-minigame--wrong" : ""}`}>
        {!started ? (
          <CommsIntro language={language} onStart={() => setStarted(true)} />
        ) : (
          <>
            <header className="career-minigame__header">
              <div><span>COMMUNICATION</span><h2>{language === "es" ? "FILTRO DE COMMS" : "COMMS FILTER"}</h2></div>
              {!finished && <strong>{index + 1}/{messages.length}</strong>}
            </header>

            {!finished ? (
              <>
                <Timer timeLeft={timeLeft} max={TIME_LIMIT} language={language} />

                <p className="career-minigame__instruction">{language === "es" ? "Decide rápido si esta comunicación ayuda al equipo." : "Quickly decide whether this communication helps the team."}</p>

                <div className="comms-message">
                  <span>TEAM VOICE</span>
                  <strong>“{message.text[language]}”</strong>
                </div>

                <div className="career-minigame__choices">
                  <button disabled={locked} onClick={() => resolveChoice(true)}>{language === "es" ? "INFORMACIÓN ÚTIL" : "USEFUL INFO"}</button>
                  <button disabled={locked} onClick={() => resolveChoice(false)}>{language === "es" ? "RUIDO" : "NOISE"}</button>
                </div>

                <FeedbackMessage feedback={feedback} useful={message.useful} language={language} />
              </>
            ) : (
              <MinigameResult score={`${correct}/${messages.length}`} reward={reward} language={language} onContinue={() => onComplete({communication:reward})} />
            )}
          </>
        )}
      </section>
    </div>
  );
}

function CommsIntro({language,onStart}:{language:"es"|"en";onStart:() => void}) {
  return (
    <div className="career-minigame-intro">
      <header className="career-minigame__header">
        <div><span>ENTRENAMIENTO DE COMMUNICATION</span><h2>{language === "es" ? "FILTRO DE COMMS" : "COMMS FILTER"}</h2></div>
        <strong>{language === "es" ? "LISTO" : "READY"}</strong>
      </header>

      <div className="career-minigame-intro__body">
        <div className="career-minigame-intro__icon">◖</div>

        <h3>{language === "es" ? "SEPARA LA INFORMACIÓN ÚTIL DEL RUIDO" : "SEPARATE USEFUL INFO FROM NOISE"}</h3>

        <p>
          {language === "es"
            ? "Escucharás mensajes de voz del equipo. Tendrás 3 segundos para decidir si la comunicación aporta información útil para la ronda o si solamente genera ruido."
            : "You will hear team voice messages. You have 3 seconds to decide whether the communication provides useful round information or is simply noise."}
        </p>

        <div className="career-minigame-intro__rules">
          <div><strong>{language === "es" ? "INFO ÚTIL" : "USEFUL INFO"}</strong><span>{language === "es" ? "HP, posiciones, rotaciones" : "HP, positions, rotations"}</span></div>
          <div><strong>{language === "es" ? "INFO ÚTIL" : "USEFUL INFO"}</strong><span>{language === "es" ? "Spike, utilidad, ultimates" : "Spike, utility, ultimates"}</span></div>
          <div><strong>{language === "es" ? "RUIDO" : "NOISE"}</strong><span>{language === "es" ? "Quejas y discusiones" : "Complaints and arguments"}</span></div>
          <div><strong>{language === "es" ? "RUIDO" : "NOISE"}</strong><span>{language === "es" ? "Comentarios sin impacto" : "Non-actionable comments"}</span></div>
        </div>

        <div className="career-minigame-intro__rewards">
          <div><strong>8/8</strong><span>+5 COMMUNICATION</span></div>
          <div><strong>7/8</strong><span>+4 COMMUNICATION</span></div>
          <div><strong>5-6/8</strong><span>+3 COMMUNICATION</span></div>
          <div><strong>3-4/8</strong><span>+2 COMMUNICATION</span></div>
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

function FeedbackMessage({feedback,useful,language}:{feedback:Feedback;useful:boolean;language:"es"|"en"}) {
  if (!feedback) return <div className="career-minigame-feedback" />;

  if (feedback === "correct") {
    return <div className="career-minigame-feedback career-minigame-feedback--correct">✓ {language === "es" ? "CORRECTO" : "CORRECT"}</div>;
  }

  const answer = useful ? (language === "es" ? "INFORMACIÓN ÚTIL" : "USEFUL INFO") : (language === "es" ? "RUIDO" : "NOISE");

  return (
    <div className="career-minigame-feedback career-minigame-feedback--wrong">
      ✕ {feedback === "timeout" ? (language === "es" ? "TIEMPO AGOTADO" : "TIME OUT") : (language === "es" ? "INCORRECTO" : "WRONG")} · {language === "es" ? "ERA:" : "IT WAS:"} {answer}
    </div>
  );
}

function MinigameResult({score,reward,language,onContinue}:{score:string;reward:number;language:"es"|"en";onContinue:() => void}) {
  return (
    <div className="career-minigame-result">
      <span>COMMUNICATION</span>
      <strong>{score}</strong>
      <p>
        {reward > 0
          ? `+${reward} COMMUNICATION`
          : reward < 0
            ? `${reward} COMMUNICATION`
            : language === "es"
              ? "Sin cambios esta vez."
              : "No change this time."}
      </p>
      <button onClick={onContinue}>{language === "es" ? "CONTINUAR" : "CONTINUE"} →</button>
    </div>
  );
}