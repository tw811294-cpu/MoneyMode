import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import AppLayout from "@/components/AppLayout";
import GoalCard, { EMOJIS } from "@/components/GoalCard";
import EmptyState from "@/components/EmptyState";
import { formatCurrency } from "@/lib/money";
import { Plus, X, Target } from "lucide-react";

export default function Goals() {
  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [form, setForm] = useState({ title: "", target_amount: "", deadline: "", emoji: "🎯" });

  const loadData = useCallback(async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const gls = await base44.entities.SavingsGoal.filter({ created_by_id: u.id }, "-created_date");
      setGoals(gls);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.target_amount) return;
    try {
      const data = {
        title: form.title,
        target_amount: parseFloat(form.target_amount),
        deadline: form.deadline || null,
        emoji: form.emoji,
      };
      if (editingGoal) {
        await base44.entities.SavingsGoal.update(editingGoal.id, data);
      } else {
        await base44.entities.SavingsGoal.create({ ...data, current_amount: 0, completed: false });
      }
      setShowForm(false);
      setEditingGoal(null);
      setForm({ title: "", target_amount: "", deadline: "", emoji: "🎯" });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFunds = async (id, newAmount) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    const completed = newAmount >= goal.target_amount;
    await base44.entities.SavingsGoal.update(id, { current_amount: newAmount, completed });
    loadData();
  };

  const handleDelete = async (id) => {
    await base44.entities.SavingsGoal.delete(id);
    loadData();
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setForm({ title: goal.title, target_amount: goal.target_amount.toString(), deadline: goal.deadline || "", emoji: goal.emoji || "🎯" });
    setShowForm(true);
  };

  const totalSaved = goals.reduce((s, g) => s + (g.current_amount || 0), 0);
  const completedGoals = goals.filter(g => g.completed);

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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Savings Goals</h1>
          <p className="text-sm text-white/50 mt-1">Set targets and watch your savings grow. 🎯</p>
        </div>
        <button
          onClick={() => { setEditingGoal(null); setForm({ title: "", target_amount: "", deadline: "", emoji: "🎯" }); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-extrabold text-sm hover:scale-105 transition-transform"
        >
          <Plus size={18} /> New Goal
        </button>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl p-4 bg-gradient-to-br from-[#00F5A0]/20 to-[#39d353]/5 border border-white/5">
            <p className="text-xs text-white/50 font-semibold mb-1">Total Saved</p>
            <p className="text-2xl font-extrabold text-white">{formatCurrency(totalSaved)}</p>
          </div>
          <div className="rounded-2xl p-4 bg-gradient-to-br from-[#7B2FBE]/20 to-[#9D5FDE]/5 border border-white/5">
            <p className="text-xs text-white/50 font-semibold mb-1">Goals Completed</p>
            <p className="text-2xl font-extrabold text-white">{completedGoals.length} / {goals.length}</p>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onAddFunds={handleAddFunds} onDelete={handleDelete} onEdit={handleEdit} />
          ))}
        </div>
      ) : (
        <EmptyState
          emoji="🎯"
          title="No savings goals yet"
          message="What are you saving up for? Sneakers, a game, a trip? Create your first goal and start tracking your progress!"
          actionLabel="Create a Goal"
          onAction={() => { setEditingGoal(null); setForm({ title: "", target_amount: "", deadline: "", emoji: "🎯" }); setShowForm(true); }}
        />
      )}

      {/* Goal Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#15263F] rounded-2xl w-full max-w-md p-6 border border-white/10 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-white">{editingGoal ? "Edit" : "New"} Goal</h2>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-white/60 mb-1.5 block">Goal Name</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. New Sneakers" required
                  className="w-full px-4 py-3 bg-[#0D1B2A] rounded-xl text-white border border-white/10 focus:border-[#00F5A0] focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-white/60 mb-1.5 block">Target Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">$</span>
                  <input type="number" step="0.01" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} placeholder="150" required
                    className="w-full pl-8 pr-4 py-3 bg-[#0D1B2A] rounded-xl text-white border border-white/10 focus:border-[#00F5A0] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-white/60 mb-1.5 block">Deadline (optional)</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0D1B2A] rounded-xl text-white border border-white/10 focus:border-[#00F5A0] focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-white/60 mb-2 block">Pick an emoji</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((em) => (
                    <button key={em} type="button" onClick={() => setForm({ ...form, emoji: em })}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all ${form.emoji === em ? "border-[#00F5A0] bg-[#00F5A0]/10 scale-110" : "border-white/10 bg-[#0D1B2A]"}`}>
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-extrabold hover:scale-[1.02] transition-transform">
                {editingGoal ? "Save Changes" : "Create Goal"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}