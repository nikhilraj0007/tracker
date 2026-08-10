import { describe, expect, it } from 'vitest';
import { createDefaultData } from '../data/defaultData';
import { calculateAllocationProgress, calculateCreditCards, calculateMonthSummary } from './calculations';
import type { MoneyTransaction } from './types';

const transaction = (overrides: Partial<MoneyTransaction>): MoneyTransaction => ({
  id: crypto.randomUUID(),
  kind: 'expense',
  status: 'cleared',
  date: '2026-08-03',
  amountPaise: 100_000,
  accountId: 'salary-bank',
  categoryId: 'groceries',
  paymentMethod: 'upi',
  merchant: 'Test',
  note: '',
  createdAt: '2026-08-03T00:00:00.000Z',
  updatedAt: '2026-08-03T00:00:00.000Z',
  ...overrides,
});

describe('default personal money plan', () => {
  it('assigns the full ₹80k salary across four editable buckets', () => {
    const data = createDefaultData();
    expect(data.plan.monthlySalaryPaise).toBe(8_000_000);
    expect(data.plan.salaryAllocations.reduce((sum, item) => sum + item.plannedPaise, 0)).toBe(8_000_000);
  });

  it('keeps the living categories inside the ₹45k ceiling', () => {
    const data = createDefaultData();
    const living = data.categories.filter((category) => category.group === 'living' && category.id !== 'other');
    expect(living.reduce((sum, category) => sum + category.monthlyBudgetPaise, 0)).toBe(4_500_000);
  });

  it('does not count a credit-card payment as another expense', () => {
    const data = createDefaultData();
    data.transactions = [
      transaction({ amountPaise: 500_000, accountId: 'axis-card' }),
      transaction({ kind: 'liability_payment', amountPaise: 500_000, accountId: 'salary-bank', destinationAccountId: 'axis-card', categoryId: 'card-payment' }),
    ];
    const summary = calculateMonthSummary(data.transactions, data.accounts, '2026-08', new Date(2026, 7, 10), 4_500_000);
    expect(summary.spentPaise).toBe(500_000);
    const axis = calculateCreditCards(data).find((card) => card.account.id === 'axis-card');
    expect(axis?.paymentsPaise).toBe(500_000);
  });

  it('derives allocation progress from transaction purpose', () => {
    const data = createDefaultData();
    data.transactions = [
      transaction({ amountPaise: 200_000 }),
      transaction({ kind: 'fund_contribution', amountPaise: 100_000, categoryId: 'emergency-fund' }),
      transaction({ kind: 'investment', amountPaise: 120_000, categoryId: 'investments' }),
    ];
    const progress = calculateAllocationProgress(data, '2026-08');
    expect(progress.find((item) => item.id === 'living')?.actualPaise).toBe(200_000);
    expect(progress.find((item) => item.id === 'funds')?.actualPaise).toBe(100_000);
    expect(progress.find((item) => item.id === 'investments')?.actualPaise).toBe(120_000);
  });

  it('ships the personal use case as a customizable section layout', () => {
    const data = createDefaultData();
    expect(data.version).toBe(5);
    expect(data.plan.sectionConfigs).toHaveLength(9);
    expect(new Set(data.plan.sectionConfigs.map((section) => section.id)).size).toBe(9);
    expect(new Set(data.plan.sectionConfigs.map((section) => section.order)).size).toBe(9);
    expect(data.plan.sectionConfigs.find((section) => section.id === 'one-time')).toMatchObject({ scope: 'month', visible: true });
    expect(data.plan.customSections).toEqual([]);
  });
});
