import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TOOLS, toolBySlug, toolsByCategory } from "@/lib/tools";
import { TOOL_COMPONENTS } from "@/components/tools";
import { ToolIcon } from "@/components/icons";
import ToolCard from "@/components/ToolCard";
import AdSlot from "@/components/AdSlot";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = toolBySlug(slug);
  if (!tool) return {};
  return {
    title: `${tool.name} — ${tool.tagline}`,
    description: tool.description,
    keywords: tool.keywords,
    openGraph: { title: `${tool.name} | ToolHub.pk`, description: tool.description, type: "website" },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = toolBySlug(slug);
  if (!tool) notFound();
  const Tool = TOOL_COMPONENTS[slug];
  const related = toolsByCategory(tool.category).filter((t) => t.slug !== slug).slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* breadcrumb */}
      <nav className="text-sm text-sage/70">
        <Link href="/" className="transition hover:text-gold-light">Home</Link> /{" "}
        <Link href={`/#${tool.category}`} className="transition hover:text-gold-light">{tool.category}</Link> /{" "}
        <span className="text-cream">{tool.name}</span>
      </nav>

      {/* header */}
      <div className="mt-4 flex items-start gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-gold-light text-ink shadow-lg shadow-gold/25">
          <ToolIcon name={slug} className="h-8 w-8" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-cream md:text-4xl">{tool.name}</h1>
          <p className="mt-1 text-sage">{tool.description}</p>
        </div>
      </div>

      <div className="gold-divider mt-6" />

      <AdSlot slot={`tool-top-${slug}`} format="leaderboard" />

      {/* the tool itself */}
      <div className="mt-2">{Tool ? <Tool /> : <p>Tool coming soon.</p>}</div>

      <AdSlot slot={`tool-mid-${slug}`} format="infeed" />

      {/* how to + faq */}
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gold/25 bg-panel/90 p-6 shadow-lg shadow-black/30">
          <h2 className="font-display text-lg font-bold text-gold-light">How to use</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-sage">
            {tool.howTo.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>
        <div className="rounded-2xl border border-gold/25 bg-panel/90 p-6 shadow-lg shadow-black/30">
          <h2 className="font-display text-lg font-bold text-gold-light">FAQ</h2>
          <div className="mt-3 space-y-3">
            {tool.faq.map((f, i) => (
              <div key={i}>
                <p className="text-sm font-semibold text-cream">{f.q}</p>
                <p className="text-sm text-sage">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* related */}
      {related.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-4">
            <h2 className="font-display text-xl font-bold text-cream">Related tools</h2>
            <div className="gold-divider flex-1" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((t) => <ToolCard key={t.slug} tool={t} />)}
          </div>
        </div>
      )}

      {/* FAQ schema for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "FAQPage",
          mainEntity: tool.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }),
      }} />
    </div>
  );
}
