import { CURRENCIES } from "../data/currencies";
import type { GameCurrency } from "../types/settings";

export function convertFromUSD(
  amountUSD: number,
  currency: GameCurrency,
) {
  const currencyData =
    CURRENCIES.find(
      (item) =>
        item.code === currency,
    );

  if (!currencyData) {
    return amountUSD;
  }

  return (
    amountUSD *
    currencyData.rateFromUSD
  );
}

export function formatCurrency(
  amountUSD: number,
  currency: GameCurrency,
) {
  const currencyData =
    CURRENCIES.find(
      (item) =>
        item.code === currency,
    );

  if (!currencyData) {
    return `$${amountUSD.toLocaleString()}`;
  }

  const converted =
    convertFromUSD(
      amountUSD,
      currency,
    );

  return new Intl.NumberFormat(
    currencyData.locale,
    {
      style: "currency",
      currency:
        currencyData.code,

      maximumFractionDigits:
        currencyData.code === "CLP" ||
        currencyData.code === "ARS"
          ? 0
          : 2,
    },
  ).format(converted);
}