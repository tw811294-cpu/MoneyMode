import { useNavigate } from "react-router-dom";

export default function EmptyState({ emoji = "✨", title, message, actionLabel, actionTo, onAction }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-5xl mb-4">{emoji}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-white/50 max-w-sm mb-6">{message}</p>
      {actionLabel && (actionTo || onAction) && (
        <button
          onClick={() => onAction ? onAction() : navigate(actionTo)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-bold hover:scale-105 transition-transform"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}