/*
  Valores de balance centralizados.

  Todos los números de este archivo reproducen exactamente los valores que
  estaban escritos dentro de cada módulo antes de v0.2. Cambiar cualquiera de
  ellos altera el balance del juego: hazlo de forma deliberada, ejecuta
  `npm test` y actualiza las pruebas de caracterización (`npx vitest run -u`)
  documentando el motivo.
*/

/* =========================
   MODO JUGADOR — PARTIDO (src/logic/season.ts)
========================= */

export const PLAYER_MATCH_BALANCE={
  /* Impacto del jugador en la fuerza del equipo. */
  overallBaseline:60,
  overallImpact:.16,
  communicationImpact:.02,
  gameSenseImpact:.015,
  mentalImpact:.01,
  statBaseline:50,

  /* Variación aleatoria de la fuerza de ambos equipos. */
  teamVarianceBase:6,
  teamVariancePerConsistency:.035,
  teamVarianceMin:2.5,
  teamVarianceMax:6,
  opponentVariance:5,

  /* Partido "de presión": diferencia de fuerza pequeña. */
  pressureStrengthGap:6,
  clutchPressureBonus:.0007,
  mentalPressureBonus:.0004,

  /* Probabilidad de victoria = 0.5 + diferencia / divisor. */
  winProbabilityDivisor:40,
  winProbabilityMin:.12,
  winProbabilityMax:.88,

  closeMatchBase:.62,
  closeMatchPerStrengthGap:.035,
  closeMatchMin:.25,
  closeMatchMax:.72,
} as const;

/* Partidos simulados entre equipos de la IA en la liga Tier 2. */
export const TIER2_CPU_MATCH_BALANCE={
  winProbabilityDivisor:35,
  winProbabilityMin:.25,
  winProbabilityMax:.75,
  closeMatchBase:.70,
  closeMatchPerStrengthGap:.04,
  closeMatchMin:.30,
  closeMatchMax:.70,
} as const;

/* =========================
   MODO JUGADOR — PROGRESIÓN
========================= */

/* Multiplicador de las ganancias positivas en los eventos iniciales. */
export const INTRO_STAT_MULTIPLIER=2;

/* Rendimientos decrecientes al subir un atributo (src/utils/playerStatsProgression.ts). */
export const STAT_GROWTH_BALANCE={
  maxStat:100,
  minStat:1,
  /* Desde 99: probabilidad de llegar a 100. */
  at99Chance:.08,
  /* Desde 97: probabilidad de +1. */
  from97Chance:.18,
  /* Desde 94: probabilidad de +1. */
  from94Chance:.35,
  /* Desde 90: como máximo +1. */
  capOneFrom:90,
  /* Desde 85: la ganancia se reduce a la mitad (mínimo 1). */
  halfGainFrom:85,
} as const;

/* Regresión de pretemporada: solo afecta a atributos >= threshold.
   Cada rango es [mínimo, máximo] de puntos perdidos. */
export const OFFSEASON_REGRESSION_BALANCE={
  threshold:80,
  aim:[1,2],
  gameSense:[0,1],
  communication:[0,1],
  clutch:[0,2],
  consistency:[1,3],
  mental:[1,3],
} as const;

/* Cambios de atributos tras cada partido (App.tsx). */
export const POST_MATCH_STAT_BALANCE={
  mentalOnWin:1,
  mentalOnLoss:-1,
  consistencyLowRating:.8,
  tier2ConsistencyHighRating:1.05,
  vctConsistencyHighRating:1.1,
} as const;

/* =========================
   MODO JUGADOR — MINIJUEGOS
========================= */

export const MINIGAME_BALANCE={
  /* Probabilidad de que aparezca un minijuego tras un partido VCT. */
  chance:.35,
  /* Partidos de espera tras un minijuego. */
  cooldownMatches:5,
} as const;

/* =========================
   MODO ENTRENADOR — SERIES (src/logic/coachMatchSimulation.ts)
========================= */

export const COACH_MATCH_BALANCE={
  /* Pesos de la potencia del equipo del jugador por mapa. */
  rosterWeight:.42,
  mapWeight:.25,
  chemistryWeight:.08,
  formWeight:.06,
  roleBalanceWeight:.07,
  tacticalFitBaseline:75,
  tacticalFitWeight:.06,
  tacticalRoleBaseline:75,
  tacticalRoleWeight:.04,
  tacticalBonusMin:-3,
  tacticalBonusMax:3,

  /* Pesos de la potencia del rival por mapa. */
  opponentStarPowerWeight:.08,
  opponentStrengthWeight:.06,

  /* Probabilidad de ganar un mapa = 0.5 + (diferencia / volatilidad) / divisor. */
  mapWinDivisor:55,
  mapWinRandomSwing:.06,
  mapWinMin:.16,
  mapWinMax:.84,

  /* Volatilidad según el riesgo y el ritmo elegidos. */
  volatilityBase:1,
  volatilityHighRisk:.22,
  volatilityLowRisk:-.18,
  volatilityFastPace:.06,
  volatilitySlowPace:-.04,
  volatilityAggressiveStyle:.06,
  volatilityControlledStyle:-.06,
  volatilityMin:.72,
  volatilityMax:1.32,
} as const;

/* =========================
   MODO ENTRENADOR — MAPAS Y ENTRENAMIENTO
========================= */

export const COACH_TRAINING_BALANCE={
  sessionsPerPeriod:3,
  /* Pérdida de preparación por periodo según si el mapa se entrenó. */
  preparationDecayTrained:1,
  preparationDecayUntrained:3,
  preparationFloor:45,
  preparationCap:95,
  /* Ganancia por sesión: [preparación por debajo de, ganancia]. */
  preparationGainSteps:[[70,4],[80,3],[90,2],[95,1]] as readonly (readonly [number,number])[],
  /* Rango inicial de preparación de cada mapa. */
  initialPreparationMin:55,
  initialPreparationMax:78,
  initialSideVariance:5,
} as const;

/* =========================
   MODO ENTRENADOR — DIRECTIVA (src/logic/coachBoard.ts)
========================= */

export const COACH_BOARD_BALANCE={
  /* Umbrales de seguridad laboral según la confianza. */
  secureFrom:75,
  stableFrom:50,
  underPressureFrom:25,
} as const;
