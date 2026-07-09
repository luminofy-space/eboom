import { formatMoney } from "@/src/i18n/formatters";

interface TransferAmountFields {
  sourceCurrencyId: number;
  sourceCurrencySymbol: string;
  destinationCurrencyId: number;
  destinationCurrencySymbol: string;
  sourceAmount?: string;
  destinationAmount?: string;
  totalSourceAmount?: string;
  totalDestinationAmount?: string;
}

export function formatTransferAmounts(transfer: TransferAmountFields): string {
  const sourceAmount = transfer.sourceAmount ?? transfer.totalSourceAmount ?? "0";
  const destinationAmount = transfer.destinationAmount ?? transfer.totalDestinationAmount ?? "0";
  const source = formatMoney(sourceAmount, transfer.sourceCurrencySymbol);
  if (transfer.sourceCurrencyId === transfer.destinationCurrencyId) {
    return source;
  }
  const destination = formatMoney(destinationAmount, transfer.destinationCurrencySymbol);
  return `${source} → ${destination}`;
}
