"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TOOLS, CATEGORIES, CATEGORY_BLURB, toolsByCategory, type ToolMeta } from "@/lib/tools";
import ToolCard from "@/components/ToolCard";
import AdSlot from "@/components/AdSlot";

function matches(t: ToolMeta, q: string) {
  const s = q.toLowerCase();
  return t.name.toLowerCase().includes(s) || t.tagline.toLowerCase().includes(s) ||
    t.keywords.some((k) => k.includes(s)) || t.category.toLowerCase().includes(s);
}

function HomeInner() {
  const sp = useSearchParams();
  const query = (sp.get("q") ?? "").trim();
  if (query) return <SearchResults query={query} />;
  return <BrowseAll />;
}

function SearchResults({ query }: { query: string }) {
  const results = TOOLS.filter((t) => matches(t, query));
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-cream">Results for “{query}” <span className="text-sage">({results.length})</span></h1>
      {results.length === 0 ? (
        <p className="mt-6 text-sage">No tools found. Try “pdf”, “image”, “qr”, “tax”…</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{results.map((t) => <ToolCard key={t.slug} tool={t} />)}</div>
      )}
      <Link href="/" className="mt-8 inline-block font-semibold text-gold transition hover:text-gold-light">← Back to all tools</Link>
    </div>
  );
}

function BrowseAll() {
  const popular = TOOLS.filter((t) => t.popular);
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-ink-2 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Free Online Tools</p>
          <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-cream md:text-7xl">
            The Finest Tools,<br />
            <span className="bg-gradient-to-r from-gold-light via-gold to-gold-light bg-clip-text text-transparent">Free Forever.</span>
          </h1>
          <div className="gold-ornament mt-6" />
          <p className="mx-auto mt-6 max-w-2xl text-lg text-sage">
            {TOOLS.length} free professional tools for PDF, images, calculators & more. Fast, private, no sign-up. مفت آن لائن ٹولز
          </p>
          <form action="/" method="GET" className="mx-auto mt-8 flex max-w-xl gap-2">
            <input name="q" placeholder="Search for tools… e.g. PDF to Word, Percentage Calculator, QR Generator"
              className="w-full rounded-full border border-gold/40 bg-ink/80 px-6 py-3.5 text-cream placeholder:text-sage/50 outline-none backdrop-blur focus:border-gold" />
            <button className="rounded-full bg-gold px-7 font-bold text-ink shadow-lg shadow-gold/25 transition hover:scale-105 hover:bg-gold-light">Search</button>
          </form>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
            {["✦ 150 TOOLS", "100% FREE", "NO SIGNUP"].map((s) => (
              <span key={s} className="rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs font-bold tracking-widest text-gold-light">{s}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <AdSlot slot="home-top" format="leaderboard" />

        <section className="mt-4">
          <div className="flex items-center gap-4">
            <h2 className="font-display text-2xl font-bold text-cream">Popular Tools</h2>
            <div className="gold-divider flex-1" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((t) => <ToolCard key={t.slug} tool={t} />)}
          </div>
        </section>

        <AdSlot slot="home-mid" format="infeed" />

        {CATEGORIES.map((c) => (
          <section key={c} id={c} className="mt-12 scroll-mt-24">
            <div className="flex items-center gap-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-gold">{c}</h2>
              <div className="gold-divider flex-1" />
            </div>
            <p className="mt-2 text-sage">{CATEGORY_BLURB[c]}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {toolsByCategory(c).map((t) => <ToolCard key={t.slug} tool={t} />)}
            </div>
          </section>
        ))}

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            ["🔒", "100% Private", "Files are processed in your browser and never uploaded to any server."],
            ["⚡", "Fast & Free", "No sign-up, no watermarks, no limits. Just open and use."],
            ["📱", "Works Everywhere", "Fully responsive — great on mobile, tablet and desktop."],
          ].map(([e, h, p]) => (
            <div key={h} className="rounded-2xl border border-gold/25 bg-panel/90 p-6 text-center shadow-lg shadow-black/30">
              <div className="text-4xl">{e}</div>
              <h3 className="mt-2 font-display text-lg font-bold text-cream">{h}</h3>
              <p className="mt-1 text-sm text-sage">{p}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10 text-sage">Loading…</div>}>
      <HomeInner />
    </Suspense>
  );
}
