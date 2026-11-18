import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AppLayout from "@/components/AppLayout";
import StatCard from "@/components/StatCard";
import BadgeDisplay from "@/components/BadgeDisplay";
import SurveyModal from "@/components/SurveyModal";
import EmptyState from "@/components/EmptyState";
import TransferModal from "@/components/TransferModal";
import XPBar from "@/components/XPBar";
import HealthScore from "@/components/HealthScore";
import { formatCurrency, getCategoryInfo, getCurrentMonth, getDaysSince, calculateBadges, calculateHealthScore, getXpReward, getLevelFromXp, getFinancialTitle, EXPENSE_CATEGORIES } from "@/lib/money";
import { Wallet, TrendingUp, TrendingDown, Plus, Flame, Target, ArrowRight, PiggyBank, ArrowDownToLine } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [authError, setAuthError] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const [txns, gls, svs, bdgs] = await Promise.all([
        base44.entities.Transaction.filter({ created_by_id: u.id }, "-date", 200),
        base44.entities.SavingsGoal.filter({ created_by_id: u.id }),
        base44.entities.WeeklySurvey.filter({ created_by_id: u.id }, "-date", 50),
        base44.entities.Budget.filter({ created_by_id: u.id }),
      ]);
      setTransactions(txns);
      setGoals(gls);
      setSurveys(svs);
      setBudgets(bdgs);

      const lastSurvey = svs[0];
      if (!lastSurvey || getDaysSince(lastSurvey.date) >= 7) {
        setShowSurvey(true);
      }
    } catch (err) {
      setAuthError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleTransfer = async (goal, amount) => {
    try {
      await base44.entities.Transaction.create({
        type: "expense",
        category: "savings_transfer",
        description: `Transfer to ${goal.title}`,
        amount,
        date: new Date().toISOString().split("T")[0],
      });
      await base44.entities.SavingsGoal.update(goal.id, {
        current_amount: (goal.current_amount || 0) + amount,
      });
      setShowTransfer(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSurveyComplete = async (responses) => {
    try {
      const lastSurvey = surveys[0];
      const newStreak = lastSurvey && getDaysSince(lastSurvey.date) <= 14
        ? (lastSurvey.streak_count || 0) + 1
        : 1;
      await base44.entities.WeeklySurvey.create({
        responses,
        date: new Date().toISOString().split("T")[0],
        streak_count: newStreak,
        week_label: `Week of ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      });
      const xpReward = getXpReward("survey");
      const newXp = (user?.xp_points || 0) + xpReward;
      await base44.auth.updateMe({ xp_points: newXp, level: getLevelFromXp(newXp) });
      setShowSurvey(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Compute stats
  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalSavingsAllocated = transactions.filter(t => t.type === "income").reduce((s, t) => s + (t.savings_allocation || 0), 0);
  const balance = totalIncome - totalExpenses - totalSavingsAllocated;

  const currentMonth = getCurrentMonth();
  const monthTxns = transactions.filter(t => t.date && t.date.startsWith(currentMonth));
  const monthIncome = monthTxns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpenses = monthTxns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // Category breakdown (this month)
  const categoryData = EXPENSE_CATEGORIES.map(cat => {
    const spent = monthTxns.filter(t => t.type === "expense" && t.category === cat.value).reduce((s, t) => s + t.amount, 0);
    return { name: cat.label, value: spent, color: cat.color };
  }).filter(c => c.value > 0);

  // Spending trend (last 6 months)
  const trendData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const expenses = transactions.filter(t => t.type === "expense" && t.date && t.date.startsWith(monthStr)).reduce((s, t) => s + t.amount, 0);
    const income = transactions.filter(t => t.type === "income" && t.date && t.date.startsWith(monthStr)).reduce((s, t) => s + t.amount, 0);
    trendData.push({ month: d.toLocaleDateString("en-US", { month: "short" }), expenses, income });
  }

  const streak = surveys.length > 0 ? (surveys[0].streak_count || 1) : 0;
  const badges = calculateBadges(transactions, goals, surveys);
  const healthScore = calculateHealthScore(transactions, goals, surveys, budgets);
  const titleInfo = getFinancialTitle(user?.xp_points || 0);
  const activeGoals = goals.filter(g => !g.completed);
  const recentTxns = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/10 border-t-[#00F5A0] rounded-full animate-spin" />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white/60 mb-4">Please log in to view your dashboard.</p>
          <button onClick={() => base44.auth.redirectToLogin("/app")} className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-bold">
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout user={user}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Hey, {user?.display_name || "there"} {user?.avatar_emoji || "👋"}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs border" style={{ background: `${titleInfo.color}15`, color: titleInfo.color, borderColor: `${titleInfo.color}40` }}>
              {titleInfo.emoji} {titleInfo.title}
            </span>
            <p className="text-sm text-white/50">Here's your money snapshot for {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}.</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/app/transactions")}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-extrabold text-sm hover:scale-105 transition-transform"
        >
          <Plus size={18} /> Add Transaction
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div>
          <StatCard title="Total Balance" value={formatCurrency(balance)} icon={Wallet} variant={balance >= 0 ? "green" : "red"} />
          <button
            onClick={() => setShowTransfer(true)}
            className="w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#00F5A0]/10 text-[#00F5A0] font-bold text-xs border border-[#00F5A0]/20 hover:bg-[#00F5A0]/20 transition-colors"
          >
            <ArrowDownToLine size={14} /> Transfer to Savings
          </button>
        </div>
        <StatCard title="Income (This Month)" value={formatCurrency(monthIncome)} icon={TrendingUp} variant="green" />
        <StatCard title="Spending (This Month)" value={formatCurrency(monthExpenses)} icon={TrendingDown} variant="red" />
        <StatCard title="Survey Streak" value={`${streak} ${streak === 1 ? "week" : "weeks"}`} icon={Flame} variant="purple" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Category Pie */}
        <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5">
          <h3 className="font-bold text-white mb-4">Spending by Category</h3>
          {categoryData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0D1B2A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }}
                    formatter={(v) => formatCurrency(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {categoryData.map((cat, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                    <span className="text-white/70 flex-1">{cat.name}</span>
                    <span className="text-white font-semibold">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-white/30 text-sm">
              No expenses logged this month yet
            </div>
          )}
        </div>

        {/* Trend Line */}
        <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5">
          <h3 className="font-bold text-white mb-4">Income vs Spending (6 months)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00F5A0" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#00F5A0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6B6B" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#FF6B6B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: "#0D1B2A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }}
                formatter={(v) => formatCurrency(v)}
              />
              <Area type="monotone" dataKey="income" stroke="#00F5A0" strokeWidth={2} fill="url(#incomeGrad)" />
              <Area type="monotone" dataKey="expenses" stroke="#FF6B6B" strokeWidth={2} fill="url(#expenseGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* XP + Health Score Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <XPBar xp={user?.xp_points || 0} level={user?.level || 1} />
        <HealthScore score={healthScore} />
      </div>

      {/* Goals + Badges Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Active Goals */}
        <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2"><Target size={18} className="text-[#00F5A0]" /> Savings Goals</h3>
            <button onClick={() => navigate("/app/goals")} className="text-xs text-[#00F5A0] font-bold flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight size={14} />
            </button>
          </div>
          {activeGoals.length > 0 ? (
            <div className="space-y-3">
              {activeGoals.slice(0, 3).map((goal) => {
                const progress = goal.target_amount > 0 ? Math.min(100, (goal.current_amount / goal.target_amount) * 100) : 0;
                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-white/80 font-semibold">{goal.emoji} {goal.title}</span>
                      <span className="text-xs text-white/50">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2.5 bg-[#0D1B2A] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#00F5A0] to-[#39d353] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-white/40">
                      <span>{formatCurrency(goal.current_amount)}</span>
                      <span>{formatCurrency(goal.target_amount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <PiggyBank size={32} className="mx-auto text-white/20 mb-2" />
              <p className="text-sm text-white/40 mb-3">No active goals yet. Set one and start saving!</p>
              <button onClick={() => navigate("/app/goals")} className="text-xs text-[#00F5A0] font-bold">Create a goal →</button>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Flame size={18} className="text-[#9D5FDE]" /> Your Badges</h3>
          <BadgeDisplay badges={badges} />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white">Recent Activity</h3>
          <button onClick={() => navigate("/app/transactions")} className="text-xs text-[#00F5A0] font-bold flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight size={14} />
          </button>
        </div>
        {recentTxns.length > 0 ? (
          <div className="space-y-2">
            {recentTxns.map((txn) => {
              const cat = getCategoryInfo(txn.category, txn.type);
              return (
                <div key={txn.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg">{cat.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{txn.description || cat.label}</p>
                    <p className="text-xs text-white/40">{new Date(txn.date).toLocaleDateString()} · {cat.label}</p>
                  </div>
                  <span className={`text-sm font-bold ${txn.type === "income" ? "text-[#00F5A0]" : "text-red-400"}`}>
                    {txn.type === "income" ? "+" : "-"}{formatCurrency(txn.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState emoji="💸" title="No transactions yet" message="Start logging your income and expenses to see them here." actionLabel="Add Transaction" actionTo="/app/transactions" />
        )}
      </div>

      {/* Survey Modal */}
      {showSurvey && (
        <SurveyModal onComplete={handleSurveyComplete} onClose={() => setShowSurvey(false)} streak={streak} />
      )}

      {/* Transfer Modal */}
      {showTransfer && (
        <TransferModal
          balance={balance}
          goals={activeGoals}
          onSave={handleTransfer}
          onClose={() => setShowTransfer(false)}
        />
      )}
    </AppLayout>
  );
}