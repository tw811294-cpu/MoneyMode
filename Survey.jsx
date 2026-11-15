import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import AppLayout from "@/components/AppLayout";
import SurveyModal from "@/components/SurveyModal";
import EmptyState from "@/components/EmptyState";
import { getDaysSince } from "@/lib/money";
import { Flame, Calendar, ClipboardList, CheckCircle2 } from "lucide-react";

export default function Survey() {
  const [user, setUser] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSurvey, setShowSurvey] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const svs = await base44.entities.WeeklySurvey.filter({ created_by_id: u.id }, "-date", 50);
      setSurveys(svs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleComplete = async (responses) => {
    try {
      const lastSurvey = surveys[0];
      const newStreak = lastSurvey && getDaysSince(lastSurvey.date) <= 14
        ? (lastSurvey.streak_count || 0) + 1
        : 1;
      await base44.entities.WeeklySurvey.create({
        responses,
        date: new Date().toISOString().split("T")[0],
        streak_count: newStreak,
        week_label: `Week of ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      });
      setShowSurvey(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const currentStreak = surveys.length > 0 ? (surveys[0].streak_count || 1) : 0;
  const lastSurveyDate = surveys[0]?.date;
  const daysSinceLast = lastSurveyDate ? getDaysSince(lastSurveyDate) : Infinity;
  const surveyDue = !lastSurveyDate || daysSinceLast >= 7;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/10 border-t-[#00F5A0] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppLayout user={user}>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Weekly Check-In</h1>
        <p className="text-sm text-white/50 mt-1">Reflect on your money habits and build your streak. 🔥</p>
      </div>

      {/* Streak Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-[#7B2FBE]/30 to-[#15263F] border border-[#9D5FDE]/20 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B6B] to-[#FF9500] flex items-center justify-center text-3xl animate-glow-pulse">
              🔥
            </div>
            <div>
              <p className="text-sm text-white/50 font-semibold">Current Streak</p>
              <p className="text-3xl font-extrabold text-white">{currentStreak} {currentStreak === 1 ? "week" : "weeks"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/50 font-semibold">Total Check-Ins</p>
            <p className="text-3xl font-extrabold text-white">{surveys.length}</p>
          </div>
        </div>
      </div>

      {/* Take Survey Button */}
      {surveyDue ? (
        <div className="rounded-2xl p-6 bg-gradient-to-br from-[#00F5A0]/20 to-[#39d353]/5 border border-[#00F5A0]/20 mb-6 text-center">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="text-lg font-bold text-white mb-1">Your weekly survey is ready!</h3>
          <p className="text-sm text-white/50 mb-4">Take 2 minutes to reflect on your money habits this week.</p>
          <button
            onClick={() => setShowSurvey(true)}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-extrabold hover:scale-105 transition-transform"
          >
            Start Weekly Check-In →
          </button>
        </div>
      ) : (
        <div className="rounded-2xl p-6 bg-[#15263F] border border-white/5 mb-6 text-center">
          <CheckCircle2 size={36} className="mx-auto text-[#00F5A0] mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">You're all caught up! ✅</h3>
          <p className="text-sm text-white/50">You completed this week's check-in. Come back in {7 - daysSinceLast} day(s) for the next one.</p>
        </div>
      )}

      {/* Survey History */}
      <h3 className="font-bold text-white mb-3 flex items-center gap-2"><ClipboardList size={18} /> Check-In History</h3>
      {surveys.length > 0 ? (
        <div className="space-y-3">
          {surveys.map((survey) => (
            <div key={survey.id} className="rounded-2xl p-5 bg-[#15263F] border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-white/40" />
                  <span className="text-sm font-bold text-white">{survey.week_label || new Date(survey.date).toLocaleDateString()}</span>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-[#FF6B6B] bg-[#FF6B6B]/10 px-2 py-1 rounded-full">
                  <Flame size={12} /> {survey.streak_count} week streak
                </span>
              </div>
              <div className="space-y-2">
                {survey.responses?.map((r, i) => (
                  <div key={i} className="text-sm border-l-2 border-white/10 pl-3">
                    <p className="text-white/50 text-xs">{r.question}</p>
                    <p className="text-white font-semibold">{r.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState emoji="📝" title="No check-ins yet" message="Take your first weekly survey to start building your streak and tracking your financial growth!" />
      )}

      {showSurvey && (
        <SurveyModal onComplete={handleComplete} onClose={() => setShowSurvey(false)} streak={currentStreak} />
      )}
    </AppLayout>
  );
}