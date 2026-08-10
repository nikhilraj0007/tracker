import { cleanup, render, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Sidebar } from './Sidebar';

afterEach(cleanup);

describe('mobile app navigation', () => {
  it('keeps five primary tabs and leaves Settings to the profile action', () => {
    const { container } = render(<Sidebar active="workspace" onNavigate={() => undefined} onAdd={() => undefined} />);
    const mobileNav = container.querySelector<HTMLElement>('.mobile-nav');
    expect(mobileNav).not.toBeNull();
    expect(within(mobileNav!).getAllByRole('button')).toHaveLength(5);
    expect(within(mobileNav!).queryByText('Settings')).not.toBeInTheDocument();
    expect(within(mobileNav!).getByText('Workspace')).toBeInTheDocument();
    expect(within(mobileNav!).queryByRole('button', { name: 'Add transaction' })).not.toBeInTheDocument();
  });

  it('shows the transaction action only on relevant primary screens', () => {
    const { container } = render(<Sidebar active="transactions" onNavigate={() => undefined} onAdd={() => undefined} />);
    const mobileNav = container.querySelector<HTMLElement>('.mobile-nav');
    expect(within(mobileNav!).getByRole('button', { name: 'Add transaction' })).toBeInTheDocument();
  });
});
