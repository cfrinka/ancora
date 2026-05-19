"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { login } from "@/lib/api";
import { AuthResponse } from "@/types";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password) as AuthResponse;
      await refresh();
      const role = res.user.role;
      if (role === "patient") router.push("/patient");
      else if (role === "therapist") router.push("/therapist");
      else if (role === "admin") router.push("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">

        {/* Brand mark */}
        <div className="text-center mb-12">
          <span className="text-[11px] font-semibold tracking-[0.26em] uppercase text-olive">
            Âncora
          </span>
          <p className="text-warm-400 text-sm mt-3 font-light">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-medium tracking-widest uppercase text-warm-500 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-canvas border border-warm-300 rounded-card text-sm text-ink placeholder:text-warm-400 focus:outline-none focus:border-olive transition-colors duration-150"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium tracking-widest uppercase text-warm-500 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-11 bg-canvas border border-warm-300 rounded-card text-sm text-ink placeholder:text-warm-400 focus:outline-none focus:border-olive transition-colors duration-150"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-ink transition-colors duration-150"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

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
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
