import { useState } from "react";
import { formatCurrency } from "@/lib/money";
import { X, ArrowDownToLine, Wallet } from "lucide-react";

export default function TransferModal({ balance, goals, onSave, onClose }) {
  const [goalId, setGoalId] = useState(goals[0]?.id || "");
  const [amount, setAmount] = useState("");

  const numAmount = parseFloat(amount) || 0;
  const isValid = goalId && numAmount > 0 && numAmount <= balance;
  const selectedGoal = goals.find((g) => g.id === goalId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    onSave(selectedGoal, numAmount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-[#15263F] rounded-t-3xl sm:rounded-2xl border border-white/10 p-6 animate-fade-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ArrowDownToLine size={20} className="text-[#00F5A0]" /> Transfer to Savings
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-white/50 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-5xl mb-3">🎯</p>
            <p className="text-sm text-white/50 mb-4">You don't have any active savings goals yet. Create one first!</p>
            <button onClick={onClose} className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-bold text-sm">
              Got it
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Balance Display */}
            <div className="rounded-xl p-4 bg-[#0D1B2A] border border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00F5A0]/10 flex items-center justify-center text-[#00F5A0]">
                <Wallet size={20} />
              </div>
              <div>
                <p className="text-xs text-white/40">Available Balance</p>
                <p className="text-lg font-extrabold text-white">{formatCurrency(balance)}</p>
              </div>
            </div>

            {/* Goal Selector */}
            <div>
              <label className="text-sm font-semibold text-white/60 mb-2 block">Send to</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {goals.map((goal) => {
                  const progress = goal.target_amount > 0 ? Math.min(100, (goal.current_amount / goal.target_amount) * 100) : 0;
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => setGoalId(goal.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        goalId === goal.id
                          ? "border-[#00F5A0] bg-[#00F5A0]/10"
                          : "border-white/10 bg-[#0D1B2A] hover:border-white/20"
                      }`}
                    >
                      <span className="text-2xl">{goal.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{goal.title}</p>
                        <p className="text-xs text-white/40">
                          {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)} · {Math.round(progress)}%
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
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
                  max={balance}
                  autoFocus
                  className="w-full pl-8 pr-4 py-3 bg-[#0D1B2A] rounded-xl text-white text-lg font-bold border border-white/10 focus:border-[#00F5A0] focus:outline-none"
                />
              </div>
              {numAmount > balance && (
                <p className="text-xs text-red-400 mt-1.5 font-semibold">Amount exceeds your available balance.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isValid}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-extrabold disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
            >
              Transfer {numAmount > 0 ? formatCurrency(numAmount) : ""}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}