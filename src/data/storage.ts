import { openDB } from 'idb';
import { z } from 'zod';
import type { AppData } from '../domain/types';
import { createDefaultData } from './defaultData';

const DB_NAME = 'paisa-money-tracker';
const STORE_NAME = 'app-state';
const STATE_KEY = 'primary';

const nonnegativeMoney = z.number().int().nonnegative();
const positiveMoney = z.number().int().positive();

const appDataSchema = z.object({
  version: z.literal(5),
  updatedAt: z.string(),
  accounts: z.array(z.object({
    id: z.string(), name: z.string(), institution: z.string(), type: z.enum(['bank', 'cash', 'credit_card']),
    color: z.string(), monthlyBudgetPaise: nonnegativeMoney,
    creditCard: z.object({
      limitPaise: positiveMoney, targetUtilizationPercent: z.number().min(1).max(100), openingBalancePaise: nonnegativeMoney,
      statementDay: z.number().int().min(1).max(31), dueDay: z.number().int().min(1).max(31),
    }).optional(),
    archived: z.boolean().optional(),
  })),
  categories: z.array(z.object({
    id: z.string(), name: z.string(), icon: z.string(), color: z.string(),
    monthlyBudgetPaise: nonnegativeMoney,
    group: z.enum(['income', 'living', 'funds', 'investments', 'wants', 'travel', 'business', 'liability']),
    archived: z.boolean().optional(),
  })),
  transactions: z.array(z.object({
    id: z.string(), kind: z.enum(['expense', 'income', 'fund_contribution', 'investment', 'liability_payment']), status: z.enum(['cleared', 'pending']),
    date: z.string(), amountPaise: positiveMoney, accountId: z.string(), destinationAccountId: z.string().optional(), categoryId: z.string(),
    paymentMethod: z.enum(['upi', 'card', 'debit', 'cash', 'bank']), merchant: z.string(), note: z.string(),
    createdAt: z.string(), updatedAt: z.string(),
  })),
  recurringPayments: z.array(z.object({
    id: z.string(), name: z.string(), amountPaise: z.number().int().positive(), categoryId: z.string(),
    accountId: z.string(), dayOfMonth: z.number().int().min(1).max(31), active: z.boolean(),
  })),
  goals: z.array(z.object({
    id: z.string(), name: z.string(), targetPaise: positiveMoney, savedPaise: nonnegativeMoney,
    targetDate: z.string().optional(), color: z.string(),
  })),
  preferences: z.object({
    userName: z.string(), currency: z.literal('INR'), theme: z.enum(['light', 'dark', 'system']),
    monthStartDay: z.number().int().min(1).max(28), seeded: z.boolean(),
  }),
  plan: z.object({
    monthlySalaryPaise: positiveMoney,
    salaryAllocations: z.array(z.object({
      id: z.enum(['living', 'funds', 'investments', 'wants']), name: z.string(), plannedPaise: nonnegativeMoney, color: z.string(),
    })),
    emergencyTargetMinPaise: nonnegativeMoney,
    emergencyTargetMaxPaise: nonnegativeMoney,
    monthlyInvestmentTargetPaise: nonnegativeMoney,
    vietnamTargetPaise: nonnegativeMoney,
    vietnamCashTargetPaise: nonnegativeMoney,
    oneTimeIncome: z.object({
      name: z.string(), grossPaise: nonnegativeMoney, actualNetPaise: nonnegativeMoney, expectedDate: z.string(),
      loanPrepaymentPaise: nonnegativeMoney, vietnamPaise: nonnegativeMoney,
    }),
    sideHustle: z.object({
      grossReceivedPaise: nonnegativeMoney, taxReservePaise: nonnegativeMoney, businessCostsPaise: nonnegativeMoney,
      emergencyAllocationPaise: nonnegativeMoney, investmentAllocationPaise: nonnegativeMoney,
      businessReinvestmentPaise: nonnegativeMoney, goalsAllocationPaise: nonnegativeMoney,
    }),
    obligations: z.array(z.object({
      id: z.string(), name: z.string(), type: z.enum(['emi', 'loan', 'credit_card']), monthlyPaymentPaise: nonnegativeMoney,
      remainingPaise: nonnegativeMoney.nullable(), prepaymentTargetPaise: nonnegativeMoney, dueDay: z.number().int().min(1).max(31),
      active: z.boolean(), releasesTo: z.enum(['investments', 'funds']),
    })),
    funds: z.array(z.object({
      id: z.enum(['emergency', 'vietnam', 'short-term', 'wants-rollover', 'tax-reserve', 'business']),
      name: z.string(), targetPaise: nonnegativeMoney, openingBalancePaise: nonnegativeMoney, deadline: z.string().optional(), color: z.string(),
    })),
    timeline: z.array(z.object({
      id: z.string(), label: z.string(), dateLabel: z.string(), amountPaise: nonnegativeMoney.optional(),
      status: z.enum(['planned', 'funded', 'completed']), description: z.string(),
    })),
    priorities: z.array(z.string()),
    sectionConfigs: z.array(z.object({
      id: z.enum(['salary', 'living', 'cards', 'funds', 'one-time', 'side-hustle', 'obligations', 'timeline', 'priorities']),
      title: z.string().min(1), subtitle: z.string(), visible: z.boolean(), scope: z.enum(['always', 'month']),
      monthKey: z.string().optional(), order: z.number().int(),
    })),
    customSections: z.array(z.object({
      id: z.string(), title: z.string().min(1), subtitle: z.string(), kind: z.enum(['budget', 'goal', 'checklist']),
      color: z.string(), scope: z.enum(['always', 'month']), monthKey: z.string().optional(), order: z.number().int(),
      items: z.array(z.object({
        id: z.string(), label: z.string().min(1), plannedPaise: nonnegativeMoney, actualPaise: nonnegativeMoney, completed: z.boolean(),
      })),
    })),
  }),
  workspace: z.object({
    activePageId: z.string(),
    dashboardPageId: z.string().optional(),
    pages: z.array(z.object({
      id: z.string(), title: z.string().min(1), icon: z.string(), coverColor: z.string(), description: z.string(),
      archived: z.boolean(), createdAt: z.string(), updatedAt: z.string(),
      blocks: z.array(z.object({
        id: z.string(), kind: z.enum(['text', 'callout', 'kpi', 'checklist', 'collection', 'transactions', 'chart', 'budget', 'accounts', 'goals']),
        title: z.string(), content: z.string(), color: z.string(), width: z.enum(['full', 'half']), order: z.number().int(),
        metric: z.enum(['spent', 'income', 'remaining', 'transactions', 'funds', 'investments']).optional(),
        collectionView: z.enum(['table', 'board', 'calendar', 'cards']).optional(),
        items: z.array(z.object({
          id: z.string(), title: z.string().min(1), amountPaise: nonnegativeMoney,
          status: z.enum(['not_started', 'in_progress', 'done']), date: z.string().optional(), note: z.string(),
        })),
      })),
    })),
  }),
});

const database = () => openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
  },
});

const normalizeAppData = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') return value;
  const saved = value as Record<string, unknown>;
  if (saved.version === 2) return migrateVersionTwo(saved);
  if (saved.version === 3) return migrateVersionThree(saved);
  if (saved.version === 4) return migrateVersionFour(saved);
  return saved;
};

export const validateAppData = (value: unknown): AppData => appDataSchema.parse(normalizeAppData(value)) as AppData;

export const loadAppData = async (): Promise<AppData> => {
  const db = await database();
  const saved = await db.get(STORE_NAME, STATE_KEY);
  if (!saved) {
    const defaults = createDefaultData();
    await db.put(STORE_NAME, defaults, STATE_KEY);
    return defaults;
  }
  const candidate = normalizeAppData(saved);
  const result = appDataSchema.safeParse(candidate);
  if (result.success) {
    if (saved?.version === 2 || saved?.version === 3 || saved?.version === 4) await db.put(STORE_NAME, result.data, STATE_KEY);
    return result.data as AppData;
  }
  console.error('Stored Paisa data could not be read. Loading safe defaults.', result.error);
  return createDefaultData();
};

const migrateVersionTwo = (saved: Record<string, unknown>): AppData => {
  const defaults = createDefaultData();
  const legacyTransactions = Array.isArray(saved.transactions) ? saved.transactions : [];
  const accountMap: Record<string, string> = { axis: 'axis-card', sbi: 'sbi-card', cash: 'cash' };
  const categoryMap: Record<string, string> = { income: 'salary', housing: 'rent', emi: 'education-emi' };
  const transactions = legacyTransactions.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const transaction = item as Record<string, unknown>;
    if (typeof transaction.id !== 'string' || typeof transaction.amountPaise !== 'number') return [];
    return [{
      ...transaction,
      kind: transaction.kind === 'income' ? 'income' as const : 'expense' as const,
      accountId: accountMap[String(transaction.accountId)] ?? 'cash',
      categoryId: categoryMap[String(transaction.categoryId)] ?? String(transaction.categoryId),
    }];
  });
  const legacyPreferences = saved.preferences && typeof saved.preferences === 'object' ? saved.preferences as Record<string, unknown> : {};
  return {
    ...defaults,
    preferences: {
      ...defaults.preferences,
      userName: typeof legacyPreferences.userName === 'string' ? legacyPreferences.userName : defaults.preferences.userName,
      theme: legacyPreferences.theme === 'dark' || legacyPreferences.theme === 'system' ? legacyPreferences.theme : 'light',
    },
    transactions: transactions as AppData['transactions'],
    updatedAt: new Date().toISOString(),
  };
};

const migrateVersionThree = (saved: Record<string, unknown>): AppData => {
  const defaults = createDefaultData();
  const legacyPlan = saved.plan && typeof saved.plan === 'object' ? saved.plan as Record<string, unknown> : {};
  return {
    ...defaults,
    ...saved,
    version: 5,
    plan: {
      ...defaults.plan,
      ...legacyPlan,
      sectionConfigs: defaults.plan.sectionConfigs,
      customSections: [],
    },
    updatedAt: new Date().toISOString(),
  } as AppData;
};

const migrateVersionFour = (saved: Record<string, unknown>): AppData => {
  const defaults = createDefaultData();
  return {
    ...defaults,
    ...saved,
    version: 5,
    workspace: defaults.workspace,
    updatedAt: new Date().toISOString(),
  } as AppData;
};

export const saveAppData = async (data: AppData): Promise<void> => {
  const validated = validateAppData(data);
  const db = await database();
  await db.put(STORE_NAME, validated, STATE_KEY);
};

export const exportJson = (data: AppData): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `paisa-backup-${new Date().toISOString().slice(0, 10)}.json`);
};

const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

export const exportCsv = (data: AppData): void => {
  const accountById = new Map(data.accounts.map((account) => [account.id, account.name]));
  const categoryById = new Map(data.categories.map((category) => [category.id, category.name]));
  const rows = [
    ['Date', 'Type', 'Status', 'Merchant', 'Category', 'Account', 'Destination', 'Payment Method', 'Amount (INR)', 'Notes'],
    ...data.transactions.map((transaction) => [
      transaction.date,
      transaction.kind,
      transaction.status,
      transaction.merchant,
      categoryById.get(transaction.categoryId) ?? transaction.categoryId,
      accountById.get(transaction.accountId) ?? transaction.accountId,
      transaction.destinationAccountId ? accountById.get(transaction.destinationAccountId) ?? transaction.destinationAccountId : '',
      transaction.paymentMethod,
      (transaction.amountPaise / 100).toFixed(2),
      transaction.note,
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `paisa-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
};

const downloadBlob = (blob: Blob, name: string) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
};
