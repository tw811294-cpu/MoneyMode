import { useState } from "react";
import { X, Check } from "lucide-react";

const SCALE_OPTIONS = [
  { value: "1", label: "Not at all", emoji: "😞" },
  { value: "2", label: "Barely", emoji: "😕" },
  { value: "3", label: "Somewhat", emoji: "😐" },
  { value: "4", label: "Pretty good", emoji: "😊" },
  { value: "5", label: "Crushed it!", emoji: "🔥" },
];

const QUIZ_OPTIONS = [
  { value: "a", label: "A) Save at least 20% of it" },
  { value: "b", label: "B) Spend it all right away" },
  { value: "c", label: "C) Lend it to a friend" },
  { value: "d", label: "D) Hide it under my mattress" },
];

export function getSurveyQuestions() {
  return [
    { id: "budget", type: "scale", question: "Did you stick to your budget this week?", options: SCALE_OPTIONS },
    { id: "spending", type: "scale", question: "How mindful were you about your spending?", options: SCALE_OPTIONS },
    { id: "motivation", type: "scale", question: "How motivated do you feel about your savings goals?", options: SCALE_OPTIONS },
    { id: "learning", type: "scale", question: "Did you learn something new about money this week?", options: SCALE_OPTIONS },
    { id: "quiz", type: "quiz", question: "Quiz time! What's the smartest thing to do when you get unexpected money?", options: QUIZ_OPTIONS, correctAnswer: "a" },
    { id: "reflection", type: "text", question: "What's one money habit you want to improve next week?" },
  ];
}

export default function SurveyModal({ onComplete, onClose, streak }) {
  const questions = getSurveyQuestions();
  const [answers, setAnswers] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [textAnswer, setTextAnswer] = useState("");

  const currentQ = questions[currentStep];
  const isLast = currentStep === questions.length - 1;
  const canProceed = currentQ.type === "text" ? textAnswer.trim().length > 0 : !!answers[currentQ.id];

  const handleAnswer = (value) => {
    setAnswers({ ...answers, [currentQ.id]: value });
  };

  const handleNext = () => {
    if (currentQ.type === "text") {
      const newAnswers = { ...answers, [currentQ.id]: textAnswer };
      setAnswers(newAnswers);
      if (isLast) {
        finish(newAnswers);
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else {
      if (isLast) {
        finish(answers);
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const finish = (allAnswers) => {
    const responses = questions.map((q) => {
      let answer = allAnswers[q.id] || "";
      if (q.type === "scale") {
        const opt = q.options.find((o) => o.value === answer);
        answer = opt ? `${opt.emoji} ${opt.label}` : answer;
      } else if (q.type === "quiz") {
        const opt = q.options.find((o) => o.value === answer);
        const isCorrect = answer === q.correctAnswer;
        answer = opt ? `${opt.label} ${isCorrect ? "✅" : "❌"}` : answer;
      }
      return { question: q.question, answer };
    });
    onComplete(responses);
  };

  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#15263F] rounded-2xl w-full max-w-md p-6 border border-white/10 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-[#00F5A0] font-bold">Weekly Check-In</p>
            <h2 className="text-lg font-extrabold text-white">Question {currentStep + 1} of {questions.length}</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-[#0D1B2A] rounded-full overflow-hidden mb-6">
          <div className="h-full bg-gradient-to-r from-[#00F5A0] to-[#39d353] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <h3 className="text-base font-bold text-white mb-4">{currentQ.question}</h3>

        {currentQ.type === "scale" && (
          <div className="grid grid-cols-5 gap-2">
            {currentQ.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(opt.value)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                  answers[currentQ.id] === opt.value
                    ? "border-[#00F5A0] bg-[#00F5A0]/10 scale-105"
                    : "border-white/10 bg-[#0D1B2A] hover:border-white/20"
                }`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="text-[9px] font-semibold text-white/60 text-center leading-tight">{opt.label}</span>
              </button>
            ))}
          </div>
        )}

        {currentQ.type === "quiz" && (
          <div className="space-y-2">
            {currentQ.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(opt.value)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all font-semibold text-sm ${
                  answers[currentQ.id] === opt.value
                    ? "border-[#00F5A0] bg-[#00F5A0]/10 text-white"
                    : "border-white/10 bg-[#0D1B2A] text-white/70 hover:border-white/20"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {currentQ.type === "text" && (
          <textarea
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder="Type your answer..."
            rows={3}
            className="w-full px-4 py-3 bg-[#0D1B2A] rounded-xl text-white border border-white/10 focus:border-[#00F5A0] focus:outline-none resize-none"
          />
        )}

        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-extrabold disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
        >
          {isLast ? "Complete Survey 🔥" : "Next Question →"}
        </button>
      </div>
    </div>
  );
}