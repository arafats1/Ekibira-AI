export default function Footer() {
  return (
    <footer className="bg-[#14532d] text-[#a7f3d0] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🌿</span>
              <span className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
                KijaniAI
              </span>
            </div>
            <p className="text-sm leading-relaxed font-[family-name:var(--font-body)]">
              AI-powered reforestation intelligence for Africa.
              Empowering communities to fight climate change with data-driven solutions.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-3 font-[family-name:var(--font-display)]">Quick Links</h4>
            <div className="space-y-2 text-sm font-[family-name:var(--font-body)]">
              <a href="#problem" className="block hover:text-[#4ade80] transition-colors">The Problem</a>
              <a href="#solution" className="block hover:text-[#4ade80] transition-colors">Our Solution</a>
              <a href="#demo" className="block hover:text-[#4ade80] transition-colors">Interactive Demo</a>
              <a href="#impact" className="block hover:text-[#4ade80] transition-colors">Projected Impact</a>
              <a href="#support" className="block hover:text-[#4ade80] transition-colors">Support Us</a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-3 font-[family-name:var(--font-display)]">Get in Touch</h4>
            <div className="space-y-2 text-sm font-[family-name:var(--font-body)]">
              <p>📧 hello@kijaniai.org</p>
              <p>📍 Kampala, Uganda</p>
              <p>🌍 Serving communities across Africa</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#a7f3d0]/60 font-[family-name:var(--font-body)]">
          <p>&copy; {new Date().getFullYear()} KijaniAI by Abram Group. All rights reserved.</p>
          <p>
            Built with 💚 in Uganda for Africa &bull; Powered by AI
          </p>
        </div>
      </div>
    </footer>
  );
}
