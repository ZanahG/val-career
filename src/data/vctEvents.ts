import type {CareerEffects} from "../types/career";
import type {PlayableVCTPhase,VCTPhase} from "../types/vct";

interface LocalizedText {
  es:string;
  en:string;
}

type VCTStatEffects = Pick<CareerEffects,"aim"|"gameSense"|"communication"|"clutch"|"consistency"|"mental">;

export interface VCTNarrativeChoice {
  id:string;
  label:LocalizedText;
  description:LocalizedText;
  effects:VCTStatEffects;
}

export interface VCTNarrativeEvent {
  id:string;
  eyebrow:LocalizedText;
  title:LocalizedText;
  description:LocalizedText;
  choices:VCTNarrativeChoice[];
}

const randomItem = <T,>(items:readonly T[]) => items[Math.floor(Math.random() * items.length)];

export const VCT_NARRATIVE_EVENTS:VCTNarrativeEvent[] = [
  {
    id:"kickoff-champion-routine",
    eyebrow:{es:"CAMPEONES DE KICKOFF",en:"KICKOFF CHAMPIONS"},
    title:{es:"El trofeo cambia la forma en que los rivales te miran",en:"The trophy changes how opponents see you"},
    description:{es:"Después de ganar Kickoff, el staff quiere evitar que el éxito altere la preparación. Todos los rivales tendrán más información sobre ustedes a partir de ahora.",en:"After winning Kickoff, the staff wants to prevent success from changing preparation. Every opponent will have more information on you from now on."},
    choices:[
      {
        id:"kickoff-champion-routine-maintain",
        label:{es:"Mantener exactamente la misma rutina",en:"Keep the exact same routine"},
        description:{es:"No quieres que ganar cambie lo que ya funcionaba.",en:"You don't want winning to change what was already working."},
        effects:{consistency:3,mental:1},
      },
      {
        id:"kickoff-champion-routine-study",
        label:{es:"Estudiar cómo intentarán contrarrestarte",en:"Study how teams will counter you"},
        description:{es:"Dedicas más tiempo a revisar tus propios patrones desde el punto de vista del rival.",en:"Spend more time reviewing your own patterns from the opponent's perspective."},
        effects:{gameSense:3,consistency:1},
      },
      {
        id:"kickoff-champion-routine-expand",
        label:{es:"Agregar nuevas variantes",en:"Add new variations"},
        description:{es:"Prefieres ser menos predecible aunque al principio pierdas algo de estabilidad.",en:"Prefer becoming less predictable even if it costs some stability at first."},
        effects:{gameSense:2,communication:2,consistency:-1},
      },
    ],
  },

  {
    id:"kickoff-champion-target",
    eyebrow:{es:"AHORA ERES EL OBJETIVO",en:"NOW YOU'RE THE TARGET"},
    title:{es:"Los rivales empiezan a preparar específicamente tu estilo",en:"Opponents start preparing specifically for your style"},
    description:{es:"Tus mejores posiciones y hábitos aparecen constantemente en las sesiones de análisis de otros equipos. El coach quiere decidir cómo responder.",en:"Your strongest positions and habits are now constantly appearing in other teams' analysis sessions. The coach wants to decide how to respond."},
    choices:[
      {
        id:"kickoff-target-mechanics",
        label:{es:"Confiar en tus mecánicas",en:"Trust your mechanics"},
        description:{es:"Aunque sepan dónde estarás, todavía tendrán que ganarte el duelo.",en:"Even if they know where you'll be, they still have to win the duel."},
        effects:{aim:3,gameSense:-1},
      },
      {
        id:"kickoff-target-adapt",
        label:{es:"Cambiar tus patrones",en:"Change your patterns"},
        description:{es:"Trabajas nuevas posiciones, timings y decisiones para ser más difícil de leer.",en:"Work on new positions, timings and decisions to become harder to read."},
        effects:{gameSense:3,consistency:-1},
      },
      {
        id:"kickoff-target-team",
        label:{es:"Modificar setups con el equipo",en:"Change setups with the team"},
        description:{es:"Buscas que leer tu posición no revele automáticamente el plan completo.",en:"Make sure reading your position doesn't automatically reveal the entire plan."},
        effects:{communication:3,gameSense:1},
      },
    ],
  },

  {
    id:"kickoff-final-review",
    eyebrow:{es:"A UN PASO",en:"ONE STEP AWAY"},
    title:{es:"La final se decidió por detalles",en:"The final was decided by small details"},
    description:{es:"El equipo estuvo cerca del título, pero varias rondas cerradas terminaron del lado rival. El staff quiere saber qué corregir primero.",en:"The team came close to the title, but several close rounds went the opponent's way. The staff wants to know what to fix first."},
    choices:[
      {
        id:"kickoff-final-review-vods",
        label:{es:"Revisar las rondas decisivas",en:"Review the deciding rounds"},
        description:{es:"Buscas patrones en las decisiones que tomaron cuando la presión aumentó.",en:"Look for patterns in the decisions made when the pressure increased."},
        effects:{gameSense:3,mental:1},
      },
      {
        id:"kickoff-final-review-clutch",
        label:{es:"Entrenar situaciones de cierre",en:"Practice closing situations"},
        description:{es:"Quieres acostumbrarte a jugar las últimas rondas con el mismo nivel de calma.",en:"Want to become accustomed to playing late rounds with the same level of calm."},
        effects:{clutch:2,mental:2},
      },
      {
        id:"kickoff-final-review-reset",
        label:{es:"Pasar página rápidamente",en:"Move on quickly"},
        description:{es:"Prefieres evitar sobreanalizar una derrota que estuvo muy cerca.",en:"Prefer avoiding overanalyzing a loss that was extremely close."},
        effects:{mental:3,consistency:1},
      },
    ],
  },

  {
    id:"kickoff-final-pressure",
    eyebrow:{es:"DESPUÉS DE LA FINAL",en:"AFTER THE FINAL"},
    title:{es:"El equipo discute cómo reaccionar a la derrota",en:"The team discusses how to respond to the loss"},
    description:{es:"Algunos quieren aumentar las horas de práctica y otros creen que el problema fue principalmente mental.",en:"Some want to increase practice hours while others believe the issue was mainly mental."},
    choices:[
      {
        id:"kickoff-final-pressure-grind",
        label:{es:"Aumentar la práctica mecánica",en:"Increase mechanical practice"},
        description:{es:"Conviertes la frustración en más horas de puntería.",en:"Turn frustration into more hours of mechanical practice."},
        effects:{aim:3,mental:-1},
      },
      {
        id:"kickoff-final-pressure-rest",
        label:{es:"Recuperar la cabeza",en:"Recover mentally"},
        description:{es:"Prefieres llegar fresco a la siguiente etapa.",en:"Prefer arriving fresh for the next stage."},
        effects:{mental:4,consistency:-1},
      },
      {
        id:"kickoff-final-pressure-comms",
        label:{es:"Revisar la comunicación bajo presión",en:"Review communication under pressure"},
        description:{es:"Varias decisiones tardaron demasiado cuando las rondas se cerraron.",en:"Several decisions took too long when rounds became tense."},
        effects:{communication:3,clutch:1},
      },
    ],
  },

  {
    id:"kickoff-semifinal-adjustment",
    eyebrow:{es:"PRIMER OBSTÁCULO",en:"FIRST OBSTACLE"},
    title:{es:"Kickoff deja claro que todavía hay piezas por ajustar",en:"Kickoff makes it clear there are still pieces to adjust"},
    description:{es:"El roster mostró buenos momentos, pero también problemas de coordinación y adaptación.",en:"The roster showed strong moments but also problems with coordination and adaptation."},
    choices:[
      {
        id:"kickoff-semifinal-adjustment-role",
        label:{es:"Revisar tu rol",en:"Review your role"},
        description:{es:"Hablas con el coach sobre cómo aportar más al sistema.",en:"Talk with the coach about how to contribute more to the system."},
        effects:{gameSense:2,communication:2},
      },
      {
        id:"kickoff-semifinal-adjustment-aim",
        label:{es:"Pulir tus duelos",en:"Polish your duels"},
        description:{es:"Sientes que varias rondas podrían haber cambiado ganando el primer enfrentamiento.",en:"Feel several rounds could have changed by winning the opening duel."},
        effects:{aim:3,consistency:1},
      },
      {
        id:"kickoff-semifinal-adjustment-calm",
        label:{es:"Trabajar la paciencia",en:"Work on patience"},
        description:{es:"Intentas reducir decisiones apresuradas cuando el mapa se complica.",en:"Try reducing rushed decisions when the map becomes difficult."},
        effects:{mental:2,gameSense:2},
      },
    ],
  },

  {
    id:"kickoff-semifinal-comms",
    eyebrow:{es:"FALTA SINCRONÍA",en:"OUT OF SYNC"},
    title:{es:"El staff detecta problemas de coordinación",en:"The staff detects coordination problems"},
    description:{es:"Al revisar Kickoff aparecen varias rondas donde la idea era correcta, pero los timings del equipo no coincidieron.",en:"Reviewing Kickoff reveals several rounds where the idea was correct, but team timings did not line up."},
    choices:[
      {
        id:"kickoff-semifinal-comms-protocol",
        label:{es:"Crear calls más simples",en:"Create simpler calls"},
        description:{es:"Reducen la cantidad de información necesaria para reaccionar rápido.",en:"Reduce the amount of information needed to react quickly."},
        effects:{communication:3,consistency:1},
      },
      {
        id:"kickoff-semifinal-comms-freedom",
        label:{es:"Jugar con más libertad",en:"Play with more freedom"},
        description:{es:"Prefieres depender más de lectura individual que de protocolos rígidos.",en:"Prefer relying more on individual reads than rigid protocols."},
        effects:{gameSense:3,communication:-1},
      },
      {
        id:"kickoff-semifinal-comms-repetition",
        label:{es:"Repetir los mismos setups",en:"Repeat the same setups"},
        description:{es:"Buscas automatizar los movimientos hasta ejecutarlos sin dudar.",en:"Try to automate movements until they can be executed without hesitation."},
        effects:{consistency:3,communication:1},
      },
    ],
  },

  {
    id:"kickoff-collapse-mechanics",
    eyebrow:{es:"MAL COMIENZO",en:"ROUGH START"},
    title:{es:"La eliminación temprana obliga a volver a los fundamentos",en:"The early elimination forces a return to fundamentals"},
    description:{es:"Kickoff terminó mucho antes de lo esperado. El coach propone una semana dedicada a reconstruir confianza y fundamentos.",en:"Kickoff ended much earlier than expected. The coach proposes a week dedicated to rebuilding confidence and fundamentals."},
    choices:[
      {
        id:"kickoff-collapse-mechanics-aim",
        label:{es:"Entrenar precisión y reflejos",en:"Train precision and reflexes"},
        description:{es:"Dedicas una sesión especial al trabajo mecánico.",en:"Dedicate a special session to mechanical training."},
        effects:{aim:3,consistency:1,mental:-1},
      },
      {
        id:"kickoff-collapse-mechanics-vods",
        label:{es:"Revisar tus decisiones",en:"Review your decisions"},
        description:{es:"Prefieres entender por qué quedaste en malas posiciones.",en:"Prefer understanding why you ended up in bad positions."},
        effects:{gameSense:3,mental:1},
      },
      {
        id:"kickoff-collapse-mechanics-reset",
        label:{es:"Resetear completamente",en:"Reset completely"},
        description:{es:"Dejas atrás Kickoff y proteges tu confianza para Stage 1.",en:"Leave Kickoff behind and protect your confidence for Stage 1."},
        effects:{mental:4,consistency:1},
      },
    ],
  },

  {
    id:"kickoff-collapse-system",
    eyebrow:{es:"RECONSTRUCCIÓN",en:"REBUILD"},
    title:{es:"El staff considera modificar el sistema antes de Stage 1",en:"The staff considers changing the system before Stage 1"},
    description:{es:"La eliminación temprana hace que el equipo experimente con nuevas responsabilidades y estructuras.",en:"The early elimination pushes the team to experiment with new responsibilities and structures."},
    choices:[
      {
        id:"kickoff-collapse-system-learn",
        label:{es:"Aceptar un rol más complejo",en:"Accept a more complex role"},
        description:{es:"Asumes más responsabilidad en la lectura de las rondas.",en:"Take on more responsibility for reading rounds."},
        effects:{gameSense:3,consistency:-1},
      },
      {
        id:"kickoff-collapse-system-comms",
        label:{es:"Participar más en las calls",en:"Participate more in calls"},
        description:{es:"Quieres ayudar a que las decisiones lleguen más rápido.",en:"Want to help decisions happen faster."},
        effects:{communication:3,mental:1},
      },
      {
        id:"kickoff-collapse-system-simple",
        label:{es:"Simplificar tu juego",en:"Simplify your game"},
        description:{es:"Reducir responsabilidades puede ayudarte a recuperar estabilidad.",en:"Reducing responsibilities may help you regain stability."},
        effects:{consistency:3,gameSense:-1},
      },
    ],
  },

  {
    id:"masters1-breakout-adapt",
    eyebrow:{es:"ESCENARIO INTERNACIONAL",en:"INTERNATIONAL STAGE"},
    title:{es:"Los estilos de otras regiones te obligan a adaptarte",en:"Styles from other regions force you to adapt"},
    description:{es:"Masters te enfrenta a ritmos, composiciones y decisiones diferentes a las que ves normalmente en tu región.",en:"Masters exposes you to pacing, compositions and decisions different from what you normally see in your region."},
    choices:[
      {
        id:"masters1-breakout-adapt-study",
        label:{es:"Absorber nuevas ideas",en:"Absorb new ideas"},
        description:{es:"Guardas detalles de cada rival para incorporarlos a tu juego.",en:"Save details from every opponent to incorporate into your own game."},
        effects:{gameSense:4,consistency:-1},
      },
      {
        id:"masters1-breakout-adapt-trust",
        label:{es:"Confiar en tu estilo",en:"Trust your style"},
        description:{es:"Crees que cambiar demasiado ahora sería un error.",en:"Believe changing too much right now would be a mistake."},
        effects:{consistency:3,mental:2},
      },
      {
        id:"masters1-breakout-adapt-comms",
        label:{es:"Priorizar comunicación",en:"Prioritize communication"},
        description:{es:"Ante situaciones nuevas quieres que el equipo comparta información constantemente.",en:"In unfamiliar situations you want the team sharing information constantly."},
        effects:{communication:3,gameSense:1},
      },
    ],
  },

  {
    id:"masters1-breakout-pressure",
    eyebrow:{es:"FOCOS ENCIMA",en:"UNDER THE SPOTLIGHT"},
    title:{es:"Cada error se siente más grande en el escenario internacional",en:"Every mistake feels bigger on the international stage"},
    description:{es:"El ambiente, el público y la importancia de los partidos hacen que incluso una ronda normal se sienta diferente.",en:"The atmosphere, crowd and importance of the matches make even a normal round feel different."},
    choices:[
      {
        id:"masters1-breakout-pressure-breathe",
        label:{es:"Bajar el ritmo",en:"Slow yourself down"},
        description:{es:"Intentas tomar medio segundo extra antes de decisiones importantes.",en:"Try taking an extra half-second before important decisions."},
        effects:{mental:3,gameSense:2},
      },
      {
        id:"masters1-breakout-pressure-aggressive",
        label:{es:"Jugar sin miedo",en:"Play without fear"},
        description:{es:"Prefieres confiar en tus reflejos y no pensar demasiado.",en:"Prefer trusting your reflexes and avoiding overthinking."},
        effects:{aim:3,mental:1,consistency:-1},
      },
      {
        id:"masters1-breakout-pressure-clutch",
        label:{es:"Buscar comodidad en situaciones límite",en:"Become comfortable in pressure situations"},
        description:{es:"Trabajas específicamente la toma de decisiones en rondas cerradas.",en:"Work specifically on decision-making in close rounds."},
        effects:{clutch:3,mental:1},
      },
    ],
  },

  {
    id:"masters1-respect-study",
    eyebrow:{es:"RESPETO INTERNACIONAL",en:"INTERNATIONAL RESPECT"},
    title:{es:"Competir contra los mejores cambia tu lectura del juego",en:"Competing against the best changes how you read the game"},
    description:{es:"Aunque el trofeo no llegó, el torneo dejó muchas ideas que pueden mejorar tu nivel regional.",en:"Even without the trophy, the event left plenty of ideas that could improve your regional level."},
    choices:[
      {
        id:"masters1-respect-study-meta",
        label:{es:"Estudiar el meta internacional",en:"Study the international meta"},
        description:{es:"Analizas tendencias que todavía no son comunes en tu región.",en:"Analyze trends that are not yet common in your region."},
        effects:{gameSense:4},
      },
      {
        id:"masters1-respect-study-mechanics",
        label:{es:"Comparar tus mecánicas con la élite",en:"Compare your mechanics with the elite"},
        description:{es:"Quieres reducir la diferencia en velocidad y precisión.",en:"Want to reduce any gap in speed and precision."},
        effects:{aim:3,consistency:1},
      },
      {
        id:"masters1-respect-study-routine",
        label:{es:"Conservar lo que funcionó",en:"Keep what worked"},
        description:{es:"Prefieres regresar sin alterar demasiado tu preparación.",en:"Prefer returning without changing your preparation too much."},
        effects:{consistency:3,mental:1},
      },
    ],
  },

  {
    id:"masters1-respect-confidence",
    eyebrow:{es:"DE VUELTA A CASA",en:"BACK HOME"},
    title:{es:"Ahora sabes que puedes competir internacionalmente",en:"Now you know you can compete internationally"},
    description:{es:"El resultado no fue perfecto, pero enfrentarte a la élite elimina muchas dudas sobre tu propio nivel.",en:"The result wasn't perfect, but facing elite competition removes many doubts about your own level."},
    choices:[
      {
        id:"masters1-respect-confidence-mental",
        label:{es:"Convertirlo en confianza",en:"Turn it into confidence"},
        description:{es:"Llegas a Stage 1 convencido de que puedes competir con cualquiera.",en:"Enter Stage 1 convinced you can compete with anyone."},
        effects:{mental:4},
      },
      {
        id:"masters1-respect-confidence-discipline",
        label:{es:"No confiarte",en:"Avoid complacency"},
        description:{es:"Usas la experiencia como motivación para ser aún más estable.",en:"Use the experience as motivation to become even more stable."},
        effects:{consistency:3,mental:1},
      },
      {
        id:"masters1-respect-confidence-clutch",
        label:{es:"Revisar las rondas cerradas",en:"Review the close rounds"},
        description:{es:"Crees que ahí estuvo la diferencia entre competir y ganar.",en:"Believe that was the difference between competing and winning."},
        effects:{clutch:2,gameSense:2},
      },
    ],
  },

  {
    id:"masters1-elimination-learn",
    eyebrow:{es:"REGRESO A CASA",en:"BACK HOME"},
    title:{es:"Masters expone debilidades que en tu región no aparecían",en:"Masters exposes weaknesses that didn't appear regionally"},
    description:{es:"El ritmo internacional castiga errores que antes sobrevivían. Tienes que decidir qué corregir primero.",en:"International play punishes mistakes that previously went unpunished. You have to decide what to fix first."},
    choices:[
      {
        id:"masters1-elimination-learn-vods",
        label:{es:"Analizar por qué morías",en:"Analyze why you were dying"},
        description:{es:"Buscas errores de posición, lectura y timing.",en:"Look for positioning, reading and timing errors."},
        effects:{gameSense:4},
      },
      {
        id:"masters1-elimination-learn-aim",
        label:{es:"Mejorar velocidad de duelo",en:"Improve duel speed"},
        description:{es:"Sentiste que algunos enfrentamientos se resolvían demasiado rápido.",en:"Felt some fights were being decided too quickly."},
        effects:{aim:3,mental:-1},
      },
      {
        id:"masters1-elimination-learn-reset",
        label:{es:"Proteger la confianza",en:"Protect your confidence"},
        description:{es:"No quieres que un torneo defina cómo te ves como jugador.",en:"Don't want one event defining how you see yourself as a player."},
        effects:{mental:4,consistency:1},
      },
    ],
  },

  {
    id:"masters1-elimination-grind",
    eyebrow:{es:"SESIÓN EXTRA",en:"EXTRA SESSION"},
    title:{es:"La eliminación te deja con ganas de volver al servidor",en:"Elimination leaves you wanting to get back on the server"},
    description:{es:"Apenas vuelves del torneo ya estás pensando en qué trabajar antes de Stage 1.",en:"As soon as you return from the event you're already thinking about what to work on before Stage 1."},
    choices:[
      {
        id:"masters1-elimination-grind-aim",
        label:{es:"Entrenar puntería",en:"Train aim"},
        description:{es:"Quieres convertir la frustración en precisión.",en:"Want to turn frustration into precision."},
        effects:{aim:3,consistency:1,mental:-1},
      },
      {
        id:"masters1-elimination-grind-comms",
        label:{es:"Trabajar calls",en:"Work on calls"},
        description:{es:"Notas que bajo presión el equipo compartió menos información.",en:"Notice the team shared less information under pressure."},
        effects:{communication:3,mental:1},
      },
      {
        id:"masters1-elimination-grind-rest",
        label:{es:"Tomarte un descanso corto",en:"Take a short break"},
        description:{es:"Prefieres recuperar energía antes de volver a entrenar.",en:"Prefer recovering energy before returning to practice."},
        effects:{mental:4,consistency:-1},
      },
    ],
  },

  {
    id:"stage1-hot-streak-routine",
    eyebrow:{es:"RACHA POSITIVA",en:"HOT STREAK"},
    title:{es:"Las victorias empiezan a sentirse normales",en:"Winning starts to feel normal"},
    description:{es:"El equipo encadena buenos resultados y aparece el riesgo de entrar en piloto automático.",en:"The team strings together strong results and risks slipping into autopilot."},
    choices:[
      {
        id:"stage1-hot-streak-routine-maintain",
        label:{es:"Mantener la disciplina",en:"Maintain discipline"},
        description:{es:"Sigues preparando cada rival exactamente igual.",en:"Keep preparing for every opponent exactly the same way."},
        effects:{consistency:4},
      },
      {
        id:"stage1-hot-streak-routine-experiment",
        label:{es:"Experimentar nuevas ideas",en:"Experiment with new ideas"},
        description:{es:"Aprovechas la ventaja para ampliar el repertorio.",en:"Use the advantage to expand the team's repertoire."},
        effects:{gameSense:2,communication:2,consistency:-1},
      },
      {
        id:"stage1-hot-streak-routine-confidence",
        label:{es:"Jugar con más confianza",en:"Play with more confidence"},
        description:{es:"Empiezas a tomar duelos que antes evitabas.",en:"Start taking duels you previously avoided."},
        effects:{aim:2,mental:2},
      },
    ],
  },

  {
    id:"stage1-hot-streak-leadership",
    eyebrow:{es:"EN CONTROL",en:"IN CONTROL"},
    title:{es:"El equipo empieza a depender más de tus decisiones",en:"The team starts relying more on your decisions"},
    description:{es:"Con los buenos resultados, tus compañeros comienzan a escuchar más tus lecturas durante las rondas.",en:"With strong results, teammates begin listening more to your reads during rounds."},
    choices:[
      {
        id:"stage1-hot-streak-leadership-call",
        label:{es:"Hablar más",en:"Speak more"},
        description:{es:"Aumentas tu participación en calls y adaptaciones.",en:"Increase your involvement in calls and adaptations."},
        effects:{communication:3,gameSense:1},
      },
      {
        id:"stage1-hot-streak-leadership-focus",
        label:{es:"Seguir concentrado en tu rol",en:"Stay focused on your role"},
        description:{es:"No quieres agregar responsabilidades innecesarias.",en:"Don't want to add unnecessary responsibilities."},
        effects:{consistency:3},
      },
      {
        id:"stage1-hot-streak-leadership-clutch",
        label:{es:"Tomar responsabilidad en rondas cerradas",en:"Take responsibility in close rounds"},
        description:{es:"Prefieres tener la última palabra cuando quedan pocos segundos.",en:"Prefer having the final say when only a few seconds remain."},
        effects:{clutch:2,communication:2},
      },
    ],
  },

  {
    id:"stage1-pressure-preparation",
    eyebrow:{es:"MARGEN ESTRECHO",en:"FINE MARGINS"},
    title:{es:"Cada partido puede decidir quién llega a playoffs",en:"Every match could decide who reaches playoffs"},
    description:{es:"La tabla está tan apretada que el equipo comienza a revisar hasta los detalles más pequeños.",en:"The standings are so tight that the team starts reviewing even the smallest details."},
    choices:[
      {
        id:"stage1-pressure-preparation-vods",
        label:{es:"Estudiar más al rival",en:"Study the opponent more"},
        description:{es:"Quieres llegar con respuestas preparadas para sus tendencias.",en:"Want to arrive with prepared answers to their tendencies."},
        effects:{gameSense:3,mental:-1},
      },
      {
        id:"stage1-pressure-preparation-routine",
        label:{es:"No sobrepreparar",en:"Avoid overpreparing"},
        description:{es:"Prefieres confiar en automatismos que ya funcionan.",en:"Prefer trusting automatisms that already work."},
        effects:{consistency:3,mental:1},
      },
      {
        id:"stage1-pressure-preparation-comms",
        label:{es:"Preparar protocolos de emergencia",en:"Prepare emergency protocols"},
        description:{es:"Definen calls simples para rondas caóticas.",en:"Define simple calls for chaotic rounds."},
        effects:{communication:3,clutch:1},
      },
    ],
  },

  {
    id:"stage1-pressure-clutch",
    eyebrow:{es:"PARTIDOS DECISIVOS",en:"DECIDING MATCHES"},
    title:{es:"Las últimas rondas están decidiendo demasiados mapas",en:"Late rounds are deciding too many maps"},
    description:{es:"El staff prepara una sesión especial para situaciones en las que cualquier segundo puede cambiar el resultado.",en:"The staff prepares a special session for situations where any second could change the outcome."},
    choices:[
      {
        id:"stage1-pressure-clutch-defuse",
        label:{es:"Practicar desactivaciones límite",en:"Practice last-second defuses"},
        description:{es:"Entrenas el timing exacto necesario para mantener la calma con la Spike a punto de explotar.",en:"Train the exact timing needed to stay calm with the Spike about to explode."},
        effects:{clutch:3,mental:1},
      },
      {
        id:"stage1-pressure-clutch-calls",
        label:{es:"Entrenar calls en post-plant",en:"Train post-plant calls"},
        description:{es:"Quieres que todos sepan qué información importa cuando quedan pocos segundos.",en:"Want everyone to know what information matters when only a few seconds remain."},
        effects:{communication:3,clutch:1},
      },
      {
        id:"stage1-pressure-clutch-calm",
        label:{es:"Trabajar control mental",en:"Work on mental control"},
        description:{es:"Practicas reducir el ritmo cuando la presión aumenta.",en:"Practice slowing yourself down when pressure rises."},
        effects:{mental:3,clutch:1},
      },
    ],
  },

  {
    id:"stage1-slump-reset",
    eyebrow:{es:"MOMENTO DIFÍCIL",en:"ROUGH PATCH"},
    title:{es:"Las derrotas empiezan a afectar los entrenamientos",en:"Losses begin affecting practice"},
    description:{es:"El equipo entra en su primera mala racha seria. Cada error parece generar otro.",en:"The team enters its first serious slump. Every mistake seems to create another."},
    choices:[
      {
        id:"stage1-slump-reset-break",
        label:{es:"Tomarte un día libre",en:"Take a day off"},
        description:{es:"Quieres volver con la cabeza despejada.",en:"Want to return with a clear head."},
        effects:{mental:4,consistency:-1},
      },
      {
        id:"stage1-slump-reset-grind",
        label:{es:"Entrenar más",en:"Practice more"},
        description:{es:"Crees que recuperar confianza requiere volver a ganar duelos.",en:"Believe regaining confidence requires winning duels again."},
        effects:{aim:2,consistency:2,mental:-1},
      },
      {
        id:"stage1-slump-reset-talk",
        label:{es:"Hablar de los problemas",en:"Talk about the problems"},
        description:{es:"Quieres evitar que pequeños errores de comunicación sigan acumulándose.",en:"Want to stop small communication errors from continuing to pile up."},
        effects:{communication:3,mental:1},
      },
    ],
  },

  {
    id:"stage1-slump-analysis",
    eyebrow:{es:"BUSCANDO RESPUESTAS",en:"LOOKING FOR ANSWERS"},
    title:{es:"El staff intenta encontrar el origen de la mala racha",en:"The staff tries to find the source of the slump"},
    description:{es:"Las estadísticas no muestran un solo problema claro. Hay errores mecánicos, malas lecturas y decisiones apresuradas.",en:"The stats don't reveal one obvious problem. There are mechanical mistakes, poor reads and rushed decisions."},
    choices:[
      {
        id:"stage1-slump-analysis-mechanics",
        label:{es:"Volver a lo mecánico",en:"Return to mechanics"},
        description:{es:"Prefieres eliminar primero los errores individuales más simples.",en:"Prefer eliminating the simplest individual errors first."},
        effects:{aim:3,gameSense:-1},
      },
      {
        id:"stage1-slump-analysis-vods",
        label:{es:"Buscar patrones en las derrotas",en:"Find patterns in the losses"},
        description:{es:"Analizas qué decisiones se repiten cuando las rondas se complican.",en:"Analyze which decisions repeat when rounds become difficult."},
        effects:{gameSense:3,consistency:1},
      },
      {
        id:"stage1-slump-analysis-stability",
        label:{es:"Simplificar tu juego",en:"Simplify your game"},
        description:{es:"Quieres recuperar un nivel estable antes de volver a experimentar.",en:"Want to recover stable performance before experimenting again."},
        effects:{consistency:4,gameSense:-1},
      },
    ],
  },

  {
    id:"stage1-playoffs-success-clutch",
    eyebrow:{es:"PLAYOFFS",en:"PLAYOFFS"},
    title:{es:"Masters está a una serie de distancia",en:"Masters is one series away"},
    description:{es:"Los próximos mapas serán los más importantes de Stage 1. El staff ofrece distintas formas de preparar la presión.",en:"The next maps will be the most important of Stage 1. The staff offers different ways to prepare for the pressure."},
    choices:[
      {
        id:"stage1-playoffs-success-clutch-drill",
        label:{es:"Entrenar situaciones clutch",en:"Practice clutch situations"},
        description:{es:"Practicas desactivaciones y decisiones con el reloj al límite.",en:"Practice defuses and decisions with the clock running out."},
        effects:{clutch:3,mental:1},
      },
      {
        id:"stage1-playoffs-success-clutch-routine",
        label:{es:"Mantener la rutina",en:"Keep the routine"},
        description:{es:"No quieres que la importancia del partido cambie tu preparación.",en:"Don't want the importance of the match changing your preparation."},
        effects:{consistency:4},
      },
      {
        id:"stage1-playoffs-success-clutch-vods",
        label:{es:"Preparar cada escenario",en:"Prepare every scenario"},
        description:{es:"Estudias mapas y tendencias del rival hasta el último detalle.",en:"Study opponent maps and tendencies down to the smallest detail."},
        effects:{gameSense:3,mental:-1},
      },
    ],
  },

  {
    id:"stage1-playoffs-success-comms",
    eyebrow:{es:"UN PASO DE MASTERS",en:"ONE STEP FROM MASTERS"},
    title:{es:"El coach quiere evitar confusión en las rondas importantes",en:"The coach wants to avoid confusion in important rounds"},
    description:{es:"Cuando la presión aumenta, las calls pueden llenarse de información innecesaria. El equipo quiere decidir cómo manejarlo.",en:"When pressure rises, calls can become overloaded with unnecessary information. The team wants to decide how to handle it."},
    choices:[
      {
        id:"stage1-playoffs-success-comms-simple",
        label:{es:"Simplificar las calls",en:"Simplify calls"},
        description:{es:"Priorizas información corta y accionable.",en:"Prioritize short and actionable information."},
        effects:{communication:4},
      },
      {
        id:"stage1-playoffs-success-comms-read",
        label:{es:"Dar más libertad a las lecturas",en:"Allow more individual reads"},
        description:{es:"Confías en que cada jugador reconozca cuándo romper el plan.",en:"Trust each player to recognize when to break the plan."},
        effects:{gameSense:3,communication:-1},
      },
      {
        id:"stage1-playoffs-success-comms-calm",
        label:{es:"Priorizar la calma",en:"Prioritize calm"},
        description:{es:"Quieres evitar que una mala ronda arrastre a la siguiente.",en:"Want to prevent one bad round from carrying into the next."},
        effects:{mental:3,consistency:1},
      },
    ],
  },

  {
    id:"stage1-playoffs-heartbreak-review",
    eyebrow:{es:"OPORTUNIDAD PERDIDA",en:"MISSED OPPORTUNITY"},
    title:{es:"Masters se escapó por muy poco",en:"Masters slipped away by the smallest margin"},
    description:{es:"La eliminación duele especialmente porque varias rondas pudieron cambiar la serie.",en:"The elimination hurts especially because several rounds could have changed the series."},
    choices:[
      {
        id:"stage1-playoffs-heartbreak-review-everything",
        label:{es:"Revisar cada ronda cerrada",en:"Review every close round"},
        description:{es:"Buscas exactamente dónde se perdió el control.",en:"Look for exactly where control was lost."},
        effects:{gameSense:3,clutch:1},
      },
      {
        id:"stage1-playoffs-heartbreak-review-mental",
        label:{es:"Trabajar la reacción a los errores",en:"Work on your response to mistakes"},
        description:{es:"Notas que una ronda perdida afectaba demasiado a la siguiente.",en:"Notice that losing one round affected the next too much."},
        effects:{mental:3,consistency:1},
      },
      {
        id:"stage1-playoffs-heartbreak-review-aim",
        label:{es:"Usar la frustración para entrenar",en:"Use frustration to train"},
        description:{es:"Quieres volver a Stage 2 ganando más duelos individuales.",en:"Want to return in Stage 2 winning more individual duels."},
        effects:{aim:3,mental:-1},
      },
    ],
  },

  {
    id:"stage1-playoffs-heartbreak-reset",
    eyebrow:{es:"DESPUÉS DEL GOLPE",en:"AFTER THE HIT"},
    title:{es:"El roster tiene que recuperar confianza antes de Stage 2",en:"The roster needs to rebuild confidence before Stage 2"},
    description:{es:"Quedar tan cerca de Masters deja al equipo emocionalmente agotado.",en:"Coming so close to Masters leaves the team emotionally drained."},
    choices:[
      {
        id:"stage1-playoffs-heartbreak-reset-rest",
        label:{es:"Desconectarte unos días",en:"Disconnect for a few days"},
        description:{es:"Prefieres volver con energía antes de comenzar Stage 2.",en:"Prefer returning with energy before Stage 2 begins."},
        effects:{mental:4,consistency:-1},
      },
      {
        id:"stage1-playoffs-heartbreak-reset-routine",
        label:{es:"Volver inmediatamente a la rutina",en:"Return immediately to routine"},
        description:{es:"La estabilidad te ayuda a dejar atrás la derrota.",en:"Stability helps you move on from the loss."},
        effects:{consistency:4},
      },
      {
        id:"stage1-playoffs-heartbreak-reset-team",
        label:{es:"Hablar más durante los entrenamientos",en:"Talk more during practice"},
        description:{es:"Quieres que la frustración no se convierta en silencio.",en:"Want to prevent frustration from turning into silence."},
        effects:{communication:3,mental:1},
      },
    ],
  },

  {
    id:"masters2-deep-run-meta",
    eyebrow:{es:"ÉLITE MUNDIAL",en:"WORLD ELITE"},
    title:{es:"El torneo demuestra que ya puedes competir contra cualquier estilo",en:"The event proves you can compete against any style"},
    description:{es:"Una buena actuación internacional te permite analizar tu juego desde otro nivel. Ahora la pregunta es cómo seguir evolucionando.",en:"A strong international performance lets you analyze your game from another level. The question now is how to keep evolving."},
    choices:[
      {
        id:"masters2-deep-run-meta-study",
        label:{es:"Profundizar en el meta",en:"Dive deeper into the meta"},
        description:{es:"Quieres comprender por qué ciertas decisiones funcionan antes de copiarlas.",en:"Want to understand why certain decisions work before copying them."},
        effects:{gameSense:4},
      },
      {
        id:"masters2-deep-run-meta-mechanics",
        label:{es:"Seguir elevando tus mecánicas",en:"Keep raising your mechanics"},
        description:{es:"No quieres depender únicamente de la preparación.",en:"Don't want to rely only on preparation."},
        effects:{aim:3,consistency:1},
      },
      {
        id:"masters2-deep-run-meta-balance",
        label:{es:"Priorizar estabilidad",en:"Prioritize stability"},
        description:{es:"Tu objetivo es repetir este nivel torneo tras torneo.",en:"Your goal is repeating this level event after event."},
        effects:{consistency:4},
      },
    ],
  },

  {
    id:"masters2-deep-run-pressure",
    eyebrow:{es:"PARTIDOS DE ÉLITE",en:"ELITE MATCHES"},
    title:{es:"Las rondas importantes empiezan a sentirse más lentas",en:"Important rounds start feeling slower"},
    description:{es:"Con más experiencia internacional, comienzas a reconocer mejor los momentos donde una sola decisión define el mapa.",en:"With more international experience, you begin recognizing the moments where one decision defines the map."},
    choices:[
      {
        id:"masters2-deep-run-pressure-clutch",
        label:{es:"Abrazar esos momentos",en:"Embrace those moments"},
        description:{es:"Quieres ser quien tome la responsabilidad en rondas decisivas.",en:"Want to be the player taking responsibility in deciding rounds."},
        effects:{clutch:3,mental:1},
      },
      {
        id:"masters2-deep-run-pressure-read",
        label:{es:"Leer antes de actuar",en:"Read before acting"},
        description:{es:"Buscas identificar mejor cuándo esperar y cuándo forzar.",en:"Try to better identify when to wait and when to force."},
        effects:{gameSense:3,clutch:1},
      },
      {
        id:"masters2-deep-run-pressure-calm",
        label:{es:"Mantener el pulso estable",en:"Keep your nerves steady"},
        description:{es:"Trabajas para que la importancia de la ronda no cambie tu ejecución.",en:"Work so the importance of the round doesn't change your execution."},
        effects:{mental:3,consistency:1},
      },
    ],
  },

  {
    id:"masters2-elimination-study",
    eyebrow:{es:"LECCIÓN INTERNACIONAL",en:"INTERNATIONAL LESSON"},
    title:{es:"Masters termina antes de lo esperado",en:"Masters ends earlier than expected"},
    description:{es:"La eliminación llega en un momento importante de la temporada. Hay poco tiempo para corregir antes de Stage 2.",en:"Elimination arrives at an important point in the season. There is little time to fix things before Stage 2."},
    choices:[
      {
        id:"masters2-elimination-study-meta",
        label:{es:"Estudiar las adaptaciones rivales",en:"Study opponent adaptations"},
        description:{es:"Quieres entender cómo lograron neutralizar tus mejores ideas.",en:"Want to understand how they neutralized your best ideas."},
        effects:{gameSense:4},
      },
      {
        id:"masters2-elimination-study-comms",
        label:{es:"Revisar comunicación",en:"Review communication"},
        description:{es:"Algunas respuestas llegaron demasiado tarde.",en:"Some responses came too late."},
        effects:{communication:3,consistency:1},
      },
      {
        id:"masters2-elimination-study-reset",
        label:{es:"Recuperar energía",en:"Recover energy"},
        description:{es:"Prefieres llegar mentalmente fresco a Stage 2.",en:"Prefer arriving mentally fresh for Stage 2."},
        effects:{mental:4,consistency:-1},
      },
    ],
  },

  {
    id:"masters2-elimination-mechanics",
    eyebrow:{es:"VOLVER A TRABAJAR",en:"BACK TO WORK"},
    title:{es:"Los duelos internacionales dejan tareas pendientes",en:"International duels leave unfinished business"},
    description:{es:"El torneo mostró situaciones donde tus mecánicas no fueron suficientes para compensar una mala posición.",en:"The event showed situations where mechanics were not enough to compensate for poor positioning."},
    choices:[
      {
        id:"masters2-elimination-mechanics-aim",
        label:{es:"Pulir aim",en:"Polish aim"},
        description:{es:"Quieres sentirte más cómodo ganando duelos difíciles.",en:"Want to feel more comfortable winning difficult duels."},
        effects:{aim:3,consistency:1},
      },
      {
        id:"masters2-elimination-mechanics-position",
        label:{es:"Corregir posicionamiento",en:"Fix positioning"},
        description:{es:"Prefieres evitar depender de disparos imposibles.",en:"Prefer avoiding situations where you need impossible shots."},
        effects:{gameSense:3,consistency:1},
      },
      {
        id:"masters2-elimination-mechanics-mental",
        label:{es:"Evitar perseguir errores",en:"Stop chasing mistakes"},
        description:{es:"Trabajas en no intentar compensar una mala ronda con una jugada desesperada.",en:"Work on not trying to compensate for a bad round with a desperate play."},
        effects:{mental:3,gameSense:1},
      },
    ],
  },

  {
    id:"stage2-title-race-focus",
    eyebrow:{es:"RECTA FINAL",en:"FINAL STRETCH"},
    title:{es:"Champions empieza a sentirse cerca",en:"Champions starts feeling close"},
    description:{es:"Cada victoria acerca al equipo al torneo más importante del año. La presión aumenta con cada jornada.",en:"Every win brings the team closer to the biggest tournament of the year. Pressure rises with every matchday."},
    choices:[
      {
        id:"stage2-title-race-focus-routine",
        label:{es:"Pensar solo en el próximo partido",en:"Think only about the next match"},
        description:{es:"Evitas mirar demasiado lejos.",en:"Avoid looking too far ahead."},
        effects:{consistency:4},
      },
      {
        id:"stage2-title-race-focus-motivation",
        label:{es:"Usar Champions como motivación",en:"Use Champions as motivation"},
        description:{es:"Te recuerdas constantemente qué está en juego.",en:"Constantly remind yourself what is at stake."},
        effects:{mental:3,clutch:1},
      },
      {
        id:"stage2-title-race-focus-study",
        label:{es:"Preparar cada rival a fondo",en:"Prepare deeply for every opponent"},
        description:{es:"No quieres dejar nada al azar.",en:"Don't want to leave anything to chance."},
        effects:{gameSense:3,mental:-1},
      },
    ],
  },

  {
    id:"stage2-title-race-leadership",
    eyebrow:{es:"SEMANA DECISIVA",en:"DECISIVE WEEK"},
    title:{es:"El roster necesita claridad bajo presión",en:"The roster needs clarity under pressure"},
    description:{es:"Las conversaciones se vuelven más tensas a medida que la clasificación se acerca. El equipo necesita decidir cómo manejarlo.",en:"Conversations become more tense as qualification gets closer. The team needs to decide how to handle it."},
    choices:[
      {
        id:"stage2-title-race-leadership-talk",
        label:{es:"Hablar más durante las rondas",en:"Talk more during rounds"},
        description:{es:"Intentas mantener al equipo coordinado incluso cuando algo sale mal.",en:"Try keeping the team coordinated even when something goes wrong."},
        effects:{communication:4},
      },
      {
        id:"stage2-title-race-leadership-calm",
        label:{es:"Ser una presencia calmada",en:"Be a calming presence"},
        description:{es:"Evitas que la presión cambie el tono del equipo.",en:"Prevent pressure from changing the team's tone."},
        effects:{mental:3,communication:1},
      },
      {
        id:"stage2-title-race-leadership-focus",
        label:{es:"Concentrarte en ejecutar",en:"Focus on execution"},
        description:{es:"Prefieres aportar con un nivel estable antes que hablar más.",en:"Prefer contributing stable performance rather than talking more."},
        effects:{consistency:3,communication:-1},
      },
    ],
  },

  {
    id:"stage2-last-chance-clutch",
    eyebrow:{es:"ÚLTIMA OPORTUNIDAD",en:"LAST CHANCE"},
    title:{es:"Un solo mapa puede decidir si llegas a Champions",en:"One map could decide whether you reach Champions"},
    description:{es:"La temporada entera puede depender de unas pocas rondas. El staff prepara sesiones específicas para jugar bajo máxima presión.",en:"The entire season may depend on only a few rounds. The staff prepares specific sessions for maximum-pressure situations."},
    choices:[
      {
        id:"stage2-last-chance-clutch-defuse",
        label:{es:"Practicar desactivaciones límite",en:"Practice last-second defuses"},
        description:{es:"Entrenas el control necesario para actuar cuando ya casi no queda tiempo.",en:"Train the control required to act when almost no time remains."},
        effects:{clutch:3,mental:1},
      },
      {
        id:"stage2-last-chance-clutch-mental",
        label:{es:"Entrenar control mental",en:"Train mental control"},
        description:{es:"Quieres evitar que el resultado de una ronda cambie tu siguiente decisión.",en:"Want to prevent the result of one round changing your next decision."},
        effects:{mental:4},
      },
      {
        id:"stage2-last-chance-clutch-read",
        label:{es:"Estudiar escenarios tardíos",en:"Study late-round scenarios"},
        description:{es:"Analizas patrones comunes cuando quedan pocos jugadores vivos.",en:"Analyze common patterns when only a few players remain alive."},
        effects:{gameSense:2,clutch:2},
      },
    ],
  },

  {
    id:"stage2-last-chance-discipline",
    eyebrow:{es:"SIN MARGEN DE ERROR",en:"NO ROOM FOR ERROR"},
    title:{es:"El equipo discute si cambiar algo antes de la última semana",en:"The team debates whether to change anything before the final week"},
    description:{es:"Todos saben que experimentar puede ser peligroso, pero también que los rivales conocen bien sus tendencias.",en:"Everyone knows experimenting can be dangerous, but opponents also know your tendencies well."},
    choices:[
      {
        id:"stage2-last-chance-discipline-same",
        label:{es:"No cambiar nada",en:"Change nothing"},
        description:{es:"Confías en lo trabajado durante toda la temporada.",en:"Trust the work done throughout the season."},
        effects:{consistency:4},
      },
      {
        id:"stage2-last-chance-discipline-adapt",
        label:{es:"Preparar una sorpresa",en:"Prepare a surprise"},
        description:{es:"Añades una variante nueva para romper la preparación rival.",en:"Add a new variation to disrupt opponent preparation."},
        effects:{gameSense:3,consistency:-1},
      },
      {
        id:"stage2-last-chance-discipline-comms",
        label:{es:"Asegurar los protocolos",en:"Lock down protocols"},
        description:{es:"Prefieres que cada jugador sepa exactamente qué hacer si el plan inicial falla.",en:"Prefer every player knowing exactly what to do if the initial plan fails."},
        effects:{communication:3,consistency:1},
      },
    ],
  },

  {
    id:"stage2-qualified-preparation",
    eyebrow:{es:"DESTINO: CHAMPIONS",en:"DESTINATION: CHAMPIONS"},
    title:{es:"El boleto al mundial ya está asegurado",en:"The ticket to the world championship is secured"},
    description:{es:"La clasificación está lista. Ahora tienes que decidir qué mejorar antes del torneo más importante del año.",en:"Qualification is secured. Now you have to decide what to improve before the biggest tournament of the year."},
    choices:[
      {
        id:"stage2-qualified-preparation-rest",
        label:{es:"Recuperar energía",en:"Recover energy"},
        description:{es:"La temporada ha sido larga y quieres llegar fresco.",en:"The season has been long and you want to arrive fresh."},
        effects:{mental:4,consistency:-1},
      },
      {
        id:"stage2-qualified-preparation-study",
        label:{es:"Estudiar regiones internacionales",en:"Study international regions"},
        description:{es:"Empiezas a preparar posibles rivales desde ahora.",en:"Start preparing potential opponents immediately."},
        effects:{gameSense:3,mental:-1},
      },
      {
        id:"stage2-qualified-preparation-routine",
        label:{es:"Mantener el ritmo",en:"Maintain the rhythm"},
        description:{es:"No quieres perder la estabilidad construida durante Stage 2.",en:"Don't want to lose the stability built during Stage 2."},
        effects:{consistency:4},
      },
    ],
  },

  {
    id:"stage2-qualified-clutch",
    eyebrow:{es:"PREPARANDO CHAMPIONS",en:"PREPARING FOR CHAMPIONS"},
    title:{es:"El coach quiere trabajar las rondas de máxima presión",en:"The coach wants to work on maximum-pressure rounds"},
    description:{es:"En Champions habrá poco margen para regalar post-plants o situaciones numéricamente favorables.",en:"At Champions there will be little room to throw away post-plants or favorable-number situations."},
    choices:[
      {
        id:"stage2-qualified-clutch-drill",
        label:{es:"Entrenar clutch",en:"Train clutch"},
        description:{es:"Practicas escenarios donde una decisión tardía puede definir el mapa.",en:"Practice scenarios where one late decision can define the map."},
        effects:{clutch:3,mental:1},
      },
      {
        id:"stage2-qualified-clutch-comms",
        label:{es:"Preparar comunicación tardía",en:"Prepare late-round communication"},
        description:{es:"Reducen las calls a información crítica.",en:"Reduce calls to critical information."},
        effects:{communication:3,clutch:1},
      },
      {
        id:"stage2-qualified-clutch-read",
        label:{es:"Analizar post-plants",en:"Analyze post-plants"},
        description:{es:"Buscas comprender mejor qué opciones quedan disponibles en los últimos segundos.",en:"Try to better understand which options remain available in the final seconds."},
        effects:{gameSense:3,clutch:1},
      },
    ],
  },

  {
    id:"stage2-miss-reset",
    eyebrow:{es:"FIN DEL CAMINO",en:"END OF THE ROAD"},
    title:{es:"Champions se escapa en el último momento",en:"Champions slips away at the final moment"},
    description:{es:"La temporada termina antes de lo que querías. El golpe obliga a pensar qué necesitas mejorar durante la offseason.",en:"The season ends earlier than you wanted. The setback forces you to think about what needs improvement during the offseason."},
    choices:[
      {
        id:"stage2-miss-reset-mental",
        label:{es:"Recuperarte mentalmente",en:"Recover mentally"},
        description:{es:"No quieres llevar esta derrota a la próxima temporada.",en:"Don't want to carry this loss into next season."},
        effects:{mental:4},
      },
      {
        id:"stage2-miss-reset-study",
        label:{es:"Analizar por qué no alcanzó",en:"Analyze why it wasn't enough"},
        description:{es:"Revisas toda la temporada buscando errores repetidos.",en:"Review the entire season looking for repeated mistakes."},
        effects:{gameSense:3,consistency:1},
      },
      {
        id:"stage2-miss-reset-grind",
        label:{es:"Volver pronto a entrenar",en:"Return to practice quickly"},
        description:{es:"Quieres convertir la decepción en trabajo.",en:"Want to turn disappointment into work."},
        effects:{aim:2,consistency:2,mental:-1},
      },
    ],
  },

  {
    id:"stage2-miss-identity",
    eyebrow:{es:"OFFSEASON",en:"OFFSEASON"},
    title:{es:"La eliminación deja dudas sobre tu propio estilo",en:"Elimination leaves doubts about your own style"},
    description:{es:"Sin Champions por delante, tienes tiempo para decidir qué tipo de jugador quieres ser la próxima temporada.",en:"With no Champions ahead, you have time to decide what kind of player you want to be next season."},
    choices:[
      {
        id:"stage2-miss-identity-mechanical",
        label:{es:"Ser más dominante mecánicamente",en:"Become more mechanically dominant"},
        description:{es:"Quieres poder crear ventajas sin depender del sistema.",en:"Want to create advantages without depending on the system."},
        effects:{aim:3,communication:-1},
      },
      {
        id:"stage2-miss-identity-smart",
        label:{es:"Convertirte en un jugador más cerebral",en:"Become a smarter player"},
        description:{es:"Prefieres ganar más rondas con lectura y posicionamiento.",en:"Prefer winning more rounds through reads and positioning."},
        effects:{gameSense:3,aim:-1},
      },
      {
        id:"stage2-miss-identity-stable",
        label:{es:"Buscar mayor estabilidad",en:"Seek greater stability"},
        description:{es:"Tu prioridad es reducir los partidos malos.",en:"Your priority is reducing poor performances."},
        effects:{consistency:4},
      },
    ],
  },

  {
    id:"champions-winner-evolve",
    eyebrow:{es:"CAMPEÓN DEL MUNDO",en:"WORLD CHAMPION"},
    title:{es:"Ganar Champions cambia el estándar",en:"Winning Champions changes the standard"},
    description:{es:"Llegaste a la cima. El reto ahora es decidir qué hacer cuando ya demostraste que puedes ganar el torneo más importante del mundo.",en:"You reached the top. The challenge now is deciding what to do after proving you can win the biggest tournament in the world."},
    choices:[
      {
        id:"champions-winner-evolve-standard",
        label:{es:"Subir todavía más el estándar",en:"Raise the standard even higher"},
        description:{es:"Quieres que este nivel deje de ser excepcional.",en:"Want this level to stop being exceptional."},
        effects:{consistency:4,mental:2},
      },
      {
        id:"champions-winner-evolve-study",
        label:{es:"Revisar incluso las victorias",en:"Review even the wins"},
        description:{es:"Buscas errores que el resultado pudo ocultar.",en:"Look for mistakes the result may have hidden."},
        effects:{gameSense:3,mental:1},
      },
      {
        id:"champions-winner-evolve-clutch",
        label:{es:"Convertirte en referencia en momentos decisivos",en:"Become a reference in deciding moments"},
        description:{es:"Quieres seguir siendo quien resuelve las rondas de máxima presión.",en:"Want to remain the player who solves the highest-pressure rounds."},
        effects:{clutch:3,mental:2},
      },
    ],
  },

  {
    id:"champions-winner-reset",
    eyebrow:{es:"DESPUÉS DEL TÍTULO",en:"AFTER THE TITLE"},
    title:{es:"Después de meses de presión por fin puedes parar",en:"After months of pressure you can finally stop"},
    description:{es:"La temporada terminó con el mejor resultado posible, pero el desgaste acumulado es enorme.",en:"The season ended with the best possible result, but accumulated fatigue is enormous."},
    choices:[
      {
        id:"champions-winner-reset-rest",
        label:{es:"Desconectarte completamente",en:"Disconnect completely"},
        description:{es:"Te das espacio para recuperar energía antes de pensar en competir otra vez.",en:"Give yourself space to recover before thinking about competition again."},
        effects:{mental:5,consistency:-1},
      },
      {
        id:"champions-winner-reset-routine",
        label:{es:"Mantener una rutina ligera",en:"Keep a light routine"},
        description:{es:"No quieres perder completamente el ritmo.",en:"Don't want to lose your rhythm completely."},
        effects:{consistency:3,mental:2},
      },
      {
        id:"champions-winner-reset-learn",
        label:{es:"Guardar todo lo aprendido",en:"Preserve everything learned"},
        description:{es:"Documentas setups, decisiones y rutinas que funcionaron durante Champions.",en:"Document setups, decisions and routines that worked during Champions."},
        effects:{gameSense:3,consistency:1},
      },
    ],
  },

  {
    id:"champions-finalist-review",
    eyebrow:{es:"A UN PASO DE LA GLORIA",en:"ONE STEP FROM GLORY"},
    title:{es:"La final vuelve una y otra vez a tu cabeza",en:"The final keeps replaying in your mind"},
    description:{es:"Llegaste al último partido del año, pero el trofeo quedó del otro lado. Algunas rondas todavía parecen imposibles de olvidar.",en:"You reached the final match of the year, but the trophy went to the other side. Some rounds still feel impossible to forget."},
    choices:[
      {
        id:"champions-finalist-review-vods",
        label:{es:"Revisar la final completa",en:"Review the full final"},
        description:{es:"Quieres saber exactamente qué podrías haber hecho diferente.",en:"Want to know exactly what you could have done differently."},
        effects:{gameSense:3,mental:-1},
      },
      {
        id:"champions-finalist-review-pain",
        label:{es:"Usar el dolor como motivación",en:"Use the pain as motivation"},
        description:{es:"La derrota aumenta tu deseo de volver.",en:"The loss increases your desire to return."},
        effects:{mental:4,consistency:1},
      },
      {
        id:"champions-finalist-review-clutch",
        label:{es:"Analizar las rondas decisivas",en:"Analyze deciding rounds"},
        description:{es:"Te concentras únicamente en los momentos que realmente definieron la serie.",en:"Focus only on the moments that truly decided the series."},
        effects:{clutch:2,gameSense:2},
      },
    ],
  },

  {
    id:"champions-finalist-reset",
    eyebrow:{es:"TEMPORADA TERMINADA",en:"SEASON OVER"},
    title:{es:"El cuerpo y la cabeza sienten el peso de todo el año",en:"Your body and mind feel the weight of the entire year"},
    description:{es:"Después de llegar hasta la final, necesitas decidir cómo comenzar la offseason.",en:"After reaching the final, you need to decide how to begin the offseason."},
    choices:[
      {
        id:"champions-finalist-reset-break",
        label:{es:"Tomarte un descanso real",en:"Take a real break"},
        description:{es:"No quieres pensar en VALORANT durante unos días.",en:"Don't want to think about VALORANT for a few days."},
        effects:{mental:5,consistency:-1},
      },
      {
        id:"champions-finalist-reset-aim",
        label:{es:"Volver pronto al servidor",en:"Return to the server quickly"},
        description:{es:"La derrota te deja con demasiadas ganas de mejorar.",en:"The loss leaves you too motivated to improve."},
        effects:{aim:2,consistency:2,mental:-1},
      },
      {
        id:"champions-finalist-reset-stable",
        label:{es:"Diseñar una rutina de offseason",en:"Design an offseason routine"},
        description:{es:"Buscas progresar sin agotarte.",en:"Aim to improve without burning yourself out."},
        effects:{consistency:4,mental:1},
      },
    ],
  },

  {
    id:"champions-deep-run-growth",
    eyebrow:{es:"ENTRE LOS MEJORES",en:"AMONG THE BEST"},
    title:{es:"Champions confirma que perteneces a la élite",en:"Champions confirms you belong among the elite"},
    description:{es:"El título no llegó, pero competir hasta las etapas finales del mundial te muestra qué separa a los buenos equipos de los campeones.",en:"The title didn't come, but reaching the late stages of the world championship shows what separates good teams from champions."},
    choices:[
      {
        id:"champions-deep-run-growth-study",
        label:{es:"Estudiar esa diferencia",en:"Study that difference"},
        description:{es:"Quieres entender mejor las decisiones de los equipos que llegaron más lejos.",en:"Want to better understand the decisions of teams that went further."},
        effects:{gameSense:4},
      },
      {
        id:"champions-deep-run-growth-consistency",
        label:{es:"Volverte más estable",en:"Become more consistent"},
        description:{es:"Sientes que tu mejor nivel ya alcanza, pero no aparece todos los días.",en:"Feel your peak level is already enough, but it doesn't appear every day."},
        effects:{consistency:4},
      },
      {
        id:"champions-deep-run-growth-pressure",
        label:{es:"Mejorar bajo presión",en:"Improve under pressure"},
        description:{es:"Quieres jugar tus mejores rondas cuando más importan.",en:"Want to play your best rounds when they matter most."},
        effects:{clutch:2,mental:2},
      },
    ],
  },

  {
    id:"champions-deep-run-identity",
    eyebrow:{es:"MIRANDO HACIA ADELANTE",en:"LOOKING AHEAD"},
    title:{es:"El buen resultado abre una pregunta: ¿qué falta para ganar?",en:"The strong result raises one question: what is missing to win?"},
    description:{es:"La distancia con el título ya no parece enorme. Ahora se trata de encontrar el siguiente salto.",en:"The distance to the title no longer feels enormous. Now it's about finding the next jump."},
    choices:[
      {
        id:"champions-deep-run-identity-aim",
        label:{es:"Buscar más impacto individual",en:"Seek more individual impact"},
        description:{es:"Quieres generar más ventajas con mecánicas.",en:"Want to create more advantages through mechanics."},
        effects:{aim:3,communication:-1},
      },
      {
        id:"champions-deep-run-identity-brain",
        label:{es:"Leer mejor los partidos",en:"Read matches better"},
        description:{es:"Prefieres reducir la cantidad de rondas donde te sorprenden.",en:"Prefer reducing the number of rounds where you're caught off guard."},
        effects:{gameSense:3,aim:-1},
      },
      {
        id:"champions-deep-run-identity-team",
        label:{es:"Participar más en las decisiones",en:"Participate more in decisions"},
        description:{es:"Quieres aportar más información y dirección durante las rondas.",en:"Want to provide more information and direction during rounds."},
        effects:{communication:3,gameSense:1},
      },
    ],
  },

  {
    id:"champions-eliminated-reflect",
    eyebrow:{es:"FINAL DE TEMPORADA",en:"SEASON END"},
    title:{es:"El sueño mundial termina",en:"The world championship dream ends"},
    description:{es:"Champions cierra tu temporada. Ahora puedes analizar el año completo sin tener otro partido esperando.",en:"Champions closes your season. You can now analyze the entire year without another match waiting."},
    choices:[
      {
        id:"champions-eliminated-reflect-year",
        label:{es:"Revisar toda la temporada",en:"Review the entire season"},
        description:{es:"Buscas patrones que se repitieron desde Kickoff hasta Champions.",en:"Look for patterns repeated from Kickoff through Champions."},
        effects:{gameSense:3,consistency:1},
      },
      {
        id:"champions-eliminated-reflect-rest",
        label:{es:"Cerrar el año y descansar",en:"Close the year and rest"},
        description:{es:"Prefieres recuperar completamente la cabeza.",en:"Prefer fully recovering mentally."},
        effects:{mental:5,consistency:-1},
      },
      {
        id:"champions-eliminated-reflect-grind",
        label:{es:"Volver a entrenar pronto",en:"Return to training soon"},
        description:{es:"La eliminación te deja pensando en todos los duelos que podrías haber ganado.",en:"Elimination leaves you thinking about all the duels you could have won."},
        effects:{aim:3,mental:-1},
      },
    ],
  },

  {
    id:"champions-eliminated-rebuild",
    eyebrow:{es:"RECONSTRUIR",en:"REBUILD"},
    title:{es:"La offseason te permite reconstruir partes de tu juego",en:"The offseason lets you rebuild parts of your game"},
    description:{es:"Sin partidos oficiales por delante, puedes dedicar semanas completas a un área específica.",en:"With no official matches ahead, you can dedicate full weeks to one specific area."},
    choices:[
      {
        id:"champions-eliminated-rebuild-mechanics",
        label:{es:"Reconstruir mecánicas",en:"Rebuild mechanics"},
        description:{es:"Trabajas velocidad, precisión y control.",en:"Work on speed, precision and control."},
        effects:{aim:3,consistency:1},
      },
      {
        id:"champions-eliminated-rebuild-comms",
        label:{es:"Mejorar comunicación",en:"Improve communication"},
        description:{es:"Quieres convertir tus lecturas en información más útil para el equipo.",en:"Want to turn your reads into more useful information for the team."},
        effects:{communication:4},
      },
      {
        id:"champions-eliminated-rebuild-stability",
        label:{es:"Trabajar estabilidad",en:"Work on stability"},
        description:{es:"Tu prioridad es reducir la diferencia entre tus mejores y peores partidos.",en:"Your priority is reducing the gap between your best and worst matches."},
        effects:{consistency:4,aim:-1},
      },
    ],
  },
];

const EVENT_POOLS = {
  kickoffChampion:["kickoff-champion-routine","kickoff-champion-target"],
  kickoffFinal:["kickoff-final-review","kickoff-final-pressure"],
  kickoffSemifinal:["kickoff-semifinal-adjustment","kickoff-semifinal-comms"],
  kickoffEarly:["kickoff-collapse-mechanics","kickoff-collapse-system"],

  masters1Top:["masters1-breakout-adapt","masters1-breakout-pressure"],
  masters1Deep:["masters1-respect-study","masters1-respect-confidence"],
  masters1Early:["masters1-elimination-learn","masters1-elimination-grind"],

  stage1Hot:["stage1-hot-streak-routine","stage1-hot-streak-leadership"],
  stage1Pressure:["stage1-pressure-preparation","stage1-pressure-clutch"],
  stage1Slump:["stage1-slump-reset","stage1-slump-analysis"],

  stage1PlayoffsSuccess:["stage1-playoffs-success-clutch","stage1-playoffs-success-comms"],
  stage1PlayoffsFail:["stage1-playoffs-heartbreak-review","stage1-playoffs-heartbreak-reset"],

  masters2Deep:["masters2-deep-run-meta","masters2-deep-run-pressure"],
  masters2Early:["masters2-elimination-study","masters2-elimination-mechanics"],

  stage2Race:["stage2-title-race-focus","stage2-title-race-leadership"],
  stage2LastChance:["stage2-last-chance-clutch","stage2-last-chance-discipline"],

  stage2Qualified:["stage2-qualified-preparation","stage2-qualified-clutch"],
  stage2Miss:["stage2-miss-reset","stage2-miss-identity"],

  championsWinner:["champions-winner-evolve","champions-winner-reset"],
  championsFinalist:["champions-finalist-review","champions-finalist-reset"],
  championsDeep:["champions-deep-run-growth","champions-deep-run-identity"],
  championsExit:["champions-eliminated-reflect","champions-eliminated-rebuild"],
} as const;

export function getVCTNarrativeEvent(id?:string) {
  return VCT_NARRATIVE_EVENTS.find((event) => event.id === id);
}

export function getVCTNarrativeEventId(sourcePhase:PlayableVCTPhase,placement:number,nextPhase:VCTPhase) {
  if (sourcePhase === "Kickoff") {
    if (placement === 1) return randomItem(EVENT_POOLS.kickoffChampion);
    if (placement === 2) return randomItem(EVENT_POOLS.kickoffFinal);
    if (placement <= 4) return randomItem(EVENT_POOLS.kickoffSemifinal);
    return randomItem(EVENT_POOLS.kickoffEarly);
  }

  if (sourcePhase === "Masters 1") {
    if (placement <= 2) return randomItem(EVENT_POOLS.masters1Top);
    if (placement <= 4) return randomItem(EVENT_POOLS.masters1Deep);
    return randomItem(EVENT_POOLS.masters1Early);
  }

  if (sourcePhase === "Stage 1") {
    if (placement <= 2) return randomItem(EVENT_POOLS.stage1Hot);
    if (nextPhase === "Stage 1 Playoffs") return randomItem(EVENT_POOLS.stage1Pressure);
    return randomItem(EVENT_POOLS.stage1Slump);
  }

  if (sourcePhase === "Stage 1 Playoffs") {
    if (nextPhase === "Masters 2") return randomItem(EVENT_POOLS.stage1PlayoffsSuccess);
    return randomItem(EVENT_POOLS.stage1PlayoffsFail);
  }

  if (sourcePhase === "Masters 2") {
    if (placement <= 4) return randomItem(EVENT_POOLS.masters2Deep);
    return randomItem(EVENT_POOLS.masters2Early);
  }

  if (sourcePhase === "Stage 2") {
    if (nextPhase === "Stage 2 Playoffs") return randomItem(EVENT_POOLS.stage2Race);
    return randomItem(EVENT_POOLS.stage2LastChance);
  }

  if (sourcePhase === "Stage 2 Playoffs") {
    if (nextPhase === "Champions") return randomItem(EVENT_POOLS.stage2Qualified);
    return randomItem(EVENT_POOLS.stage2Miss);
  }

  if (sourcePhase === "Champions") {
    if (placement === 1) return randomItem(EVENT_POOLS.championsWinner);
    if (placement === 2) return randomItem(EVENT_POOLS.championsFinalist);
    if (placement <= 4) return randomItem(EVENT_POOLS.championsDeep);
    return randomItem(EVENT_POOLS.championsExit);
  }

  return undefined;
}