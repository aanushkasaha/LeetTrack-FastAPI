import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#eff1f6]">
      <nav className="flex items-center justify-between px-10 py-5 border-b border-[#3a3a3a]">
        <div className="text-lg font-medium">
          <span className="text-[#ffa116]">Leet</span>Track
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-[#8a8a8a] hover:text-[#eff1f6] transition-colors">Sign in</Link>
          <Link href="/register" className="text-sm bg-[#ffa116] text-[#1a1a1a] font-medium px-4 py-2 rounded-md hover:bg-[#e8900f] transition-colors">Get started</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-10 pt-24 pb-16 text-center">
        <div className="inline-block text-xs font-medium bg-[#ffa116]/10 text-[#ffa116] border border-[#ffa116]/20 px-3 py-1 rounded-full mb-6">
          Personal SDE interview prep tracker
        </div>
        <h1 className="text-5xl font-semibold tracking-tight mb-5 leading-tight">
          Track your LeetCode progress.<br />
          <span className="text-[#ffa116]">Land the offer.</span>
        </h1>
        <p className="text-base text-[#8a8a8a] mb-10 max-w-xl mx-auto leading-relaxed">
          Sync your solved problems, track progress across topics, review with spaced repetition, and monitor your contest rating — all in one place.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/register" className="bg-[#ffa116] text-[#1a1a1a] font-medium px-6 py-3 rounded-md hover:bg-[#e8900f] transition-colors text-sm">
            Start tracking
          </Link>
          <Link href="/login" className="border border-[#3a3a3a] text-[#8a8a8a] hover:text-[#eff1f6] hover:border-[#5a5a5a] px-6 py-3 rounded-md transition-colors text-sm">
            Sign in
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-10 pb-24">
        <div className="grid grid-cols-4 gap-4">
          {[
            { title: "Auto sync", desc: "Pull your last 50 solved problems from LeetCode automatically" },
            { title: "Topic sheet", desc: "NeetCode 150 organized by topic with your progress overlaid" },
            { title: "Spaced repetition", desc: "SM-2 algorithm schedules problems for review at the right time" },
            { title: "Contest tracker", desc: "Rating history, delta per contest, and upcoming contest countdowns" },
          ].map((f) => (
            <div key={f.title} className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-5">
              <p className="text-sm font-medium text-[#eff1f6] mb-2">{f.title}</p>
              <p className="text-xs text-[#8a8a8a] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center pb-10 text-xs text-[#5a5a5a]">
        Built with FastAPI + Next.js
      </div>
    </div>
  );
}