"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/topics", label: "Topics", icon: "☰" },
  { href: "/revisit", label: "Revisit queue", icon: "↻" },
  { href: "/contests", label: "Contests", icon: "⚡" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    const refresh_token = localStorage.getItem("refresh_token");
    try {
      await api.post("/auth/logout", { refresh_token });
    } catch {}
    clearAuth();
    document.cookie = "access_token=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <aside className="w-[200px] flex-shrink-0 bg-[#1e1e1e] border-r border-[#3a3a3a] flex flex-col py-4">
      <div className="px-4 pb-5 text-lg font-medium">
        <span className="text-[#ffa116]">Leet</span>
        <span className="text-[#eff1f6]">Track</span>
      </div>

      <nav className="flex flex-col flex-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm border-l-2 transition-colors ${
                active
                  ? "text-[#ffa116] bg-[#ffa116]/8 border-[#ffa116]"
                  : "text-[#8a8a8a] border-transparent hover:text-[#eff1f6] hover:bg-[#2a2a2a]"
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pt-4 border-t border-[#3a3a3a]">
        <p className="text-xs text-[#8a8a8a] truncate mb-2">{user?.username}</p>
        <button
          onClick={handleLogout}
          className="text-xs text-[#8a8a8a] hover:text-[#ff375f] transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}