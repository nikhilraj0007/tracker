import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { createDefaultData } from '../data/defaultData';
import type { AppData } from '../domain/types';
import { MoneyPlanPage } from './MoneyPlanPage';

afterEach(cleanup);

function MoneyPlanHarness() {
  const [data, setData] = useState(createDefaultData());
  const commit = (updater: (current: AppData) => AppData) => setData((current) => updater(current));
  return <MoneyPlanPage data={data} monthKey="2026-08" onCommit={commit} />;
}

describe('Money Plan customization', () => {
  it('can hide and safely restore a built-in section', () => {
    render(<MoneyPlanHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Customize plan' }));
    const titleEditor = screen.getByLabelText('Monthly allocation title');
    const managerRow = titleEditor.closest('article');
    expect(managerRow).not.toBeNull();
    fireEvent.click(within(managerRow!).getByRole('button', { name: /hide/i }));
    expect(screen.queryByRole('heading', { name: 'Monthly allocation' })).not.toBeInTheDocument();
    fireEvent.click(within(managerRow!).getByRole('button', { name: /restore/i }));
    expect(screen.getByRole('heading', { name: 'Monthly allocation' })).toBeInTheDocument();
  });

  it('creates a custom tracker and lets it grow line by line', () => {
    render(<MoneyPlanHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Customize plan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add section' }));
    fireEvent.change(screen.getByLabelText('Section name'), { target: { value: 'Holiday extras' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create section' }));
    expect(screen.getAllByLabelText('Holiday extras title')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Done customizing' }));
    expect(screen.getByRole('heading', { name: 'Holiday extras' })).toBeInTheDocument();
    expect(screen.getAllByLabelText('Item name')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }));
    expect(screen.getAllByLabelText('Item name')).toHaveLength(2);
  });
});
