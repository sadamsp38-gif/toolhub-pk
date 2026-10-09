"use client";

import { useMemo, useState } from "react";
import { Card, Check, CopyBtn, Field, Notice, NumInput, Stat, Tabs, TextArea } from "../ui";

/* ============================== Keyword Density ============================== */

const STOPWORDS = [
  "the", "a", "an", "and", "or", "but", "if", "then", "else", "when", "while",
  "of", "to", "in", "on", "at", "for", "with", "by", "from", "as", "into",
  "is", "are", "was", "were", "be", "been", "being", "do", "does", "did",
  "has", "have", "had", "will", "would", "can", "could", "should", "may",
  "might", "must", "shall", "not", "no", "yes", "so", "too", "very",
  "it", "its", "this", "that", "these", "those", "i", "you", "he", "she",
  "we", "they", "them", "his", "her", "their", "our", "my", "your",
];

const STOP_SET = new Set(STOPWORDS);

export function KeywordDensityTool() {
  const [text, setText] = useState("");
  const [ignoreStop, setIgnoreStop] = useState(true);
  const [minLen, setMinLen] = useState("3");

  const analysis = useMemo(() => {
    const min = Math.max(1, parseInt(minLen, 10) || 3);
    const words = text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
    const filtered = words.filter((w) => w.length >= min && (!ignoreStop || !STOP_SET.has(w)));
    const counts = new Map<string, number>();
    for (const w of filtered) counts.set(w, (counts.get(w) ?? 0) + 1);
    const total = filtered.length;
    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count, density: total > 0 ? (count / total) * 100 : 0 }));
    const maxDensity = top.length > 0 ? top[0].density : 0;
    return { total, unique: counts.size, top, maxDensity };
  }, [text, ignoreStop, minLen]);

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Text to analyze">
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your article or page content here…"
            className="min-h-[160px]"
          />
        </Field>
        <div className="flex flex-wrap items-center gap-4">
          <Check label="Ignore common words" checked={ignoreStop} onChange={setIgnoreStop} />
          <Field label="Min word length">
            <NumInput value={minLen} onChange={setMinLen} min={1} max={10} className="max-w-[90px]" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Total words" value={String(analysis.total)} />
          <Stat label="Unique words" value={String(analysis.unique)} accent />
        </div>
        {analysis.top.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-cream">Top keywords</div>
            <ul className="space-y-1.5">
              {analysis.top.map((k) => (
                <li key={k.word} className="rounded-lg border border-gold/20 bg-ink-2/60 px-3 py-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-cream">{k.word}</span>
                    <span className="tabular-nums text-sage">
                      ×{k.count} · <span className="text-gold-light">{k.density.toFixed(2)}%</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{ width: `${analysis.maxDensity > 0 ? (k.density / analysis.maxDensity) * 100 : 0}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <Notice>Paste some text above to see keyword density.</Notice>
        )}
      </div>
    </Card>
  );
}

/* ============================== HTML Encoder ============================== */

export function HtmlEncoderTool() {
  const [tab, setTab] = useState("Encode");
  const [input, setInput] = useState("");

  const encoded = useMemo(
    () =>
      input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;"),
    [input]
  );

  const decoded = useMemo(
    () =>
      input
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&"),
    [input]
  );

  const output = tab === "Encode" ? encoded : decoded;

  return (
    <Card>
      <div className="space-y-4">
        <Tabs tabs={["Encode", "Decode"]} active={tab} onChange={setTab} />
        <Field label="Input">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={tab === "Encode" ? "HTML / text to encode…" : "HTML-encoded text to decode…"}
          />
        </Field>
        <Field label="Output">
          <pre className="max-h-56 min-h-[120px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-gold/25 bg-ink/80 px-3.5 py-2.5 font-mono text-sm text-cream">
            {output || <span className="text-sage/50">Output appears here…</span>}
          </pre>
        </Field>
        {output && <CopyBtn text={output} />}
      </div>
    </Card>
  );
}

/* ============================== JWT Decoder ============================== */

function b64urlDecode(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  return decodeURIComponent(escape(atob(padded)));
}

type JwtResult =
  | { state: "empty" }
  | { state: "invalid"; error: string }
  | { state: "ok"; header: string; payload: string };

export function JwtDecoderTool() {
  const [token, setToken] = useState("");

  const result: JwtResult = useMemo(() => {
    const t = token.trim();
    if (!t) return { state: "empty" };
    const parts = t.split(".");
    if (parts.length !== 3) return { state: "invalid", error: "A JWT has exactly 3 dot-separated parts." };
    try {
      const header = JSON.stringify(JSON.parse(b64urlDecode(parts[0])), null, 2);
      const payload = JSON.stringify(JSON.parse(b64urlDecode(parts[1])), null, 2);
      return { state: "ok", header, payload };
    } catch (e) {
      return { state: "invalid", error: e instanceof Error ? e.message : "Could not decode token." };
    }
  }, [token]);

  const monoBox = "max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-gold/25 bg-ink/80 px-3.5 py-2.5 font-mono text-sm text-cream";

  return (
    <Card>
      <div className="space-y-4">
        <Field label="JWT">
          <TextArea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste a JWT (eyJhbGciOi…)"
            className="min-h-[100px]"
          />
        </Field>
        <Notice tone="warn">
          🔒 Signature NOT verified — this tool only decodes. Never paste sensitive tokens.
        </Notice>
        {result.state === "invalid" && <Notice tone="warn">⚠ {result.error}</Notice>}
        {result.state === "ok" && (
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 text-sm font-semibold text-cream">Header</div>
              <pre className={monoBox}>{result.header}</pre>
            </div>
            <div>
              <div className="mb-1.5 text-sm font-semibold text-cream">Payload</div>
              <pre className={monoBox}>{result.payload}</pre>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
