import {
  ArrowRightLeft,
  ChartNoAxesCombined,
  LayoutGrid,
  LayoutDashboard,
  PiggyBank,
  Plus,
  Settings,
  WalletCards,
} from 'lucide-react';
import type { AppView } from '../domain/types';

const items: { id: AppView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
  { id: 'budgets', label: 'Money plan', icon: PiggyBank },
  { id: 'workspace', label: 'Workspace', icon: LayoutGrid },
  { id: 'analysis', label: 'Insights', icon: ChartNoAxesCombined },
  { id: 'settings', label: 'Settings', icon: Settings },
];
const mobileItems = items.filter((item) => item.id !== 'settings');

interface SidebarProps {
  active: AppView;
  onNavigate: (view: AppView) => void;
  onAdd: () => void;
}

export function Sidebar({ active, onNavigate, onAdd }: SidebarProps) {
  return (
    <>
      <aside className="sidebar">
        <button className="brand" onClick={() => onNavigate('dashboard')} aria-label="Paisa overview">
          <span className="brand-mark">₹</span>
          <span>Paisa</span>
        </button>

        <nav className="primary-nav" aria-label="Main navigation">
          <p className="nav-label">Workspace</p>
          {items.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${active === id ? 'active' : ''}`}
              onClick={() => onNavigate(id)}
              aria-current={active === id ? 'page' : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="privacy-note">
          <WalletCards size={19} />
          <div>
            <strong>Private by design</strong>
            <span>Your money data stays on this device.</span>
          </div>
        </div>
        <button className="add-expense-button" onClick={onAdd}>
          <Plus size={19} /> Add transaction
        </button>
      </aside>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {mobileItems.map(({ id, label, icon: Icon }) => (
          <button key={id} className={active === id ? 'active' : ''} onClick={() => onNavigate(id)}>
            <Icon size={21} />
            <span>{label}</span>
          </button>
        ))}
        {(active === 'dashboard' || active === 'transactions') && <button className="mobile-add" onClick={onAdd} aria-label="Add transaction"><Plus size={24} /></button>}
      </nav>
    </>
  );
}
