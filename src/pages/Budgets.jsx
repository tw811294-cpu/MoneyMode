import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import AppLayout from "@/components/AppLayout";
import BudgetBar from "@/components/BudgetBar";
import EmptyState from "@/components/EmptyState";
import { EXPENSE_CATEGORIES, getCurrentMonth, getMonthLabel, formatCurrency } from "@/lib/money";
import { Plus, X, Wallet } from "lucide-react";

export default function Budgets() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "", amount: "" });

  const currentMonth = getCurrentMonth();

  const loadData = useCallback(async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const [txns, bdgs] = await Promise.all([
        base44.entities.Transaction.filter({ created_by_id: u.id }, "-date", 500),
        base44.entities.Budget.filter({ created_by_id: u.id }),
      ]);
      setTransactions(txns);
      setBudgets(bdgs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const monthBudgets = budgets.filter(b => b.month === currentMonth);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.category || !form.amount) return;
    try {
      const existing = monthBudgets.find(b => b.category === form.category);
      if (existing) {
        await base44.entities.Budget.update(existing.id, { amount: parseFloat(form.amount) });
      } else {
        await base44.entities.Budget.create({
          category: form.category,
          amount: parseFloat(form.amount),
          month: currentMonth,
        });
      }
      setShowForm(false);
      setForm({ category: "", amount: "" });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.Budget.delete(id);
    loadData();
  };

  const getSpentForCategory = (category) => {
    return transactions
      .filter(t => t.type === "expense" && t.category === category && t.date && t.date.startsWith(currentMonth))
      .reduce((s, t) => s + t.amount, 0);
  };

  const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = monthBudgets.reduce((s, b) => s + getSpentForCategory(b.category), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/10 border-t-[#00F5A0] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppLayout user={user}>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Budgets</h1>
          <p className="text-sm text-white/50 mt-1">Set spending limits for {getMonthLabel(currentMonth)}.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-extrabold text-sm hover:scale-105 transition-transform"
        >
          <Plus size={18} /> Set Budget
        </button>
      </div>

      {/* Summary */}
      {monthBudgets.length > 0 && (
        <div className="rounded-2xl p-5 bg-gradient-to-br from-[#1B2D4A] to-[#15263F] border border-white/5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-white">Monthly Budget Overview</h3>
            <span className="text-sm text-white/50">{getMonthLabel(currentMonth)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/60">Spent: <span className="font-bold text-white">{formatCurrency(totalSpent)}</span></span>
            <span className="text-white/60">Budget: <span className="font-bold text-white">{formatCurrency(totalBudget)}</span></span>
          </div>
          <div className="h-3 bg-[#0D1B2A] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${totalSpent > totalBudget ? "bg-gradient-to-r from-red-500 to-red-600" : "bg-gradient-to-r from-[#00F5A0] to-[#39d353]"}`}
              style={{ width: `${totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0}%` }}
            />
          </div>
          <p className="text-xs text-white/40 mt-2">
            {totalSpent > totalBudget
              ? `⚠️ You're ${formatCurrency(totalSpent - totalBudget)} over budget!`
              : `${formatCurrency(totalBudget - totalSpent)} remaining this month`}
          </p>
        </div>
      )}

      {/* Budget Bars */}
      {monthBudgets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {monthBudgets.map((budget) => (
            <div key={budget.id} className="relative group">
              <BudgetBar category={budget.category} budgetAmount={budget.amount} spentAmount={getSpentForCategory(budget.category)} />
              <button
                onClick={() => handleDelete(budget.id)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          emoji="📊"
          title="No budgets set yet"
          message="Set spending limits for categories like Food and Entertainment to stay on track with your money goals."
          actionLabel="Set a Budget"
          onAction={() => setShowForm(true)}
        />
      )}

      {/* Budget Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#15263F] rounded-2xl w-full max-w-md p-6 border border-white/10 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-white">Set a Budget</h2>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-white/60 mb-2 block">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat.value })}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${form.category === cat.value ? "border-[#00F5A0] bg-[#00F5A0]/10" : "border-white/10 bg-[#0D1B2A]"}`}
                    >
                      <span className="text-2xl">{cat.emoji}</span>
                      <span className="text-[10px] font-semibold text-white/70">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-white/60 mb-1.5 block">Monthly Limit</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">$</span>
                  <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="50" required
                    className="w-full pl-8 pr-4 py-3 bg-[#0D1B2A] rounded-xl text-white border border-white/10 focus:border-[#00F5A0] focus:outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-extrabold hover:scale-[1.02] transition-transform">
                Save Budget
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}