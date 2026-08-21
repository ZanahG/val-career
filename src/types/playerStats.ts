export type PlayerStatKey = "aim"|"gameSense"|"communication"|"clutch"|"consistency"|"mental";

export interface PlayerStatEffect {
  stat: PlayerStatKey;
  amount: number;
}