import { ChevronDown, Plus } from 'lucide-react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  monthKey: string;
  onMonthChange: (month: string) => void;
  onAdd: () => void;
  onSettings: () => void;
  userName: string;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  monthKey,
  onMonthChange,
  onAdd,
  onSettings,
  userName,
}: PageHeaderProps) {
  const monthLabel = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(
    new Date(`${monthKey}-01T12:00:00`),
  );
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      <div className="header-actions">
        <label className="month-picker">
          <span className="sr-only">Select month</span>
          <input type="month" value={monthKey} onChange={(event) => onMonthChange(event.target.value)} />
          <span>{monthLabel}</span>
          <ChevronDown size={16} />
        </label>
        <button className="avatar-button" title={userName} aria-label={`Open ${userName}'s settings`} onClick={onSettings}>
          {userName.slice(0, 1).toUpperCase()}
        </button>
        <button className="header-add" onClick={onAdd}>
          <Plus size={18} /> Add transaction
        </button>
      </div>
    </header>
  );
}
