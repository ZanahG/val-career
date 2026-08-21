import {useEffect,useRef,useState} from "react";
import type {CareerEffects} from "../types/career";
import {useGameSettings} from "../context/GameSettingsContext";
import spikeFailAudio from "../audio/spike-fail.mp3";
import "../styles/ClutchDefuseMinigame.css";

interface ClutchDefuseMinigameProps {
  onComplete: (effects: CareerEffects) => void;
}

type GameState = "ready"|"playing"|"defusing"|"success"|"failed";

interface Result {
  label: "perfect"|"insane"|"great"|"safe"|"early"|"too-late"|"failed"|"audio-error";
  remaining: number;
  clutch: number;
}

const PLAY_WINDOW = 15;
const DEFUSE_DURATION = 7;
const EXPLOSION_AT = 41.0;
const AUDIO_END_AT = 51.0;

export function ClutchDefuseMinigame({onComplete}: ClutchDefuseMinigameProps) {
  const {language} = useGameSettings();

  const [state,setState] = useState<GameState>("ready");
  const [result,setResult] = useState<Result | null>(null);
  const [defuseProgress,setDefuseProgress] = useState(0);

  const countdownAudioRef = useRef<HTMLAudioElement | null>(null);
  const defuseStartRemainingRef = useRef(0);
  const defuseTimeoutRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const explosionWatcherRef = useRef<number | null>(null);
  const explodedRef = useRef(false);

  const text = {
    es: {
      eyebrow:"ENTRENAMIENTO DE CLUTCH",
      title:"DESACTIVAR SPIKE",
      ready:"LISTO",
      planted:"SPIKE PLANTADA",
      defusing:"DESACTIVANDO",
      defused:"DESACTIVADA",
      detonated:"DETONADA",
      introTitle:"DESACTÍVALA EN EL ÚLTIMO MOMENTO POSIBLE",
      intro:"Escucha la Spike y comienza a desactivarla lo más tarde posible. Una desactivación completa tarda 7 segundos. Si comienzas cuando quedan menos de 7 segundos, la Spike explotará.",
      start:"COMENZAR ENTRENAMIENTO",
      listen:"Escucha con atención. No hay temporizador.",
      nerve:"MANTÉN LA CALMA",
      defuse:"DESACTIVAR",
      stillCounting:"La Spike sigue contando.",
      remaining:"restantes cuando comenzaste a desactivar",
      tooLate:"Comenzaste a desactivar demasiado tarde.",
      exploded:"La Spike explotó.",
      continue:"CONTINUAR",
      clutch:"CLUTCH",
      perfect:"PERFECTO",
      insane:"INCREÍBLE",
      great:"MUY BIEN",
      safe:"SEGURO",
      early:"TEMPRANO",
      tooLateLabel:"DEMASIADO TARDE",
      failed:"FALLIDO",
      audioError:"ERROR DE AUDIO",
    },
    en: {
      eyebrow:"CLUTCH TRAINING",
      title:"SPIKE DEFUSE",
      ready:"READY",
      planted:"SPIKE PLANTED",
      defusing:"DEFUSING",
      defused:"DEFUSED",
      detonated:"DETONATED",
      introTitle:"DEFUSE AT THE LAST POSSIBLE MOMENT",
      intro:"Listen to the Spike and begin the defuse as late as possible. A full defuse takes 7 seconds. Starting with less than 7 seconds remaining means the Spike will detonate.",
      start:"START TRAINING",
      listen:"Listen carefully. There is no timer.",
      nerve:"HOLD YOUR NERVE",
      defuse:"DEFUSE",
      stillCounting:"The Spike is still counting down.",
      remaining:"remaining when the defuse started",
      tooLate:"You started the defuse too late.",
      exploded:"The Spike detonated.",
      continue:"CONTINUE",
      clutch:"CLUTCH",
      perfect:"PERFECT",
      insane:"INSANE",
      great:"GREAT",
      safe:"SAFE",
      early:"EARLY",
      tooLateLabel:"TOO LATE",
      failed:"FAILED",
      audioError:"AUDIO ERROR",
    },
  }[language];

  useEffect(() => {
    return () => cleanup();
  },[]);

  const cleanup = () => {
    if (defuseTimeoutRef.current) window.clearTimeout(defuseTimeoutRef.current);
    if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
    if (explosionWatcherRef.current) window.cancelAnimationFrame(explosionWatcherRef.current);

    countdownAudioRef.current?.pause();

    defuseTimeoutRef.current = null;
    progressIntervalRef.current = null;
    explosionWatcherRef.current = null;
    countdownAudioRef.current = null;
  };

  const getResultLabel = (label: Result["label"]) => {
    if (label === "perfect") return text.perfect;
    if (label === "insane") return text.insane;
    if (label === "great") return text.great;
    if (label === "safe") return text.safe;
    if (label === "early") return text.early;
    if (label === "too-late") return text.tooLateLabel;
    if (label === "audio-error") return text.audioError;
    return text.failed;
  };

  const failDefuse = () => {
    if (defuseTimeoutRef.current) window.clearTimeout(defuseTimeoutRef.current);
    if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);

    defuseTimeoutRef.current = null;
    progressIntervalRef.current = null;

    const remaining = defuseStartRemainingRef.current;

    setState("failed");
    setResult({
      label:remaining > 0 && remaining < DEFUSE_DURATION ? "too-late" : "failed",
      remaining,
      clutch:0,
    });
  };

  const startExplosionWatcher = () => {
    const watchExplosion = () => {
      const audio = countdownAudioRef.current;
      if (!audio) return;

      if (audio.currentTime >= EXPLOSION_AT && !explodedRef.current) {
        explodedRef.current = true;
        failDefuse();
      }

      if (audio.currentTime >= AUDIO_END_AT || audio.ended) {
        audio.pause();
        explosionWatcherRef.current = null;
        return;
      }

      explosionWatcherRef.current = window.requestAnimationFrame(watchExplosion);
    };

    explosionWatcherRef.current = window.requestAnimationFrame(watchExplosion);
  };

  const startGame = async () => {
    cleanup();

    const audio = new Audio(spikeFailAudio);
    audio.preload = "auto";
    audio.volume = .8;

    countdownAudioRef.current = audio;
    defuseStartRemainingRef.current = 0;
    explodedRef.current = false;

    try {
      await new Promise<void>((resolve,reject) => {
        const handleLoaded = () => {
          audio.removeEventListener("loadedmetadata",handleLoaded);
          audio.removeEventListener("error",handleError);
          resolve();
        };

        const handleError = () => {
          audio.removeEventListener("loadedmetadata",handleLoaded);
          audio.removeEventListener("error",handleError);
          reject();
        };

        if (audio.readyState >= 1) {
          resolve();
          return;
        }

        audio.addEventListener("loadedmetadata",handleLoaded);
        audio.addEventListener("error",handleError);
        audio.load();
      });

      audio.currentTime = Math.max(0,EXPLOSION_AT - PLAY_WINDOW);

      setState("playing");
      setResult(null);
      setDefuseProgress(0);

      await audio.play();

      startExplosionWatcher();
    } catch {
      setState("failed");
      setResult({label:"audio-error",remaining:0,clutch:0});
    }
  };

  const startDefuse = () => {
    const audio = countdownAudioRef.current;
    if (state !== "playing" || !audio || explodedRef.current) return;

    const remaining = Math.max(0,EXPLOSION_AT - audio.currentTime);

    defuseStartRemainingRef.current = remaining;

    setState("defusing");
    setDefuseProgress(0);

    const startedAt = performance.now();

    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = (performance.now() - startedAt) / 1000;
      const progress = Math.min(100,(elapsed / DEFUSE_DURATION) * 100);

      setDefuseProgress(progress);
    },50);

    defuseTimeoutRef.current = window.setTimeout(() => {
      completeDefuse();
    },DEFUSE_DURATION * 1000);
  };

  const completeDefuse = () => {
    const audio = countdownAudioRef.current;
    if (!audio || explodedRef.current) return;

    if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = null;
    defuseTimeoutRef.current = null;

    const startedRemaining = defuseStartRemainingRef.current;
    const currentRemaining = EXPLOSION_AT - audio.currentTime;

    if (startedRemaining < DEFUSE_DURATION || currentRemaining <= 0) return;

    if (explosionWatcherRef.current) window.cancelAnimationFrame(explosionWatcherRef.current);

    explosionWatcherRef.current = null;

    audio.pause();

    let clutch = 1;
    let label: Result["label"] = "early";

    if (startedRemaining <= 7.10) {
      clutch = 5;
      label = "perfect";
    } else if (startedRemaining <= 7.30) {
      clutch = 4;
      label = "insane";
    } else if (startedRemaining <= 7.60) {
      clutch = 3;
      label = "great";
    } else if (startedRemaining <= 8.20) {
      clutch = 2;
      label = "safe";
    }

    setDefuseProgress(100);
    setState("success");
    setResult({label,remaining:startedRemaining,clutch});
  };

  const finish = () => {
    if (!result) return;

    cleanup();

    onComplete(result.clutch > 0 ? {clutch:result.clutch} : {});
  };

  const defuseRemaining = state === "defusing" ? Math.max(0,DEFUSE_DURATION * (1 - defuseProgress / 100)) : 0;
  const statusLabel = state === "ready" ? text.ready : state === "playing" ? text.planted : state === "defusing" ? text.defusing : state === "success" ? text.defused : text.detonated;

  return (
    <div className="clutch-minigame-overlay">
      <section className="clutch-minigame">
        <div className="clutch-minigame__header">
          <div><span className="eyebrow">{text.eyebrow}</span><h1>{text.title}</h1></div>
          <span className={`clutch-minigame__status clutch-minigame__status--${state}`}>{statusLabel}</span>
        </div>

        {state === "ready" && (
          <div className="clutch-minigame__intro">
            <div className="clutch-minigame__spike">◆</div>

            <h2>{text.introTitle}</h2>
            <p>{text.intro}</p>

            <div className="clutch-minigame__rewards">
              <span><b>7.00–7.10s</b> {text.perfect} <strong>+5</strong></span>
              <span><b>7.11–7.30s</b> {text.insane} <strong>+4</strong></span>
              <span><b>7.31–7.60s</b> {text.great} <strong>+3</strong></span>
              <span><b>7.61–8.20s</b> {text.safe} <strong>+2</strong></span>
              <span><b>&gt; 8.20s</b> {text.early} <strong>+1</strong></span>
            </div>

            <button className="primary-button clutch-minigame__start" onClick={startGame}>{text.start} <span>▶</span></button>
          </div>
        )}

        {state === "playing" && (
          <div className="clutch-minigame__playing">
            <div className="clutch-minigame__spike clutch-minigame__spike--active">
              <span>◆</span>
              <i />
            </div>

            <span className="clutch-minigame__warning">{text.planted}</span>
            <p>{text.listen}</p>

            <button className="clutch-minigame__defuse" onClick={startDefuse}>
              <span>{text.nerve}</span>
              <strong>{text.defuse}</strong>
            </button>
          </div>
        )}

        {state === "defusing" && (
          <div className="clutch-minigame__playing">
            <div className="clutch-minigame__spike clutch-minigame__spike--active">
              <span>◆</span>
              <i />
            </div>

            <span className="clutch-minigame__warning">{text.defusing}</span>

            <div className="clutch-minigame__defuse-progress">
              <div className="clutch-minigame__defuse-progress-bar" style={{width:`${defuseProgress}%`}} />
            </div>

            <strong className="clutch-minigame__defuse-time">{defuseRemaining.toFixed(1)}s</strong>

            <p>{text.stillCounting}</p>
          </div>
        )}

        {(state === "success" || state === "failed") && result && (
          <div className={`clutch-minigame__result clutch-minigame__result--${state}`}>
            <span className="clutch-minigame__result-label">{getResultLabel(result.label)}</span>

            {state === "success" ? (
              <>
                <strong>{result.remaining.toFixed(3)}s</strong>
                <p>{text.remaining}</p>
                <div className="clutch-minigame__gain">{text.clutch} <b>+{result.clutch}</b></div>
              </>
            ) : (
              <>
                <strong>{result.remaining > 0 ? `${result.remaining.toFixed(3)}s` : "0.000s"}</strong>
                <p>{result.label === "too-late" ? text.tooLate : result.label === "audio-error" ? text.audioError : text.exploded}</p>
                <div className="clutch-minigame__gain clutch-minigame__gain--failed">{text.clutch} <b>+0</b></div>
              </>
            )}

            <button className="primary-button" onClick={finish}>{text.continue} <span>→</span></button>
          </div>
        )}
      </section>
    </div>
  );
}