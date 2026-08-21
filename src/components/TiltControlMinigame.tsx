import {useEffect,useMemo,useState} from "react";
import type {CareerEffects} from "../types/career";
import {useGameSettings} from "../context/GameSettingsContext";
import "../styles/CareerMinigames.css";

interface TiltControlMinigameProps {
  onComplete:(effects:CareerEffects) => void;
}

type Feedback = "correct"|"wrong"|"timeout"|null;

interface TiltMessage {
  id:string;
  text:{es:string;en:string};
  toxic:boolean;
}

const TIME_LIMIT = 2.5;
const FEEDBACK_DELAY = 600;

const MESSAGES:TiltMessage[] = [
  {id:"tilt-1",text:{es:"gg open mid",en:"gg open mid"},toxic:true},
  {id:"tilt-2",text:{es:"nuestro duelist no hace nada",en:"our duelist does nothing"},toxic:true},
  {id:"tilt-3",text:{es:"report controller",en:"report controller"},toxic:true},
  {id:"tilt-4",text:{es:"ff rápido",en:"quick ff"},toxic:true},
  {id:"tilt-5",text:{es:"no sirves",en:"you're useless"},toxic:true},
  {id:"tilt-6",text:{es:"dejen de morir solos",en:"stop dying alone"},toxic:true},
  {id:"tilt-7",text:{es:"este equipo está perdido",en:"this team is hopeless"},toxic:true},
  {id:"tilt-8",text:{es:"desinstala",en:"uninstall"},toxic:true},
  {id:"tilt-9",text:{es:"dos A Main",en:"two A Main"},toxic:false},
  {id:"tilt-10",text:{es:"spike en B",en:"spike B"},toxic:false},
  {id:"tilt-11",text:{es:"guardemos esta ronda",en:"let's save this round"},toxic:false},
  {id:"tilt-12",text:{es:"Omen lurkeando Mid",en:"Omen lurking Mid"},toxic:false},
  {id:"tilt-13",text:{es:"juguemos juntos",en:"let's play together"},toxic:false},
  {id:"tilt-14",text:{es:"tengo flash para entrar",en:"I have flash for entry"},toxic:false},
  {id:"tilt-15",text:{es:"espera mi humo",en:"wait for my smoke"},toxic:false},
  {id:"tilt-16",text:{es:"Operator en Heaven",en:"Operator Heaven"},toxic:false},
];

const shuffle = <T,>(items:T[]) => [...items].sort(() => Math.random() - .5);

export function TiltControlMinigame({onComplete}:TiltControlMinigameProps) {
  const {language} = useGameSettings();

  const messages = useMemo(() => shuffle(MESSAGES).slice(0,10),[]);
  const [started,setStarted] = useState(false);
  const [index,setIndex] = useState(0);
  const [correct,setCorrect] = useState(0);
  const [tilt,setTilt] = useState(25);
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

  const resolveChoice = (mute?:boolean,timeout = false) => {
    if (!started || locked || finished) return;

    const success = !timeout && mute === message.toxic;
    const nextCorrect = correct + (success ? 1 : 0);
    const tiltChange = timeout ? 16 : success ? -4 : 12;
    const nextTilt = Math.max(0,Math.min(100,tilt + tiltChange));

    setCorrect(nextCorrect);
    setTilt(nextTilt);
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

  const reward = correct >= 9 && tilt <= 30 ? 5 : correct >= 8 ? 4 : correct >= 6 ? 3 : correct >= 4 ? 2 : correct >= 2 ? 1 : 0;

  return (
    <div className="career-minigame-overlay">
      <section className={`career-minigame ${feedback === "correct" ? "career-minigame--correct" : feedback ? "career-minigame--wrong" : ""}`}>
        {!started ? (
          <TiltIntro language={language} onStart={() => setStarted(true)} />
        ) : (
          <>
            <header className="career-minigame__header">
              <div><span>MENTAL</span><h2>{language === "es" ? "CONTROL DE TILT" : "TILT CONTROL"}</h2></div>
              {!finished && <strong>{index + 1}/{messages.length}</strong>}
            </header>

            {!finished ? (
              <>
                <Timer timeLeft={timeLeft} max={TIME_LIMIT} language={language} />

                <div className="tilt-meter">
                  <div><span>TILT</span><strong>{tilt}%</strong></div>
                  <div className="tilt-meter__track"><span style={{width:`${tilt}%`}} /></div>
                </div>

                <p className="career-minigame__instruction">{language === "es" ? "Mutea la toxicidad. No silencies información importante." : "Mute toxicity. Do not silence useful information."}</p>

                <div className="tilt-message">
                  <span>TEAM VOICE</span>
                  <strong>“{message.text[language]}”</strong>
                </div>

                <div className="career-minigame__choices">
                  <button disabled={locked} onClick={() => resolveChoice(true)}>🔇 MUTE</button>
                  <button disabled={locked} onClick={() => resolveChoice(false)}>🎧 {language === "es" ? "ESCUCHAR" : "LISTEN"}</button>
                </div>

                <FeedbackMessage feedback={feedback} toxic={message.toxic} language={language} />
              </>
            ) : (
              <div className="career-minigame-result">
                <span>MENTAL</span>
                <strong>{correct}/{messages.length}</strong>
                <p>{reward > 0 ? `+${reward} MENTAL` : language === "es" ? "Sin mejora esta vez." : "No improvement this time."}</p>
                <small className="career-minigame-result__detail">FINAL TILT · {tilt}%</small>
                <button onClick={() => onComplete({mental:reward})}>{language === "es" ? "CONTINUAR" : "CONTINUE"} →</button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function TiltIntro({language,onStart}:{language:"es"|"en";onStart:() => void}) {
  return (
    <div className="career-minigame-intro">
      <header className="career-minigame__header">
        <div><span>ENTRENAMIENTO DE MENTAL</span><h2>{language === "es" ? "CONTROL DE TILT" : "TILT CONTROL"}</h2></div>
        <strong>{language === "es" ? "LISTO" : "READY"}</strong>
      </header>

      <div className="career-minigame-intro__body">
        <div className="career-minigame-intro__icon">◉</div>

        <h3>{language === "es" ? "MANTÉN LA CABEZA FRÍA" : "KEEP YOUR HEAD COOL"}</h3>

        <p>
          {language === "es"
            ? "Aparecerán mensajes del voice chat del equipo. Tendrás 2.5 segundos para decidir si debes mutear la toxicidad o mantener una comunicación útil. Las malas decisiones aumentarán tu nivel de tilt."
            : "Team voice messages will appear. You have 2.5 seconds to decide whether to mute toxicity or keep useful communication. Bad decisions will increase your tilt level."}
        </p>

        <div className="career-minigame-intro__rules">
          <div><strong>🔇 MUTE</strong><span>{language === "es" ? "Toxicidad y ataques" : "Toxicity and attacks"}</span></div>
          <div><strong>🎧 {language === "es" ? "ESCUCHAR" : "LISTEN"}</strong><span>{language === "es" ? "Información útil" : "Useful information"}</span></div>
          <div><strong>-4 TILT</strong><span>{language === "es" ? "Decisión correcta" : "Correct decision"}</span></div>
          <div><strong>+12/+16</strong><span>{language === "es" ? "Error / timeout" : "Mistake / timeout"}</span></div>
        </div>

        <div className="career-minigame-intro__rewards">
          <div><strong>9-10/10</strong><span>+5 MENTAL*</span></div>
          <div><strong>8/10</strong><span>+4 MENTAL</span></div>
          <div><strong>6-7/10</strong><span>+3 MENTAL</span></div>
          <div><strong>4-5/10</strong><span>+2 MENTAL</span></div>
        </div>

        <p>{language === "es" ? "* +5 requiere terminar con 30% de tilt o menos." : "* +5 requires finishing with 30% tilt or less."}</p>

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

function FeedbackMessage({feedback,toxic,language}:{feedback:Feedback;toxic:boolean;language:"es"|"en"}) {
  if (!feedback) return <div className="career-minigame-feedback" />;

  if (feedback === "correct") {
    return (
      <div className="career-minigame-feedback career-minigame-feedback--correct">
        ✓ {toxic ? (language === "es" ? "TOXICIDAD SILENCIADA" : "TOXICITY MUTED") : (language === "es" ? "COMUNICACIÓN CONSERVADA" : "COMM KEPT")}
      </div>
    );
  }

  return (
    <div className="career-minigame-feedback career-minigame-feedback--wrong">
      ✕ {feedback === "timeout" ? (language === "es" ? "TIEMPO AGOTADO" : "TIME OUT") : toxic ? (language === "es" ? "DEBÍAS MUTEARLO" : "YOU SHOULD HAVE MUTED") : (language === "es" ? "SILENCIASTE INFORMACIÓN ÚTIL" : "YOU MUTED USEFUL INFO")}
    </div>
  );
}