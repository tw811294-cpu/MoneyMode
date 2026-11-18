import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Logo from "@/components/Logo";
import { TrendingUp, Target, BarChart3, ClipboardList, ArrowRight, Eye } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentCode, setParentCode] = useState("");
  const [codeError, setCodeError] = useState("");

  const handleAuth = async (path) => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const user = await base44.auth.me();
        if (user?.onboarded) {
          navigate("/app");
        } else {
          navigate("/onboarding");
        }
      } else {
        navigate(path);
      }
    } catch {
      navigate(path);
    }
  };

  const handleParentView = () => {
    if (parentCode.trim().length < 4) {
      setCodeError("Please enter a valid access code");
      return;
    }
    navigate(`/parent/${parentCode.trim().toUpperCase()}`);
  };

  const features = [
  { icon: TrendingUp, title: "Track Income & Expenses", desc: "Log every dollar in and out. Know exactly where your money goes." },
  { icon: Target, title: "Savings Goals", desc: "Set targets, watch progress bars fill up, and celebrate when you reach them." },
  { icon: BarChart3, title: "Visual Reports", desc: "See your spending habits with beautiful charts and monthly breakdowns." },
  { icon: ClipboardList, title: "Weekly Check-Ins", desc: "Build streaks with weekly surveys that keep you motivated and learning." }];


  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Top Nav */}
      <nav className="absolute top-0 left-0 right-0 z-20 px-4 sm:px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={32} showText={false} />
            <span className="text-lg font-extrabold tracking-tight">
              <span className="text-white">MONEY</span>
              <span className="text-[#39d353]">MODE</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/about" className="hidden sm:block px-4 py-2.5 rounded-xl text-sm font-bold text-white/60 hover:text-white transition-colors">About</Link>
            <Link to="/contact" className="hidden sm:block px-4 py-2.5 rounded-xl text-sm font-bold text-white/60 hover:text-white transition-colors">Contact</Link>
            <button
              onClick={() => handleAuth("/login")}
              className="px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold text-white/80 hover:text-white transition-colors">
              
              Log In
            </button>
            <button
              onClick={() => handleAuth("/register")}
              className="px-4 sm:px-5 py-2.5 rounded-xl text-sm font-extrabold bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] hover:scale-105 transition-transform">
              
              Get Started
            </button>
            <button
              onClick={() => setShowParentModal(true)}
              className="px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold border border-[#39d353]/40 text-[#39d353] hover:bg-[#39d353]/10 transition-colors">
              
              <span className="hidden sm:inline">Parent View</span>
              <span className="sm:hidden">Parent</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-12 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#39d353]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <Logo size={140} />
          <p className="mt-8 text-lg sm:text-xl max-w-md font-medium text-[#2bda88]">The money app that turns teens into financial pros. Track spending, crush savings goals, and build habits that last.

          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleAuth("/register")}
              className="px-8 py-4 rounded-xl text-base font-extrabold bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] hover:scale-105 transition-transform flex items-center gap-2">
              
              Start Managing Money <ArrowRight size={20} />
            </button>
            <button
              onClick={() => setShowParentModal(true)}
              className="px-8 py-4 rounded-xl text-base font-bold border border-white/20 text-white/80 hover:bg-white/5 transition-colors flex items-center gap-2">
              
              <Eye size={20} /> Parent View
            </button>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 mt-16 sm:mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl w-full px-2">
          {features.map((f, i) =>
          <div
            key={i}
            className="rounded-2xl p-5 bg-white/[0.03] border border-white/10 hover:border-[#39d353]/30 transition-colors text-left">
            
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00F5A0]/20 to-[#39d353]/10 flex items-center justify-center text-[#00F5A0] mb-3">
                <f.icon size={22} />
              </div>
              <h3 className="font-bold text-white text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size={24} showText={false} />
            <span className="text-sm font-extrabold tracking-tight">
              <span className="text-white">MONEY</span>
              <span className="text-[#39d353]">MODE</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/about" className="text-sm font-bold text-white/60 hover:text-white transition-colors">About</Link>
            <Link to="/contact" className="text-sm font-bold text-white/60 hover:text-white transition-colors">Contact</Link>
          </div>
          <p className="text-xs text-white/30">© {new Date().getFullYear()} MoneyMode</p>
        </div>
      </footer>

      {/* Parent Modal */}
      {showParentModal &&
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#15263F] rounded-2xl w-full max-w-sm p-6 border border-white/10 animate-scale-in">
            <div className="flex items-center gap-2 mb-2">
              <Eye size={20} className="text-[#39d353]" />
              <h2 className="text-xl font-extrabold text-white">Parent View</h2>
            </div>
            <p className="text-sm text-white/50 mb-4">
              Enter the access code your teen shared with you to view their progress.
            </p>
            <input
            type="text"
            value={parentCode}
            onChange={(e) => {setParentCode(e.target.value);setCodeError("");}}
            placeholder="e.g. ABC123"
            className="w-full px-4 py-3 bg-[#0D1B2A] rounded-xl text-white text-center text-lg font-bold tracking-widest uppercase border border-white/10 focus:border-[#39d353] focus:outline-none" />
          
            {codeError && <p className="text-xs text-red-400 mt-2">{codeError}</p>}
            <div className="flex gap-2 mt-4">
              <button
              onClick={() => setShowParentModal(false)}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white/60 hover:text-white">
              
                Cancel
              </button>
              <button
              onClick={handleParentView}
              className="flex-1 py-3 rounded-xl text-sm font-extrabold bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A]">
              
                View Progress
              </button>
            </div>
          </div>
        </div>
      }
    </div>);

}