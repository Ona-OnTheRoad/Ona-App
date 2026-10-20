"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { toastError, toastSuccess } from "@/lib/toast";
import { SecurityScreenHeader } from "../security-screen-header";
import { SessionItemRow, type SessionRowData } from "./session-item-row";

export function SessionsScreen() {
  const router = useRouter();
  const { backendUserId, isAuthenticated, accountType } = useApp();

  const [sessions, setSessions] = useState<SessionRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleBack = () => {
    navigateBack(router, "/settings/sections/security", accountType);
  };

  const load = useCallback(async () => {
    if (!backendUserId) {
      setSessions([]);
      setLoading(false);
      setErr(
        isAuthenticated ? "Account id missing" : "Sign in to manage sessions",
      );
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const { authFetch } = await import("@/lib/api-auth-headers");
      const res = await authFetch(
        `/api/sessions?userId=${encodeURIComponent(backendUserId)}`,
        { credentials: "include" },
      );
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        data?: { sessions?: SessionRowData[] };
        error?: { message?: string };
      } | null;
      if (!res.ok || json?.ok === false) {
        setErr(json?.error?.message || "Could not load sessions");
        setSessions([]);
      } else {
        setSessions(json?.data?.sessions || []);
      }
    } catch {
      setErr("Network error loading sessions");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [backendUserId, isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  // Register this browser as a connected session
  useEffect(() => {
    if (!backendUserId || !isAuthenticated) return;
    const key = `ona-session-reg:${backendUserId}`;
    try {
      if (sessionStorage.getItem(key) === "1") return;
    } catch {
      /* ignore */
    }
    void import("@/lib/api-auth-headers")
      .then(({ authFetch }) =>
        authFetch("/api/sessions", {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({
            userId: backendUserId,
            deviceLabel: "This browser",
            userAgent:
              typeof navigator !== "undefined"
                ? navigator.userAgent
                : undefined,
          }),
        }),
      )
      .then(() => {
        try {
          sessionStorage.setItem(key, "1");
        } catch {
          /* ignore */
        }
        void load();
      })
      .catch(() => undefined);
  }, [backendUserId, isAuthenticated, load]);

  const revoke = async (id: string) => {
    if (!backendUserId) return;
    setBusyId(id);
    try {
      const { authFetch } = await import("@/lib/api-auth-headers");
      const res = await authFetch(
        `/api/sessions?sessionId=${encodeURIComponent(id)}&userId=${encodeURIComponent(backendUserId)}`,
        { method: "DELETE", credentials: "include" },
      );
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: { message?: string };
      } | null;
      if (!res.ok || json?.ok === false) {
        toastError(json?.error?.message || "Could not sign out device");
      } else {
        toastSuccess("Device signed out");
        setSessions((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      toastError("Network error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20 space-y-4">
        <SecurityScreenHeader
          title="Login sessions & devices"
          description="Review browsers and phones using your account. Sign out any device you don't recognise."
          onBack={handleBack}
        />

        <div className="border-t border-ona-border pt-1">
          {err ? (
            <p className="py-6 text-center text-[13px] font-semibold text-red-500">
              {err}
            </p>
          ) : null}

          {loading && sessions.length === 0 ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center text-ona-muted">
              <p className="text-[14px] font-medium">No active sessions found.</p>
            </div>
          ) : (
            <div>
              {sessions.map((session) => (
                <SessionItemRow
                  key={session.id}
                  session={session}
                  isBusy={busyId === session.id}
                  onSignOut={revoke}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
