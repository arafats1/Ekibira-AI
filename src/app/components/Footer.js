export default function Footer() {
  return (
    <footer className="bg-[#14532d] text-[#a7f3d0] py-8 sm:py-12 px-4 sm:px-6">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🌿</span>
              <span className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
                KibiraAI
              </span>
            </div>
            <p className="text-sm leading-relaxed font-[family-name:var(--font-body)]">
              Early warnings for last-mile communities: heavy rain, floods, landslides, dry spells and disease,
              by SMS, voice and app in local languages.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-3 font-[family-name:var(--font-display)]">Quick Links</h4>
            <div className="sm:space-y-2 text-sm font-[family-name:var(--font-body)]">
              <a href="/problem" className="flex items-center sm:block leading-snug hover:text-[#4ade80] transition-colors">The Problem</a>
              <a href="/solution" className="flex items-center sm:block leading-snug hover:text-[#4ade80] transition-colors">Our Solution</a>
              <a href="/last-mile" className="flex items-center sm:block leading-snug hover:text-[#4ade80] transition-colors">Today&apos;s Warnings</a>
              <a href="/childrens-early-warning" className="flex items-center sm:block leading-snug hover:text-[#4ade80] transition-colors">Children&apos;s Early Warning</a>
              <a href="/advisor" className="flex items-center sm:block leading-snug hover:text-[#4ade80] transition-colors">Dr. Kibira AI</a>
              <a href="https://play.google.com/store/apps/details?id=com.kibiraai.mobile&amp;pcampaignid=web_share" target="_blank" rel="noopener noreferrer" className="flex items-center sm:block leading-snug hover:text-[#4ade80] transition-colors">Get the App</a>
              <a href="/contact" className="flex items-center sm:block leading-snug hover:text-[#4ade80] transition-colors">Work With Us</a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-3 font-[family-name:var(--font-display)]">Get in Touch</h4>
            <div className="space-y-2 text-xs sm:text-sm font-[family-name:var(--font-body)]">
              <p className="break-words">📧 arafats144@gmail.com</p>
              <p>📍 Kampala, Uganda</p>
              <p>🌍 Serving last-mile communities in Uganda</p>
              <a href="/contact" className="inline-block text-[#4ade80] hover:underline">Send us a message →</a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 sm:pt-6 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 text-[10px] sm:text-xs text-[#a7f3d0]/60 font-[family-name:var(--font-body)]">
          <p>&copy; {new Date().getFullYear()} KibiraAI All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:text-[#4ade80] transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-[#4ade80] transition-colors">Terms of Use</a>
          </div>
          <p>
            Built with 💚 in Uganda for Africa &bull; Powered by AI
          </p>
        </div>
      </div>
    </footer>
  );
}
