import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Logo from "@/components/Logo";
import { generateShareToken } from "@/lib/money";

const EMOJI_OPTIONS = ["😎", "🚀", "💎", "🔥", "⭐", "🎯", "🦄", "🌈", "💪", "✨"];

export default function Onboarding() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [emoji, setEmoji] = useState("😎");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !budget) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await base44.auth.updateMe({
        display_name: name.trim(),
        monthly_budget: parseFloat(budget),
        avatar_emoji: emoji,
        share_token: generateShareToken(),
        onboarded: true,
      });
      navigate("/app");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Logo size={70} showText={false} />
          <h1 className="mt-4 text-2xl font-extrabold text-white">Welcome to MoneyMode! 🎉</h1>
          <p className="text-sm text-white/50 mt-1">Let's set up your profile to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#15263F] rounded-2xl p-6 border border-white/10 space-y-5">
          {/* Avatar */}
          <div>
            <label className="text-sm font-semibold text-white/60 mb-2 block">Pick your avatar</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center border transition-all ${
                    emoji === em ? "border-[#00F5A0] bg-[#00F5A0]/10 scale-110" : "border-white/10 bg-[#0D1B2A]"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-semibold text-white/60 mb-1.5 block">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full px-4 py-3 bg-[#0D1B2A] rounded-xl text-white border border-white/10 focus:border-[#00F5A0] focus:outline-none"
            />
          </div>

          {/* Monthly Budget */}
          <div>
            <label className="text-sm font-semibold text-white/60 mb-1.5 block">Monthly Budget (optional)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">$</span>
              <input
                type="number"
                step="0.01"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="100"
                className="w-full pl-8 pr-4 py-3 bg-[#0D1B2A] rounded-xl text-white border border-white/10 focus:border-[#00F5A0] focus:outline-none"
              />
            </div>
            <p className="text-xs text-white/40 mt-1.5">How much money do you plan to spend per month?</p>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-extrabold disabled:opacity-50 hover:scale-[1.02] transition-transform"
          >
            {loading ? "Setting up..." : "Start Managing Money →"}
          </button>
        </form>
      </div>
    </div>
  );
}