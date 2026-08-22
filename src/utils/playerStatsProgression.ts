export function clampPlayerStat(value:number) {
  return Math.max(1,Math.min(100,value));
}

export function applyPlayerStatChange(current:number,change:number) {
  if (change === 0) return current;

  if (change < 0) {
    return clampPlayerStat(current + change);
  }

  if (current >= 99) {
    return Math.random() < .08 ? 100 : current;
  }

  if (current >= 97) {
    return Math.random() < .18 ? clampPlayerStat(current + 1) : current;
  }

  if (current >= 94) {
    return Math.random() < .35 ? clampPlayerStat(current + 1) : current;
  }

  if (current >= 90) {
    return clampPlayerStat(current + Math.min(1,change));
  }

  if (current >= 85) {
    return clampPlayerStat(current + Math.max(1,Math.round(change * .5)));
  }

  return clampPlayerStat(current + change);
}

interface PlayerPerformanceStats {
  aim:number;
  gameSense:number;
  communication:number;
  clutch:number;
  consistency:number;
  mental:number;
}

export function applyOffseasonRegression(stats:PlayerPerformanceStats):PlayerPerformanceStats {
  return {
    aim:clampPlayerStat(stats.aim - getRegression(stats.aim,1,2)),
    gameSense:clampPlayerStat(stats.gameSense - getRegression(stats.gameSense,0,1)),
    communication:clampPlayerStat(stats.communication - getRegression(stats.communication,0,1)),
    clutch:clampPlayerStat(stats.clutch - getRegression(stats.clutch,0,2)),
    consistency:clampPlayerStat(stats.consistency - getRegression(stats.consistency,1,3)),
    mental:clampPlayerStat(stats.mental - getRegression(stats.mental,1,3)),
  };
}

function getRegression(stat:number,min:number,max:number) {
  if (stat < 80) return 0;

  return Math.floor(Math.random() * (max - min + 1)) + min;
}