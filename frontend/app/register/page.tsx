"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { register, getPublicTherapists } from "@/lib/api";
import { AuthResponse } from "@/types";
import { Eye, EyeOff } from "lucide-react";

type Therapist = { id: string; full_name: string };

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const { t } = useI18n();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"therapist" | "patient">("patient");
  const [therapistId, setTherapistId] = useState("");
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPublicTherapists()
      .then((data) => {
        if (Array.isArray(data)) setTherapists(data);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await register(
        email,
        fullName,
        password,
        role,
        role === "patient" && therapistId ? therapistId : undefined
      ) as AuthResponse;
      await refresh();
      const r = res.user.role;
      if (r === "patient") router.push("/patient");
      else if (r === "therapist") router.push("/therapist");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">

        {/* Brand mark */}
        <div className="text-center mb-10">
          <span className="text-[11px] font-semibold tracking-[0.26em] uppercase text-olive">
            {t.common.brand}
          </span>
          <p className="text-warm-400 text-sm mt-3 font-light">
            {t.register.subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Full name */}
          <div>
            <label className="block text-[11px] font-medium tracking-widest uppercase text-warm-500 mb-2">
              {t.register.fullNameLabel}
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-canvas border border-warm-300 rounded-card text-sm text-ink placeholder:text-warm-400 focus:outline-none focus:border-olive transition-colors duration-150"
              placeholder={t.register.fullNamePlaceholder}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-medium tracking-widest uppercase text-warm-500 mb-2">
              {t.register.emailLabel}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-canvas border border-warm-300 rounded-card text-sm text-ink placeholder:text-warm-400 focus:outline-none focus:border-olive transition-colors duration-150"
              placeholder={t.register.emailPlaceholder}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-medium tracking-widest uppercase text-warm-500 mb-2">
              {t.register.passwordLabel}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-11 bg-canvas border border-warm-300 rounded-card text-sm text-ink placeholder:text-warm-400 focus:outline-none focus:border-olive transition-colors duration-150"
                placeholder={t.register.passwordPlaceholder}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-ink transition-colors duration-150"
                aria-label={showPassword ? t.login.hidePassword : t.login.showPassword}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-[11px] font-medium tracking-widest uppercase text-warm-500 mb-2">
              {t.register.roleLabel}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["therapist", "patient"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2.5 text-sm font-medium rounded-card border transition-all duration-150 ${
                    role === r
                      ? "bg-olive text-canvas border-olive"
                      : "bg-canvas text-warm-500 border-warm-300 hover:border-olive hover:text-ink"
                  }`}
                >
                  {r === "therapist" ? t.register.roleTherapist : t.register.rolePatient}
                </button>
              ))}
            </div>
          </div>

          {/* Therapist selector — only for patients */}
          {role === "patient" && therapists.length > 0 && (
            <div>
              <label className="block text-[11px] font-medium tracking-widest uppercase text-warm-500 mb-2">
                {t.register.therapistLabel}
              </label>
              <select
                value={therapistId}
                onChange={(e) => setTherapistId(e.target.value)}
                className="w-full px-4 py-3 bg-canvas border border-warm-300 rounded-card text-sm text-ink focus:outline-none focus:border-olive transition-colors duration-150"
              >
                <option value="">{t.register.therapistPlaceholder}</option>
                {therapists.map((th) => (
                  <option key={th.id} value={th.id}>{th.full_name}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="text-xs text-warm-700 bg-warm-100 border border-warm-300 rounded-card px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-olive hover:bg-olive-hover disabled:opacity-50 text-canvas text-sm font-medium tracking-wide rounded-card transition-colors duration-150"
          >
            {loading ? t.register.submitting : t.register.submitBtn}
          </button>
        </form>

        <p className="text-center text-xs text-warm-400 mt-8">
          {t.register.loginLink}{" "}
          <Link href="/login" className="text-olive hover:underline font-medium">
            {t.register.signIn}
          </Link>
        </p>
      </div>
    </div>
  );
}
