import {useCallback,useEffect,useRef,useState} from "react";
import type {CareerEffects} from "../types/career";
import {useGameSettings} from "../context/GameSettingsContext";
import carnalitoSprite from "../images/minigames/carnalito/carnalito.png";
import carnalitoBackground from "../images/minigames/carnalito/plantsite.png";
import "../styles/CareerMinigames.css";

interface PlantTimingMinigameProps {
  onComplete:(effects:CareerEffects) => void;
  onSkip:() => void;
}

type Phase = "waiting"|"committed"|"planting"|"feedback"|"finished";
type RoundResult = "success"|"caught"|null;

interface EnemyConfig {
  y:number;
  startX:number;
  speed:number;
  direction:1|-1;
  width:number;
}

interface EnemyState extends EnemyConfig {
  x:number;
}

const MAX_ROUNDS = 3;
const PLAYER_WIDTH = 7;
const PLAYER_HEIGHT = 9;
const ENEMY_HEIGHT = 4;
const SITE_LEFT = 32;
const SITE_RIGHT = 68;
const SITE_TOP = 5;
const SITE_BOTTOM = 23;
const START_Y = 86;
const WALK_SPEED = 30;
const RUN_SPEED = 30;
const PLANT_TIME = 850;
const FEEDBACK_DELAY = 900;

const ROUND_CONFIGS:EnemyConfig[][] = [
  [
    {y:59,startX:14,speed:10,direction:1,width:18},
    {y:38,startX:67,speed:12,direction:-1,width:20},
  ],
  [
    {y:67,startX:8,speed:12,direction:1,width:19},
    {y:49,startX:70,speed:14,direction:-1,width:17},
    {y:31,startX:21,speed:11,direction:1,width:21},
  ],
  [
    {y:70,startX:10,speed:14,direction:1,width:18},
    {y:56,startX:69,speed:16,direction:-1,width:20},
    {y:42,startX:18,speed:15,direction:1,width:17},
    {y:28,startX:63,speed:17,direction:-1,width:19},
  ],
];

const createEnemies = (round:number):EnemyState[] => ROUND_CONFIGS[Math.min(round - 1,ROUND_CONFIGS.length - 1)].map((enemy) => ({...enemy,x:enemy.startX}));

export function PlantTimingMinigame({onComplete,onSkip}:PlantTimingMinigameProps) {
  const {language} = useGameSettings();

  const [started,setStarted] = useState(false);
  const [phase,setPhase] = useState<Phase>("waiting");
  const [round,setRound] = useState(1);
  const [successfulRounds,setSuccessfulRounds] = useState(0);
  const [result,setResult] = useState<RoundResult>(null);
  const [playerX,setPlayerX] = useState(46.5);
  const [playerY,setPlayerY] = useState(START_Y);
  const [enemies,setEnemies] = useState<EnemyState[]>(() => createEnemies(1));

  const phaseRef = useRef<Phase>("waiting");
  const playerXRef = useRef(46.5);
  const playerYRef = useRef(START_Y);
  const walkDirectionRef = useRef<1|-1>(1);
  const enemiesRef = useRef<EnemyState[]>(createEnemies(1));
  const lastFrameRef = useRef<number|null>(null);
  const resolvedRef = useRef(false);
  const attemptsRef = useRef(0);
  const successfulRoundsRef = useRef(0);

  const updatePhase = (next:Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const resetRound = useCallback((nextRound:number) => {
    const nextEnemies = createEnemies(nextRound);

    playerXRef.current = 46.5;
    playerYRef.current = START_Y;
    walkDirectionRef.current = Math.random() > .5 ? 1 : -1;
    enemiesRef.current = nextEnemies;
    resolvedRef.current = false;

    setPlayerX(46.5);
    setPlayerY(START_Y);
    setEnemies(nextEnemies);
    setResult(null);
    updatePhase("waiting");
  },[]);

  const finishRound = useCallback((success:boolean) => {
    if (resolvedRef.current) return;

    resolvedRef.current = true;

    attemptsRef.current += 1;

    if (success) {
      successfulRoundsRef.current += 1;
      setSuccessfulRounds(successfulRoundsRef.current);
    }

    setResult(success ? "success" : "caught");
    updatePhase("feedback");

    const attempts = attemptsRef.current;

    window.setTimeout(() => {
      if (attempts >= MAX_ROUNDS) {
        updatePhase("finished");
        setResult(null);
        return;
      }

      const nextRound = attempts + 1;

      setRound(nextRound);
      resetRound(nextRound);
    },FEEDBACK_DELAY);
  },[resetRound]);

  const commit = useCallback(() => {
    if (!started || phaseRef.current !== "waiting") return;
    updatePhase("committed");
  },[started]);

  useEffect(() => {
    if (!started || phase === "finished" || phase === "feedback" || phase === "planting") return;

    const frame = (time:number) => {
      if (lastFrameRef.current === null) lastFrameRef.current = time;

      const delta = Math.min((time - lastFrameRef.current) / 1000,.05);
      lastFrameRef.current = time;

      const movingEnemies = enemiesRef.current.map((enemy) => {
        let x = enemy.x + enemy.speed * enemy.direction * delta;
        let direction = enemy.direction;

        if (x <= 0) {
          x = 0;
          direction = 1;
        }

        if (x + enemy.width >= 100) {
          x = 100 - enemy.width;
          direction = -1;
        }

        return {...enemy,x,direction};
      });

      enemiesRef.current = movingEnemies;
      setEnemies(movingEnemies);

      if (phaseRef.current === "waiting") {
        let nextX = playerXRef.current + WALK_SPEED * walkDirectionRef.current * delta;

        if (nextX <= 2) {
          nextX = 2;
          walkDirectionRef.current = 1;
        }

        if (nextX + PLAYER_WIDTH >= 98) {
          nextX = 98 - PLAYER_WIDTH;
          walkDirectionRef.current = -1;
        }

        playerXRef.current = nextX;
        setPlayerX(nextX);
      }

      if (phaseRef.current === "committed") {
        const nextY = playerYRef.current - RUN_SPEED * delta;

        playerYRef.current = nextY;
        setPlayerY(nextY);

        const playerLeft = playerXRef.current;
        const playerRight = playerLeft + PLAYER_WIDTH;
        const playerTop = nextY;
        const playerBottom = nextY + PLAYER_HEIGHT;

        const collision = movingEnemies.some((enemy) => {
          const enemyLeft = enemy.x;
          const enemyRight = enemy.x + enemy.width;
          const enemyTop = enemy.y;
          const enemyBottom = enemy.y + ENEMY_HEIGHT;

          return playerRight > enemyLeft && playerLeft < enemyRight && playerBottom > enemyTop && playerTop < enemyBottom;
        });

        if (collision) {
          finishRound(false);
          return;
        }

        const insideSite = playerLeft >= SITE_LEFT && playerRight <= SITE_RIGHT && playerTop <= SITE_BOTTOM;

        if (insideSite) {
          updatePhase("planting");

          window.setTimeout(() => {
            finishRound(true);
          },PLANT_TIME);

          return;
        }

        if (playerTop <= 0) {
          finishRound(false);
          return;
        }
      }

      requestAnimationFrame(frame);
    };

    lastFrameRef.current = null;
    const animation = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animation);
      lastFrameRef.current = null;
    };
  },[started,phase,finishRound]);

  useEffect(() => {
    if (!started) return;

    const handleKeyDown = (event:KeyboardEvent) => {
      if (event.code !== "Space") return;
      event.preventDefault();
      commit();
    };

    window.addEventListener("keydown",handleKeyDown);
    return () => window.removeEventListener("keydown",handleKeyDown);
  },[started,commit]);

  const reward = successfulRounds === 3 ? 5 : successfulRounds === 2 ? 3 : successfulRounds === 1 ? 0 : -2;
  const finished = phase === "finished";

  return (
    <div className="career-minigame-overlay">
      <section className={`career-minigame plant-timing-minigame ${result === "success" ? "career-minigame--correct" : result === "caught" ? "career-minigame--wrong" : ""}`}>
        {!started ? (
          <PlantTimingIntro language={language} onStart={() => setStarted(true)} onSkip={onSkip} />
        ) : (
          <>
            <header className="career-minigame__header">
              <div><span>GAME SENSE</span><h2>{language === "es" ? "TIMING DE PLANTADO" : "PLANT TIMING"}</h2></div>
              {!finished && <strong>{round}/{MAX_ROUNDS}</strong>}
            </header>

            {!finished ? (
              <>
                <p className="career-minigame__instruction">
                  {phase === "waiting"
                    ? (language === "es" ? "ESPERA EL MOMENTO Y HAZ CLICK PARA ENTRAR" : "WAIT FOR THE OPENING AND CLICK TO COMMIT")
                    : phase === "committed"
                      ? (language === "es" ? "¡ENTRANDO AL SITE!" : "COMMITTED TO THE SITE!")
                      : phase === "planting"
                        ? (language === "es" ? "PLANTANDO SPIKE..." : "PLANTING SPIKE...")
                        : result === "success"
                          ? (language === "es" ? "SPIKE PLANTADA" : "SPIKE PLANTED")
                          : (language === "es" ? "TE ATRAPARON ROTANDO" : "CAUGHT ROTATING")}
                </p>

                <div className={`plant-timing-board plant-timing-board--round-${round}`} onClick={commit} style={{backgroundImage:`linear-gradient(rgba(4,8,12,.18),rgba(4,8,12,.18)),url(${carnalitoBackground})`}}>
                  <div className="plant-timing-site">
                    <span>A</span>
                    <strong>{language === "es" ? "PLANT SITE" : "PLANT SITE"}</strong>
                  </div>

                  <div className="plant-timing-site-line" />

                  {enemies.map((enemy,index) => (
                    <div key={index} className="plant-timing-enemy" style={{left:`${enemy.x}%`,top:`${enemy.y}%`,width:`${enemy.width}%`}}>
                      <span className="plant-timing-enemy__line" />
                      <strong>✕</strong>
                      <span className="plant-timing-enemy__line" />
                    </div>
                  ))}

                  <div className={`plant-timing-player plant-timing-player--${phase}`} style={{left:`${playerX}%`,top:`${playerY}%`}}>
                    <img className="plant-timing-player__sprite" src={carnalitoSprite} alt="Carnalito" draggable={false} />
                    {phase === "planting" && <div className="plant-timing-spike">▲</div>}
                  </div>

                  {phase === "waiting" && <div className="plant-timing-commit-hint"><strong>CLICK</strong><span>{language === "es" ? "PARA ENTRAR" : "TO COMMIT"}</span></div>}

                  {phase === "planting" && (
                    <div className="plant-timing-plant-progress">
                      <span>{language === "es" ? "PLANTANDO" : "PLANTING"}</span>
                      <div><i /></div>
                    </div>
                  )}

                  {phase === "feedback" && (
                    <div className={`plant-timing-round-result plant-timing-round-result--${result}`}>
                      <strong>{result === "success" ? "✓" : "✕"}</strong>
                      <span>{result === "success" ? (language === "es" ? "SPIKE PLANTADA" : "SPIKE PLANTED") : (language === "es" ? "ELIMINADO" : "ELIMINATED")}</span>
                    </div>
                  )}
                </div>

                <div className="plant-timing-status">
                  <div><span>{language === "es" ? "CONTROL" : "CONTROL"}</span><strong>{phase === "waiting" ? "CLICK / SPACE" : language === "es" ? "COMPROMETIDO" : "COMMITTED"}</strong></div>
                  <div><span>{language === "es" ? "PLANTADAS" : "PLANTS"}</span><strong>{successfulRounds}/{MAX_ROUNDS}</strong></div>
                  <div><span>{language === "es" ? "DIFICULTAD" : "DIFFICULTY"}</span><strong>{"●".repeat(round)}{"○".repeat(MAX_ROUNDS - round)}</strong></div>
                </div>
              </>
            ) : (
              <div className="career-minigame-result">
                <span>GAME SENSE</span>
                <strong>{successfulRounds}/{MAX_ROUNDS}</strong>
                <p>{reward > 0 ? `+${reward} GAME SENSE` : reward < 0 ? `${reward} GAME SENSE` : language === "es" ? "Sin cambios esta vez." : "No change this time."}</p>
                <button onClick={() => onComplete({gameSense:reward} as CareerEffects)}>{language === "es" ? "CONTINUAR" : "CONTINUE"} →</button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function PlantTimingIntro({language,onStart,onSkip}:{language:"es"|"en";onStart:() => void;onSkip:() => void}) {
  return (
    <div className="career-minigame-intro">
      <header className="career-minigame__header">
        <div><span>GAME SENSE TRAINING</span><h2>{language === "es" ? "TIMING DE PLANTADO" : "PLANT TIMING"}</h2></div>
        <strong>{language === "es" ? "LISTO" : "READY"}</strong>
      </header>

      <div className="career-minigame-intro__body">
        <div className="career-minigame-intro__icon">▲</div>
        <h3>{language === "es" ? "ENCUENTRA EL MOMENTO PARA ENTRAR" : "FIND THE OPENING TO ENTER"}</h3>

        <p>
          {language === "es"
            ? "Carnalito se moverá horizontalmente esperando el momento correcto. Haz click o presiona SPACE para comprometerte con la entrada. Desde ese momento caminará en línea recta hacia el site y no podrás detenerlo. Evita las líneas enemigas y planta la Spike."
            : "Carnalito moves horizontally while waiting for the right opening. Click or press SPACE to commit. From that moment he walks straight toward the site and cannot be stopped. Avoid enemy sightlines and plant the Spike."}
        </p>

        <div className="career-minigame-intro__rules">
          <div><strong>↔</strong><span>{language === "es" ? "Movimiento automático" : "Automatic movement"}</span></div>
          <div><strong>CLICK</strong><span>{language === "es" ? "Entrar al site" : "Commit to site"}</span></div>
          <div><strong>✕</strong><span>{language === "es" ? "Evita enemigos" : "Avoid enemies"}</span></div>
          <div><strong>{MAX_ROUNDS}</strong><span>{language === "es" ? "Rondas" : "Rounds"}</span></div>
        </div>

        <div className="career-minigame-intro__rewards">
          <div><strong>3/3</strong><span>+5 GAME SENSE</span></div>
          <div><strong>2/3</strong><span>+3 GAME SENSE</span></div>
          <div><strong>1/3</strong><span>±0 GAME SENSE</span></div>
          <div><strong>0/3</strong><span>-2 GAME SENSE</span></div>
        </div>

        <div className="career-minigame-intro__actions">
          <button className="career-minigame-start" onClick={onStart}>{language === "es" ? "COMENZAR ENTRENAMIENTO" : "START TRAINING"} <span>▶</span></button>
          <button className="career-minigame-skip" onClick={onSkip}>{language === "es" ? "SALTAR" : "SKIP"} <span>→</span></button>
        </div>
      </div>
    </div>
  );
}