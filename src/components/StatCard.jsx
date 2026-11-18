import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

export default function StatCard({ title, value, subtitle, icon: Icon, variant = "default", trend }) {
  const gradients = {
    default: "from-[#1B2D4A] to-[#15263F]",
    green: "from-[#00F5A0]/20 to-[#39d353]/5",
    purple: "from-[#7B2FBE]/20 to-[#9D5FDE]/5",
    red: "from-red-500/20 to-red-600/5",
  };
  const iconColors = {
    default: "text-[#00F5A0]",
    green: "text-[#00F5A0]",
    purple: "text-[#9D5FDE]",
    red: "text-red-400",
  };

  return (
    <div className={`rounded-2xl p-5 bg-gradient-to-br ${gradients[variant]} border border-white/5 animate-fade-in`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${iconColors[variant]}`}>
          {Icon && <Icon size={20} />}
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? "text-[#00F5A0] bg-[#00F5A0]/10" : "text-red-400 bg-red-400/10"}`}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-sm text-white/50 font-medium mb-1">{title}</p>
      <p className="text-2xl font-extrabold text-white">{value}</p>
      {subtitle && <p className="text-xs text-white/40 mt-1">{subtitle}</p>}
    </div>
  );
}