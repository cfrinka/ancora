"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { logout } from "@/lib/api";
import { LogOut, Heart } from "lucide-react";

export default function Navbar() {
  const { user, logout: ctxLogout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await ctxLogout();
    router.push("/login");
  };

  const roleLabel: Record<string, string> = {
    admin: "Admin",
    therapist: "Therapist",
    patient: "Patient",
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-brand-600" />
          <span className="font-bold text-brand-700 text-lg">OnTherapy</span>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-800">{user.full_name}</p>
              <p className="text-xs text-slate-400">{roleLabel[user.role]}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
