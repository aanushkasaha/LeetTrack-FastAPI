"use client";

import { useState } from "react";
import api from "@/lib/api";

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

export default function AddProblemModal({ onClose, onAdded }: Props) {
  const [form, setForm] = useState({
    leetcode_id: "",
    title: "",
    slug: "",
    difficulty: "Easy",
    status: "Solved",
    topics: "",
    notes: "",
    approach: "",
    revisit_flag: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.leetcode_id || !form.title || !form.slug) {
      setError("ID, title and slug are required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post("/problems", {
        leetcode_id: parseInt(form.leetcode_id),
        title: form.title,
        slug: form.slug,
        difficulty: form.difficulty,
        status: form.status,
        topics: form.topics ? form.topics.split(",").map((t) => t.trim()).filter(Boolean) : [],
        notes: form.notes || null,
        approach: form.approach || null,
        revisit_flag: form.revisit_flag,
      });
      onAdded();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || "Failed to add problem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[480px] bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-[#eff1f6]">Add problem</h2>
          <button onClick={onClose} className="text-[#8a8a8a] hover:text-[#eff1f6] text-lg leading-none">×</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#8a8a8a] mb-1.5">LeetCode ID *</label>
            <input type="number" value={form.leetcode_id} onChange={(e) => set("leetcode_id", e.target.value)} className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-md px-3 py-2 text-xs text-[#eff1f6] outline-none focus:border-[#ffa116]" placeholder="1" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#8a8a8a] mb-1.5">Slug *</label>
            <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-md px-3 py-2 text-xs text-[#eff1f6] outline-none focus:border-[#ffa116]" placeholder="two-sum" />
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-[#8a8a8a] mb-1.5">Title *</label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-md px-3 py-2 text-xs text-[#eff1f6] outline-none focus:border-[#ffa116]" placeholder="Two Sum" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#8a8a8a] mb-1.5">Difficulty</label>
            <select value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)} className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-md px-3 py-2 text-xs text-[#eff1f6] outline-none focus:border-[#ffa116]">
              <option>Easy</option><option>Medium</option><option>Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#8a8a8a] mb-1.5">Status</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-md px-3 py-2 text-xs text-[#eff1f6] outline-none focus:border-[#ffa116]">
              <option>Solved</option><option>Attempted</option><option>Revisit</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-[#8a8a8a] mb-1.5">Topics <span className="text-[#5a5a5a]">(comma separated)</span></label>
          <input value={form.topics} onChange={(e) => set("topics", e.target.value)} className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-md px-3 py-2 text-xs text-[#eff1f6] outline-none focus:border-[#ffa116]" placeholder="Arrays, Hash Map" />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-[#8a8a8a] mb-1.5">Notes</label>
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-md px-3 py-2 text-xs text-[#eff1f6] outline-none focus:border-[#ffa116] resize-none" placeholder="Key insight..." />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-[#8a8a8a] mb-1.5">Approach</label>
          <textarea value={form.approach} onChange={(e) => set("approach", e.target.value)} rows={2} className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-md px-3 py-2 text-xs text-[#eff1f6] outline-none focus:border-[#ffa116] resize-none" placeholder="Two pointer, O(n)..." />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.revisit_flag} onChange={(e) => set("revisit_flag", e.target.checked)} className="accent-[#ffa116]" />
          <span className="text-xs text-[#8a8a8a]">Flag for revisit</span>
        </label>

        {error && <p className="text-xs text-[#ff375f]">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 text-xs border border-[#3a3a3a] text-[#8a8a8a] py-2 rounded-md hover:text-[#eff1f6] transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 text-xs bg-[#ffa116] text-[#1a1a1a] font-medium py-2 rounded-md hover:bg-[#e8900f] transition-colors disabled:opacity-60">
            {loading ? "Adding..." : "Add problem"}
          </button>
        </div>
      </div>
    </div>
  );
}