"use client";

import { Suspense, FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toastError } from "@/lib/toast";
import { AdminSigninHero } from "@/components/admin/admin-signin-hero";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#09090b] text-gray-400 dark:text-gray-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-ona-brand" />
          Loading…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const json = await res.json();
      if (!json.ok) {
        toastError(json.error?.message || "Login failed");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      toastError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-white dark:bg-[#09090b] text-gray-900 dark:text-white flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden selection:bg-ona-brand-btn/20 selection:text-ona-brand">
      {/* Left Side: Half-width with small padding around hero card */}
      <div className="w-full lg:w-1/2 p-3 sm:p-4 lg:p-5 flex flex-col h-auto lg:h-full">
        <div className="w-full h-full min-h-[500px] lg:min-h-0 flex-1">
          <AdminSigninHero priority className="w-full h-full shadow-lg" />
        </div>
      </div>

      {/* Right Side: Other half-width, form centered */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-[420px] bg-white dark:bg-[#18171c] border border-gray-200/90 dark:border-[#27272a] rounded-2xl p-7 sm:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 dark:text-white tracking-tight mb-7">
            Staff sign in
          </h1>

          {expired ? (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-medium leading-relaxed">
              ⏳ Your session expired. Sign in again to continue (sessions remain active up to 8 hours).
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-medium text-gray-700 dark:text-[#9CA3AF] mb-2"
              >
                Your email <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center w-full px-3.5 py-3 rounded-xl bg-[#F9FAFB] dark:bg-[#121115] border border-[#E5E7EB] dark:border-[#27272a] focus-within:border-ona-brand dark:focus-within:border-ona-brand focus-within:ring-2 focus-within:ring-[#F05638]/10 transition-all">
                <Mail className="w-[18px] h-[18px] text-gray-400 dark:text-[#71717A] shrink-0 mr-3" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-transparent border-0 p-0 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#71717A] focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-gray-700 dark:text-[#9CA3AF] mb-2"
              >
                Your password <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center w-full px-3.5 py-3 rounded-xl bg-[#F9FAFB] dark:bg-[#121115] border border-[#E5E7EB] dark:border-[#27272a] focus-within:border-ona-brand dark:focus-within:border-ona-brand focus-within:ring-2 focus-within:ring-[#F05638]/10 transition-all">
                <Lock className="w-[18px] h-[18px] text-gray-400 dark:text-[#71717A] shrink-0 mr-3" />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full bg-transparent border-0 p-0 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#71717A] focus:outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="ml-2 text-gray-400 dark:text-[#71717A] hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors p-0.5"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-[18px] h-[18px]" />
                  ) : (
                    <Eye className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-ona-brand-btn hover:bg-ona-brand-press active:bg-[#C9381C] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Log in"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
