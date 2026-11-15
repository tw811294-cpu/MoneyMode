export const EXPENSE_CATEGORIES = [
  { value: "food", label: "Food", emoji: "🍔", color: "#FF6B6B" },
  { value: "entertainment", label: "Entertainment", emoji: "🎮", color: "#7B2FBE" },
  { value: "clothes", label: "Clothes", emoji: "👕", color: "#4ECDC4" },
  { value: "transport", label: "Transport", emoji: "🚌", color: "#FFD93D" },
  { value: "other", label: "Other", emoji: "📦", color: "#95A5A6" },
];

export const INCOME_CATEGORIES = [
  { value: "allowance", label: "Allowance", emoji: "💵", color: "#00F5A0" },
  { value: "job", label: "Job", emoji: "💼", color: "#39d353" },
  { value: "gift", label: "Gift", emoji: "🎁", color: "#FF6B9D" },
  { value: "other", label: "Other", emoji: "✨", color: "#9ff54d" },
];

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function getCategoryInfo(categoryValue, type = "expense") {
  const list = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return list.find((c) => c.value === categoryValue) || { label: categoryValue, emoji: "📦", color: "#95A5A6" };
}

export function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthLabel(monthStr) {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function getWeeksSince(dateStr) {
  if (!dateStr) return Infinity;
  const past = new Date(dateStr);
  const now = new Date();
  const diffMs = now - past;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
}

export function getDaysSince(dateStr) {
  if (!dateStr) return Infinity;
  const past = new Date(dateStr);
  const now = new Date();
  const diffMs = now - past;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function generateShareToken() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ===== XP & Leveling =====
const XP_REWARDS = {
  transaction: 10,
  income: 15,
  expense: 10,
  survey: 50,
  goal_completed: 100,
  goal_created: 25,
  budget_created: 20,
  challenge_completed: 50,
};

export function getXpReward(action) {
  return XP_REWARDS[action] || 0;
}

export function getLevelFromXp(xp) {
  return Math.floor(xp / 100) + 1;
}

export function getXpInCurrentLevel(xp) {
  return xp % 100;
}

export function getXpForNextLevel(xp) {
  return 100 - (xp % 100);
}

export function getLevelProgress(xp) {
  return (xp % 100);
}

// ===== Financial Health Score =====
export function calculateHealthScore(transactions, goals, surveys, budgets) {
  let score = 0;
  const maxScore = 100;

  // Factor 1: Savings rate (30 points)
  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalSaved = transactions.filter(t => t.type === "income").reduce((s, t) => s + (t.savings_allocation || 0), 0);
  if (totalIncome > 0) {
    const savingsRate = totalSaved / totalIncome;
    score += Math.min(30, savingsRate * 60);
  }

  // Factor 2: Expense tracking consistency (20 points)
  const expenseCount = transactions.filter(t => t.type === "expense").length;
  score += Math.min(20, expenseCount * 2);

  // Factor 3: Goal progress (20 points)
  const activeGoals = goals.filter(g => !g.completed);
  if (goals.length > 0) {
    const avgProgress = goals.reduce((s, g) => {
      return s + (g.target_amount > 0 ? Math.min(1, (g.current_amount || 0) / g.target_amount) : 0);
    }, 0) / goals.length;
    score += avgProgress * 20;
  }

  // Factor 4: Survey streak (15 points)
  const streak = surveys.length > 0 ? (surveys[0].streak_count || 0) : 0;
  score += Math.min(15, streak * 3);

  // Factor 5: Budget adherence (15 points)
  if (budgets && budgets.length > 0) {
    const currentMonth = getCurrentMonth();
    const monthExpenses = transactions.filter(t => t.type === "expense" && t.date && t.date.startsWith(currentMonth));
    let budgetScore = 0;
    budgets.forEach(b => {
      const spent = monthExpenses.filter(t => t.category === b.category).reduce((s, t) => s + t.amount, 0);
      if (b.amount > 0 && spent <= b.amount) {
        budgetScore += 1;
      }
    });
    score += (budgetScore / budgets.length) * 15;
  }

  return Math.round(Math.min(maxScore, score));
}

export function getHealthScoreLabel(score) {
  if (score >= 80) return { label: "Excellent", color: "#00F5A0" };
  if (score >= 60) return { label: "Good", color: "#39d353" };
  if (score >= 40) return { label: "Fair", color: "#FFD93D" };
  if (score >= 20) return { label: "Needs Work", color: "#FF8C42" };
  return { label: "Getting Started", color: "#FF6B6B" };
}

// ===== Monthly Challenges =====
export function getChallengeProgress(challenge, transactions, goals, surveys, budgets) {
  const currentMonth = getCurrentMonth();
  const monthTxns = transactions.filter(t => t.date && t.date.startsWith(currentMonth));

  switch (challenge.challenge_type) {
    case "log_transactions": {
      const count = monthTxns.length;
      return { current: count, target: challenge.target_value, percent: Math.min(100, (count / challenge.target_value) * 100) };
    }
    case "save_money": {
      const saved = monthTxns.filter(t => t.type === "income").reduce((s, t) => s + (t.savings_allocation || 0), 0);
      return { current: saved, target: challenge.target_value, percent: Math.min(100, (saved / challenge.target_value) * 100) };
    }
    case "complete_survey": {
      const monthSurveys = surveys.filter(s => s.date && s.date.startsWith(currentMonth));
      return { current: monthSurveys.length, target: challenge.target_value, percent: Math.min(100, (monthSurveys.length / challenge.target_value) * 100) };
    }
    case "stay_under_budget": {
      if (!budgets || budgets.length === 0) return { current: 0, target: 1, percent: 0 };
      const underCount = budgets.filter(b => {
        const spent = monthTxns.filter(t => t.type === "expense" && t.category === b.category).reduce((s, t) => s + t.amount, 0);
        return spent <= b.amount;
      }).length;
      return { current: underCount, target: budgets.length, percent: Math.min(100, (underCount / budgets.length) * 100) };
    }
    case "create_goal": {
      const monthGoals = goals.filter(g => g.created_date && g.created_date.startsWith(currentMonth));
      return { current: monthGoals.length, target: challenge.target_value, percent: Math.min(100, (monthGoals.length / challenge.target_value) * 100) };
    }
    default:
      return { current: 0, target: 1, percent: 0 };
  }
}

export function calculateBadges(transactions, goals, surveys) {
  const badges = [];
  if (goals.some((g) => g.completed)) {
    badges.push({ id: "first_goal", label: "First Goal Reached", emoji: "🏆", description: "Completed your first savings goal" });
  }
  if (surveys.length >= 4) {
    badges.push({ id: "streak_4", label: "4-Week Streak", emoji: "🔥", description: "Completed 4 weekly surveys" });
  }
  if (transactions.filter((t) => t.type === "expense").length >= 10) {
    badges.push({ id: "tracker", label: "Active Tracker", emoji: "📊", description: "Logged 10+ expenses" });
  }
  if (transactions.filter((t) => t.type === "income").length >= 3) {
    badges.push({ id: "earner", label: "Money Maker", emoji: "💰", description: "Logged 3+ income sources" });
  }
  if (goals.length >= 3) {
    badges.push({ id: "planner", label: "Goal Setter", emoji: "🎯", description: "Created 3+ savings goals" });
  }
  if (surveys.length >= 1) {
    badges.push({ id: "first_survey", label: "First Check-In", emoji: "📝", description: "Completed your first weekly survey" });
  }
  return badges;
}

// ===== Financial Titles =====
const FINANCIAL_TITLES = [
  { title: "Money Master", emoji: "👑", minXp: 10000, color: "#FFD700" },
  { title: "Finance Expert", emoji: "⭐", minXp: 7500, color: "#9D5FDE" },
  { title: "Money Maker", emoji: "🚀", minXp: 5000, color: "#9D5FDE" },
  { title: "Financial Pro", emoji: "🏆", minXp: 3500, color: "#9D5FDE" },
  { title: "Wealth Builder", emoji: "💎", minXp: 2000, color: "#00F5A0" },
  { title: "Investor", emoji: "📈", minXp: 1000, color: "#00F5A0" },
  { title: "Goal Getter", emoji: "🎯", minXp: 500, color: "#00F5A0" },
  { title: "Budget Builder", emoji: "📊", minXp: 250, color: "#39d353" },
  { title: "Saver", emoji: "💵", minXp: 100, color: "#39d353" },
  { title: "Beginner", emoji: "🌱", minXp: 0, color: "#9ff54d" },
];

export function getFinancialTitle(xp) {
  return FINANCIAL_TITLES.find((t) => xp >= t.minXp);
}

export function getNextFinancialTitle(xp) {
  return FINANCIAL_TITLES.find((t) => xp < t.minXp);
}

// ===== All Achievements =====
export function getAllAchievements(transactions, goals, surveys, budgets, user) {
  const totalSaved = transactions.filter(t => t.type === "income").reduce((s, t) => s + (t.savings_allocation || 0), 0);
  const expenseCount = transactions.filter(t => t.type === "expense").length;
  const incomeCount = transactions.filter(t => t.type === "income").length;
  const txnCount = transactions.length;
  const streak = surveys.length > 0 ? (surveys[0].streak_count || 0) : 0;
  const completedGoals = goals.filter(g => g.completed).length;
  const level = user?.level || 1;
  const xp = user?.xp_points || 0;

  const underBudget = budgets && budgets.length > 0 && budgets.some(b => {
    const cm = getCurrentMonth();
    const spent = transactions.filter(t => t.type === "expense" && t.category === b.category && t.date && t.date.startsWith(cm)).reduce((s, t) => s + t.amount, 0);
    return spent <= b.amount;
  });

  return [
    { id: "first_txn", label: "First Steps", emoji: "👣", description: "Log your first transaction", earned: txnCount >= 1 },
    { id: "tracker_10", label: "Active Tracker", emoji: "📊", description: "Log 10 expenses", earned: expenseCount >= 10 },
    { id: "tracker_25", label: "Data Machine", emoji: "🤖", description: "Log 25 transactions", earned: txnCount >= 25 },
    { id: "tracker_50", label: "Finance Pro", emoji: "📈", description: "Log 50 transactions", earned: txnCount >= 50 },
    { id: "tracker_100", label: "Centurion", emoji: "💯", description: "Log 100 transactions", earned: txnCount >= 100 },
    { id: "earner_3", label: "Money Maker", emoji: "💰", description: "Log 3+ income sources", earned: incomeCount >= 3 },
    { id: "earner_10", label: "Hustler", emoji: "💼", description: "Log 10+ income sources", earned: incomeCount >= 10 },
    { id: "saver_50", label: "First $50 Saved", emoji: "🐷", description: "Save $50 total", earned: totalSaved >= 50 },
    { id: "saver_100", label: "Century Saver", emoji: "🏦", description: "Save $100 total", earned: totalSaved >= 100 },
    { id: "saver_500", label: "Savings Star", emoji: "⭐", description: "Save $500 total", earned: totalSaved >= 500 },
    { id: "goal_first", label: "First Goal Reached", emoji: "🏆", description: "Complete your first savings goal", earned: completedGoals >= 1 },
    { id: "goal_3", label: "Goal Getter", emoji: "🎯", description: "Complete 3 savings goals", earned: completedGoals >= 3 },
    { id: "goal_setter", label: "Planner", emoji: "📋", description: "Create 3+ savings goals", earned: goals.length >= 3 },
    { id: "survey_1", label: "First Check-In", emoji: "📝", description: "Complete your first weekly survey", earned: surveys.length >= 1 },
    { id: "streak_4", label: "4-Week Streak", emoji: "🔥", description: "Maintain a 4-week survey streak", earned: streak >= 4 },
    { id: "streak_8", label: "Unstoppable", emoji: "⚡", description: "Maintain an 8-week survey streak", earned: streak >= 8 },
    { id: "level_5", label: "Rising Star", emoji: "🌟", description: "Reach Level 5", earned: level >= 5 },
    { id: "level_10", label: "Money Master", emoji: "👑", description: "Reach Level 10", earned: level >= 10 },
    { id: "budget_keeper", label: "Budget Keeper", emoji: "🛡️", description: "Stay under budget in any category", earned: underBudget },
    { id: "xp_500", label: "XP Enthusiast", emoji: "💠", description: "Earn 500 total XP", earned: xp >= 500 },
    { id: "xp_1000", label: "XP Champion", emoji: "🔱", description: "Earn 1000 total XP", earned: xp >= 1000 },
  ];
}

// ===== Spending Forecast =====
export function calculateSpendingForecast(transactions) {
  const months = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthTxns = transactions.filter(t => t.type === "expense" && t.date && t.date.startsWith(monthStr));
    months.push({ month: monthStr, label: d.toLocaleDateString("en-US", { month: "short" }), total: monthTxns.reduce((s, t) => s + t.amount, 0), count: monthTxns.length });
  }
  const recent = months.slice(0, 3);
  const avgTotal = recent.reduce((s, m) => s + m.total, 0) / (recent.length || 1);
  const trend = months[3].total > months[0].total * 1.1 ? "increasing" : months[3].total < months[0].total * 0.9 ? "decreasing" : "stable";

  const categoryForecast = EXPENSE_CATEGORIES.map(cat => {
    const catMonths = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const ms = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      catMonths.push(transactions.filter(t => t.type === "expense" && t.category === cat.value && t.date && t.date.startsWith(ms)).reduce((s, t) => s + t.amount, 0));
    }
    const avg = (catMonths[1] + catMonths[2] + catMonths[3]) / 3;
    return { category: cat.label, value: cat.value, emoji: cat.emoji, color: cat.color, avg, months: catMonths };
  }).filter(c => c.avg > 0);

  return { months, avgTotal, trend, categoryForecast };
}

// ===== Recurring Transaction Helpers =====
export function computeNextRecurringDate(frequency, fromDate = new Date()) {
  const date = new Date(fromDate);
  switch (frequency) {
    case "weekly": date.setDate(date.getDate() + 7); break;
    case "biweekly": date.setDate(date.getDate() + 14); break;
    case "monthly": date.setMonth(date.getMonth() + 1); break;
    default: date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString().split("T")[0];
}

export function getDaysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
}