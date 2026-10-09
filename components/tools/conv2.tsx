"use client";

import { useMemo, useState } from "react";
import { Card, CopyBtn, Field, Notice, NumInput, Select, Stat, Tabs, TextInput } from "../ui";

/* ============================== Roman Numerals ============================== */

const ROMAN_TABLE: [number, string][] = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
  [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
  [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

function toRoman(n: number): string {
  let out = "";
  for (const [value, numeral] of ROMAN_TABLE) {
    while (n >= value) {
      out += numeral;
      n -= value;
    }
  }
  return out;
}

function fromRoman(s: string): number {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]];
    const next = map[s[i + 1]];
    total += next !== undefined && next > cur ? -cur : cur;
  }
  return total;
}

const ROMAN_RE = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

export function RomanNumeralsTool() {
  const [tab, setTab] = useState("Number → Roman");
  const [numInput, setNumInput] = useState("");
  const [romanInput, setRomanInput] = useState("");

  const num = parseInt(numInput, 10);
  const numValid = numInput.trim() !== "" && Number.isInteger(num) && num >= 1 && num <= 3999;
  const roman = numValid ? toRoman(num) : "";

  const romanUpper = romanInput.trim().toUpperCase();
  const romanValid = romanUpper !== "" && ROMAN_RE.test(romanUpper);
  const decimal = romanValid ? fromRoman(romanUpper) : 0;

  return (
    <Card>
      <div className="space-y-4">
        <Tabs tabs={["Number → Roman", "Roman → Number"]} active={tab} onChange={setTab} />

        {tab === "Number → Roman" ? (
          <>
            <Field label="Number (1 – 3999)" hint="Roman numerals only support 1 to 3999.">
              <NumInput value={numInput} onChange={setNumInput} placeholder="e.g. 2026" min={1} max={3999} />
            </Field>
            {numInput.trim() !== "" && !numValid && (
              <Notice tone="warn">⚠ Please enter a whole number between 1 and 3999.</Notice>
            )}
            {numValid && (
              <div className="space-y-3">
                <div className="rounded-xl border border-gold/30 bg-ink-2/70 px-4 py-6 text-center">
                  <div className="font-display text-5xl font-bold tracking-widest text-gold-light">{roman}</div>
                </div>
                <CopyBtn text={roman} />
              </div>
            )}
          </>
        ) : (
          <>
            <Field label="Roman numeral" hint="Letters I, V, X, L, C, D, M in valid order.">
              <TextInput value={romanInput} onChange={(e) => setRomanInput(e.target.value)} placeholder="e.g. MMXXVI" className="uppercase tracking-widest" />
            </Field>
            {romanInput.trim() !== "" && !romanValid && (
              <Notice tone="warn">⚠ That is not a valid Roman numeral.</Notice>
            )}
            {romanValid && <Stat label="Decimal value" accent value={String(decimal)} />}
          </>
        )}
      </div>
    </Card>
  );
}

/* ============================== Timezone Converter ============================== */

const ZONES = [
  { value: "Asia/Karachi", label: "Karachi (PKT)" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "Kolkata (IST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT/AEST)" },
  { value: "America/New_York", label: "New York (ET)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PT)" },
];

/** Offset of a zone at an instant, in ms (positive = ahead of UTC). */
function zoneOffsetMs(timeZone: string, instant: number): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23",
  });
  const parts = dtf.formatToParts(new Date(instant));
  const num = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  const asUtc = Date.UTC(num("year"), num("month") - 1, num("day"), num("hour"), num("minute"), num("second"));
  return asUtc - instant;
}

/** Interpret "YYYY-MM-DDTHH:mm" as wall time in `timeZone`, returning the UTC instant. */
function wallTimeToInstant(input: string, timeZone: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(input);
  if (!m) return null;
  const guess = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  if (!Number.isFinite(guess)) return null;
  // Two passes so DST transitions resolve correctly.
  const instant = guess - zoneOffsetMs(timeZone, guess);
  return guess - zoneOffsetMs(timeZone, instant);
}

function fmtOffsetHrs(ms: number): string {
  const hrs = ms / 3600000;
  const sign = hrs > 0 ? "+" : hrs < 0 ? "−" : "±";
  const abs = Math.abs(hrs);
  return `${sign}${Number.isInteger(abs) ? abs : abs.toFixed(1)}h`;
}

export function TimezoneConverterTool() {
  const [dt, setDt] = useState("");
  const [from, setFrom] = useState("Asia/Karachi");
  const [to, setTo] = useState("UTC");

  const result = useMemo(() => {
    if (!dt) return { ok: false as const, reason: "empty" };
    const instant = wallTimeToInstant(dt, from);
    if (instant === null) return { ok: false as const, reason: "invalid" };
    const opts: Intl.DateTimeFormatOptions = { timeZone: from, dateStyle: "full", timeStyle: "full" };
    const fromStr = new Intl.DateTimeFormat("en-US", { ...opts, timeZone: from }).format(new Date(instant));
    const toStr = new Intl.DateTimeFormat("en-US", { ...opts, timeZone: to }).format(new Date(instant));
    const diff = fmtOffsetHrs(zoneOffsetMs(to, instant) - zoneOffsetMs(from, instant));
    return { ok: true as const, fromStr, toStr, diff };
  }, [dt, from, to]);

  const zoneOpts = ZONES.map((z) => ({ value: z.value, label: z.label }));

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Date & time">
          <TextInput type="datetime-local" value={dt} onChange={(e) => setDt(e.target.value)} />
        </Field>
        {!dt && <Notice>Pick a date &amp; time above — it is interpreted as wall-clock time in the “From” zone.</Notice>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="From zone">
            <Select value={from} onChange={setFrom} options={zoneOpts} />
          </Field>
          <Field label="To zone">
            <Select value={to} onChange={setTo} options={zoneOpts} />
          </Field>
        </div>
        {result.ok ? (
          <div className="space-y-3">
            <Stat label={`In ${from}`} value={result.fromStr} />
            <Stat label={`In ${to}`} accent value={result.toStr} />
            <p className="text-sm text-sage">
              Offset difference: <span className="font-bold text-gold-light">{result.diff}</span> (to-zone ahead of from-zone)
            </p>
          </div>
        ) : (
          result.reason === "invalid" && <Notice tone="warn">⚠ That date &amp; time could not be parsed.</Notice>
        )}
      </div>
    </Card>
  );
}
