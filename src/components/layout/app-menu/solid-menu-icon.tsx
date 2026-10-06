import type { MenuIconName } from "./menu-nav";

/**
 * Solid orange icons built with DIVs (not SVG).
 * SVG stroke/fill CSS kept fighting us; these cannot render as hollow outlines.
 */
export function SolidMenuIcon({
  name,
  isLight,
}: {
  name: MenuIconName;
  isLight: boolean;
}) {
  const cls = "h-5 w-5 shrink-0 text-[#FF6B35]";
  const bgCol = isLight ? "#c8c9cd" : "#000000";
  switch (name) {
    case "dashboard":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="#FF6B35" aria-hidden>
          <rect x="3" y="3" width="8" height="8" rx="2" fill="#FF6B35" />
          <rect x="13" y="3" width="8" height="8" rx="2" fill="#FF6B35" />
          <rect x="3" y="13" width="8" height="8" rx="2" fill="#FF6B35" />
          <rect x="13" y="13" width="8" height="8" rx="2" fill="#FF6B35" />
        </svg>
      );
    case "history":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="11" fill="#FF6B35" />
          <path
            d="M12 7v5l3.5 2.1"
            stroke={bgCol}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "profile":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="#FF6B35" aria-hidden>
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      );
    case "referral":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="#FF6B35" aria-hidden>
          <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.89-2-2-2zm-11-1c0-.55.45-1 1-1s1 .45 1 1-.45 1-1 1-1-.45-1-1zm6 0c0-.55.45-1 1-1s1 .45 1 1-.45 1-1 1-1-.45-1-1zm4 12H4v-2h16v2zm0-4H4v-2h16v2z" />
        </svg>
      );
    case "settings":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="#FF6B35" aria-hidden>
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.44.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.04.64.09.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
        </svg>
      );
    case "jobs":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="#FF6B35" aria-hidden>
          <path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4zm10 15H4V8h16v11z" />
        </svg>
      );
    case "payments":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="#FF6B35" aria-hidden>
          <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
        </svg>
      );
    case "notifications":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="#FF6B35" aria-hidden>
          <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V10a6 6 0 1 0-12 0v6l-2 2v1h16v-1l-2-2z" />
        </svg>
      );
    case "service":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="#FF6B35" aria-hidden>
          <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.5 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
        </svg>
      );
    case "shop":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="#FF6B35" aria-hidden>
          <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.16 14.26l.03-.12L8.1 12h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 20 3H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 14.37 5.48 16 7 16h12v-2H7.42c-.14 0-.25-.11-.26-.24z" />
        </svg>
      );
    case "express":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="#FF6B35" aria-hidden>
          <path d="M13 2L3 14h7v8l10-12h-7z" />
        </svg>
      );
    default:
      return null;
  }
}
