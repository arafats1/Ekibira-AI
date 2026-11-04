import { PLAY_STORE_URL } from "../../../lib/ews/account";

export default function AppCTA() {
  return (
    <section className="py-16 bg-[#2d6a4f]">
      <div className="max-w-4xl mx-auto px-4 text-center text-white">
        <h2 className="text-3xl sm:text-4xl font-bold">Warnings in your pocket</h2>
        <p className="mt-3 text-white/85 font-[family-name:var(--font-body)]">
          Sign up with your phone number in a covered district: today&apos;s weather, rain ahead, risks and alerts in your language. No email needed.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="bg-white text-[#1b4332] font-bold px-6 py-3.5 rounded-full hover:scale-105 transition-transform">Get the app on Google Play</a>
          <a href="/contact" className="border-2 border-white/40 font-semibold px-6 py-3.5 rounded-full hover:bg-white/10 transition-colors">Work with us</a>
        </div>
      </div>
    </section>
  );
}
