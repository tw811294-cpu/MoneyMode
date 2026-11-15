import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Logo from "@/components/Logo";
import { formatCurrency, getCategoryInfo, getCurrentMonth, getMonthLabel, EXPENSE_CATEGORIES } from "@/lib/money";
import { Wallet, TrendingUp, TrendingDown, Target, ClipboardList, Calendar, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function ParentView() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [teen, setTeen] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [budgets, setBudgets] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const users = await base44.entities.User.filter({ share_token: code });
        if (!users || users.length === 0) {
          setError(true);
          setLoading(false);
          return;
        }
        const teenUser = users[0];
        setTeen(teenUser);

        const [txns, gls, svs, bdgs] = await Promise.all([
          base44.entities.Transaction.filter({ created_by_id: teenUser.id }, "-date", 500),
          base44.entities.SavingsGoal.filter({ created_by_id: teenUser.id }),
          base44.entities.WeeklySurvey.filter({ created_by_id: teenUser.id }, "-date", 50),
          base44.entities.Budget.filter({ created_by_id: teenUser.id }),
        ]);
        setTransactions(txns);
        setGoals(gls);
        setSurveys(svs);
        setBudgets(bdgs);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [code]);

  // Compute stats
  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  const currentMonth = getCurrentMonth();
  const monthTxns = transactions.filter(t => t.date && t.date.startsWith(currentMonth));
  const monthIncome = monthTxns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpenses = monthTxns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const categoryData = EXPENSE_CATEGORIES.map(cat => {
    const spent = monthTxns.filter(t => t.type === "expense" && t.category === cat.value).reduce((s, t) => s + t.amount, 0);
    return { name: cat.label, value: spent, color: cat.color };
  }).filter(c => c.value > 0);

  const monthBudgets = budgets.filter(b => b.month === currentMonth);
  const recentTxns = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);
  const currentStreak = surveys.length > 0 ? (surveys[0].streak_count || 1) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/10 border-t-[#39d353] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Invalid Access Code</h1>
          <p className="text-sm text-white/50 mb-6">The code you entered doesn't match any teen's profile. Please double-check the code with your teen and try again.</p>
          <button onClick={() => navigate("/")} className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-bold">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1B2A]">
      {/* Header */}
      <header className="bg-[#0F1E33] border-b border-white/5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={32} showText={false} />
            <div>
              <span className="text-lg font-extrabold tracking-tight block leading-none">
                <span className="text-white">MONEY</span><span className="text-[#39d353]">MODE</span>
              </span>
              <span className="text-xs text-white/40">Parent View</span>
            </div>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white font-semibold">
            <ArrowLeft size={16} /> Home
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-12">
        {/* Teen Header */}
        <div className="rounded-2xl p-6 bg-gradient-to-br from-[#1B2D4A] to-[#15263F] border border-white/5 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00F5A0] to-[#39d353] flex items-center justify-center text-2xl">
              {teen?.avatar_emoji || "😎"}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">{teen?.display_name || "Teen"}'s Progress</h1>
              <p className="text-sm text-white/50">{getMonthLabel(currentMonth)} · Updated {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="rounded-2xl p-4 bg-[#15263F] border border-white/5">
            <div className="flex items-center gap-2 mb-2"><Wallet size={16} className="text-[#39d353]" /><span className="text-xs text-white/50 font-semibold">Total Balance</span></div>
            <p className="text-xl font-extrabold text-white">{formatCurrency(balance)}</p>
          </div>
          <div className="rounded-2xl p-4 bg-[#15263F] border border-white/5">
            <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-[#39d353]" /><span className="text-xs text-white/50 font-semibold">Income (Month)</span></div>
            <p className="text-xl font-extrabold text-white">{formatCurrency(monthIncome)}</p>
          </div>
          <div className="rounded-2xl p-4 bg-[#15263F] border border-white/5">
            <div className="flex items-center gap-2 mb-2"><TrendingDown size={16} className="text-red-400" /><span className="text-xs text-white/50 font-semibold">Spending (Month)</span></div>
            <p className="text-xl font-extrabold text-white">{formatCurrency(monthExpenses)}</p>
          </div>
          <div className="rounded-2xl p-4 bg-[#15263F] border border-white/5">
            <div className="flex items-center gap-2 mb-2"><ClipboardList size={16} className="text-[#9D5FDE]" /><span className="text-xs text-white/50 font-semibold">Survey Streak</span></div>
            <p className="text-xl font-extrabold text-white">{currentStreak} {currentStreak === 1 ? "wk" : "wks"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Savings Goals */}
          <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Target size={18} className="text-[#39d353]" /> Savings Goals</h3>
            {goals.length > 0 ? (
              <div className="space-y-3">
                {goals.map((goal) => {
                  const progress = goal.target_amount > 0 ? Math.min(100, (goal.current_amount / goal.target_amount) * 100) : 0;
                  return (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white/80 font-semibold">{goal.emoji} {goal.title}</span>
                        {goal.completed ? (
                          <span className="text-xs text-[#39d353] font-bold">✓ Complete</span>
                        ) : (
                          <span className="text-xs text-white/40">{Math.round(progress)}%</span>
                        )}
                      </div>
                      <div className="h-2.5 bg-[#0D1B2A] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#39d353] to-[#00F5A0] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
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
              <p className="text-sm text-white/40 py-4 text-center">No savings goals set yet.</p>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5">
            <h3 className="font-bold text-white mb-4">Spending by Category</h3>
            {categoryData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3}>
                      {categoryData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0D1B2A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }} formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {categoryData.map((cat, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                      <span className="text-white/70 flex-1">{cat.name}</span>
                      <span className="text-white font-semibold text-xs">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/40 py-8 text-center">No spending recorded this month.</p>
            )}
          </div>
        </div>

        {/* Budget Adherence */}
        {monthBudgets.length > 0 && (
          <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5 mb-6">
            <h3 className="font-bold text-white mb-4">Budget Adherence</h3>
            <div className="space-y-3">
              {monthBudgets.map((budget) => {
                const spent = monthTxns.filter(t => t.type === "expense" && t.category === budget.category).reduce((s, t) => s + t.amount, 0);
                const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
                const cat = getCategoryInfo(budget.category);
                const isOver = spent > budget.amount;
                return (
                  <div key={budget.id} className="flex items-center gap-3">
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="text-sm text-white/70 font-semibold w-28 truncate">{cat.label}</span>
                    <div className="flex-1 h-2.5 bg-[#0D1B2A] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${isOver ? "bg-red-500" : "bg-[#39d353]"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <span className={`text-xs font-bold w-20 text-right ${isOver ? "text-red-400" : "text-white/60"}`}>
                      {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5 mb-6">
          <h3 className="font-bold text-white mb-4">Recent Transactions</h3>
          {recentTxns.length > 0 ? (
            <div className="space-y-2">
              {recentTxns.map((txn) => {
                const cat = getCategoryInfo(txn.category, txn.type);
                return (
                  <div key={txn.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-base">{cat.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{txn.description || cat.label}</p>
                      <p className="text-xs text-white/40">{new Date(txn.date).toLocaleDateString()} · {cat.label}</p>
                    </div>
                    <span className={`text-sm font-bold ${txn.type === "income" ? "text-[#39d353]" : "text-red-400"}`}>
                      {txn.type === "income" ? "+" : "-"}{formatCurrency(txn.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-white/40 py-4 text-center">No transactions recorded yet.</p>
          )}
        </div>

        {/* Weekly Survey Responses */}
        <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><ClipboardList size={18} className="text-[#9D5FDE]" /> Weekly Check-In Responses</h3>
          {surveys.length > 0 ? (
            <div className="space-y-3">
              {surveys.map((survey) => (
                <div key={survey.id} className="rounded-xl p-4 bg-[#0D1B2A] border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-white/40" />
                      <span className="text-sm font-bold text-white">{survey.week_label || new Date(survey.date).toLocaleDateString()}</span>
                    </div>
                    <span className="text-xs font-bold text-[#FF6B6B]">🔥 {survey.streak_count} wk streak</span>
                  </div>
                  <div className="space-y-1.5">
                    {survey.responses?.map((r, i) => (
                      <div key={i} className="text-sm">
                        <span className="text-white/50 text-xs">{r.question}</span>
                        <p className="text-white/90 font-medium">{r.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/40 py-4 text-center">No weekly check-ins completed yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}