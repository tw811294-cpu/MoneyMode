import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import AppLayout from "@/components/AppLayout";
import { formatCurrency, getCategoryInfo, getCurrentMonth } from "@/lib/money";
import { Bot, Send, Sparkles, Loader2 } from "lucide-react";

const PRESET_QUESTIONS = [
  "How can I save more money?",
  "Am I spending too much on food?",
  "How do I reach my savings goals faster?",
  "What's a good budget for someone my age?",
  "How can I earn more income?",
];

export default function Coach() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [advice, setAdvice] = useState(null);
  const [asking, setAsking] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const [txns, gls, bdgs] = await Promise.all([
        base44.entities.Transaction.filter({ created_by_id: u.id }, "-date", 200),
        base44.entities.SavingsGoal.filter({ created_by_id: u.id }),
        base44.entities.Budget.filter({ created_by_id: u.id }),
      ]);
      setTransactions(txns);
      setGoals(gls);
      setBudgets(bdgs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const buildSummary = () => {
    const cm = getCurrentMonth();
    const monthTxns = transactions.filter(t => t.date && t.date.startsWith(cm));
    const monthIncome = monthTxns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const monthExpenses = monthTxns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const totalSaved = transactions.filter(t => t.type === "income").reduce((s, t) => s + (t.savings_allocation || 0), 0);
    const activeGoals = goals.filter(g => !g.completed);
    const topCats = ["food", "entertainment", "clothes", "transport", "other"].map(c => {
      const spent = monthTxns.filter(t => t.type === "expense" && t.category === c).reduce((s, t) => s + t.amount, 0);
      return `${c}: ${formatCurrency(spent)}`;
    }).join(", ");

    return `Financial Summary:
- This month income: ${formatCurrency(monthIncome)}
- This month expenses: ${formatCurrency(monthExpenses)}
- Total saved: ${formatCurrency(totalSaved)}
- Active savings goals: ${activeGoals.length}
- Monthly budget: ${formatCurrency(user?.monthly_budget || 0)}
- Spending by category this month: ${topCats}`;
  };

  const askCoach = async (q) => {
    if (!q.trim()) return;
    setAsking(true);
    setAdvice(null);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are MoneyMode's AI Financial Coach — friendly, encouraging, and practical. You help teens and young adults make smart money decisions. Keep advice actionable, use simple language, and be motivating. Use emojis sparingly.\n\n${buildSummary()}\n\nUser question: ${q}\n\nGive personalized advice based on their data above. Respond in 2-3 short paragraphs with specific numbers from their summary where relevant.`,
        response_json_schema: {
          type: "object",
          properties: {
            advice: { type: "string" },
            tips: { type: "array", items: { type: "string" } },
          },
        },
      });
      setAdvice(response);
    } catch (err) {
      setAdvice({ advice: "Sorry, I couldn't connect right now. Please try again in a moment.", tips: [] });
    } finally {
      setAsking(false);
    }
  };

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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
          <Bot size={28} className="text-[#9D5FDE]" /> AI Financial Coach
        </h1>
        <p className="text-sm text-white/50 mt-1">Get personalized money advice powered by AI, based on your real data.</p>
      </div>

      {/* Coach Avatar */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-[#15263F] to-[#1B2D4A] border border-[#9D5FDE]/20 mb-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9D5FDE] to-[#7B2FBE] flex items-center justify-center mx-auto mb-3 glow-purple">
          <Bot size={32} className="text-white" />
        </div>
        <p className="text-white/70 text-sm">Ask me anything about your finances — saving, spending, budgeting, goals, and more.</p>
      </div>

      {/* Preset Questions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESET_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => { setQuestion(q); askCoach(q); }}
            disabled={asking}
            className="px-4 py-2 rounded-xl bg-[#15263F] border border-white/10 text-sm text-white/70 font-semibold hover:border-[#9D5FDE]/40 hover:text-white transition-colors disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && askCoach(question)}
          placeholder="Ask your financial question..."
          disabled={asking}
          className="flex-1 px-4 py-3 bg-[#15263F] rounded-xl text-white border border-white/10 focus:border-[#9D5FDE] focus:outline-none disabled:opacity-40"
        />
        <button
          onClick={() => askCoach(question)}
          disabled={asking || !question.trim()}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#9D5FDE] to-[#7B2FBE] text-white font-bold hover:scale-105 transition-transform disabled:opacity-40 disabled:hover:scale-100 flex items-center gap-2"
        >
          {asking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>

      {/* Response */}
      {asking && (
        <div className="rounded-2xl p-6 bg-[#15263F] border border-white/5 flex items-center gap-3">
          <Loader2 size={20} className="animate-spin text-[#9D5FDE]" />
          <p className="text-white/50 text-sm">Your coach is analyzing your finances...</p>
        </div>
      )}

      {advice && !asking && (
        <div className="rounded-2xl p-6 bg-[#15263F] border border-[#9D5FDE]/20 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-[#9D5FDE]" />
            <h3 className="font-bold text-white">Coach's Advice</h3>
          </div>
          <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap mb-4">{advice.advice}</p>
          {advice.tips && advice.tips.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#00F5A0] uppercase tracking-wide">Quick Tips</p>
              {advice.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                  <span className="text-[#00F5A0] mt-0.5">✓</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}