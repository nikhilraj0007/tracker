import { ArrowDownRight, ArrowUpRight, Lightbulb, TrendingDown } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { calculateCategoryTotals, calculateMonthSummary } from '../domain/calculations';
import { formatMoney, formatPercent } from '../domain/money';
import type { AppData } from '../domain/types';

export function AnalysisPage({ data, monthKey }: { data: AppData; monthKey: string }) {
  const livingBudget = data.plan.salaryAllocations.find((item) => item.id === 'living')?.plannedPaise ?? 0;
  const summary = calculateMonthSummary(data.transactions, data.accounts, monthKey, new Date(), livingBudget);
  const categories = calculateCategoryTotals(data.transactions, data.categories, monthKey).filter((category) => category.spentPaise > 0);
  const categoryChart = categories.map((category) => ({ name: category.name, value: category.spentPaise / 100, color: category.color }));
  const comparison = categories.slice(0, 6).map((category) => ({ name: category.name, spent: category.spentPaise / 100, budget: category.monthlyBudgetPaise / 100 }));
  const top = categories[0];
  return (
    <div className="analysis-layout">
      <section className="insight-banner">
        <span><Lightbulb size={22} /></span>
        <div><p className="eyebrow">This month in one sentence</p><h2>{top ? `${top.name} is your largest category at ${formatPercent(top.percentageOfSpend)} of spending.` : 'Add expenses to unlock your monthly story.'}</h2></div>
      </section>
      <section className="metric-card analysis-metric"><span className="metric-icon income"><ArrowDownRight size={19} /></span><span className="metric-label">Income</span><strong>{formatMoney(summary.incomePaise)}</strong><small>Cleared this month</small></section>
      <section className="metric-card analysis-metric"><span className="metric-icon expense"><ArrowUpRight size={19} /></span><span className="metric-label">Expenses</span><strong>{formatMoney(summary.spentPaise)}</strong><small>{formatPercent(summary.utilization)} of plan</small></section>
      <section className="metric-card analysis-metric"><span className="metric-icon balance"><TrendingDown size={19} /></span><span className="metric-label">Savings rate</span><strong>{summary.incomePaise ? formatPercent((summary.netPaise / summary.incomePaise) * 100) : '—'}</strong><small>{formatMoney(summary.netPaise)} net cash flow</small></section>

      <section className="panel breakdown-chart">
        <div className="card-heading"><p className="eyebrow">Composition</p><h2>Spending distribution</h2></div>
        <div className="donut-layout">
          <div className="donut-chart">
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryChart} dataKey="value" innerRadius="68%" outerRadius="92%" paddingAngle={3} stroke="none" isAnimationActive={false}>{categoryChart.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip formatter={(value) => formatMoney(Number(value) * 100)} /></PieChart></ResponsiveContainer>
            <div className="donut-center"><strong>{formatMoney(summary.spentPaise, true)}</strong><span>Total</span></div>
          </div>
          <div className="donut-legend">{categoryChart.slice(0, 6).map((item) => <div key={item.name}><i style={{ background: item.color }} /><span>{item.name}</span><strong>{formatMoney(item.value * 100)}</strong></div>)}</div>
        </div>
      </section>

      <section className="panel comparison-chart">
        <div className="card-heading inline"><div><p className="eyebrow">Plan vs reality</p><h2>Budget performance</h2></div><div className="chart-legend"><span><i className="legend-solid" /> Actual</span><span><i className="legend-neutral" /> Plan</span></div></div>
        <div className="bar-chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={comparison} margin={{ left: -10, right: 10, top: 16 }}><CartesianGrid stroke="#e7e9e3" vertical={false} strokeDasharray="3 6" /><XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} /><YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} /><Tooltip formatter={(value) => formatMoney(Number(value) * 100)} /><Bar dataKey="budget" fill="#dfe3dc" radius={[6, 6, 0, 0]} isAnimationActive={false} /><Bar dataKey="spent" fill="#245b4a" radius={[6, 6, 0, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer></div>
      </section>
    </div>
  );
}
