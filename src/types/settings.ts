export type GameLanguage = "es" | "en";

export type GameCurrency =
  | "USD"
  | "EUR"
  | "CLP"
  | "ARS"
  | "MXN"
  | "BRL";

export interface GameSettings {
  language: GameLanguage;
  currency: GameCurrency;
}