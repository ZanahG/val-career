import type {CareerPlayer} from "../types/career";

export function getPlayerOverall(player:CareerPlayer) {
  const raw = player.stats.aim * .24 + player.stats.gameSense * .18 + player.stats.communication * .14 + player.stats.clutch * .14 + player.stats.consistency * .16 + player.stats.mental * .14;
  return Math.round(raw);
}

export function getPlayerOverallExact(player:CareerPlayer) {
  return player.stats.aim * .24 + player.stats.gameSense * .18 + player.stats.communication * .14 + player.stats.clutch * .14 + player.stats.consistency * .16 + player.stats.mental * .14;
}