import { BarChart3, CalendarDays, LayoutDashboard, Pencil, RotateCcw, WalletCards } from 'lucide-react';
import { CategoryIcon } from '../components/CategoryIcon';
import { calculateCategoryTotals, calculateCreditCards, calculateFundProgress, calculateMonthSummary, transactionsForMonth } from '../domain/calculations';
import { formatMoney } from '../domain/money';
import type { AppData, WorkspaceBlock, WorkspaceItem, WorkspaceMetric, WorkspacePage } from '../domain/types';

interface WorkspaceDashboardProps {
  data: AppData;
  page: WorkspacePage;
  monthKey: string;
  onCustomize: () => void;
  onRestoreDefault: () => void;
  onAddTransaction: () => void;
}

const statusCopy: Record<WorkspaceItem['status'], string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  done: 'Done',
};

export function WorkspaceDashboard({ data, page, monthKey, onCustomize, onRestoreDefault, onAddTransaction }: WorkspaceDashboardProps) {
  const livingPlan = data.plan.salaryAllocations.find((item) => item.id === 'living')?.plannedPaise ?? 0;
  const summary = calculateMonthSummary(data.transactions, data.accounts, monthKey, new Date(), livingPlan);
  const transactions = transactionsForMonth(data.transactions, monthKey).sort((a, b) => b.date.localeCompare(a.date));
  const categories = calculateCategoryTotals(data.transactions, data.categories, monthKey).filter((item) => item.spentPaise > 0).slice(0, 7);
  const funds = calculateFundProgress(data);
  const fundBalance = funds.reduce((total, fund) => total + fund.balancePaise, 0);
  const cards = calculateCreditCards(data);
  const investmentTotal = transactions.filter((item) => item.kind === 'investment' && item.status === 'cleared').reduce((total, item) => total + item.amountPaise, 0);
  const sortedBlocks = [...page.blocks].sort((a, b) => a.order - b.order);

  const metricValue = (metric: WorkspaceMetric | undefined) => {
    if (metric === 'income') return { value: formatMoney(summary.incomePaise), detail: 'cleared income' };
    if (metric === 'remaining') return { value: formatMoney(summary.remainingPaise), detail: 'living plan remaining' };
    if (metric === 'transactions') return { value: String(transactions.length), detail: 'monthly records' };
    if (metric === 'funds') return { value: formatMoney(fundBalance), detail: 'total dedicated funds' };
    if (metric === 'investments') return { value: formatMoney(investmentTotal), detail: 'invested this month' };
    return { value: formatMoney(summary.spentPaise), detail: 'cleared expenses' };
  };

  const renderCollection = (block: WorkspaceBlock) => {
    const view = block.collectionView ?? 'table';
    if (view === 'board') return <div className="dashboard-board">{(['not_started', 'in_progress', 'done'] as const).map((status) => <section key={status}><header><span>{statusCopy[status]}</span><b>{block.items.filter((item) => item.status === status).length}</b></header>{block.items.filter((item) => item.status === status).map((item) => <article key={item.id}><strong>{item.title}</strong><small>{item.amountPaise ? formatMoney(item.amountPaise) : item.note || 'No amount set'}</small></article>)}</section>)}</div>;
    if (view === 'calendar') return <div className="dashboard-calendar">{[...block.items].sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999')).map((item) => <article key={item.id}><span><CalendarDays size={14} />{item.date || 'No date'}</span><strong>{item.title}</strong><small>{statusCopy[item.status]}</small></article>)}</div>;
    return <div className={view === 'cards' ? 'dashboard-collection-cards' : 'dashboard-collection-table'}>{block.items.map((item) => <article key={item.id}><div><strong>{item.title}</strong><small>{item.note || statusCopy[item.status]}</small></div>{item.amountPaise > 0 && <b>{formatMoney(item.amountPaise)}</b>}<span className={`workspace-status ${item.status}`}>{statusCopy[item.status]}</span></article>)}</div>;
  };

  return (
    <div className="workspace-dashboard">
      <section className="workspace-dashboard-hero" style={{ '--workspace-cover': page.coverColor } as React.CSSProperties}>
        <div className="workspace-dashboard-label"><LayoutDashboard size={15} /> Custom dashboard</div>
        <div className="workspace-dashboard-actions"><button onClick={onCustomize}><Pencil size={15} /> Customize page</button><button onClick={onRestoreDefault}><RotateCcw size={15} /> Standard overview</button></div>
        <span className="workspace-dashboard-icon">{page.icon}</span>
        <h2>{page.title}</h2>
        <p>{page.description}</p>
      </section>

      <div className="workspace-block-grid dashboard-block-grid">
        {sortedBlocks.map((block) => (
          <section key={block.id} className={`workspace-block dashboard-block ${block.kind} ${block.width}`}>
            <div className="dashboard-block-heading"><small>{block.kind}</small><h3>{block.title}</h3></div>
            {block.kind === 'text' && <p className="dashboard-block-copy">{block.content}</p>}
            {block.kind === 'callout' && <div className="workspace-callout dashboard-callout" style={{ background: block.color }}><span>✦</span><p>{block.content}</p></div>}
            {block.kind === 'kpi' && <div className="workspace-kpi dashboard-kpi"><div style={{ color: block.color }}><strong>{metricValue(block.metric).value}</strong><span>{metricValue(block.metric).detail}</span></div></div>}
            {block.kind === 'transactions' && <div className="workspace-transactions">{transactions.slice(0, 6).map((transaction) => { const category = data.categories.find((item) => item.id === transaction.categoryId); return <article key={transaction.id}><span className="category-icon" style={{ color: category?.color, background: `${category?.color ?? '#667'}18` }}><CategoryIcon name={category?.icon ?? 'shapes'} /></span><div><strong>{transaction.merchant}</strong><small>{category?.name ?? 'Uncategorised'} · {transaction.date}</small></div><b className={transaction.kind === 'income' ? 'positive-copy' : ''}>{transaction.kind === 'income' ? '+' : '−'}{formatMoney(transaction.amountPaise)}</b></article>; })}{transactions.length === 0 && <div className="workspace-no-data"><WalletCards size={19} /><span>No activity in this month yet.</span><button onClick={onAddTransaction}>Add transaction</button></div>}</div>}
            {block.kind === 'chart' && <div className="workspace-chart">{categories.map((category) => <div key={category.id}><span><b>{category.name}</b><small>{formatMoney(category.spentPaise)}</small></span><i><b style={{ width: `${Math.max(3, category.percentageOfSpend)}%`, background: category.color }} /></i></div>)}{categories.length === 0 && <div className="workspace-no-data"><BarChart3 size={19} /><span>Add expenses to generate this live chart.</span></div>}</div>}
            {block.kind === 'checklist' && <div className="dashboard-checklist">{block.items.map((item) => <article key={item.id} className={item.status === 'done' ? 'done' : ''}><i>{item.status === 'done' ? '✓' : ''}</i><div><strong>{item.title}</strong>{item.note && <small>{item.note}</small>}</div></article>)}</div>}
            {block.kind === 'collection' && renderCollection(block)}
            {block.kind === 'budget' && <div className="workspace-system-list">{data.plan.salaryAllocations.map((allocation) => <article key={allocation.id}><span style={{ background: allocation.color }} /><div><strong>{allocation.name}</strong><small>{Math.round((allocation.plannedPaise / data.plan.monthlySalaryPaise) * 100)}% of salary plan</small></div><b>{formatMoney(allocation.plannedPaise)}</b></article>)}</div>}
            {block.kind === 'accounts' && <div className="workspace-system-list">{cards.map((card) => <article key={card.account.id}><span style={{ background: card.account.color }} /><div><strong>{card.account.name}</strong><small>{formatMoney(card.outstandingPaise)} outstanding of {formatMoney(card.account.creditCard!.limitPaise)}</small></div><b>{Math.round(card.utilizationPercent)}%</b></article>)}</div>}
            {block.kind === 'goals' && <div className="workspace-system-list">{funds.filter((fund) => fund.targetPaise > 0).map((fund) => <article key={fund.id}><span style={{ background: fund.color }} /><div><strong>{fund.name}</strong><small>{formatMoney(fund.balancePaise)} of {formatMoney(fund.targetPaise)}</small><i><b style={{ width: `${Math.min(100, fund.percent)}%`, background: fund.color }} /></i></div><b>{Math.round(fund.percent)}%</b></article>)}</div>}
          </section>
        ))}
      </div>
    </div>
  );
}
