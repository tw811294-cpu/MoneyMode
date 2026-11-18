export default function Logo({ size = 100, showText = true, tagline = true, className = "" }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* M outline */}
        <path
          d="M20 82 L20 24 Q20 16 28 16 L37 16 Q43 16 45 21 L50 40 L55 21 Q57 16 63 16 L72 16 Q80 16 80 24 L80 82"
          stroke="#39d353"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Three bars inside M - centered, bar chart style */}
        <rect x="36" y="66" width="6" height="12" rx="2" fill="#39d353" />
        <rect x="47" y="58" width="6" height="20" rx="2" fill="#39d353" />
        <rect x="58" y="50" width="6" height="28" rx="2" fill="#39d353" />
        {/* Upward trend arrow - shorter, going up at an angle like a chart */}
        <path d="M34 54 L66 34" stroke="#9ff54d" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M56 32 L66 34 L62 42" stroke="#9ff54d" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      {showText && (
        <div className="mt-1 font-extrabold tracking-tight leading-none" style={{ fontSize: size * 0.28 }}>
          <span className="text-white">MONEY</span>
          <span className="text-[#39d353]"> MODE</span>
        </div>
      )}
      {tagline && showText && (
        <div className="mt-2 font-semibold tracking-[0.25em] text-[10px] sm:text-xs">
          <span className="text-white/80">TRACK IT. MANAGE IT.</span>
          <span className="text-[#39d353]"> MASTER IT.</span>
        </div>
      )}
    </div>
  );
}