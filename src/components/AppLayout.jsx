import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Receipt, Target, Wallet, BarChart3, ClipboardList, Settings, LogOut, Trophy, Bot, CalendarDays, Award, BookOpen, RefreshCw, Camera, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getFinancialTitle } from "@/lib/money";
import Logo from "./Logo";

const navItems = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/transactions", label: "Transactions", icon: Receipt },
  { to: "/app/recurring", label: "Recurring", icon: RefreshCw },
  { to: "/app/goals", label: "Goals", icon: Target },
  { to: "/app/budgets", label: "Budgets", icon: Wallet },
  { to: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/app/reports", label: "Reports", icon: BarChart3 },
  { to: "/app/forecast", label: "Forecast", icon: TrendingUp },
  { to: "/app/scanner", label: "Scanner", icon: Camera },
  { to: "/app/challenges", label: "Challenges", icon: Trophy },
  { to: "/app/achievements", label: "Achievements", icon: Award },
  { to: "/app/learn", label: "Learn", icon: BookOpen },
  { to: "/app/coach", label: "AI Coach", icon: Bot },
  { to: "/app/survey", label: "Weekly Survey", icon: ClipboardList },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export default function AppLayout({ children, user, onLogout }) {
  const navigate = useNavigate();
  const titleInfo = getFinancialTitle(user?.xp_points || 0);

  const handleLogout = async () => {
    await base44.auth.logout();
    onLogout?.();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0F1E33] border-r border-white/5 fixed h-full">
        <div className="p-6 flex items-center gap-2">
          <Logo size={36} showText={false} />
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-white">MONEY</span>
            <span className="text-[#39d353]">MODE</span>
          </span>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-[#00F5A0]/20 to-[#39d353]/10 text-[#00F5A0] border border-[#00F5A0]/30"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00F5A0] to-[#39d353] flex items-center justify-center text-xl">
              {user?.avatar_emoji || "😎"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.display_name || "Teen"}</p>
              <p className="text-xs font-bold truncate" style={{ color: titleInfo.color }}>
                {titleInfo.emoji} {titleInfo.title}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">{children}</div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F1E33] border-t border-white/10 z-50">
        <div className="flex overflow-x-auto scrollbar-hide items-center px-2 py-2 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
                  isActive ? "text-[#00F5A0]" : "text-white/40"
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}