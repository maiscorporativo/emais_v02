/**
 * Utilitários de formatação de moeda compartilhados
 * entre TrendingPackages, PackageModal e outros componentes.
 */

export const CURRENCY_LOCALES: Record<string, string> = {
  BRL: 'pt-BR', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB',
  ARS: 'es-AR', CLP: 'es-CL', COP: 'es-CO', MXN: 'es-MX',
  JPY: 'ja-JP', CNY: 'zh-CN', AUD: 'en-AU', CAD: 'en-CA',
  CHF: 'de-CH', AED: 'ar-AE', ZAR: 'en-ZA', INR: 'en-IN',
  KRW: 'ko-KR', SGD: 'en-SG', HKD: 'zh-HK', NZD: 'en-NZ',
  NOK: 'nb-NO', SEK: 'sv-SE', DKK: 'da-DK', PLN: 'pl-PL',
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  BRL: 'R$', USD: '$', EUR: '€', GBP: '£',
  ARS: '$', CLP: '$', COP: '$', MXN: '$',
  PYG: '₲', UYU: '$U', PEN: 'S/', BOB: 'Bs',
  VES: 'Bs.S', JPY: '¥', CNY: '¥', AUD: 'A$',
  CAD: 'C$', CHF: 'Fr', AED: 'د.إ', QAR: '﷼',
  SAR: '﷼', ZAR: 'R', INR: '₹', KRW: '₩',
  SGD: 'S$', HKD: 'HK$', NZD: 'NZ$', NOK: 'kr',
  SEK: 'kr', DKK: 'kr', PLN: 'zł',
};

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] ?? code;
}

export function formatDisplayPrice(rawPrice: string, currencyCode: string): string {
  const digits = rawPrice.replace(/\D/g, '');
  if (!digits) return rawPrice;
  const num = parseInt(digits, 10);
  const locale = CURRENCY_LOCALES[currencyCode] || 'pt-BR';
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(num);
}
