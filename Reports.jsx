import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import AppLayout from "@/components/AppLayout";
import EmptyState from "@/components/EmptyState";
import { EXPENSE_CATEGORIES, getCategoryInfo, getMonthLabel, formatCurrency } from "@/lib/money";
import { TrendingUp, TrendingDown, PiggyBank, ChevronLeft, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

export default function Reports() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const loadData = useCallback(async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const txns = await base44.entities.Transaction.filter({ created_by_id: u.id }, "-date", 500);
      setTransactions(txns);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const shiftMonth = (delta) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const monthTxns = transactions.filter(t => t.date && t.date.startsWith(selectedMonth));
  const monthIncome = monthTxns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpenses = monthTxns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netSavings = monthIncome - monthExpenses;

  // Previous month
  const [prevYear, prevMonth] = selectedMonth.split("-").map(Number);
  const prevDate = new Date(prevYear, prevMonth - 2, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const prevTxns = transactions.filter(t => t.date && t.date.startsWith(prevMonthStr));
  const prevIncome = prevTxns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const prevExpenses = prevTxns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const prevNet = prevIncome - prevExpenses;

  const incomeChange = prevIncome > 0 ? ((monthIncome - prevIncome) / prevIncome) * 100 : 0;
  const expenseChange = prevExpenses > 0 ? ((monthExpenses - prevExpenses) / prevExpenses) * 100 : 0;

  // Category breakdown
  const categoryData = EXPENSE_CATEGORIES.map(cat => {
    const spent = monthTxns.filter(t => t.type === "expense" && t.category === cat.value).reduce((s, t) => s + t.amount, 0);
    return { name: cat.label, value: spent, color: cat.color, emoji: cat.emoji };
  }).filter(c => c.value > 0);

  // Daily spending trend within the month
  const daysInMonth = new Date(prevYear, prevMonth, 0).getDate();
  const dailyData = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${selectedMonth}-${String(day).padStart(2, "0")}`;
    const spent = monthTxns.filter(t => t.type === "expense" && t.date === dayStr).reduce((s, t) => s + t.amount, 0);
    if (spent > 0) dailyData.push({ day: `${day}`, spent });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/10 border-t-[#00F5A0] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppLayout user={user}>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Monthly Report</h1>
        <p className="text-sm text-white/50 mt-1">Track your financial progress over time.</p>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={() => shiftMonth(-1)} className="p-2.5 rounded-xl bg-[#15263F] border border-white/10 text-white/60 hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <span className="text-lg font-bold text-white min-w-[160px] text-center">{getMonthLabel(selectedMonth)}</span>
        <button onClick={() => shiftMonth(1)} className="p-2.5 rounded-xl bg-[#15263F] border border-white/10 text-white/60 hover:text-white">
          <ChevronRight size={20} />
        </button>
      </div>

      {monthTxns.length === 0 ? (
        <EmptyState emoji="📅" title="No data for this month" message="There are no transactions recorded for this month. Try another month or start logging!" />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#00F5A0]/20 to-[#39d353]/5 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-[#00F5A0]" />
                <span className="text-sm text-white/50 font-semibold">Income</span>
              </div>
              <p className="text-2xl font-extrabold text-white">{formatCurrency(monthIncome)}</p>
              {prevIncome > 0 && (
                <p className={`text-xs mt-1 ${incomeChange >= 0 ? "text-[#00F5A0]" : "text-red-400"}`}>
                  {incomeChange >= 0 ? "↑" : "↓"} {Math.abs(incomeChange).toFixed(0)}% vs last month
                </p>
              )}
            </div>
            <div className="rounded-2xl p-5 bg-gradient-to-br from-red-500/20 to-red-600/5 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={18} className="text-red-400" />
                <span className="text-sm text-white/50 font-semibold">Expenses</span>
              </div>
              <p className="text-2xl font-extrabold text-white">{formatCurrency(monthExpenses)}</p>
              {prevExpenses > 0 && (
                <p className={`text-xs mt-1 ${expenseChange <= 0 ? "text-[#00F5A0]" : "text-red-400"}`}>
                  {expenseChange <= 0 ? "↓" : "↑"} {Math.abs(expenseChange).toFixed(0)}% vs last month
                </p>
              )}
            </div>
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#7B2FBE]/20 to-[#9D5FDE]/5 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank size={18} className="text-[#9D5FDE]" />
                <span className="text-sm text-white/50 font-semibold">Net Savings</span>
              </div>
              <p className={`text-2xl font-extrabold ${netSavings >= 0 ? "text-white" : "text-red-400"}`}>{formatCurrency(netSavings)}</p>
              <p className="text-xs text-white/40 mt-1">{netSavings >= 0 ? "Great job saving! 🎉" : "Spending exceeded income"}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Pie */}
            <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5">
              <h3 className="font-bold text-white mb-4">Spending Breakdown</h3>
              {categoryData.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3}>
                        {categoryData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#0D1B2A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }} formatter={(v) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2 w-full">
                    {categoryData.map((cat, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                        <span className="text-white/70 flex-1">{cat.emoji} {cat.name}</span>
                        <span className="text-white font-semibold">{formatCurrency(cat.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-white/30 text-sm">No expenses this month</div>
              )}
            </div>

            {/* Daily Spending Bar */}
            <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5">
              <h3 className="font-bold text-white mb-4">Daily Spending</h3>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickFormatter={(v) => `$${v}`} />
                    <Tooltip contentStyle={{ background: "#0D1B2A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }} formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="spent" fill="#00F5A0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center text-white/30 text-sm">No spending recorded</div>
              )}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}