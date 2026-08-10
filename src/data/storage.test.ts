import { describe, expect, it } from 'vitest';
import { createDefaultData } from './defaultData';
import { validateAppData } from './storage';

describe('workspace data migration', () => {
  it('upgrades a version-four backup and preserves its financial plan', () => {
    const current = createDefaultData();
    const { workspace: _workspace, ...legacy } = current;
    const versionFour = { ...legacy, version: 4 };
    const migrated = validateAppData(versionFour);
    expect(migrated.version).toBe(5);
    expect(migrated.workspace.pages[0].title).toBe('My money HQ');
    expect(migrated.plan.monthlySalaryPaise).toBe(current.plan.monthlySalaryPaise);
    expect(migrated.plan.sectionConfigs).toEqual(current.plan.sectionConfigs);
  });

  it('validates an active custom dashboard and its live system blocks', () => {
    const current = createDefaultData();
    current.workspace.dashboardPageId = current.workspace.pages[0].id;
    current.workspace.pages[0].blocks.push({
      id: 'workspace-budget', kind: 'budget', title: 'Monthly money plan', content: '', color: '#173f34', width: 'full', order: 70, items: [],
    });

    const validated = validateAppData(current);
    expect(validated.workspace.dashboardPageId).toBe('workspace-money-hq');
    expect(validated.workspace.pages[0].blocks.at(-1)?.kind).toBe('budget');
  });
});
