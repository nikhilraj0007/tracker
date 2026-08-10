import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Gauge,
  Sparkles,
  Target,
  Wallet,
} from 'lucide-react';
import { calculateCategoryTotals, calculateCreditCards, calculateFundProgress, calculateMonthSummary, transactionsForMonth } from '../domain/calculations';
import { formatMoney, formatPercent } from '../domain/money';
import type { AppData, MoneyTransaction } from '../domain/types';
import { CategoryIcon } from '../components/CategoryIcon';
import { TransactionList } from '../components/TransactionList';

interface DashboardProps {
  data: AppData;
  monthKey: string;
  onNavigate: (view: 'transactions' | 'budgets' | 'analysis') => void;
  onCustomize: () => void;
  onEditTransaction: (transaction: MoneyTransaction) => void;
}

const buildDailySeries = (data: AppData, monthKey: string, budgetPaise: number) => {
  const [year, month] = monthKey.split('-').map(Number);
  const days = new Date(year, month, 0).getDate();
  const expenses = transactionsForMonth(data.transactions, monthKey).filter(
    (transaction) => transaction.kind === 'expense' && transaction.status === 'cleared',
  );
  let running = 0;
  return Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    running += expenses
      .filter((transaction) => Number(transaction.date.slice(8, 10)) === day)
      .reduce((total, transaction) => total + transaction.amountPaise, 0);
    return { day: String(day), spent: Math.round(running / 100), guide: Math.round((budgetPaise / 100 / days) * day) };
  });
};

export function Dashboard({ data, monthKey, onNavigate, onCustomize, onEditTransaction }: DashboardProps) {
  const livingBudget = data.plan.salaryAllocations.find((item) => item.id === 'living')?.plannedPaise ?? 0;
  const summary = calculateMonthSummary(data.transactions, data.accounts, monthKey, new Date(), livingBudget);
  const categories = calculateCategoryTotals(data.transactions, data.categories, monthKey);
  const monthTransactions = transactionsForMonth(data.transactions, monthKey).sort((a, b) => b.date.localeCompare(a.date));
  const chartData = buildDailySeries(data, monthKey, livingBudget);
  const chartMax = Math.max(1, ...chartData.flatMap((point) => [point.spent, point.guide]));
  const chartPoints = (key: 'spent' | 'guide') => chartData.map((point, index) => {
    const x = (index / Math.max(1, chartData.length - 1)) * 700;
    const y = 190 - (point[key] / chartMax) * 170;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const goal = calculateFundProgress(data).find((fund) => fund.id === 'emergency');
  const goalPercent = goal?.percent ?? 0;
  const creditCards = calculateCreditCards(data);
  const healthLabels = {
    healthy: ['On track', 'Your pace is comfortably within plan.'],
    watch: ['Keep an eye', 'Spending pace is nearing your plan.'],
    risk: ['Needs attention', 'Current pace may cross your budget.'],
    over: ['Over budget', 'Review flexible categories this month.'],
  } as const;

  return (
    <div className="dashboard-grid">
      <section className="dashboard-customize-bar">
        <div><Sparkles size={17} /><span><strong>Make Overview yours</strong><small>Turn any Workspace page into this dashboard.</small></span></div>
        <button className="soft-button" onClick={onCustomize}>Customize dashboard <ArrowRight size={15} /></button>
      </section>
      <section className="hero-card">
        <div className="hero-topline">
          <span>Monthly spending</span>
          <span className={`health-badge ${summary.status}`}>
            {summary.status === 'healthy' ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}
            {healthLabels[summary.status][0]}
          </span>
        </div>
        <div className="hero-amount-row">
          <div>
            <strong className="hero-amount">{formatMoney(summary.spentPaise)}</strong>
            <span className="hero-budget">of {formatMoney(summary.budgetPaise)} planned</span>
          </div>
          <div className="hero-percent">{formatPercent(summary.utilization)}</div>
        </div>
        <div className="hero-progress" role="progressbar" aria-valuenow={Math.round(summary.utilization)} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${Math.min(100, summary.utilization)}%` }} />
        </div>
        <div className="hero-insights">
          <div><span>Available</span><strong>{formatMoney(summary.remainingPaise)}</strong></div>
          <div><span>Daily average</span><strong>{formatMoney(summary.dailyAveragePaise)}</strong></div>
          <div><span>Projected</span><strong>{formatMoney(summary.projectedPaise)}</strong></div>
          <div><span>Days left</span><strong>{summary.daysRemaining}</strong></div>
        </div>
      </section>

      <section className="health-card">
        <div className="card-heading inline">
          <div>
            <p className="eyebrow">Paisa pulse</p>
            <h2>{healthLabels[summary.status][0]}</h2>
          </div>
          <span className={`pulse-icon ${summary.status}`}><Gauge size={21} /></span>
        </div>
        <p>{healthLabels[summary.status][1]}</p>
        <div className="pulse-callout">
          <Sparkles size={17} />
          <span>
            {summary.pendingPaise > 0
              ? `${formatMoney(summary.pendingPaise)} is still pending.`
              : `You can spend ${formatMoney(Math.max(0, Math.round(summary.remainingPaise / Math.max(1, summary.daysRemaining))))} per day.`}
          </span>
        </div>
        <button className="text-button light" onClick={() => onNavigate('analysis')}>See full insight <ArrowRight size={16} /></button>
      </section>

      <section className="metric-card">
        <span className="metric-icon income"><ArrowDownRight size={19} /></span>
        <span className="metric-label">Income</span>
        <strong>{formatMoney(summary.incomePaise)}</strong>
        <small><span className="positive-copy">Cleared</span> this month</small>
      </section>
      <section className="metric-card">
        <span className="metric-icon expense"><ArrowUpRight size={19} /></span>
        <span className="metric-label">Spent</span>
        <strong>{formatMoney(summary.spentPaise)}</strong>
        <small>{formatPercent(summary.utilization)} of monthly plan</small>
      </section>
      <section className="metric-card">
        <span className="metric-icon balance"><Wallet size={19} /></span>
        <span className="metric-label">Net cash flow</span>
        <strong>{formatMoney(summary.netPaise)}</strong>
        <small>Income less cleared spend</small>
      </section>
      <section className="metric-card">
        <span className="metric-icon pending"><CalendarClock size={19} /></span>
        <span className="metric-label">Pending</span>
        <strong>{formatMoney(summary.pendingPaise)}</strong>
        <small>Not included in actual spend</small>
      </section>

      <section className="panel spending-trend">
        <div className="card-heading inline">
          <div><p className="eyebrow">Cash rhythm</p><h2>Spending pace</h2></div>
          <button className="soft-button" onClick={() => onNavigate('analysis')}>View report</button>
        </div>
        <div className="chart-legend"><span><i className="legend-solid" /> Actual spend</span><span><i className="legend-dashed" /> Budget pace</span></div>
        <div className="chart-wrap">
          <svg className="native-chart" viewBox="0 0 700 220" role="img" aria-label="Cumulative spending compared with the monthly budget pace">
            <defs><linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1b5947" stopOpacity=".22" /><stop offset="100%" stopColor="#1b5947" stopOpacity="0" /></linearGradient></defs>
            {[20, 76, 132, 188].map((y) => <line key={y} x1="0" y1={y} x2="700" y2={y} className="chart-grid-line" />)}
            <polygon points={`0,190 ${chartPoints('spent')} 700,190`} fill="url(#spendFill)" />
            <polyline points={chartPoints('guide')} className="budget-line" />
            <polyline points={chartPoints('spent')} className="spend-line" />
            {[1, 6, 11, 16, 21, 26, chartData.length].filter((value, index, list) => list.indexOf(value) === index && value <= chartData.length).map((label) => {
              const x = ((label - 1) / Math.max(1, chartData.length - 1)) * 700;
              return <text key={label} x={x} y="215" textAnchor={label === 1 ? 'start' : label === chartData.length ? 'end' : 'middle'}>{label}</text>;
            })}
          </svg>
        </div>
      </section>

      <section className="panel category-panel">
        <div className="card-heading inline">
          <div><p className="eyebrow">Where it went</p><h2>Top categories</h2></div>
          <button className="text-button" onClick={() => onNavigate('budgets')}>All budgets <ArrowRight size={15} /></button>
        </div>
        <div className="category-list">
          {categories.slice(0, 5).map((category) => (
            <div className="category-row" key={category.id}>
              <span className="category-icon" style={{ background: `${category.color}18`, color: category.color }}>
                <CategoryIcon name={category.icon} />
              </span>
              <div className="category-detail">
                <span><strong>{category.name}</strong><small>{formatPercent(category.percentageOfSpend)} of spend</small></span>
                <div className="slim-progress"><i style={{ width: `${Math.min(100, category.budgetUsed)}%`, background: category.color }} /></div>
              </div>
              <strong className="category-value">{formatMoney(category.spentPaise)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel accounts-panel">
        <div className="card-heading inline"><div><p className="eyebrow">Payment capacity</p><h2>Credit position</h2></div></div>
        <div className="account-stack">
          {creditCards.map((card) => {
            const account = card.account;
            return (
              <div className="account-row" key={account.id}>
                <span className="account-mark" style={{ background: account.color }}>{account.name.slice(0, 1)}</span>
                <div><strong>{account.name}</strong><span>{formatMoney(card.outstandingPaise)} of {formatMoney(account.creditCard!.limitPaise)} · target {formatMoney(card.disciplineTargetPaise)}</span></div>
                <span className="account-percent">{formatPercent(card.utilizationPercent)}</span>
              </div>
            );
          })}
        </div>
      </section>

      {goal && (
        <section className="goal-card">
          <div className="goal-copy">
            <span className="goal-icon"><Target size={21} /></span>
            <div><p className="eyebrow">Savings goal</p><h2>{goal.name}</h2></div>
          </div>
          <strong>{formatMoney(goal.balancePaise)} <small>of {formatMoney(goal.targetPaise)}</small></strong>
          <div className="goal-progress"><span style={{ width: `${Math.min(100, goalPercent)}%` }} /></div>
          <div className="goal-footer"><span>{formatPercent(goalPercent)} funded</span><span>{formatMoney(goal.remainingPaise)} to go</span></div>
        </section>
      )}

      <section className="panel recent-panel">
        <div className="card-heading inline">
          <div><p className="eyebrow">Latest activity</p><h2>Recent transactions</h2></div>
          <button className="text-button" onClick={() => onNavigate('transactions')}>View all <ArrowRight size={15} /></button>
        </div>
        <TransactionList transactions={monthTransactions} accounts={data.accounts} categories={data.categories} limit={5} onEdit={onEditTransaction} />
      </section>
    </div>
  );
}
