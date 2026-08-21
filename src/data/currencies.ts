import type { GameCurrency } from "../types/settings";

export interface CurrencyDefinition {
  code: GameCurrency;
  label: string;
  symbol: string;
  locale: string;
  rateFromUSD: number;
}

export const CURRENCIES: CurrencyDefinition[] = [
  {
    code: "USD",
    label: "US Dollar",
    symbol: "$",
    locale: "en-US",
    rateFromUSD: 1,
  },
  {
    code: "EUR",
    label: "Euro",
    symbol: "€",
    locale: "de-DE",
    rateFromUSD: 0.86,
  },
  {
    code: "CLP",
    label: "Peso Chileno",
    symbol: "$",
    locale: "es-CL",
    rateFromUSD: 965,
  },
  {
    code: "ARS",
    label: "Peso Argentino",
    symbol: "$",
    locale: "es-AR",
    rateFromUSD: 1350,
  },
  {
    code: "MXN",
    label: "Peso Mexicano",
    symbol: "$",
    locale: "es-MX",
    rateFromUSD: 18.7,
  },
  {
    code: "BRL",
    label: "Real Brasileño",
    symbol: "R$",
    locale: "pt-BR",
    rateFromUSD: 5.45,
  },
];