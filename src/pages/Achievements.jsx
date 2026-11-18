import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import AppLayout from "@/components/AppLayout";
import { getAllAchievements, getXpReward, getLevelFromXp } from "@/lib/money";
import { Award, Lock } from "lucide-react";

export default function Achievements() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const [txns, gls, svs, bdgs] = await Promise.all([
        base44.entities.Transaction.filter({ created_by_id: u.id }, "-date", 500),
        base44.entities.SavingsGoal.filter({ created_by_id: u.id }),
        base44.entities.WeeklySurvey.filter({ created_by_id: u.id }, "-date", 50),
        base44.entities.Budget.filter({ created_by_id: u.id }),
      ]);
      setTransactions(txns);
      setGoals(gls);
      setSurveys(svs);
      setBudgets(bdgs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/10 border-t-[#00F5A0] rounded-full animate-spin" />
      </div>
    );
  }

  const achievements = getAllAchievements(transactions, goals, surveys, budgets, user);
  const earned = achievements.filter(a => a.earned);
  const locked = achievements.filter(a => !a.earned);
  const totalXp = (user?.xp_points || 0);

  return (
    <AppLayout user={user}>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
          <Award size={28} className="text-[#9D5FDE]" /> Achievements
        </h1>
        <p className="text-sm text-white/50 mt-1">Unlock badges by hitting milestones. {earned.length} of {achievements.length} unlocked.</p>
      </div>

      {/* Progress Summary */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-[#15263F] to-[#1B2D4A] border border-[#9D5FDE]/20 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-white/50">Achievement Progress</p>
            <p className="text-3xl font-extrabold text-white">{earned.length}<span className="text-lg text-white/40">/{achievements.length}</span></p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/50">Total XP</p>
            <p className="text-3xl font-extrabold text-[#9D5FDE]">{totalXp}</p>
          </div>
        </div>
        <div className="h-3 bg-[#0D1B2A] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#9D5FDE] to-[#00F5A0] rounded-full transition-all duration-500" style={{ width: `${(earned.length / achievements.length) * 100}%` }} />
        </div>
      </div>

      {/* Earned Badges */}
      {earned.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-wide mb-3">Unlocked ({earned.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {earned.map((badge) => (
              <div key={badge.id} className="rounded-2xl p-4 bg-[#15263F] border border-[#00F5A0]/20 text-center hover:border-[#00F5A0]/40 transition-colors">
                <div className="text-4xl mb-2">{badge.emoji}</div>
                <p className="text-sm font-bold text-white">{badge.label}</p>
                <p className="text-xs text-white/40 mt-1">{badge.description}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Locked Badges */}
      {locked.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-wide mb-3">Locked ({locked.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {locked.map((badge) => (
              <div key={badge.id} className="rounded-2xl p-4 bg-[#0D1B2A] border border-white/5 text-center opacity-60">
                <div className="text-4xl mb-2 grayscale">{badge.emoji}</div>
                <p className="text-sm font-bold text-white/60">{badge.label}</p>
                <p className="text-xs text-white/30 mt-1 flex items-center justify-center gap-1">
                  <Lock size={10} /> {badge.description}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </AppLayout>
  );
}