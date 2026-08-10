import { Download, Filter, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { transactionsForMonth } from '../domain/calculations';
import { formatMoney } from '../domain/money';
import type { AppData, MoneyTransaction, TransactionKind } from '../domain/types';
import { TransactionList } from '../components/TransactionList';

interface TransactionsPageProps {
  data: AppData;
  monthKey: string;
  onAdd: () => void;
  onEdit: (transaction: MoneyTransaction) => void;
  onExport: () => void;
}

export function TransactionsPage({ data, monthKey, onAdd, onEdit, onExport }: TransactionsPageProps) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | TransactionKind>('all');
  const [accountId, setAccountId] = useState('all');
  const transactions = useMemo(() => transactionsForMonth(data.transactions, monthKey)
    .filter((transaction) => kind === 'all' || transaction.kind === kind)
    .filter((transaction) => accountId === 'all' || transaction.accountId === accountId)
    .filter((transaction) => {
      const category = data.categories.find((item) => item.id === transaction.categoryId)?.name ?? '';
      return `${transaction.merchant} ${transaction.note} ${category}`.toLowerCase().includes(query.toLowerCase());
    })
    .sort((a, b) => b.date.localeCompare(a.date)), [data, monthKey, query, kind, accountId]);
  const expenseTotal = transactions.filter((item) => item.kind === 'expense').reduce((sum, item) => sum + item.amountPaise, 0);

  return (
    <section className="page-panel">
      <div className="section-toolbar">
        <div><p className="eyebrow">Ledger</p><h2>All transactions</h2><p>{transactions.length} records · {formatMoney(expenseTotal)} in expenses</p></div>
        <div><button className="secondary-button" onClick={onExport}><Download size={17} /> Export CSV</button><button className="primary-button" onClick={onAdd}><Plus size={17} /> Add transaction</button></div>
      </div>
      <div className="filter-bar">
        <label className="search-field"><Search size={17} /><input placeholder="Search merchant, note or category" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="filter-select"><Filter size={16} /><select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option value="all">All types</option><option value="expense">Expenses</option><option value="income">Income</option><option value="fund_contribution">Fund contributions</option><option value="investment">Investments</option><option value="liability_payment">Card payments</option></select></label>
        <label className="filter-select"><select value={accountId} onChange={(event) => setAccountId(event.target.value)}><option value="all">All accounts</option>{data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
      </div>
      <div className="transaction-table-head"><span>Transaction</span><span>Date</span><span>Status</span><span>Amount</span><span /></div>
      <TransactionList transactions={transactions} accounts={data.accounts} categories={data.categories} onEdit={onEdit} />
    </section>
  );
}
