import {useEffect,useRef,useState} from "react";
import type {CSSProperties,MouseEvent} from "react";
import type {CareerEffects} from "../types/career";
import {useGameSettings} from "../context/GameSettingsContext";
import duckImage from "../images/minigames/duck-hunt/duck.png";
import dogImage from "../images/minigames/duck-hunt/dog.png";
import backgroundImage from "../images/minigames/duck-hunt/background.png";
import "../styles/AimTrainerMinigame.css";

interface AimTrainerMinigameProps {
  onComplete:(effects:CareerEffects) => void;
  onSkip:() => void;
}

interface Duck {
  id:number;
  y:number;
  direction:"left"|"right";
  duration:number;
  createdAt:number;
}

type GameState = "ready"|"playing"|"result";

const TOTAL_DUCKS = 10;
const DUCK_MIN_DURATION = 900;
const DUCK_MAX_DURATION = 1450;

export function AimTrainerMinigame({onComplete,onSkip}:AimTrainerMinigameProps) {
  const {language} = useGameSettings();

  const [state,setState] = useState<GameState>("ready");
  const [duck,setDuck] = useState<Duck|null>(null);
  const [duckNumber,setDuckNumber] = useState(0);
  const [hits,setHits] = useState(0);
  const [missedShots,setMissedShots] = useState(0);
  const [escapedDucks,setEscapedDucks] = useState(0);
  const [reactionTimes,setReactionTimes] = useState<number[]>([]);
  const [aimGain,setAimGain] = useState(0);
  const [dogVisible,setDogVisible] = useState(false);

  const duckTimeoutRef = useRef<number|null>(null);
  const nextDuckTimeoutRef = useRef<number|null>(null);
  const duckIdRef = useRef(0);
  const duckNumberRef = useRef(0);
  const hitsRef = useRef(0);
  const missedShotsRef = useRef(0);
  const reactionTimesRef = useRef<number[]>([]);
  const finishedRef = useRef(false);

  const text = {
    es:{
      eyebrow:"ENTRENAMIENTO DE AIM",
      title:"CAZA DE REFLEJOS",
      ready:"LISTO",
      live:"EN CURSO",
      complete:"COMPLETADO",
      introTitle:"DERRIBA LOS 10 PATOS",
      intro:"Los patos cruzarán la pantalla rápidamente. Haz clic sobre ellos antes de que escapen. Los disparos fallidos reducen tu precisión.",
      start:"COMENZAR ENTRENAMIENTO",
      skip:"SALTAR",
      hits:"ACIERTOS",
      misses:"FALLOS",
      duck:"PATO",
      escaped:"ESCAPARON",
      accuracy:"PRECISIÓN",
      reaction:"REACCIÓN PROM.",
      result:"ENTRENAMIENTO COMPLETADO",
      continue:"CONTINUAR",
      elite:"ÉLITE",
      great:"EXCELENTE",
      good:"BUENO",
      decent:"DECENTE",
      completeReward:"COMPLETAR",
    },
    en:{
      eyebrow:"AIM TRAINING",
      title:"REACTION HUNT",
      ready:"READY",
      live:"LIVE",
      complete:"COMPLETE",
      introTitle:"TAKE DOWN ALL 10 DUCKS",
      intro:"Ducks will fly quickly across the range. Click them before they escape. Missed shots will reduce your accuracy.",
      start:"START TRAINING",
      skip:"SKIP",
      hits:"HITS",
      misses:"MISSES",
      duck:"DUCK",
      escaped:"ESCAPED",
      accuracy:"ACCURACY",
      reaction:"AVG REACTION",
      result:"TRAINING COMPLETE",
      continue:"CONTINUE",
      elite:"ELITE",
      great:"GREAT",
      good:"GOOD",
      decent:"DECENT",
      completeReward:"COMPLETE",
    },
  }[language];

  useEffect(() => {
    return () => cleanup();
  },[]);

  const cleanup = () => {
    if (duckTimeoutRef.current) window.clearTimeout(duckTimeoutRef.current);
    if (nextDuckTimeoutRef.current) window.clearTimeout(nextDuckTimeoutRef.current);

    duckTimeoutRef.current = null;
    nextDuckTimeoutRef.current = null;
  };

  const calculateAimGain = (finalHits:number,finalMissedShots:number,finalReactions:number[]) => {
    const totalShots = finalHits + finalMissedShots;
    const accuracy = totalShots ? finalHits / totalShots : 0;
    const averageReaction = finalReactions.length ? finalReactions.reduce((total,value) => total + value,0) / finalReactions.length : 9999;

    if (finalHits === 10 && accuracy >= .9 && averageReaction <= 450) return 5;
    if (finalHits >= 8 && accuracy >= .8) return 4;
    if (finalHits >= 6 && accuracy >= .65) return 3;
    if (finalHits >= 4 && accuracy >= .5) return 1;
    if (finalHits >= 2) return 0;
    if (finalHits === 1) return -1;

    return -2;
  };

  const finishGame = () => {
    if (finishedRef.current) return;

    finishedRef.current = true;

    cleanup();
    setDuck(null);
    setDogVisible(false);
    setAimGain(calculateAimGain(hitsRef.current,missedShotsRef.current,reactionTimesRef.current));
    setState("result");
  };

  const scheduleNextDuck = (delay = 280) => {
    nextDuckTimeoutRef.current = window.setTimeout(() => {
      spawnDuck();
    },delay);
  };

  const spawnDuck = () => {
    if (finishedRef.current) return;

    const nextNumber = duckNumberRef.current + 1;

    if (nextNumber > TOTAL_DUCKS) {
      finishGame();
      return;
    }

    duckNumberRef.current = nextNumber;
    duckIdRef.current += 1;

    const direction:Duck["direction"] = Math.random() > .5 ? "right" : "left";
    const duration = DUCK_MIN_DURATION + Math.random() * (DUCK_MAX_DURATION - DUCK_MIN_DURATION);

    const nextDuck:Duck = {
      id:duckIdRef.current,
      y:10 + Math.random() * 58,
      direction,
      duration,
      createdAt:performance.now(),
    };

    setDuckNumber(nextNumber);
    setDuck(nextDuck);
    setDogVisible(false);

    duckTimeoutRef.current = window.setTimeout(() => {
      setDuck(null);
      setEscapedDucks((value) => value + 1);
      setDogVisible(true);

      nextDuckTimeoutRef.current = window.setTimeout(() => {
        setDogVisible(false);
        spawnDuck();
      },650);
    },duration);
  };

  const startGame = () => {
    cleanup();

    finishedRef.current = false;
    duckNumberRef.current = 0;
    duckIdRef.current = 0;
    hitsRef.current = 0;
    missedShotsRef.current = 0;
    reactionTimesRef.current = [];

    setHits(0);
    setMissedShots(0);
    setEscapedDucks(0);
    setReactionTimes([]);
    setAimGain(0);
    setDogVisible(false);
    setDuckNumber(0);
    setDuck(null);
    setState("playing");

    scheduleNextDuck(450);
  };

  const hitDuck = (event:MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (state !== "playing" || !duck) return;

    const reaction = performance.now() - duck.createdAt;

    if (duckTimeoutRef.current) window.clearTimeout(duckTimeoutRef.current);

    duckTimeoutRef.current = null;

    hitsRef.current += 1;
    reactionTimesRef.current = [...reactionTimesRef.current,reaction];

    setDuck(null);
    setHits(hitsRef.current);
    setReactionTimes(reactionTimesRef.current);

    scheduleNextDuck(240);
  };

  const missShot = () => {
    if (state !== "playing" || !duck) return;

    missedShotsRef.current += 1;
    setMissedShots(missedShotsRef.current);
  };

  const averageReaction = reactionTimes.length ? reactionTimes.reduce((total,value) => total + value,0) / reactionTimes.length : 0;
  const totalShots = hits + missedShots;
  const accuracy = totalShots ? hits / totalShots : 0;

  const finish = () => onComplete({aim:aimGain});

  const rangeStyle = {
    backgroundImage:`url(${backgroundImage})`,
  } as CSSProperties;

  return (
    <div className="aim-minigame-overlay">
      <section className="aim-minigame">
        <div className="aim-minigame__header">
          <div><span className="eyebrow">{text.eyebrow}</span><h1>{text.title}</h1></div>
          <span className={`aim-minigame__status aim-minigame__status--${state}`}>{state === "ready" ? text.ready : state === "playing" ? text.live : text.complete}</span>
        </div>

        {state === "ready" && (
          <div className="aim-minigame__intro">
            <div className="aim-minigame__duck-preview">
              <img src={duckImage} alt="" draggable={false} />
            </div>

            <h2>{text.introTitle}</h2>
            <p>{text.intro}</p>

            <div className="aim-minigame__rewards">
              <span><b>{text.elite}</b><strong>AIM +5</strong></span>
              <span><b>{text.great}</b><strong>AIM +4</strong></span>
              <span><b>{text.good}</b><strong>AIM +3</strong></span>
              <span><b>{text.decent}</b><strong>AIM +1</strong></span>
              <span><b>{text.completeReward}</b><strong>AIM 0 / -2</strong></span>
            </div>

            <div className="aim-minigame__intro-actions">
              <button className="primary-button aim-minigame__start" onClick={startGame}>{text.start} <span>▶</span></button>
              <button className="aim-minigame__skip" onClick={onSkip}>{text.skip} <span>→</span></button>
            </div>
          </div>
        )}

        {state === "playing" && (
          <>
            <div className="aim-minigame__hud">
              <span>{text.duck} <b>{Math.min(duckNumber,TOTAL_DUCKS)}/{TOTAL_DUCKS}</b></span>
              <span>{text.hits} <b>{hits}</b></span>
              <span>{text.misses} <b>{missedShots}</b></span>
              <span>{text.escaped} <b>{escapedDucks}</b></span>
            </div>

            <div className="aim-minigame__range" style={rangeStyle} onClick={missShot}>
              {duck && (
                <button key={duck.id} className={`aim-minigame__duck aim-minigame__duck--${duck.direction}`} style={{top:`${duck.y}%`,"--duck-duration":`${duck.duration}ms`} as CSSProperties} onClick={hitDuck} aria-label="Duck">
                  <img src={duckImage} alt="" draggable={false} />
                </button>
              )}

              {dogVisible && (
                <div className="aim-minigame__dog">
                  <img src={dogImage} alt="" draggable={false} />
                </div>
              )}
            </div>
          </>
        )}

        {state === "result" && (
          <div className="aim-minigame__result">
            <span className="aim-minigame__result-label">{text.result}</span>
            <strong>{aimGain > 0 ? `AIM +${aimGain}` : aimGain < 0 ? `AIM ${aimGain}` : "AIM ±0"}</strong>

            <div className="aim-minigame__result-grid">
              <div><span>{text.hits}</span><b>{hits}/{TOTAL_DUCKS}</b></div>
              <div><span>{text.misses}</span><b>{missedShots}</b></div>
              <div><span>{text.accuracy}</span><b>{Math.round(accuracy * 100)}%</b></div>
              <div><span>{text.reaction}</span><b>{averageReaction ? `${Math.round(averageReaction)}ms` : "—"}</b></div>
            </div>

            <button className="primary-button" onClick={finish}>{text.continue} <span>→</span></button>
          </div>
        )}
      </section>
    </div>
  );
}