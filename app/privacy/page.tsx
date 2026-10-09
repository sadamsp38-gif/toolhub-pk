export const metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Legal</p>
      <h1 className="mt-3 font-display text-4xl font-bold text-cream">Privacy Policy</h1>
      <div className="gold-divider mt-6" />
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-sage">
        <p><strong className="text-cream">1. Local processing.</strong> All tools on ToolHub.pk run entirely in your web browser. Files you open in PDF or image tools are never uploaded to our servers.</p>
        <p><strong className="text-cream">2. No accounts.</strong> We do not require sign-up and do not maintain user accounts.</p>
        <p><strong className="text-cream">3. Analytics & advertising.</strong> We may use privacy-friendly analytics and third-party advertising (e.g., Google AdSense). Ad providers may use cookies to serve personalized ads. You can opt out of personalized advertising via Google’s Ad Settings.</p>
        <p><strong className="text-cream">4. Cookies.</strong> We use minimal cookies for site functionality and, if enabled, advertising. No tracking cookies are set by our tools themselves.</p>
        <p><strong className="text-cream">5. Contact.</strong> If you contact us, we use your details only to respond.</p>
        <p className="text-sage/60">Last updated: October 2026.</p>
      </div>
    </div>
  );
}
