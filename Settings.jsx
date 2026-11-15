import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import AppLayout from "@/components/AppLayout";
import Logo from "@/components/Logo";
import { generateShareToken, formatCurrency } from "@/lib/money";
import { Copy, Check, Eye, RefreshCw, User, Trash2, AlertTriangle } from "lucide-react";

const EMOJI_OPTIONS = ["😎", "🚀", "💎", "🔥", "⭐", "🎯", "🦄", "🌈", "💪", "✨"];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [emoji, setEmoji] = useState("😎");
  const [shareToken, setShareToken] = useState("");
  const [savedMsg, setSavedMsg] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      setName(u.display_name || "");
      setBudget(u.monthly_budget?.toString() || "");
      setEmoji(u.avatar_emoji || "😎");
      setShareToken(u.share_token || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.auth.updateMe({
        display_name: name,
        monthly_budget: parseFloat(budget) || 0,
        avatar_emoji: emoji,
      });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/parent/${shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateToken = async () => {
    const newToken = generateShareToken();
    setShareToken(newToken);
    await base44.auth.updateMe({ share_token: newToken });
  };

  const handleResetEverything = async () => {
    setResetting(true);
    try {
      const u = await base44.auth.me();
      await Promise.all([
        base44.entities.Transaction.deleteMany({ created_by_id: u.id }),
        base44.entities.SavingsGoal.deleteMany({ created_by_id: u.id }),
        base44.entities.Budget.deleteMany({ created_by_id: u.id }),
        base44.entities.WeeklySurvey.deleteMany({ created_by_id: u.id }),
        base44.entities.RecurringTransaction.deleteMany({ created_by_id: u.id }),
        base44.entities.MonthlyChallenge.deleteMany({ created_by_id: u.id }),
      ]);
      await base44.auth.updateMe({ xp_points: 0, level: 1, completed_lessons: [] });
      setResetDone(true);
      setShowReset(false);
      setTimeout(() => { window.location.href = "/app"; }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setResetting(false);
    }
  };

  const handleEnsureToken = async () => {
    if (!shareToken) {
      const newToken = generateShareToken();
      setShareToken(newToken);
      await base44.auth.updateMe({ share_token: newToken });
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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Settings</h1>
        <p className="text-sm text-white/50 mt-1">Manage your profile and parent sharing.</p>
      </div>

      {/* Profile Section */}
      <form onSubmit={handleSave} className="rounded-2xl p-6 bg-[#15263F] border border-white/5 mb-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><User size={18} className="text-[#00F5A0]" /> Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-white/60 mb-2 block">Avatar</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((em) => (
                <button key={em} type="button" onClick={() => setEmoji(em)}
                  className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center border transition-all ${emoji === em ? "border-[#00F5A0] bg-[#00F5A0]/10 scale-110" : "border-white/10 bg-[#0D1B2A]"}`}>
                  {em}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-white/60 mb-1.5 block">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-[#0D1B2A] rounded-xl text-white border border-white/10 focus:border-[#00F5A0] focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-semibold text-white/60 mb-1.5 block">Monthly Budget</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">$</span>
              <input type="number" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-[#0D1B2A] rounded-xl text-white border border-white/10 focus:border-[#00F5A0] focus:outline-none" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-extrabold disabled:opacity-50 hover:scale-105 transition-transform">
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {savedMsg && <span className="text-sm text-[#00F5A0] font-bold flex items-center gap-1"><Check size={16} /> Saved!</span>}
          </div>
        </div>
      </form>

      {/* Parent Sharing Section */}
      <div className="rounded-2xl p-6 bg-[#15263F] border border-white/5">
        <h3 className="font-bold text-white mb-1 flex items-center gap-2"><Eye size={18} className="text-[#9D5FDE]" /> Parent Access</h3>
        <p className="text-sm text-white/50 mb-4">Share this link or code with your parent so they can view your progress — no login needed.</p>

        {!shareToken ? (
          <button onClick={handleEnsureToken}
            className="px-6 py-3 rounded-xl bg-[#9D5FDE]/20 text-[#9D5FDE] font-bold border border-[#9D5FDE]/30 hover:bg-[#9D5FDE]/30 transition-colors">
            Generate Access Code
          </button>
        ) : (
          <div className="space-y-3">
            {/* Access Code */}
            <div>
              <label className="text-sm font-semibold text-white/60 mb-1.5 block">Your Access Code</label>
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-3 bg-[#0D1B2A] rounded-xl text-white text-center text-2xl font-extrabold tracking-[0.3em] border border-white/10">
                  {shareToken}
                </div>
                <button onClick={handleRegenerateToken} className="p-3 rounded-xl bg-white/5 text-white/50 hover:text-white" title="Regenerate code">
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>

            {/* Share Link */}
            <div>
              <label className="text-sm font-semibold text-white/60 mb-1.5 block">Shareable Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/parent/${shareToken}`}
                  className="flex-1 px-4 py-3 bg-[#0D1B2A] rounded-xl text-white text-sm border border-white/10 truncate"
                />
                <button onClick={handleCopyLink}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-bold flex items-center gap-2 hover:scale-105 transition-transform">
                  {copied ? <><Check size={18} /> Copied!</> : <><Copy size={18} /> Copy</>}
                </button>
              </div>
            </div>

            <p className="text-xs text-white/40 mt-2">
              💡 Your parent can go to the MoneyMode homepage, click "Parent View", and enter the code — or just open the link directly.
            </p>
          </div>
        )}
      </div>
      {/* Danger Zone */}
      <div className="rounded-2xl p-6 bg-[#15263F] border border-red-500/20 mt-6">
        <h3 className="font-bold text-white mb-1 flex items-center gap-2"><Trash2 size={18} className="text-red-400" /> Danger Zone</h3>
        <p className="text-sm text-white/50 mb-4">Reset your account back to zero. This deletes <span className="text-red-400 font-semibold">all</span> transactions, goals, budgets, surveys, recurring transactions, challenges, XP, and lesson progress. This cannot be undone.</p>

        {resetDone ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#00F5A0]/10 text-[#00F5A0] font-bold">
            <Check size={18} /> Everything reset! Redirecting...
          </div>
        ) : showReset ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-white/70">Are you absolutely sure? All your data will be permanently deleted and your XP will be reset to 0. There is no recovery.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleResetEverything}
                disabled={resetting}
                className="px-6 py-3 rounded-xl bg-red-500 text-white font-extrabold disabled:opacity-50 hover:bg-red-600 transition-colors"
              >
                {resetting ? "Resetting..." : "Yes, Reset Everything"}
              </button>
              <button
                onClick={() => setShowReset(false)}
                disabled={resetting}
                className="px-6 py-3 rounded-xl bg-white/5 text-white/60 font-bold hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowReset(true)}
            className="px-6 py-3 rounded-xl bg-red-500/10 text-red-400 font-bold border border-red-500/30 hover:bg-red-500/20 transition-colors"
          >
            Reset Everything
          </button>
        )}
      </div>
    </AppLayout>
  );
}