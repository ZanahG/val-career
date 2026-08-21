import {useEffect,useState} from "react";
import type {CareerEffects} from "../types/career";
import {useGameSettings} from "../context/GameSettingsContext";
import "../styles/CareerMinigames.css";

interface WarmupSequenceMinigameProps {
  onComplete:(effects:CareerEffects) => void;
}

type WarmupKey = "W"|"A"|"S"|"D"|"SPACE";
type Phase = "showing"|"input"|"feedback"|"finished";
type Feedback = "correct"|"wrong"|"timeout"|null;

const KEYS:WarmupKey[] = ["W","A","S","D","SPACE"];
const MAX_ROUNDS = 7;
const INPUT_TIME_LIMIT = 4;
const FEEDBACK_DELAY = 700;

const randomKey = () => KEYS[Math.floor(Math.random() * KEYS.length)];
const createStartingSequence = () => [randomKey(),randomKey(),randomKey()];

export function WarmupSequenceMinigame({onComplete}:WarmupSequenceMinigameProps) {
  const {language} = useGameSettings();

  const [sequence,setSequence] = useState<WarmupKey[]>(createStartingSequence);
  const [playerSequence,setPlayerSequence] = useState<WarmupKey[]>([]);
  const [round,setRound] = useState(1);
  const [successfulRounds,setSuccessfulRounds] = useState(0);
  const [phase,setPhase] = useState<Phase>("showing");
  const [feedback,setFeedback] = useState<Feedback>(null);
  const [timeLeft,setTimeLeft] = useState(INPUT_TIME_LIMIT);

  useEffect(() => {
    if (phase !== "showing") return;

    const showDuration = 1200 + sequence.length * 220;

    const timeout = window.setTimeout(() => {
      setPlayerSequence([]);
      setTimeLeft(INPUT_TIME_LIMIT);
      setPhase("input");
    },showDuration);

    return () => window.clearTimeout(timeout);
  },[phase,sequence]);

  useEffect(() => {
    if (phase !== "input") return;

    const startedAt = Date.now();

    const interval = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0,INPUT_TIME_LIMIT - elapsed);

      setTimeLeft(remaining);

      if (remaining <= 0) {
        window.clearInterval(interval);
        resolveRound(false,"timeout");
      }
    },50);

    return () => window.clearInterval(interval);
  },[phase,round]);

  useEffect(() => {
    if (phase !== "input") return;

    const handleKeyDown = (event:KeyboardEvent) => {
      const key = normalizeKey(event);
      if (!key) return;

      event.preventDefault();
      submitKey(key);
    };

    window.addEventListener("keydown",handleKeyDown);

    return () => window.removeEventListener("keydown",handleKeyDown);
  },[phase,playerSequence,sequence]);

  const submitKey = (key:WarmupKey) => {
    if (phase !== "input") return;

    const next = [...playerSequence,key];
    const expectedKey = sequence[next.length - 1];

    setPlayerSequence(next);

    if (key !== expectedKey) {
      resolveRound(false,"wrong");
      return;
    }

    if (next.length === sequence.length) {
      resolveRound(true,"correct");
    }
  };

  const resolveRound = (success:boolean,result:Exclude<Feedback,null>) => {
    if (phase !== "input") return;

    const nextSuccessfulRounds = successfulRounds + (success ? 1 : 0);

    setSuccessfulRounds(nextSuccessfulRounds);
    setFeedback(result);
    setPhase("feedback");

    window.setTimeout(() => {
      if (round >= MAX_ROUNDS) {
        setPhase("finished");
        setFeedback(null);
        return;
      }

      setRound((value) => value + 1);
      setSequence((current) => [...current,randomKey()]);
      setPlayerSequence([]);
      setFeedback(null);
      setPhase("showing");
    },FEEDBACK_DELAY);
  };

  const reward = successfulRounds >= 7 ? 5 : successfulRounds === 6 ? 4 : successfulRounds >= 4 ? 3 : successfulRounds >= 2 ? 2 : successfulRounds >= 1 ? 1 : 0;
  const finished = phase === "finished";

  return (
    <div className="career-minigame-overlay">
      <section className={`career-minigame ${feedback === "correct" ? "career-minigame--correct" : feedback ? "career-minigame--wrong" : ""}`}>
        <header className="career-minigame__header">
          <div><span>CONSISTENCY</span><h2>{language === "es" ? "RUTINA DE CALENTAMIENTO" : "WARMUP SEQUENCE"}</h2></div>
          {!finished && <strong>{round}/{MAX_ROUNDS}</strong>}
        </header>

        {!finished ? (
          <>
            {phase === "input" && <Timer timeLeft={timeLeft} max={INPUT_TIME_LIMIT} language={language} />}

            <p className="career-minigame__instruction">
              {phase === "showing"
                ? (language === "es" ? "MEMORIZA LA SECUENCIA" : "MEMORIZE THE SEQUENCE")
                : phase === "input"
                  ? (language === "es" ? "REPRODÚCELA ANTES DE QUE SE ACABE EL TIEMPO" : "REPEAT IT BEFORE TIME RUNS OUT")
                  : feedback === "correct"
                    ? (language === "es" ? "SECUENCIA COMPLETA" : "SEQUENCE COMPLETE")
                    : (language === "es" ? "RONDA FALLIDA" : "ROUND FAILED")}
            </p>

            <div className="warmup-sequence">
              {phase === "showing" && sequence.map((key,index) => <kbd key={`${key}-${index}`}>{key}</kbd>)}

              {phase !== "showing" && playerSequence.map((key,index) => {
                const correctKey = sequence[index] === key;
                return <kbd key={`${key}-${index}`} className={correctKey ? "warmup-key--correct" : "warmup-key--wrong"}>{key}</kbd>;
              })}
            </div>

            {phase === "input" && (
              <div className="warmup-controls">
                {KEYS.map((key) => <button key={key} onClick={() => submitKey(key)}>{key}</button>)}
              </div>
            )}

            <WarmupFeedback feedback={feedback} sequence={sequence} language={language} />
          </>
        ) : (
          <div className="career-minigame-result">
            <span>CONSISTENCY</span>
            <strong>{successfulRounds}/{MAX_ROUNDS}</strong>
            <p>{reward > 0 ? `+${reward} CONSISTENCY` : language === "es" ? "Sin mejora esta vez." : "No improvement this time."}</p>
            <button onClick={() => onComplete({consistency:reward})}>{language === "es" ? "CONTINUAR" : "CONTINUE"} →</button>
          </div>
        )}
      </section>
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

function WarmupFeedback({feedback,sequence,language}:{feedback:Feedback;sequence:WarmupKey[];language:"es"|"en"}) {
  if (!feedback) return <div className="career-minigame-feedback" />;

  if (feedback === "correct") {
    return <div className="career-minigame-feedback career-minigame-feedback--correct">✓ {language === "es" ? "PERFECTO" : "PERFECT"}</div>;
  }

  return (
    <div className="career-minigame-feedback career-minigame-feedback--wrong">
      ✕ {feedback === "timeout" ? (language === "es" ? "TIEMPO AGOTADO" : "TIME OUT") : (language === "es" ? "SECUENCIA INCORRECTA" : "WRONG SEQUENCE")} · {sequence.join(" → ")}
    </div>
  );
}

function normalizeKey(event:KeyboardEvent):WarmupKey|null {
  if (event.code === "Space") return "SPACE";

  const key = event.key.toUpperCase();

  if (key === "W" || key === "A" || key === "S" || key === "D") return key;

  return null;
}