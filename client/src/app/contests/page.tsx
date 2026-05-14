"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ContestRanking, ContestEntry } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";

interface ContestData {
  ranking: ContestRanking | null;
  attended_count: number;
  rating_graph: { contest: string; rating: number; timestamp: number }[];
  history: ContestEntry[];
}

interface UpcomingContest {
  title: string;
  titleSlug: string;
  startTime: number;
  duration: number;
}

function RatingChart({ data }: { data: { contest: string; rating: number }[] }) {
  if (data.length < 2) return <p className="text-xs text-[#5a5a5a] py-4 text-center">Not enough data yet</p>;
  const ratings = data.map((d) => d.rating);
  const min = Math.min(...ratings) - 50;
  const max = Math.max(...ratings) + 50;
  const w = 600, h = 120;
  const points = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d.rating - min) / (max - min)) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 120 }} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="#ffa116" strokeWidth="1.5" />
      <polygon points={`${points} ${w},${h} 0,${h}`} fill="rgba(255,161,22,0.06)" />
    </svg>
  );
}

function countdown(startTime: number) {
  const diff = startTime * 1000 - Date.now();
  if (diff <= 0) return "Live";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function ContestsPage() {
  const [data, setData] = useState<ContestData | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingContest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<ContestData>("/contests/history"),
      api.get<UpcomingContest[]>("/contests/upcoming"),
    ]).then(([h, u]) => {
      setData(h.data);
      setUpcoming(u.data.slice(0, 5));
      setLoading(false);
    }).catch((e: unknown) => {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || "Failed to load contest data");
      setLoading(false);
    });
  }, []);

  const r = data?.ranking;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-base font-medium text-[#eff1f6]">Contests</h1>
        <p className="text-xs text-[#8a8a8a] mt-0.5">LeetCode contest history and upcoming</p>
      </div>

      {error && <p className="text-xs text-[#ff375f] bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">{error}</p>}

      <div className="grid grid-cols-4 gap-3">
        {loading ? Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4 space-y-3">
            <Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-12" />
          </div>
        )) : (
          [
            { label: "Rating", value: r?.rating ? Math.round(r.rating) : "—", color: "text-[#ffa116]" },
            { label: "Global rank", value: r?.globalRanking?.toLocaleString() ?? "—", color: "text-[#eff1f6]" },
            { label: "Contests", value: data?.attended_count ?? "—", color: "text-[#eff1f6]" },
            { label: "Top", value: r?.topPercentage ? `${r.topPercentage.toFixed(1)}%` : "—", color: "text-[#ffc01e]" },
          ].map((s) => (
            <div key={s.label} className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#8a8a8a] mb-1.5">{s.label}</p>
              <p className={`text-2xl font-medium ${s.color}`}>{s.value}</p>
            </div>
          ))
        )}
      </div>

      {!loading && (data?.rating_graph?.length ?? 0) > 0 && (
        <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-wider text-[#8a8a8a] mb-3">Rating over time</p>
          <RatingChart data={data!.rating_graph} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-wider text-[#8a8a8a] mb-3">Recent contests</p>
          {loading ? <div className="space-y-2">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          : data?.history.length === 0 ? <p className="text-xs text-[#5a5a5a] py-4 text-center">No contest history</p>
          : data?.history.slice(0, 8).map((c, i) => {
            const prev = data.history[i + 1];
            const delta = prev ? Math.round(c.rating - prev.rating) : null;
            return (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-[#2e2e2e] last:border-0">
                <div>
                  <p className="text-xs text-[#eff1f6]">{c.contest.title}</p>
                  <p className="text-[10px] text-[#8a8a8a]">{c.problemsSolved}/{c.totalProblems} solved · rank {c.ranking?.toLocaleString()}</p>
                </div>
                {delta !== null && <span className={`text-xs font-medium ${delta >= 0 ? "text-[#00b8a3]" : "text-[#ff375f]"}`}>{delta >= 0 ? "+" : ""}{delta}</span>}
              </div>
            );
          })}
        </div>

        <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-wider text-[#8a8a8a] mb-3">Upcoming</p>
          {loading ? <div className="space-y-2">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          : upcoming.length === 0 ? <p className="text-xs text-[#5a5a5a] py-4 text-center">No upcoming contests</p>
          : upcoming.map((c) => (
            <div key={c.titleSlug} className="flex items-center justify-between py-2.5 border-b border-[#2e2e2e] last:border-0">
              <div>
                <a href={`https://leetcode.com/contest/${c.titleSlug}`} target="_blank" rel="noreferrer" className="text-xs text-[#eff1f6] hover:text-[#ffa116] transition-colors">{c.title}</a>
                <p className="text-[10px] text-[#8a8a8a]">{Math.round(c.duration / 60)} min</p>
              </div>
              <span className="text-[10px] text-[#ffa116]">{countdown(c.startTime)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}