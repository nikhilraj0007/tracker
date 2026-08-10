import { describe, expect, it } from 'vitest';
import { calculateCategoryTotals, calculateMonthSummary } from './calculations';
import type { Account, Category, MoneyTransaction } from './types';

const accounts: Account[] = [
  { id: 'axis', name: 'Axis', institution: 'Axis', type: 'bank', color: '#000', monthlyBudgetPaise: 4_500_000 },
];

const transaction = (overrides: Partial<MoneyTransaction>): MoneyTransaction => ({
  id: crypto.randomUUID(),
  kind: 'expense',
  status: 'cleared',
  date: '2026-08-03',
  amountPaise: 100_000,
  accountId: 'axis',
  categoryId: 'food',
  paymentMethod: 'upi',
  merchant: 'Test',
  note: '',
  createdAt: '2026-08-03T00:00:00.000Z',
  updatedAt: '2026-08-03T00:00:00.000Z',
  ...overrides,
});

describe('calculateMonthSummary', () => {
  it('separates income, cleared expenses, and pending expenses', () => {
    const result = calculateMonthSummary(
      [
        transaction({ amountPaise: 1_000_000 }),
        transaction({ amountPaise: 200_000, status: 'pending' }),
        transaction({ amountPaise: 5_000_000, kind: 'income' }),
      ],
      accounts,
      '2026-08',
      new Date(2026, 7, 10),
    );
    expect(result.spentPaise).toBe(1_000_000);
    expect(result.pendingPaise).toBe(200_000);
    expect(result.incomePaise).toBe(5_000_000);
    expect(result.netPaise).toBe(4_000_000);
  });

  it('prioritizes over-budget status', () => {
    const result = calculateMonthSummary(
      [transaction({ amountPaise: 5_000_000 })],
      accounts,
      '2026-08',
      new Date(2026, 7, 10),
    );
    expect(result.status).toBe('over');
  });

  it('excludes records outside the selected month', () => {
    const result = calculateMonthSummary(
      [transaction({ amountPaise: 250_000 }), transaction({ date: '2026-07-31', amountPaise: 900_000 })],
      accounts,
      '2026-08',
      new Date(2026, 7, 10),
    );
    expect(result.spentPaise).toBe(250_000);
  });

  it('calculates category totals without pending expenses', () => {
    const categories: Category[] = [
      { id: 'food', name: 'Food', icon: 'food', color: '#000', monthlyBudgetPaise: 500_000, group: 'living' },
    ];
    const result = calculateCategoryTotals(
      [transaction({ amountPaise: 125_000 }), transaction({ amountPaise: 200_000, status: 'pending' })],
      categories,
      '2026-08',
    );
    expect(result[0].spentPaise).toBe(125_000);
    expect(result[0].budgetUsed).toBe(25);
  });
});
