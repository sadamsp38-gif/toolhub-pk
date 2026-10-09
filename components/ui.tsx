"use client";

import React, { useRef, useState } from "react";

/* ---------- layout primitives ---------- */
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gold/25 bg-panel/90 p-5 shadow-lg shadow-black/40 ${className}`}>
      {children}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-cream">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-sage/60">{hint}</span>}
    </label>
  );
}

export function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-gold/50 bg-gold/10" : "border-gold/20 bg-ink-2/70"}`}>
      <div className="text-xs font-medium uppercase tracking-widest text-sage">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold ${accent ? "text-gold-light" : "text-cream"}`}>{value}</div>
    </div>
  );
}

/* ---------- inputs ---------- */
const inputCls =
  "w-full rounded-xl border border-gold/25 bg-ink/80 px-3.5 py-2.5 text-cream placeholder:text-sage/50 outline-none transition focus:border-gold/70 focus:ring-2 focus:ring-gold/20";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function NumInput({ value, onChange, ...rest }: { value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return <input type="number" value={value} onChange={(e) => onChange(e.target.value)} {...rest} className={`${inputCls} ${rest.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} min-h-[120px] font-mono text-sm ${props.className ?? ""}`} />;
}

export function Select({ value, onChange, options, className = "" }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} ${className}`}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Slider({ value, min, max, step = 1, onChange, format }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-gold"
      />
      <span className="min-w-[90px] rounded-lg border border-gold/25 bg-gold/10 px-2 py-1 text-center text-sm font-bold text-gold-light">
        {format ? format(value) : value}
      </span>
    </div>
  );
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-sage">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded accent-gold" />
      {label}
    </label>
  );
}

/* ---------- buttons ---------- */
export function Btn({ children, onClick, variant = "primary", disabled = false, className = "" }: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost"; disabled?: boolean; className?: string;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  const v = variant === "primary"
    ? "bg-gold text-ink shadow-md shadow-gold/25 hover:bg-gold-light"
    : variant === "secondary"
    ? "border border-gold/35 bg-transparent text-cream hover:border-gold/70 hover:bg-gold/10"
    : "text-gold-light hover:bg-gold/10";
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${v} ${className}`}>
      {children}
    </button>
  );
}

export function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        } catch { /* clipboard unavailable */ }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-panel px-3 py-1.5 text-sm font-medium text-cream transition hover:border-gold/60 hover:bg-gold/10"
    >
      {ok ? "✓ Copied!" : label}
    </button>
  );
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ---------- file drop ---------- */
export function FileDrop({ accept, multiple = false, onFiles, label }: {
  accept: string; multiple?: boolean; onFiles: (files: File[]) => void; label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); onFiles(Array.from(e.dataTransfer.files)); }}
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${drag ? "border-gold bg-gold/10" : "border-gold/25 bg-ink-2/60 hover:border-gold/60 hover:bg-gold/5"}`}
    >
      <div className="text-4xl">📁</div>
      <p className="mt-2 font-semibold text-cream">{label}</p>
      <p className="text-xs text-sage/70">Click to browse or drag & drop — files never leave your device 🔒</p>
      <input ref={ref} type="file" accept={accept} multiple={multiple} className="hidden"
        onChange={(e) => { if (e.target.files) onFiles(Array.from(e.target.files)); e.target.value = ""; }} />
    </div>
  );
}

/* ---------- misc ---------- */
export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button key={t} onClick={() => onChange(t)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${active === t ? "bg-gold text-ink shadow shadow-gold/25" : "border border-gold/20 bg-ink-2/60 text-sage hover:border-gold/50 hover:text-cream"}`}>
          {t}
        </button>
      ))}
    </div>
  );
}

export function Notice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" }) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${tone === "warn" ? "border-amber-500/40 bg-amber-500/10 text-amber-200" : "border-gold/30 bg-gold/10 text-cream"}`}>
      {children}
    </div>
  );
}
