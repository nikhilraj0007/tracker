import { Check, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { parseRupeesInput, paiseToRupees } from '../domain/money';
import type { Account, Category, MoneyTransaction, PaymentMethod, TransactionKind, TransactionStatus } from '../domain/types';

interface TransactionModalProps {
  accounts: Account[];
  categories: Category[];
  transaction?: MoneyTransaction | null;
  onClose: () => void;
  onSave: (transaction: MoneyTransaction) => void;
  onDelete: (id: string) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function TransactionModal({ accounts, categories, transaction, onClose, onSave, onDelete }: TransactionModalProps) {
  const [kind, setKind] = useState<TransactionKind>(transaction?.kind ?? 'expense');
  const [amount, setAmount] = useState(transaction ? String(paiseToRupees(transaction.amountPaise)) : '');
  const [date, setDate] = useState(transaction?.date ?? today());
  const [accountId, setAccountId] = useState(transaction?.accountId ?? accounts[0]?.id ?? '');
  const [destinationAccountId, setDestinationAccountId] = useState(transaction?.destinationAccountId ?? accounts.find((item) => item.type === 'credit_card')?.id ?? '');
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? categories.find((item) => item.id !== 'income')?.id ?? '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(transaction?.paymentMethod ?? 'upi');
  const [status, setStatus] = useState<TransactionStatus>(transaction?.status ?? 'cleared');
  const [merchant, setMerchant] = useState(transaction?.merchant ?? '');
  const [note, setNote] = useState(transaction?.note ?? '');
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const amountPaise = parseRupeesInput(amount);
    if (!amountPaise) return setError('Enter a valid amount greater than ₹0.');
    if (!date || date > today()) return setError('Choose today or an earlier date.');
    if (!accountId || !categoryId) return setError('Choose an account and category.');
    if (kind === 'liability_payment' && !destinationAccountId) return setError('Choose the credit card being paid.');
    const timestamp = new Date().toISOString();
    onSave({
      id: transaction?.id ?? crypto.randomUUID(),
      kind,
      status,
      date,
      amountPaise,
      accountId,
      destinationAccountId: kind === 'liability_payment' ? destinationAccountId : undefined,
      categoryId,
      paymentMethod,
      merchant: merchant.trim() || ({ income: 'Income', expense: 'Expense', fund_contribution: 'Fund contribution', investment: 'Investment', liability_payment: 'Card payment' }[kind]),
      note: note.trim(),
      createdAt: transaction?.createdAt ?? timestamp,
      updatedAt: timestamp,
    });
  };

  const groupsByKind: Record<TransactionKind, Category['group'][]> = {
    income: ['income'],
    expense: ['living', 'wants', 'travel', 'business'],
    fund_contribution: ['funds', 'travel', 'business', 'wants'],
    investment: ['investments'],
    liability_payment: ['liability'],
  };
  const visibleCategories = categories.filter((category) => !category.archived && groupsByKind[kind].includes(category.group));

  useEffect(() => {
    if (!visibleCategories.some((category) => category.id === categoryId)) setCategoryId(visibleCategories[0]?.id ?? '');
  }, [kind]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="transaction-modal" role="dialog" aria-modal="true" aria-labelledby="transaction-title">
        <header className="modal-header">
          <div><p className="eyebrow">Money movement</p><h2 id="transaction-title">{transaction ? 'Edit transaction' : 'Add transaction'}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </header>
        <form onSubmit={submit}>
          <label className="transaction-kind-field"><span>What are you recording?</span><select value={kind} onChange={(event) => setKind(event.target.value as TransactionKind)}><option value="expense">Expense</option><option value="income">Income</option><option value="fund_contribution">Fund contribution</option><option value="investment">Investment</option><option value="liability_payment">Credit-card payment</option></select></label>
          <label className="amount-field">
            <span>Amount</span>
            <div><b>₹</b><input autoFocus inputMode="decimal" placeholder="0" value={amount} onChange={(event) => setAmount(event.target.value)} /></div>
          </label>
          <div className="form-grid">
            <label><span>Date</span><input type="date" max={today()} value={date} onChange={(event) => setDate(event.target.value)} /></label>
            <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as TransactionStatus)}><option value="cleared">Cleared</option><option value="pending">Pending</option></select></label>
            <label><span>{kind === 'liability_payment' ? 'Pay from' : 'Account / card used'}</span><select value={accountId} onChange={(event) => setAccountId(event.target.value)}>{accounts.filter((account) => !account.archived && (kind !== 'liability_payment' || account.type !== 'credit_card')).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
            {kind === 'liability_payment' && <label><span>Card being paid</span><select value={destinationAccountId} onChange={(event) => setDestinationAccountId(event.target.value)}>{accounts.filter((account) => account.type === 'credit_card' && !account.archived).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>}
            <label><span>Category</span><select value={kind === 'income' ? 'income' : categoryId} onChange={(event) => setCategoryId(event.target.value)}>{visibleCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label><span>Payment method</span><select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}><option value="upi">UPI</option><option value="card">Credit card</option><option value="debit">Debit card</option><option value="bank">Bank transfer</option><option value="cash">Cash</option></select></label>
            <label><span>{kind === 'income' ? 'Source' : kind === 'expense' ? 'Merchant' : 'Description'}</span><input value={merchant} onChange={(event) => setMerchant(event.target.value)} placeholder={kind === 'income' ? 'Employer or source' : kind === 'expense' ? 'Where did you spend?' : 'What is this for?'} /></label>
          </div>
          <label><span>Note <small>Optional</small></span><textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add context for your future self" /></label>
          {error && <p className="form-error">{error}</p>}
          <footer className="modal-footer">
            {transaction ? <button className="delete-button" type="button" onClick={() => onDelete(transaction.id)}><Trash2 size={17} /> Delete</button> : <span />}
            <div><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit"><Check size={17} /> Save transaction</button></div>
          </footer>
        </form>
      </section>
    </div>
  );
}
