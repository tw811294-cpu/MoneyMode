import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import AppLayout from "@/components/AppLayout";
import { formatCurrency, calculateSpendingForecast } from "@/lib/money";
import { TrendingUp, TrendingDown, Minus, Loader2, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Forecast() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState(null);
  const [gettingInsight, setGettingInsight] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const txns = await base44.entities.Transaction.filter({ created_by_id: u.id }, "-date", 500);
      setTransactions(txns);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const forecast = calculateSpendingForecast(transactions);

  const chartData = [...forecast.months, { month: "next", label: "Next*", total: forecast.avgTotal, count: 0, projected: true }];

  const getInsight = async () => {
    setGettingInsight(true);
    try {
      const summary = forecast.months.map(m => `${m.label}: ${formatCurrency(m.total)}`).join(", ");
      const catSummary = forecast.categoryForecast.map(c => `${c.category}: avg ${formatCurrency(c.avg)}`).join(", ");
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a financial analyst for teens. Based on this 3-month spending data: ${summary}. Category averages: ${catSummary}. Trend: ${forecast.trend}. Projected next month: ${formatCurrency(forecast.avgTotal)}. Give a 2-3 sentence forecast insight with one actionable tip. Be encouraging and specific.`,
        response_json_schema: { type: "object", properties: { insight: { type: "string" }, tip: { type: "string" } } },
      });
      setInsight(response);
    } catch (err) {
      setInsight({ insight: "Unable to generate insight right now.", tip: "" });
    } finally {
      setGettingInsight(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/10 border-t-[#00F5A0] rounded-full animate-spin" />
      </div>
    );
  }

  const trendIcon = forecast.trend === "increasing" ? <TrendingUp size={18} className="text-red-400" /> : forecast.trend === "decreasing" ? <TrendingDown size={18} className="text-[#00F5A0]" /> : <Minus size={18} className="text-white/40" />;
  const trendLabel = forecast.trend === "increasing" ? "Trending Up" : forecast.trend === "decreasing" ? "Trending Down" : "Stable";

  return (
    <AppLayout user={user}>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
          <TrendingUp size={28} className="text-[#00F5A0]" /> Spending Forecast
        </h1>
        <p className="text-sm text-white/50 mt-1">See where your spending is heading based on your recent trends.</p>
      </div>

      {/* Projection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5">
          <p className="text-xs text-white/40 font-semibold mb-1">Projected Next Month</p>
          <p className="text-2xl font-extrabold text-white">{formatCurrency(forecast.avgTotal)}</p>
          <p className="text-xs text-white/30 mt-1">3-month average</p>
        </div>
        <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5">
          <p className="text-xs text-white/40 font-semibold mb-1">Spending Trend</p>
          <div className="flex items-center gap-2 mt-1">
            {trendIcon}
            <p className="text-lg font-bold text-white">{trendLabel}</p>
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5">
          <p className="text-xs text-white/40 font-semibold mb-1">Months Tracked</p>
          <p className="text-2xl font-extrabold text-white">{forecast.months.filter(m => m.count > 0).length}</p>
          <p className="text-xs text-white/30 mt-1">with data</p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5 mb-6">
        <h3 className="font-bold text-white mb-4">Monthly Spending History</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" fontSize={12} />
            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={{ background: "#0D1B2A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }} formatter={(v) => formatCurrency(v)} />
            <Bar dataKey="total" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.projected ? "#9D5FDE" : "#00F5A0"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-white/30 mt-2">* Purple bar = projected based on 3-month average</p>
      </div>

      {/* Category Forecast */}
      {forecast.categoryForecast.length > 0 && (
        <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5 mb-6">
          <h3 className="font-bold text-white mb-4">Forecast by Category</h3>
          <div className="space-y-3">
            {forecast.categoryForecast.map((cat) => (
              <div key={cat.value}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-white/80 font-semibold">{cat.emoji} {cat.category}</span>
                  <span className="text-sm font-bold text-white">{formatCurrency(cat.avg)}<span className="text-xs text-white/40 font-normal">/mo</span></span>
                </div>
                <div className="flex gap-1 h-2">
                  {cat.months.map((m, i) => (
                    <div key={i} className="flex-1 bg-[#0D1B2A] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${cat.avg > 0 ? Math.min(100, (m / cat.avg) * 100) : 0}%`, background: cat.color }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insight */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-[#15263F] to-[#1B2D4A] border border-[#9D5FDE]/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white flex items-center gap-2"><Sparkles size={18} className="text-[#9D5FDE]" /> AI Forecast Insight</h3>
          {!insight && !gettingInsight && (
            <button onClick={getInsight} className="text-xs font-bold text-[#9D5FDE] hover:text-[#9D5FDE]/80">Generate →</button>
          )}
        </div>
        {gettingInsight ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 size={16} className="animate-spin text-[#9D5FDE]" />
            <p className="text-sm text-white/50">Analyzing your trends...</p>
          </div>
        ) : insight ? (
          <div>
            <p className="text-white/80 text-sm leading-relaxed mb-2">{insight.insight}</p>
            {insight.tip && <p className="text-sm text-[#00F5A0]">💡 {insight.tip}</p>}
          </div>
        ) : (
          <p className="text-sm text-white/50">Get an AI-powered insight about your spending forecast and what to watch for next month.</p>
        )}
      </div>
    </AppLayout>
  );
}