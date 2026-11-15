import { useState } from "react";
import { Target, Plus, Check, Trash2, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/money";
import confetti from "canvas-confetti";

const EMOJIS = ["🎯", "👟", "🎮", "📱", "💻", "🚗", "👕", "✈️", "🎁", "🏠", "🎸", "📷"];

export default function GoalCard({ goal, onAddFunds, onDelete, onEdit }) {
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState("");
  const progress = goal.target_amount > 0 ? Math.min(100, (goal.current_amount / goal.target_amount) * 100) : 0;
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);

  const handleAdd = () => {
    const val = parseFloat(amount);
    if (!val) return;
    const newAmount = goal.current_amount + val;
    onAddFunds(goal.id, newAmount);
    if (newAmount >= goal.target_amount && !goal.completed) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ["#00F5A0", "#39d353", "#9ff54d"] });
    }
    setAmount("");
    setShowAdd(false);
  };

  return (
    <div className={`rounded-2xl p-5 border transition-all ${goal.completed ? "bg-[#00F5A0]/10 border-[#00F5A0]/30" : "bg-[#15263F] border-white/5"}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
            {goal.emoji || "🎯"}
          </div>
          <div>
            <h3 className="font-bold text-white">{goal.title}</h3>
            {goal.deadline && (
              <p className="text-xs text-white/40">By {new Date(goal.deadline).toLocaleDateString()}</p>
            )}
          </div>
        </div>
        {goal.completed && (
          <span className="flex items-center gap-1 text-xs font-bold text-[#00F5A0] bg-[#00F5A0]/10 px-2 py-1 rounded-full">
            <Check size={14} /> Done!
          </span>
        )}
      </div>

      <div className="mb-2 flex justify-between text-sm">
        <span className="font-bold text-white">{formatCurrency(goal.current_amount)}</span>
        <span className="text-white/40">{formatCurrency(goal.target_amount)}</span>
      </div>

      <div className="h-3 bg-[#0D1B2A] rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-gradient-to-r from-[#00F5A0] to-[#39d353] rounded-full transition-all duration-500 glow-green"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-white/50 font-semibold">{Math.round(progress)}% complete</span>
        {!goal.completed && remaining > 0 && (
          <span className="text-xs text-white/40">{formatCurrency(remaining)} to go</span>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        {!goal.completed && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#00F5A0]/10 text-[#00F5A0] font-bold text-sm hover:bg-[#00F5A0]/20 transition-colors"
          >
            <Plus size={16} /> Add Funds
          </button>
        )}
        {onEdit && (
          <button onClick={() => onEdit(goal)} className="p-2.5 rounded-xl bg-white/5 text-white/50 hover:text-white">
            <Pencil size={16} />
          </button>
        )}
        <button onClick={() => onDelete(goal.id)} className="p-2.5 rounded-xl bg-white/5 text-white/50 hover:text-red-400">
          <Trash2 size={16} />
        </button>
      </div>

      {showAdd && (
        <div className="mt-3 flex gap-2 animate-fade-in">
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount to add"
            className="flex-1 px-3 py-2 bg-[#0D1B2A] rounded-lg text-white text-sm border border-white/10 focus:border-[#00F5A0] focus:outline-none"
          />
          <button onClick={handleAdd} className="px-4 py-2 rounded-lg bg-[#00F5A0] text-[#0D1B2A] font-bold text-sm">
            Add
          </button>
        </div>
      )}
    </div>
  );
}

export { EMOJIS };