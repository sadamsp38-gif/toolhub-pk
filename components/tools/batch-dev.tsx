"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Btn, Card, Check, CopyBtn, downloadBlob, Field, FileDrop, Notice, NumInput,
  Select, Slider, Stat, Tabs, TextArea, TextInput,
} from "../ui";

/* ============================== Regex Tester ============================== */

interface RegexSeg { text: string; matchIdx: number | null; }
interface RegexMatchInfo {
  index: number;
  text: string;
  groups: (string | undefined)[];
  named: [string, string | undefined][];
}
type RegexResult =
  | { state: "empty" }
  | { state: "error"; message: string }
  | { state: "ok"; segments: RegexSeg[]; matches: RegexMatchInfo[]; truncated: boolean };

const REGEX_FLAGS = [
  { f: "g", label: "global — find all matches" },
  { f: "i", label: "case-insensitive" },
  { f: "m", label: "multiline — ^ $ per line" },
  { f: "s", label: "dotAll — . matches newlines" },
  { f: "u", label: "unicode" },
];

export function RegexTesterTool() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState<string[]>(["g"]);
  const [test, setTest] = useState("");

  const result: RegexResult = useMemo(() => {
    if (!pattern) return { state: "empty" };
    if (pattern.length > 500) return { state: "error", message: "Pattern is too long — keep it under 500 characters." };
    if (test.length > 20000) return { state: "error", message: "Test text is too long — keep it under 20,000 characters." };
    let re: RegExp;
    try {
      re = new RegExp(pattern, flags.join(""));
    } catch (e) {
      return { state: "error", message: e instanceof Error ? e.message : "Invalid regular expression." };
    }
    const matches: RegexMatchInfo[] = [];
    const segments: RegexSeg[] = [];
    let last = 0;
    let truncated = false;
    const push = (m: RegExpExecArray) => {
      if (m.index > last) segments.push({ text: test.slice(last, m.index), matchIdx: null });
      segments.push({ text: m[0], matchIdx: matches.length });
      matches.push({
        index: m.index,
        text: m[0],
        groups: Array.from(m).slice(1),
        named: m.groups ? (Object.entries(m.groups) as [string, string | undefined][]) : [],
      });
      last = m.index + m[0].length;
    };
    try {
      if (!re.global) {
        const m = re.exec(test);
        if (m) push(m);
      } else {
        re.lastIndex = 0;
        for (let i = 0; i < 200; i++) {
          const m = re.exec(test);
          if (!m) break;
          push(m);
          if (m[0].length === 0) re.lastIndex += 1; // never stall on empty matches
          if (i === 199) truncated = true;
        }
      }
    } catch {
      return { state: "error", message: "The engine gave up on this pattern — simplify nested quantifiers like (a+)+ and try again." };
    }
    if (last < test.length) segments.push({ text: test.slice(last), matchIdx: null });
    return { state: "ok", segments, matches, truncated };
  }, [pattern, flags, test]);

  const toggleFlag = (f: string, on: boolean) =>
    setFlags(on ? [...flags, f] : flags.filter((x) => x !== f));

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Regular expression">
          <TextInput value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="e.g. (\w+)@(\w+\.\w+)" className="font-mono" spellCheck={false} />
        </Field>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {REGEX_FLAGS.map((d) => (
            <Check key={d.f} label={`${d.f} · ${d.label}`} checked={flags.includes(d.f)} onChange={(v) => toggleFlag(d.f, v)} />
          ))}
        </div>
        <Field label="Test string">
          <TextArea value={test} onChange={(e) => setTest(e.target.value)} placeholder="Paste text to test against…" className="min-h-[140px]" spellCheck={false} />
        </Field>
        {result.state === "error" && <Notice tone="warn">⚠ {result.message}</Notice>}
        {result.state === "empty" && <Notice>Type a pattern above — matches highlight live as you type.</Notice>}
        {result.state === "ok" && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-cream">Matches</span>
              <span className="rounded-full bg-gold/15 px-3 py-0.5 text-sm font-bold text-gold-light">{result.matches.length} found</span>
            </div>
            {result.truncated && <Notice tone="warn">⚠ Showing the first 200 matches only.</Notice>}
            <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-gold/25 bg-ink/80 px-3.5 py-2.5 font-mono text-sm text-cream">
              {result.segments.map((s, i) =>
                s.matchIdx !== null ? (
                  <mark key={i} className="rounded bg-gold/50 px-0.5 text-ink">{s.text}</mark>
                ) : (
                  <span key={i}>{s.text}</span>
                )
              )}
              {result.segments.length === 0 && <span className="text-sage/50">No text to highlight…</span>}
            </pre>
            {result.matches.length > 0 && (
              <div className="max-h-72 space-y-2 overflow-auto">
                {result.matches.map((m, i) => (
                  <div key={i} className="rounded-lg border border-gold/20 bg-ink-2/60 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="break-all font-mono text-gold-light">
                        {m.text || <span className="text-sage/60">(empty match)</span>}
                      </span>
                      <span className="shrink-0 text-xs text-sage">#{i + 1} · index {m.index}</span>
                    </div>
                    {(m.groups.length > 0 || m.named.length > 0) && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                        {m.groups.map((g, gi) => (
                          <span key={gi} className="rounded bg-ink px-1.5 py-0.5 font-mono text-cream">
                            <span className="text-sage">{`$${gi + 1}:`}</span> {g ?? <span className="text-sage/50">∅</span>}
                          </span>
                        ))}
                        {m.named.map(([name, val]) => (
                          <span key={name} className="rounded bg-ink px-1.5 py-0.5 font-mono text-cream">
                            <span className="text-sage">{name}:</span> {val ?? <span className="text-sage/50">∅</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

/* ============================== Cron Describer ============================== */

const CRON_MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const CRON_DOW: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const CRON_ALIASES: Record<string, string> = {
  "@yearly": "0 0 1 1 *", "@annually": "0 0 1 1 *", "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0", "@daily": "0 0 * * *", "@midnight": "0 0 * * *", "@hourly": "0 * * * *",
};

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function cronToken(tok: string, min: number, max: number, names: Record<string, number>): number | null {
  const t = tok.trim().toLowerCase();
  if (!t) return null;
  if (/^\d+$/.test(t)) {
    const n = parseInt(t, 10);
    const norm = n === 7 && min === 0 ? 0 : n; // Sunday alias
    return norm >= min && norm <= max ? norm : null;
  }
  const v = names[t];
  return v === undefined ? null : v;
}

interface CronField { ok: boolean; error: string; every: boolean; values: number[]; summary: string; }

function parseCronField(
  field: string, min: number, max: number, names: Record<string, number>,
  label: string, plural: string, fmt: (n: number) => string
): CronField {
  const fail = (error: string): CronField => ({ ok: false, error, every: false, values: [], summary: "" });
  if (field === "*") return { ok: true, error: "", every: true, values: [], summary: `every ${label}` };
  const values = new Set<number>();
  const notes: string[] = [];
  for (const raw of field.split(",")) {
    const part = raw.trim();
    if (!part) return fail(`Empty entry in the ${label} field — check for stray commas.`);
    const slash = part.indexOf("/");
    let rangePart = part;
    let step = 1;
    if (slash >= 0) {
      rangePart = part.slice(0, slash);
      const stepStr = part.slice(slash + 1);
      if (!/^\d+$/.test(stepStr) || parseInt(stepStr, 10) < 1)
        return fail(`Bad step in "${part}" — steps must be positive numbers.`);
      step = parseInt(stepStr, 10);
    }
    let start: number, end: number;
    if (rangePart === "*") { start = min; end = max; }
    else if (rangePart.includes("-")) {
      const [a, b] = rangePart.split("-").map((x) => x.trim());
      const na = cronToken(a, min, max, names);
      const nb = cronToken(b, min, max, names);
      if (na === null || nb === null) return fail(`"${rangePart}" is outside the ${label} range (${min}–${max}).`);
      if (na > nb) return fail(`Range "${rangePart}" runs backwards — the start must come first.`);
      start = na; end = nb;
    } else {
      const n = cronToken(rangePart, min, max, names);
      if (n === null) return fail(`"${rangePart}" is not a valid ${label} (use ${min}–${max}).`);
      start = n; end = n;
    }
    for (let v = start; v <= end; v += step) values.add(v);
    if (rangePart === "*") notes.push(step > 1 ? `every ${step} ${plural}` : `every ${label}`);
    else if (step > 1) notes.push(`every ${step} ${plural} from ${fmt(start)} to ${fmt(end)}`);
    else if (start !== end) notes.push(`${fmt(start)} to ${fmt(end)}`);
    else notes.push(fmt(start));
  }
  const sorted = [...values].sort((a, b) => a - b);
  return { ok: true, error: "", every: false, values: sorted, summary: notes.join(", ") };
}

function fmtClock(h: number, m: number): string {
  const ap = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(m).padStart(2, "0");
  return `${h12}:${mm} ${ap} (${String(h).padStart(2, "0")}:${mm})`;
}

interface CronResult { ok: boolean; text: string; error: string; breakdown: string[]; }

function describeCron(expr: string): CronResult {
  const empty: CronResult = { ok: false, text: "", error: "", breakdown: [] };
  const raw = expr.trim().toLowerCase();
  if (!raw) return empty;
  const expanded = CRON_ALIASES[raw] ?? raw;
  const parts = expanded.split(/\s+/);
  if (parts.length !== 5)
    return { ...empty, error: `A cron schedule needs exactly 5 fields — minute, hour, day-of-month, month, day-of-week. You gave ${parts.length}.` };
  const fMin = parseCronField(parts[0], 0, 59, {}, "minute", "minutes", String);
  const fHr = parseCronField(parts[1], 0, 23, {}, "hour", "hours", String);
  const fDom = parseCronField(parts[2], 1, 31, {}, "day of the month", "days", ordinal);
  const fMon = parseCronField(parts[3], 1, 12, CRON_MONTHS, "month", "months", (n) => MONTH_FULL[n - 1]);
  const fDow = parseCronField(parts[4], 0, 7, CRON_DOW, "day of the week", "days", (n) => DOW_FULL[n === 7 ? 0 : n]);
  for (const f of [fMin, fHr, fDom, fMon, fDow]) if (!f.ok) return { ...empty, error: f.error };
  const dowVals = [...new Set(fDow.values.map((v) => (v === 7 ? 0 : v)))].sort((a, b) => a - b);

  let timePart: string;
  if (fMin.every && fHr.every) timePart = "Runs every minute";
  else if (fHr.every && fMin.values.length > 0)
    timePart = fMin.summary.startsWith("every")
      ? `Runs ${fMin.summary} of every hour`
      : `Runs every hour at minute${fMin.values.length > 1 ? "s" : ""} ${fMin.summary}`;
  else if (fMin.every && fHr.values.length > 0) timePart = `Runs every minute during hour${fHr.values.length > 1 ? "s" : ""} ${fHr.summary}`;
  else if (fMin.values.length === 1 && fHr.values.length === 1) timePart = `Runs at ${fmtClock(fHr.values[0], fMin.values[0])}`;
  else timePart = `Runs at minute(s) ${fMin.summary} of hour(s) ${fHr.summary}`;

  let dayPart = "every day";
  if (!fDom.every && fDow.every) dayPart = `on the ${fDom.summary} of each month`;
  else if (fDom.every && !fDow.every) dayPart = `on ${dowVals.map((n) => DOW_FULL[n]).join(", ")}`;
  else if (!fDom.every && !fDow.every) dayPart = `on the ${fDom.summary} of the month and on ${dowVals.map((n) => DOW_FULL[n]).join(", ")}`;

  const monPart = fMon.every ? "" : ` in ${fMon.summary}`;
  return {
    ok: true,
    text: `${timePart}, ${dayPart}${monPart}.`,
    error: "",
    breakdown: [
      `Minute — ${fMin.summary}`,
      `Hour — ${fHr.summary}`,
      `Day of month — ${fDom.summary}`,
      `Month — ${fMon.summary}`,
      `Day of week — ${fDow.summary}`,
    ],
  };
}

const CRON_PRESETS: { label: string; expr: string }[] = [
  { label: "Every minute", expr: "* * * * *" },
  { label: "Hourly", expr: "0 * * * *" },
  { label: "Daily 9 AM", expr: "0 9 * * *" },
  { label: "Weekdays, every 15 min 9–5", expr: "*/15 9-17 * * 1-5" },
  { label: "Monday 8 AM", expr: "0 8 * * 1" },
  { label: "1st of month", expr: "0 0 1 * *" },
];

export function CronDescriberTool() {
  const [expr, setExpr] = useState("*/15 9-17 * * 1-5");
  const result = useMemo(() => describeCron(expr), [expr]);
  return (
    <Card>
      <div className="space-y-4">
        <Field label="Cron expression" hint="5 fields: minute · hour · day of month · month · day of week">
          <TextInput value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="e.g. 30 8 * * 1-5" className="font-mono" spellCheck={false} />
        </Field>
        <div className="flex flex-wrap gap-2">
          {CRON_PRESETS.map((p) => (
            <Btn key={p.label} variant="secondary" onClick={() => setExpr(p.expr)} className="px-3 py-1.5 text-sm">{p.label}</Btn>
          ))}
        </div>
        {result.error && <Notice tone="warn">⚠ {result.error}</Notice>}
        {result.ok && (
          <>
            <div className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 font-display text-lg font-bold text-gold-light">
              {result.text}
            </div>
            <ul className="space-y-1.5">
              {result.breakdown.map((b) => (
                <li key={b} className="rounded-lg border border-gold/20 bg-ink-2/60 px-3 py-2 text-sm text-cream">{b}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Card>
  );
}

/* ============================== Timestamp Converter ============================== */

type TsResult = { ok: false; message: string } | { ok: true; utc: string; local: string; seconds: string; millis: string };

export function TimestampTool() {
  const [tab, setTab] = useState("Timestamp → Date");
  const [unit, setUnit] = useState("Seconds");
  const [input, setInput] = useState("");

  const useNow = () => {
    const ms = Date.now();
    setInput(unit === "Seconds" ? String(Math.floor(ms / 1000)) : String(ms));
  };

  const result: TsResult | null = useMemo(() => {
    const t = input.trim();
    if (!t) return null;
    if (tab === "Timestamp → Date") {
      const n = Number(t);
      if (!Number.isFinite(n)) return { ok: false, message: "Enter a numeric timestamp, e.g. 1728400000." };
      const d = new Date(unit === "Seconds" ? n * 1000 : n);
      if (Number.isNaN(d.getTime())) return { ok: false, message: "That number is out of range for a date." };
      return {
        ok: true,
        utc: d.toISOString(),
        local: d.toLocaleString(),
        seconds: String(Math.floor(d.getTime() / 1000)),
        millis: String(d.getTime()),
      };
    }
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) return { ok: false, message: "Could not parse that date — try 2026-10-09 17:30 or an ISO string." };
    return {
      ok: true,
      utc: d.toISOString(),
      local: d.toLocaleString(),
      seconds: String(Math.floor(d.getTime() / 1000)),
      millis: String(d.getTime()),
    };
  }, [tab, unit, input]);

  const monoBox = "whitespace-pre-wrap break-all rounded-xl border border-gold/25 bg-ink/80 px-3.5 py-2.5 font-mono text-sm text-cream";

  return (
    <Card>
      <div className="space-y-4">
        <Tabs tabs={["Timestamp → Date", "Date → Timestamp"]} active={tab} onChange={setTab} />
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <Field label={tab === "Timestamp → Date" ? "Unix timestamp" : "Date / time"}>
              <TextInput
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={tab === "Timestamp → Date" ? "e.g. 1728400000" : "e.g. 2026-10-09 17:30"}
                className="font-mono"
                spellCheck={false}
              />
            </Field>
          </div>
          {tab === "Timestamp → Date" && (
            <Field label="Unit">
              <Select
                value={unit}
                onChange={setUnit}
                options={[
                  { value: "Seconds", label: "Seconds" },
                  { value: "Milliseconds", label: "Milliseconds" },
                ]}
              />
            </Field>
          )}
          <Btn variant="secondary" onClick={useNow}>Use current time</Btn>
        </div>
        {result && !result.ok && <Notice tone="warn">⚠ {result.message}</Notice>}
        {result && result.ok && (
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 text-sm font-semibold text-cream">UTC (ISO)</div>
              <pre className={monoBox}>{result.utc}</pre>
            </div>
            <div>
              <div className="mb-1.5 text-sm font-semibold text-cream">Your local time</div>
              <pre className={monoBox}>{result.local}</pre>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1.5 text-sm font-semibold text-cream">Seconds</div>
                <pre className={monoBox}>{result.seconds}</pre>
              </div>
              <div>
                <div className="mb-1.5 text-sm font-semibold text-cream">Milliseconds</div>
                <pre className={monoBox}>{result.millis}</pre>
              </div>
            </div>
            <CopyBtn text={result.utc} label="Copy ISO" />
          </div>
        )}
      </div>
    </Card>
  );
}

/* ============================== MD5 Generator ============================== */

function md5Bytes(input: Uint8Array): string {
  const bytes: number[] = Array.from(input);
  const bitLen = input.length * 8;
  const lo = bitLen >>> 0;
  const hi = Math.floor(bitLen / 0x100000000) >>> 0;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  bytes.push(lo & 0xff, (lo >>> 8) & 0xff, (lo >>> 16) & 0xff, (lo >>> 24) & 0xff);
  bytes.push(hi & 0xff, (hi >>> 8) & 0xff, (hi >>> 16) & 0xff, (hi >>> 24) & 0xff);

  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const K: number[] = [];
  for (let i = 0; i < 64; i++) K.push(Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0);

  const rotl = (x: number, c: number): number => ((x << c) | (x >>> (32 - c))) >>> 0;
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  for (let off = 0; off < bytes.length; off += 64) {
    const M: number[] = [];
    for (let i = 0; i < 16; i++)
      M.push((bytes[off + i * 4] | (bytes[off + i * 4 + 1] << 8) | (bytes[off + i * 4 + 2] << 16) | (bytes[off + i * 4 + 3] << 24)) >>> 0);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) >>> 0;
      A = D; D = C; C = B;
      B = (B + rotl(F, S[i])) >>> 0;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  const hex = (n: number): string => {
    let s = "";
    for (let i = 0; i < 4; i++) s += ("0" + ((n >>> (i * 8)) & 0xff).toString(16)).slice(-2);
    return s;
  };
  return hex(a0) + hex(b0) + hex(c0) + hex(d0);
}

function md5Text(s: string): string {
  const utf8 = unescape(encodeURIComponent(s));
  const bytes = new Uint8Array(utf8.length);
  for (let i = 0; i < utf8.length; i++) bytes[i] = utf8.charCodeAt(i);
  return md5Bytes(bytes);
}

export function Md5Tool() {
  const [tab, setTab] = useState("Text");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileHash, setFileHash] = useState("");
  const [hashing, setHashing] = useState(false);
  const [upper, setUpper] = useState(false);

  const textHash = useMemo(() => (text ? md5Text(text) : ""), [text]);

  const onFiles = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFileName(f.name);
    setFileHash("");
    setHashing(true);
    const reader = new FileReader();
    reader.onload = () => {
      const buf = reader.result as ArrayBuffer | null;
      if (buf) setFileHash(md5Bytes(new Uint8Array(buf)));
      setHashing(false);
    };
    reader.onerror = () => setHashing(false);
    reader.readAsArrayBuffer(f);
  };

  const hash = tab === "Text" ? textHash : fileHash;
  const shown = upper ? hash.toUpperCase() : hash;

  return (
    <Card>
      <div className="space-y-4">
        <Tabs tabs={["Text", "File"]} active={tab} onChange={setTab} />
        {tab === "Text" ? (
          <Field label="Text to hash">
            <TextArea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste text…" className="min-h-[140px]" />
          </Field>
        ) : (
          <FileDrop accept="*/*" onFiles={onFiles} label={fileName || "Drop a file to hash"} />
        )}
        {tab === "File" && hashing && <Notice>Hashing {fileName}…</Notice>}
        {shown && (
          <>
            <Field label="MD5 hash">
              <pre className="break-all whitespace-pre-wrap rounded-xl border border-gold/25 bg-ink/80 px-3.5 py-2.5 font-mono text-sm text-gold-light">{shown}</pre>
            </Field>
            <div className="flex flex-wrap items-center gap-4">
              <CopyBtn text={shown} label="Copy hash" />
              <Check label="Uppercase" checked={upper} onChange={setUpper} />
            </div>
          </>
        )}
        <Notice>MD5 is a one-way checksum — handy for verifying file integrity, but never use it for passwords (use bcrypt or argon2).</Notice>
      </div>
    </Card>
  );
}

/* ============================== SQL Formatter ============================== */

const SQL_CLAUSES = [
  "GROUP BY", "ORDER BY", "UNION ALL", "INSERT INTO", "DELETE FROM",
  "LEFT OUTER JOIN", "RIGHT OUTER JOIN", "FULL OUTER JOIN",
  "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "INNER JOIN", "OUTER JOIN", "CROSS JOIN",
  "SELECT", "FROM", "WHERE", "HAVING", "LIMIT", "OFFSET", "JOIN", "ON",
  "VALUES", "SET", "UPDATE", "UNION",
];
const SQL_EXTRA_UPPER = ["AND", "OR", "NOT", "NULL", "AS", "DISTINCT", "IN", "BETWEEN", "LIKE", "IS", "ASC", "DESC"];

function formatSql(input: string, upper: boolean): { text: string; error: string } {
  if (!input.trim()) return { text: "", error: "" };
  const literals: string[] = [];
  const masked = input.replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, (m) => {
    literals.push(m);
    return `\u0000${literals.length - 1}\u0000`;
  });
  let s = masked.replace(/\s+/g, " ").trim();
  if (upper) {
    for (const k of [...SQL_CLAUSES, ...SQL_EXTRA_UPPER]) {
      s = s.replace(new RegExp(`\\b${k.replace(/ /g, "\\s+")}\\b`, "gi"), k);
    }
  }
  for (const k of SQL_CLAUSES) {
    const pat = k === "UNION"
      ? "\\bUNION\\b(?! ALL\\b)"
      : k === "JOIN"
        ? "(?<!LEFT |RIGHT |FULL |INNER |OUTER |CROSS )\\bJOIN\\b"
        : `\\b${k.replace(/ /g, "\\s+")}\\b`;
    s = s.replace(new RegExp(pat, "g"), `\n${k}\n`);
  }
  s = s.replace(/\bAND\b/g, "\nAND ").replace(/\bOR\b/g, "\nOR ");
  s = s.replace(/,/g, ",\n");
  s = s.replace(/\(/g, "(\n").replace(/\)/g, "\n)\n");
  s = s.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => literals[Number(i)]);
  const lines = s.split("\n").map((l) => l.trim().replace(/ {2,}/g, " ")).filter((l) => l.length > 0);
  let depth = 0;
  const out: string[] = [];
  for (const line of lines) {
    if (line.startsWith(")")) depth = Math.max(0, depth - 1);
    out.push(`${"  ".repeat(depth)}${line}`);
    const opens = (line.match(/\(/g) ?? []).length;
    const closes = (line.match(/\)/g) ?? []).length;
    depth = Math.max(0, depth + opens - closes);
  }
  return {
    text: out.join("\n"),
    error: depth !== 0 ? "Unbalanced parentheses — check your query." : "",
  };
}

export function SqlFormatterTool() {
  const [input, setInput] = useState("select id, name from users where age > 18 and city = 'Karachi' order by name;");
  const [upper, setUpper] = useState(true);
  const result = useMemo(() => formatSql(input, upper), [input, upper]);
  return (
    <Card>
      <div className="space-y-4">
        <Field label="SQL query">
          <TextArea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste your SQL…" className="min-h-[150px]" spellCheck={false} />
        </Field>
        <div className="flex flex-wrap items-center gap-4">
          <Check label="Uppercase keywords" checked={upper} onChange={setUpper} />
          {result.text && <CopyBtn text={result.text} label="Copy formatted" />}
        </div>
        {result.error && <Notice tone="warn">⚠ {result.error}</Notice>}
        {result.text && (
          <Field label="Formatted">
            <pre className="max-h-96 overflow-auto whitespace-pre rounded-xl border border-gold/25 bg-ink/80 px-3.5 py-2.5 font-mono text-sm text-cream">{result.text}</pre>
          </Field>
        )}
      </div>
    </Card>
  );
}

/* ============================== CSS Minifier ============================== */

function minifyCss(css: string): string {
  let out = "";
  let i = 0;
  const n = css.length;
  while (i < n) {
    const c = css[i];
    if (c === "/" && css[i + 1] === "*") {
      i += 2;
      while (i < n && !(css[i] === "*" && css[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'") {
      out += c;
      i++;
      while (i < n) {
        out += css[i];
        if (css[i] === "\\" && i + 1 < n) { out += css[i + 1]; i += 2; continue; }
        i++;
        if (css[i - 1] === c) break;
      }
      continue;
    }
    out += c;
    i++;
  }
  return out
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

export function CssMinifierTool() {
  const [input, setInput] = useState("");
  const output = useMemo(() => (input.trim() ? minifyCss(input) : ""), [input]);
  const before = input.length;
  const after = output.length;
  const saved = before > 0 ? Math.round(((before - after) / before) * 100) : 0;
  return (
    <Card>
      <div className="space-y-4">
        <Field label="CSS input">
          <TextArea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste your CSS…" className="min-h-[160px]" spellCheck={false} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Before" value={`${before} B`} />
          <Stat label="After" value={`${after} B`} accent />
          <Stat label="Saved" value={`${saved}%`} />
        </div>
        {output && (
          <>
            <Field label="Minified">
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-gold/25 bg-ink/80 px-3.5 py-2.5 font-mono text-sm text-cream">{output}</pre>
            </Field>
            <CopyBtn text={output} label="Copy minified" />
          </>
        )}
      </div>
    </Card>
  );
}

/* ============================== HTML Prettier ============================== */

const HTML_VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

function prettifyHtml(html: string): { text: string; warning: string } {
  if (!html.trim()) return { text: "", warning: "" };
  const tokens = html.match(/<!--[\s\S]*?-->|<![^>]*>|<\/?[a-zA-Z][^>]*>|[^<]+/g) ?? [];
  let depth = 0;
  const lines: string[] = [];
  for (const tok of tokens) {
    const t = tok.trim();
    if (!t) continue;
    if (t.startsWith("<!--") || t.startsWith("<!")) { lines.push(`${"  ".repeat(depth)}${t}`); continue; }
    if (t.startsWith("</")) { depth = Math.max(0, depth - 1); lines.push(`${"  ".repeat(depth)}${t}`); continue; }
    if (!t.startsWith("<")) { lines.push(`${"  ".repeat(depth)}${t}`); continue; }
    const name = t.slice(1).split(/[\s/>]/)[0].toLowerCase();
    const selfClose = t.endsWith("/>") || HTML_VOID.has(name);
    lines.push(`${"  ".repeat(depth)}${t}`);
    if (!selfClose) depth++;
  }
  return {
    text: lines.join("\n"),
    warning: depth > 0 ? "Some tags were never closed — check the end of your markup." : "",
  };
}

export function HtmlPrettierTool() {
  const [input, setInput] = useState("");
  const result = useMemo(() => prettifyHtml(input), [input]);
  return (
    <Card>
      <div className="space-y-4">
        <Field label="HTML input">
          <TextArea value={input} onChange={(e) => setInput(e.target.value)} placeholder="<div><p>Hello</p></div>" className="min-h-[160px]" spellCheck={false} />
        </Field>
        {result.warning && <Notice tone="warn">⚠ {result.warning}</Notice>}
        {result.text && (
          <>
            <Field label="Indented">
              <pre className="max-h-96 overflow-auto whitespace-pre rounded-xl border border-gold/25 bg-ink/80 px-3.5 py-2.5 font-mono text-sm text-cream">{result.text}</pre>
            </Field>
            <CopyBtn text={result.text} label="Copy indented" />
          </>
        )}
      </div>
    </Card>
  );
}

/* ============================== Nanoid Generator ============================== */

const NANO_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function makeNanoId(len: number): string {
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  let id = "";
  for (let i = 0; i < len; i++) id += NANO_ALPHABET[buf[i] & 63];
  return id;
}

export function NanoidTool() {
  const [length, setLength] = useState(21);
  const [count, setCount] = useState("5");
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(Array.from({ length: 5 }, () => makeNanoId(21)));
  }, []);

  const generate = () => {
    const n = Math.min(50, Math.max(1, parseInt(count, 10) || 5));
    setIds(Array.from({ length: n }, () => makeNanoId(length)));
  };

  return (
    <Card>
      <div className="space-y-4">
        <Field label="ID length">
          <Slider value={length} min={8} max={64} onChange={setLength} format={(v) => `${v} chars`} />
        </Field>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="How many">
            <NumInput value={count} onChange={setCount} min={1} max={50} className="max-w-[100px]" />
          </Field>
          <Btn onClick={generate}>Generate</Btn>
          {ids.length > 0 && <CopyBtn text={ids.join("\n")} label="Copy all" />}
        </div>
        <Notice>IDs use A–Z, a–z, 0–9, hyphen and underscore — URL-safe, generated with your browser&apos;s cryptographic random source.</Notice>
        {ids.length > 0 && (
          <ul className="space-y-2">
            {ids.map((id) => (
              <li key={id} className="flex items-center justify-between gap-2 rounded-lg border border-gold/20 bg-ink-2/60 px-3 py-2">
                <span className="break-all font-mono text-sm text-cream">{id}</span>
                <CopyBtn text={id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

/* ============================== Color Contrast ============================== */

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function relLuminance([r, g, b]: [number, number, number]): number {
  const f = (c: number): number => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function safeHex(hex: string): string {
  return /^#[0-9a-f]{6}$/i.test(hex.trim()) ? hex.trim() : "#000000";
}

function ContrastBadge({ label, pass }: { label: string; pass: boolean }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-bold ${
        pass ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" : "border-red-500/40 bg-red-500/10 text-red-300"
      }`}
    >
      {pass ? "✓" : "✗"} {label}
    </span>
  );
}

export function ColorContrastTool() {
  const [fg, setFg] = useState("#f5e9c8");
  const [bg, setBg] = useState("#141a2e");

  const ratio = useMemo(() => {
    const f = hexToRgb(fg);
    const b = hexToRgb(bg);
    if (!f || !b) return null;
    const l1 = relLuminance(f);
    const l2 = relLuminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }, [fg, bg]);

  const swap = () => {
    setFg(bg);
    setBg(fg);
  };

  const verdict = ratio === null ? "" : ratio >= 7 ? "Excellent" : ratio >= 4.5 ? "Good" : ratio >= 3 ? "Fair" : "Poor";

  return (
    <Card>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Text color">
            <div className="flex items-center gap-2">
              <input type="color" value={safeHex(fg)} onChange={(e) => setFg(e.target.value)} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-gold/25 bg-ink" aria-label="Text color picker" />
              <TextInput value={fg} onChange={(e) => setFg(e.target.value)} className="font-mono" spellCheck={false} />
            </div>
          </Field>
          <Field label="Background color">
            <div className="flex items-center gap-2">
              <input type="color" value={safeHex(bg)} onChange={(e) => setBg(e.target.value)} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-gold/25 bg-ink" aria-label="Background color picker" />
              <TextInput value={bg} onChange={(e) => setBg(e.target.value)} className="font-mono" spellCheck={false} />
            </div>
          </Field>
        </div>
        <Btn variant="secondary" onClick={swap}>⇄ Swap colors</Btn>
        {ratio === null ? (
          <Notice tone="warn">⚠ Enter valid HEX codes (e.g. #f5e9c8 or f5e9c8).</Notice>
        ) : (
          <>
            <div
              className="rounded-xl border border-gold/25 p-5 text-center"
              style={{ backgroundColor: safeHex(bg), color: safeHex(fg) }}
            >
              <div className="font-display text-2xl font-bold">The quick brown fox jumps</div>
              <div className="mt-1 text-sm">Small sample text at 14px — how readable is it?</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Contrast ratio" value={`${ratio.toFixed(2)} : 1`} accent />
              <Stat label="Verdict" value={verdict} />
            </div>
            <div className="flex flex-wrap gap-2">
              <ContrastBadge label="AA normal (4.5+)" pass={ratio >= 4.5} />
              <ContrastBadge label="AA large (3+)" pass={ratio >= 3} />
              <ContrastBadge label="AAA normal (7+)" pass={ratio >= 7} />
              <ContrastBadge label="AAA large (4.5+)" pass={ratio >= 4.5} />
            </div>
            <Notice>WCAG 2.x targets: 4.5:1 for normal text (AA), 3:1 for large text (18pt+ or 14pt bold).</Notice>
          </>
        )}
      </div>
    </Card>
  );
}

/* ============================== Placeholder Image ============================== */

export function PlaceholderImageTool() {
  const [width, setWidth] = useState("800");
  const [height, setHeight] = useState("600");
  const [bg, setBg] = useState("#1b2340");
  const [fg, setFg] = useState("#e9c86e");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const w = Math.min(4096, Math.max(1, parseInt(width, 10) || 800));
    const h = Math.min(4096, Math.max(1, parseInt(height, 10) || 600));
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = safeHex(bg);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = safeHex(fg);
    const label = text.trim() || `${w} × ${h}`;
    const size = Math.max(14, Math.min(w, h) / 10);
    ctx.font = `600 ${size}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, w / 2, h / 2, w * 0.92);
    setUrl(canvas.toDataURL("image/png"));
  }, [width, height, bg, fg, text]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `placeholder-${width}x${height}.png`);
    }, "image/png");
  };

  return (
    <Card>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Width (px)">
            <NumInput value={width} onChange={setWidth} min={1} max={4096} />
          </Field>
          <Field label="Height (px)">
            <NumInput value={height} onChange={setHeight} min={1} max={4096} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Background">
            <div className="flex items-center gap-2">
              <input type="color" value={safeHex(bg)} onChange={(e) => setBg(e.target.value)} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-gold/25 bg-ink" aria-label="Background color picker" />
              <TextInput value={bg} onChange={(e) => setBg(e.target.value)} className="font-mono" spellCheck={false} />
            </div>
          </Field>
          <Field label="Text color">
            <div className="flex items-center gap-2">
              <input type="color" value={safeHex(fg)} onChange={(e) => setFg(e.target.value)} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-gold/25 bg-ink" aria-label="Text color picker" />
              <TextInput value={fg} onChange={(e) => setFg(e.target.value)} className="font-mono" spellCheck={false} />
            </div>
          </Field>
        </div>
        <Field label="Text (optional — defaults to dimensions)">
          <TextInput value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Hero banner" />
        </Field>
        <canvas ref={canvasRef} className="hidden" />
        {url && (
          <>
            <Field label="Preview">
              <img src={url} alt="Placeholder preview" className="max-h-72 w-auto rounded-xl border border-gold/25" />
            </Field>
            <Btn onClick={download}>Download PNG</Btn>
          </>
        )}
      </div>
    </Card>
  );
}
