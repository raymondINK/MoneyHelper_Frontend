import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import Sidebar from '../../shared/components/Sidebar';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  monthly_allowance?: number;
}

interface Transaction {
  id: number;
  type: string;
  category: string;
  amount: number;
  note: string;
  date: string;
  account_id: number;
}

const Stats = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const handleSidebarToggle = () => {
    setSidebarCollapsed((prev: boolean) => {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(!prev));
      return !prev;
    });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    const fetchData = async () => {
      try {
        const [accountsRes, txRes] = await Promise.all([
          api.get('/accounts'),
          api.get('/transactions'),
        ]);
        setAccounts(accountsRes.data);
        setTransactions(txRes.data);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, [navigate]);

  // Current month helpers
  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const monthShort = now.toLocaleString('default', { month: 'short' }).toUpperCase();

  const txThisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === curMonth && d.getFullYear() === curYear;
  });

  const totalIncome = txThisMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = txThisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Last 7 days sparklines
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now); d.setDate(now.getDate() - (6 - i)); return d;
  });
  const dayLabels = last7.map(d => d.toLocaleDateString('en-US', { weekday: 'short' })[0]);
  const incomeSparkData = last7.map(d =>
    transactions.filter(t => t.type === 'income' && new Date(t.date).toDateString() === d.toDateString()).reduce((s, t) => s + t.amount, 0)
  );
  const expenseSparkData = last7.map(d =>
    transactions.filter(t => t.type === 'expense' && new Date(t.date).toDateString() === d.toDateString()).reduce((s, t) => s + t.amount, 0)
  );

  // Main chart: per-day for current month
  const chartLabels: string[] = [];
  const chartIncomeData: number[] = [];
  const chartExpenseData: number[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    chartLabels.push(`${String(day).padStart(2, '0')} ${monthShort}`);
    chartIncomeData.push(transactions.filter(t => { const d = new Date(t.date); return t.type === 'income' && d.getDate() === day && d.getMonth() === curMonth && d.getFullYear() === curYear; }).reduce((s, t) => s + t.amount, 0));
    chartExpenseData.push(transactions.filter(t => { const d = new Date(t.date); return t.type === 'expense' && d.getDate() === day && d.getMonth() === curMonth && d.getFullYear() === curYear; }).reduce((s, t) => s + t.amount, 0));
  }

  const mainChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Income',
        data: chartIncomeData,
        borderColor: '#A855F7',
        borderWidth: 2.5,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
          gradient.addColorStop(0.6, 'rgba(168, 85, 247, 0.08)');
          gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: chartIncomeData.map(v => v > 0 ? 5 : 0),
        pointHoverRadius: 7,
        pointBackgroundColor: '#C084FC',
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        pointHoverBackgroundColor: '#A855F7',
        pointHoverBorderColor: '#fff',
      },
      {
        label: 'Expense',
        data: chartExpenseData,
        borderColor: '#F87171',
        borderWidth: 2,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(248, 113, 113, 0.2)');
          gradient.addColorStop(1, 'rgba(248, 113, 113, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: chartExpenseData.map(v => v > 0 ? 5 : 0),
        pointHoverRadius: 7,
        pointBackgroundColor: '#FCA5A5',
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
      },
    ],
  };

  const sparklineOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { display: false, min: 0 } },
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A] overflow-hidden">
      <Sidebar user={user} collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex h-20 w-full items-center border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-md px-6 lg:px-12">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold tracking-tight text-white">Analytics</h2>
            <p className="text-sm text-gray-400">Track your financial performance</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative z-10">
          <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none z-0"></div>
          <div className="max-w-7xl mx-auto h-full flex gap-8 relative z-10">

            {/* Left: charts */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="grid grid-cols-3 gap-6">
                {/* Income card */}
                <div className="glass-panel rounded-xl p-6 relative group overflow-hidden flex flex-col justify-between h-48">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-purple-400 text-sm">trending_up</span>
                      <span className="text-sm text-gray-400 font-medium">Total Income</span>
                    </div>
                    <div className="text-xl font-bold text-white tracking-tight mt-1">+RM {totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div className="flex-1 min-h-0 mt-2 relative w-full">
                      <Line data={{ labels: dayLabels, datasets: [{ data: incomeSparkData, borderColor: '#A855F7', borderWidth: 2, backgroundColor: 'rgba(168, 85, 247, 0.1)', fill: true, tension: 0.4, pointRadius: 0 }] }} options={sparklineOptions} />
                    </div>
                  </div>
                </div>

                {/* Net balance card */}
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden border border-purple-500/20 shadow-[0_0_30px_-10px_rgba(168,85,247,0.2)] flex flex-col justify-between h-48">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-purple-400/80 text-sm">account_balance_wallet</span>
                      <span className="text-sm text-purple-400/80 font-medium">Net Balance</span>
                    </div>
                    <div className={`text-3xl font-bold tracking-tight drop-shadow-sm mt-auto mb-auto ${netBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
                      {netBalance >= 0 ? '+' : ''}RM {Math.abs(netBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Expenses card */}
                <div className="glass-panel rounded-xl p-6 relative group overflow-hidden flex flex-col justify-between h-48">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-rose-500 text-sm">trending_down</span>
                      <span className="text-sm text-gray-400 font-medium">Total Expenses</span>
                    </div>
                    <div className="text-xl font-bold text-white tracking-tight mt-1">-RM {totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div className="flex-1 min-h-0 mt-2 relative w-full">
                      <Line data={{ labels: dayLabels, datasets: [{ data: expenseSparkData, borderColor: '#f87171', borderWidth: 2, backgroundColor: 'rgba(248, 113, 113, 0.1)', fill: true, tension: 0.4, pointRadius: 0 }] }} options={sparklineOptions} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Main line chart */}
              <div className="glass-panel rounded-xl p-6 flex-1 min-h-[380px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span className="text-sm text-gray-400">Income</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400"></span>
                      <span className="text-sm text-gray-400">Expense</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 uppercase tracking-widest">
                    {now.toLocaleString('default', { month: 'long' })} {curYear}
                  </span>
                </div>
                <div className="flex-1 w-full relative min-h-0">
                  <Line
                    data={mainChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: { mode: 'index' as const, intersect: false },
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(10,10,12,0.95)',
                          borderColor: 'rgba(168,85,247,0.3)',
                          borderWidth: 1,
                          titleColor: '#9CA3AF',
                          bodyColor: '#fff',
                          padding: 12,
                          callbacks: {
                            label: (ctx: any) => ` ${ctx.dataset.label}: RM ${ctx.parsed.y.toFixed(2)}`,
                          },
                        },
                      },
                      scales: {
                        x: {
                          display: true,
                          grid: { color: 'rgba(255,255,255,0.04)' },
                          ticks: { color: '#4B5563', font: { size: 10 }, maxTicksLimit: 7, maxRotation: 0 },
                          border: { display: false },
                        },
                        y: {
                          display: true,
                          grid: { color: 'rgba(255,255,255,0.04)' },
                          ticks: { color: '#6B7280', font: { size: 10 }, callback: (v: any) => v === 0 ? '' : `RM ${(v as number).toLocaleString()}` },
                          border: { display: false },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Wallet Summary — live from API */}
            <div className="w-72 flex flex-col gap-4 flex-shrink-0">
              <div className="flex items-center gap-2 text-white/90 pt-1">
                <span className="material-symbols-outlined text-gray-400 text-[20px]">account_balance_wallet</span>
                <h3 className="font-semibold text-sm">Wallet Summary</h3>
              </div>

              {accounts.length === 0 ? (
                <div className="glass-panel rounded-xl p-6 flex flex-col items-center gap-2 text-center">
                  <span className="material-symbols-outlined text-3xl text-gray-700">account_balance</span>
                  <p className="text-xs text-gray-500">No accounts yet</p>
                </div>
              ) : accounts.map((account) => {
                const accIncome = txThisMonth.filter(t => t.type === 'income' && t.account_id === account.id).reduce((s, t) => s + t.amount, 0);
                const accExpense = txThisMonth.filter(t => t.type === 'expense' && t.account_id === account.id).reduce((s, t) => s + t.amount, 0);
                const allowance = account.monthly_allowance || 0;
                const usedPct = allowance > 0 ? Math.min(Math.round((accExpense / allowance) * 100), 100) : 0;

                return (
                  <div key={account.id} className="glass-panel rounded-xl p-5 relative overflow-hidden cursor-pointer hover:border-purple-500/20 border border-transparent transition-all" onClick={() => navigate(`/account-details/${account.id}`)}>
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent"></div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-purple-400 text-[18px]">
                          {account.type === 'savings' ? 'savings' : account.type === 'wallet' ? 'wallet' : 'account_balance'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{account.name}</h4>
                        <p className="text-[10px] text-gray-500 capitalize">{account.type}</p>
                      </div>
                    </div>

                    <div className="text-lg font-bold text-white mb-3">
                      RM {account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>

                    {allowance > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-gray-400">Monthly Allowance</span>
                          <span className="text-white">RM {allowance.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-purple-700 via-purple-500 to-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.5)]" style={{ width: `${usedPct}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[9px] mt-1 text-gray-500">
                          <span>{usedPct}% used</span>
                          <span className="text-purple-400">RM {Math.max(allowance - accExpense, 0).toLocaleString()} remaining</span>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-white/5 flex justify-between text-[11px]">
                      <div className="flex items-center gap-1 text-purple-400">
                        <span className="material-symbols-outlined text-[12px]">north_east</span>
                        +RM {accIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className={`flex items-center gap-1 ${accExpense > 0 ? 'text-rose-400' : 'text-gray-500'}`}>
                        <span className="material-symbols-outlined text-[12px]">south_east</span>
                        -RM {accExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
