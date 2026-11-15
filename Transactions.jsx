import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AppLayout from "@/components/AppLayout";
import TransactionForm from "@/components/TransactionForm";
import EmptyState from "@/components/EmptyState";
import { formatCurrency, getCategoryInfo, getXpReward, getLevelFromXp } from "@/lib/money";
import { Plus, Pencil, Trash2, Filter } from "lucide-react";

export default function Transactions() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [filter, setFilter] = useState("all");

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

  const handleSave = async (data) => {
    try {
      const { savingsAllocation, ...txnData } = data;
      if (savingsAllocation) {
        txnData.savings_allocation = savingsAllocation.amount;
      }
      if (editingTxn) {
        await base44.entities.Transaction.update(editingTxn.id, txnData);
      } else {
        await base44.entities.Transaction.create(txnData);
      }
      if (savingsAllocation) {
        const goal = await base44.entities.SavingsGoal.get(savingsAllocation.goalId);
        await base44.entities.SavingsGoal.update(savingsAllocation.goalId, {
          current_amount: (goal.current_amount || 0) + savingsAllocation.amount,
        });
      }
      // Award XP for new transactions
      if (!editingTxn) {
        const xpReward = getXpReward(txnData.type) || getXpReward("transaction");
        const newXp = (user?.xp_points || 0) + xpReward;
        await base44.auth.updateMe({ xp_points: newXp, level: getLevelFromXp(newXp) });
      }
      setShowForm(false);
      setEditingTxn(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.Transaction.delete(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = transactions.filter(t => filter === "all" || t.type === filter);

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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Transactions</h1>
          <p className="text-sm text-white/50 mt-1">Log every dollar that comes in or goes out.</p>
        </div>
        <button
          onClick={() => { setEditingTxn(null); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-extrabold text-sm hover:scale-105 transition-transform"
        >
          <Plus size={18} /> Add Transaction
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 p-1 bg-[#15263F] rounded-xl w-full sm:w-auto sm:inline-flex">
        {[
          { value: "all", label: "All" },
          { value: "income", label: "💰 Income" },
          { value: "expense", label: "💸 Expenses" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              filter === tab.value ? "bg-[#00F5A0]/20 text-[#00F5A0]" : "text-white/40 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((txn) => {
            const cat = getCategoryInfo(txn.category, txn.type);
            return (
              <div key={txn.id} className="flex items-center gap-3 p-4 rounded-2xl bg-[#15263F] border border-white/5 hover:border-white/10 transition-colors group">
                <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0">{cat.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{txn.description || cat.label}</p>
                  <p className="text-xs text-white/40">
                    {new Date(txn.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {cat.label}
                    {txn.note && ` · ${txn.note}`}
                  </p>
                </div>
                <span className={`text-sm font-extrabold ${txn.type === "income" ? "text-[#00F5A0]" : "text-red-400"}`}>
                  {txn.type === "income" ? "+" : "-"}{formatCurrency(txn.amount)}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingTxn(txn); setShowForm(true); }} className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(txn.id)} className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          emoji="💸"
          title="No transactions yet"
          message="Start by logging your first income or expense. Every dollar counts!"
          actionLabel="Add Transaction"
          onAction={() => { setEditingTxn(null); setShowForm(true); }}
        />
      )}

      {showForm && (
        <TransactionForm
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingTxn(null); }}
          initial={editingTxn}
        />
      )}
    </AppLayout>
  );
}