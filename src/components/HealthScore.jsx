import { getHealthScoreLabel } from "@/lib/money";
import { Activity } from "lucide-react";

export default function HealthScore({ score }) {
  const { label, color } = getHealthScoreLabel(score);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={18} style={{ color }} />
        <h3 className="font-bold text-white">Financial Health</h3>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40" fill="none" stroke="#0D1B2A" strokeWidth="8" />
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 48 48)"
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-white">{score}</span>
            <span className="text-[10px] text-white/40">/ 100</span>
          </div>
        </div>
        <div>
          <p className="text-lg font-extrabold" style={{ color }}>{label}</p>
          <p className="text-xs text-white/50 mt-1">
            Based on savings, tracking, goals, streaks & budgets.
          </p>
        </div>
      </div>
    </div>
  );
}