import { useState, useEffect } from "react";
import { X, PiggyBank } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/money";

export default function TransactionForm({ onSave, onClose, initial }) {
  const [type, setType] = useState(initial?.type || "expense");
  const [amount, setAmount] = useState(initial?.amount?.toString() || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [date, setDate] = useState(initial?.date || new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState(initial?.note || "");
  const [goals, setGoals] = useState([]);
  const [savingsGoalId, setSavingsGoalId] = useState("");
  const [savingsAmount, setSavingsAmount] = useState("");

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const showSavings = type === "income" && !initial;

  useEffect(() => {
    if (showSavings) {
      base44.auth.me().then((u) =>
        base44.entities.SavingsGoal.filter({ created_by_id: u.id, completed: false }).then(setGoals)
      ).catch(() => {});
    } else {
      setGoals([]);
      setSavingsGoalId("");
      setSavingsAmount("");
    }
  }, [showSavings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !category || !date) return;
    const data = {
      type,
      amount: parseFloat(amount),
      category,
      description: description || categories.find((c) => c.value === category)?.label || "",
      date,
      note,
    };
    if (savingsGoalId && savingsAmount && parseFloat(savingsAmount) > 0 && parseFloat(savingsAmount) <= parseFloat(amount)) {
      data.savingsAllocation = { goalId: savingsGoalId, amount: parseFloat(savingsAmount) };
    }
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#15263F] rounded-2xl w-full max-w-md p-6 border border-white/10 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold text-white">{initial ? "Edit" : "Add"} Transaction</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#0D1B2A] rounded-xl">
            <button
              type="button"
              onClick={() => { setType("expense"); setCategory(""); }}
              className={`py-2.5 rounded-lg font-bold text-sm transition-all ${
                type === "expense" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-white/40"
              }`}
            >
              💸 Expense
            </button>
            <button
              type="button"
              onClick={() => { setType("income"); setCategory(""); }}
              className={`py-2.5 rounded-lg font-bold text-sm transition-all ${
                type === "income" ? "bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/30" : "text-white/40"
              }`}
            >
              💰 Income
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-semibold text-white/60 mb-1.5 block">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">$</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full pl-8 pr-4 py-3 bg-[#0D1B2A] rounded-xl text-white font-bold text-lg border border-white/10 focus:border-[#00F5A0] focus:outline-none"
              />
            </div>
          </div>

          {/* Split into Savings (income only, new transactions) */}
          {showSavings && (
            <div className="rounded-xl bg-[#00F5A0]/5 border border-[#00F5A0]/20 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <PiggyBank size={16} className="text-[#00F5A0]" />
                <span className="text-sm font-bold text-[#00F5A0]">Split into Savings (optional)</span>
              </div>
              {goals.length === 0 ? (
                <p className="text-xs text-white/50">Create a savings goal first to split income into it.</p>
              ) : (
                <>
                  <p className="text-xs text-white/50">Choose how much of this income goes straight to a savings goal.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={savingsGoalId}
                      onChange={(e) => setSavingsGoalId(e.target.value)}
                      className="px-3 py-2.5 bg-[#0D1B2A] rounded-lg text-white text-sm border border-white/10 focus:border-[#00F5A0] focus:outline-none"
                    >
                      <option value="">Select goal...</option>
                      {goals.map((g) => (
                        <option key={g.id} value={g.id}>{g.emoji} {g.title}</option>
                      ))}
                    </select>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-bold text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={savingsAmount}
                        onChange={(e) => setSavingsAmount(e.target.value)}
                        placeholder="0.00"
                        disabled={!savingsGoalId}
                        className="w-full pl-7 pr-3 py-2.5 bg-[#0D1B2A] rounded-lg text-white text-sm font-bold border border-white/10 focus:border-[#00F5A0] focus:outline-none disabled:opacity-40"
                      />
                    </div>
                  </div>
                  {/* Live breakdown */}
                  {savingsGoalId && parseFloat(amount || 0) > 0 && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="rounded-lg bg-[#0D1B2A] px-3 py-2">
                        <p className="text-[10px] text-white/40 font-semibold">To Balance</p>
                        <p className="text-sm font-bold text-[#00F5A0]">
                          ${(parseFloat(amount) - (parseFloat(savingsAmount) || 0)).toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#0D1B2A] px-3 py-2">
                        <p className="text-[10px] text-white/40 font-semibold">To Savings</p>
                        <p className="text-sm font-bold text-[#9D5FDE]">
                          ${(parseFloat(savingsAmount) || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                  {savingsAmount && parseFloat(savingsAmount) > parseFloat(amount || 0) && (
                    <p className="text-xs text-red-400">Can't allocate more than your income.</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="text-sm font-semibold text-white/60 mb-1.5 block">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                    category === cat.value
                      ? "border-[#00F5A0] bg-[#00F5A0]/10"
                      : "border-white/10 bg-[#0D1B2A] hover:border-white/20"
                  }`}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-[10px] font-semibold text-white/70">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-white/60 mb-1.5 block">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === "income" ? "e.g. Weekly allowance" : "e.g. McDonald's"}
              className="w-full px-4 py-3 bg-[#0D1B2A] rounded-xl text-white border border-white/10 focus:border-[#00F5A0] focus:outline-none"
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-sm font-semibold text-white/60 mb-1.5 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#0D1B2A] rounded-xl text-white border border-white/10 focus:border-[#00F5A0] focus:outline-none"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-semibold text-white/60 mb-1.5 block">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full px-4 py-3 bg-[#0D1B2A] rounded-xl text-white border border-white/10 focus:border-[#00F5A0] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-extrabold hover:scale-[1.02] transition-transform"
          >
            {initial ? "Save Changes" : "Add Transaction"}
          </button>
        </form>
      </div>
    </div>
  );
}