"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Info, MapPin, Mic } from "lucide-react";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { PrivacyScreenHeader } from "./privacy-screen-header";

type PermState = "granted" | "denied" | "prompt" | "unsupported" | "unknown";

function formatStatus(s: PermState): string {
  switch (s) {
    case "granted":
      return "Allowed";
    case "denied":
      return "Blocked";
    case "prompt":
      return "Not decided";
    case "unsupported":
      return "Not available";
    default:
      return "Not decided";
  }
}

async function queryPerm(
  name: PermissionName | "camera" | "microphone" | "geolocation",
): Promise<PermState> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return "unknown";
  }
  try {
    const result = await navigator.permissions.query({
      name: name as PermissionName,
    });
    const st = result.state;
    if (st === "granted" || st === "denied" || st === "prompt") return st;
    return "unknown";
  } catch {
    return "unsupported";
  }
}

export function AppPermissionsScreen() {
  const router = useRouter();
  const { accountType } = useApp();

  const [geo, setGeo] = useState<PermState>("prompt");
  const [cam, setCam] = useState<PermState>("prompt");
  const [mic, setMic] = useState<PermState>("prompt");
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [g, c, m] = await Promise.all([
      queryPerm("geolocation"),
      queryPerm("camera"),
      queryPerm("microphone"),
    ]);
    setGeo(g === "unsupported" ? "prompt" : g);
    setCam(c === "unsupported" ? "prompt" : c);
    setMic(m === "unsupported" ? "prompt" : m);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function requestLocation() {
    setBusy("geolocation");
    try {
      await new Promise<void>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          () => resolve(),
          (e) => reject(e),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
      });
    } catch {
      /* handled by browser */
    } finally {
      setBusy(null);
      await refresh();
    }
  }

  async function requestCamera() {
    setBusy("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      /* handled by browser */
    } finally {
      setBusy(null);
      await refresh();
    }
  }

  async function requestMic() {
    setBusy("microphone");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      /* handled by browser */
    } finally {
      setBusy(null);
      await refresh();
    }
  }

  const handleBack = () => {
    navigateBack(router, "/settings/sections/privacy", accountType);
  };

  const permissions = [
    {
      id: "geolocation",
      icon: MapPin,
      title: "Location",
      detail: "Find nearby pros and share job pin with your",
      state: geo,
      onRequest: requestLocation,
    },
    {
      id: "camera",
      icon: Camera,
      title: "Camera",
      detail: "ID upload and vehicle / problem photos",
      state: cam,
      onRequest: requestCamera,
    },
    {
      id: "microphone",
      icon: Mic,
      title: "Microphone",
      detail: "In-app voice calls with your pro",
      state: mic,
      onRequest: requestMic,
    },
  ];

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20 space-y-4">
        <PrivacyScreenHeader
          title="App permissions"
          description="Ona only uses these when you use maps, verification, photos, or calls. You can change access anytime in browser or phone settings."
          onBack={handleBack}
        />

        {/* Permissions List Card */}
        <div className="rounded-ona-card border border-ona-border bg-ona-surface shadow-xs divide-y divide-ona-border overflow-hidden">
          {permissions.map((item) => {
            const Icon = item.icon;
            const isGranted = item.state === "granted";
            const isBusy = busy === item.id;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1 pr-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ona-ctl border border-ona-border bg-ona-field text-ona-muted mt-0.5">
                    <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-ona-ink">
                      {item.title}
                    </p>
                    <p className="text-[11px] font-normal text-ona-muted mt-0.5 leading-snug">
                      {item.detail}
                    </p>
                    <p className="text-[11px] font-normal text-ona-muted mt-0.5">
                      {formatStatus(item.state)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isGranted || isBusy}
                  onClick={item.onRequest}
                  className={`h-8 px-4 rounded-full font-medium text-[12px] shrink-0 transition-all ${
                    isGranted
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
                      : "bg-brand text-white hover:opacity-90 active:scale-95 cursor-pointer disabled:opacity-50"
                  }`}
                >
                  {isBusy ? "..." : isGranted ? "Allowed" : "Allow"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Info Callout Card */}
        <div className="rounded-ona-card border border-ona-border bg-ona-field p-4 flex items-start gap-3 shadow-xs">
          <Info className="h-5 w-5 text-ona-ink shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-[12px] font-normal text-ona-ink leading-relaxed">
            If a permission stays blocked, open your browser site settings (or iOS
            / Android app settings) and enable access for this site, then return
            here and tap Allow again.
          </p>
        </div>
      </div>
    </div>
  );
}
