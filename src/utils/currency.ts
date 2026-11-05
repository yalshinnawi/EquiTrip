import { PaymentApp } from '../types';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  JPY: '¥',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
  CHF: 'CHF ',
  SGD: 'S$',
};

export function formatMoney(amount: number, currency: string = 'USD'): string {
  const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `;
  const isZeroDecimals = currency === 'JPY';
  
  if (isZeroDecimals) {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
  
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatSignedMoney(amount: number, currency: string = 'USD'): { text: string; isPositive: boolean; isZero: boolean } {
  const isZero = Math.abs(amount) < 0.01;
  const isPositive = amount > 0.01;
  const prefix = isPositive ? '+' : amount < -0.01 ? '-' : '';
  const text = `${prefix}${formatMoney(Math.abs(amount), currency)}`;
  return { text, isPositive, isZero };
}

export function getPaymentDeepLink(
  app: PaymentApp,
  handle: string,
  amount: number,
  currency: string,
  tripTitle: string = 'Trip Settlement'
): { url: string; label: string; appName: string } {
  const cleanHandle = handle.replace(/^[@$]/, '').trim();
  const note = `EquiTrip: ${tripTitle} settlement`;
  const formattedAmt = currency === 'JPY' ? Math.round(amount).toString() : amount.toFixed(2);

  switch (app) {
    case 'venmo':
      return {
        url: `https://venmo.com/?txn=pay&recipients=${encodeURIComponent(cleanHandle)}&amount=${formattedAmt}&note=${encodeURIComponent(note)}`,
        label: `Pay ${formatMoney(amount, currency)} via Venmo`,
        appName: 'Venmo',
      };
    case 'revolut':
      return {
        url: `https://revolut.me/${encodeURIComponent(cleanHandle)}`,
        label: `Pay ${formatMoney(amount, currency)} via Revolut`,
        appName: 'Revolut',
      };
    case 'cashapp':
      return {
        url: `https://cash.app/$${encodeURIComponent(cleanHandle)}/${formattedAmt}`,
        label: `Pay ${formatMoney(amount, currency)} via Cash App`,
        appName: 'Cash App',
      };
    case 'paypal':
      return {
        url: `https://paypal.me/${encodeURIComponent(cleanHandle)}/${formattedAmt}`,
        label: `Pay ${formatMoney(amount, currency)} via PayPal`,
        appName: 'PayPal',
      };
    case 'zelle':
      return {
        url: `https://www.zellepay.com/go/zelle`,
        label: `Pay via Zelle to ${handle}`,
        appName: 'Zelle',
      };
    default:
      return {
        url: '#',
        label: `Pay ${formatMoney(amount, currency)}`,
        appName: 'Payment',
      };
  }
}
