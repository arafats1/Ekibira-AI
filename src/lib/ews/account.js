// App accounts made with only a phone number get a placeholder email on the
// reserved .invalid domain (see TUOGERE-BE src/api/ews/services/account.js).
// Show the phone number instead; nothing is ever sent to that address.
export function shownEmail(person) {
  const email = person?.email || "";
  if (!email.toLowerCase().endsWith("@phone.kibiraai.invalid")) return email;
  return person?.phone ? `No email · ${person.phone}` : "No email";
}

/**
 * A Ugandan number as people type it (0772 123 456, 772123456, +256 772...)
 * in the +256 form, or null. Same rules as normalizePhone on the backend.
 */
export function ugandaPhone(raw) {
  let p = String(raw || "").replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0") && p.length === 10) p = `256${p.slice(1)}`;
  else if (p.length === 9 && p.startsWith("7")) p = `256${p}`;
  return /^256\d{9}$/.test(p) ? `+${p}` : null;
}

export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.kibiraai.mobile&pcampaignid=web_share";
