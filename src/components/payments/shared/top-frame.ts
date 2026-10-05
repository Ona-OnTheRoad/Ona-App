/**
 * Navigate the top Ona shell when running inside the checkout iframe;
 * otherwise (or if the top frame is cross-origin) run the in-frame fallback.
 */
export function navigateTopOr(dest: string, fallback: () => void) {
  try {
    if (window.top && window.top !== window.self) {
      window.top.location.replace(dest);
      return;
    }
  } catch {
    /* */
  }
  fallback();
}

/**
 * Flutterwave may finish inside the in-app checkout iframe.
 * Promote callback to the top Ona shell so the user never stays trapped in the frame.
 */
export function breakOutOfIframe() {
  if (typeof window === "undefined") return false;
  try {
    if (window.top && window.top !== window.self) {
      window.top.location.replace(window.location.href);
      return true;
    }
  } catch {
    try {
      if (window.top) {
        window.top.location.href = window.location.href;
        return true;
      }
    } catch {
      /* ignore */
    }
  }
  return false;
}
