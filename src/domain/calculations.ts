import type { Account, AppData, Category, DedicatedFund, MoneyTransaction, SalaryAllocation } from './types';

export interface MonthSummary {
  incomePaise: number;
  spentPaise: number;
  pendingPaise: number;
  netPaise: number;
  budgetPaise: number;
  remainingPaise: number;
  utilization: number;
  dailyAveragePaise: number;
  projectedPaise: number;
  daysElapsed: number;
  daysInMonth: number;
  daysRemaining: number;
  status: 'healthy' | 'watch' | 'risk' | 'over';
}

export const monthKeyForDate = (date: string): string => date.slice(0, 7);

export const transactionsForMonth = (transactions: MoneyTransaction[], monthKey: string) =>
  transactions.filter((transaction) => monthKeyForDate(transaction.date) === monthKey);

export const calculateMonthSummary = (
  transactions: MoneyTransaction[],
  accounts: Account[],
  monthKey: string,
  today = new Date(),
  monthlyBudgetOverridePaise?: number,
): MonthSummary => {
  const monthTransactions = transactionsForMonth(transactions, monthKey);
  const cleared = monthTransactions.filter((transaction) => transaction.status === 'cleared');
  const incomePaise = cleared
    .filter((transaction) => transaction.kind === 'income')
    .reduce((total, transaction) => total + transaction.amountPaise, 0);
  const spentPaise = cleared
    .filter((transaction) => transaction.kind === 'expense')
    .reduce((total, transaction) => total + transaction.amountPaise, 0);
  const pendingPaise = monthTransactions
    .filter((transaction) => transaction.kind === 'expense' && transaction.status === 'pending')
    .reduce((total, transaction) => total + transaction.amountPaise, 0);
  const budgetPaise = monthlyBudgetOverridePaise ?? accounts
    .filter((account) => !account.archived)
    .reduce((total, account) => total + account.monthlyBudgetPaise, 0);

  const [year, month] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const daysElapsed = monthKey === currentMonthKey ? Math.max(1, Math.min(today.getDate(), daysInMonth)) : daysInMonth;
  const daysRemaining = Math.max(0, daysInMonth - daysElapsed);
  const dailyAveragePaise = Math.round(spentPaise / daysElapsed);
  const projectedPaise = Math.round(dailyAveragePaise * daysInMonth);
  const utilization = budgetPaise === 0 ? 0 : (spentPaise / budgetPaise) * 100;
  const projectedUtilization = budgetPaise === 0 ? 0 : (projectedPaise / budgetPaise) * 100;

  let status: MonthSummary['status'] = 'healthy';
  if (spentPaise > budgetPaise && budgetPaise > 0) status = 'over';
  else if (projectedUtilization > 100 || utilization >= 85) status = 'risk';
  else if (projectedUtilization >= 90 || utilization >= 70) status = 'watch';

  return {
    incomePaise,
    spentPaise,
    pendingPaise,
    netPaise: incomePaise - spentPaise,
    budgetPaise,
    remainingPaise: budgetPaise - spentPaise,
    utilization,
    dailyAveragePaise,
    projectedPaise,
    daysElapsed,
    daysInMonth,
    daysRemaining,
    status,
  };
};

export interface CategoryTotal extends Category {
  spentPaise: number;
  percentageOfSpend: number;
  budgetUsed: number;
}

export const calculateCategoryTotals = (
  transactions: MoneyTransaction[],
  categories: Category[],
  monthKey: string,
): CategoryTotal[] => {
  const expenses = transactionsForMonth(transactions, monthKey).filter(
    (transaction) => transaction.kind === 'expense' && transaction.status === 'cleared',
  );
  const totalSpent = expenses.reduce((total, transaction) => total + transaction.amountPaise, 0);

  return categories
    .map((category) => {
      const spentPaise = expenses
        .filter((transaction) => transaction.categoryId === category.id)
        .reduce((total, transaction) => total + transaction.amountPaise, 0);
      return {
        ...category,
        spentPaise,
        percentageOfSpend: totalSpent === 0 ? 0 : (spentPaise / totalSpent) * 100,
        budgetUsed: category.monthlyBudgetPaise === 0 ? 0 : (spentPaise / category.monthlyBudgetPaise) * 100,
      };
    })
    .filter((category) => category.spentPaise > 0 || category.monthlyBudgetPaise > 0)
    .sort((a, b) => b.spentPaise - a.spentPaise);
};

export const calculateAccountSpend = (
  transactions: MoneyTransaction[],
  accountId: string,
  monthKey: string,
) =>
  transactionsForMonth(transactions, monthKey)
    .filter(
      (transaction) =>
        transaction.accountId === accountId && transaction.kind === 'expense' && transaction.status === 'cleared',
    )
    .reduce((total, transaction) => total + transaction.amountPaise, 0);

export interface AllocationProgress extends SalaryAllocation {
  actualPaise: number;
  remainingPaise: number;
  percent: number;
}

export const calculateAllocationProgress = (data: AppData, monthKey: string): AllocationProgress[] => {
  const transactions = transactionsForMonth(data.transactions, monthKey).filter((item) => item.status === 'cleared');
  const categoryById = new Map(data.categories.map((category) => [category.id, category]));
  return data.plan.salaryAllocations.map((allocation) => {
    const actualPaise = transactions.reduce((total, transaction) => {
      const category = categoryById.get(transaction.categoryId);
      if (!category) return total;
      if (allocation.id === 'living' && transaction.kind === 'expense' && category.group === 'living') return total + transaction.amountPaise;
      if (allocation.id === 'wants' && transaction.kind === 'expense' && category.group === 'wants') return total + transaction.amountPaise;
      if (allocation.id === 'funds' && transaction.kind === 'fund_contribution') return total + transaction.amountPaise;
      if (allocation.id === 'investments' && transaction.kind === 'investment') return total + transaction.amountPaise;
      return total;
    }, 0);
    return {
      ...allocation,
      actualPaise,
      remainingPaise: allocation.plannedPaise - actualPaise,
      percent: allocation.plannedPaise === 0 ? 0 : (actualPaise / allocation.plannedPaise) * 100,
    };
  });
};

export interface CreditCardSummary {
  account: Account;
  chargesPaise: number;
  paymentsPaise: number;
  outstandingPaise: number;
  utilizationPercent: number;
  disciplineTargetPaise: number;
  aboveTarget: boolean;
}

export const calculateCreditCards = (data: AppData): CreditCardSummary[] => {
  return data.accounts.filter((account) => account.type === 'credit_card' && account.creditCard).map((account) => {
    const chargesPaise = data.transactions
      .filter((transaction) => transaction.status === 'cleared' && transaction.kind === 'expense' && transaction.accountId === account.id)
      .reduce((total, transaction) => total + transaction.amountPaise, 0);
    const paymentsPaise = data.transactions
      .filter((transaction) => transaction.status === 'cleared' && transaction.kind === 'liability_payment' && transaction.destinationAccountId === account.id)
      .reduce((total, transaction) => total + transaction.amountPaise, 0);
    const outstandingPaise = Math.max(0, account.creditCard!.openingBalancePaise + chargesPaise - paymentsPaise);
    const disciplineTargetPaise = Math.round(account.creditCard!.limitPaise * account.creditCard!.targetUtilizationPercent / 100);
    const utilizationPercent = (outstandingPaise / account.creditCard!.limitPaise) * 100;
    return { account, chargesPaise, paymentsPaise, outstandingPaise, utilizationPercent, disciplineTargetPaise, aboveTarget: outstandingPaise > disciplineTargetPaise };
  });
};

const fundCategoryIds: Record<DedicatedFund['id'], string[]> = {
  emergency: ['emergency-fund'],
  vietnam: ['vietnam'],
  'short-term': ['short-term-goals'],
  'wants-rollover': ['wants'],
  'tax-reserve': ['tax-reserve'],
  business: ['business'],
};

export interface FundProgress extends DedicatedFund {
  contributedPaise: number;
  balancePaise: number;
  remainingPaise: number;
  percent: number;
}

export const calculateFundProgress = (data: AppData): FundProgress[] => data.plan.funds.map((fund) => {
  const contributedPaise = data.transactions
    .filter((transaction) => transaction.status === 'cleared' && transaction.kind === 'fund_contribution' && fundCategoryIds[fund.id].includes(transaction.categoryId))
    .reduce((total, transaction) => total + transaction.amountPaise, 0);
  const balancePaise = fund.openingBalancePaise + contributedPaise;
  return {
    ...fund,
    contributedPaise,
    balancePaise,
    remainingPaise: Math.max(0, fund.targetPaise - balancePaise),
    percent: fund.targetPaise === 0 ? 0 : (balancePaise / fund.targetPaise) * 100,
  };
});

export const calculateSideHustleNet = (data: AppData): number => {
  const side = data.plan.sideHustle;
  return Math.max(0, side.grossReceivedPaise - side.taxReservePaise - side.businessCostsPaise);
};

export const calculateOneTimeUnallocated = (data: AppData): number => {
  const oneTime = data.plan.oneTimeIncome;
  return oneTime.actualNetPaise - oneTime.loanPrepaymentPaise - oneTime.vietnamPaise;
};
