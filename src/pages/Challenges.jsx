import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import AppLayout from "@/components/AppLayout";
import { getCurrentMonth, getChallengeProgress } from "@/lib/money";
import { formatCurrency } from "@/lib/money";
import { Trophy, Target, Flame, CheckCircle2 } from "lucide-react";

const DEFAULT_CHALLENGES = [
  { title: "Log 10 Transactions", description: "Track 10 transactions this month to build the habit.", challenge_type: "log_transactions", target_value: 10, xp_reward: 50, emoji: "📝" },
  { title: "Save $50", description: "Allocate $50 of your income to savings goals.", challenge_type: "save_money", target_value: 50, xp_reward: 75, emoji: "💰" },
  { title: "Weekly Check-In", description: "Complete 2 weekly surveys this month.", challenge_type: "complete_survey", target_value: 2, xp_reward: 60, emoji: "📋" },
  { title: "Set a New Goal", description: "Create 1 new savings goal this month.", challenge_type: "create_goal", target_value: 1, xp_reward: 40, emoji: "🎯" },
];

export default function Challenges() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const [txns, gls, svs, bdgs, chls] = await Promise.all([
        base44.entities.Transaction.filter({ created_by_id: u.id }, "-date", 500),
        base44.entities.SavingsGoal.filter({ created_by_id: u.id }),
        base44.entities.WeeklySurvey.filter({ created_by_id: u.id }, "-date", 50),
        base44.entities.Budget.filter({ created_by_id: u.id }),
        base44.entities.MonthlyChallenge.filter({ created_by_id: u.id, month: getCurrentMonth() }),
      ]);
      setTransactions(txns);
      setGoals(gls);
      setSurveys(svs);
      setBudgets(bdgs);

      // Seed default challenges if none exist for this month
      if (chls.length === 0) {
        const created = await Promise.all(
          DEFAULT_CHALLENGES.map((c) =>
            base44.entities.MonthlyChallenge.create({ ...c, month: getCurrentMonth(), completed: false })
          )
        );
        setChallenges(created);
      } else {
        setChallenges(chls);
      }
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

  const completedCount = challenges.filter((c) => {
    const prog = getChallengeProgress(c, transactions, goals, surveys, budgets);
    return prog.percent >= 100;
  }).length;

  return (
    <AppLayout user={user}>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
          <Trophy size={28} className="text-[#9D5FDE]" /> Monthly Challenges
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Complete challenges to earn XP and level up. {completedCount}/{challenges.length} done this month.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl p-4 bg-[#15263F] border border-white/5 text-center">
          <p className="text-2xl font-extrabold text-[#00F5A0]">{challenges.length}</p>
          <p className="text-xs text-white/40 mt-1">Total</p>
        </div>
        <div className="rounded-2xl p-4 bg-[#15263F] border border-white/5 text-center">
          <p className="text-2xl font-extrabold text-[#39d353]">{completedCount}</p>
          <p className="text-xs text-white/40 mt-1">Completed</p>
        </div>
        <div className="rounded-2xl p-4 bg-[#15263F] border border-white/5 text-center">
          <p className="text-2xl font-extrabold text-[#9D5FDE]">{challenges.reduce((s, c) => s + (c.xp_reward || 0), 0)}</p>
          <p className="text-xs text-white/40 mt-1">XP Available</p>
        </div>
      </div>

      {/* Challenge Cards */}
      <div className="space-y-3">
        {challenges.map((challenge) => {
          const prog = getChallengeProgress(challenge, transactions, goals, surveys, budgets);
          const isComplete = prog.percent >= 100;
          const isMoney = challenge.challenge_type === "save_money";

          return (
            <div
              key={challenge.id}
              className={`rounded-2xl p-5 border transition-colors ${
                isComplete
                  ? "bg-[#00F5A0]/5 border-[#00F5A0]/30"
                  : "bg-[#15263F] border-white/5"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">
                  {isComplete ? "✅" : challenge.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-bold text-white text-sm">{challenge.title}</h3>
                    <span className="text-xs font-bold text-[#9D5FDE] flex items-center gap-1 flex-shrink-0">
                      <Flame size={12} /> +{challenge.xp_reward} XP
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mb-3">{challenge.description}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2.5 bg-[#0D1B2A] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isComplete ? "bg-[#00F5A0]" : "bg-gradient-to-r from-[#9D5FDE] to-[#00F5A0]"
                        }`}
                        style={{ width: `${prog.percent}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-white/60 flex-shrink-0">
                      {isComplete ? (
                        <span className="text-[#00F5A0] flex items-center gap-1">
                          <CheckCircle2 size={14} /> Done
                        </span>
                      ) : (
                        `${isMoney ? formatCurrency(prog.current) : prog.current} / ${isMoney ? formatCurrency(prog.target) : prog.target}`
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}