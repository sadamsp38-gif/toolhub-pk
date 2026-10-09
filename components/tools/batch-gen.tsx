"use client";

import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Btn, Card, Check, CopyBtn, downloadBlob, Field, Notice, NumInput, Select, Slider, Stat, Tabs, TextInput } from "../ui";

/* ============================== shared helpers ============================== */

async function qrToPng(dataUrl: string, filename: string) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  downloadBlob(blob, filename);
}

function cryptoInt(max: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

function hexToRgbArr(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function rgbToHslArr(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.min(100, Math.max(0, s)) / 100;
  l = Math.min(100, Math.max(0, l)) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}

const isValidHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

/* ============================== 1. WiFi QR ============================== */

const wifiEscape = (v: string) => v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/:/g, "\\:");

export function WifiQrTool() {
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [enc, setEnc] = useState("WPA");
  const [hidden, setHidden] = useState(false);
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ssid.trim()) {
      setDataUrl("");
      setError("");
      return;
    }
    const payload = `WIFI:T:${enc};S:${wifiEscape(ssid.trim())};P:${wifiEscape(password)};${hidden ? "H:true;" : ""};`;
    QRCode.toDataURL(payload, { width: 512, margin: 2 })
      .then((url) => { setDataUrl(url); setError(""); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to generate QR code"));
  }, [ssid, password, enc, hidden]);

  return (
    <Card>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <Field label="Network name (SSID)">
            <TextInput value={ssid} onChange={(e) => setSsid(e.target.value)} placeholder="HomeWiFi" />
          </Field>
          <Field label="Password">
            <TextInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </Field>
          <Field label="Security type">
            <Select
              value={enc}
              onChange={setEnc}
              options={[
                { value: "WPA", label: "WPA / WPA2" },
                { value: "WEP", label: "WEP" },
                { value: "nopass", label: "No password" },
              ]}
            />
          </Field>
          <Check label="Hidden network" checked={hidden} onChange={setHidden} />
          <Btn onClick={() => qrToPng(dataUrl, "wifi-qr.png")} disabled={!dataUrl}>
            ⬇ Download PNG
          </Btn>
          <Notice>Guests scan this code to join your WiFi — no typing needed. Works on Android and iOS cameras.</Notice>
        </div>
        <div className="flex items-center justify-center rounded-xl border border-gold/25 bg-ink-2/70 p-4">
          {!ssid.trim() ? (
            <Notice>Enter your WiFi network name to generate the QR code.</Notice>
          ) : error ? (
            <Notice tone="warn">{error}</Notice>
          ) : dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt="WiFi QR code" className="w-64 max-w-full rounded-lg" />
          ) : (
            <span className="text-sm text-sage/60">Generating…</span>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ============================== 2. vCard QR ============================== */

export function VcardQrTool() {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const f = first.trim(), l = last.trim();
    if (!f && !l && !phone.trim() && !email.trim()) {
      setDataUrl("");
      setError("");
      return;
    }
    const esc = (v: string) => v.replace(/([\\;,])/g, "\\$1").replace(/\n/g, "\\n");
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${esc(l)};${esc(f)};;;`,
      `FN:${esc([f, l].filter(Boolean).join(" "))}`,
      org.trim() && `ORG:${esc(org.trim())}`,
      phone.trim() && `TEL;TYPE=CELL:${esc(phone.trim())}`,
      email.trim() && `EMAIL:${esc(email.trim())}`,
      "END:VCARD",
    ].filter(Boolean).join("\r\n");
    QRCode.toDataURL(lines, { width: 512, margin: 2 })
      .then((url) => { setDataUrl(url); setError(""); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to generate QR code"));
  }, [first, last, phone, email, org]);

  const hasData = first.trim() || last.trim() || phone.trim() || email.trim();

  return (
    <Card>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name">
              <TextInput value={first} onChange={(e) => setFirst(e.target.value)} placeholder="Ali" />
            </Field>
            <Field label="Last name">
              <TextInput value={last} onChange={(e) => setLast(e.target.value)} placeholder="Khan" />
            </Field>
          </div>
          <Field label="Phone">
            <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1234567" />
          </Field>
          <Field label="Email">
            <TextInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ali@example.com" />
          </Field>
          <Field label="Company / organisation (optional)">
            <TextInput value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Acme Ltd" />
          </Field>
          <Btn onClick={() => qrToPng(dataUrl, "vcard-qr.png")} disabled={!dataUrl}>
            ⬇ Download PNG
          </Btn>
          <Notice>Scanning this QR opens your contact directly in the phone's address book — perfect for business cards.</Notice>
        </div>
        <div className="flex items-center justify-center rounded-xl border border-gold/25 bg-ink-2/70 p-4">
          {!hasData ? (
            <Notice>Fill in at least a name, phone or email to generate your contact QR code.</Notice>
          ) : error ? (
            <Notice tone="warn">{error}</Notice>
          ) : dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt="vCard QR code" className="w-64 max-w-full rounded-lg" />
          ) : (
            <span className="text-sm text-sage/60">Generating…</span>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ============================== 3. Code 39 barcode ============================== */

// Code 39 patterns: 9 elements each, "0" = narrow, "1" = wide, alternating bar/space
const CODE39: Record<string, string> = {
  "0": "000110100", "1": "100100001", "2": "001100001", "3": "101100000",
  "4": "000110001", "5": "100110000", "6": "001110000", "7": "000100101",
  "8": "100100100", "9": "001100100",
  A: "100001001", B: "001001001", C: "101001000", D: "000011001",
  E: "100011000", F: "001011000", G: "000001101", H: "100001100",
  I: "001001100", J: "000011100", K: "100000011", L: "001000011",
  M: "101000010", N: "000010011", O: "100010010", P: "001010010",
  Q: "000000111", R: "100000110", S: "001000110", T: "000010110",
  U: "110000001", V: "011000001", W: "111000000", X: "010010001",
  Y: "110010000", Z: "011010000",
  "-": "010000101", ".": "110000100", " ": "011000100",
  $: "010101000", "/": "010100010", "+": "010001010", "%": "000101010",
  "*": "010010100",
};

function encodeCode39(text: string): number[] | null {
  const units: number[] = [];
  for (const ch of `*${text.toUpperCase()}*`) {
    const pat = CODE39[ch];
    if (!pat) return null;
    for (let i = 0; i < 9; i++) units.push(pat[i] === "1" ? 3 : 1);
    units.push(1); // narrow inter-character gap
  }
  return units;
}

export function BarcodeTool() {
  const [text, setText] = useState("TOOLHUB-123");
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Canvas is not supported in this browser.");
      return;
    }
    const units = encodeCode39(text.trim());
    if (!units) {
      setError("Code 39 supports A–Z, 0–9 and space - . $ / + % only. Remove other characters.");
      return;
    }
    setError("");
    const narrow = 3;
    const barH = 130;
    const margin = 24;
    const total = units.reduce((a, u) => a + u, 0) * narrow;
    canvas.width = total + margin * 2;
    canvas.height = barH + 40;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111111";
    let x = margin;
    units.forEach((u, i) => {
      const w = u * narrow;
      if (i % 2 === 0) ctx.fillRect(x, 0, w, barH);
      x += w;
    });
    ctx.font = "20px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`*${text.trim().toUpperCase()}*`, canvas.width / 2, barH + 26);
  }, [text]);

  const download = () => {
    canvasRef.current?.toBlob((b) => {
      if (b) downloadBlob(b, "barcode.png");
    });
  };

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Text to encode" hint="A–Z, 0–9, space and - . $ / + % (max 30 chars)">
          <TextInput value={text} onChange={(e) => setText(e.target.value.slice(0, 30))} placeholder="PRODUCT-001" />
        </Field>
        {error ? (
          <Notice tone="warn">{error}</Notice>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gold/25 bg-ink-2/70 p-4">
            <canvas ref={canvasRef} className="mx-auto block max-w-none" aria-label="Generated Code 39 barcode" />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Btn onClick={download} disabled={!!error || !text.trim()}>
            ⬇ Download PNG
          </Btn>
        </div>
        <Notice>
          Drawn as a <strong>Code 39</strong> barcode with start/stop characters — scannable by most 1D barcode
          readers. Everything is generated locally on your device.
        </Notice>
      </div>
    </Card>
  );
}

/* ============================== 4. Signature pad ============================== */

export function SignaturePadTool() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getCtx = (): { ctx: CanvasRenderingContext2D; rect: DOMRect } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      // Preserve existing strokes across resizes
      const prev = document.createElement("canvas");
      prev.width = canvas.width;
      prev.height = canvas.height;
      if (canvas.width > 0) prev.getContext("2d")?.drawImage(canvas, 0, 0);
      canvas.width = w;
      canvas.height = h;
      const pctx = prev.getContext("2d");
      if (pctx && canvas.width > 0) {
        const ctx2 = canvas.getContext("2d");
        ctx2?.drawImage(prev, 0, 0, prev.width, prev.height, 0, 0, w, h);
      }
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = "#f6f1e3"; // cream ink — visible on dark UI, transparent PNG
    return { ctx, rect };
  };

  const pos = (e: React.PointerEvent, rect: DOMRect) => ({
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  });

  const onDown = (e: React.PointerEvent) => {
    const g = getCtx();
    if (!g) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastRef.current = pos(e, g.rect);
    g.ctx.beginPath();
    g.ctx.moveTo(lastRef.current.x, lastRef.current.y);
    g.ctx.lineTo(lastRef.current.x + 0.1, lastRef.current.y + 0.1);
    g.ctx.stroke();
    setHasDrawn(true);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    const g = getCtx();
    if (!g || !lastRef.current) return;
    const p = pos(e, g.rect);
    g.ctx.beginPath();
    g.ctx.moveTo(lastRef.current.x, lastRef.current.y);
    g.ctx.lineTo(p.x, p.y);
    g.ctx.stroke();
    lastRef.current = p;
  };

  const onUp = () => {
    drawingRef.current = false;
    lastRef.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const download = () => {
    canvasRef.current?.toBlob((b) => {
      if (b) downloadBlob(b, "signature.png");
    });
  };

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Draw your signature" hint="Use mouse or touch — it downloads with a transparent background">
          <canvas
            ref={canvasRef}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
            className="h-56 w-full cursor-crosshair touch-none rounded-xl border-2 border-dashed border-gold/30 bg-transparent"
            aria-label="Signature drawing pad"
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Btn variant="secondary" onClick={clear} disabled={!hasDrawn}>
            Clear
          </Btn>
          <Btn onClick={download} disabled={!hasDrawn}>
            ⬇ Download PNG
          </Btn>
        </div>
        <Notice>
          The PNG keeps a transparent background, so your signature drops cleanly onto documents and forms.
          Nothing is uploaded — drawing stays on your device.
        </Notice>
      </div>
    </Card>
  );
}

/* ============================== 5. Gradient generator ============================== */

type GradientStop = { color: string; pos: number };

export function GradientTool() {
  const [type, setType] = useState("linear");
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<GradientStop[]>([
    { color: "#d4af37", pos: 0 },
    { color: "#0c2b25", pos: 100 },
  ]);

  const setStop = (i: number, patch: Partial<GradientStop>) =>
    setStops((s) => s.map((st, j) => (j === i ? { ...st, ...patch } : st)));

  const sorted = [...stops].sort((a, b) => a.pos - b.pos);
  const stopsCss = sorted.map((s) => `${s.color} ${s.pos}%`).join(", ");
  const css = type === "linear"
    ? `background: linear-gradient(${angle}deg, ${stopsCss});`
    : `background: radial-gradient(circle, ${stopsCss});`;
  const preview = type === "linear"
    ? `linear-gradient(${angle}deg, ${stopsCss})`
    : `radial-gradient(circle, ${stopsCss})`;

  return (
    <Card>
      <div className="space-y-4">
        <Tabs tabs={["linear", "radial"]} active={type} onChange={setType} />
        {type === "linear" && (
          <Field label="Angle">
            <Slider value={angle} min={0} max={360} onChange={setAngle} format={(v) => `${v}°`} />
          </Field>
        )}
        {stops.map((s, i) => (
          <div key={i} className="flex flex-wrap items-center gap-4 rounded-xl border border-gold/25 bg-ink-2/70 px-4 py-3">
            <input
              type="color"
              value={s.color}
              onChange={(e) => setStop(i, { color: e.target.value })}
              className="h-12 w-12 cursor-pointer rounded-lg border border-gold/25 bg-panel p-1"
              aria-label={`Color stop ${i + 1}`}
            />
            <div className="min-w-[180px] flex-1">
              <Field label={`Stop ${i + 1} position`}>
                <Slider value={s.pos} min={0} max={100} onChange={(v) => setStop(i, { pos: v })} format={(v) => `${v}%`} />
              </Field>
            </div>
            {stops.length > 2 && (
              <Btn variant="ghost" onClick={() => setStops((p) => p.filter((_, j) => j !== i))}>
                ✕
              </Btn>
            )}
          </div>
        ))}
        {stops.length < 5 && (
          <Btn variant="secondary" onClick={() => setStops((p) => [...p, { color: "#f6f1e3", pos: 50 }])}>
            + Add color stop
          </Btn>
        )}
        <div className="h-40 rounded-xl border border-gold/25" style={{ background: preview }} aria-label="Gradient preview" />
        <Field label="CSS">
          <code className="block break-all rounded-xl border border-gold/25 bg-ink-2/70 px-4 py-3 font-mono text-sm text-cream">
            {css}
          </code>
        </Field>
        <CopyBtn text={css} label="Copy CSS" />
      </div>
    </Card>
  );
}

/* ============================== 6. Box shadow generator ============================== */

export function BoxShadowTool() {
  const [x, setX] = useState(8);
  const [y, setY] = useState(12);
  const [blur, setBlur] = useState(24);
  const [spread, setSpread] = useState(0);
  const [color, setColor] = useState("#000000");
  const [opacity, setOpacity] = useState(35);
  const [inset, setInset] = useState(false);

  const [r, g, b] = isValidHex(color) ? hexToRgbArr(color) : [0, 0, 0];
  const css = `box-shadow: ${inset ? "inset " : ""}${x}px ${y}px ${blur}px ${spread}px rgba(${r}, ${g}, ${b}, ${(opacity / 100).toFixed(2)});`;

  return (
    <Card>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Field label="Horizontal offset"><Slider value={x} min={-60} max={60} onChange={setX} format={(v) => `${v}px`} /></Field>
          <Field label="Vertical offset"><Slider value={y} min={-60} max={60} onChange={setY} format={(v) => `${v}px`} /></Field>
          <Field label="Blur radius"><Slider value={blur} min={0} max={120} onChange={setBlur} format={(v) => `${v}px`} /></Field>
          <Field label="Spread"><Slider value={spread} min={-40} max={40} onChange={setSpread} format={(v) => `${v}px`} /></Field>
          <Field label="Opacity"><Slider value={opacity} min={0} max={100} onChange={setOpacity} format={(v) => `${v}%`} /></Field>
          <div className="flex flex-wrap items-center gap-4">
            <Field label="Shadow color">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-11 w-16 cursor-pointer rounded-lg border border-gold/25 bg-panel p-1"
                aria-label="Shadow color"
              />
            </Field>
            <Check label="Inset shadow" checked={inset} onChange={setInset} />
          </div>
          <Field label="CSS">
            <code className="block break-all rounded-xl border border-gold/25 bg-ink-2/70 px-4 py-3 font-mono text-sm text-cream">
              {css}
            </code>
          </Field>
          <CopyBtn text={css} label="Copy CSS" />
        </div>
        <div className="flex items-center justify-center rounded-xl border border-gold/25 bg-ink-2/70 p-8">
          <div
            className="flex h-40 w-40 items-center justify-center rounded-2xl bg-panel text-sm font-bold text-gold-light"
            style={{ boxShadow: css.replace("box-shadow: ", "").replace(";", "") }}
          >
            Preview
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ============================== 7. Palette generator ============================== */

const PALETTE_MODES = ["Analogous", "Complementary", "Triadic", "Tetradic", "Monochromatic"];

function buildPalette(base: string, mode: string): string[] {
  const [r, g, b] = hexToRgbArr(base);
  const [h, s, l] = rgbToHslArr(r, g, b);
  const tint = (hh: number, dl: number, ds = 0) => hslToHex(hh, s + ds, l + dl);
  switch (mode) {
    case "Complementary":
      return [tint(h, 0), tint(h + 180, 0), tint(h, 18), tint(h + 180, 18), tint(h, -22)];
    case "Triadic":
      return [tint(h, 0), tint(h + 120, 0), tint(h + 240, 0), tint(h + 120, 20), tint(h + 240, -20)];
    case "Tetradic":
      return [tint(h, 0), tint(h + 90, 0), tint(h + 180, 0), tint(h + 270, 0), tint(h + 90, 22)];
    case "Monochromatic":
      return [hslToHex(h, s, 18), hslToHex(h, s, 34), hslToHex(h, s, 50), hslToHex(h, s, 66), hslToHex(h, s, 82)];
    default: // Analogous
      return [tint(h - 30, 0), tint(h - 15, 0), tint(h, 0), tint(h + 15, 0), tint(h + 30, 0)];
  }
}

export function PaletteTool() {
  const [base, setBase] = useState("#d4af37");
  const [mode, setMode] = useState(PALETTE_MODES[0]);
  const [copied, setCopied] = useState<string | null>(null);

  const palette = isValidHex(base) ? buildPalette(base, mode) : [];

  const randomBase = () => {
    const n = cryptoInt(0xffffff);
    setBase(`#${n.toString(16).padStart(6, "0")}`);
  };

  const copyColor = async (c: string) => {
    try {
      await navigator.clipboard.writeText(c);
      setCopied(c);
      setTimeout(() => setCopied((cur) => (cur === c ? null : cur)), 1500);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="color"
            value={isValidHex(base) ? base : "#d4af37"}
            onChange={(e) => setBase(e.target.value)}
            className="h-14 w-14 cursor-pointer rounded-xl border border-gold/25 bg-panel p-1"
            aria-label="Base color"
          />
          <div className="min-w-[160px] flex-1">
            <Field label="Base color (HEX)">
              <TextInput value={base} onChange={(e) => setBase(e.target.value)} placeholder="#d4af37" spellCheck={false} />
            </Field>
          </div>
          <Btn variant="secondary" onClick={randomBase}>🎲 Random base</Btn>
        </div>
        {!isValidHex(base) && <Notice tone="warn">Enter a valid 6-digit HEX color like #d4af37.</Notice>}
        <Tabs tabs={PALETTE_MODES} active={mode} onChange={setMode} />
        {palette.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {palette.map((c) => (
              <button
                key={c}
                onClick={() => copyColor(c)}
                className="group overflow-hidden rounded-xl border border-gold/25 transition hover:scale-[1.03]"
                title={`Copy ${c}`}
              >
                <div className="h-24" style={{ backgroundColor: c }} />
                <div className="bg-ink-2/80 px-2 py-2 font-mono text-xs font-bold text-cream">
                  {copied === c ? "✓ Copied!" : c}
                </div>
              </button>
            ))}
          </div>
        )}
        <Notice>Click any swatch to copy its HEX code. Palettes are built with colour-wheel harmony rules from your base color.</Notice>
      </div>
    </Card>
  );
}

/* ============================== 8. Coupon generator ============================== */

const COUPON_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const COUPON_LOWER = "abcdefghijkmnpqrstuvwxyz";
const COUPON_DIGITS = "23456789";

export function CouponTool() {
  const [prefix, setPrefix] = useState("SALE");
  const [length, setLength] = useState(8);
  const [count, setCount] = useState(20);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(false);
  const [digits, setDigits] = useState(true);
  const [codes, setCodes] = useState<string[]>([]);
  const [warn, setWarn] = useState("");

  const generate = () => {
    let pool = "";
    if (upper) pool += COUPON_UPPER;
    if (lower) pool += COUPON_LOWER;
    if (digits) pool += COUPON_DIGITS;
    if (!pool) {
      setWarn("Select at least one character set.");
      return;
    }
    setWarn("");
    const p = prefix.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    const out: string[] = [];
    for (let i = 0; i < Math.min(count, 1000); i++) {
      let body = "";
      for (let j = 0; j < length; j++) body += pool[cryptoInt(pool.length)];
      out.push(p ? `${p}-${body}` : body);
    }
    setCodes(out);
  };

  const download = () => {
    if (!codes.length) return;
    downloadBlob(new Blob([codes.join("\n")], { type: "text/plain" }), "coupon-codes.txt");
  };

  return (
    <Card>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prefix (optional)">
            <TextInput value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="SALE" />
          </Field>
          <Field label="Codes to generate" hint="1–1000">
            <NumInput value={String(count)} onChange={(v) => setCount(Math.min(1000, Math.max(1, parseInt(v, 10) || 20)))} min={1} max={1000} />
          </Field>
        </div>
        <Field label="Random part length (excluding prefix)">
          <Slider value={length} min={4} max={20} onChange={setLength} format={(v) => `${v} chars`} />
        </Field>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Check label="Uppercase (no I/O)" checked={upper} onChange={setUpper} />
          <Check label="Lowercase (no l)" checked={lower} onChange={setLower} />
          <Check label="Digits (no 0/1)" checked={digits} onChange={setDigits} />
        </div>
        {warn && <Notice tone="warn">{warn}</Notice>}
        <div className="flex flex-wrap gap-2">
          <Btn onClick={generate}>🎲 Generate codes</Btn>
          {codes.length > 0 && (
            <>
              <CopyBtn text={codes.join("\n")} label="Copy all" />
              <Btn variant="secondary" onClick={download}>⬇ Download .txt</Btn>
            </>
          )}
        </div>
        {codes.length > 0 && (
          <div className="max-h-72 space-y-1.5 overflow-auto rounded-xl border border-gold/25 bg-ink-2/70 p-3">
            {codes.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-ink/60 px-3 py-1.5">
                <code className="font-mono text-sm font-bold text-cream">{c}</code>
                <CopyBtn text={c} label="Copy" />
              </div>
            ))}
          </div>
        )}
        <Notice>Ambiguous characters (I, O, l, 0, 1) are excluded so codes stay readable on print and screen.</Notice>
      </div>
    </Card>
  );
}

/* ============================== 9. Passphrase generator ============================== */

const WORDS = [
  "apple", "river", "mountain", "cloud", "tiger", "ocean", "candle", "bridge",
  "forest", "garden", "honey", "island", "jungle", "kite", "lemon", "mango",
  "moon", "night", "piano", "queen", "rainbow", "rocket", "snow", "star",
  "storm", "sun", "table", "thunder", "train", "tree", "village", "water",
  "wind", "wolf", "zebra", "anchor", "basket", "button", "camera", "castle",
  "chair", "clock", "coin", "compass", "door", "drum", "eagle", "engine",
  "feather", "fire", "flag", "flower", "fruit", "gate", "glass", "guitar",
  "hammer", "hat", "horse", "book",
];

const SEPARATORS = [
  { value: " ", label: "Space" },
  { value: "-", label: "Hyphen (-)" },
  { value: "_", label: "Underscore (_)" },
  { value: ".", label: "Dot (.)" },
];

export function PassphraseTool() {
  const [words, setWords] = useState(4);
  const [sep, setSep] = useState(" ");
  const [capitalize, setCapitalize] = useState(false);
  const [phrase, setPhrase] = useState("");

  const generate = () => {
    const picked: string[] = [];
    for (let i = 0; i < words; i++) {
      let w = WORDS[cryptoInt(WORDS.length)];
      if (capitalize) w = w[0].toUpperCase() + w.slice(1);
      picked.push(w);
    }
    setPhrase(picked.join(sep));
  };

  const entropy = words * Math.log2(WORDS.length);
  const crackLabel = entropy < 30 ? "weak for important accounts" : entropy < 50 ? "good for everyday accounts" : "very strong";

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Number of words">
          <Slider value={words} min={3} max={12} onChange={setWords} format={(v) => `${v} words`} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Separator">
            <Select value={sep} onChange={setSep} options={SEPARATORS} />
          </Field>
          <div className="flex items-end pb-1">
            <Check label="Capitalize each word" checked={capitalize} onChange={setCapitalize} />
          </div>
        </div>
        <Btn onClick={generate}>🎲 Generate passphrase</Btn>
        {phrase && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <code className="min-w-0 flex-1 break-all rounded-xl border border-gold/25 bg-ink-2/70 px-4 py-3 font-mono text-lg font-bold text-cream">
                {phrase}
              </code>
              <CopyBtn text={phrase} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Entropy" value={`${entropy.toFixed(0)} bits`} accent />
              <Stat label="Strength" value={crackLabel} />
            </div>
          </>
        )}
        <Notice>
          Word passphrases are easy to remember but hard to guess. Generated with your browser's secure
          random source — nothing is sent or stored anywhere.
        </Notice>
      </div>
    </Card>
  );
}

/* ============================== 10. Random jokes ============================== */

const JOKES = [
  "Why did the laptop take a nap? It needed to recharge its batteries.",
  "I told my WiFi router a joke, but it couldn't handle the bandwidth.",
  "Why don't programmers like nature? Too many bugs.",
  "My password is so strong, even I can't log in.",
  "Why did the student bring a ladder to class? To reach the high marks.",
  "I asked the library for a book on patience — they're still looking for it.",
  "Why is the math book sad? It has too many problems.",
  "My phone battery lasts longer than my motivation on Mondays.",
  "Why did the coffee file a report? It got mugged.",
  "I tried to catch fog yesterday. I mist.",
  "Why do bicycles fall over? Because they're two-tired.",
  "The early bird gets the worm, but the second mouse gets the cheese.",
  "Why did the scarecrow win an award? He was outstanding in his field.",
  "I told my suitcase there'd be no vacation this year — now I'm dealing with emotional baggage.",
  "Why don't scientists trust atoms? They make up everything.",
  "Parallel lines have so much in common… shame they'll never meet.",
  "Why did the smartphone go to therapy? Too many unresolved notifications.",
  "I'm reading a book on anti-gravity — it's impossible to put down.",
  "Why did the tomato blush? It saw the salad dressing.",
  "My computer went on a diet — too many cookies.",
  "Why do seagulls fly over the sea? If they flew over the bay, they'd be bagels.",
  "I used to be a banker, but I lost interest.",
  "Why did the calendar take a vacation? It needed some days off.",
  "The printer and I had a paper jam, but we worked it out.",
  "Why don't eggs tell jokes? They'd crack each other up.",
];

export function JokeTool() {
  const [idx, setIdx] = useState(-1);

  const newJoke = () => {
    let n = cryptoInt(JOKES.length);
    if (JOKES.length > 1 && n === idx) n = (n + 1) % JOKES.length;
    setIdx(n);
  };

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-gold/25 bg-ink-2/70 p-6 text-center">
          {idx >= 0 ? (
            <p className="font-display text-xl font-semibold text-cream">{JOKES[idx]}</p>
          ) : (
            <Notice>Press the button for a fresh, family-friendly joke. 😄</Notice>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={newJoke}>{idx >= 0 ? "🎲 New joke" : "🎲 Tell me a joke"}</Btn>
          {idx >= 0 && <CopyBtn text={JOKES[idx]} label="Copy joke" />}
        </div>
        <Notice>All jokes here are original and family-friendly — safe to share anywhere.</Notice>
      </div>
    </Card>
  );
}

/* ============================== 11. Random quotes ============================== */

const QUOTES = [
  "Small steps every day build mountains over time.",
  "Your future self is watching — make them proud today.",
  "Discipline is choosing what you want most over what you want now.",
  "A slow start still beats no start.",
  "Doubt kills more dreams than failure ever will.",
  "Be patient with yourself; growth is quiet work.",
  "Every expert was once a beginner who refused to quit.",
  "Consistency turns ordinary effort into extraordinary results.",
  "The best time to begin was yesterday; the second-best time is now.",
  "Chase progress, not perfection.",
  "Starting small is still starting.",
  "Hard days are just tuition for the lessons ahead.",
  "Focus on the next step, not the whole staircase.",
  "Courage is fear that kept going.",
  "Your only real competition is who you were yesterday.",
  "Rest is part of the work — recharge without guilt.",
  "A goal without a plan is just a wish; write the plan.",
  "Kindness costs nothing and changes everything.",
  "Fail forward: every mistake is a map of what to try next.",
  "The mind believes what you tell it — tell it something good.",
  "Opportunities multiply when you show up daily.",
  "Stay humble in victory and hungry in defeat.",
  "Today's effort is tomorrow's advantage.",
  "You are allowed to begin again, as many times as it takes.",
  "Dream big, work quietly, let results make the noise.",
];

export function QuoteTool() {
  const [idx, setIdx] = useState(-1);

  const newQuote = () => {
    let n = cryptoInt(QUOTES.length);
    if (QUOTES.length > 1 && n === idx) n = (n + 1) % QUOTES.length;
    setIdx(n);
  };

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex min-h-[140px] items-center justify-center rounded-xl border border-gold/25 bg-ink-2/70 p-6 text-center">
          {idx >= 0 ? (
            <figure>
              <blockquote className="font-display text-2xl font-semibold italic text-gold-light">
                “{QUOTES[idx]}”
              </blockquote>
              <figcaption className="mt-3 text-xs uppercase tracking-widest text-sage">ToolHub Original</figcaption>
            </figure>
          ) : (
            <Notice>Press the button for a fresh motivational quote, written for this page. ✨</Notice>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={newQuote}>{idx >= 0 ? "🎲 New quote" : "🎲 Inspire me"}</Btn>
          {idx >= 0 && <CopyBtn text={QUOTES[idx]} label="Copy quote" />}
        </div>
      </div>
    </Card>
  );
}

/* ============================== 12. IBAN validator ============================== */

const IBAN_COUNTRIES: Record<string, string> = {
  AL: "Albania", AD: "Andorra", AT: "Austria", AZ: "Azerbaijan", BH: "Bahrain",
  BY: "Belarus", BE: "Belgium", BA: "Bosnia and Herzegovina", BR: "Brazil",
  BG: "Bulgaria", CR: "Costa Rica", HR: "Croatia", CY: "Cyprus", CZ: "Czechia",
  DK: "Denmark", DO: "Dominican Republic", DZ: "Algeria", EG: "Egypt",
  EE: "Estonia", FI: "Finland", FR: "France", GE: "Georgia", DE: "Germany",
  GR: "Greece", GT: "Guatemala", HU: "Hungary", IS: "Iceland", IQ: "Iraq",
  IE: "Ireland", IL: "Israel", IT: "Italy", JO: "Jordan", KZ: "Kazakhstan",
  KW: "Kuwait", LV: "Latvia", LB: "Lebanon", LI: "Liechtenstein", LT: "Lithuania",
  LU: "Luxembourg", LY: "Libya", MK: "North Macedonia", MT: "Malta",
  MR: "Mauritania", MC: "Monaco", ME: "Montenegro", NL: "Netherlands",
  NO: "Norway", OM: "Oman", PK: "Pakistan", PS: "Palestine", PL: "Poland",
  PT: "Portugal", QA: "Qatar", RO: "Romania", RS: "Serbia", SA: "Saudi Arabia",
  SM: "San Marino", SD: "Sudan", SK: "Slovakia", SI: "Slovenia",
  ES: "Spain", SE: "Sweden", CH: "Switzerland", TN: "Tunisia", TR: "Turkey",
  UA: "Ukraine", AE: "United Arab Emirates", GB: "United Kingdom",
  MD: "Moldova", VA: "Vatican City",
};

function ibanMod97(iban: string): number {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const code = ch >= "0" && ch <= "9" ? ch.charCodeAt(0) - 48 : ch.charCodeAt(0) - 55; // A=10 … Z=35
    const digits = String(code);
    for (const d of digits) remainder = (remainder * 10 + (d.charCodeAt(0) - 48)) % 97;
  }
  return remainder;
}

type IbanResult = {
  valid: boolean;
  reason: string;
  country: string;
  formatted: string;
  length: number;
};

export function IbanTool() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<IbanResult | null>(null);

  const validate = () => {
    const iban = input.replace(/[\s-]/g, "").toUpperCase();
    const fail = (reason: string): IbanResult => ({
      valid: false, reason, country: "", formatted: iban, length: iban.length,
    });
    if (!iban) return setResult(null);
    if (!/^[A-Z]{2}/.test(iban)) return setResult(fail("Must start with a 2-letter country code (e.g. PK, DE, GB)."));
    if (!/^[A-Z]{2}[0-9]{2}/.test(iban)) return setResult(fail("The 3rd and 4th characters must be check digits (numbers)."));
    if (!/^[A-Z0-9]+$/.test(iban)) return setResult(fail("Only letters and digits are allowed."));
    if (iban.length < 15 || iban.length > 34) return setResult(fail(`IBANs are 15–34 characters; yours is ${iban.length}.`));
    const country = IBAN_COUNTRIES[iban.slice(0, 2)] ?? "Unknown country code";
    if (ibanMod97(iban) !== 1) return setResult({ ...fail("Checksum failed — the mod-97 check digits don't match this IBAN."), country });
    setResult({
      valid: true,
      reason: "Structure and mod-97 checksum are correct.",
      country,
      formatted: iban.replace(/(.{4})/g, "$1 ").trim(),
      length: iban.length,
    });
  };

  return (
    <Card>
      <div className="space-y-4">
        <Field label="IBAN" hint="Spaces are ignored — paste it any way you like">
          <TextInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="PK36SCBL0000001123456702"
            spellCheck={false}
            className="font-mono uppercase"
          />
        </Field>
        <Btn onClick={validate} disabled={!input.trim()}>
          ✓ Validate IBAN
        </Btn>
        {result && (
          <div className="space-y-3">
            <Notice tone={result.valid ? "info" : "warn"}>
              {result.valid ? "✅ Valid IBAN — " : "❌ Invalid IBAN — "}{result.reason}
            </Notice>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="Country" value={result.country || "—"} accent={result.valid} />
              <Stat label="Length" value={`${result.length} chars`} />
              <Stat label="Checksum" value={result.valid ? "Passed" : "Failed"} />
            </div>
            {result.formatted && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gold/25 bg-ink-2/70 px-4 py-3">
                <code className="min-w-0 flex-1 break-all font-mono text-sm font-semibold text-cream">
                  {result.formatted}
                </code>
                <CopyBtn text={result.formatted} />
              </div>
            )}
          </div>
        )}
        <Notice>
          <strong>Format check only, not a bank verification.</strong> This validates the IBAN structure and the
          mod-97 checksum — it cannot confirm the account exists, is active, or belongs to anyone. Always verify
          account details with your bank before sending money.
        </Notice>
      </div>
    </Card>
  );
}

/* ============================== 13. Random color ============================== */

export function RandomColorTool() {
  const [hex, setHex] = useState("#d4af37");

  const surprise = () => {
    const n = cryptoInt(0xffffff);
    setHex(`#${n.toString(16).padStart(6, "0")}`);
  };

  const [r, g, b] = hexToRgbArr(hex);
  const [, , l] = rgbToHslArr(r, g, b);
  const rgb = `rgb(${r}, ${g}, ${b})`;
  const onDark = l < 55;

  return (
    <Card>
      <div className="space-y-4">
        <button
          onClick={surprise}
          className="flex h-56 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-gold/25 transition hover:scale-[1.01]"
          style={{ backgroundColor: hex, color: onDark ? "#ffffff" : "#0f172a" }}
          aria-label="Generate a new random color"
        >
          <span className="font-display text-5xl font-bold tracking-wide">{hex.toUpperCase()}</span>
          <span className="font-mono text-sm opacity-80">{rgb}</span>
          <span className="mt-2 text-xs font-semibold uppercase tracking-widest opacity-70">Click for a new color</span>
        </button>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={surprise}>🎲 Surprise me</Btn>
          <CopyBtn text={hex.toUpperCase()} label="Copy HEX" />
          <CopyBtn text={rgb} label="Copy RGB" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Red", value: String(r) },
            { label: "Green", value: String(g) },
            { label: "Blue", value: String(b) },
          ].map((s) => (
            <Stat key={s.label} label={s.label} value={s.value} />
          ))}
        </div>
        <Notice>Every click rolls a brand-new color from the full 16.7 million — tap the big swatch anytime.</Notice>
      </div>
    </Card>
  );
}
