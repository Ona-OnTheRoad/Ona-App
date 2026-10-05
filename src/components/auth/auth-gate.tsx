"use client";

import { usePathname } from "next/navigation";
import { BRAND_COPPER } from "@/components/auth/brand-hero-motion";
import { isPublicPath } from "@/lib/routes";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { isWelcomeRoute } from "./auth-gate/boot-routes";
import { SplashLayer, WelcomeLayer } from "./auth-gate/gate-layers";
import { useAuthGateBoot } from "./auth-gate/use-auth-gate-boot";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  const pathname = usePathname();
  const { phase, splashExiting, entryExiting, finishEntry } = useAuthGateBoot();

  const frame = "relative flex h-full min-h-0 w-full flex-col overflow-hidden";

  const welcomeUi = (animateIn: boolean) => (
    <WelcomeLayer
      animateIn={animateIn}
      entryExiting={entryExiting}
      finishEntry={finishEntry}
    />
  );

  const splashLayer = <SplashLayer splashExiting={splashExiting} />;

  // --- Guest: never show empty /login shell (that reads as a white screen) ---
  if (!isAuthenticated) {
    if (phase === "loading" || phase === "handoff") {
      return (
        <div className={cn(frame)} style={{ backgroundColor: BRAND_COPPER }}>
          {phase === "handoff" ? (
            <div className="absolute inset-0 z-10 overflow-hidden om-intro-welcome-layer">
              {welcomeUi(true)}
            </div>
          ) : null}
          {splashLayer}
        </div>
      );
    }

    // Welcome routes OR still in entry → brand welcome (Log In / Sign Up)
    if (phase === "entry" || isWelcomeRoute(pathname)) {
      return (
        <div className={cn(frame)} style={{ backgroundColor: BRAND_COPPER }}>
          {welcomeUi(true)}
        </div>
      );
    }

    // Auth forms (signin/role/signup) or other public paths
    if (isPublicPath(pathname)) {
      return (
        <div
          className={cn(frame, "bg-[#c8c9cd]")}
          style={{ backgroundColor: "#c8c9cd" }}
        >
          {children}
        </div>
      );
    }

    // Protected while guest welcome while redirecting
    return (
      <div className={cn(frame)} style={{ backgroundColor: BRAND_COPPER }}>
        {welcomeUi(false)}
      </div>
    );
  }

  // --- Signed in ---
  if (phase === "loading" || phase === "handoff") {
    return (
      <div className={cn(frame)} style={{ backgroundColor: BRAND_COPPER }}>
        {splashLayer}
      </div>
    );
  }

  // Bank force is a lower panel on dashboard/home (BankForcePanel) not a hard block
  return (
    <div
      className={cn(frame)}
      style={{
        backgroundColor: "#c8c9cd",
      }}
    >
      {children}
    </div>
  );
}
