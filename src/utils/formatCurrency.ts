/**
 * Narxni AQSH dollari ($ / USD) formatida chiqarish
 * 0 dan yuqori har qanday sonni (masalan 0.02, 1.5, 250, 1850.75) to'g'ri ko'rsatadi
 */
export function formatUSD(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '$0';
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, '.').replace(/\s/g, ''));
  if (isNaN(num)) return '$0';

  return '$' + num.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 4,
  });
}

export function formatUSDWithCode(value: number | string | undefined | null): string {
  return `${formatUSD(value)} USD`;
}
