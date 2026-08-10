export const rupeesToPaise = (value: number): number => Math.round(value * 100);

export const paiseToRupees = (value: number): number => value / 100;

export const formatMoney = (paise: number, compact = false): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: compact ? 0 : paise % 100 === 0 ? 0 : 2,
    notation: compact ? 'compact' : 'standard',
  }).format(paiseToRupees(paise));
};

export const formatPercent = (value: number): string => `${Math.round(value)}%`;

export const parseRupeesInput = (value: string): number | null => {
  const normalized = value.replace(/[₹,\s]/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  const rupees = Number(normalized);
  if (!Number.isFinite(rupees) || rupees <= 0 || rupees > 9_999_999.99) return null;
  return rupeesToPaise(rupees);
};
