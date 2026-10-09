"use client";

import Link from "next/link";
import { useState } from "react";
import { CATEGORIES, toolsByCategory } from "@/lib/tools";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  return (
    <header className="sticky top-0 z-50 border-b border-gold/20 bg-ink/90 text-cream backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-light font-display text-xl font-bold text-ink shadow-md shadow-gold/30">T</span>
          <span className="font-display text-xl font-bold tracking-tight text-cream">ToolHub<span className="text-gold">.pk</span></span>
        </Link>
        <form action="/" method="GET" className="ml-auto hidden min-w-0 flex-1 max-w-xs md:block" onSubmit={(e) => { if (!q.trim()) e.preventDefault(); }}>
          <input name="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tools…"
            className="w-full rounded-full border border-gold/25 bg-ink-2/70 px-4 py-1.5 text-sm text-cream placeholder:text-sage/50 outline-none focus:border-gold/70" />
        </form>
        <nav className="hidden items-center gap-5 text-sm font-medium text-sage md:flex">
          <div className="relative group">
            <button className="py-2 transition hover:text-gold-light">Categories ▾</button>
            <div className="invisible absolute right-0 top-full w-56 rounded-xl border border-gold/25 bg-panel p-2 text-sage opacity-0 shadow-xl shadow-black/50 transition group-hover:visible group-hover:opacity-100">
              {CATEGORIES.map((c) => (
                <Link key={c} href={`/#${c}`} className="block rounded-lg px-3 py-2 transition hover:bg-gold/10 hover:text-cream">
                  {c} <span className="text-xs text-sage/60">({toolsByCategory(c).length})</span>
                </Link>
              ))}
            </div>
          </div>
          <Link href="/about" className="transition hover:text-gold-light">About</Link>
          <Link href="/contact" className="transition hover:text-gold-light">Contact</Link>
        </nav>
        <button className="ml-auto rounded-lg border border-gold/30 px-3 py-1.5 text-gold md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
      </div>
      {open && (
        <div className="border-t border-gold/15 px-4 py-3 md:hidden">
          {CATEGORIES.map((c) => (
            <Link key={c} href={`/#${c}`} onClick={() => setOpen(false)} className="block py-1.5 text-sage transition hover:text-gold-light">{c}</Link>
          ))}
          <Link href="/about" onClick={() => setOpen(false)} className="block py-1.5 text-sage transition hover:text-gold-light">About</Link>
          <Link href="/contact" onClick={() => setOpen(false)} className="block py-1.5 text-sage transition hover:text-gold-light">Contact</Link>
        </div>
      )}
    </header>
  );
}
