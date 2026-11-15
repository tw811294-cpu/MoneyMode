import { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import AppLayout from "@/components/AppLayout";
import { formatCurrency, getCategoryInfo, getXpReward, getLevelFromXp, EXPENSE_CATEGORIES } from "@/lib/money";
import { Camera, Upload, Loader2, Check, X, ScanLine } from "lucide-react";

export default function Scanner() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setExtracted(null);
    setSaved(false);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setReceiptUrl(file_url);
      setUploading(false);
      setExtracting(true);
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            merchant: { type: "string" },
            total_amount: { type: "number" },
            date: { type: "string" },
            category: { type: "string", enum: ["food", "entertainment", "clothes", "transport", "other"] },
          },
        },
      });
      if (result.status === "success" && result.output) {
        const data = result.output;
        setExtracted({
          merchant: data.merchant || "",
          amount: data.total_amount || 0,
          date: data.date || new Date().toISOString().split("T")[0],
          category: data.category || "other",
        });
      } else {
        setExtracted({ merchant: "", amount: 0, date: new Date().toISOString().split("T")[0], category: "other" });
      }
    } catch (err) {
      console.error(err);
      setExtracted({ merchant: "", amount: 0, date: new Date().toISOString().split("T")[0], category: "other" });
    } finally {
      setUploading(false);
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!extracted || !extracted.amount) return;
    setSaving(true);
    try {
      await base44.entities.Transaction.create({
        type: "expense",
        amount: parseFloat(extracted.amount),
        category: extracted.category,
        description: extracted.merchant || "Receipt scan",
        date: extracted.date,
      });
      const newXp = (user?.xp_points || 0) + getXpReward("expense");
      await base44.auth.updateMe({ xp_points: newXp, level: getLevelFromXp(newXp) });
      setSaved(true);
      setTimeout(() => {
        setExtracted(null);
        setReceiptUrl(null);
        setSaved(false);
      }, 2000);
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const reset = () => {
    setExtracted(null);
    setReceiptUrl(null);
    setSaved(false);
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
          <ScanLine size={28} className="text-[#00F5A0]" /> Receipt Scanner
        </h1>
        <p className="text-sm text-white/50 mt-1">Snap a photo of a receipt and we'll auto-extract the details.</p>
      </div>

      {/* Upload Zone */}
      {!extracted && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="rounded-2xl p-8 bg-[#15263F] border-2 border-dashed border-white/10 hover:border-[#00F5A0]/40 transition-colors cursor-pointer text-center"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />
          {uploading ? (
            <>
              <Loader2 size={40} className="mx-auto text-[#00F5A0] animate-spin mb-3" />
              <p className="text-sm text-white/60">Uploading receipt...</p>
            </>
          ) : extracting ? (
            <>
              <ScanLine size={40} className="mx-auto text-[#9D5FDE] animate-pulse mb-3" />
              <p className="text-sm text-white/60">Scanning receipt details...</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-[#00F5A0]/10 flex items-center justify-center mx-auto mb-4">
                <Camera size={32} className="text-[#00F5A0]" />
              </div>
              <p className="text-lg font-bold text-white mb-1">Tap to upload a receipt</p>
              <p className="text-sm text-white/40">Take a photo or choose from gallery</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Upload size={14} className="text-white/30" />
                <span className="text-xs text-white/30">JPG, PNG supported</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Preview + Extracted Data */}
      {receiptUrl && extracted && (
        <div className="space-y-4 animate-fade-in">
          {/* Receipt Image */}
          <div className="rounded-2xl p-3 bg-[#15263F] border border-white/5">
            <img src={receiptUrl} alt="Receipt" className="w-full max-h-64 object-contain rounded-xl" />
          </div>

          {saved ? (
            <div className="rounded-2xl p-6 bg-[#00F5A0]/10 border border-[#00F5A0]/30 text-center">
              <Check size={40} className="mx-auto text-[#00F5A0] mb-2" />
              <p className="text-lg font-bold text-white">Transaction Saved!</p>
              <p className="text-sm text-white/50 mt-1">+{getXpReward("expense")} XP earned</p>
            </div>
          ) : (
            <>
              {/* Editable Extracted Fields */}
              <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2"><ScanLine size={18} className="text-[#9D5FDE]" /> Scanned Details</h3>
                  <button onClick={reset} className="text-xs text-white/40 hover:text-white flex items-center gap-1"><X size={12} /> Discard</button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/50 mb-1 block">Merchant</label>
                  <input type="text" value={extracted.merchant} onChange={(e) => setExtracted({ ...extracted, merchant: e.target.value })} placeholder="Store name" className="w-full px-3 py-2.5 bg-[#0D1B2A] rounded-lg text-white text-sm border border-white/10 focus:border-[#00F5A0] focus:outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-white/50 mb-1 block">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-bold text-sm">$</span>
                      <input type="number" step="0.01" value={extracted.amount || ""} onChange={(e) => setExtracted({ ...extracted, amount: e.target.value })} className="w-full pl-7 pr-3 py-2.5 bg-[#0D1B2A] rounded-lg text-white text-sm font-bold border border-white/10 focus:border-[#00F5A0] focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/50 mb-1 block">Date</label>
                    <input type="date" value={extracted.date} onChange={(e) => setExtracted({ ...extracted, date: e.target.value })} className="w-full px-3 py-2.5 bg-[#0D1B2A] rounded-lg text-white text-sm border border-white/10 focus:border-[#00F5A0] focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/50 mb-2 block">Category</label>
                  <div className="grid grid-cols-5 gap-2">
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <button key={cat.value} type="button" onClick={() => setExtracted({ ...extracted, category: cat.value })} className={`flex flex-col items-center gap-1 py-2 rounded-lg border transition-all ${extracted.category === cat.value ? "border-[#00F5A0] bg-[#00F5A0]/10" : "border-white/10 bg-[#0D1B2A]"}`}>
                        <span className="text-lg">{cat.emoji}</span>
                        <span className="text-[9px] font-semibold text-white/60">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !extracted.amount}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-extrabold hover:scale-[1.02] transition-transform disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                {saving ? "Saving..." : `Save Transaction (${formatCurrency(parseFloat(extracted.amount) || 0)})`}
              </button>
            </>
          )}
        </div>
      )}
    </AppLayout>
  );
}