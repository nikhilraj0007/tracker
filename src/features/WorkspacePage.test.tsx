import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { createDefaultData } from '../data/defaultData';
import type { AppData } from '../domain/types';
import { WorkspacePage } from './WorkspacePage';

afterEach(cleanup);

function WorkspaceHarness() {
  const [data, setData] = useState(createDefaultData());
  const commit = (updater: (current: AppData) => AppData) => setData((current) => updater(current));
  return <WorkspacePage data={data} monthKey="2026-08" onCommit={commit} onAddTransaction={() => undefined} />;
}

describe('Workspace builder', () => {
  it('creates a separate page from a finance template', () => {
    render(<WorkspaceHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'New workspace page' }));
    fireEvent.click(screen.getByRole('button', { name: /Travel planner/i }));
    expect(screen.getByLabelText('Page title')).toHaveValue('Travel planner');
    expect(screen.getByLabelText('collection block title')).toHaveValue('Trip plan');
  });

  it('adds a block and changes a collection view without duplicating its items', () => {
    render(<WorkspaceHarness />);
    fireEvent.click(screen.getByRole('button', { name: /Add block/i }));
    fireEvent.click(screen.getByRole('button', { name: /Checklist/i }));
    expect(screen.getByLabelText('checklist block title')).toHaveValue('Checklist');
    fireEvent.click(screen.getByRole('button', { name: 'Table' }));
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Item name')[0]).toHaveValue('Pay card statements in full');
  });

  it('promotes any page to the dashboard and adds missing dashboard systems', () => {
    render(<WorkspaceHarness />);
    fireEvent.click(screen.getByRole('button', { name: /Use as dashboard/i }));

    expect(screen.getByRole('button', { name: /Standard overview/i })).toBeInTheDocument();
    expect(screen.getByLabelText('budget block title')).toHaveValue('Monthly money plan');
    expect(screen.getByLabelText('accounts block title')).toHaveValue('Credit position');
    expect(screen.getByLabelText('goals block title')).toHaveValue('Goals and dedicated funds');

    fireEvent.click(screen.getByRole('button', { name: /Standard overview/i }));
    expect(screen.getByRole('button', { name: /Use as dashboard/i })).toBeInTheDocument();
  });
});
