import { formatCurrency, getCategoryInfo } from "@/lib/money";

export default function BudgetBar({ category, budgetAmount, spentAmount }) {
  const cat = getCategoryInfo(category);
  const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
  const remaining = budgetAmount - spentAmount;
  const isOver = spentAmount > budgetAmount;
  const isClose = percentage >= 80 && !isOver;

  const barColor = isOver ? "from-red-500 to-red-600" : isClose ? "from-yellow-400 to-amber-500" : "from-[#00F5A0] to-[#39d353]";
  const statusText = isOver ? "Over budget" : isClose ? "Almost there" : "On track";
  const statusColor = isOver ? "text-red-400" : isClose ? "text-yellow-400" : "text-[#00F5A0]";

  return (
    <div className="rounded-2xl p-4 bg-[#15263F] border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{cat.emoji}</span>
          <span className="font-bold text-white text-sm">{cat.label}</span>
        </div>
        <span className={`text-xs font-bold ${statusColor}`}>{statusText}</span>
      </div>
      <div className="h-3 bg-[#0D1B2A] rounded-full overflow-hidden mb-2">
        <div
          className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-white/60 font-semibold">{formatCurrency(spentAmount)} spent</span>
        <span className="text-white/40">{formatCurrency(Math.max(0, remaining))} left</span>
      </div>
    </div>
  );
}