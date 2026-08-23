import {useEffect,useRef,useState} from "react";
import type {CareerEffects} from "../../types/career";
import {useGameSettings} from "../../context/GameSettingsContext";
import "../../styles/PrefireTrainingMinigame.css";

interface PrefireTrainingMinigameProps {
  onComplete:(effects:CareerEffects) => void;
  onSkip:() => void;
}

interface Target {
  x:number;
  y:number;
}

const TOTAL_ROUNDS = 5;

export function PrefireTrainingMinigame({onComplete,onSkip}:PrefireTrainingMinigameProps) {
  const {language} = useGameSettings();
  const arenaRef = useRef<HTMLDivElement|null>(null);
  const [round,setRound] = useState(0);
  const [score,setScore] = useState(0);
  const [started,setStarted] = useState(false);
  const [finished,setFinished] = useState(false);
  const [target,setTarget] = useState<Target>({x:75,y:45});
  const [visible,setVisible] = useState(false);
  const [cursor,setCursor] = useState({x:50,y:50});
  const [spawnTime,setSpawnTime] = useState(0);

  useEffect(() => {
    if (!started || finished) return;

    setVisible(false);

    const delay = window.setTimeout(() => {
      setTarget(createTarget());
      setVisible(true);
      setSpawnTime(performance.now());
    },random(700,1400));

    return () => window.clearTimeout(delay);
  },[round,started,finished]);

  const start = () => {
    setRound(0);
    setScore(0);
    setFinished(false);
    setStarted(true);
  };

  const handlePointerMove = (event:React.PointerEvent<HTMLDivElement>) => {
    if (!arenaRef.current) return;

    const rect = arenaRef.current.getBoundingClientRect();

    setCursor({
      x:((event.clientX - rect.left) / rect.width) * 100,
      y:((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleShot = () => {
    if (!started || !visible || finished) return;

    const dx = cursor.x - target.x;
    const dy = cursor.y - target.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const reaction = performance.now() - spawnTime;

    let points = 0;

    if (distance <= 4 && reaction <= 300) points = 100;
    else if (distance <= 6 && reaction <= 450) points = 80;
    else if (distance <= 8 && reaction <= 650) points = 60;
    else if (distance <= 11) points = 35;

    const nextScore = score + points;
    const nextRound = round + 1;

    setScore(nextScore);
    setVisible(false);

    if (nextRound >= TOTAL_ROUNDS) {
      setFinished(true);
      setStarted(false);
      return;
    }

    setRound(nextRound);
  };

  const complete = () => {
    const average = score / TOTAL_ROUNDS;

    if (average >= 80) {
      onComplete({aim:2,gameSense:2});
      return;
    }

    if (average >= 55) {
      onComplete({aim:1,gameSense:1});
      return;
    }

    onComplete({gameSense:-1});
  };

  return (
    <div className="prefire-training-backdrop">
      <section className="prefire-training">
        <header className="prefire-training__header">
          <div>
            <span className="eyebrow">{language==="es" ? "ENTRENAMIENTO MECÁNICO" : "MECHANICAL TRAINING"}</span>
            <h2>{language==="es" ? "ENTRENAMIENTO DE PREFIRE" : "PREFIRE TRAINING"}</h2>
            <p>{language==="es" ? "Coloca la mira donde crees que aparecerá el enemigo." : "Place your crosshair where you think the enemy will appear."}</p>
          </div>

          <button onClick={onSkip}>×</button>
        </header>

        <div ref={arenaRef} className="prefire-training__arena" onPointerMove={handlePointerMove} onPointerDown={handleShot}>
          <div className="prefire-training__wall prefire-training__wall--left" />
          <div className="prefire-training__wall prefire-training__wall--right" />

          {visible && (
            <div className="prefire-training__enemy" style={{left:`${target.x}%`,top:`${target.y}%`}}>
              <span />
            </div>
          )}

          <div className="prefire-training__crosshair" style={{left:`${cursor.x}%`,top:`${cursor.y}%`}}>
            <i />
            <i />
          </div>

          {!started && !finished && (
            <div className="prefire-training__overlay">
              <strong>{language==="es" ? "PREAPUNTA AL ÁNGULO" : "PREFIRE THE ANGLE"}</strong>
              <span>{language==="es" ? "Apunta a donde creas que aparecerá el rival." : "Aim at the corner before the enemy appears."}</span>
              <button onClick={start}>{language==="es" ? "INICIAR" : "START"}</button>
            </div>
          )}

          {finished && (
            <div className="prefire-training__overlay">
              <strong>{score} {language==="es" ? "PUNTOS" : "POINTS"}</strong>
              <span>{language==="es" ? "Promedio" : "Average"}: {Math.round(score / TOTAL_ROUNDS)}</span>
              <button onClick={complete}>{language==="es" ? "CONTINUAR" : "CONTINUE"}</button>
            </div>
          )}
        </div>

        <footer className="prefire-training__stats">
          <div><span>{language==="es" ? "RONDA" : "ROUND"}</span><strong>{Math.min(round + 1,TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</strong></div>
          <div><span>{language==="es" ? "PUNTUACIÓN" : "SCORE"}</span><strong>{score}</strong></div>
        </footer>
      </section>
    </div>
  );
}

function createTarget():Target {
  const rightSide = Math.random() > .5;

  return {
    x:rightSide ? random(68,82) : random(18,32),
    y:random(34,62),
  };
}

function random(min:number,max:number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}