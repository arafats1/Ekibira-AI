import LegalPage, { CONTACT_EMAIL } from "../components/LegalPage";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How KibiraAI collects, uses, stores and shares personal information across the web app, mobile app, SMS, USSD and voice early warnings.",
  alternates: { canonical: "/privacy" },
};

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

const sections = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          KibiraAI (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is based in Kampala, Uganda. We run the KibiraAI website and web
          app, the KibiraAI mobile app, and the community early-warning service delivered by SMS, USSD and voice call.
          We decide how the personal information described here is used.
        </p>
        <p>
          We handle personal information in line with Uganda&rsquo;s Data Protection and Privacy Act, 2019 and its
          regulations. Contact us at {mail} about anything in this policy.
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "Information we collect",
    body: (
      <>
        <p><strong>When you create an account</strong></p>
        <ul>
          <li>Name, email address, password (stored hashed, never in plain text), phone number and account type
            (for example farmer, school, community member, KibiraAI agent).</li>
          <li>Location you choose to give us, such as district, sub-county, parish or village.</li>
        </ul>
        <p><strong>When you join early warnings</strong> (app, USSD, SMS, an agent, or a contact list)</p>
        <ul>
          <li>Phone number, name if given, district and village, livelihood (for example farmer, livestock keeper,
            fisher), preferred language, how and when you agreed to receive warnings, and whether you opted out.</li>
          <li>Records of the warnings sent to you, whether they were delivered or answered, and how long a call lasted.</li>
          <li>Replies and reports you send back, such as &ldquo;heavy rain&rdquo;, rain gauge readings or crop disease.</li>
        </ul>
        <p><strong>When you are a KibiraAI agent</strong></p>
        <ul>
          <li>Your application details and approval status.</li>
          <li>Incident reports you submit: description, category, impact, place, date, number of people affected,
            and any photos or videos. Reports may include GPS coordinates if your phone provides them.</li>
          <li>Details of community members you register on their behalf, with their consent.</li>
        </ul>
        <p><strong>When you use our tools</strong></p>
        <ul>
          <li>Questions you ask Dr. Kibira AI and the answers given.</li>
          <li>Farm information you enter, such as crops, planting dates and field locations.</li>
          <li>School and alert-contact details entered on the children&rsquo;s early-warning dashboard.</li>
        </ul>
        <p><strong>When you pay</strong></p>
        <ul>
          <li>Your plan, amount, payment status and the mobile money number used. Card and mobile money payments are
            processed by our payment providers; we do not receive or store full card numbers or PINs.</li>
        </ul>
        <p><strong>Stored on your device</strong></p>
        <ul>
          <li>The web app keeps your sign-in session and some recent results in your browser&rsquo;s local storage.
            The mobile app saves recent information and unsent work on your phone so it works without signal,
            and sends it when you reconnect. Signing out clears this.</li>
          <li>We do not use advertising or third-party tracking cookies.</li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use information",
    body: (
      <ul>
        <li>To run your account and the features you use, and to keep them secure.</li>
        <li>To send weather, flood, landslide, dry spell and disease-risk warnings to the right people in the right
          district, livelihood and language, by app, SMS or voice call.</li>
        <li>To check how accurate warnings were, using community replies and agent reports, and to improve future
          warnings and the AI analysis behind them.</li>
        <li>To answer your questions with AI and to produce farm plans and advice.</li>
        <li>To process payments and manage subscriptions.</li>
        <li>To contact you about your account or the service, and to meet legal obligations.</li>
      </ul>
    ),
  },
  {
    id: "legal-basis",
    title: "Why we are allowed to use it",
    body: (
      <ul>
        <li><strong>Consent:</strong> early-warning messages and calls are sent only to people who agreed to receive
          them. You can withdraw consent at any time (see &ldquo;Your choices&rdquo;).</li>
        <li><strong>Providing the service you asked for:</strong> account, AI advisor, farm tools and paid plans.</li>
        <li><strong>Legitimate interests and public interest:</strong> keeping the service secure and improving early
          warnings that protect lives and livelihoods.</li>
        <li><strong>Legal obligations:</strong> for example keeping payment records.</li>
      </ul>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>We do not sell personal information. We share it only with service providers who help us run KibiraAI,
          and only what they need:</p>
        <ul>
          <li><strong>Africa&rsquo;s Talking</strong>: sends SMS and voice calls and runs our USSD menu (phone numbers
            and message content).</li>
          <li><strong>OpenAI</strong>: powers the AI advisor, AI insights, translation drafts and photo summaries of
            agent reports (the text or images involved).</li>
          <li><strong>Sunbird AI and ElevenLabs</strong>: turn warning text into speech. Only the warning text is sent,
            not who will receive it.</li>
          <li><strong>Backblaze B2 and its content delivery network</strong>: store photos, videos and voice recordings.</li>
          <li><strong>Payment providers (Marz Pay, Stripe)</strong>: process mobile money and card payments.</li>
          <li><strong>Hosting and database providers</strong>: run our servers.</li>
          <li><strong>Open-Meteo and OpenStreetMap</strong>: provide weather and place data. We send place
            coordinates, not your identity.</li>
        </ul>
        <p>
          We may share summaries of warnings, community reports and agent reports with district disaster, agriculture,
          veterinary and health officers to support a response. Where possible these do not name individuals.
          We may also disclose information if the law requires it or to protect someone&rsquo;s life or safety.
        </p>
      </>
    ),
  },
  {
    id: "transfers",
    title: "International transfers",
    body: (
      <p>
        Some of the providers above store or process data outside Uganda, for example in the United States or Europe.
        When that happens we choose providers that protect data with appropriate safeguards, and we send only what
        each needs.
      </p>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <ul>
        <li>Account information: while your account is open, and deleted or anonymised within 90 days of closing it.</li>
        <li>Early-warning subscriptions: until you opt out. We keep an opted-out number on a do-not-contact list so
          you are never re-added by mistake.</li>
        <li>Warning delivery records, feedback and agent reports: up to 5 years, because past events help predict
          future ones. After that we delete them or remove names and phone numbers.</li>
        <li>Payment records: as long as tax and accounting law requires.</li>
      </ul>
    ),
  },
  {
    id: "choices",
    title: "Your choices and rights",
    body: (
      <>
        <ul>
          <li><strong>Stop warnings:</strong> reply STOP to any warning SMS, choose &ldquo;Stop&rdquo; in the USSD menu,
            or turn off warnings in the app.</li>
          <li><strong>Access, correct or delete:</strong> you can ask for a copy of your information, ask us to fix it,
            or ask us to delete it, by emailing {mail}. We reply within 30 days.</li>
          <li><strong>Object or withdraw consent:</strong> you can object to a use of your information or withdraw
            consent at any time. This does not affect what was done before.</li>
          <li><strong>Complain:</strong> if you are unhappy with how we handled your information, contact us first. You
            can also complain to Uganda&rsquo;s Personal Data Protection Office.</li>
        </ul>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        Accounts are for adults (18 and over) and organisations such as schools. The children&rsquo;s early-warning
        dashboard is used by schools and adults responsible for children. It is meant for school-level information
        and adult contacts; please do not enter children&rsquo;s names or health records. If you believe a child has
        given us personal information, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        We use encrypted connections (HTTPS), hashed passwords, access controls so only authorised staff and approved
        agents can see what their role needs, and secret keys on our service callbacks. No system is perfectly secure.
        If a breach puts your information at risk, we will tell you and the regulator as the law requires.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy as the service changes. We will change the date at the top and, for important
        changes, tell account holders by email or in the app before they take effect.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="31 October 2026"
      intro={
        <p>
          This policy explains what personal information KibiraAI collects through the website, web app, mobile app
          and our SMS, USSD and voice early warnings, how we use it, who we share it with, and the choices you have.
        </p>
      }
      sections={sections}
    />
  );
}
