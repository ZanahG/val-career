import type {VCTRealPlayer} from "../data/vctPlayers";

export function getVCTPlayerOverall(player:VCTRealPlayer) {
  const {aim,gameSense,communication,clutch,consistency,mental} = player.stats;

  const overall =
    aim * .24 +
    gameSense * .20 +
    communication * .14 +
    clutch * .16 +
    consistency * .16 +
    mental * .10;

  return Math.round(overall);
}

export function getVCTPlayerOverallExact(player:VCTRealPlayer) {
  const {aim,gameSense,communication,clutch,consistency,mental} = player.stats;

  return (
    aim * .24 +
    gameSense * .20 +
    communication * .14 +
    clutch * .16 +
    consistency * .16 +
    mental * .10
  );
}