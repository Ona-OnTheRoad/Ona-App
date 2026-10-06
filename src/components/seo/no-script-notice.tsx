import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

/**
 * Shown only when JavaScript is off or blocked (some data-saver proxies and Opera Mini do this).
 * Gives people and crawlers a real page with a heading, the product description and the public
 * links instead of a blank screen.
 */
export function NoScriptNotice() {
  return (
    <noscript>
      <div
        style={{
          padding: "24px 16px",
          maxWidth: 480,
          margin: "0 auto",
          fontFamily: "system-ui, sans-serif",
          lineHeight: 1.5,
          color: "#ffffff",
        }}
      >
        <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>{SITE_NAME}</h1>
        <p style={{ margin: "0 0 12px" }}>{SITE_DESCRIPTION}</p>
        <p style={{ margin: "0 0 12px" }}>
          {SITE_NAME} needs JavaScript to run. Please turn it on in your browser
          settings, or open {SITE_NAME} in another browser.
        </p>
        <p style={{ margin: 0 }}>
          <a href="/settings/legal/terms" style={{ color: "#FF6B35" }}>
            Terms of Service
          </a>
          {" · "}
          <a href="/settings/legal/privacy" style={{ color: "#FF6B35" }}>
            Privacy Policy
          </a>
        </p>
      </div>
    </noscript>
  );
}
