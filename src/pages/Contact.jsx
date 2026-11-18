import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { ArrowLeft, Mail, MessageSquare, Send } from "lucide-react";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setName("");
    setEmail("");
    setMessage("");
  };

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
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
          Get in <span className="text-[#39d353]">Touch</span>
        </h1>
        <p className="text-white/60 mb-10 text-base sm:text-lg">
          Have a question, suggestion, or just want to say hi? We'd love to hear from you.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Methods */}
          <div className="space-y-4">
            <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/10">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00F5A0]/20 to-[#39d353]/10 flex items-center justify-center text-[#00F5A0] mb-3">
                <Mail size={22} />
              </div>
              <h3 className="font-bold text-white text-sm mb-1">Email Us</h3>
              <p className="text-xs text-white/50 mb-2">For support, feedback, or partnerships.</p>
              <a
                href="mailto:hello@moneymode.app"
                className="text-sm font-bold text-[#39d353] hover:underline"
              >
                hello@moneymode.app
              </a>
            </div>

            <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/10">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00F5A0]/20 to-[#39d353]/10 flex items-center justify-center text-[#00F5A0] mb-3">
                <MessageSquare size={22} />
              </div>
              <h3 className="font-bold text-white text-sm mb-1">Community</h3>
              <p className="text-xs text-white/50">
                Join the conversation and connect with other savers on social media.
              </p>
              <div className="flex gap-3 mt-2">
                <a href="#" className="text-sm font-bold text-[#39d353] hover:underline">Instagram</a>
                <a href="#" className="text-sm font-bold text-[#39d353] hover:underline">TikTok</a>
                <a href="#" className="text-sm font-bold text-[#39d353] hover:underline">X</a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/10">
            <h3 className="font-bold text-white text-sm mb-4">Send a Message</h3>
            {sent ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-[#00F5A0]/20 flex items-center justify-center text-[#00F5A0] mx-auto mb-3">
                  <Send size={24} />
                </div>
                <p className="text-sm font-bold text-white">Message sent!</p>
                <p className="text-xs text-white/50 mt-1">We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full px-4 py-3 bg-[#0D1B2A] rounded-xl text-white text-sm border border-white/10 focus:border-[#39d353] focus:outline-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                  className="w-full px-4 py-3 bg-[#0D1B2A] rounded-xl text-white text-sm border border-white/10 focus:border-[#39d353] focus:outline-none"
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Your message"
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-[#0D1B2A] rounded-xl text-white text-sm border border-white/10 focus:border-[#39d353] focus:outline-none resize-none"
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#39d353] text-[#0D1B2A] font-extrabold text-sm hover:scale-[1.02] transition-transform"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}