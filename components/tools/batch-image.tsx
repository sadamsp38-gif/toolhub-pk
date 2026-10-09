"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import {
  Card, Field, Stat, TextInput, NumInput, TextArea, Select, Slider, Check,
  Btn, CopyBtn, downloadBlob, FileDrop, Notice, Tabs,
} from "../ui";

/* ---------------- shared helpers ---------------- */

function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("That file is not a readable image."));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png", quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/* ---------------- 1. Rotate & Flip ---------------- */

type Tfm = { rot: number; flipH: boolean; flipV: boolean };

function drawTransformed(el: HTMLImageElement, t: Tfm): HTMLCanvasElement {
  const rot = ((t.rot % 4) + 4) % 4;
  const w = el.naturalWidth;
  const h = el.naturalHeight;
  const swap = rot % 2 === 1;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? h : w;
  canvas.height = swap ? w : h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rot * Math.PI) / 2);
  ctx.scale(t.flipH ? -1 : 1, t.flipV ? -1 : 1);
  ctx.drawImage(el, -w / 2, -h / 2);
  return canvas;
}

export function ImageRotateFlipTool() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [tfm, setTfm] = useState<Tfm>({ rot: 0, flipH: false, flipV: false });
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setErr(null);
    try {
      setImg(await readImage(f));
      setTfm({ rot: 0, flipH: false, flipV: false });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load image.");
    }
  };

  useEffect(() => {
    if (!img) {
      setPreview(null);
      return;
    }
    setPreview(drawTransformed(img, tfm).toDataURL("image/png"));
  }, [img, tfm]);

  const download = async () => {
    if (!img) return;
    const blob = await canvasToBlob(drawTransformed(img, tfm));
    if (blob) downloadBlob(blob, "rotated-flipped.png");
  };

  const active = tfm.rot !== 0 || tfm.flipH || tfm.flipV;

  return (
    <Card>
      <FileDrop accept="image/*" onFiles={onFiles} label="Drop an image here" />
      {err && <div className="mt-3"><Notice tone="warn">{err}</Notice></div>}
      {img && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Btn variant="secondary" onClick={() => setTfm((t) => ({ ...t, rot: t.rot - 1 }))}>⟲ Rotate left</Btn>
            <Btn variant="secondary" onClick={() => setTfm((t) => ({ ...t, rot: t.rot + 1 }))}>⟳ Rotate right</Btn>
            <Btn variant="secondary" onClick={() => setTfm((t) => ({ ...t, flipH: !t.flipH }))}>
              {tfm.flipH ? "✓ " : ""}Flip horizontal
            </Btn>
            <Btn variant="secondary" onClick={() => setTfm((t) => ({ ...t, flipV: !t.flipV }))}>
              {tfm.flipV ? "✓ " : ""}Flip vertical
            </Btn>
            <Btn variant="ghost" onClick={() => setTfm({ rot: 0, flipH: false, flipV: false })} disabled={!active}>
              Reset
            </Btn>
          </div>
          {preview && (
            <div className="rounded-xl border border-gold/25 bg-ink-2/70 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sage/60">Live preview</p>
              <img src={preview} alt="Transformed preview" className="max-h-[420px] w-auto rounded-lg" />
            </div>
          )}
          <Btn onClick={download}>Download PNG</Btn>
        </div>
      )}
    </Card>
  );
}

/* ---------------- 2. Image Filters ---------------- */

type FiltOpts = {
  grayscale: number; sepia: number; invert: number; blur: number;
  brightness: number; contrast: number; saturate: number;
};

const FILT_NONE: FiltOpts = { grayscale: 0, sepia: 0, invert: 0, blur: 0, brightness: 100, contrast: 100, saturate: 100 };

const FILT_PRESETS: Record<string, FiltOpts> = {
  "None": FILT_NONE,
  "Black & White": { ...FILT_NONE, grayscale: 100, contrast: 110 },
  "Vintage": { ...FILT_NONE, sepia: 60, brightness: 105, contrast: 95, saturate: 75 },
  "Cold Tone": { ...FILT_NONE, brightness: 108, contrast: 105, saturate: 80 },
  "Warm Glow": { ...FILT_NONE, sepia: 35, brightness: 110, saturate: 130 },
  "Dramatic": { ...FILT_NONE, brightness: 95, contrast: 140, saturate: 110 },
  "X-Ray": { ...FILT_NONE, invert: 100 },
};

function filterString(o: FiltOpts): string {
  return `grayscale(${o.grayscale}%) sepia(${o.sepia}%) invert(${o.invert}%) blur(${o.blur}px) brightness(${o.brightness}%) contrast(${o.contrast}%) saturate(${o.saturate}%)`;
}

function drawFiltered(el: HTMLImageElement, o: FiltOpts): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = el.naturalWidth;
  canvas.height = el.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.filter = filterString(o);
  ctx.drawImage(el, 0, 0);
  return canvas;
}

export function ImageFiltersTool() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [opts, setOpts] = useState<FiltOpts>(FILT_NONE);
  const [preset, setPreset] = useState("None");
  const [preview, setPreview] = useState<string | null>(null);
  const [tab, setTab] = useState("After");
  const [err, setErr] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setErr(null);
    try {
      const el = await readImage(f);
      setImg(el);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(f);
      setSrcUrl(urlRef.current);
      setOpts(FILT_NONE);
      setPreset("None");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load image.");
    }
  };

  useEffect(() => {
    if (!img) {
      setPreview(null);
      return;
    }
    const c = drawFiltered(img, opts);
    canvasRef.current = c;
    setPreview(c.toDataURL("image/png"));
  }, [img, opts]);

  const set = (k: keyof FiltOpts) => (v: number) => {
    setOpts((o) => ({ ...o, [k]: v }));
    setPreset("Custom");
  };

  const applyPreset = (name: string) => {
    setPreset(name);
    setOpts({ ...FILT_PRESETS[name] });
  };

  const download = async () => {
    const c = canvasRef.current;
    if (!c) return;
    const blob = await canvasToBlob(c);
    if (blob) downloadBlob(blob, "filtered.png");
  };

  return (
    <Card>
      <FileDrop accept="image/*" onFiles={onFiles} label="Drop an image here" />
      {err && <div className="mt-3"><Notice tone="warn">{err}</Notice></div>}
      {img && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-cream">Presets</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(FILT_PRESETS).map((p) => (
                <button
                  key={p}
                  onClick={() => applyPreset(p)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${preset === p ? "bg-gold text-ink shadow shadow-gold/25" : "border border-gold/20 bg-ink-2/60 text-sage hover:border-gold/50 hover:text-cream"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Grayscale"><Slider value={opts.grayscale} min={0} max={100} onChange={set("grayscale")} format={(v) => `${v}%`} /></Field>
            <Field label="Sepia"><Slider value={opts.sepia} min={0} max={100} onChange={set("sepia")} format={(v) => `${v}%`} /></Field>
            <Field label="Invert"><Slider value={opts.invert} min={0} max={100} onChange={set("invert")} format={(v) => `${v}%`} /></Field>
            <Field label="Blur"><Slider value={opts.blur} min={0} max={10} step={0.5} onChange={set("blur")} format={(v) => `${v}px`} /></Field>
            <Field label="Brightness"><Slider value={opts.brightness} min={0} max={200} onChange={set("brightness")} format={(v) => `${v}%`} /></Field>
            <Field label="Contrast"><Slider value={opts.contrast} min={0} max={200} onChange={set("contrast")} format={(v) => `${v}%`} /></Field>
            <Field label="Saturation" ><Slider value={opts.saturate} min={0} max={200} onChange={set("saturate")} format={(v) => `${v}%`} /></Field>
          </div>
          <Tabs tabs={["After", "Before"]} active={tab} onChange={setTab} />
          <div className="rounded-xl border border-gold/25 bg-ink-2/70 p-3">
            <img
              src={tab === "After" ? preview ?? srcUrl ?? "" : srcUrl ?? ""}
              alt={tab === "After" ? "Filtered image" : "Original image"}
              className="max-h-[420px] w-auto rounded-lg"
            />
          </div>
          <Btn onClick={download}>Download filtered PNG</Btn>
        </div>
      )}
    </Card>
  );
}

/* ---------------- 3. Image → Base64 ---------------- */

export function ImageToBase64Tool() {
  const [name, setName] = useState("");
  const [sizeKB, setSizeKB] = useState(0);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setErr(null);
    try {
      const url = await readAsDataUrl(f);
      setName(f.name);
      setSizeKB(f.size / 1024);
      setDataUrl(url);
      setPreview(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not read file.");
    }
  };

  const chars = dataUrl ? dataUrl.length : 0;

  return (
    <Card>
      <FileDrop accept="image/*" onFiles={onFiles} label="Drop an image here" />
      {err && <div className="mt-3"><Notice tone="warn">{err}</Notice></div>}
      {dataUrl && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Original size" value={`${sizeKB.toFixed(1)} KB`} />
            <Stat label="Base64 length" value={chars.toLocaleString("en-US")} />
            <Stat label="Overhead" value="+33%" accent />
          </div>
          {preview && (
            <div className="rounded-xl border border-gold/25 bg-ink-2/70 p-3">
              <img src={preview} alt="Source" className="max-h-[200px] w-auto rounded-lg" />
            </div>
          )}
          <Field label={`Data URI — ${name}`}>
            <TextArea readOnly value={dataUrl} className="max-h-[160px] text-xs" />
          </Field>
          <div className="flex flex-wrap gap-2">
            <CopyBtn text={dataUrl} label="Copy data URI" />
            <Btn variant="secondary" onClick={() => downloadBlob(new Blob([dataUrl], { type: "text/plain" }), `${name || "image"}.base64.txt`)}>
              Download .txt
            </Btn>
          </div>
          <Notice>Base64 output is roughly 33% larger than the original file — best for small icons and inline images.</Notice>
        </div>
      )}
    </Card>
  );
}

/* ---------------- 4. Base64 → Image ---------------- */

export function Base64ToImageTool() {
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [mime, setMime] = useState("");
  const [sizeKB, setSizeKB] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  const decode = () => {
    const clean = input.trim().replace(/\s+/g, "");
    setErr(null);
    setPreview(null);
    if (!clean) {
      setErr("Paste a Base64 string first.");
      return;
    }
    let url = clean;
    if (!/^data:/i.test(clean)) url = `data:image/png;base64,${clean}`;
    setBusy(true);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setErr("Could not process the image.");
        setBusy(false);
        return;
      }
      ctx.drawImage(img, 0, 0);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(new Blob([clean], { type: "text/plain" }));
      setPreview(url);
      const m = /^data:([^;,]+)/i.exec(url);
      setMime(m ? m[1] : "image/png");
      setSizeKB(Math.round((clean.length * 3) / 4 / 1024));
      setBusy(false);
    };
    img.onerror = () => {
      setErr("That is not a valid Base64 image. Check the string and try again.");
      setBusy(false);
    };
    img.src = url;
  };

  const download = async () => {
    if (!preview) return;
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = preview;
    }).catch(() => null);
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    const blob = await canvasToBlob(canvas);
    if (blob) downloadBlob(blob, "decoded-image.png");
  };

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Base64 string" hint="Paste a full data URI or just the raw Base64 payload.">
          <TextArea value={input} onChange={(e) => setInput(e.target.value)} placeholder="data:image/png;base64,iVBORw0KGgo..." />
        </Field>
        <Btn onClick={decode} disabled={busy}>{busy ? "Decoding…" : "Preview image"}</Btn>
        {err && <Notice tone="warn">{err}</Notice>}
        {preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Detected type" value={mime || "—"} />
              <Stat label="Approx. size" value={`${sizeKB.toLocaleString("en-US")} KB`} accent />
            </div>
            <div className="rounded-xl border border-gold/25 bg-ink-2/70 p-3">
              <img src={preview} alt="Decoded" className="max-h-[420px] w-auto rounded-lg" />
            </div>
            <Btn onClick={download}>Download as PNG</Btn>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------------- 5. Favicon Generator ---------------- */

const FAV_SIZES = [16, 32, 180];

type FavIcon = { size: number; url: string; blob: Blob };

export function FaviconGeneratorTool() {
  const [icons, setIcons] = useState<FavIcon[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const urlRef = useRef<string[]>([]);

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setErr(null);
    setBusy(true);
    try {
      const el = await readImage(f);
      const made: FavIcon[] = [];
      for (const s of FAV_SIZES) {
        const canvas = document.createElement("canvas");
        canvas.width = s;
        canvas.height = s;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        ctx.drawImage(el, 0, 0, s, s);
        const blob = await canvasToBlob(canvas);
        if (!blob) continue;
        const url = URL.createObjectURL(blob);
        urlRef.current.push(url);
        made.push({ size: s, url, blob });
      }
      urlRef.current.forEach((u) => {
        if (!made.some((m) => m.url === u)) URL.revokeObjectURL(u);
      });
      urlRef.current = made.map((m) => m.url);
      setIcons(made);
      if (made.length === 0) setErr("Could not render the favicons.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load image.");
    } finally {
      setBusy(false);
    }
  };

  const downloadAll = () => {
    icons.forEach((ic, i) => {
      setTimeout(() => downloadBlob(ic.blob, `favicon-${ic.size}x${ic.size}.png`), i * 350);
    });
  };

  return (
    <Card>
      <FileDrop accept="image/*" onFiles={onFiles} label="Drop a logo or image here" />
      {busy && <div className="mt-3"><Notice>Rendering favicons…</Notice></div>}
      {err && <div className="mt-3"><Notice tone="warn">{err}</Notice></div>}
      {icons.length > 0 && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {icons.map((ic) => (
              <div key={ic.size} className="flex flex-col items-center gap-2 rounded-xl border border-gold/25 bg-ink-2/70 p-4">
                <img src={ic.url} alt={`Favicon ${ic.size}`} width={Math.min(ic.size, 64)} height={Math.min(ic.size, 64)} className="rounded" />
                <p className="font-display text-sm font-bold text-cream">{ic.size}×{ic.size}</p>
                <p className="text-xs text-sage/60">PNG</p>
                <Btn variant="secondary" className="!px-3 !py-1.5 text-sm" onClick={() => downloadBlob(ic.blob, `favicon-${ic.size}x${ic.size}.png`)}>
                  Download
                </Btn>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn onClick={downloadAll}>Download all ({icons.length})</Btn>
          </div>
          <Notice>Use the 16×16 and 32×32 PNGs as your favicon, and the 180×180 PNG as the Apple touch icon.</Notice>
        </div>
      )}
    </Card>
  );
}

/* ---------------- 6. Meme Generator ---------------- */

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export function MemeGeneratorTool() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [top, setTop] = useState("TOP TEXT");
  const [bottom, setBottom] = useState("BOTTOM TEXT");
  const [fontSize, setFontSize] = useState(64);
  const [upper, setUpper] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setErr(null);
    try {
      setImg(await readImage(f));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load image.");
    }
  };

  useEffect(() => {
    if (!img) {
      setPreview(null);
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    const size = Math.max(12, Math.min(fontSize, canvas.height / 3));
    ctx.font = `900 ${size}px Impact, "Arial Black", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.lineWidth = Math.max(2, size / 12);
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#ffffff";
    const maxW = canvas.width * 0.92;
    const drawBlock = (raw: string, fromTop: boolean) => {
      const text = upper ? raw.toUpperCase() : raw;
      const lines = wrapLines(ctx, text, maxW);
      const lineH = size * 1.15;
      lines.forEach((ln, i) => {
        const y = fromTop ? size * 0.35 + i * lineH : canvas.height - size * 0.35 - (lines.length - i) * lineH;
        ctx.strokeText(ln, canvas.width / 2, y);
        ctx.fillText(ln, canvas.width / 2, y);
      });
    };
    drawBlock(top, true);
    drawBlock(bottom, false);
    canvasRef.current = canvas;
    setPreview(canvas.toDataURL("image/png"));
  }, [img, top, bottom, fontSize, upper]);

  const download = async () => {
    const c = canvasRef.current;
    if (!c) return;
    const blob = await canvasToBlob(c);
    if (blob) downloadBlob(blob, "meme.png");
  };

  return (
    <Card>
      <FileDrop accept="image/*" onFiles={onFiles} label="Drop a meme background here" />
      {err && <div className="mt-3"><Notice tone="warn">{err}</Notice></div>}
      {img && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Top caption">
              <TextInput value={top} onChange={(e) => setTop(e.target.value)} placeholder="TOP TEXT" />
            </Field>
            <Field label="Bottom caption">
              <TextInput value={bottom} onChange={(e) => setBottom(e.target.value)} placeholder="BOTTOM TEXT" />
            </Field>
          </div>
          <Field label="Font size">
            <Slider value={fontSize} min={20} max={160} onChange={setFontSize} format={(v) => `${v}px`} />
          </Field>
          <Check label="UPPERCASE captions" checked={upper} onChange={setUpper} />
          {preview && (
            <div className="rounded-xl border border-gold/25 bg-ink-2/70 p-3">
              <img src={preview} alt="Meme preview" className="max-h-[480px] w-auto rounded-lg" />
            </div>
          )}
          <Btn onClick={download}>Download meme</Btn>
        </div>
      )}
    </Card>
  );
}

/* ---------------- 7. Rounded Corners ---------------- */

export function ImageRoundedTool() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [radius, setRadius] = useState(80);
  const [borderW, setBorderW] = useState(0);
  const [borderC, setBorderC] = useState("#d4af37");
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setErr(null);
    try {
      setImg(await readImage(f));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load image.");
    }
  };

  useEffect(() => {
    if (!img) {
      setPreview(null);
      return;
    }
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    rr(ctx, 0, 0, w, h, Math.min(radius, w / 2, h / 2));
    ctx.save();
    ctx.clip();
    ctx.drawImage(img, 0, 0);
    ctx.restore();
    if (borderW > 0) {
      rr(ctx, borderW / 2, borderW / 2, w - borderW, h - borderW, Math.min(radius, w / 2, h / 2));
      ctx.lineWidth = borderW;
      ctx.strokeStyle = borderC;
      ctx.stroke();
    }
    canvasRef.current = canvas;
    setPreview(canvas.toDataURL("image/png"));
  }, [img, radius, borderW, borderC]);

  const download = async () => {
    const c = canvasRef.current;
    if (!c) return;
    const blob = await canvasToBlob(c);
    if (blob) downloadBlob(blob, "rounded.png");
  };

  return (
    <Card>
      <FileDrop accept="image/*" onFiles={onFiles} label="Drop an image here" />
      {err && <div className="mt-3"><Notice tone="warn">{err}</Notice></div>}
      {img && (
        <div className="mt-4 space-y-4">
          <Field label="Corner radius">
            <Slider value={radius} min={0} max={400} onChange={setRadius} format={(v) => `${v}px`} />
          </Field>
          <Field label="Border width">
            <Slider value={borderW} min={0} max={40} onChange={setBorderW} format={(v) => `${v}px`} />
          </Field>
          {borderW > 0 && (
            <Field label="Border colour">
              <input
                type="color"
                value={borderC}
                onChange={(e) => setBorderC(e.target.value)}
                className="h-11 w-24 cursor-pointer rounded-xl border border-gold/25 bg-ink/80"
              />
            </Field>
          )}
          {preview && (
            <div className="rounded-xl border border-gold/25 bg-ink-2/70 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sage/60">Transparent PNG preview</p>
              <div
                className="inline-block rounded-lg"
                style={{ backgroundImage: "conic-gradient(#2a2a2a 25%, #1c1c1c 0 50%, #2a2a2a 0 75%, #1c1c1c 0)", backgroundSize: "24px 24px" }}
              >
                <img src={preview} alt="Rounded preview" className="max-h-[420px] w-auto rounded-lg" />
              </div>
            </div>
          )}
          <Btn onClick={download}>Download transparent PNG</Btn>
        </div>
      )}
    </Card>
  );
}

/* ---------------- 8. SVG → PNG ---------------- */

export function SvgToPngTool() {
  const [svg, setSvg] = useState("");
  const [width, setWidth] = useState("512");
  const [height, setHeight] = useState("512");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const onSvgFile = async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setErr(null);
    try {
      setSvg(await f.text());
    } catch {
      setErr("Could not read that SVG file.");
    }
  };

  const rasterize = () => {
    const w = parseInt(width, 10);
    const h = parseInt(height, 10);
    setErr(null);
    setPreview(null);
    if (!svg.trim()) {
      setErr("Paste SVG markup or upload an .svg file first.");
      return;
    }
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0 || w > 8000 || h > 8000) {
      setErr("Enter valid dimensions between 1 and 8000 px.");
      return;
    }
    setBusy(true);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setErr("Could not rasterize the SVG.");
        setBusy(false);
        URL.revokeObjectURL(url);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      canvasRef.current = canvas;
      setPreview(canvas.toDataURL("image/png"));
      setBusy(false);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      setErr("That SVG could not be rendered. Check the markup for errors.");
      setBusy(false);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const download = async () => {
    const c = canvasRef.current;
    if (!c) return;
    const blob = await canvasToBlob(c);
    if (blob) downloadBlob(blob, `svg-${c.width}x${c.height}.png`);
  };

  return (
    <Card>
      <div className="space-y-4">
        <Field label="SVG markup" hint="Paste raw SVG code, or upload a file below.">
          <TextArea value={svg} onChange={(e) => setSvg(e.target.value)} placeholder="<svg xmlns=..." />
        </Field>
        <FileDrop accept=".svg,image/svg+xml" onFiles={onSvgFile} label="Or drop an .svg file" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Width (px)">
            <NumInput value={width} onChange={setWidth} min={1} max={8000} />
          </Field>
          <Field label="Height (px)">
            <NumInput value={height} onChange={setHeight} min={1} max={8000} />
          </Field>
        </div>
        <Btn onClick={rasterize} disabled={busy}>{busy ? "Rasterizing…" : "Convert to PNG"}</Btn>
        {err && <Notice tone="warn">{err}</Notice>}
        {preview && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gold/25 bg-ink-2/70 p-3">
              <img src={preview} alt="Rasterized PNG" className="max-h-[420px] w-auto rounded-lg" />
            </div>
            <Btn onClick={download}>Download PNG</Btn>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------------- 9. Photo Collage ---------------- */

function drawCover(ctx: CanvasRenderingContext2D, el: HTMLImageElement, dx: number, dy: number, dw: number, dh: number) {
  const sw = el.naturalWidth;
  const sh = el.naturalHeight;
  const target = dw / dh;
  let cw = sw;
  let ch = sh;
  if (sw / sh > target) {
    cw = sh * target;
  } else {
    ch = sw / target;
  }
  const sx = (sw - cw) / 2;
  const sy = (sh - ch) / 2;
  ctx.drawImage(el, sx, sy, cw, ch, dx, dy, dw, dh);
}

export function PhotoCollageTool() {
  const [slots, setSlots] = useState<(HTMLImageElement | null)[]>([null, null, null, null]);
  const [gap, setGap] = useState(12);
  const [bg, setBg] = useState("#141414");
  const [cell, setCell] = useState("600");
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const onSlot = (i: number) => async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setErr(null);
    try {
      const el = await readImage(f);
      setSlots((s) => s.map((v, j) => (j === i ? el : v)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load image.");
    }
  };

  const clearSlot = (i: number) => setSlots((s) => s.map((v, j) => (j === i ? null : v)));

  const filled = slots.filter((s): s is HTMLImageElement => s !== null);

  useEffect(() => {
    if (filled.length === 0) {
      setPreview(null);
      return;
    }
    const s = Math.max(200, Math.min(1200, parseInt(cell, 10) || 600));
    const g = gap;
    const W = s * 2 + g;
    const H = s * 2 + g;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const pos = [
      [0, 0],
      [s + g, 0],
      [0, s + g],
      [s + g, s + g],
    ];
    slots.forEach((el, i) => {
      const [x, y] = pos[i];
      if (el) {
        drawCover(ctx, el, x, y, s, s);
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = `600 ${Math.round(s / 10)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`Photo ${i + 1}`, x + s / 2, y + s / 2);
      }
    });
    canvasRef.current = canvas;
    setPreview(canvas.toDataURL("image/png"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, gap, bg, cell]);

  const download = async () => {
    const c = canvasRef.current;
    if (!c) return;
    const blob = await canvasToBlob(c);
    if (blob) downloadBlob(blob, "collage.png");
  };

  return (
    <Card>
      <div className="grid gap-3 sm:grid-cols-2">
        {slots.map((el, i) => (
          <div key={i} className="rounded-xl border border-gold/25 bg-ink-2/70 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-cream">Photo {i + 1}</p>
              {el && (
                <Btn variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => clearSlot(i)}>
                  Remove
                </Btn>
              )}
            </div>
            {el ? (
              <img src={el.src} alt={`Slot ${i + 1}`} className="max-h-[140px] w-auto rounded-lg" />
            ) : (
              <FileDrop accept="image/*" onFiles={onSlot(i)} label="Drop photo" />
            )}
          </div>
        ))}
      </div>
      {err && <div className="mt-3"><Notice tone="warn">{err}</Notice></div>}
      <div className="mt-4 space-y-4">
        <Field label="Gap between photos">
          <Slider value={gap} min={0} max={60} onChange={setGap} format={(v) => `${v}px`} />
        </Field>
        <div className="grid grid-cols-2 items-end gap-3">
          <Field label="Background colour">
            <input
              type="color"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              className="h-11 w-24 cursor-pointer rounded-xl border border-gold/25 bg-ink/80"
            />
          </Field>
          <Field label="Cell size">
            <Select
              value={cell}
              onChange={setCell}
              options={[
                { value: "400", label: "400 px (web)" },
                { value: "600", label: "600 px (social)" },
                { value: "800", label: "800 px (print)" },
              ]}
            />
          </Field>
        </div>
        {preview && (
          <div className="rounded-xl border border-gold/25 bg-ink-2/70 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sage/60">Collage preview</p>
            <img src={preview} alt="Collage preview" className="max-h-[480px] w-auto rounded-lg" />
          </div>
        )}
        <Btn onClick={download} disabled={!preview}>Download collage</Btn>
      </div>
    </Card>
  );
}

/* ---------------- 10. Image Eyedropper ---------------- */

type Picked = { hex: string; r: number; g: number; b: number };

export function ImageEyedropperTool() {
  const [src, setSrc] = useState<string | null>(null);
  const [color, setColor] = useState<Picked | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setErr(null);
    try {
      const el = await readImage(f);
      const c = document.createElement("canvas");
      c.width = el.naturalWidth;
      c.height = el.naturalHeight;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("Could not process image.");
      ctx.drawImage(el, 0, 0);
      canvasRef.current = c;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(f);
      setSrc(urlRef.current);
      setColor(null);
      setPalette([]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load image.");
    }
  };

  const pick = (e: ReactMouseEvent<HTMLImageElement>) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = Math.min(c.width - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * c.width)));
    const y = Math.min(c.height - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * c.height)));
    let d: Uint8ClampedArray;
    try {
      d = ctx.getImageData(x, y, 1, 1).data;
    } catch {
      setErr("Could not read that pixel (the image may be protected).");
      return;
    }
    const [pr, pg, pb] = d;
    const hex = `#${[pr, pg, pb].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
    setColor({ hex, r: pr, g: pg, b: pb });
    setPalette((p) => (p[p.length - 1] === hex ? p : [...p.slice(-11), hex]));
  };

  return (
    <Card>
      <FileDrop accept="image/*" onFiles={onFiles} label="Drop an image here" />
      {err && <div className="mt-3"><Notice tone="warn">{err}</Notice></div>}
      {src && (
        <div className="mt-4 space-y-4">
          <div>
            <img
              src={src}
              alt="Pick a colour"
              onClick={pick}
              className="max-h-[480px] w-auto cursor-crosshair rounded-xl border border-gold/25"
              draggable={false}
            />
            <p className="mt-1 text-xs text-sage/60">Click anywhere on the image to sample that pixel's colour.</p>
          </div>
          {color && (
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gold/25 bg-ink-2/70 p-4">
              <div className="h-16 w-16 rounded-xl border border-gold/40" style={{ backgroundColor: color.hex }} />
              <div className="space-y-1">
                <p className="font-display text-xl font-bold text-cream">{color.hex}</p>
                <p className="font-mono text-sm text-sage">rgb({color.r}, {color.g}, {color.b})</p>
              </div>
              <CopyBtn text={color.hex} label="Copy HEX" />
              <CopyBtn text={`rgb(${color.r}, ${color.g}, ${color.b})`} label="Copy RGB" />
            </div>
          )}
          {palette.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-cream">Palette history</p>
                <Btn variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => setPalette([])}>
                  Clear
                </Btn>
              </div>
              <div className="flex flex-wrap gap-2">
                {palette.map((hex, i) => (
                  <button
                    key={`${hex}-${i}`}
                    title={`${hex} — click to copy`}
                    onClick={() => navigator.clipboard.writeText(hex).catch(() => {})}
                    className="flex items-center gap-2 rounded-lg border border-gold/25 bg-ink-2/70 px-2 py-1.5 text-xs font-mono text-cream transition hover:border-gold/60"
                  >
                    <span className="h-5 w-5 rounded border border-white/20" style={{ backgroundColor: hex }} />
                    {hex}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/* ---------------- 11. Image → ASCII ---------------- */

const ASCII_SETS: Record<string, string> = {
  "Classic": "@%#*+=-:. ",
  "Detailed": "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
  "Blocks": "█▓▒░ ",
  "Minimal": "#@%*+=-. ",
};

function toAscii(el: HTMLImageElement, cols: number, chars: string, invert: boolean): string {
  const aspect = el.naturalHeight / el.naturalWidth;
  const rows = Math.max(1, Math.round(cols * aspect * 0.55));
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(el, 0, 0, cols, rows);
  const data = ctx.getImageData(0, 0, cols, rows).data;
  const n = chars.length - 1;
  let out = "";
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      let idx = Math.round((lum / 255) * n);
      if (invert) idx = n - idx;
      out += chars[idx];
    }
    if (y < rows - 1) out += "\n";
  }
  return out;
}

export function ImageAsciiTool() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [cols, setCols] = useState(100);
  const [setName, setSetName] = useState("Classic");
  const [invert, setInvert] = useState(false);
  const [ascii, setAscii] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setErr(null);
    try {
      setImg(await readImage(f));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load image.");
    }
  };

  useEffect(() => {
    if (!img) {
      setAscii("");
      return;
    }
    try {
      setAscii(toAscii(img, cols, ASCII_SETS[setName] ?? ASCII_SETS["Classic"], invert));
    } catch {
      setErr("Could not convert that image to ASCII.");
    }
  }, [img, cols, setName, invert]);

  return (
    <Card>
      <FileDrop accept="image/*" onFiles={onFiles} label="Drop a photo here" />
      {err && <div className="mt-3"><Notice tone="warn">{err}</Notice></div>}
      {img && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Width (characters)">
              <Slider value={cols} min={30} max={220} onChange={setCols} format={(v) => `${v} chars`} />
            </Field>
            <Field label="Character set">
              <Select value={setName} onChange={setSetName} options={Object.keys(ASCII_SETS).map((k) => ({ value: k, label: k }))} />
            </Field>
          </div>
          <Check label="Invert (dark background art)" checked={invert} onChange={setInvert} />
          {ascii && (
            <div className="rounded-xl border border-gold/25 bg-black/60 p-4">
              <pre className="max-h-[480px] overflow-auto whitespace-pre font-mono text-[10px] leading-[1.1] text-gold-light">
                {ascii}
              </pre>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <CopyBtn text={ascii} label="Copy ASCII art" />
            <Btn variant="secondary" onClick={() => downloadBlob(new Blob([ascii], { type: "text/plain" }), "ascii-art.txt")}>
              Download .txt
            </Btn>
          </div>
          <Notice>Tip: high-contrast photos with a clear subject make the best ASCII art. Best viewed in a monospace font.</Notice>
        </div>
      )}
    </Card>
  );
}
