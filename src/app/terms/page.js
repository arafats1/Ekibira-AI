import Link from "next/link";
import LegalPage, { CONTACT_EMAIL } from "../components/LegalPage";

export const metadata = {
  title: "Terms of Use",
  description:
    "The terms for using KibiraAI's website, web app, mobile app, AI advisor and community early-warning service.",
  alternates: { canonical: "/terms" },
};

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

const sections = [
  {
    id: "agreement",
    title: "Agreeing to these terms",
    body: (
      <p>
        These terms apply to the KibiraAI website and web app, the KibiraAI mobile app, the AI advisor, and the
        early-warning service by SMS, USSD and voice call (together, &ldquo;the service&rdquo;). By creating an account
        or using the service you agree to them. If you use it for an organisation, you confirm you may accept these
        terms for that organisation.
      </p>
    ),
  },
  {
    id: "warnings",
    title: "Early warnings and forecasts",
    body: (
      <>
        <p>
          Our warnings and outlooks combine weather forecasts, recent weather, river flow estimates, community reports
          and AI analysis. Forecasts are probabilities, not certainties.
        </p>
        <ul>
          <li><strong>A warning may be wrong, late, or not arrive at all.</strong> Networks fail, phones are off,
            and weather changes quickly. No warning does not mean you are safe.</li>
          <li><strong>Disease-risk signals</strong> mean the weather favours a disease. They do not detect an outbreak.</li>
          <li><strong>Always follow official instructions</strong> from the Uganda National Meteorological Authority,
            the Office of the Prime Minister, district officials and health authorities. In an emergency, contact
            them or local emergency services directly.</li>
          <li>Use your own judgement and local knowledge when deciding what to do.</li>
        </ul>
      </>
    ),
  },
  {
    id: "ai",
    title: "AI advice",
    body: (
      <p>
        Dr. Kibira AI, farm plans, AI insights, market price estimates and translation drafts are produced by AI and
        can be inaccurate or incomplete. They are general information, not professional agronomic, veterinary, medical,
        financial or legal advice. Check important decisions with a qualified extension officer, vet or health worker.
        Market prices marked as AI estimates are not live quotes.
      </p>
    ),
  },
  {
    id: "accounts",
    title: "Your account",
    body: (
      <ul>
        <li>You must be 18 or older, or acting for an organisation such as a school, to create an account.</li>
        <li>Give accurate information and keep it up to date, especially your phone number and district, so
          warnings reach you.</li>
        <li>Keep your password private. You are responsible for activity on your account. Tell us at once if you think
          someone else has used it.</li>
      </ul>
    ),
  },
  {
    id: "agents",
    title: "KibiraAI agents",
    body: (
      <>
        <p>If you sign up as a KibiraAI agent, you also agree to the following:</p>
        <ul>
          <li>Register a community member only after reading them the consent script and getting their clear
            agreement. Never register someone without their permission.</li>
          <li>Report only what you saw or reliably heard. Do not invent, exaggerate or copy reports.</li>
          <li>Only take photos and videos where it is safe and lawful. Ask permission before filming people, avoid
            filming children where you can, and do not film people who are injured or grieving in a way that harms
            their dignity.</li>
          <li>Never put yourself in danger to make a report.</li>
          <li>Agents are volunteers unless a separate written agreement says otherwise. We may approve, suspend or
            remove agent access at any time.</li>
        </ul>
      </>
    ),
  },
  {
    id: "messages",
    title: "SMS, USSD and voice calls",
    body: (
      <ul>
        <li>Warning messages and calls are free to receive. Replies, USSD sessions and app data may be charged by your
          mobile network at their normal rates, unless we say a service is free.</li>
        <li>Reply STOP to any warning SMS or use the USSD menu to stop warnings at any time.</li>
        <li>If you upload a contact list as an admin or partner, you confirm everyone on it agreed to receive warnings
          from KibiraAI and that you may share their details with us.</li>
      </ul>
    ),
  },
  {
    id: "payments",
    title: "Paid plans",
    body: (
      <ul>
        <li>Some features need a paid plan. Prices are shown before you pay, in the currency stated.</li>
        <li>Payments are handled by our payment providers by mobile money or card. You authorise the charge when you
          approve it on your phone or card.</li>
        <li>A plan runs for the period shown and does not renew unless the plan says so.</li>
        <li>If a payment went through but your plan did not start, or you were charged twice, email {mail} within
          14 days and we will fix it or refund you. Other refunds are at our discretion unless the law requires them.</li>
      </ul>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You must not:</p>
        <ul>
          <li>send false warnings or reports, or use the service to cause panic;</li>
          <li>register people, upload contact lists or send messages without consent;</li>
          <li>upload content that is illegal, abusive, violent or invades someone&rsquo;s privacy;</li>
          <li>try to access other people&rsquo;s accounts, our admin console or data you are not allowed to see;</li>
          <li>disrupt, overload, scrape or reverse engineer the service, or get around usage limits;</li>
          <li>resell the service or our data without written permission.</li>
        </ul>
        <p>We may remove content and suspend or close accounts that break these rules.</p>
      </>
    ),
  },
  {
    id: "content",
    title: "Your content",
    body: (
      <p>
        You keep ownership of what you submit, such as reports, photos, videos and farm records. You give KibiraAI
        permission to store, use, analyse and share it to run and improve the service and early warnings, including
        sharing summaries with district and response officials, as described in our{" "}
        <Link href="/privacy">Privacy Policy</Link>. You confirm you have the right to share it.
      </p>
    ),
  },
  {
    id: "ours",
    title: "Our content and data sources",
    body: (
      <p>
        The KibiraAI name, logo, software and design belong to us. Weather data comes from Open-Meteo and the
        forecast and reanalysis models it serves (including ECMWF, ERA5 and GloFAS). Monthly satellite rainfall is
        CHIRPS from the UCSB Climate Hazards Center (Funk et al., 2015), served by NASA SERVIR ClimateSERV, and
        vegetation greenness contains modified Copernicus Sentinel-2 data. Map data comes from OpenStreetMap
        contributors. All are used under their own licences. You may share warnings and public pages for non-commercial,
        safety purposes as long as you do not change their meaning.
      </p>
    ),
  },
  {
    id: "availability",
    title: "Availability and changes",
    body: (
      <p>
        We work to keep the service running but do not promise it will always be available, error-free or
        uninterrupted. It depends on mobile networks, internet access and outside providers. We may change, pause or
        stop features. If we stop a paid feature you have paid for, we will refund the unused part.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limits of our responsibility",
    body: (
      <>
        <p>
          The service is provided &ldquo;as is&rdquo;. As far as the law allows, KibiraAI is not responsible for loss of
          crops, livestock, property, income or data, or for injury, that comes from relying on a forecast, warning,
          AI answer or report, or from a warning that was late or never arrived.
        </p>
        <p>
          Where we are found responsible, our total liability is limited to the amount you paid us in the 12 months
          before the claim. Nothing in these terms limits liability that cannot be limited by law, such as for death
          or injury caused by our negligence or for fraud.
        </p>
      </>
    ),
  },
  {
    id: "ending",
    title: "Closing your account",
    body: (
      <p>
        You can stop using the service and ask us to close your account at any time by emailing {mail}. We may suspend
        or close an account that breaks these terms or puts others at risk. Sections on your content, liability and
        governing law continue after an account is closed.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: (
      <p>
        These terms are governed by the laws of Uganda. We will first try to settle any dispute by talking to you.
        If that fails, the courts of Uganda will decide it.
      </p>
    ),
  },
  {
    id: "updates",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms. We will change the date at the top and, for important changes, tell account holders
        before they take effect. Continuing to use the service after that means you accept the new terms.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Use"
      updated="31 October 2026"
      intro={
        <p>
          Please read these terms before using KibiraAI. They explain what you can expect from us, what we expect from
          you, and the limits of forecasts, warnings and AI advice.
        </p>
      }
      sections={sections}
    />
  );
}
