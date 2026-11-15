import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import AppLayout from "@/components/AppLayout";
import { getXpReward, getLevelFromXp } from "@/lib/money";
import { BookOpen, CheckCircle2, Clock, ChevronDown, GraduationCap } from "lucide-react";

const LESSONS = [
  {
    id: "budget-503020",
    category: "Budgeting",
    emoji: "🎯",
    title: "The 50/30/20 Rule",
    readTime: "3 min",
    content: "The 50/30/20 rule is one of the simplest budgeting methods. Here's how it works:\n\n• 50% for Needs: Things you can't live without — food, housing, transport, basic clothes.\n• 30% for Wants: Fun stuff — games, eating out, subscriptions, hobbies.\n• 20% for Savings: Put this away before you spend anything. Future you will thank present you.\n\nExample: If you earn $200/month from allowance and a part-time job, that's $100 for needs, $60 for wants, and $40 into savings.\n\nThe beauty of this rule is its simplicity. You don't need a spreadsheet — just split your money into three buckets every time you get paid."
  },
  {
    id: "budget-zero",
    category: "Budgeting",
    emoji: "🔢",
    title: "Zero-Based Budgeting",
    readTime: "4 min",
    content: "Zero-based budgeting means giving every single dollar a job before the month begins. The goal: Income - Expenses = $0.\n\nThat doesn't mean you spend everything — savings and investments count as 'expenses' in this system.\n\nStep 1: Write down your expected income.\nStep 2: List every category — savings, food, fun, transport, etc.\nStep 3: Assign dollars until your balance hits zero.\n\nThis method forces you to be intentional. Instead of 'I'll save whatever's left' (usually nothing), you decide upfront how much to save."
  },
  {
    id: "budget-envelope",
    category: "Budgeting",
    emoji: "✉️",
    title: "The Envelope System",
    readTime: "3 min",
    content: "The envelope system is an old-school method that still works wonders:\n\n1. Create envelopes (physical or digital) for each spending category.\n2. Put your budgeted cash in each envelope at the start of the month.\n3. When an envelope is empty, you're done spending in that category.\n\nThis works because it creates a physical limit. You can't overspend on food if the food envelope is empty — you have to cook at home instead.\n\nModern version: Use separate accounts or a budgeting app (like MoneyMode!) to track your 'envelopes' digitally."
  },
  {
    id: "save-payfirst",
    category: "Saving",
    emoji: "🪙",
    title: "Pay Yourself First",
    readTime: "2 min",
    content: "This is the golden rule of saving: Before you pay for food, before you pay for fun, pay YOURSELF first.\n\nMost people save what's left after spending. Wealthy people spend what's left after saving.\n\nHow to do it:\n• The moment you get money (allowance, paycheck, gift), move 20% to savings immediately.\n• Treat it like a bill you owe yourself.\n• Use auto-split features (like MoneyMode's income split) to make it automatic.\n\nIf you save $20/week starting at age 16, you'll have over $1,000 by graduation — just from consistent saving."
  },
  {
    id: "save-emergency",
    category: "Saving",
    emoji: "🚨",
    title: "Emergency Funds 101",
    readTime: "3 min",
    content: "An emergency fund is money set aside for unexpected expenses — phone breaks, bike repair, medical bill, etc.\n\nWhy it matters: Without one, every surprise expense becomes a crisis. With one, it's just a minor inconvenience.\n\nHow to start:\n• Goal 1: Save $100 (starter emergency fund)\n• Goal 2: Save $500 (covers most teen emergencies)\n• Goal 3: Save 1 month of expenses\n\nKeep this money separate from your regular savings so you're not tempted to spend it on non-emergencies. A good rule: if you can plan for it, it's not an emergency — it's a sinking fund."
  },
  {
    id: "save-sinking",
    category: "Saving",
    emoji: "🎯",
    title: "Sinking Funds",
    readTime: "3 min",
    content: "Sinking funds are savings targeted at a specific future expense. Instead of one big savings account, you save for specific goals.\n\nExamples:\n• $300 for a new phone in 6 months → save $50/month\n• $150 for holiday gifts in 3 months → save $50/month\n• $200 for a trip in 4 months → save $50/month\n\nThe magic: By spreading the cost over time, you avoid the pain of a big hit all at once. You also avoid putting it on a credit card and paying interest.\n\nMoneyMode's savings goals are perfect for this — create a goal for each sinking fund and track your progress!"
  },
  {
    id: "earn-sidehustle",
    category: "Earning",
    emoji: "💼",
    title: "Side Hustles for Teens",
    readTime: "4 min",
    content: "Want to earn more? Here are proven side hustles for teens:\n\n• Tutoring: Help younger kids with homework. $15-25/hour.\n• Pet sitting/Dog walking: Use apps like Rover or ask neighbors. $15-20/walk.\n• Lawn care: Mow lawns in summer, shovel snow in winter. $25-50/job.\n• Selling online: Flip thrift store finds on eBay/Depop.\n• Content creation: Start a YouTube channel or TikTok about a hobby.\n• Freelance skills: If you're good at design, coding, or writing, try Fiverr.\n\nTips for success:\n1. Start with something you enjoy.\n2. Be reliable — show up on time, every time.\n3. Reinvest some earnings into growing your hustle.\n4. Track your income in MoneyMode to see what's most profitable."
  },
  {
    id: "earn-negotiate",
    category: "Earning",
    emoji: "🤝",
    title: "Negotiating Your Pay",
    readTime: "3 min",
    content: "Whether it's a part-time job or a side gig, knowing how to negotiate is a superpower.\n\nBefore negotiating:\n• Research what others your age earn for similar work.\n• List your value — reliability, skills, experience.\n• Pick the right moment (after a win, during a review).\n\nThe conversation:\n1. Express appreciation: 'I really enjoy working here...'\n2. State your case: 'I've taken on X, Y, Z responsibilities...'\n3. Make the ask: 'I'd like to discuss moving to $X/hour.'\n4. Be quiet and let them respond.\n\nEven if you get a 'no,' asking shows confidence. And the worst case is they say 'not yet' — which means 'ask again later.'"
  },
  {
    id: "spend-needswants",
    category: "Smart Spending",
    emoji: "🧠",
    title: "Needs vs Wants",
    readTime: "2 min",
    content: "The foundation of smart spending is knowing the difference between needs and wants.\n\nNeeds: Food, basic clothing, school supplies, transport to school/work, phone (for safety).\n\nWants: Premium brands, eating out, games, subscriptions, snacks, the newest phone model.\n\nThe test: Ask yourself 'Can I function normally without this for a week?' If yes, it's a want.\n\nThis doesn't mean you should never buy wants — that's what the 30% in the 50/30/20 rule is for. It means being honest about which is which, so you don't accidentally spend your 'needs' money on 'wants.'\n\nPro tip: Wait 24 hours before any non-essential purchase over $20. If you still want it tomorrow, go for it."
  },
  {
    id: "spend-impulse",
    category: "Smart Spending",
    emoji: "🛑",
    title: "Avoiding Impulse Buys",
    readTime: "3 min",
    content: "Impulse buying is the #1 budget killer. Here's how to fight back:\n\n1. The 24-Hour Rule: See something you want? Wait 24 hours. 60% of impulse desires fade by tomorrow.\n\n2. The Cost-in-Hours Test: 'Is this $50 item worth 5 hours of work?' Pricing things in your time makes you think twice.\n\n3. Unsubscribe: Remove saved cards from shopping apps. The friction of entering card details kills impulse buys.\n\n4. Delete Shopping Apps: If you can't resist, remove the temptation. Use the web version instead — it's less addictive.\n\n5. The Replacement Question: 'What could I do with this money instead?' Visualize saving it or spending on something you value more.\n\nEvery impulse buy you avoid is money that can go toward your goals."
  },
  {
    id: "spend-comparison",
    category: "Smart Spending",
    emoji: "🔍",
    title: "Comparison Shopping",
    readTime: "3 min",
    content: "Never buy the first price you see. Comparison shopping can save you 10-40% on almost everything.\n\nFor online purchases:\n• Check 3+ stores before buying.\n• Use price tracking tools (CamelCamelCamel for Amazon).\n• Look for coupon codes (RetailMeNot, Honey).\n• Consider refurbished or used options.\n\nFor in-store:\n• Use apps to scan barcodes and compare prices.\n• Ask about price matching — many stores will match competitors.\n• Shop seasonal sales (back-to-school, Black Friday, end-of-season).\n\nThe 5-minute rule: If a 5-minute search can save you $10+, it's worth your time. That's like earning $120+/hour!\n\nRemember: A 'sale' isn't a deal if you didn't need the item in the first place."
  },
  {
    id: "invest-basics",
    category: "Investing",
    emoji: "🌱",
    title: "Investing Basics (Start Early!)",
    readTime: "4 min",
    content: "The single biggest advantage in investing is time — and you have more of it than anyone.\n\nWhat is investing? Putting your money to work so it grows on its own through compound interest.\n\nThe power of starting early:\n• Invest $100/month from age 16 to 26 (10 years, $12,000 total) at 8% return.\n• Stop at 26. By age 65, it's worth ~$340,000.\n• Compare: Start at 26, invest $100/month until 65 (39 years, $46,800 total). Final value: ~$340,000.\n• You invested $12K vs $47K, but ended up with the same amount — because of 10 extra years of compound growth.\n\nHow to start (with parent help):\n1. Open a custodial brokerage account.\n2. Start with index funds (like S&P 500) — low risk, steady growth.\n3. Invest consistently, don't try to time the market.\n4. Reinvest dividends automatically.\n\nKey rule: Only invest money you won't need for 5+ years. Short-term money stays in savings."
  },
];

const CATEGORIES = ["All", "Budgeting", "Saving", "Earning", "Smart Spending", "Investing"];

export default function Learn() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("All");
  const [completedLessons, setCompletedLessons] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      setCompletedLessons(u?.completed_lessons || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleComplete = async (lessonId) => {
    if (completedLessons.includes(lessonId)) return;
    const newCompleted = [...completedLessons, lessonId];
    setCompletedLessons(newCompleted);
    const newXp = (user?.xp_points || 0) + getXpReward("survey"); // 50 XP per lesson
    await base44.auth.updateMe({ completed_lessons: newCompleted, xp_points: newXp, level: getLevelFromXp(newXp) });
    setUser({ ...user, xp_points: newXp, level: getLevelFromXp(newXp) });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/10 border-t-[#00F5A0] rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = filter === "All" ? LESSONS : LESSONS.filter(l => l.category === filter);
  const completedCount = completedLessons.length;

  return (
    <AppLayout user={user}>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
          <BookOpen size={28} className="text-[#00F5A0]" /> Learning Center
        </h1>
        <p className="text-sm text-white/50 mt-1">Level up your money skills. {completedCount}/{LESSONS.length} lessons completed.</p>
      </div>

      {/* Progress */}
      <div className="rounded-2xl p-4 bg-gradient-to-br from-[#15263F] to-[#1B2D4A] border border-[#00F5A0]/20 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-[#00F5A0]" />
            <span className="text-sm font-bold text-white">Your Learning Progress</span>
          </div>
          <span className="text-sm font-bold text-[#00F5A0]">{completedCount}/{LESSONS.length}</span>
        </div>
        <div className="h-2.5 bg-[#0D1B2A] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#00F5A0] to-[#39d353] rounded-full transition-all duration-500" style={{ width: `${(completedCount / LESSONS.length) * 100}%` }} />
        </div>
        <p className="text-xs text-white/40 mt-2">Earn +50 XP per lesson completed!</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              filter === cat ? "bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/30" : "bg-[#15263F] text-white/40 border border-white/5 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Lessons */}
      <div className="space-y-3">
        {filtered.map((lesson) => {
          const isExpanded = expanded === lesson.id;
          const isCompleted = completedLessons.includes(lesson.id);
          return (
            <div key={lesson.id} className={`rounded-2xl border transition-colors ${isCompleted ? "bg-[#00F5A0]/5 border-[#00F5A0]/20" : "bg-[#15263F] border-white/5"}`}>
              <button
                onClick={() => setExpanded(isExpanded ? null : lesson.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">{lesson.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{lesson.title}</p>
                  <p className="text-xs text-white/40 flex items-center gap-2 mt-0.5">
                    <span className="px-2 py-0.5 rounded bg-white/5">{lesson.category}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {lesson.readTime}</span>
                  </p>
                </div>
                {isCompleted && <CheckCircle2 size={18} className="text-[#00F5A0] flex-shrink-0" />}
                <ChevronDown size={18} className={`text-white/40 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 animate-fade-in">
                  <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap mb-3">{lesson.content}</p>
                  {!isCompleted ? (
                    <button
                      onClick={() => handleComplete(lesson.id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-bold text-sm hover:scale-105 transition-transform"
                    >
                      Mark as Complete (+50 XP)
                    </button>
                  ) : (
                    <p className="text-xs text-[#00F5A0] font-bold flex items-center gap-1"><CheckCircle2 size={14} /> Lesson completed!</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}