"use client";

import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Btn, Card, Check, CopyBtn, downloadBlob, Field, Notice, Slider, TextInput } from "../ui";

/* ============================== QR Code Generator ============================== */

export function QrGenTool() {
  const [text, setText] = useState("https://toolhub.pk");
  const [size, setSize] = useState(512);
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!text.trim()) {
      setDataUrl("");
      setError("");
      return;
    }
    QRCode.toDataURL(text.trim(), { width: size, margin: 2 })
      .then((url) => {
        setDataUrl(url);
        setError("");
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to generate QR code"));
  }, [text, size]);

  const download = async () => {
    if (!dataUrl) return;
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    downloadBlob(blob, "qrcode.png");
  };

  return (
    <Card>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <Field label="Text / URL">
            <TextInput value={text} onChange={(e) => setText(e.target.value)} placeholder="https://example.com" />
          </Field>
          <Field label="Image size">
            <Slider value={size} min={128} max={1024} step={64} onChange={setSize} format={(v) => `${v}px`} />
          </Field>
          <Btn onClick={download} disabled={!dataUrl}>
            ⬇ Download PNG
          </Btn>
        </div>
        <div className="flex items-center justify-center rounded-xl border border-gold/25 bg-ink-2/70 p-4">
          {!text.trim() ? (
            <Notice>Enter some text or a URL to generate a QR code.</Notice>
          ) : error ? (
            <Notice tone="warn">{error}</Notice>
          ) : dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt="Generated QR code" className="max-w-full rounded-lg" style={{ width: Math.min(size, 320) }} />
          ) : (
            <span className="text-sm text-sage/60">Generating…</span>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ============================== Password Generator ============================== */

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>?/|~";

export function PasswordGenTool() {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState("");

  const pool = useMemo(() => {
    let p = "";
    if (upper) p += UPPER;
    if (lower) p += LOWER;
    if (digits) p += DIGITS;
    if (symbols) p += SYMBOLS;
    return p;
  }, [upper, lower, digits, symbols]);

  const generate = React.useCallback(() => {
    if (!pool) return;
    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    setPassword(Array.from(arr, (n) => pool[n % pool.length]).join(""));
  }, [pool, length]);

  useEffect(() => {
    generate();
  }, [generate]);

  const entropy = length * Math.log2(pool.length || 1);
  const level = entropy < 40 ? { label: "Weak", cls: "bg-red-500", text: "text-red-600" }
    : entropy < 60 ? { label: "Fair", cls: "bg-amber-500", text: "text-amber-600" }
    : entropy < 80 ? { label: "Strong", cls: "bg-blue-500", text: "text-blue-600" }
    : { label: "Excellent", cls: "bg-green-500", text: "text-green-600" };

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Password length">
          <Slider value={length} min={4} max={64} onChange={setLength} format={(v) => `${v} chars`} />
        </Field>
        <div className="flex flex-wrap gap-4">
          <Check label="Uppercase (A–Z)" checked={upper} onChange={setUpper} />
          <Check label="Lowercase (a–z)" checked={lower} onChange={setLower} />
          <Check label="Digits (0–9)" checked={digits} onChange={setDigits} />
          <Check label="Symbols (!@#…)" checked={symbols} onChange={setSymbols} />
        </div>
        {!pool && <Notice tone="warn">Select at least one character set.</Notice>}
        {password && (
          <div className="flex flex-wrap items-center gap-3">
            <code className="min-w-0 flex-1 break-all rounded-xl border border-gold/25 bg-ink-2/70 px-4 py-3 font-mono text-lg font-bold text-cream">
              {password}
            </code>
            <CopyBtn text={password} />
          </div>
        )}
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-sage">Strength: {entropy.toFixed(0)} bits entropy</span>
            <span className={`font-bold ${level.text}`}>{level.label}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-ink-2">
            <div className={`h-full rounded-full transition-all ${level.cls}`} style={{ width: `${Math.min(100, entropy / 1.28)}%` }} />
          </div>
        </div>
        <Btn onClick={generate} disabled={!pool}>
          🎲 Generate
        </Btn>
      </div>
    </Card>
  );
}

/* ============================== Color Picker ============================== */

function normalizeHex(v: string): string | null {
  let h = v.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return "#" + h.toLowerCase();
}

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

const PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16",
  "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
  "#8b5cf6", "#d946ef", "#ec4899", "#64748b",
];

export function ColorPickerTool() {
  const [hex, setHex] = useState("#4f46e5");
  const [raw, setRaw] = useState("#4f46e5");

  const normalized = normalizeHex(raw);
  const [r, g, b] = normalized ? hexToRgb(normalized) : [0, 0, 0];
  const [h, s, l] = rgbToHsl(r, g, b);
  const rgb = `rgb(${r}, ${g}, ${b})`;
  const hsl = `hsl(${h}, ${s}%, ${l}%)`;

  const apply = (v: string) => {
    setRaw(v);
    const n = normalizeHex(v);
    if (n) setHex(n);
  };

  return (
    <Card>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="color"
            value={normalized ?? hex}
            onChange={(e) => apply(e.target.value)}
            className="h-20 w-20 cursor-pointer rounded-xl border border-gold/25 bg-panel p-1"
            aria-label="Pick a color"
          />
          <div className="min-w-[160px] flex-1">
            <Field label="HEX">
              <TextInput value={raw} onChange={(e) => apply(e.target.value)} placeholder="#rrggbb" spellCheck={false} />
            </Field>
          </div>
        </div>
        {!normalized && <Notice tone="warn">That doesn’t look like a valid HEX color (use #rrggbb).</Notice>}
        {normalized && (
          <div className="space-y-2">
            {[
              { label: "HEX", value: normalized },
              { label: "RGB", value: rgb },
              { label: "HSL", value: hsl },
            ].map((row) => (
              <div key={row.label} className="flex flex-wrap items-center gap-3 rounded-xl border border-gold/25 bg-ink-2/70 px-4 py-2.5">
                <span className="w-12 text-xs font-bold uppercase tracking-wide text-sage">{row.label}</span>
                <code className="min-w-0 flex-1 break-all font-mono text-sm font-semibold text-cream">{row.value}</code>
                <CopyBtn text={row.value} />
              </div>
            ))}
            <div
              className="mt-2 flex h-24 items-center justify-center rounded-xl border border-gold/25 text-sm font-bold"
              style={{ backgroundColor: normalized, color: l > 50 ? "#0f172a" : "#ffffff" }}
            >
              Preview
            </div>
          </div>
        )}
        <div>
          <div className="mb-2 text-sm font-semibold text-cream">Palette</div>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => apply(c)}
                className={`h-10 rounded-lg border transition hover:scale-105 ${c === normalized ? "border-gold ring-2 ring-gold" : "border-gold/25"}`}
                style={{ backgroundColor: c }}
                title={c}
                aria-label={`Load color ${c}`}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ============================== UUID Generator ============================== */

export function UuidGenTool() {
  const [count, setCount] = useState(5);
  const [ids, setIds] = useState<string[]>([]);

  const generate = () => {
    setIds(Array.from({ length: count }, () => crypto.randomUUID()));
  };

  useEffect(() => {
    setIds(Array.from({ length: 5 }, () => crypto.randomUUID()));
  }, []);

  return (
    <Card>
      <div className="space-y-4">
        <Field label="How many UUIDs">
          <Slider value={count} min={1} max={100} onChange={setCount} format={(v) => `${v}`} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={generate}>🎲 Generate</Btn>
          {ids.length > 0 && <CopyBtn text={ids.join("\n")} label="Copy All" />}
        </div>
        {ids.length > 0 && (
          <div className="space-y-1.5">
            {ids.map((id) => (
              <div key={id} className="flex items-center gap-2 rounded-lg border border-gold/25 bg-ink-2/70 px-3 py-1.5">
                <code className="min-w-0 flex-1 break-all font-mono text-sm text-cream">{id}</code>
                <CopyBtn text={id} label="Copy" />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
