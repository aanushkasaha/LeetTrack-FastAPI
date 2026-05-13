"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    leetcode_handle: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      document.cookie = `access_token=${data.access_token}; path=/`;
      const me = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      setAuth(me.data, data.access_token, data.refresh_token);
      router.push("/dashboard");
    } catch (err: unknown) {
  const e = err as { response?: { data?: { detail?: string } } };
  setError(e.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
      <div className="w-[380px] bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-9">
        <div className="mb-1 text-2xl font-medium">
          <span className="text-[#ffa116]">Leet</span>
          <span className="text-[#eff1f6]">Track</span>
        </div>
        <p className="text-sm text-[#8a8a8a] mb-8">Create your account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-[#8a8a8a] mb-1.5">Username</label>
            <input
              type="text"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-md px-3 py-2 text-sm text-[#eff1f6] outline-none focus:border-[#ffa116] transition-colors"
              placeholder="aanushka"
            />
          </div>
          <div>
            <label className="block text-xs text-[#8a8a8a] mb-1.5">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-md px-3 py-2 text-sm text-[#eff1f6] outline-none focus:border-[#ffa116] transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs text-[#8a8a8a] mb-1.5">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-md px-3 py-2 text-sm text-[#eff1f6] outline-none focus:border-[#ffa116] transition-colors"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-xs text-[#8a8a8a] mb-1.5">
              LeetCode handle <span className="text-[#5a5a5a]">(optional)</span>
            </label>
            <input
              type="text"
              value={form.leetcode_handle}
              onChange={(e) => setForm({ ...form, leetcode_handle: e.target.value })}
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-md px-3 py-2 text-sm text-[#eff1f6] outline-none focus:border-[#ffa116] transition-colors"
              placeholder="aanushka_saha"
            />
          </div>

          {error && <p className="text-xs text-[#ff375f]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full bg-[#ffa116] text-[#1a1a1a] font-medium text-sm py-2.5 rounded-md hover:bg-[#e8900f] transition-colors disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-xs text-[#8a8a8a] mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-[#ffa116] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}