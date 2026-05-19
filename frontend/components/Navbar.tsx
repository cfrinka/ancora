"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const { user, logout: ctxLogout } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();

  const handleLogout = async () => {
    await ctxLogout();
    router.push("/login");
  };

  const toggleLocale = () =>
    setLocale(locale === "pt-BR" ? "en" : "pt-BR");

  const roleLabel: Record<string, string> = {
    admin: t.nav.roles.admin,
    therapist: t.nav.roles.therapist,
    patient: t.nav.roles.patient,
  };

  return (
    <header className="sticky top-0 z-30 bg-canvas border-b border-warm-200">
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-olive">
            {t.common.brand}
          </span>
        </div>

        <div className="flex items-center gap-5">
          {/* Language switcher */}
          <button
            onClick={toggleLocale}
            className="text-[10px] font-semibold tracking-widest uppercase text-warm-400 hover:text-ink transition-colors duration-150"
            aria-label="Switch language"
          >
            {locale === "pt-BR" ? "EN" : "PT"}
          </button>

          {user && (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-ink leading-tight">{user.full_name}</p>
                <p className="text-[11px] text-warm-500 tracking-wide uppercase mt-0.5">
                  {roleLabel[user.role] ?? user.role}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-warm-400 hover:text-ink transition-colors duration-150"
                aria-label={t.common.signOut}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
