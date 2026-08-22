import type {CareerChoice,CareerEffects,CareerEvent} from "../types/career";

type CareerStatEffects = Pick<CareerEffects,"aim"|"gameSense"|"communication"|"clutch"|"consistency"|"mental"|"currentStage">;
type StatCareerChoice = Omit<CareerChoice,"effects"> & {effects:CareerStatEffects};
type StatCareerEvent = Omit<CareerEvent,"choices"> & {choices:StatCareerChoice[]};

const randomItem = <T,>(items:readonly T[]) => items[Math.floor(Math.random() * items.length)];

export const CAREER_START_EVENT_IDS = ["first-radiant-run","premier-roster-invite","ranked-igl-contact","open-qualifier-invite","high-elo-scrim"] as const;

export const CAREER_EVENTS:StatCareerEvent[] = [
  {
    id:"first-radiant-run",
    eyebrow:{es:"ASCENSO EN RANKED",en:"RANKED CLIMB"},
    title:{es:"ALCANZASTE RADIANT #87",en:"YOU REACHED RADIANT #87"},
    description:{es:"Tus últimas partidas empiezan a llamar la atención. Una organización amateur te invita a probar con un roster que disputará un clasificatorio abierto.",en:"Your recent matches are starting to attract attention. An amateur organization invites you to trial with a roster entering an open qualifier."},
    choices:[
      {
        id:"radiant-accept-trial",
        label:{es:"Aceptar la prueba",en:"Accept the trial"},
        description:{es:"Quieres comprobar si tu nivel de ranked puede trasladarse al competitivo.",en:"You want to find out whether your ranked level can translate into competitive play."},
        effects:{communication:1,mental:1,currentStage:"Amateur"},
        nextEventId:"first-team-practice",
      },
      {
        id:"radiant-keep-grinding",
        label:{es:"Seguir jugando ranked",en:"Keep grinding ranked"},
        description:{es:"Prefieres pulir tus mecánicas antes de entrar a un equipo.",en:"Prefer polishing your mechanics before joining a team."},
        effects:{aim:2,consistency:1},
        nextEventId:"ranked-pressure-week",
      },
      {
        id:"radiant-study-offer",
        label:{es:"Preguntar cómo juega el roster",en:"Ask how the roster plays"},
        description:{es:"Quieres entender roles, estructura y expectativas antes de decidir.",en:"Want to understand roles, structure and expectations before deciding."},
        effects:{gameSense:2,communication:1},
        nextEventId:"manager-conversation",
      },
      {
        id:"radiant-challenge-yourself",
        label:{es:"Aceptar y pedir jugar los scrims difíciles",en:"Accept and ask for the hardest scrims"},
        description:{es:"Quieres saber inmediatamente cómo respondes cuando el nivel sube.",en:"Want to immediately see how you respond when the level rises."},
        effects:{mental:2,clutch:1,currentStage:"Amateur"},
        nextEventId:"high-pressure-scrim",
      },
    ],
  },

  {
    id:"premier-roster-invite",
    eyebrow:{es:"MENSAJE INESPERADO",en:"UNEXPECTED MESSAGE"},
    title:{es:"UN ROSTER DE PREMIER TE QUIERE COMO QUINTO",en:"A PREMIER ROSTER WANTS YOU AS THEIR FIFTH"},
    description:{es:"Uno de tus antiguos compañeros de ranked está armando un equipo para competir. Dice que necesitan alguien con tus mecánicas para completar el roster.",en:"One of your old ranked teammates is building a competitive roster. They say they need someone with your mechanics to complete the lineup."},
    choices:[
      {
        id:"premier-join",
        label:{es:"Unirte al roster",en:"Join the roster"},
        description:{es:"Es una oportunidad sencilla para empezar a jugar con estructura.",en:"It's a simple opportunity to start playing within a structure."},
        effects:{communication:1,consistency:1,currentStage:"Amateur"},
        nextEventId:"first-team-practice",
      },
      {
        id:"premier-igl",
        label:{es:"Ofrecerte a ayudar con las calls",en:"Offer to help with calls"},
        description:{es:"Quieres participar activamente en las decisiones del equipo.",en:"Want to actively participate in team decisions."},
        effects:{communication:2,gameSense:1,currentStage:"Amateur"},
        nextEventId:"communication-drill",
      },
      {
        id:"premier-fragger",
        label:{es:"Pedir libertad para buscar duelos",en:"Ask for freedom to take duels"},
        description:{es:"Prefieres explotar tu fortaleza mecánica y dejar las calls a otros.",en:"Prefer exploiting your mechanical strength and leaving calls to others."},
        effects:{aim:2,communication:-1,currentStage:"Amateur"},
        nextEventId:"high-pressure-scrim",
      },
    ],
  },

  {
    id:"ranked-igl-contact",
    eyebrow:{es:"CONTACTO COMPETITIVO",en:"COMPETITIVE CONTACT"},
    title:{es:"UN IGL TE RECONOCE DE RANKED",en:"AN IGL RECOGNIZES YOU FROM RANKED"},
    description:{es:"Un jugador con experiencia amateur te escribe. Dice que has coincidido varias veces con él y que tus decisiones le llamaron la atención.",en:"An experienced amateur player messages you. You've played together several times and your decision-making caught their attention."},
    choices:[
      {
        id:"igl-ask-vods",
        label:{es:"Pedirle feedback de tus partidas",en:"Ask for feedback on your games"},
        description:{es:"Quieres saber qué está viendo un jugador con experiencia competitiva.",en:"Want to know what an experienced competitive player sees in your game."},
        effects:{gameSense:2,mental:1},
        nextEventId:"vod-review",
      },
      {
        id:"igl-join-scrim",
        label:{es:"Aceptar una sesión de scrims",en:"Accept a scrim session"},
        description:{es:"Prefieres demostrar tu nivel directamente en el servidor.",en:"Prefer proving your level directly on the server."},
        effects:{mental:2,currentStage:"Amateur"},
        nextEventId:"high-pressure-scrim",
      },
      {
        id:"igl-learn-comms",
        label:{es:"Preguntar cómo mejorar tus calls",en:"Ask how to improve your calls"},
        description:{es:"Ranked no exige el mismo nivel de comunicación que un roster organizado.",en:"Ranked doesn't require the same communication level as an organized roster."},
        effects:{communication:2,gameSense:1},
        nextEventId:"communication-drill",
      },
    ],
  },

  {
    id:"open-qualifier-invite",
    eyebrow:{es:"CLASIFICATORIO ABIERTO",en:"OPEN QUALIFIER"},
    title:{es:"TE OFRECEN UN CUPO PARA UN CLASIFICATORIO",en:"YOU'RE OFFERED A SPOT IN AN OPEN QUALIFIER"},
    description:{es:"Un roster pierde a uno de sus jugadores a pocos días del torneo. Necesitan un reemplazo y alguien recomendó tu nombre.",en:"A roster loses one of its players only days before the tournament. They need a replacement and someone recommended your name."},
    choices:[
      {
        id:"qualifier-invite-accept",
        label:{es:"Aceptar sin pensarlo",en:"Accept immediately"},
        description:{es:"Puede que no conozcas el sistema, pero quieres aprovechar la oportunidad.",en:"You may not know the system, but you want to take the opportunity."},
        effects:{mental:2,consistency:-1,currentStage:"Amateur"},
        nextEventId:"emergency-practice",
      },
      {
        id:"qualifier-invite-prep",
        label:{es:"Pedir una sesión de preparación",en:"Ask for a preparation session"},
        description:{es:"Antes de competir quieres entender cómo juega el equipo.",en:"Before competing you want to understand how the team plays."},
        effects:{gameSense:1,communication:1,currentStage:"Amateur"},
        nextEventId:"first-team-practice",
      },
      {
        id:"qualifier-invite-decline",
        label:{es:"Rechazar y seguir preparándote",en:"Decline and keep preparing"},
        description:{es:"No quieres entrar a un torneo sin sentirte listo.",en:"Don't want to enter a tournament without feeling ready."},
        effects:{consistency:1,mental:1},
        nextEventId:"ranked-pressure-week",
      },
    ],
  },

  {
    id:"high-elo-scrim",
    eyebrow:{es:"INVITACIÓN PRIVADA",en:"PRIVATE INVITE"},
    title:{es:"TE INVITAN A UN SCRIM DE ALTO NIVEL",en:"YOU'RE INVITED TO A HIGH-LEVEL SCRIM"},
    description:{es:"Un jugador de tu lista de amigos necesita un reemplazo para una sesión contra un equipo amateur fuerte. No es oficial, pero puede ser tu primera prueba real.",en:"A player on your friends list needs a substitute for a session against a strong amateur roster. It isn't official, but it could be your first real test."},
    choices:[
      {
        id:"high-elo-scrim-play",
        label:{es:"Entrar al servidor",en:"Join the server"},
        description:{es:"No quieres dejar pasar la oportunidad de medirte contra jugadores organizados.",en:"Don't want to miss the opportunity to test yourself against organized players."},
        effects:{mental:2,currentStage:"Amateur"},
        nextEventId:"high-pressure-scrim",
      },
      {
        id:"high-elo-scrim-observe",
        label:{es:"Pedir observar primero",en:"Ask to watch first"},
        description:{es:"Quieres entender cómo se mueve un equipo antes de entrar.",en:"Want to understand how a team moves before joining."},
        effects:{gameSense:2},
        nextEventId:"vod-review",
      },
      {
        id:"high-elo-scrim-comms",
        label:{es:"Preguntar las calls antes de jugar",en:"Ask for the calls before playing"},
        description:{es:"No quieres convertirte en un problema de coordinación.",en:"Don't want to become a coordination problem."},
        effects:{communication:2,consistency:1,currentStage:"Amateur"},
        nextEventId:"communication-drill",
      },
    ],
  },

  {
    id:"ranked-pressure-week",
    eyebrow:{es:"RANKED DE ALTO NIVEL",en:"HIGH ELO RANKED"},
    title:{es:"MANTENER RADIANT RESULTA MÁS DIFÍCIL QUE ALCANZARLO",en:"STAYING RADIANT IS HARDER THAN REACHING IT"},
    description:{es:"Una semana irregular empieza a poner a prueba tu confianza. Hay partidas donde dominas y otras donde todo parece salir mal.",en:"An inconsistent week starts testing your confidence. Some games you dominate while others feel completely out of control."},
    choices:[
      {
        id:"ranked-pressure-mechanics",
        label:{es:"Volver a trabajar mecánicas",en:"Return to mechanics"},
        description:{es:"Quieres recuperar confianza ganando duelos simples.",en:"Want to rebuild confidence by winning simple duels."},
        effects:{aim:2,mental:-1},
        nextEventId:"second-opportunity",
      },
      {
        id:"ranked-pressure-review",
        label:{es:"Revisar tus derrotas",en:"Review your losses"},
        description:{es:"Buscas decisiones que se repiten cuando empiezas a jugar mal.",en:"Look for decisions that repeat when you begin playing poorly."},
        effects:{gameSense:2,consistency:1},
        nextEventId:"vod-review",
      },
      {
        id:"ranked-pressure-stop",
        label:{es:"Cortar las sesiones cuando te frustras",en:"Stop sessions when frustrated"},
        description:{es:"Prefieres proteger tu cabeza antes de entrar en una racha peor.",en:"Prefer protecting your mental before entering a worse streak."},
        effects:{mental:2,consistency:1},
        nextEventId:"second-opportunity",
      },
    ],
  },

  {
    id:"manager-conversation",
    eyebrow:{es:"PRIMER CONTACTO",en:"FIRST CONTACT"},
    title:{es:"HABLAS CON EL MANAGER DEL ROSTER",en:"YOU TALK TO THE ROSTER MANAGER"},
    description:{es:"Te explican que el equipo todavía es pequeño, pero quieren competir seriamente. Antes de aceptarte quieren saber qué clase de jugador pretendes ser.",en:"They explain that the team is still small but wants to compete seriously. Before accepting you they want to know what kind of player you intend to become."},
    choices:[
      {
        id:"manager-adapt",
        label:{es:"Adaptarte a lo que necesite el equipo",en:"Adapt to what the team needs"},
        description:{es:"Tu prioridad es aprender cómo funciona un roster real.",en:"Your priority is learning how a real roster works."},
        effects:{communication:1,gameSense:1,currentStage:"Amateur"},
        nextEventId:"first-team-practice",
      },
      {
        id:"manager-impact",
        label:{es:"Buscar impacto individual",en:"Seek individual impact"},
        description:{es:"Crees que tu mayor valor está en crear ventajas mecánicas.",en:"Believe your greatest value is creating mechanical advantages."},
        effects:{aim:2,communication:-1,currentStage:"Amateur"},
        nextEventId:"high-pressure-scrim",
      },
      {
        id:"manager-study",
        label:{es:"Preguntar cómo toman decisiones",en:"Ask how they make decisions"},
        description:{es:"Quieres conocer el sistema antes de definir tu lugar dentro de él.",en:"Want to understand the system before defining your place within it."},
        effects:{gameSense:2,currentStage:"Amateur"},
        nextEventId:"tactical-meeting",
      },
    ],
  },

  {
    id:"first-team-practice",
    eyebrow:{es:"PRIMER SCRIM",en:"FIRST SCRIM"},
    title:{es:"TU PRIMER ENTRENAMIENTO EN EQUIPO",en:"YOUR FIRST TEAM PRACTICE"},
    description:{es:"La diferencia con ranked aparece inmediatamente. Hay protocolos, utilidad coordinada, timings y compañeros esperando que cumplas tu parte.",en:"The difference from ranked is immediate. There are protocols, coordinated utility, timings and teammates expecting you to do your part."},
    choices:[
      {
        id:"practice-listen",
        label:{es:"Escuchar al IGL",en:"Listen to the IGL"},
        description:{es:"Te concentras en ejecutar exactamente lo que pide la ronda.",en:"Focus on executing exactly what the round requires."},
        effects:{communication:1,consistency:1,gameSense:1},
        nextEventId:"team-feedback",
      },
      {
        id:"practice-duels",
        label:{es:"Buscar duelos",en:"Seek duels"},
        description:{es:"Quieres demostrar que tus mecánicas también funcionan en scrims.",en:"Want to prove your mechanics also work in scrims."},
        effects:{aim:2,consistency:-1},
        nextEventId:"team-feedback",
      },
      {
        id:"practice-read",
        label:{es:"Observar cómo reaccionan los rivales",en:"Watch how opponents react"},
        description:{es:"Te concentras en identificar patrones más que en buscar números.",en:"Focus on identifying patterns rather than chasing numbers."},
        effects:{gameSense:2,aim:-1},
        nextEventId:"vod-review",
      },
      {
        id:"practice-talk",
        label:{es:"Comunicar todo lo que ves",en:"Communicate everything you see"},
        description:{es:"Quieres convertirte rápidamente en una fuente confiable de información.",en:"Want to quickly become a reliable source of information."},
        effects:{communication:2,mental:1},
        nextEventId:"communication-drill",
      },
    ],
  },

  {
    id:"high-pressure-scrim",
    eyebrow:{es:"SCRIM INTENSO",en:"INTENSE SCRIM"},
    title:{es:"EL RIVAL CASTIGA CADA ERROR",en:"THE OPPONENT PUNISHES EVERY MISTAKE"},
    description:{es:"Por primera vez sientes que una mala decisión es castigada inmediatamente. El ritmo del partido no te deja demasiado tiempo para pensar.",en:"For the first time, every poor decision gets punished immediately. The pace of the match leaves little time to think."},
    choices:[
      {
        id:"pressure-scrim-fight",
        label:{es:"Responder con agresividad",en:"Answer with aggression"},
        description:{es:"Intentas recuperar el control ganando duelos.",en:"Try to regain control by winning duels."},
        effects:{aim:2,gameSense:-1},
        nextEventId:"team-feedback",
      },
      {
        id:"pressure-scrim-calm",
        label:{es:"Bajar el ritmo",en:"Slow down"},
        description:{es:"Te obligas a tomar mejores decisiones aunque pierdas velocidad.",en:"Force yourself to make better decisions even if it costs speed."},
        effects:{mental:1,gameSense:1},
        nextEventId:"team-feedback",
      },
      {
        id:"pressure-scrim-comms",
        label:{es:"Pedir más información",en:"Ask for more information"},
        description:{es:"Quieres evitar tomar decisiones aisladas.",en:"Want to avoid making isolated decisions."},
        effects:{communication:2,gameSense:1},
        nextEventId:"communication-drill",
      },
    ],
  },

  {
    id:"team-feedback",
    eyebrow:{es:"FEEDBACK",en:"FEEDBACK"},
    title:{es:"EL STAFF ANALIZA TU PRIMERA SESIÓN",en:"THE STAFF REVIEWS YOUR FIRST SESSION"},
    description:{es:"Ven potencial, pero también varias costumbres de ranked que tendrás que corregir si quieres competir seriamente.",en:"They see potential, but also several ranked habits you'll need to correct if you want to compete seriously."},
    choices:[
      {
        id:"feedback-accept",
        label:{es:"Tomar nota de todo",en:"Take notes on everything"},
        description:{es:"Intentas convertir cada crítica en algo concreto para trabajar.",en:"Try to turn every criticism into something concrete to work on."},
        effects:{consistency:2,mental:1},
        nextEventId:"qualifier-preparation",
      },
      {
        id:"feedback-discuss",
        label:{es:"Preguntar por qué",en:"Ask why"},
        description:{es:"No quieres memorizar instrucciones: quieres entenderlas.",en:"Don't want to memorize instructions: you want to understand them."},
        effects:{gameSense:2,communication:1},
        nextEventId:"tactical-meeting",
      },
      {
        id:"feedback-prove",
        label:{es:"Demostrarlo en el próximo scrim",en:"Prove it in the next scrim"},
        description:{es:"Prefieres responder jugando.",en:"Prefer answering through your play."},
        effects:{mental:2,aim:1},
        nextEventId:"qualifier-preparation",
      },
    ],
  },

  {
    id:"communication-drill",
    eyebrow:{es:"COMUNICACIÓN",en:"COMMUNICATION"},
    title:{es:"LAS CALLS SON MÁS DIFÍCILES DE LO QUE PARECÍAN",en:"CALLS ARE HARDER THAN THEY LOOK"},
    description:{es:"El coach reproduce varias rondas donde había suficiente información para ganar, pero nadie logró ordenarla a tiempo.",en:"The coach replays several rounds where there was enough information to win, but nobody organized it in time."},
    choices:[
      {
        id:"communication-short",
        label:{es:"Hacer calls más cortas",en:"Make shorter calls"},
        description:{es:"Quieres que cada palabra ayude a tomar una decisión.",en:"Want every word to help make a decision."},
        effects:{communication:2},
        nextEventId:"qualifier-preparation",
      },
      {
        id:"communication-read",
        label:{es:"Explicar también tu lectura",en:"Explain your read too"},
        description:{es:"Además de datos, intentas comunicar qué crees que hará el rival.",en:"Along with raw information, try communicating what you think the opponent will do."},
        effects:{communication:1,gameSense:1},
        nextEventId:"tactical-meeting",
      },
      {
        id:"communication-focus",
        label:{es:"Hablar menos para concentrarte",en:"Talk less to focus"},
        description:{es:"Reducir tus calls puede ayudarte a ejecutar mejor, aunque aportes menos información.",en:"Reducing your calls may help execution even if you provide less information."},
        effects:{consistency:1,communication:-1,aim:1},
        nextEventId:"qualifier-preparation",
      },
    ],
  },

  {
    id:"vod-review",
    eyebrow:{es:"SALA DE ANÁLISIS",en:"VOD ROOM"},
    title:{es:"VES TUS PARTIDAS DESDE OTRA PERSPECTIVA",en:"YOU SEE YOUR GAMES FROM A DIFFERENT PERSPECTIVE"},
    description:{es:"Sin la presión de estar jugando, algunas decisiones que parecían correctas empiezan a verse mucho más claras.",en:"Without the pressure of actually playing, some decisions that felt correct start looking much clearer."},
    choices:[
      {
        id:"vod-positioning",
        label:{es:"Revisar posicionamiento",en:"Review positioning"},
        description:{es:"Quieres dejar de depender de ganar duelos difíciles.",en:"Want to stop depending on winning difficult duels."},
        effects:{gameSense:2,consistency:1},
        nextEventId:"qualifier-preparation",
      },
      {
        id:"vod-timings",
        label:{es:"Estudiar timings",en:"Study timings"},
        description:{es:"Buscas reconocer mejor cuándo el rival puede rotar o reagruparse.",en:"Try to better recognize when opponents can rotate or regroup."},
        effects:{gameSense:2},
        nextEventId:"tactical-meeting",
      },
      {
        id:"vod-mechanical-errors",
        label:{es:"Mirar solo tus duelos perdidos",en:"Focus on lost duels"},
        description:{es:"Prefieres corregir primero errores de crosshair y movimiento.",en:"Prefer fixing crosshair and movement mistakes first."},
        effects:{aim:2,gameSense:-1},
        nextEventId:"qualifier-preparation",
      },
    ],
  },

  {
    id:"tactical-meeting",
    eyebrow:{es:"REUNIÓN TÁCTICA",en:"TACTICAL MEETING"},
    title:{es:"EL EQUIPO PREPARA SUS PRIMEROS PROTOCOLOS",en:"THE TEAM BUILDS ITS FIRST PROTOCOLS"},
    description:{es:"El IGL quiere que todos reaccionen de manera automática ante situaciones comunes del mapa.",en:"The IGL wants everyone to react automatically to common situations on the map."},
    choices:[
      {
        id:"tactical-memorize",
        label:{es:"Memorizar los protocolos",en:"Memorize the protocols"},
        description:{es:"Quieres reducir errores incluso si al principio juegas de manera más rígida.",en:"Want to reduce mistakes even if you initially play more rigidly."},
        effects:{consistency:2,gameSense:1},
        nextEventId:"qualifier-preparation",
      },
      {
        id:"tactical-understand",
        label:{es:"Entender la lógica detrás",en:"Understand the logic behind them"},
        description:{es:"Prefieres saber por qué se toma cada decisión.",en:"Prefer understanding why each decision is made."},
        effects:{gameSense:2},
        nextEventId:"qualifier-preparation",
      },
      {
        id:"tactical-communicate",
        label:{es:"Ayudar a ordenar las calls",en:"Help organize calls"},
        description:{es:"Participas más activamente en cómo se transmiten las decisiones.",en:"Participate more actively in how decisions are communicated."},
        effects:{communication:2,gameSense:1},
        nextEventId:"qualifier-preparation",
      },
    ],
  },

  {
    id:"emergency-practice",
    eyebrow:{es:"CONTRA EL RELOJ",en:"AGAINST THE CLOCK"},
    title:{es:"TIENES MUY POCO TIEMPO PARA APRENDER EL SISTEMA",en:"YOU HAVE VERY LITTLE TIME TO LEARN THE SYSTEM"},
    description:{es:"El clasificatorio comienza pronto. El equipo intenta enseñarte únicamente lo esencial para que no estés perdido dentro del servidor.",en:"The qualifier starts soon. The team tries to teach you only what is essential so you won't be lost in the server."},
    choices:[
      {
        id:"emergency-simple",
        label:{es:"Pedir un rol simple",en:"Ask for a simple role"},
        description:{es:"Quieres concentrarte en ejecutar correctamente.",en:"Want to focus on executing correctly."},
        effects:{consistency:2,gameSense:-1,currentStage:"Amateur"},
        nextEventId:"qualifier-match",
      },
      {
        id:"emergency-study",
        label:{es:"Aprender todo lo posible",en:"Learn as much as possible"},
        description:{es:"Aceptas saturarte de información para llegar mejor preparado.",en:"Accept being overloaded with information to arrive better prepared."},
        effects:{gameSense:2,mental:-1,currentStage:"Amateur"},
        nextEventId:"qualifier-match",
      },
      {
        id:"emergency-confidence",
        label:{es:"Confiar en tus mecánicas",en:"Trust your mechanics"},
        description:{es:"Si algo sale mal, esperas poder resolverlo con tus duelos.",en:"If something goes wrong, you hope your duels can solve it."},
        effects:{aim:2,consistency:-1,currentStage:"Amateur"},
        nextEventId:"qualifier-match",
      },
    ],
  },

  {
    id:"qualifier-preparation",
    eyebrow:{es:"SEMANA DE CLASIFICATORIO",en:"QUALIFIER WEEK"},
    title:{es:"LLEGA TU PRIMER PARTIDO QUE REALMENTE IMPORTA",en:"YOUR FIRST MATCH THAT REALLY MATTERS IS HERE"},
    description:{es:"Ya no es un scrim. Perder significa quedar fuera y por primera vez notas cómo cambia el ambiente cuando existe algo en juego.",en:"This isn't a scrim anymore. Losing means elimination, and for the first time you notice how the atmosphere changes when something is truly at stake."},
    choices:[
      {
        id:"qualifier-prep-routine",
        label:{es:"Mantener tu rutina",en:"Keep your routine"},
        description:{es:"Quieres tratar el partido como cualquier otra sesión.",en:"Want to treat the match like any other session."},
        effects:{consistency:2,mental:1},
        nextEventId:"qualifier-match",
      },
      {
        id:"qualifier-prep-study",
        label:{es:"Estudiar al rival hasta el último detalle",en:"Study the opponent in detail"},
        description:{es:"Prefieres llegar con respuestas preparadas.",en:"Prefer arriving with prepared answers."},
        effects:{gameSense:2,mental:-1},
        nextEventId:"qualifier-match",
      },
      {
        id:"qualifier-prep-pressure",
        label:{es:"Entrenar situaciones de presión",en:"Practice pressure situations"},
        description:{es:"Quieres sentirte cómodo si el mapa llega a las últimas rondas.",en:"Want to feel comfortable if the map reaches the final rounds."},
        effects:{clutch:2,mental:1},
        nextEventId:"qualifier-match",
      },
    ],
  },

  {
    id:"qualifier-match",
    eyebrow:{es:"PRIMER CLASIFICATORIO",en:"FIRST QUALIFIER"},
    title:{es:"EL PARTIDO ESTÁ MUCHO MÁS CERRADO DE LO ESPERADO",en:"THE MATCH IS MUCH CLOSER THAN EXPECTED"},
    description:{es:"El marcador se mantiene igualado y varias rondas comienzan a resolverse en situaciones de pocos jugadores.",en:"The score remains close and several rounds begin ending in low-player situations."},
    choices:[
      {
        id:"qualifier-disciplined",
        label:{es:"Jugar disciplinado",en:"Play disciplined"},
        description:{es:"No quieres regalar ninguna ronda intentando hacer demasiado.",en:"Don't want to give away rounds by trying to do too much."},
        effects:{consistency:2,gameSense:1},
        nextEventId:"qualifier-overtime",
      },
      {
        id:"qualifier-initiate",
        label:{es:"Tomar la iniciativa",en:"Take initiative"},
        description:{es:"Quieres ser quien abra espacio cuando el equipo se queda sin ideas.",en:"Want to be the player creating space when the team runs out of ideas."},
        effects:{aim:2,mental:1,consistency:-1},
        nextEventId:"qualifier-overtime",
      },
      {
        id:"qualifier-calls",
        label:{es:"Ayudar más con las calls",en:"Help more with calls"},
        description:{es:"Intentas mantener ordenadas las rondas incluso en el caos.",en:"Try to keep rounds organized even in chaos."},
        effects:{communication:2,gameSense:1},
        nextEventId:"qualifier-overtime",
      },
    ],
  },

  {
    id:"qualifier-overtime",
    eyebrow:{es:"OVERTIME",en:"OVERTIME"},
    title:{es:"TODO SE REDUCE A UNAS POCAS RONDAS",en:"EVERYTHING COMES DOWN TO A FEW ROUNDS"},
    description:{es:"El clasificatorio llega a overtime. Sabes que una sola decisión puede determinar si tu primer torneo continúa o termina aquí.",en:"The qualifier reaches overtime. You know one decision could determine whether your first tournament continues or ends here."},
    choices:[
      {
        id:"overtime-calm",
        label:{es:"Respirar y jugar lento",en:"Breathe and play slowly"},
        description:{es:"Intentas impedir que los nervios aceleren tus decisiones.",en:"Try preventing nerves from speeding up your decisions."},
        effects:{mental:2,clutch:1},
        nextEventId:"post-qualifier-review",
      },
      {
        id:"overtime-confidence",
        label:{es:"Confiar en tu aim",en:"Trust your aim"},
        description:{es:"Si aparece el duelo, no vas a dudar.",en:"If the duel appears, you won't hesitate."},
        effects:{aim:2,mental:1},
        nextEventId:"post-qualifier-review",
      },
      {
        id:"overtime-read",
        label:{es:"Esperar el error rival",en:"Wait for the opponent's mistake"},
        description:{es:"Prefieres obtener información antes de comprometer la ronda.",en:"Prefer gaining information before committing the round."},
        effects:{gameSense:2,clutch:1},
        nextEventId:"post-qualifier-review",
      },
      {
        id:"overtime-call",
        label:{es:"Tomar responsabilidad en la call",en:"Take responsibility for the call"},
        description:{es:"Si nadie decide, tú vas a hacerlo.",en:"If nobody decides, you will."},
        effects:{communication:1,clutch:1,mental:1},
        nextEventId:"post-qualifier-review",
      },
    ],
  },

  {
    id:"post-qualifier-review",
    eyebrow:{es:"DESPUÉS DEL TORNEO",en:"AFTER THE EVENT"},
    title:{es:"TU PRIMER CLASIFICATORIO DEJA MUCHO QUE ANALIZAR",en:"YOUR FIRST QUALIFIER LEAVES A LOT TO ANALYZE"},
    description:{es:"Independientemente del resultado, competir oficialmente se sintió muy distinto a ranked y scrims. Ahora sabes mejor dónde están tus debilidades.",en:"Regardless of the result, official competition felt very different from ranked and scrims. You now have a clearer idea of your weaknesses."},
    choices:[
      {
        id:"post-qualifier-vods",
        label:{es:"Revisar las rondas importantes",en:"Review important rounds"},
        description:{es:"Quieres entender qué decisiones sobrevivieron a la presión y cuáles no.",en:"Want to understand which decisions survived pressure and which didn't."},
        effects:{gameSense:2,clutch:1},
        nextEventId:"second-opportunity",
      },
      {
        id:"post-qualifier-mechanics",
        label:{es:"Trabajar mecánicas",en:"Work on mechanics"},
        description:{es:"Algunos duelos todavía se sienten demasiado rápidos.",en:"Some duels still feel too fast."},
        effects:{aim:2,consistency:1},
        nextEventId:"second-opportunity",
      },
      {
        id:"post-qualifier-mental",
        label:{es:"Aprender a manejar los nervios",en:"Learn to handle nerves"},
        description:{es:"Quieres que tu nivel no cambie cuando el partido importa.",en:"Want your level to remain unchanged when the match matters."},
        effects:{mental:2,consistency:1},
        nextEventId:"second-opportunity",
      },
      {
        id:"post-qualifier-comms",
        label:{es:"Mejorar comunicación",en:"Improve communication"},
        description:{es:"Notas que bajo presión empezaste a hablar menos.",en:"Notice you started talking less under pressure."},
        effects:{communication:2,mental:1},
        nextEventId:"second-opportunity",
      },
    ],
  },

  {
    id:"second-opportunity",
    eyebrow:{es:"NUEVA OPORTUNIDAD",en:"NEW OPPORTUNITY"},
    title:{es:"UN ROSTER MÁS SERIO QUIERE PROBARTE",en:"A STRONGER ROSTER WANTS TO TRIAL YOU"},
    description:{es:"Tu nombre empieza a aparecer en conversaciones de equipos que aspiran a llegar a Challengers. Quieren verte en una semana de pruebas.",en:"Your name starts appearing in conversations among teams aiming for Challengers. They want to see you in a week-long trial."},
    choices:[
      {
        id:"second-opportunity-adapt",
        label:{es:"Aceptar el rol que necesiten",en:"Accept the role they need"},
        description:{es:"Tu prioridad es demostrar que puedes funcionar dentro de un sistema serio.",en:"Your priority is proving you can function inside a serious system."},
        effects:{communication:1,consistency:1,currentStage:"Amateur"},
        nextEventId:"trial-week",
      },
      {
        id:"second-opportunity-main",
        label:{es:"Pedir jugar tu mejor rol",en:"Ask to play your best role"},
        description:{es:"Quieres que evalúen tu máximo nivel posible.",en:"Want them to evaluate your maximum possible level."},
        effects:{aim:2,mental:1,currentStage:"Amateur"},
        nextEventId:"trial-week",
      },
      {
        id:"second-opportunity-system",
        label:{es:"Preguntar primero por el sistema",en:"Ask about the system first"},
        description:{es:"Quieres entender cómo esperan que tomes decisiones.",en:"Want to understand how they expect you to make decisions."},
        effects:{gameSense:1,communication:1,currentStage:"Amateur"},
        nextEventId:"trial-week",
      },
    ],
  },

  {
    id:"trial-week",
    eyebrow:{es:"SEMANA DE PRUEBA",en:"TRIAL WEEK"},
    title:{es:"CADA SCRIM SE SIENTE COMO UNA ENTREVISTA",en:"EVERY SCRIM FEELS LIKE AN INTERVIEW"},
    description:{es:"Sabes que el staff está observando no solo tus kills, sino también cómo reaccionas a errores, cambios de plan y presión.",en:"You know the staff is watching not just your kills, but also how you react to mistakes, plan changes and pressure."},
    choices:[
      {
        id:"trial-week-stable",
        label:{es:"Priorizar estabilidad",en:"Prioritize stability"},
        description:{es:"Prefieres cometer pocos errores antes que buscar jugadas espectaculares.",en:"Prefer making few mistakes rather than chasing spectacular plays."},
        effects:{consistency:2},
        nextEventId:"trial-role-test",
      },
      {
        id:"trial-week-mechanics",
        label:{es:"Demostrar tus mecánicas",en:"Show your mechanics"},
        description:{es:"Buscas enfrentamientos donde puedas diferenciarte.",en:"Look for fights where you can separate yourself from others."},
        effects:{aim:2,consistency:-1},
        nextEventId:"trial-role-test",
      },
      {
        id:"trial-week-communication",
        label:{es:"Ser muy vocal",en:"Be very vocal"},
        description:{es:"Quieres que el equipo note tu impacto incluso cuando no consigues kills.",en:"Want the team to notice your impact even when you aren't getting kills."},
        effects:{communication:2},
        nextEventId:"trial-role-test",
      },
      {
        id:"trial-week-read",
        label:{es:"Mostrar capacidad de adaptación",en:"Show adaptability"},
        description:{es:"Intentas anticipar cambios y responder sin que el coach tenga que pedírtelo.",en:"Try to anticipate changes and respond without the coach having to ask."},
        effects:{gameSense:2,mental:1},
        nextEventId:"trial-role-test",
      },
    ],
  },

  {
    id:"trial-role-test",
    eyebrow:{es:"CAMBIO DE PLAN",en:"CHANGE OF PLAN"},
    title:{es:"EL COACH TE PRUEBA FUERA DE TU COMODIDAD",en:"THE COACH TESTS YOU OUTSIDE YOUR COMFORT ZONE"},
    description:{es:"A mitad de la prueba cambian tu función dentro del mapa para ver cuánto tardas en adaptarte.",en:"Halfway through the trial they change your role on the map to see how quickly you adapt."},
    choices:[
      {
        id:"role-test-adapt",
        label:{es:"Aceptar el cambio",en:"Accept the change"},
        description:{es:"Intentas aprender sobre la marcha sin quejarte.",en:"Try learning on the fly without complaining."},
        effects:{gameSense:2,mental:1},
        nextEventId:"pressure-series",
      },
      {
        id:"role-test-questions",
        label:{es:"Hacer muchas preguntas",en:"Ask lots of questions"},
        description:{es:"Prefieres aclarar cada responsabilidad antes de jugar.",en:"Prefer clarifying every responsibility before playing."},
        effects:{communication:2,consistency:1},
        nextEventId:"pressure-series",
      },
      {
        id:"role-test-instinct",
        label:{es:"Jugar por instinto",en:"Play by instinct"},
        description:{es:"No quieres llenarte la cabeza de información nueva.",en:"Don't want to overload yourself with new information."},
        effects:{aim:2,mental:1,gameSense:-1},
        nextEventId:"pressure-series",
      },
    ],
  },

  {
    id:"pressure-series",
    eyebrow:{es:"SERIE DE PRUEBA",en:"TRIAL SERIES"},
    title:{es:"EL ÚLTIMO SCRIM DEFINE TU PRUEBA",en:"THE FINAL SCRIM DEFINES YOUR TRIAL"},
    description:{es:"El staff quiere verte en una situación competitiva realista. El marcador llega ajustado al final del mapa.",en:"The staff wants to see you in a realistic competitive situation. The score remains close late into the map."},
    choices:[
      {
        id:"pressure-series-clutch",
        label:{es:"Buscar responsabilidad",en:"Seek responsibility"},
        description:{es:"Quieres participar activamente en las rondas que definan el mapa.",en:"Want to actively participate in the rounds that decide the map."},
        effects:{clutch:2,mental:1},
        nextEventId:"tier2-interest",
      },
      {
        id:"pressure-series-stable",
        label:{es:"No cambiar tu forma de jugar",en:"Don't change your playstyle"},
        description:{es:"La presión no debería modificar tus decisiones.",en:"Pressure shouldn't change your decisions."},
        effects:{consistency:2},
        nextEventId:"tier2-interest",
      },
      {
        id:"pressure-series-calls",
        label:{es:"Ayudar a mantener orden",en:"Help maintain order"},
        description:{es:"Cuando el partido se complica, priorizas información y decisiones simples.",en:"When the match becomes difficult, prioritize information and simple decisions."},
        effects:{communication:2,mental:1},
        nextEventId:"tier2-interest",
      },
      {
        id:"pressure-series-read",
        label:{es:"Leer al rival",en:"Read the opponent"},
        description:{es:"Buscas reconocer patrones que se hayan repetido durante el mapa.",en:"Try to recognize patterns repeated throughout the map."},
        effects:{gameSense:2,clutch:1},
        nextEventId:"tier2-interest",
      },
    ],
  },

  {
    id:"tier2-interest",
    eyebrow:{es:"MERCADO CHALLENGERS",en:"CHALLENGERS MARKET"},
    title:{es:"LOS EQUIPOS EMPIEZAN A PREGUNTAR POR TI",en:"TEAMS START ASKING ABOUT YOU"},
    description:{es:"Tu etapa como completo desconocido empieza a terminar. Hay equipos de Challengers siguiendo tu progreso y pronto podrás comenzar tu primera temporada seria.",en:"Your time as a complete unknown is starting to end. Challengers teams are following your progress and soon you'll be able to begin your first serious season."},
    choices:[
      {
        id:"tier2-ready",
        label:{es:"Estoy listo para competir",en:"I'm ready to compete"},
        description:{es:"Sientes que ya necesitas partidos oficiales para seguir progresando.",en:"Feel you now need official matches to keep progressing."},
        effects:{mental:2,consistency:1},
      },
      {
        id:"tier2-project",
        label:{es:"Buscar un proyecto donde pueda aprender",en:"Find a project where I can learn"},
        description:{es:"Quieres un roster que te obligue a mejorar tu comprensión del juego.",en:"Want a roster that forces you to improve your understanding of the game."},
        effects:{gameSense:2,communication:1},
      },
      {
        id:"tier2-starter",
        label:{es:"Priorizar un lugar como titular",en:"Prioritize a starting spot"},
        description:{es:"Tu prioridad es tener minutos y aprender jugando.",en:"Your priority is getting playing time and learning through competition."},
        effects:{consistency:1,mental:1},
      },
      {
        id:"tier2-ceiling",
        label:{es:"Buscar el roster con mayor nivel",en:"Find the highest-level roster"},
        description:{es:"Prefieres exponerte a una competencia más difícil aunque tengas que adaptarte rápido.",en:"Prefer exposing yourself to harder competition even if you have to adapt quickly."},
        effects:{aim:2,gameSense:1,mental:-1},
      },
    ],
  },
];

export function getEventById(id?:string):CareerEvent|undefined {
  return CAREER_EVENTS.find((event) => event.id === id);
}

export function getRandomCareerStartEventId() {
  return randomItem(CAREER_START_EVENT_IDS);
}

export function getRandomCareerStartEvent():CareerEvent {
  return getEventById(getRandomCareerStartEventId())!;
}