import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  CreditCard,
  Eye,
  EyeOff,
  Landmark,
  Plane,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  calculateAllocationProgress,
  calculateCreditCards,
  calculateFundProgress,
  calculateOneTimeUnallocated,
  calculateSideHustleNet,
} from '../domain/calculations';
import { formatMoney, paiseToRupees, parseRupeesInput } from '../domain/money';
import type { Account, AppData, CustomPlanSection, CustomSectionKind, DedicatedFund, FinancialObligation, PlanSectionConfig, PlanSectionScope, SystemPlanSectionId, TimelineEvent } from '../domain/types';
import { CategoryIcon } from '../components/CategoryIcon';

interface MoneyPlanPageProps {
  data: AppData;
  monthKey: string;
  onCommit: (updater: (current: AppData) => AppData, message?: string) => void;
}

function MoneyEditor({ value, onSave, label }: { value: number; onSave: (value: number) => void; label: string }) {
  const [input, setInput] = useState(String(paiseToRupees(value)));
  useEffect(() => setInput(String(paiseToRupees(value))), [value]);
  const save = () => {
    const parsed = input === '0' ? 0 : parseRupeesInput(input);
    if (parsed !== null) onSave(parsed);
    else setInput(String(paiseToRupees(value)));
  };
  return <label className="inline-money-editor"><span className="sr-only">{label}</span><b>₹</b><input inputMode="decimal" value={input} onChange={(event) => setInput(event.target.value)} onBlur={save} onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()} /></label>;
}

function Progress({ percent, color }: { percent: number; color: string }) {
  return <div className="plan-progress"><span style={{ width: `${Math.min(100, Math.max(0, percent))}%`, background: color }} /></div>;
}

function NumberEditor({ value, min, max, suffix, onSave, label }: { value: number; min: number; max: number; suffix?: string; onSave: (value: number) => void; label: string }) {
  const [input, setInput] = useState(String(value));
  useEffect(() => setInput(String(value)), [value]);
  const save = () => {
    const parsed = Number(input);
    if (Number.isFinite(parsed) && parsed >= min && parsed <= max) onSave(parsed);
    else setInput(String(value));
  };
  return <label className="inline-number-editor"><span className="sr-only">{label}</span><input inputMode="numeric" value={input} onChange={(event) => setInput(event.target.value)} onBlur={save} onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()} />{suffix && <b>{suffix}</b>}</label>;
}

function TextEditor({ value, onSave, label, className = '' }: { value: string; onSave: (value: string) => void; label: string; className?: string }) {
  const [input, setInput] = useState(value);
  useEffect(() => setInput(value), [value]);
  const save = () => {
    const normalized = input.trim();
    if (normalized) onSave(normalized);
    else setInput(value);
  };
  return <label className={`inline-text-editor ${className}`}><span className="sr-only">{label}</span><input value={input} onChange={(event) => setInput(event.target.value)} onBlur={save} onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()} /></label>;
}

export function MoneyPlanPage({ data, monthKey, onCommit }: MoneyPlanPageProps) {
  const [customizing, setCustomizing] = useState(false);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionKind, setNewSectionKind] = useState<CustomSectionKind>('budget');
  const [newSectionScope, setNewSectionScope] = useState<PlanSectionScope>('always');
  const allocations = calculateAllocationProgress(data, monthKey);
  const cards = calculateCreditCards(data);
  const funds = calculateFundProgress(data);
  const oneTimeRemaining = calculateOneTimeUnallocated(data);
  const hasActualOneTime = data.plan.oneTimeIncome.actualNetPaise > 0;
  const oneTimePlanned = data.plan.oneTimeIncome.loanPrepaymentPaise + data.plan.oneTimeIncome.vietnamPaise;
  const sideNet = calculateSideHustleNet(data);
  const sideAllocated = data.plan.sideHustle.emergencyAllocationPaise + data.plan.sideHustle.investmentAllocationPaise + data.plan.sideHustle.businessReinvestmentPaise + data.plan.sideHustle.goalsAllocationPaise;
  const allocationTotal = data.plan.salaryAllocations.reduce((total, item) => total + item.plannedPaise, 0);
  const livingCategories = data.categories.filter((category) => category.group === 'living' && category.id !== 'other');
  const livingTotal = livingCategories.reduce((total, category) => total + category.monthlyBudgetPaise, 0);
  const livingPlan = data.plan.salaryAllocations.find((item) => item.id === 'living')?.plannedPaise ?? 0;
  const salaryBalanced = allocationTotal === data.plan.monthlySalaryPaise;
  const livingBalanced = livingTotal === livingPlan;
  const sectionConfig = (id: SystemPlanSectionId) => data.plan.sectionConfigs.find((section) => section.id === id)!;
  const sectionIsActive = (section: { scope: PlanSectionScope; monthKey?: string }) => section.scope === 'always' || section.monthKey === monthKey;
  const showSection = (id: SystemPlanSectionId) => {
    const section = sectionConfig(id);
    return section.visible && sectionIsActive(section);
  };
  const configurableSections = [
    ...data.plan.sectionConfigs.map((section) => ({ source: 'system' as const, section })),
    ...data.plan.customSections.map((section) => ({ source: 'custom' as const, section })),
  ].sort((a, b) => a.section.order - b.section.order);
  const visibleCustomSections = data.plan.customSections.filter(sectionIsActive).sort((a, b) => a.order - b.order);

  const updateAllocation = (id: string, plannedPaise: number) => onCommit((current) => ({
    ...current,
    plan: { ...current.plan, salaryAllocations: current.plan.salaryAllocations.map((item) => item.id === id ? { ...item, plannedPaise } : item) },
  }), 'Salary allocation updated.');

  const updateCategory = (id: string, monthlyBudgetPaise: number) => onCommit((current) => ({
    ...current,
    categories: current.categories.map((item) => item.id === id ? { ...item, monthlyBudgetPaise } : item),
  }), 'Living plan updated.');

  const updateCard = (id: string, changes: Partial<NonNullable<Account['creditCard']>>) => onCommit((current) => ({
    ...current,
    accounts: current.accounts.map((account) => account.id === id && account.creditCard ? { ...account, creditCard: { ...account.creditCard, ...changes } } : account),
  }), 'Credit-card settings updated.');

  const updateFund = (id: DedicatedFund['id'], changes: Partial<DedicatedFund>) => onCommit((current) => ({
    ...current,
    plan: { ...current.plan, funds: current.plan.funds.map((fund) => fund.id === id ? { ...fund, ...changes } : fund) },
  }), 'Fund updated.');

  const updateObligation = (id: string, changes: Partial<FinancialObligation>) => onCommit((current) => ({
    ...current,
    plan: { ...current.plan, obligations: current.plan.obligations.map((item) => item.id === id ? { ...item, ...changes } : item) },
  }), 'Obligation updated.');

  const updateTimeline = (id: string, status: TimelineEvent['status']) => onCommit((current) => ({
    ...current,
    plan: { ...current.plan, timeline: current.plan.timeline.map((item) => item.id === id ? { ...item, status } : item) },
  }), 'Timeline updated.');

  const updateSectionConfig = (id: SystemPlanSectionId, changes: Partial<PlanSectionConfig>) => onCommit((current) => ({
    ...current,
    plan: { ...current.plan, sectionConfigs: current.plan.sectionConfigs.map((section) => section.id === id ? { ...section, ...changes } : section) },
  }));

  const movePlanSection = (source: 'system' | 'custom', id: string, direction: -1 | 1) => {
    const index = configurableSections.findIndex((item) => item.source === source && item.section.id === id);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= configurableSections.length) return;
    const currentItem = configurableSections[index];
    const swapItem = configurableSections[swapIndex];
    onCommit((current) => ({
      ...current,
      plan: {
        ...current.plan,
        sectionConfigs: current.plan.sectionConfigs.map((section) => {
          if (currentItem.source === 'system' && section.id === currentItem.section.id) return { ...section, order: swapItem.section.order };
          if (swapItem.source === 'system' && section.id === swapItem.section.id) return { ...section, order: currentItem.section.order };
          return section;
        }),
        customSections: current.plan.customSections.map((section) => {
          if (currentItem.source === 'custom' && section.id === currentItem.section.id) return { ...section, order: swapItem.section.order };
          if (swapItem.source === 'custom' && section.id === swapItem.section.id) return { ...section, order: currentItem.section.order };
          return section;
        }),
      },
    }), 'Section order updated.');
  };

  const addCustomSection = () => {
    const title = newSectionTitle.trim();
    if (!title) return;
    const allOrders = [...data.plan.sectionConfigs.map((section) => section.order), ...data.plan.customSections.map((section) => section.order)];
    const section: CustomPlanSection = {
      id: `custom-${crypto.randomUUID()}`,
      title,
      subtitle: newSectionKind === 'budget' ? 'Plan and track a flexible amount.' : newSectionKind === 'goal' ? 'Track progress toward a target.' : 'Keep one-time actions together.',
      kind: newSectionKind,
      color: '#4f7c68',
      scope: newSectionScope,
      monthKey: newSectionScope === 'month' ? monthKey : undefined,
      order: Math.max(100, ...allOrders) + 10,
      items: [{ id: crypto.randomUUID(), label: newSectionKind === 'checklist' ? 'First task' : 'First item', plannedPaise: 0, actualPaise: 0, completed: false }],
    };
    onCommit((current) => ({ ...current, plan: { ...current.plan, customSections: [...current.plan.customSections, section] } }), 'Custom section added.');
    setNewSectionTitle('');
    setAddingSection(false);
  };

  const updateCustomSection = (id: string, changes: Partial<CustomPlanSection>) => onCommit((current) => ({
    ...current,
    plan: { ...current.plan, customSections: current.plan.customSections.map((section) => section.id === id ? { ...section, ...changes } : section) },
  }));

  const deleteCustomSection = (id: string) => {
    if (!window.confirm('Delete this custom section and all of its items? This cannot be undone.')) return;
    onCommit((current) => ({ ...current, plan: { ...current.plan, customSections: current.plan.customSections.filter((section) => section.id !== id) } }), 'Custom section deleted.');
  };

  const addCustomItem = (sectionId: string) => onCommit((current) => ({
    ...current,
    plan: {
      ...current.plan,
      customSections: current.plan.customSections.map((section) => section.id === sectionId ? {
        ...section,
        items: [...section.items, { id: crypto.randomUUID(), label: section.kind === 'checklist' ? 'New task' : 'New item', plannedPaise: 0, actualPaise: 0, completed: false }],
      } : section),
    },
  }), 'Item added.');

  const updateCustomItem = (sectionId: string, itemId: string, changes: Partial<CustomPlanSection['items'][number]>) => onCommit((current) => ({
    ...current,
    plan: {
      ...current.plan,
      customSections: current.plan.customSections.map((section) => section.id === sectionId ? {
        ...section,
        items: section.items.map((item) => item.id === itemId ? { ...item, ...changes } : item),
      } : section),
    },
  }), 'Item updated.');

  const deleteCustomItem = (sectionId: string, itemId: string) => onCommit((current) => ({
    ...current,
    plan: {
      ...current.plan,
      customSections: current.plan.customSections.map((section) => section.id === sectionId ? { ...section, items: section.items.filter((item) => item.id !== itemId) } : section),
    },
  }), 'Item deleted.');

  return (
    <div className="money-plan-layout">
      <section className="plan-builder-bar">
        <div><Settings2 size={19} /><span><strong>Flexible workspace</strong><small>Show only what matters now; month-only sections disappear outside their month.</small></span></div>
        <button className={customizing ? 'primary-button' : 'secondary-button'} onClick={() => setCustomizing((value) => !value)}><Settings2 size={16} />{customizing ? 'Done customizing' : 'Customize plan'}</button>
      </section>

      {customizing && (
        <section className="plan-customizer">
          <div className="plan-section-heading inline"><div><p className="eyebrow">Plan builder</p><h2>Arrange your sections</h2><p>Rename, reorder, hide, restore, or limit a section to one month. Hiding a built-in section keeps its data safe.</p></div><button className="primary-button" onClick={() => setAddingSection((value) => !value)}><Plus size={16} /> Add section</button></div>
          {addingSection && <div className="add-section-form"><label><span>Section name</span><input autoFocus placeholder="For example: December wedding" value={newSectionTitle} onChange={(event) => setNewSectionTitle(event.target.value)} /></label><label><span>Section type</span><select value={newSectionKind} onChange={(event) => setNewSectionKind(event.target.value as CustomSectionKind)}><option value="budget">Budget tracker</option><option value="goal">Goal tracker</option><option value="checklist">Checklist</option></select></label><label><span>Availability</span><select value={newSectionScope} onChange={(event) => setNewSectionScope(event.target.value as PlanSectionScope)}><option value="always">Every month</option><option value="month">Only {monthKey}</option></select></label><button className="primary-button" onClick={addCustomSection}>Create section</button></div>}
          <div className="section-config-list">
            {configurableSections.map(({ source, section }, index, list) => {
              const systemSection = source === 'system' ? section as PlanSectionConfig : null;
              const customSection = source === 'custom' ? section as CustomPlanSection : null;
              return (
                <article key={`${source}-${section.id}`} className={systemSection && !systemSection.visible ? 'hidden-section' : ''}>
                  <span className="section-drag-index">{index + 1}</span>
                  <div className="section-config-copy">
                    {customSection ? <select className="section-type-select" aria-label={`${section.title} section type`} value={customSection.kind} onChange={(event) => updateCustomSection(section.id, { kind: event.target.value as CustomSectionKind })}><option value="budget">Budget</option><option value="goal">Goal</option><option value="checklist">Checklist</option></select> : <span className="section-type-label">Built-in</span>}
                    <TextEditor label={`${section.title} title`} value={section.title} onSave={(title) => customSection ? updateCustomSection(section.id, { title }) : updateSectionConfig(section.id as SystemPlanSectionId, { title })} />
                    <TextEditor className="subtitle" label={`${section.title} subtitle`} value={section.subtitle} onSave={(subtitle) => customSection ? updateCustomSection(section.id, { subtitle }) : updateSectionConfig(section.id as SystemPlanSectionId, { subtitle })} />
                  </div>
                  {customSection && <label className="section-color" title="Section accent color"><input type="color" value={customSection.color} onChange={(event) => updateCustomSection(section.id, { color: event.target.value })} /></label>}
                  <label className="section-scope"><select value={section.scope} onChange={(event) => {
                    const scope = event.target.value as PlanSectionScope;
                    const changes = { scope, monthKey: scope === 'month' ? section.monthKey ?? monthKey : undefined };
                    if (customSection) updateCustomSection(section.id, changes);
                    else updateSectionConfig(section.id as SystemPlanSectionId, changes);
                  }}><option value="always">Every month</option><option value="month">One month</option></select>{section.scope === 'month' && <input type="month" value={section.monthKey ?? monthKey} onChange={(event) => customSection ? updateCustomSection(section.id, { monthKey: event.target.value }) : updateSectionConfig(section.id as SystemPlanSectionId, { monthKey: event.target.value })} />}</label>
                  <div className="section-order-buttons"><button disabled={index === 0} onClick={() => movePlanSection(source, section.id, -1)} aria-label={`Move ${section.title} up`}><ChevronUp size={16} /></button><button disabled={index === list.length - 1} onClick={() => movePlanSection(source, section.id, 1)} aria-label={`Move ${section.title} down`}><ChevronDown size={16} /></button></div>
                  {systemSection ? <button className="section-visibility-button" onClick={() => updateSectionConfig(systemSection.id, { visible: !systemSection.visible })}>{systemSection.visible ? <><EyeOff size={15} /> Hide</> : <><Eye size={15} /> Restore</>}</button> : <button className="section-delete-button" onClick={() => deleteCustomSection(section.id)}><Trash2 size={15} /> Delete</button>}
                </article>
              );
            })}
          </div>
          <p className="customizer-note">Built-in sections can be hidden and restored without losing data. Custom sections can be permanently deleted.</p>
        </section>
      )}

      <section className="plan-hero">
        <div>
          <p className="eyebrow">Guaranteed monthly system</p>
          <h2><MoneyEditor label="Monthly salary" value={data.plan.monthlySalaryPaise} onSave={(monthlySalaryPaise) => onCommit((current) => ({ ...current, plan: { ...current.plan, monthlySalaryPaise } }), 'Salary baseline updated.')} /> salary plan</h2>
          <p>Your defaults are ready, and every value below can be changed whenever your situation changes.</p>
        </div>
        <span className={`plan-balance-badge ${salaryBalanced ? 'balanced' : 'unbalanced'}`}>
          {salaryBalanced ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
          {salaryBalanced ? 'Every rupee assigned' : `${formatMoney(data.plan.monthlySalaryPaise - allocationTotal)} unassigned`}
        </span>
      </section>

      <section className="plan-section salary-system" style={{ order: sectionConfig('salary').order, display: showSection('salary') ? undefined : 'none' }}>
        <div className="plan-section-heading"><div><p className="eyebrow">Salary map</p><h2>{sectionConfig('salary').title}</h2><p>{sectionConfig('salary').subtitle}</p></div></div>
        <div className="allocation-grid">
          {allocations.map((allocation) => (
            <article className="allocation-card" key={allocation.id}>
              <span className="allocation-dot" style={{ background: allocation.color }} />
              <div className="allocation-card-title"><strong>{allocation.name}</strong><MoneyEditor label={`${allocation.name} plan`} value={allocation.plannedPaise} onSave={(value) => updateAllocation(allocation.id, value)} /></div>
              <div className="allocation-actual"><strong>{formatMoney(allocation.actualPaise)}</strong><span>tracked this month</span></div>
              <Progress percent={allocation.percent} color={allocation.color} />
              <footer><span>{Math.round(allocation.percent)}% used</span><span>{formatMoney(allocation.remainingPaise)} left</span></footer>
            </article>
          ))}
        </div>
      </section>

      <section className="plan-section living-system" style={{ order: sectionConfig('living').order, display: showSection('living') ? undefined : 'none' }}>
        <div className="plan-section-heading inline"><div><p className="eyebrow">Inside the living ceiling</p><h2>{sectionConfig('living').title}</h2><p>{sectionConfig('living').subtitle}</p></div><span className={`plan-balance-badge small ${livingBalanced ? 'balanced' : 'unbalanced'}`}>{livingBalanced ? 'Balanced at ' : 'Difference '}{formatMoney(livingBalanced ? livingTotal : livingPlan - livingTotal)}</span></div>
        <div className="living-plan-list">
          {livingCategories.map((category) => <div className="living-plan-row" key={category.id}><span className="category-icon" style={{ background: `${category.color}18`, color: category.color }}><CategoryIcon name={category.icon} /></span><strong>{category.name}</strong><MoneyEditor label={`${category.name} monthly budget`} value={category.monthlyBudgetPaise} onSave={(value) => updateCategory(category.id, value)} /></div>)}
          <div className="living-plan-total"><span>Total living plan</span><strong>{formatMoney(livingTotal)}</strong></div>
        </div>
      </section>

      <section className="plan-section card-system" style={{ order: sectionConfig('cards').order, display: showSection('cards') ? undefined : 'none' }}>
        <div className="plan-section-heading"><div><p className="eyebrow">Payment capacity, not income</p><h2>{sectionConfig('cards').title}</h2><p>{sectionConfig('cards').subtitle}</p></div></div>
        <div className="credit-card-grid">
          {cards.map((card) => (
            <article className={`credit-control-card ${card.aboveTarget ? 'attention' : ''}`} key={card.account.id}>
              <header><span style={{ background: card.account.color }}><CreditCard size={20} /></span><div><strong>{card.account.name}</strong><small>Statement due day <NumberEditor label={`${card.account.name} due day`} value={card.account.creditCard!.dueDay} min={1} max={31} onSave={(dueDay) => updateCard(card.account.id, { dueDay })} /></small></div><span className={card.aboveTarget ? 'card-risk' : 'card-ok'}>{card.aboveTarget ? 'Above target' : 'Within target'}</span></header>
              <div className="card-outstanding"><span>Outstanding liability</span><strong>{formatMoney(card.outstandingPaise)}</strong></div>
              <Progress percent={card.utilizationPercent} color={card.aboveTarget ? '#b3574d' : card.account.color} />
              <div className="card-stats"><div><span>Limit</span><MoneyEditor label={`${card.account.name} limit`} value={card.account.creditCard!.limitPaise} onSave={(limitPaise) => updateCard(card.account.id, { limitPaise })} /></div><div><span>Discipline target</span><span className="card-target-editor"><NumberEditor label={`${card.account.name} target utilization`} value={card.account.creditCard!.targetUtilizationPercent} min={1} max={100} suffix="%" onSave={(targetUtilizationPercent) => updateCard(card.account.id, { targetUtilizationPercent })} /><strong>{formatMoney(card.disciplineTargetPaise)}</strong></span></div><div><span>Opening liability</span><MoneyEditor label={`${card.account.name} opening balance`} value={card.account.creditCard!.openingBalancePaise} onSave={(openingBalancePaise) => updateCard(card.account.id, { openingBalancePaise })} /></div><div><span>Payments recorded</span><strong>{formatMoney(card.paymentsPaise)}</strong></div></div>
              <footer><span>{Math.round(card.utilizationPercent)}% utilization</span><span>{formatMoney(Math.max(0, card.account.creditCard!.limitPaise - card.outstandingPaise))} capacity left</span></footer>
            </article>
          ))}
        </div>
      </section>

      <section className="plan-section fund-system" style={{ order: sectionConfig('funds').order, display: showSection('funds') ? undefined : 'none' }}>
        <div className="plan-section-heading"><div><p className="eyebrow">Protected money</p><h2>{sectionConfig('funds').title}</h2><p>{sectionConfig('funds').subtitle}</p></div></div>
        <div className="fund-grid">
          {funds.map((fund) => (
            <article className="fund-card" key={fund.id}>
              <span className="fund-icon" style={{ background: `${fund.color}18`, color: fund.color }}>{fund.id === 'vietnam' ? <Plane size={19} /> : fund.id === 'emergency' ? <ShieldCheck size={19} /> : <Target size={19} />}</span>
              <div><strong>{fund.name}</strong>{fund.deadline && <small>Target {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(`${fund.deadline}T12:00:00`))}</small>}</div>
              <strong className="fund-balance">{formatMoney(fund.balancePaise)}</strong>
              <span className="fund-target">of <MoneyEditor label={`${fund.name} target`} value={fund.targetPaise} onSave={(targetPaise) => updateFund(fund.id, { targetPaise })} /></span>
              <Progress percent={fund.percent} color={fund.color} />
              <footer><label>Opening balance <MoneyEditor label={`${fund.name} opening balance`} value={fund.openingBalancePaise} onSave={(openingBalancePaise) => updateFund(fund.id, { openingBalancePaise })} /></label><span>{fund.targetPaise ? `${Math.round(fund.percent)}% funded` : 'No target required'}</span></footer>
            </article>
          ))}
        </div>
      </section>

      <section className="plan-section one-time-system" style={{ order: sectionConfig('one-time').order, display: showSection('one-time') ? undefined : 'none' }}>
        <div className="plan-section-heading"><div><p className="eyebrow">Separate from salary</p><h2>{sectionConfig('one-time').title}</h2><p>{sectionConfig('one-time').subtitle}</p></div></div>
        <div className="one-time-grid">
          <div><span>Gross expected</span><MoneyEditor label="One-time gross" value={data.plan.oneTimeIncome.grossPaise} onSave={(grossPaise) => onCommit((current) => ({ ...current, plan: { ...current.plan, oneTimeIncome: { ...current.plan.oneTimeIncome, grossPaise } } }), 'One-time plan updated.')} /></div>
          <div className="emphasized"><span>Actual net received</span><MoneyEditor label="Actual one-time net" value={data.plan.oneTimeIncome.actualNetPaise} onSave={(actualNetPaise) => onCommit((current) => ({ ...current, plan: { ...current.plan, oneTimeIncome: { ...current.plan.oneTimeIncome, actualNetPaise } } }), 'Actual net amount updated.')} /></div>
          <div><span>Education-loan prepayment</span><MoneyEditor label="Loan prepayment allocation" value={data.plan.oneTimeIncome.loanPrepaymentPaise} onSave={(loanPrepaymentPaise) => onCommit((current) => ({ ...current, plan: { ...current.plan, oneTimeIncome: { ...current.plan.oneTimeIncome, loanPrepaymentPaise } } }), 'One-time allocation updated.')} /></div>
          <div><span>Vietnam cash allocation</span><MoneyEditor label="Vietnam one-time allocation" value={data.plan.oneTimeIncome.vietnamPaise} onSave={(vietnamPaise) => onCommit((current) => ({ ...current, plan: { ...current.plan, oneTimeIncome: { ...current.plan.oneTimeIncome, vietnamPaise } } }), 'One-time allocation updated.')} /></div>
          <div className={`one-time-remaining ${hasActualOneTime && oneTimeRemaining < 0 ? 'negative' : ''}`}><span>{hasActualOneTime ? 'Unallocated net money' : 'Planned allocation requirement'}</span><strong>{formatMoney(hasActualOneTime ? oneTimeRemaining : oneTimePlanned)}</strong><small>{!hasActualOneTime ? 'Enter the actual net amount before treating any remainder as available' : oneTimeRemaining < 0 ? 'Planned allocations exceed net money' : 'Available for emergency fund and investments'}</small></div>
        </div>
      </section>

      <section className="plan-section side-system" style={{ order: sectionConfig('side-hustle').order, display: showSection('side-hustle') ? undefined : 'none' }}>
        <div className="plan-section-heading"><div><p className="eyebrow">Uncertain until received</p><h2>{sectionConfig('side-hustle').title}</h2><p>{sectionConfig('side-hustle').subtitle}</p></div></div>
        <div className="side-hustle-summary"><div><span>Gross received</span><MoneyEditor label="Side hustle gross received" value={data.plan.sideHustle.grossReceivedPaise} onSave={(grossReceivedPaise) => onCommit((current) => ({ ...current, plan: { ...current.plan, sideHustle: { ...current.plan.sideHustle, grossReceivedPaise } } }), 'Side-hustle income updated.')} /></div><ArrowRight size={18} /><div><span>Tax reserve</span><MoneyEditor label="Side hustle tax reserve" value={data.plan.sideHustle.taxReservePaise} onSave={(taxReservePaise) => onCommit((current) => ({ ...current, plan: { ...current.plan, sideHustle: { ...current.plan.sideHustle, taxReservePaise } } }), 'Tax reserve updated.')} /></div><ArrowRight size={18} /><div><span>Business costs</span><MoneyEditor label="Side hustle business costs" value={data.plan.sideHustle.businessCostsPaise} onSave={(businessCostsPaise) => onCommit((current) => ({ ...current, plan: { ...current.plan, sideHustle: { ...current.plan.sideHustle, businessCostsPaise } } }), 'Business costs updated.')} /></div><ArrowRight size={18} /><div className="side-net"><span>Net available</span><strong>{formatMoney(sideNet)}</strong></div></div>
        <div className="side-allocation-grid">
          {([
            ['emergencyAllocationPaise', 'Emergency fund', ShieldCheck],
            ['investmentAllocationPaise', 'Investments', TrendingUp],
            ['businessReinvestmentPaise', 'Business reinvestment', Landmark],
            ['goalsAllocationPaise', 'Goals / travel', Plane],
          ] as const).map(([key, label, Icon]) => <div key={key}><span><Icon size={17} />{label}</span><MoneyEditor label={`Side hustle ${label}`} value={data.plan.sideHustle[key]} onSave={(value) => onCommit((current) => ({ ...current, plan: { ...current.plan, sideHustle: { ...current.plan.sideHustle, [key]: value } } }), 'Side-hustle allocation updated.')} /></div>)}
        </div>
        <div className={`side-unallocated ${sideAllocated > sideNet ? 'negative' : ''}`}><span>Net still unallocated</span><strong>{formatMoney(sideNet - sideAllocated)}</strong></div>
        <div className="scenario-strip"><span><Sparkles size={16} /> Quick scenarios</span>{[0, 100_000, 200_000].map((amount) => <div key={amount}><strong>{amount ? formatMoney(amount * 100) : 'No side hustle'}</strong><small>{amount ? `${formatMoney(amount * 40)} emergency · ${formatMoney(amount * 25)} investments` : 'Salary plan remains unchanged'}</small></div>)}</div>
      </section>

      <section className="plan-section obligation-system" style={{ order: sectionConfig('obligations').order, display: showSection('obligations') ? undefined : 'none' }}>
        <div className="plan-section-heading"><div><p className="eyebrow">Money that must be paid</p><h2>{sectionConfig('obligations').title}</h2><p>{sectionConfig('obligations').subtitle}</p></div></div>
        <div className="obligation-list">
          {data.plan.obligations.map((item) => <article key={item.id} className={!item.active ? 'completed' : ''}><span className="obligation-icon">{item.type === 'credit_card' ? <WalletCards size={19} /> : <Landmark size={19} />}</span><div><strong>{item.name}</strong><small>{item.type.replace('_', ' ')} · Due day {item.dueDay}</small></div><label><span>Monthly</span><MoneyEditor label={`${item.name} monthly payment`} value={item.monthlyPaymentPaise} onSave={(monthlyPaymentPaise) => updateObligation(item.id, { monthlyPaymentPaise })} /></label><label><span>Remaining</span>{item.remainingPaise === null ? <button className="set-value-button" onClick={() => updateObligation(item.id, { remainingPaise: 0 })}>Set balance</button> : <MoneyEditor label={`${item.name} remaining`} value={item.remainingPaise} onSave={(remainingPaise) => updateObligation(item.id, { remainingPaise })} />}</label><label className="obligation-toggle"><input type="checkbox" checked={!item.active} onChange={(event) => updateObligation(item.id, { active: !event.target.checked })} /><span>Completed</span></label></article>)}
        </div>
      </section>

      <section className="plan-section timeline-system" style={{ order: sectionConfig('timeline').order, display: showSection('timeline') ? undefined : 'none' }}>
        <div className="plan-section-heading"><div><p className="eyebrow">Sequence matters</p><h2>{sectionConfig('timeline').title}</h2><p>{sectionConfig('timeline').subtitle}</p></div></div>
        <div className="timeline-list">
          {data.plan.timeline.map((event, index) => <article key={event.id}><span className={`timeline-marker ${event.status}`}>{event.status === 'completed' ? <CheckCircle2 size={18} /> : index + 1}</span><div><span>{event.dateLabel}</span><strong>{event.label}</strong><p>{event.description}</p></div>{event.amountPaise !== undefined && <strong className="timeline-amount">{formatMoney(event.amountPaise)}</strong>}<select value={event.status} onChange={(change) => updateTimeline(event.id, change.target.value as TimelineEvent['status'])}><option value="planned">Planned</option><option value="funded">Funded</option><option value="completed">Completed</option></select></article>)}
        </div>
      </section>

      <section className="plan-section priority-system" style={{ order: sectionConfig('priorities').order, display: showSection('priorities') ? undefined : 'none' }}>
        <div className="plan-section-heading"><div><p className="eyebrow">When money is tight</p><h2>{sectionConfig('priorities').title}</h2><p>{sectionConfig('priorities').subtitle}</p></div></div>
        <ol>{data.plan.priorities.map((priority, index) => <li key={priority}><span>{index + 1}</span><strong>{priority}</strong></li>)}</ol>
      </section>

      {visibleCustomSections.map((section) => {
        const plannedTotal = section.items.reduce((total, item) => total + item.plannedPaise, 0);
        const actualTotal = section.items.reduce((total, item) => total + item.actualPaise, 0);
        const completedTotal = section.items.filter((item) => item.completed).length;
        const progress = section.kind === 'checklist' ? (section.items.length ? (completedTotal / section.items.length) * 100 : 0) : (plannedTotal ? (actualTotal / plannedTotal) * 100 : 0);
        return (
          <section className="plan-section custom-plan-section" style={{ order: section.order, '--section-accent': section.color } as React.CSSProperties} key={section.id}>
            <div className="custom-section-accent" />
            <div className="plan-section-heading inline">
              <div>
                <p className="eyebrow">{section.kind === 'budget' ? 'Flexible budget' : section.kind === 'goal' ? 'Flexible goal' : 'Flexible checklist'}{section.scope === 'month' ? ` · ${section.monthKey}` : ''}</p>
                {customizing ? <TextEditor className="custom-title-editor" label={`${section.title} title`} value={section.title} onSave={(title) => updateCustomSection(section.id, { title })} /> : <h2>{section.title}</h2>}
                {customizing ? <TextEditor className="custom-subtitle-editor" label={`${section.title} subtitle`} value={section.subtitle} onSave={(subtitle) => updateCustomSection(section.id, { subtitle })} /> : <p>{section.subtitle}</p>}
              </div>
              <div className="custom-section-summary"><strong>{section.kind === 'checklist' ? `${completedTotal}/${section.items.length}` : formatMoney(actualTotal)}</strong><span>{section.kind === 'checklist' ? 'tasks completed' : `of ${formatMoney(plannedTotal)}`}</span></div>
            </div>
            <Progress percent={progress} color={section.color} />
            <div className={`custom-item-list ${section.kind}`}>
              {section.items.map((item) => (
                <article key={item.id} className={item.completed ? 'completed' : ''}>
                  {section.kind === 'checklist' && <label className="custom-check"><input type="checkbox" checked={item.completed} onChange={(event) => updateCustomItem(section.id, item.id, { completed: event.target.checked })} /><span /> </label>}
                  <TextEditor label="Item name" value={item.label} onSave={(label) => updateCustomItem(section.id, item.id, { label })} />
                  {section.kind !== 'checklist' && <><label className="custom-money-field"><span>{section.kind === 'goal' ? 'Target' : 'Planned'}</span><MoneyEditor label={`${item.label} planned amount`} value={item.plannedPaise} onSave={(plannedPaise) => updateCustomItem(section.id, item.id, { plannedPaise })} /></label><label className="custom-money-field"><span>{section.kind === 'goal' ? 'Current' : 'Actual'}</span><MoneyEditor label={`${item.label} actual amount`} value={item.actualPaise} onSave={(actualPaise) => updateCustomItem(section.id, item.id, { actualPaise })} /></label></>}
                  <button className="custom-item-delete" onClick={() => deleteCustomItem(section.id, item.id)} aria-label={`Delete ${item.label}`}><Trash2 size={15} /></button>
                </article>
              ))}
              {section.items.length === 0 && <div className="custom-empty-state"><Target size={19} /><span>This section is empty. Add the first item when you are ready.</span></div>}
            </div>
            <button className="add-custom-item" onClick={() => addCustomItem(section.id)}><Plus size={15} /> Add {section.kind === 'checklist' ? 'task' : 'item'}</button>
          </section>
        );
      })}
    </div>
  );
}
