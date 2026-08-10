import { describe, expect, it } from 'vitest';
import { formatMoney, parseRupeesInput, rupeesToPaise } from './money';

describe('money helpers', () => {
  it('stores rupees as integer paise', () => {
    expect(rupeesToPaise(1234.56)).toBe(123456);
  });

  it('accepts Indian currency formatting', () => {
    expect(parseRupeesInput('₹ 1,23,456.78')).toBe(12345678);
  });

  it('rejects negative and over-precision values', () => {
    expect(parseRupeesInput('-10')).toBeNull();
    expect(parseRupeesInput('10.999')).toBeNull();
  });

  it('formats whole paise values as INR', () => {
    expect(formatMoney(123456)).toContain('1,234.56');
  });
});
