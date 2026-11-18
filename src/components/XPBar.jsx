import { getLevelProgress } from "@/lib/money";
import { Zap } from "lucide-react";

export default function XPBar({ xp, level }) {
  const progress = getLevelProgress(xp);
  const xpToNext = 100 - progress;

  return (
    <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#9D5FDE] to-[#7B2FBE] flex items-center justify-center text-white font-extrabold text-sm">
            {level}
          </div>
          <div>
            <p className="text-sm font-bold text-white">Level {level}</p>
            <p className="text-xs text-white/40">{xp} total XP</p>
          </div>
        </div>
        <Zap size={20} className="text-[#9D5FDE]" />
      </div>
      <div className="h-2.5 bg-[#0D1B2A] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#9D5FDE] to-[#00F5A0] rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-white/40 mt-1.5 text-right">{xpToNext} XP to Level {level + 1}</p>
    </div>
  );
}