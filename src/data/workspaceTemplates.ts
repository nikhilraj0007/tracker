import type { WorkspaceBlock, WorkspaceBlockKind, WorkspacePage } from '../domain/types';

export type WorkspaceTemplateId = 'blank' | 'monthly' | 'travel' | 'side-hustle' | 'annual';

export const workspaceTemplates: Array<{ id: WorkspaceTemplateId; name: string; description: string; icon: string }> = [
  { id: 'blank', name: 'Blank page', description: 'A clean canvas for any idea.', icon: '◇' },
  { id: 'monthly', name: 'Monthly command centre', description: 'Live KPIs, activity, priorities, and spending.', icon: '◫' },
  { id: 'travel', name: 'Travel planner', description: 'Budget, bookings, dates, and a preparation board.', icon: '✈' },
  { id: 'side-hustle', name: 'Side-hustle studio', description: 'Income, costs, pipeline, and next actions.', icon: '↗' },
  { id: 'annual', name: 'Annual expenses', description: 'See irregular costs in calendar or table form.', icon: '◷' },
];

const block = (kind: WorkspaceBlockKind, title: string, order: number, overrides: Partial<WorkspaceBlock> = {}): WorkspaceBlock => ({
  id: crypto.randomUUID(),
  kind,
  title,
  content: '',
  color: '#3f7665',
  width: 'full',
  order,
  items: [],
  ...overrides,
});

export function createWorkspacePage(templateId: WorkspaceTemplateId, customTitle?: string): WorkspacePage {
  const template = workspaceTemplates.find((item) => item.id === templateId) ?? workspaceTemplates[0];
  const timestamp = new Date().toISOString();
  const year = new Date().getFullYear();
  const base: Omit<WorkspacePage, 'blocks'> = {
    id: crypto.randomUUID(),
    title: customTitle?.trim() || template.name,
    icon: template.icon,
    coverColor: templateId === 'travel' ? '#315e69' : templateId === 'side-hustle' ? '#5c6840' : '#173f34',
    description: template.description,
    archived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const blocksByTemplate: Record<WorkspaceTemplateId, WorkspaceBlock[]> = {
    blank: [
      block('text', 'Start writing', 10, { content: 'Use Add block or the / shortcut to build this page.' }),
    ],
    monthly: [
      block('callout', 'This month', 10, { content: 'Use this page as a flexible layer over your trusted Money Plan.', color: '#dff28f' }),
      block('kpi', 'Spent this month', 20, { metric: 'spent', width: 'half', color: '#b35c52' }),
      block('kpi', 'Plan remaining', 30, { metric: 'remaining', width: 'half', color: '#3f7665' }),
      block('transactions', 'Latest activity', 40, { content: 'Live transactions for the selected month.', color: '#456b8e' }),
      block('checklist', 'Monthly priorities', 50, { items: [
        { id: crypto.randomUUID(), title: 'Pay card statements in full', amountPaise: 0, status: 'not_started', note: '' },
        { id: crypto.randomUUID(), title: 'Review planned versus actual', amountPaise: 0, status: 'not_started', note: '' },
      ] }),
      block('chart', 'Spending by category', 60),
    ],
    travel: [
      block('callout', 'Trip brief', 10, { content: 'Keep the budget, bookings, and preparation in one temporary page.', color: '#bfe6e8' }),
      block('kpi', 'Travel fund', 20, { metric: 'funds', width: 'half', color: '#3f7d85' }),
      block('collection', 'Trip plan', 30, { collectionView: 'board', items: [
        { id: crypto.randomUUID(), title: 'Book transport', amountPaise: 0, status: 'not_started', date: `${year}-10-01`, note: '' },
        { id: crypto.randomUUID(), title: 'Reserve accommodation', amountPaise: 0, status: 'not_started', date: `${year}-10-05`, note: '' },
        { id: crypto.randomUUID(), title: 'Prepare travel cash', amountPaise: 0, status: 'not_started', date: `${year}-10-15`, note: '' },
      ] }),
    ],
    'side-hustle': [
      block('kpi', 'Side-hustle income', 10, { metric: 'income', width: 'half', color: '#647445' }),
      block('collection', 'Opportunity pipeline', 20, { collectionView: 'table', items: [
        { id: crypto.randomUUID(), title: 'First opportunity', amountPaise: 0, status: 'not_started', note: 'Add the next action here.' },
      ] }),
      block('checklist', 'Weekly actions', 30, { items: [
        { id: crypto.randomUUID(), title: 'Review leads and invoices', amountPaise: 0, status: 'not_started', note: '' },
      ] }),
    ],
    annual: [
      block('callout', 'Irregular money', 10, { content: 'Plan costs that do not belong in every monthly budget.', color: '#f0dfae' }),
      block('collection', 'Annual expenses', 20, { collectionView: 'calendar', items: [
        { id: crypto.randomUUID(), title: 'Insurance renewal', amountPaise: 0, status: 'not_started', date: `${year}-12-01`, note: '' },
        { id: crypto.randomUUID(), title: 'Annual subscription', amountPaise: 0, status: 'not_started', date: `${year}-06-01`, note: '' },
      ] }),
    ],
  };

  return { ...base, blocks: blocksByTemplate[templateId] };
}
