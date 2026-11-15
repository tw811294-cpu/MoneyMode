import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import AppLayout from "@/components/AppLayout";
import { formatCurrency, getCategoryInfo } from "@/lib/money";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

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

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  const getDayTxns = (day) => {
    const dateStr = `${monthStr}-${String(day).padStart(2, "0")}`;
    return transactions.filter(t => t.date === dateStr);
  };

  const prevMonth = () => { setViewDate(new Date(year, month - 1, 1)); setSelectedDay(null); };
  const nextMonth = () => { setViewDate(new Date(year, month + 1, 1)); setSelectedDay(null); };

  const today = new Date();
  const isToday = (day) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/10 border-t-[#00F5A0] rounded-full animate-spin" />
      </div>
    );
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedTxns = selectedDay ? getDayTxns(selectedDay) : [];
  const monthTxns = transactions.filter(t => t.date && t.date.startsWith(monthStr));
  const monthIncome = monthTxns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpenses = monthTxns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <AppLayout user={user}>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
          <CalendarDays size={28} className="text-[#00F5A0]" /> Calendar
        </h1>
        <p className="text-sm text-white/50 mt-1">See your transactions laid out on a calendar.</p>
      </div>

      {/* Month Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-2xl p-4 bg-[#15263F] border border-white/5">
          <p className="text-xs text-white/40 font-semibold">Income this month</p>
          <p className="text-xl font-extrabold text-[#00F5A0]">{formatCurrency(monthIncome)}</p>
        </div>
        <div className="rounded-2xl p-4 bg-[#15263F] border border-white/5">
          <p className="text-xs text-white/40 font-semibold">Expenses this month</p>
          <p className="text-xl font-extrabold text-red-400">{formatCurrency(monthExpenses)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <div className="lg:col-span-2 rounded-2xl p-5 bg-[#15263F] border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white">
              <ChevronLeft size={18} />
            </button>
            <h3 className="font-bold text-white">{viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
            <button onClick={nextMonth} className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-bold text-white/40 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const dayTxns = getDayTxns(day);
              const hasTxns = dayTxns.length > 0;
              const income = dayTxns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
              const expenses = dayTxns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-lg p-1 flex flex-col items-center justify-start gap-0.5 transition-colors border ${
                    selectedDay === day ? "bg-[#00F5A0]/20 border-[#00F5A0]/40" : isToday(day) ? "bg-[#9D5FDE]/10 border-[#9D5FDE]/30" : "border-transparent hover:bg-white/5"
                  }`}
                >
                  <span className={`text-xs font-bold ${isToday(day) ? "text-[#9D5FDE]" : "text-white/70"}`}>{day}</span>
                  {hasTxns && (
                    <div className="flex flex-col gap-0.5 w-full px-0.5">
                      {income > 0 && <div className="h-1 rounded-full bg-[#00F5A0]" />}
                      {expenses > 0 && <div className="h-1 rounded-full bg-red-400" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5">
          {selectedDay ? (
            <>
              <h3 className="font-bold text-white mb-3">
                {new Date(year, month, selectedDay).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </h3>
              {selectedTxns.length > 0 ? (
                <div className="space-y-2">
                  {selectedTxns.map((txn) => {
                    const cat = getCategoryInfo(txn.category, txn.type);
                    return (
                      <div key={txn.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                        <span className="text-lg">{cat.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{txn.description || cat.label}</p>
                          <p className="text-[10px] text-white/40">{cat.label}</p>
                        </div>
                        <span className={`text-xs font-bold ${txn.type === "income" ? "text-[#00F5A0]" : "text-red-400"}`}>
                          {txn.type === "income" ? "+" : "-"}{formatCurrency(txn.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-white/40 text-center py-8">No transactions on this day.</p>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <CalendarDays size={32} className="mx-auto text-white/20 mb-2" />
              <p className="text-sm text-white/40">Tap a day to see its transactions.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}