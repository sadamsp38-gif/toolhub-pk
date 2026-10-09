import Link from "next/link";
import type { ToolMeta } from "@/lib/tools";
import { ToolIcon } from "./icons";

export default function ToolCard({ tool }: { tool: ToolMeta }) {
  return (
    <Link href={`/tools/${tool.slug}`}
      className="group flex flex-col rounded-2xl border border-gold/25 bg-panel/90 p-5 shadow-lg shadow-black/30 transition duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-xl hover:shadow-gold/10">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-light text-ink shadow-md shadow-gold/30 transition group-hover:scale-110">
        <ToolIcon name={tool.slug} className="h-6 w-6" />
      </span>
      <h3 className="font-bold text-cream transition group-hover:text-gold-light">{tool.name}</h3>
      <p className="mt-1 flex-1 text-sm text-sage">{tool.tagline}</p>
      <span className="mt-3 text-xs font-semibold uppercase tracking-widest text-gold">Use tool →</span>
    </Link>
  );
}
