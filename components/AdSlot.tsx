export default function AdSlot({ slot, format = "leaderboard", className = "" }: {
  slot: string;
  format?: "leaderboard" | "infeed" | "sidebar";
  className?: string;
}) {
  const dims =
    format === "leaderboard" ? "h-[90px]" :
    format === "sidebar" ? "h-[250px]" : "h-[120px]";
  return (
    <div className={`my-6 ${className}`}>
      {/* Google AdSense placeholder — paste your <ins class="adsbygoogle"> code here.
          1) Add the AdSense script tag in app/layout.tsx <head>.
          2) Replace this div's contents with your ad unit, keeping data-ad-slot="{slot}". */}
      <div className={`flex ${dims} w-full flex-col items-center justify-center rounded-xl border border-dashed border-gold/30 bg-ink-2/60 text-sage/60`}>
        <span className="text-xs font-semibold uppercase tracking-widest">Advertisement</span>
        <span className="mt-1 font-mono text-[11px]">ad-slot: {slot}</span>
      </div>
    </div>
  );
}
