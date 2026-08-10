import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDefaultData } from '../data/defaultData';
import { WorkspaceDashboard } from './WorkspaceDashboard';

afterEach(cleanup);

describe('Workspace dashboard', () => {
  it('renders a promoted page as Overview and exposes reversible controls', () => {
    const data = createDefaultData();
    const customize = vi.fn();
    const restore = vi.fn();
    render(<WorkspaceDashboard data={data} page={data.workspace.pages[0]} monthKey="2026-08" onCustomize={customize} onRestoreDefault={restore} onAddTransaction={() => undefined} />);

    expect(screen.getByText('Custom dashboard')).toBeInTheDocument();
    expect(screen.getAllByText('My money HQ').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Customize page/i }));
    fireEvent.click(screen.getByRole('button', { name: /Standard overview/i }));
    expect(customize).toHaveBeenCalledOnce();
    expect(restore).toHaveBeenCalledOnce();
  });
});
