import { ArrowDownLeft, ArrowUpRight, MoreHorizontal } from 'lucide-react';
import { formatMoney } from '../domain/money';
import type { Account, Category, MoneyTransaction } from '../domain/types';
import { CategoryIcon } from './CategoryIcon';

interface TransactionListProps {
  transactions: MoneyTransaction[];
  accounts: Account[];
  categories: Category[];
  limit?: number;
  onEdit: (transaction: MoneyTransaction) => void;
}

export function TransactionList({ transactions, accounts, categories, limit, onEdit }: TransactionListProps) {
  const shown = limit ? transactions.slice(0, limit) : transactions;
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  if (shown.length === 0) {
    return (
      <div className="empty-state compact">
        <ArrowDownLeft size={24} />
        <strong>No transactions here yet</strong>
        <span>Add one or change your filters.</span>
      </div>
    );
  }

  return (
    <div className="transaction-list">
      {shown.map((transaction) => {
        const category = categoryById.get(transaction.categoryId);
        const account = accountById.get(transaction.accountId);
        const isIncome = transaction.kind === 'income';
        const kindLabel = ({ expense: 'Expense', income: 'Income', fund_contribution: 'Fund', investment: 'Investment', liability_payment: 'Card payment' } as const)[transaction.kind];
        return (
          <button className="transaction-row" key={transaction.id} onClick={() => onEdit(transaction)}>
            <span className="transaction-icon" style={{ '--category-color': category?.color ?? '#65736e' } as React.CSSProperties}>
              {category ? <CategoryIcon name={category.icon} /> : isIncome ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
            </span>
            <span className="transaction-main">
              <strong>{transaction.merchant || category?.name || 'Transaction'}</strong>
              <span>{kindLabel} · {category?.name} · {account?.name}</span>
            </span>
            <span className="transaction-date">
              {new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(new Date(`${transaction.date}T12:00:00`))}
            </span>
            <span className={`status-pill ${transaction.status}`}>{transaction.status}</span>
            <span className={`transaction-amount ${isIncome ? 'income' : ''}`}>
              {isIncome ? '+' : '−'}{formatMoney(transaction.amountPaise)}
            </span>
            <MoreHorizontal className="row-more" size={18} />
          </button>
        );
      })}
    </div>
  );
}
