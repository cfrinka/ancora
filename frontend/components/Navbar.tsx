"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LogOut } from "lucide-react";

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
    <header className="sticky top-0 z-30 bg-canvas border-b border-warm-200">
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-olive">
            Âncora
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-ink leading-tight">{user.full_name}</p>
              <p className="text-[11px] text-warm-500 tracking-wide uppercase mt-0.5">
                {roleLabel[user.role]}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-warm-400 hover:text-ink transition-colors duration-150"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
