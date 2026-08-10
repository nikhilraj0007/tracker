import { describe, expect, it } from 'vitest';
import { createDefaultData } from './defaultData';
import { createWorkspacePage, workspaceTemplates } from './workspaceTemplates';

describe('workspace templates', () => {
  it('keeps the personal finance workspace as a default without replacing Money Plan', () => {
    const data = createDefaultData();
    expect(data.workspace.activePageId).toBe('workspace-money-hq');
    expect(data.workspace.pages[0].blocks.some((block) => block.kind === 'transactions')).toBe(true);
    expect(data.plan.monthlySalaryPaise).toBe(8_000_000);
  });

  it('creates every template as a self-contained page with unique block ids', () => {
    for (const template of workspaceTemplates) {
      const page = createWorkspacePage(template.id);
      expect(page.title).toBe(template.name);
      expect(page.archived).toBe(false);
      expect(new Set(page.blocks.map((block) => block.id)).size).toBe(page.blocks.length);
    }
  });
});
