import { CheckCircle2, LoaderCircle, X } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from './components/PageHeader';
import { Sidebar } from './components/Sidebar';
import { TransactionModal } from './components/TransactionModal';
import { createDefaultData } from './data/defaultData';
import { exportCsv, exportJson, loadAppData, saveAppData, validateAppData } from './data/storage';
import type { AppData, AppView, MoneyTransaction } from './domain/types';
import { Dashboard } from './features/Dashboard';
import { MoneyPlanPage } from './features/MoneyPlanPage';
import { SettingsPage } from './features/SettingsPage';
import { TransactionsPage } from './features/TransactionsPage';
import { WorkspaceDashboard } from './features/WorkspaceDashboard';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const AnalysisPage = lazy(() => import('./features/AnalysisPage').then((module) => ({ default: module.AnalysisPage })));
const WorkspacePage = lazy(() => import('./features/WorkspacePage').then((module) => ({ default: module.WorkspacePage })));

const currentMonth = () => new Date().toISOString().slice(0, 7);
const initialView = (): AppView => {
  const requested = new URLSearchParams(window.location.search).get('view');
  return requested && ['dashboard', 'transactions', 'budgets', 'workspace', 'analysis', 'settings'].includes(requested) ? requested as AppView : 'dashboard';
};

const pageCopy: Record<AppView, { eyebrow: string; title: string; subtitle: string }> = {
  dashboard: { eyebrow: 'Good to see you', title: 'Your money, made clear.', subtitle: 'A calm view of what came in, what went out, and what needs attention.' },
  transactions: { eyebrow: 'Money activity', title: 'Every rupee, accounted for.', subtitle: 'Search, review, and keep your monthly ledger accurate.' },
  budgets: { eyebrow: 'Your complete money system', title: 'Give every rupee a job.', subtitle: 'Salary, cards, EMIs, funds, one-time money, side hustle, and goals in one editable plan.' },
  workspace: { eyebrow: 'Flexible financial workspace', title: 'Build the view you need.', subtitle: 'Create pages, combine live money blocks, and change the same information between table, board, calendar, and cards.' },
  analysis: { eyebrow: 'Financial patterns', title: 'Turn spending into insight.', subtitle: 'Understand the habits behind the numbers without the spreadsheet work.' },
  settings: { eyebrow: 'Preferences and privacy', title: 'Your Paisa, your rules.', subtitle: 'Manage appearance, backups, and local data.' },
};

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [view, setView] = useState<AppView>(initialView);
  const [monthKey, setMonthKey] = useState(currentMonth());
  const [transactionModal, setTransactionModal] = useState<{ open: boolean; transaction?: MoneyTransaction | null }>({ open: false });
  const [toast, setToast] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

  useEffect(() => {
    const fallback = window.setTimeout(() => {
      setData((current) => current ?? createDefaultData());
      setToast('Local storage is taking longer than expected. Paisa opened with safe demonstration data.');
    }, 1200);
    loadAppData().then((saved) => {
      window.clearTimeout(fallback);
      setData(saved);
    }).catch((error) => {
      window.clearTimeout(fallback);
      console.error(error);
      setData(createDefaultData());
      setToast('Local data could not be opened. Safe demonstration data was loaded.');
    });
    return () => window.clearTimeout(fallback);
  }, []);

  useEffect(() => {
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const markInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setToast('Paisa is installed on this device.');
    };
    window.addEventListener('beforeinstallprompt', capturePrompt);
    window.addEventListener('appinstalled', markInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', capturePrompt);
      window.removeEventListener('appinstalled', markInstalled);
    };
  }, []);

  const resolvedTheme = useMemo(() => {
    if (!data) return 'light';
    if (data.preferences.theme !== 'system') return data.preferences.theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, [data]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const commit = useCallback((updater: (current: AppData) => AppData, successMessage?: string) => {
    setData((current) => {
      if (!current) return current;
      const next = { ...updater(current), updatedAt: new Date().toISOString() } as AppData;
      saveAppData(next).catch((error) => {
        console.error(error);
        setToast('The change could not be saved locally.');
      });
      return next;
    });
    if (successMessage) setToast(successMessage);
  }, []);

  const saveTransaction = (transaction: MoneyTransaction) => {
    commit((current) => {
      const exists = current.transactions.some((item) => item.id === transaction.id);
      return {
        ...current,
        transactions: exists
          ? current.transactions.map((item) => item.id === transaction.id ? transaction : item)
          : [transaction, ...current.transactions],
      };
    }, transactionModal.transaction ? 'Transaction updated.' : 'Transaction added.');
    setTransactionModal({ open: false });
  };

  const deleteTransaction = (id: string) => {
    if (!window.confirm('Delete this transaction? This cannot be undone.')) return;
    commit((current) => ({ ...current, transactions: current.transactions.filter((item) => item.id !== id) }), 'Transaction deleted.');
    setTransactionModal({ open: false });
  };

  const importBackup = async (file: File) => {
    try {
      const imported = validateAppData(JSON.parse(await file.text()));
      if (!window.confirm(`Restore ${imported.transactions.length} transactions from this backup? Your current local data will be replaced.`)) return;
      await saveAppData(imported);
      setData(imported);
      setToast('Backup restored successfully.');
    } catch (error) {
      console.error(error);
      setToast('That file is not a valid Paisa backup. No data was changed.');
    }
  };

  const resetData = async () => {
    if (!window.confirm('Reset to your original ₹80k personal-plan defaults? Export a backup first if you need your current records.')) return;
    const defaults = createDefaultData();
    await saveAppData(defaults);
    setData(defaults);
    setMonthKey(currentMonth());
    setToast('Personal-plan defaults restored.');
  };

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setToast('Installing Paisa…');
    setInstallPrompt(null);
  };

  if (!data) {
    return <main className="loading-screen"><span className="brand-mark large">₹</span><LoaderCircle className="spinner" size={22} /><strong>Opening your money space</strong></main>;
  }

  const customDashboardPage = data.workspace.dashboardPageId
    ? data.workspace.pages.find((page) => page.id === data.workspace.dashboardPageId && !page.archived)
    : undefined;
  const copy = view === 'dashboard' && customDashboardPage
    ? { eyebrow: 'Your custom overview', title: customDashboardPage.title, subtitle: 'A live dashboard built from your Workspace page.' }
    : pageCopy[view];
  const openDashboardEditor = () => {
    if (customDashboardPage) commit((current) => ({ ...current, workspace: { ...current.workspace, activePageId: customDashboardPage.id } }));
    setView('workspace');
  };
  return (
    <div className="app-shell">
      <Sidebar active={view} onNavigate={setView} onAdd={() => setTransactionModal({ open: true })} />
      <main className="main-content">
        <PageHeader {...copy} monthKey={monthKey} onMonthChange={setMonthKey} onAdd={() => setTransactionModal({ open: true })} onSettings={() => setView('settings')} userName={data.preferences.userName} />
        {view === 'dashboard' && (customDashboardPage
          ? <WorkspaceDashboard data={data} page={customDashboardPage} monthKey={monthKey} onCustomize={openDashboardEditor} onRestoreDefault={() => commit((current) => ({ ...current, workspace: { ...current.workspace, dashboardPageId: undefined } }), 'Standard Overview restored.')} onAddTransaction={() => setTransactionModal({ open: true })} />
          : <Dashboard data={data} monthKey={monthKey} onNavigate={setView} onCustomize={() => setView('workspace')} onEditTransaction={(transaction) => setTransactionModal({ open: true, transaction })} />)}
        {view === 'transactions' && <TransactionsPage data={data} monthKey={monthKey} onAdd={() => setTransactionModal({ open: true })} onEdit={(transaction) => setTransactionModal({ open: true, transaction })} onExport={() => exportCsv(data)} />}
        {view === 'budgets' && <MoneyPlanPage data={data} monthKey={monthKey} onCommit={commit} />}
        {view === 'workspace' && <Suspense fallback={<div className="page-loader"><LoaderCircle className="spinner" size={20} /> Loading workspace…</div>}><WorkspacePage data={data} monthKey={monthKey} onCommit={commit} onAddTransaction={() => setTransactionModal({ open: true })} /></Suspense>}
        {view === 'analysis' && <Suspense fallback={<div className="page-loader"><LoaderCircle className="spinner" size={20} /> Loading insights…</div>}><AnalysisPage data={data} monthKey={monthKey} /></Suspense>}
        {view === 'settings' && <SettingsPage data={data} canInstall={Boolean(installPrompt)} installed={installed} onInstall={installApp} onExportJson={() => exportJson(data)} onExportCsv={() => exportCsv(data)} onImport={importBackup} onThemeChange={(theme) => commit((current) => ({ ...current, preferences: { ...current.preferences, theme } }), 'Appearance updated.')} onReset={resetData} />}
      </main>

      {transactionModal.open && <TransactionModal accounts={data.accounts} categories={data.categories} transaction={transactionModal.transaction} onClose={() => setTransactionModal({ open: false })} onSave={saveTransaction} onDelete={deleteTransaction} />}
      {toast && <div className="toast" role="status"><CheckCircle2 size={18} /><span>{toast}</span><button onClick={() => setToast(null)} aria-label="Dismiss"><X size={16} /></button></div>}
    </div>
  );
}
