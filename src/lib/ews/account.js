// App accounts made with only a phone number get a placeholder email on the
// reserved .invalid domain (see TUOGERE-BE src/api/ews/services/account.js).
// Show the phone number instead; nothing is ever sent to that address.
export function shownEmail(person) {
  const email = person?.email || "";
  if (!email.toLowerCase().endsWith("@phone.kibiraai.invalid")) return email;
  return person?.phone ? `No email · ${person.phone}` : "No email";
}
