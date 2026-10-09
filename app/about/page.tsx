export const metadata = { title: "About" };

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">About</p>
      <h1 className="mt-3 font-display text-4xl font-bold text-cream">About ToolHub.pk</h1>
      <div className="gold-divider mt-6" />
      <div className="mt-6 space-y-4 leading-relaxed text-sage">
        <p>
          ToolHub.pk is a collection of free online utilities — PDF tools, image tools, calculators,
          text tools, generators, converters and developer tools — all in one place.
        </p>
        <p>
          <strong className="text-gold-light">Privacy first:</strong> every tool runs 100% in your browser. Your files are processed
          locally on your device and are never uploaded to any server.
        </p>
        <p>
          <strong className="text-gold-light">Free forever:</strong> no sign-up, no watermarks, no usage limits. We keep the lights on
          with unobtrusive advertising.
        </p>
        <p>
          Built with Next.js and Tailwind CSS. Questions or tool requests? Visit the{" "}
          <a href="/contact" className="font-semibold text-gold transition hover:text-gold-light">contact page</a>.
        </p>
      </div>
    </div>
  );
}
