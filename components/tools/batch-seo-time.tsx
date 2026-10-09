"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Btn,
  Card,
  CopyBtn,
  Field,
  Notice,
  Select,
  Slider,
  Stat,
  TextArea,
  TextInput,
  downloadBlob,
} from "../ui";

/* ---------- shared helpers ---------- */

/** Escape a value for use inside an HTML attribute. */
function escAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function audioCtx(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    return AC ? new AC() : null;
  } catch {
    return null;
  }
}

/** Short click beep. Only call from user-triggered handlers. */
function clickBeep(ctx: AudioContext, accent: boolean) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = accent ? 1250 : 850;
  const t = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.6, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  osc.start(t);
  osc.stop(t + 0.1);
}

/* ============================== Meta Tag Generator ============================== */

const ROBOTS_OPTIONS = [
  { value: "index, follow", label: "index, follow (default)" },
  { value: "index, nofollow", label: "index, nofollow" },
  { value: "noindex, follow", label: "noindex, follow" },
  { value: "noindex, nofollow", label: "noindex, nofollow" },
  { value: "noarchive", label: "noarchive" },
];

export function MetaTagTool() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [keywords, setKeywords] = useState("");
  const [author, setAuthor] = useState("");
  const [robots, setRobots] = useState("index, follow");

  const code = useMemo(() => {
    const lines: string[] = [];
    if (title.trim()) lines.push(`<title>${escAttr(title.trim())}</title>`);
    if (desc.trim()) lines.push(`<meta name="description" content="${escAttr(desc.trim())}" />`);
    if (keywords.trim()) lines.push(`<meta name="keywords" content="${escAttr(keywords.trim())}" />`);
    if (author.trim()) lines.push(`<meta name="author" content="${escAttr(author.trim())}" />`);
    lines.push(`<meta name="robots" content="${escAttr(robots)}" />`);
    lines.push(`<meta name="viewport" content="width=device-width, initial-scale=1" />`);
    lines.push(`<meta charset="utf-8" />`);
    return lines.join("\n");
  }, [title, desc, keywords, author, robots]);

  const titleNote = title.length > 60 ? "⚠ Long — Google may truncate past ~60 characters." : `${title.length}/60 chars recommended`;
  const descNote = desc.length > 160 ? "⚠ Long — descriptions usually truncate past ~160 characters." : `${desc.length}/160 chars recommended`;

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Page title" hint={titleNote}>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Amazing Page" maxLength={140} />
        </Field>
        <Field label="Meta description" hint={descNote}>
          <TextArea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="A short summary shown under your title in search results…" className="min-h-[90px]" />
        </Field>
        <Field label="Keywords (comma separated)" hint="Optional — most search engines ignore these today.">
          <TextInput value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="tools, seo, free" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Author">
            <TextInput value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name or company" />
          </Field>
          <Field label="Robots">
            <Select value={robots} onChange={setRobots} options={ROBOTS_OPTIONS} />
          </Field>
        </div>
        <Field label="Generated HTML — paste into your <head>">
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-gold/25 bg-ink/80 px-3.5 py-2.5 font-mono text-sm text-cream">
            {code}
          </pre>
        </Field>
        <CopyBtn text={code} />
      </div>
    </Card>
  );
}

/* ============================== OG Tag Generator ============================== */

const OG_TYPES = [
  { value: "website", label: "website" },
  { value: "article", label: "article" },
  { value: "product", label: "product" },
];

const TWITTER_CARDS = [
  { value: "summary_large_image", label: "summary_large_image (big image)" },
  { value: "summary", label: "summary (small image)" },
];

export function OgTagTool() {
  const [ogTitle, setOgTitle] = useState("");
  const [ogDesc, setOgDesc] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [ogUrl, setOgUrl] = useState("");
  const [siteName, setSiteName] = useState("");
  const [ogType, setOgType] = useState("website");
  const [twCard, setTwCard] = useState("summary_large_image");

  const code = useMemo(() => {
    const lines: string[] = [];
    if (ogTitle.trim()) lines.push(`<meta property="og:title" content="${escAttr(ogTitle.trim())}" />`);
    if (ogDesc.trim()) lines.push(`<meta property="og:description" content="${escAttr(ogDesc.trim())}" />`);
    if (ogImage.trim()) lines.push(`<meta property="og:image" content="${escAttr(ogImage.trim())}" />`);
    if (ogUrl.trim()) lines.push(`<meta property="og:url" content="${escAttr(ogUrl.trim())}" />`);
    if (siteName.trim()) lines.push(`<meta property="og:site_name" content="${escAttr(siteName.trim())}" />`);
    lines.push(`<meta property="og:type" content="${escAttr(ogType)}" />`);
    lines.push(`<meta name="twitter:card" content="${escAttr(twCard)}" />`);
    if (ogTitle.trim()) lines.push(`<meta name="twitter:title" content="${escAttr(ogTitle.trim())}" />`);
    if (ogDesc.trim()) lines.push(`<meta name="twitter:description" content="${escAttr(ogDesc.trim())}" />`);
    return lines.join("\n");
  }, [ogTitle, ogDesc, ogImage, ogUrl, siteName, ogType, twCard]);

  let host = "";
  try {
    host = ogUrl.trim() ? new URL(ogUrl.trim()).hostname : "";
  } catch {
    host = "";
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="og:title" hint={`${ogTitle.length}/60 chars suggested`}>
            <TextInput value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} placeholder="Catchy share title" maxLength={120} />
          </Field>
          <Field label="og:image URL">
            <TextInput value={ogImage} onChange={(e) => setOgImage(e.target.value)} placeholder="https://example.com/share.png" inputMode="url" />
          </Field>
        </div>
        <Field label="og:description" hint={`${ogDesc.length}/200 chars suggested`}>
          <TextArea value={ogDesc} onChange={(e) => setOgDesc(e.target.value)} placeholder="One or two lines shown under the title when shared…" className="min-h-[80px]" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="og:url (canonical page URL)">
            <TextInput value={ogUrl} onChange={(e) => setOgUrl(e.target.value)} placeholder="https://example.com/page" inputMode="url" />
          </Field>
          <Field label="og:site_name">
            <TextInput value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="My Site" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="og:type">
            <Select value={ogType} onChange={setOgType} options={OG_TYPES} />
          </Field>
          <Field label="twitter:card">
            <Select value={twCard} onChange={setTwCard} options={TWITTER_CARDS} />
          </Field>
        </div>

        <div>
          <div className="mb-1.5 text-sm font-semibold text-cream">Social share preview</div>
          <div className="overflow-hidden rounded-xl border border-gold/25 bg-ink-2/70">
            {ogImage.trim() ? (
              <img src={ogImage.trim()} alt="Share preview" className="h-44 w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-44 items-center justify-center bg-gold/5 text-sm text-sage/60">
                Add an og:image URL to see it here
              </div>
            )}
            <div className="p-4">
              {host && <div className="text-xs uppercase tracking-widest text-sage/70">{host}</div>}
              <div className="mt-1 font-display text-lg font-bold text-cream">
                {ogTitle.trim() || <span className="text-sage/50">Your share title…</span>}
              </div>
              <div className="mt-1 line-clamp-2 text-sm text-sage">
                {ogDesc.trim() || <span className="text-sage/50">Your share description…</span>}
              </div>
            </div>
          </div>
        </div>

        <Field label="Generated tags — paste into your <head>">
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-gold/25 bg-ink/80 px-3.5 py-2.5 font-mono text-sm text-cream">
            {code}
          </pre>
        </Field>
        <CopyBtn text={code} />
      </div>
    </Card>
  );
}

/* ============================== Robots.txt Generator ============================== */

interface RobotsRule {
  agent: string;
  path: string;
  allow: boolean;
}

export function RobotsTool() {
  const [rules, setRules] = useState<RobotsRule[]>([
    { agent: "*", path: "/", allow: true },
  ]);
  const [agent, setAgent] = useState("*");
  const [path, setPath] = useState("");
  const [allow, setAllow] = useState(false);
  const [sitemap, setSitemap] = useState("");

  const txt = useMemo(() => {
    const lines: string[] = [];
    for (const r of rules) {
      const a = r.agent.trim() || "*";
      const p = r.path.trim() || "/";
      lines.push(`User-agent: ${a}`);
      lines.push(`${r.allow ? "Allow" : "Disallow"}: ${p}`);
      lines.push("");
    }
    if (sitemap.trim()) lines.push(`Sitemap: ${sitemap.trim()}`);
    return lines.join("\n").trimEnd() + "\n";
  }, [rules, sitemap]);

  const addRule = () => {
    if (!path.trim()) return;
    setRules((r) => [...r, { agent: agent.trim() || "*", path: path.trim(), allow }]);
    setPath("");
  };

  const removeRule = (i: number) => setRules((r) => r.filter((_, idx) => idx !== i));

  return (
    <Card>
      <div className="space-y-4">
        <div className="rounded-xl border border-gold/20 bg-ink-2/60 p-4">
          <div className="mb-3 text-sm font-semibold text-cream">Add a rule</div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_160px]">
            <Field label="User-agent">
              <TextInput value={agent} onChange={(e) => setAgent(e.target.value)} placeholder="* or Googlebot" />
            </Field>
            <Field label="Path">
              <TextInput value={path} onChange={(e) => setPath(e.target.value)} placeholder="/admin/ or /private.html" />
            </Field>
            <Field label="Rule type">
              <Select
                value={allow ? "allow" : "disallow"}
                onChange={(v) => setAllow(v === "allow")}
                options={[
                  { value: "disallow", label: "Disallow (block)" },
                  { value: "allow", label: "Allow (permit)" },
                ]}
              />
            </Field>
          </div>
          <div className="mt-3">
            <Btn variant="secondary" onClick={addRule} disabled={!path.trim()}>
              Add rule
            </Btn>
          </div>
        </div>

        {rules.length > 0 && (
          <ul className="space-y-1.5">
            {rules.map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-ink-2/60 px-3 py-2 font-mono text-sm">
                <span className="truncate text-cream">
                  <span className="text-sage">{r.agent || "*"}</span> ·{" "}
                  <span className={r.allow ? "text-gold-light" : "text-amber-300"}>
                    {r.allow ? "Allow" : "Disallow"}
                  </span>{" "}
                  {r.path}
                </span>
                <button onClick={() => removeRule(i)} className="shrink-0 text-sm text-sage/70 hover:text-red-300" aria-label="Remove rule">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <Field label="Sitemap URL (optional)">
          <TextInput value={sitemap} onChange={(e) => setSitemap(e.target.value)} placeholder="https://example.com/sitemap.xml" inputMode="url" />
        </Field>

        <Field label="robots.txt — save as robots.txt in your site root">
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-gold/25 bg-ink/80 px-3.5 py-2.5 font-mono text-sm text-cream">
            {txt}
          </pre>
        </Field>
        <div className="flex flex-wrap gap-2">
          <CopyBtn text={txt} />
          <Btn variant="secondary" onClick={() => downloadBlob(new Blob([txt], { type: "text/plain" }), "robots.txt")}>
            Download robots.txt
          </Btn>
        </div>
        <Notice>
          robots.txt is a polite request, not a lock — well-behaved crawlers obey it, but private pages still need real access control.
        </Notice>
      </div>
    </Card>
  );
}

/* ============================== Readability Checker ============================== */

/** Rough syllable count: vowel groups, minus a silent trailing "e". */
function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const groups = w.replace(/[^aeiouy]+/g, " ").trim().split(/\s+/).length;
  const silentE = w.endsWith("e") && !w.endsWith("le") ? 1 : 0;
  return Math.max(1, groups - silentE);
}

function easeLabel(score: number): string {
  if (score >= 90) return "Very easy";
  if (score >= 80) return "Easy";
  if (score >= 70) return "Fairly easy";
  if (score >= 60) return "Standard";
  if (score >= 50) return "Fairly difficult";
  if (score >= 30) return "Difficult";
  return "Very confusing";
}

export function ReadabilityTool() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const words = text.match(/[A-Za-z']+/g) ?? [];
    const sentences = text.split(/[.!?…]+/).map((s) => s.trim()).filter(Boolean);
    const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
    const wordCount = words.length;
    const sentenceCount = sentences.length;
    if (wordCount === 0 || sentenceCount === 0) return null;
    const wps = wordCount / sentenceCount;
    const spw = syllables / wordCount;
    const ease = 206.835 - 1.015 * wps - 84.6 * spw;
    const grade = 0.39 * wps + 11.8 * spw - 15.59;
    return { wordCount, sentenceCount, syllables, ease, grade };
  }, [text]);

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Text to analyze" hint="Paste an article, blog post or paragraph.">
          <TextArea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your text here…" className="min-h-[160px]" />
        </Field>
        {stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="Words" value={String(stats.wordCount)} />
              <Stat label="Sentences" value={String(stats.sentenceCount)} />
              <Stat label="Syllables" value={String(stats.syllables)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Stat label="Reading ease" value={stats.ease.toFixed(1)} accent />
              <Stat label="Flesch-Kincaid grade" value={stats.grade.toFixed(1)} accent />
            </div>
            <Notice>
              Reading ease of <strong className="text-gold-light">{stats.ease.toFixed(1)}</strong> ={" "}
              <strong className="text-gold-light">{easeLabel(stats.ease)}</strong>. Aim for 60–70 for general
              web writing. Grade <strong className="text-gold-light">{stats.grade.toFixed(1)}</strong> ≈ US school
              grade level needed to understand it.
            </Notice>
          </div>
        ) : (
          <Notice>Paste some text with at least one full sentence to see readability scores.</Notice>
        )}
      </div>
    </Card>
  );
}

/* ============================== SERP Preview ============================== */

const TITLE_LIMIT = 60; // chars ≈ 580px in Google results
const DESC_LIMIT = 158; // chars ≈ the two-line snippet length

function LimitBar({ value, limit, label }: { value: number; limit: number; label: string }) {
  const pct = Math.min(100, (value / limit) * 100);
  const over = value > limit;
  return (
    <div className="mt-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-sage">{label}</span>
        <span className={over ? "font-semibold text-amber-300" : "text-sage/70"}>
          {value}/{limit}{over ? " — likely truncated" : ""}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink">
        <div className={`h-full rounded-full ${over ? "bg-amber-400" : "bg-gold"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function SerpPreviewTool() {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");

  let displayHost = "";
  try {
    if (url.trim()) displayHost = new URL(url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`).hostname;
  } catch {
    displayHost = url.trim();
  }

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Title">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your page title" maxLength={160} />
          <LimitBar value={title.length} limit={TITLE_LIMIT} label="Title length (≈580px max width)" />
        </Field>
        <Field label="URL">
          <TextInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="example.com/my-page" inputMode="url" />
        </Field>
        <Field label="Meta description">
          <TextArea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="The snippet shown under your title…" className="min-h-[90px]" />
          <LimitBar value={desc.length} limit={DESC_LIMIT} label="Description length (≈155 chars)" />
        </Field>

        <div>
          <div className="mb-1.5 text-sm font-semibold text-cream">Google-style preview</div>
          <div className="rounded-xl border border-gold/20 bg-ink p-4">
            {displayHost && (
              <div className="text-xs text-sage">
                <span className="mr-1 inline-block h-5 w-5 rounded-full bg-gold/20 text-center leading-5 text-[10px] text-gold-light">
                  {(displayHost[0] ?? "").toUpperCase()}
                </span>
                {displayHost}
              </div>
            )}
            <div className="mt-1 cursor-pointer text-lg leading-snug text-[#8ab4f8] hover:underline">
              {title.trim() || <span className="text-sage/50">Your page title will appear here</span>}
            </div>
            <div className="mt-1 text-sm leading-snug text-cream/70">
              {desc.trim() || <span className="text-sage/50">Your meta description will appear here as the snippet.</span>}
            </div>
          </div>
        </div>
        <Notice>
          Length bars are estimates — Google measures titles in pixels (~580px) and sometimes rewrites descriptions. Keep titles near 60 characters and descriptions near 155.
        </Notice>
      </div>
    </Card>
  );
}

/* ============================== World Clock ============================== */

const CITIES = [
  { label: "Karachi", zone: "Asia/Karachi" },
  { label: "Dubai", zone: "Asia/Dubai" },
  { label: "London", zone: "Europe/London" },
  { label: "New York", zone: "America/New_York" },
  { label: "Los Angeles", zone: "America/Los_Angeles" },
  { label: "Tokyo", zone: "Asia/Tokyo" },
  { label: "Sydney", zone: "Australia/Sydney" },
];

const timeFmt = (zone: string) =>
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: zone });
const dateFmt = (zone: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: zone });

export function WorldClockTool() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card>
      <div className="space-y-3">
        {now === null ? (
          <Notice>Loading clocks…</Notice>
        ) : (
          CITIES.map((c) => (
            <div key={c.zone} className="flex items-center justify-between gap-3 rounded-xl border border-gold/20 bg-ink-2/60 px-4 py-3">
              <div>
                <div className="font-display font-bold text-cream">{c.label}</div>
                <div className="text-xs text-sage">{dateFmt(c.zone).format(now)}</div>
              </div>
              <div className="font-display text-2xl font-bold tabular-nums text-gold-light">
                {timeFmt(c.zone).format(now)}
              </div>
            </div>
          ))
        )}
        <Notice>Times update every second using your browser's timezone database, including daylight saving rules.</Notice>
      </div>
    </Card>
  );
}

/* ============================== Metronome ============================== */

export function MetronomeTool() {
  const [bpm, setBpm] = useState(120);
  const [beats, setBeats] = useState(4);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(0);
  const [error, setError] = useState("");
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const beatRef = useRef(0);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = (tempo: number, perBar: number) => {
    try {
      if (!ctxRef.current) {
        const ctx = audioCtx();
        if (!ctx) throw new Error("no-audio");
        ctxRef.current = ctx;
      }
      if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
      beatRef.current = 0;
      setBeat(1);
      setError("");
      clickBeep(ctxRef.current, true);
      const intervalMs = 60000 / tempo;
      timerRef.current = window.setInterval(() => {
        beatRef.current = (beatRef.current + 1) % perBar;
        setBeat(beatRef.current + 1);
        if (ctxRef.current) clickBeep(ctxRef.current, beatRef.current === 0);
      }, intervalMs);
      setRunning(true);
    } catch {
      setError("Audio playback isn't available in this browser.");
    }
  };

  const stop = () => {
    stopTimer();
    setRunning(false);
    setBeat(0);
  };

  // restart with new tempo / time signature while running
  const handleBpm = (v: number) => {
    setBpm(v);
    if (running) {
      stopTimer();
      start(v, beats);
    }
  };
  const handleBeats = (v: number) => {
    setBeats(v);
    if (running) {
      stopTimer();
      start(bpm, v);
    }
  };

  useEffect(
    () => () => {
      stopTimer();
      ctxRef.current?.close().catch(() => {});
    },
    []
  );

  return (
    <Card>
      <div className="space-y-5">
        <div className="rounded-xl border border-gold/30 bg-ink-2/70 px-4 py-6 text-center">
          <div className="font-display text-5xl font-bold tabular-nums text-gold-light">{bpm}</div>
          <div className="mt-1 text-sm text-sage">beats per minute</div>
          <div className="mt-3 flex items-center justify-center gap-2">
            {Array.from({ length: beats }, (_, i) => (
              <span
                key={i}
                className={`h-4 w-4 rounded-full transition-colors ${
                  running && beat === i + 1
                    ? i === 0
                      ? "bg-gold shadow shadow-gold/60"
                      : "bg-cream shadow shadow-cream/40"
                    : "bg-gold/15"
                }`}
              />
            ))}
          </div>
          {running && <div className="mt-2 text-sm font-semibold text-cream">Beat {beat} of {beats}</div>}
        </div>

        <Field label="Tempo">
          <Slider value={bpm} min={40} max={240} onChange={handleBpm} format={(v) => `${v} BPM`} />
        </Field>
        <Field label="Beats per bar">
          <Slider value={beats} min={1} max={8} onChange={handleBeats} format={(v) => `${v}/4`} />
        </Field>

        <div className="flex flex-wrap gap-2">
          {running ? (
            <Btn onClick={stop}>Stop</Btn>
          ) : (
            <Btn onClick={() => start(bpm, beats)}>Start</Btn>
          )}
        </div>
        {error && <Notice tone="warn">{error}</Notice>}
        <Notice>First beat of each bar is accented. Sound starts only when you press Start (browser autoplay rules).</Notice>
      </div>
    </Card>
  );
}

/* ============================== Alarm Clock ============================== */

function alarmBeep(ctx: AudioContext) {
  for (let i = 0; i < 4; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 990;
    const t = ctx.currentTime + i * 0.45;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.start(t);
    osc.stop(t + 0.4);
  }
}

export function AlarmTool() {
  const [time, setTime] = useState("");
  const [label, setLabel] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [activeLabel, setActiveLabel] = useState("");
  const [ringing, setRinging] = useState(false);
  const [error, setError] = useState("");
  const ctxRef = useRef<AudioContext | null>(null);
  const repeatRef = useRef<number | null>(null);

  const stopRinging = () => {
    if (repeatRef.current !== null) {
      clearInterval(repeatRef.current);
      repeatRef.current = null;
    }
    setRinging(false);
  };

  const setAlarm = () => {
    if (!time) {
      setError("Pick a time first.");
      return;
    }
    try {
      if (!ctxRef.current) {
        const ctx = audioCtx();
        if (!ctx) throw new Error("no-audio");
        ctxRef.current = ctx;
      }
      if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
      setError("");
      setActive(time);
      setActiveLabel(label.trim());
      setRinging(false);
    } catch {
      setError("Audio isn't available, so the alarm can't sound in this browser.");
    }
  };

  const cancel = () => {
    setActive(null);
    setActiveLabel("");
    stopRinging();
  };

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      const d = new Date();
      const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      if (hm === active) {
        setRinging(true);
        if (ctxRef.current) {
          alarmBeep(ctxRef.current);
          repeatRef.current = window.setInterval(() => {
            if (ctxRef.current) alarmBeep(ctxRef.current);
          }, 5000);
        }
        setActive(null);
        setActiveLabel("");
      }
    }, 1000);
    return () => clearInterval(id);
  }, [active]);

  useEffect(
    () => () => {
      if (repeatRef.current !== null) clearInterval(repeatRef.current);
      ctxRef.current?.close().catch(() => {});
    },
    []
  );

  return (
    <Card>
      <div className="space-y-4">
        {ringing && (
          <div className="animate-pulse rounded-xl border border-gold bg-gold/20 px-4 py-6 text-center">
            <div className="font-display text-3xl font-bold text-gold-light">⏰ Alarm!</div>
            {activeLabel && <div className="mt-1 text-cream">{activeLabel}</div>}
            <div className="mt-3">
              <Btn onClick={stopRinging}>Dismiss</Btn>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Alarm time">
            <TextInput type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
          <Field label="Label (optional)">
            <TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Wake up, meeting…" maxLength={60} />
          </Field>
        </div>

        <div className="flex flex-wrap gap-2">
          {active ? (
            <Btn variant="secondary" onClick={cancel}>Cancel alarm ({active})</Btn>
          ) : (
            <Btn onClick={setAlarm}>Set alarm</Btn>
          )}
        </div>

        {error && <Notice tone="warn">{error}</Notice>}
        <Notice>
          ⚠ This tab must stay open for the alarm to ring — browsers can't run page timers in closed tabs. Sound starts
          only after you press Set (browser autoplay rules).
        </Notice>
      </div>
    </Card>
  );
}

/* ============================== Week Number ============================== */

interface WeekResult {
  isoWeek: number;
  isoYear: number;
  dayOfYear: number;
  weekday: string;
  remaining: number;
  formatted: string;
}

function isoWeekOf(d: Date): { week: number; year: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (date.getUTCDay() + 6) % 7; // Monday = 0
  date.setUTCDate(date.getUTCDate() - day + 3); // shift to Thursday
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 864e5));
  return { week, year: date.getUTCFullYear() };
}

export function WeekNumberTool() {
  const [dateStr, setDateStr] = useState("");

  const result: WeekResult | null = useMemo(() => {
    if (!dateStr) return null;
    const d = new Date(`${dateStr}T12:00:00`);
    if (isNaN(d.getTime())) return null;
    const start = new Date(d.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((d.getTime() - start.getTime()) / 864e5) + 1;
    const end = new Date(d.getFullYear() + 1, 0, 1);
    const remaining = Math.floor((end.getTime() - d.getTime()) / 864e5);
    const { week, year } = isoWeekOf(d);
    return {
      isoWeek: week,
      isoYear: year,
      dayOfYear,
      weekday: d.toLocaleDateString("en-GB", { weekday: "long" }),
      remaining,
      formatted: d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    };
  }, [dateStr]);

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Pick a date">
          <TextInput type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
        </Field>
        {result ? (
          <div className="space-y-4">
            <div className="text-sm text-sage">{result.formatted} · {result.weekday}</div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="ISO week" value={String(result.isoWeek)} accent />
              <Stat label="ISO week-numbering year" value={String(result.isoYear)} />
              <Stat label="Day of year" value={String(result.dayOfYear)} />
              <Stat label="Days left in year" value={String(result.remaining)} />
            </div>
            <Notice>
              ISO weeks start on Monday; week 1 is the week containing the first Thursday of the year. Dates near
              1 January can belong to the previous or next ISO year.
            </Notice>
          </div>
        ) : (
          <Notice>Pick a date above to see its ISO week number and day of year.</Notice>
        )}
      </div>
    </Card>
  );
}
