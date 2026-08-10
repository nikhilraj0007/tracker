import {
  Archive,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CalendarDays,
  CheckSquare2,
  CircleDollarSign,
  Columns3,
  Copy,
  CreditCard,
  FileText,
  GripVertical,
  LayoutGrid,
  LayoutDashboard,
  ListChecks,
  MoreHorizontal,
  PanelTop,
  Plus,
  RotateCcw,
  Rows3,
  Sparkles,
  Table2,
  Target,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { calculateCategoryTotals, calculateCreditCards, calculateFundProgress, calculateMonthSummary, transactionsForMonth } from '../domain/calculations';
import { formatMoney, paiseToRupees, parseRupeesInput } from '../domain/money';
import type {
  AppData,
  WorkspaceBlock,
  WorkspaceBlockKind,
  WorkspaceCollectionView,
  WorkspaceItem,
  WorkspaceMetric,
  WorkspacePage as WorkspacePageModel,
} from '../domain/types';
import { createWorkspacePage, workspaceTemplates } from '../data/workspaceTemplates';
import { CategoryIcon } from '../components/CategoryIcon';

interface WorkspacePageProps {
  data: AppData;
  monthKey: string;
  onCommit: (updater: (current: AppData) => AppData, message?: string) => void;
  onAddTransaction: () => void;
}

const statusCopy: Record<WorkspaceItem['status'], string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  done: 'Done',
};

const blockChoices: Array<{ kind: WorkspaceBlockKind; label: string; description: string; icon: typeof FileText }> = [
  { kind: 'text', label: 'Text', description: 'Notes, context, or instructions', icon: FileText },
  { kind: 'callout', label: 'Callout', description: 'Highlight an important thought', icon: Sparkles },
  { kind: 'kpi', label: 'Live KPI', description: 'A number connected to your money', icon: PanelTop },
  { kind: 'checklist', label: 'Checklist', description: 'Flexible tasks and actions', icon: CheckSquare2 },
  { kind: 'collection', label: 'Collection', description: 'Table, board, calendar, or cards', icon: LayoutGrid },
  { kind: 'transactions', label: 'Transactions', description: 'A live view of monthly activity', icon: WalletCards },
  { kind: 'chart', label: 'Chart', description: 'Live category spending bars', icon: BarChart3 },
  { kind: 'budget', label: 'Money plan', description: 'Live allocation progress for this month', icon: CircleDollarSign },
  { kind: 'accounts', label: 'Credit position', description: 'Card limits, balances, and utilisation', icon: CreditCard },
  { kind: 'goals', label: 'Goals and funds', description: 'Live progress across dedicated funds', icon: Target },
];

function WorkspaceMoneyInput({ value, label, onSave }: { value: number; label: string; onSave: (value: number) => void }) {
  const [input, setInput] = useState(String(paiseToRupees(value)));
  useEffect(() => setInput(String(paiseToRupees(value))), [value]);
  const save = () => {
    const parsed = input === '0' ? 0 : parseRupeesInput(input);
    if (parsed !== null) onSave(parsed);
    else setInput(String(paiseToRupees(value)));
  };
  return <label className="workspace-money-input"><span className="sr-only">{label}</span><b>₹</b><input inputMode="decimal" value={input} onChange={(event) => setInput(event.target.value)} onBlur={save} onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()} /></label>;
}

function EditableText({ value, label, className = '', multiline = false, onSave }: { value: string; label: string; className?: string; multiline?: boolean; onSave: (value: string) => void }) {
  const [input, setInput] = useState(value);
  useEffect(() => setInput(value), [value]);
  const save = () => {
    const normalized = input.trim();
    if (normalized || multiline) onSave(normalized);
    else setInput(value);
  };
  return <label className={`workspace-text-input ${className}`}><span className="sr-only">{label}</span>{multiline ? <textarea value={input} onChange={(event) => setInput(event.target.value)} onBlur={save} rows={2} /> : <input value={input} onChange={(event) => setInput(event.target.value)} onBlur={save} onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()} />}</label>;
}

export function WorkspacePage({ data, monthKey, onCommit, onAddTransaction }: WorkspacePageProps) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBlocks, setShowBlocks] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const visiblePages = data.workspace.pages.filter((page) => !page.archived);
  const archivedPages = data.workspace.pages.filter((page) => page.archived);
  const activePage = data.workspace.pages.find((page) => page.id === data.workspace.activePageId && !page.archived) ?? visiblePages[0];
  const livingPlan = data.plan.salaryAllocations.find((item) => item.id === 'living')?.plannedPaise ?? 0;
  const summary = calculateMonthSummary(data.transactions, data.accounts, monthKey, new Date(), livingPlan);
  const monthTransactions = transactionsForMonth(data.transactions, monthKey).sort((a, b) => b.date.localeCompare(a.date));
  const categoryTotals = calculateCategoryTotals(data.transactions, data.categories, monthKey).filter((item) => item.spentPaise > 0).slice(0, 7);
  const fundBalance = calculateFundProgress(data).reduce((total, fund) => total + fund.balancePaise, 0);
  const fundProgress = calculateFundProgress(data);
  const creditCards = calculateCreditCards(data);
  const investmentTotal = monthTransactions.filter((item) => item.kind === 'investment' && item.status === 'cleared').reduce((total, item) => total + item.amountPaise, 0);

  useEffect(() => {
    const openPalette = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        event.preventDefault();
        setShowBlocks(true);
      }
    };
    window.addEventListener('keydown', openPalette);
    return () => window.removeEventListener('keydown', openPalette);
  }, []);

  useEffect(() => {
    if (!activePage && visiblePages.length > 0) {
      onCommit((current) => ({ ...current, workspace: { ...current.workspace, activePageId: visiblePages[0].id } }));
    }
  }, [activePage, onCommit, visiblePages]);

  const updatePage = (pageId: string, changes: Partial<WorkspacePageModel>, message?: string) => onCommit((current) => ({
    ...current,
    workspace: {
      ...current.workspace,
      pages: current.workspace.pages.map((page) => page.id === pageId ? { ...page, ...changes, updatedAt: new Date().toISOString() } : page),
    },
  }), message);

  const updateBlock = (blockId: string, changes: Partial<WorkspaceBlock>, message?: string) => {
    if (!activePage) return;
    updatePage(activePage.id, { blocks: activePage.blocks.map((item) => item.id === blockId ? { ...item, ...changes } : item) }, message);
  };

  const createPage = (templateId: Parameters<typeof createWorkspacePage>[0]) => {
    const page = createWorkspacePage(templateId);
    onCommit((current) => ({ ...current, workspace: { ...current.workspace, activePageId: page.id, pages: [...current.workspace.pages, page] } }), `${page.title} created.`);
    setShowTemplates(false);
  };

  const duplicatePage = () => {
    if (!activePage) return;
    const timestamp = new Date().toISOString();
    const copy: WorkspacePageModel = {
      ...activePage,
      id: crypto.randomUUID(),
      title: `${activePage.title} copy`,
      createdAt: timestamp,
      updatedAt: timestamp,
      blocks: activePage.blocks.map((item) => ({ ...item, id: crypto.randomUUID(), items: item.items.map((entry) => ({ ...entry, id: crypto.randomUUID() })) })),
    };
    onCommit((current) => ({ ...current, workspace: { ...current.workspace, activePageId: copy.id, pages: [...current.workspace.pages, copy] } }), 'Page duplicated.');
  };

  const archivePage = () => {
    if (!activePage || visiblePages.length < 2) return;
    const nextPage = visiblePages.find((page) => page.id !== activePage.id)!;
    onCommit((current) => ({ ...current, workspace: { ...current.workspace, activePageId: nextPage.id, dashboardPageId: current.workspace.dashboardPageId === activePage.id ? undefined : current.workspace.dashboardPageId, pages: current.workspace.pages.map((page) => page.id === activePage.id ? { ...page, archived: true, updatedAt: new Date().toISOString() } : page) } }), 'Page moved to archive.');
  };

  const deletePage = () => {
    if (!activePage || visiblePages.length < 2 || !window.confirm(`Delete “${activePage.title}” and all of its blocks?`)) return;
    const nextPage = visiblePages.find((page) => page.id !== activePage.id)!;
    onCommit((current) => ({ ...current, workspace: { ...current.workspace, activePageId: nextPage.id, dashboardPageId: current.workspace.dashboardPageId === activePage.id ? undefined : current.workspace.dashboardPageId, pages: current.workspace.pages.filter((page) => page.id !== activePage.id) } }), 'Page deleted.');
  };

  const addBlock = (kind: WorkspaceBlockKind) => {
    if (!activePage) return;
    const order = Math.max(0, ...activePage.blocks.map((item) => item.order)) + 10;
    const defaults: Record<WorkspaceBlockKind, Partial<WorkspaceBlock>> = {
      text: { title: 'Notes', content: 'Start writing here.' },
      callout: { title: 'Important', content: 'Add context or a reminder.', color: '#dff28f' },
      kpi: { title: 'Spent this month', metric: 'spent', width: 'half' },
      checklist: { title: 'Checklist', items: [{ id: crypto.randomUUID(), title: 'First task', amountPaise: 0, status: 'not_started', note: '' }] },
      collection: { title: 'Untitled collection', collectionView: 'table', items: [{ id: crypto.randomUUID(), title: 'First item', amountPaise: 0, status: 'not_started', note: '' }] },
      transactions: { title: 'Latest activity', content: 'Live transactions for the selected month.' },
      chart: { title: 'Spending by category', content: 'Live category totals.' },
      budget: { title: 'Monthly money plan', content: 'Live planned allocation progress.' },
      accounts: { title: 'Credit position', content: 'Live card balances and utilisation.' },
      goals: { title: 'Goals and dedicated funds', content: 'Live progress towards every target.' },
    };
    const newBlock: WorkspaceBlock = { id: crypto.randomUUID(), kind, title: '', content: '', color: '#3f7665', width: 'full', order, items: [], ...defaults[kind] };
    updatePage(activePage.id, { blocks: [...activePage.blocks, newBlock] }, 'Block added.');
    setShowBlocks(false);
  };

  const moveBlock = (blockId: string, direction: -1 | 1) => {
    if (!activePage) return;
    const blocks = [...activePage.blocks].sort((a, b) => a.order - b.order);
    const index = blocks.findIndex((item) => item.id === blockId);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= blocks.length) return;
    const first = blocks[index];
    const second = blocks[swapIndex];
    updatePage(activePage.id, { blocks: activePage.blocks.map((item) => item.id === first.id ? { ...item, order: second.order } : item.id === second.id ? { ...item, order: first.order } : item) });
  };

  const dropBlock = (targetId: string) => {
    if (!activePage || !draggingBlockId || draggingBlockId === targetId) return;
    const target = activePage.blocks.find((item) => item.id === targetId);
    const source = activePage.blocks.find((item) => item.id === draggingBlockId);
    if (!target || !source) return;
    updatePage(activePage.id, { blocks: activePage.blocks.map((item) => item.id === source.id ? { ...item, order: target.order } : item.id === target.id ? { ...item, order: source.order } : item) }, 'Blocks reordered.');
    setDraggingBlockId(null);
  };

  const duplicateBlock = (block: WorkspaceBlock) => {
    if (!activePage) return;
    const nextOrder = Math.max(0, ...activePage.blocks.map((item) => item.order)) + 10;
    const copy = { ...block, id: crypto.randomUUID(), title: `${block.title} copy`, order: nextOrder, items: block.items.map((item) => ({ ...item, id: crypto.randomUUID() })) };
    updatePage(activePage.id, { blocks: [...activePage.blocks, copy] }, 'Block duplicated.');
  };

  const deleteBlock = (blockId: string) => {
    if (!activePage || !window.confirm('Delete this block?')) return;
    updatePage(activePage.id, { blocks: activePage.blocks.filter((item) => item.id !== blockId) }, 'Block deleted.');
  };

  const addItem = (block: WorkspaceBlock) => updateBlock(block.id, { items: [...block.items, { id: crypto.randomUUID(), title: block.kind === 'checklist' ? 'New task' : 'New item', amountPaise: 0, status: 'not_started', note: '' }] }, 'Item added.');
  const updateItem = (block: WorkspaceBlock, itemId: string, changes: Partial<WorkspaceItem>) => updateBlock(block.id, { items: block.items.map((item) => item.id === itemId ? { ...item, ...changes } : item) });
  const deleteItem = (block: WorkspaceBlock, itemId: string) => updateBlock(block.id, { items: block.items.filter((item) => item.id !== itemId) }, 'Item deleted.');

  const promoteToDashboard = () => {
    if (!activePage) return;
    onCommit((current) => {
      const page = current.workspace.pages.find((item) => item.id === activePage.id);
      if (!page) return current;
      let order = Math.max(0, ...page.blocks.map((item) => item.order));
      const makeBlock = (kind: WorkspaceBlockKind, title: string, overrides: Partial<WorkspaceBlock> = {}): WorkspaceBlock => ({
        id: crypto.randomUUID(), kind, title, content: '', color: '#3f7665', width: 'full', order: (order += 10), items: [], ...overrides,
      });
      const additions: WorkspaceBlock[] = [];
      const metrics: WorkspaceMetric[] = ['spent', 'income', 'remaining', 'investments'];
      metrics.forEach((metric) => {
        if (!page.blocks.some((block) => block.kind === 'kpi' && block.metric === metric)) {
          const labels: Record<WorkspaceMetric, string> = { spent: 'Spent this month', income: 'Income this month', remaining: 'Plan remaining', transactions: 'Transactions', funds: 'Dedicated funds', investments: 'Invested this month' };
          additions.push(makeBlock('kpi', labels[metric], { metric, width: 'half', color: metric === 'spent' ? '#b35c52' : metric === 'income' ? '#37765b' : metric === 'remaining' ? '#456b8e' : '#647445' }));
        }
      });
      const systemBlocks: Array<[WorkspaceBlockKind, string]> = [
        ['budget', 'Monthly money plan'], ['accounts', 'Credit position'], ['goals', 'Goals and dedicated funds'], ['chart', 'Spending by category'], ['transactions', 'Latest activity'],
      ];
      systemBlocks.forEach(([kind, title]) => {
        if (!page.blocks.some((block) => block.kind === kind)) additions.push(makeBlock(kind, title));
      });
      return {
        ...current,
        workspace: {
          ...current.workspace,
          activePageId: page.id,
          dashboardPageId: page.id,
          pages: current.workspace.pages.map((item) => item.id === page.id ? { ...item, blocks: [...item.blocks, ...additions], updatedAt: new Date().toISOString() } : item),
        },
      };
    }, `${activePage.title} is now your dashboard.`);
  };

  const restoreStandardDashboard = () => onCommit((current) => ({ ...current, workspace: { ...current.workspace, dashboardPageId: undefined } }), 'Standard Overview restored.');

  const metricValue = (metric: WorkspaceMetric | undefined) => {
    if (metric === 'income') return { value: formatMoney(summary.incomePaise), detail: 'cleared income' };
    if (metric === 'remaining') return { value: formatMoney(summary.remainingPaise), detail: 'living plan remaining' };
    if (metric === 'transactions') return { value: String(monthTransactions.length), detail: 'monthly records' };
    if (metric === 'funds') return { value: formatMoney(fundBalance), detail: 'total dedicated funds' };
    if (metric === 'investments') return { value: formatMoney(investmentTotal), detail: 'invested this month' };
    return { value: formatMoney(summary.spentPaise), detail: 'cleared expenses' };
  };

  if (!activePage) return <div className="workspace-empty"><Sparkles size={24} /><h2>Create your first workspace page</h2><button className="primary-button" onClick={() => setShowTemplates(true)}><Plus size={16} /> New page</button></div>;

  const sortedBlocks = [...activePage.blocks].sort((a, b) => a.order - b.order);
  return (
    <div className="workspace-shell">
      <aside className="workspace-pages">
        <div className="workspace-pages-heading"><div><span>Pages</span><small>{visiblePages.length} active</small></div><button onClick={() => setShowTemplates(true)} aria-label="New workspace page"><Plus size={17} /></button></div>
        <div className="workspace-page-list">
          {visiblePages.map((page) => <button key={page.id} className={page.id === activePage.id ? 'active' : ''} onClick={() => onCommit((current) => ({ ...current, workspace: { ...current.workspace, activePageId: page.id } }))}><span style={{ background: `${page.coverColor}18`, color: page.coverColor }}>{page.icon}</span><strong>{page.title}</strong>{data.workspace.dashboardPageId === page.id && <em title="Active dashboard"><LayoutDashboard size={13} /></em>}</button>)}
        </div>
        {archivedPages.length > 0 && <div className="workspace-archive"><button onClick={() => setShowArchived((value) => !value)}><Archive size={14} /> Archive <small>{archivedPages.length}</small></button>{showArchived && archivedPages.map((page) => <div key={page.id}><span>{page.icon} {page.title}</span><button aria-label={`Restore ${page.title}`} onClick={() => updatePage(page.id, { archived: false }, 'Page restored.')}><RotateCcw size={13} /></button></div>)}</div>}
        <div className="workspace-shortcut"><b>/</b><span>Press anywhere to add a block</span></div>
      </aside>

      <main className="workspace-canvas">
        <div className="workspace-mobile-page-select"><select aria-label="Workspace page" value={activePage.id} onChange={(event) => onCommit((current) => ({ ...current, workspace: { ...current.workspace, activePageId: event.target.value } }))}>{visiblePages.map((page) => <option key={page.id} value={page.id}>{page.icon} {page.title}</option>)}</select><button onClick={() => setShowTemplates(true)}><Plus size={16} /></button></div>
        <section className="workspace-cover" style={{ '--workspace-cover': activePage.coverColor } as React.CSSProperties}>
          <div className="workspace-page-actions"><label title="Page icon"><input maxLength={2} value={activePage.icon} onChange={(event) => updatePage(activePage.id, { icon: event.target.value })} /></label><label className="workspace-cover-color" title="Cover color"><input type="color" value={activePage.coverColor} onChange={(event) => updatePage(activePage.id, { coverColor: event.target.value })} /></label>{data.workspace.dashboardPageId === activePage.id ? <button className="dashboard-active" onClick={restoreStandardDashboard} title="Restore standard Overview"><RotateCcw size={15} /> Standard overview</button> : <button onClick={promoteToDashboard} title="Use this page as Overview"><LayoutDashboard size={15} /> Use as dashboard</button>}<button onClick={duplicatePage}><Copy size={15} /> Duplicate</button><button disabled={visiblePages.length < 2} onClick={archivePage}><Archive size={15} /> Archive</button><button disabled={visiblePages.length < 2} className="danger" onClick={deletePage}><Trash2 size={15} /></button></div>
          <EditableText className="workspace-page-title" label="Page title" value={activePage.title} onSave={(title) => updatePage(activePage.id, { title }, 'Page renamed.')} />
          <EditableText className="workspace-page-description" label="Page description" value={activePage.description} multiline onSave={(description) => updatePage(activePage.id, { description })} />
        </section>

        <div className="workspace-block-grid">
          {sortedBlocks.map((block, index) => (
            <section key={block.id} className={`workspace-block ${block.kind} ${block.width}`} draggable onDragStart={() => setDraggingBlockId(block.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropBlock(block.id)}>
              <header className="workspace-block-toolbar"><span><GripVertical size={15} /><small>{block.kind}</small></span><div><button onClick={() => updateBlock(block.id, { width: block.width === 'full' ? 'half' : 'full' })} title="Toggle block width">{block.width === 'full' ? <Columns3 size={14} /> : <Rows3 size={14} />}</button><button disabled={index === 0} onClick={() => moveBlock(block.id, -1)} aria-label={`Move ${block.title} up`}><ArrowUp size={14} /></button><button disabled={index === sortedBlocks.length - 1} onClick={() => moveBlock(block.id, 1)} aria-label={`Move ${block.title} down`}><ArrowDown size={14} /></button><button onClick={() => duplicateBlock(block)} aria-label={`Duplicate ${block.title}`}><Copy size={14} /></button><button className="danger" onClick={() => deleteBlock(block.id)} aria-label={`Delete ${block.title}`}><Trash2 size={14} /></button></div></header>
              <EditableText className="workspace-block-title" label={`${block.kind} block title`} value={block.title} onSave={(title) => updateBlock(block.id, { title })} />
              {block.kind === 'text' && <EditableText className="workspace-block-copy" label={`${block.title} text`} value={block.content} multiline onSave={(content) => updateBlock(block.id, { content })} />}
              {block.kind === 'callout' && <div className="workspace-callout" style={{ background: block.color }}><Sparkles size={18} /><EditableText label={`${block.title} callout`} value={block.content} multiline onSave={(content) => updateBlock(block.id, { content })} /><input aria-label={`${block.title} color`} type="color" value={block.color} onChange={(event) => updateBlock(block.id, { color: event.target.value })} /></div>}
              {block.kind === 'kpi' && <div className="workspace-kpi"><div style={{ color: block.color }}><strong>{metricValue(block.metric).value}</strong><span>{metricValue(block.metric).detail}</span></div><label><span>Live metric</span><select value={block.metric ?? 'spent'} onChange={(event) => updateBlock(block.id, { metric: event.target.value as WorkspaceMetric })}><option value="spent">Spent</option><option value="income">Income</option><option value="remaining">Remaining</option><option value="transactions">Transactions</option><option value="funds">Funds</option><option value="investments">Investments</option></select></label></div>}
              {block.kind === 'transactions' && <div className="workspace-transactions">{monthTransactions.slice(0, 6).map((transaction) => { const category = data.categories.find((item) => item.id === transaction.categoryId); return <article key={transaction.id}><span className="category-icon" style={{ color: category?.color, background: `${category?.color ?? '#667'}18` }}><CategoryIcon name={category?.icon ?? 'shapes'} /></span><div><strong>{transaction.merchant}</strong><small>{category?.name ?? 'Uncategorised'} · {transaction.date}</small></div><b className={transaction.kind === 'income' ? 'positive-copy' : ''}>{transaction.kind === 'income' ? '+' : '−'}{formatMoney(transaction.amountPaise)}</b></article>; })}{monthTransactions.length === 0 && <div className="workspace-no-data"><WalletCards size={19} /><span>No activity in this month yet.</span><button onClick={onAddTransaction}>Add transaction</button></div>}</div>}
              {block.kind === 'chart' && <div className="workspace-chart">{categoryTotals.map((category) => <div key={category.id}><span><b>{category.name}</b><small>{formatMoney(category.spentPaise)}</small></span><i><b style={{ width: `${Math.max(3, category.percentageOfSpend)}%`, background: category.color }} /></i></div>)}{categoryTotals.length === 0 && <div className="workspace-no-data"><BarChart3 size={19} /><span>Add expenses to generate this live chart.</span></div>}</div>}
              {block.kind === 'budget' && <div className="workspace-system-list">{data.plan.salaryAllocations.map((allocation) => <article key={allocation.id}><span style={{ background: allocation.color }} /><div><strong>{allocation.name}</strong><small>{Math.round((allocation.plannedPaise / data.plan.monthlySalaryPaise) * 100)}% of salary plan</small></div><b>{formatMoney(allocation.plannedPaise)}</b></article>)}</div>}
              {block.kind === 'accounts' && <div className="workspace-system-list">{creditCards.map((card) => <article key={card.account.id}><span style={{ background: card.account.color }} /><div><strong>{card.account.name}</strong><small>{formatMoney(card.outstandingPaise)} outstanding of {formatMoney(card.account.creditCard!.limitPaise)}</small></div><b>{Math.round(card.utilizationPercent)}%</b></article>)}</div>}
              {block.kind === 'goals' && <div className="workspace-system-list">{fundProgress.filter((fund) => fund.targetPaise > 0).map((fund) => <article key={fund.id}><span style={{ background: fund.color }} /><div><strong>{fund.name}</strong><small>{formatMoney(fund.balancePaise)} of {formatMoney(fund.targetPaise)}</small><i><b style={{ width: `${Math.min(100, fund.percent)}%`, background: fund.color }} /></i></div><b>{Math.round(fund.percent)}%</b></article>)}</div>}
              {block.kind === 'checklist' && <div className="workspace-checklist">{block.items.map((item) => <article key={item.id} className={item.status === 'done' ? 'done' : ''}><input aria-label={`Complete ${item.title}`} type="checkbox" checked={item.status === 'done'} onChange={(event) => updateItem(block, item.id, { status: event.target.checked ? 'done' : 'not_started' })} /><EditableText label="Task name" value={item.title} onSave={(title) => updateItem(block, item.id, { title })} /><button onClick={() => deleteItem(block, item.id)} aria-label={`Delete ${item.title}`}><X size={14} /></button></article>)}<button className="workspace-add-row" onClick={() => addItem(block)}><Plus size={14} /> Add task</button></div>}
              {block.kind === 'collection' && <CollectionBlock block={block} updateBlock={updateBlock} updateItem={updateItem} deleteItem={deleteItem} addItem={addItem} />}
            </section>
          ))}
        </div>
        <button className="workspace-add-block" onClick={() => setShowBlocks(true)}><Plus size={16} /> Add block <kbd>/</kbd></button>
      </main>

      {showTemplates && <div className="workspace-overlay" onMouseDown={(event) => event.target === event.currentTarget && setShowTemplates(false)}><section className="workspace-picker"><header><div><p className="eyebrow">New workspace page</p><h2>Start with a useful structure</h2></div><button onClick={() => setShowTemplates(false)}><X size={18} /></button></header><div className="workspace-template-grid">{workspaceTemplates.map((template) => <button key={template.id} onClick={() => createPage(template.id)}><span>{template.icon}</span><div><strong>{template.name}</strong><small>{template.description}</small></div></button>)}</div></section></div>}
      {showBlocks && <div className="workspace-overlay" onMouseDown={(event) => event.target === event.currentTarget && setShowBlocks(false)}><section className="workspace-picker block-picker"><header><div><p className="eyebrow">Block library</p><h2>What do you want to add?</h2></div><button onClick={() => setShowBlocks(false)}><X size={18} /></button></header><div className="workspace-template-grid">{blockChoices.map(({ kind, label, description, icon: Icon }) => <button key={kind} onClick={() => addBlock(kind)}><span><Icon size={19} /></span><div><strong>{label}</strong><small>{description}</small></div></button>)}</div></section></div>}
    </div>
  );
}

function CollectionBlock({ block, updateBlock, updateItem, deleteItem, addItem }: {
  block: WorkspaceBlock;
  updateBlock: (id: string, changes: Partial<WorkspaceBlock>, message?: string) => void;
  updateItem: (block: WorkspaceBlock, itemId: string, changes: Partial<WorkspaceItem>) => void;
  deleteItem: (block: WorkspaceBlock, itemId: string) => void;
  addItem: (block: WorkspaceBlock) => void;
}) {
  const view = block.collectionView ?? 'table';
  const viewOptions: Array<{ id: WorkspaceCollectionView; label: string; icon: typeof Table2 }> = [
    { id: 'table', label: 'Table', icon: Table2 },
    { id: 'board', label: 'Board', icon: Columns3 },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'cards', label: 'Cards', icon: LayoutGrid },
  ];
  const itemEditor = (item: WorkspaceItem, compact = false) => <article key={item.id} className={`workspace-collection-item ${compact ? 'compact' : ''}`}><EditableText label="Item name" value={item.title} onSave={(title) => updateItem(block, item.id, { title })} />{!compact && <WorkspaceMoneyInput label={`${item.title} amount`} value={item.amountPaise} onSave={(amountPaise) => updateItem(block, item.id, { amountPaise })} />}<select aria-label={`${item.title} status`} value={item.status} onChange={(event) => updateItem(block, item.id, { status: event.target.value as WorkspaceItem['status'] })}>{Object.entries(statusCopy).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>{!compact && <input aria-label={`${item.title} date`} type="date" value={item.date ?? ''} onChange={(event) => updateItem(block, item.id, { date: event.target.value || undefined })} />}<button onClick={() => deleteItem(block, item.id)} aria-label={`Delete ${item.title}`}><Trash2 size={14} /></button></article>;
  return <div className="workspace-collection"><div className="workspace-view-tabs">{viewOptions.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? 'active' : ''} onClick={() => updateBlock(block.id, { collectionView: id })}><Icon size={14} />{label}</button>)}</div>{view === 'table' && <div className="workspace-collection-table"><div><span>Name</span><span>Amount</span><span>Status</span><span>Date</span><span /></div>{block.items.map((item) => itemEditor(item))}</div>}{view === 'board' && <div className="workspace-board">{(Object.keys(statusCopy) as WorkspaceItem['status'][]).map((status) => <section key={status}><header><span>{statusCopy[status]}</span><b>{block.items.filter((item) => item.status === status).length}</b></header>{block.items.filter((item) => item.status === status).map((item) => itemEditor(item, true))}</section>)}</div>}{view === 'calendar' && <div className="workspace-calendar">{[...block.items].sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999')).map((item) => <article key={item.id}><span><CalendarDays size={15} />{item.date ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${item.date}T12:00:00`)) : 'No date'}</span><strong>{item.title}</strong><small>{formatMoney(item.amountPaise)} · {statusCopy[item.status]}</small><button onClick={() => deleteItem(block, item.id)}><Trash2 size={13} /></button></article>)}</div>}{view === 'cards' && <div className="workspace-cards">{block.items.map((item) => <article key={item.id}><span className={`workspace-status ${item.status}`}>{statusCopy[item.status]}</span><EditableText label="Item name" value={item.title} onSave={(title) => updateItem(block, item.id, { title })} /><WorkspaceMoneyInput label={`${item.title} amount`} value={item.amountPaise} onSave={(amountPaise) => updateItem(block, item.id, { amountPaise })} /><small>{item.date || 'No date set'}</small><button onClick={() => deleteItem(block, item.id)}><Trash2 size={13} /></button></article>)}</div>}<button className="workspace-add-row" onClick={() => addItem(block)}><Plus size={14} /> New item</button></div>;
}
