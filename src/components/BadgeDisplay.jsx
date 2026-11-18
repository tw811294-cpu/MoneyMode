export default function BadgeDisplay({ badges }) {
  if (!badges || badges.length === 0) {
    return (
      <div className="rounded-2xl p-5 bg-[#15263F] border border-white/5 text-center">
        <p className="text-4xl mb-2">🏅</p>
        <p className="text-sm text-white/50">Complete surveys and reach goals to earn badges!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {badges.map((badge) => (
        <div
          key={badge.id}
          className="rounded-2xl p-4 bg-gradient-to-br from-[#1B2D4A] to-[#15263F] border border-[#00F5A0]/20 text-center hover:scale-105 transition-transform"
        >
          <div className="text-3xl mb-2">{badge.emoji}</div>
          <p className="text-sm font-bold text-white">{badge.label}</p>
          <p className="text-[10px] text-white/40 mt-1">{badge.description}</p>
        </div>
      ))}
    </div>
  );
}