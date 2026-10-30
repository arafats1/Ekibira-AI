/**
 * Marz card gateway sets X-Frame-Options: sameorigin, so it cannot be iframed.
 * Open it in a named popup while keeping Bear open underneath.
 */

const POPUP_FEATURES =
  "popup=yes,width=480,height=760,left=120,top=40,scrollbars=yes,resizable=yes";

/**
 * @param {string} url
 * @returns {{ popup: Window | null, blocked: boolean }}
 */
export function openMarzCardCheckout(url) {
  if (!url || typeof window === "undefined") {
    return { popup: null, blocked: true };
  }

  const popup = window.open(url, "marz_card_checkout", POPUP_FEATURES);

  if (!popup || popup.closed) {
    return { popup: null, blocked: true };
  }

  try {
    popup.focus();
  } catch {
    // ignore
  }

  return { popup, blocked: false };
}

export function focusMarzCardCheckout(url) {
  if (!url || typeof window === "undefined") return;
  const existing = window.open("", "marz_card_checkout");
  if (existing && !existing.closed && existing.location?.href !== "about:blank") {
    try {
      existing.focus();
      return;
    } catch {
      // fall through
    }
  }
  openMarzCardCheckout(url);
}
