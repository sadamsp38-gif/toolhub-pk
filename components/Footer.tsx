import Link from "next/link";
import { CATEGORIES, toolsByCategory } from "@/lib/tools";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gold/20 bg-[#050f0d] text-sage">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-light font-display text-xl font-bold text-ink">T</span>
            <span className="font-display text-xl font-bold text-cream">ToolHub<span className="text-gold">.pk</span></span>
          </div>
          <p className="mt-3 text-sm text-sage/80">Free online tools — fast, private, no sign-up. مفت آن لائن ٹولز</p>
          <div className="gold-divider mt-4 w-24" />
        </div>
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-gold">Categories</h4>
          <ul className="space-y-1.5 text-sm">
            {CATEGORIES.slice(0, 5).map((c) => (
              <li key={c}><Link href={`/#${c}`} className="transition hover:text-gold-light">{c} ({toolsByCategory(c).length})</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-gold">Popular Tools</h4>
          <ul className="space-y-1.5 text-sm">
            <li><Link href="/tools/pdf-merge" className="transition hover:text-gold-light">PDF Merge</Link></li>
            <li><Link href="/tools/image-compress" className="transition hover:text-gold-light">Image Compress</Link></li>
            <li><Link href="/tools/qr-generator" className="transition hover:text-gold-light">QR Generator</Link></li>
            <li><Link href="/tools/password-generator" className="transition hover:text-gold-light">Password Generator</Link></li>
            <li><Link href="/tools/emi-calculator" className="transition hover:text-gold-light">EMI Calculator</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-gold">Company</h4>
          <ul className="space-y-1.5 text-sm">
            <li><Link href="/about" className="transition hover:text-gold-light">About</Link></li>
            <li><Link href="/contact" className="transition hover:text-gold-light">Contact</Link></li>
            <li><Link href="/privacy" className="transition hover:text-gold-light">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gold/15 py-4 text-center text-xs text-sage/60">
        © 2026 ToolHub.pk — All tools run 100% in your browser. Your files never leave your device.
      </div>
    </footer>
  );
}
