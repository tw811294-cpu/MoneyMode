import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import AppLayout from "@/components/AppLayout";
import { formatCurrency, getCategoryInfo, computeNextRecurringDate, getDaysUntil, getXpReward, getLevelFromXp, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/money";
import { Plus, Trash2, RefreshCw, X, CheckCircle2, Clock } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export default function Recurring() {
  const [user, setUser] = useState(null);
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [posting, setPosting] = useState(null);

  // Form state
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [nextDate, setNextDate] = useState(new Date().toISOString().split("T")[0]);

  const loadData = useCallback(async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const items = await base44.entities.RecurringTransaction.filter({ created_by_id: u.id, active: true }, "next_date", 100);
      setRecurring(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const resetForm = () => {
    setType("expense"); setAmount(""); setCategory(""); setDescription(""); setFrequency("monthly");
    setNextDate(new Date().toISOString().split("T")[0]);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!amount || !category || !nextDate) return;
    try {
      await base44.entities.RecurringTransaction.create({
        type, amount: parseFloat(amount), category, description,
        frequency, next_date: nextDate, active: true,
      });
      resetForm();
      setShowForm(false);
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.RecurringTransaction.update(id, { active: false });
      loadData();
    } catch (err) { console.error(err); }
  };

  const handlePost = async (item) => {
    setPosting(item.id);
    try {
      // Create actual transaction
      await base44.entities.Transaction.create({
        type: item.type,
        amount: item.amount,
        category: item.category,
        description: item.description || `Recurring ${item.type}`,
        date: item.next_date,
      });
      // Advance next date
      const newDate = computeNextRecurringDate(item.frequency, new Date(item.next_date));
      await base44.entities.RecurringTransaction.update(item.id, { next_date: newDate });
      // Award XP
      const newXp = (user?.xp_points || 0) + getXpReward("transaction");
      await base44.auth.updateMe({ xp_points: newXp, level: getLevelFromXp(newXp) });
      loadData();
    } catch (err) { console.error(err); }
    setPosting(null);
  };

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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <RefreshCw size={28} className="text-[#00F5A0]" /> Recurring Transactions
          </h1>
          <p className="text-sm text-white/50 mt-1">Automate income and expenses that repeat on a schedule.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-extrabold text-sm hover:scale-105 transition-transform"
        >
          <Plus size={18} /> Add Recurring
        </button>
      </div>

      {recurring.length > 0 ? (
        <div className="space-y-3">
          {recurring.map((item) => {
            const cat = getCategoryInfo(item.category, item.type);
            const days = getDaysUntil(item.next_date);
            const isDue = days <= 0;
            return (
              <div key={item.id} className={`rounded-2xl p-4 border ${isDue ? "bg-[#00F5A0]/5 border-[#00F5A0]/30" : "bg-[#15263F] border-white/5"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0">{cat.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{item.description || cat.label}</p>
                    <p className="text-xs text-white/40 flex items-center gap-2 mt-0.5">
                      <span className="capitalize">{item.frequency}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {isDue ? "Due now" : days === 1 ? "Tomorrow" : `In ${days} days`}
                      </span>
                    </p>
                  </div>
                  <span className={`text-sm font-extrabold ${item.type === "income" ? "text-[#00F5A0]" : "text-red-400"}`}>
                    {item.type === "income" ? "+" : "-"}{formatCurrency(item.amount)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handlePost(item)}
                      disabled={posting === item.id}
                      className="p-2 rounded-lg bg-[#00F5A0]/10 text-[#00F5A0] hover:bg-[#00F5A0]/20 transition-colors disabled:opacity-40"
                      title="Post now"
                    >
                      {posting === item.id ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          emoji="🔁"
          title="No recurring transactions"
          message="Set up income or expenses that repeat — like allowance, subscriptions, or gym membership."
          actionLabel="Add Recurring"
          onAction={() => { resetForm(); setShowForm(true); }}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#15263F] rounded-2xl w-full max-w-md p-6 border border-white/10 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-white">Add Recurring</h2>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#0D1B2A] rounded-xl">
                <button type="button" onClick={() => { setType("expense"); setCategory(""); }} className={`py-2.5 rounded-lg font-bold text-sm transition-all ${type === "expense" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-white/40"}`}>💸 Expense</button>
                <button type="button" onClick={() => { setType("income"); setCategory(""); }} className={`py-2.5 rounded-lg font-bold text-sm transition-all ${type === "income" ? "bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/30" : "text-white/40"}`}>💰 Income</button>
              </div>
              <div>
                <label className="text-sm font-semibold text-white/60 mb-1.5 block">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">$</span>
                  <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required className="w-full pl-8 pr-4 py-3 bg-[#0D1B2A] rounded-xl text-white font-bold text-lg border border-white/10 focus:border-[#00F5A0] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-white/60 mb-1.5 block">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button key={cat.value} type="button" onClick={() => setCategory(cat.value)} className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${category === cat.value ? "border-[#00F5A0] bg-[#00F5A0]/10" : "border-white/10 bg-[#0D1B2A] hover:border-white/20"}`}>
                      <span className="text-2xl">{cat.emoji}</span>
                      <span className="text-[10px] font-semibold text-white/70">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-white/60 mb-1.5 block">Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Netflix subscription" className="w-full px-4 py-3 bg-[#0D1B2A] rounded-xl text-white border border-white/10 focus:border-[#00F5A0] focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-white/60 mb-1.5 block">Frequency</label>
                  <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full px-3 py-3 bg-[#0D1B2A] rounded-xl text-white border border-white/10 focus:border-[#00F5A0] focus:outline-none">
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-white/60 mb-1.5 block">Next Date</label>
                  <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} required className="w-full px-3 py-3 bg-[#0D1B2A] rounded-xl text-white border border-white/10 focus:border-[#00F5A0] focus:outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-extrabold hover:scale-[1.02] transition-transform">Create Recurring</button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}