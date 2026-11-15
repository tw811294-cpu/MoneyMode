import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { ArrowLeft } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Top Nav */}
      <nav className="px-4 sm:px-8 py-5 border-b border-white/5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={32} showText={false} />
            <span className="text-lg font-extrabold tracking-tight">
              <span className="text-white">MONEY</span>
              <span className="text-[#39d353]">MODE</span>
            </span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <section className="max-w-3xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
          About <span className="text-[#39d353]">MoneyMode</span>
        </h1>

        <div className="space-y-5 text-white/70 leading-relaxed text-base sm:text-lg">
          <p>
            MoneyMode is a personal finance app built specifically for teens who want to take
            control of their money early. We believe that financial literacy shouldn't wait until
            adulthood — the habits you build now shape the rest of your life. That's why we created
            a tool that makes tracking income and expenses simple, visual, and even fun.
          </p>
          <p>
            With MoneyMode, you can log every dollar that comes in or goes out, set savings goals
            and watch your progress bars fill up in real time, and split your income between your
            available balance and your savings targets with just a few taps. Our visual reports
            break down your spending by category and show trends over time, so you can see exactly
            where your money is going each month. Weekly check-in surveys keep you engaged and help
            you build streaks that reinforce good financial habits.
          </p>
          <p>
            MoneyMode is designed for teenagers, students, and young people who are starting to
            earn their own money — whether through allowances, part-time jobs, or gifts. Parents can
            also stay involved through a secure read-only parent view, letting them monitor their
            teen's progress with a simple access code. It's a collaborative way to learn money
            management together.
          </p>
          <p>
            MoneyMode is built by a small, passionate team of developers and educators who care
            deeply about making financial education accessible to everyone. We're constantly
            improving the app based on feedback from our community of young savers. Our mission is
            simple: turn teens into financial pros, one transaction at a time.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/contact"
            className="px-6 py-3 rounded-xl text-sm font-extrabold bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] hover:scale-105 transition-transform"
          >
            Contact Us
          </Link>
          <Link
            to="/"
            className="px-6 py-3 rounded-xl text-sm font-bold border border-white/20 text-white/80 hover:bg-white/5 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}