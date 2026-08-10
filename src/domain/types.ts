export type TransactionKind = 'expense' | 'income' | 'fund_contribution' | 'investment' | 'liability_payment';
export type TransactionStatus = 'cleared' | 'pending';
export type PaymentMethod = 'upi' | 'card' | 'debit' | 'cash' | 'bank';

export interface CreditCardDetails {
  limitPaise: number;
  targetUtilizationPercent: number;
  openingBalancePaise: number;
  statementDay: number;
  dueDay: number;
}

export interface Account {
  id: string;
  name: string;
  institution: string;
  type: 'bank' | 'cash' | 'credit_card';
  color: string;
  monthlyBudgetPaise: number;
  creditCard?: CreditCardDetails;
  archived?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthlyBudgetPaise: number;
  group: 'income' | 'living' | 'funds' | 'investments' | 'wants' | 'travel' | 'business' | 'liability';
  archived?: boolean;
}

export interface MoneyTransaction {
  id: string;
  kind: TransactionKind;
  status: TransactionStatus;
  date: string;
  amountPaise: number;
  accountId: string;
  destinationAccountId?: string;
  categoryId: string;
  paymentMethod: PaymentMethod;
  merchant: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringPayment {
  id: string;
  name: string;
  amountPaise: number;
  categoryId: string;
  accountId: string;
  dayOfMonth: number;
  active: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetPaise: number;
  savedPaise: number;
  targetDate?: string;
  color: string;
}

export interface SalaryAllocation {
  id: 'living' | 'funds' | 'investments' | 'wants';
  name: string;
  plannedPaise: number;
  color: string;
}

export interface DedicatedFund {
  id: 'emergency' | 'vietnam' | 'short-term' | 'wants-rollover' | 'tax-reserve' | 'business';
  name: string;
  targetPaise: number;
  openingBalancePaise: number;
  deadline?: string;
  color: string;
}

export interface FinancialObligation {
  id: string;
  name: string;
  type: 'emi' | 'loan' | 'credit_card';
  monthlyPaymentPaise: number;
  remainingPaise: number | null;
  prepaymentTargetPaise: number;
  dueDay: number;
  active: boolean;
  releasesTo: 'investments' | 'funds';
}

export interface OneTimeIncomePlan {
  name: string;
  grossPaise: number;
  actualNetPaise: number;
  expectedDate: string;
  loanPrepaymentPaise: number;
  vietnamPaise: number;
}

export interface SideHustlePlan {
  grossReceivedPaise: number;
  taxReservePaise: number;
  businessCostsPaise: number;
  emergencyAllocationPaise: number;
  investmentAllocationPaise: number;
  businessReinvestmentPaise: number;
  goalsAllocationPaise: number;
}

export interface TimelineEvent {
  id: string;
  label: string;
  dateLabel: string;
  amountPaise?: number;
  status: 'planned' | 'funded' | 'completed';
  description: string;
}

export type SystemPlanSectionId = 'salary' | 'living' | 'cards' | 'funds' | 'one-time' | 'side-hustle' | 'obligations' | 'timeline' | 'priorities';
export type PlanSectionScope = 'always' | 'month';

export interface PlanSectionConfig {
  id: SystemPlanSectionId;
  title: string;
  subtitle: string;
  visible: boolean;
  scope: PlanSectionScope;
  monthKey?: string;
  order: number;
}

export type CustomSectionKind = 'budget' | 'goal' | 'checklist';

export interface CustomPlanItem {
  id: string;
  label: string;
  plannedPaise: number;
  actualPaise: number;
  completed: boolean;
}

export interface CustomPlanSection {
  id: string;
  title: string;
  subtitle: string;
  kind: CustomSectionKind;
  color: string;
  scope: PlanSectionScope;
  monthKey?: string;
  order: number;
  items: CustomPlanItem[];
}

export type WorkspaceBlockKind = 'text' | 'callout' | 'kpi' | 'checklist' | 'collection' | 'transactions' | 'chart' | 'budget' | 'accounts' | 'goals';
export type WorkspaceBlockWidth = 'full' | 'half';
export type WorkspaceCollectionView = 'table' | 'board' | 'calendar' | 'cards';
export type WorkspaceMetric = 'spent' | 'income' | 'remaining' | 'transactions' | 'funds' | 'investments';

export interface WorkspaceItem {
  id: string;
  title: string;
  amountPaise: number;
  status: 'not_started' | 'in_progress' | 'done';
  date?: string;
  note: string;
}

export interface WorkspaceBlock {
  id: string;
  kind: WorkspaceBlockKind;
  title: string;
  content: string;
  color: string;
  width: WorkspaceBlockWidth;
  order: number;
  metric?: WorkspaceMetric;
  collectionView?: WorkspaceCollectionView;
  items: WorkspaceItem[];
}

export interface WorkspacePage {
  id: string;
  title: string;
  icon: string;
  coverColor: string;
  description: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  blocks: WorkspaceBlock[];
}

export interface WorkspaceState {
  activePageId: string;
  dashboardPageId?: string;
  pages: WorkspacePage[];
}

export interface FinancialPlan {
  monthlySalaryPaise: number;
  salaryAllocations: SalaryAllocation[];
  emergencyTargetMinPaise: number;
  emergencyTargetMaxPaise: number;
  monthlyInvestmentTargetPaise: number;
  vietnamTargetPaise: number;
  vietnamCashTargetPaise: number;
  oneTimeIncome: OneTimeIncomePlan;
  sideHustle: SideHustlePlan;
  obligations: FinancialObligation[];
  funds: DedicatedFund[];
  timeline: TimelineEvent[];
  priorities: string[];
  sectionConfigs: PlanSectionConfig[];
  customSections: CustomPlanSection[];
}

export interface AppPreferences {
  userName: string;
  currency: 'INR';
  theme: 'light' | 'dark' | 'system';
  monthStartDay: number;
  seeded: boolean;
}

export interface AppData {
  version: 5;
  updatedAt: string;
  accounts: Account[];
  categories: Category[];
  transactions: MoneyTransaction[];
  recurringPayments: RecurringPayment[];
  goals: SavingsGoal[];
  plan: FinancialPlan;
  workspace: WorkspaceState;
  preferences: AppPreferences;
}

export type AppView = 'dashboard' | 'transactions' | 'budgets' | 'workspace' | 'analysis' | 'settings';
