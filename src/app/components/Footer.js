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
              AI-powered climate intelligence for Africa — fighting deforestation, delivering urban early warning,
              and turning climate data into children&rsquo;s health foresight.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-3 font-[family-name:var(--font-display)]">Quick Links</h4>
            <div className="sm:space-y-2 text-sm font-[family-name:var(--font-body)]">
              <a href="/#problem" className="flex items-center sm:block leading-snug hover:text-[#4ade80] transition-colors">The Problem</a>
              <a href="/solution" className="flex items-center sm:block leading-snug hover:text-[#4ade80] transition-colors">Our Solution</a>
              <a href="/advisor" className="flex items-center sm:block leading-snug hover:text-[#4ade80] transition-colors">Dr. Kibira AI</a>
              <a href="/docs/early-warning" className="flex items-center sm:block leading-snug hover:text-[#4ade80] transition-colors">Developer Docs (Early Warning)</a>
              <a href="/childrens-early-warning" className="flex items-center sm:block leading-snug hover:text-[#4ade80] transition-colors">Children&apos;s Early Warning</a>
              <a href="/early-warning-status" className="flex items-center sm:block leading-snug hover:text-[#4ade80] transition-colors">Public Status Dashboard</a>
              <a href="/urban-warning" className="flex items-center sm:block leading-snug hover:text-[#4ade80] transition-colors">Urban Warning</a>
              <a href="/signup?type=forestry" className="flex items-center sm:block leading-snug hover:text-[#4ade80] transition-colors">Forestry &amp; Conservation Signup</a>
              <a href="/#impact" className="flex items-center sm:block leading-snug hover:text-[#4ade80] transition-colors">Projected Impact</a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-3 font-[family-name:var(--font-display)]">Get in Touch</h4>
            <div className="space-y-2 text-xs sm:text-sm font-[family-name:var(--font-body)]">
              <p className="break-words">📧 arafats144@gmail.com</p>
              <p>📍 Kampala, Uganda</p>
              <p>🌍 Serving communities across Africa</p>
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
