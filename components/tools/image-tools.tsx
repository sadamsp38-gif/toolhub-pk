"use client";

import { useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Card, Field, Stat, NumInput, Select, Slider, Check, Btn, downloadBlob, FileDrop } from "../ui";

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not decode image"));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

type ImgFormat = "jpg" | "png" | "webp";

const mimeOf = (f: string) =>
  f === "jpg" || f === "jpeg" ? "image/jpeg" : f === "png" ? "image/png" : "image/webp";

const FORMAT_OPTIONS = [
  { value: "jpg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
];

/* ------------------------------ Resize ------------------------------ */
export function ImageResizeTool() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [natW, setNatW] = useState(0);
  const [natH, setNatH] = useState(0);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [lock, setLock] = useState(true);
  const [format, setFormat] = useState<ImgFormat>("jpg");

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    const el = await loadImage(f);
    setImg(el);
    setNatW(el.naturalWidth);
    setNatH(el.naturalHeight);
    setWidth(String(el.naturalWidth));
    setHeight(String(el.naturalHeight));
  };

  const onWidth = (v: string) => {
    setWidth(v);
    if (lock && natW > 0) {
      const w = parseInt(v, 10);
      setHeight(Number.isFinite(w) && w > 0 ? String(Math.round((w * natH) / natW)) : "");
    }
  };

  const onHeight = (v: string) => {
    setHeight(v);
    if (lock && natH > 0) {
      const h = parseInt(v, 10);
      setWidth(Number.isFinite(h) && h > 0 ? String(Math.round((h * natW) / natH)) : "");
    }
  };

  const resize = () => {
    if (!img) return;
    const w = parseInt(width, 10);
    const h = parseInt(height, 10);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, w, h);
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `resized.${format}`);
    }, mimeOf(format));
  };

  return (
    <Card>
      <FileDrop accept="image/*" onFiles={onFiles} label="Drop an image here" />
      {img && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-sage">
            Original: {natW} × {natH} px
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Width (px)">
              <NumInput value={width} onChange={onWidth} min={1} />
            </Field>
            <Field label="Height (px)">
              <NumInput value={height} onChange={onHeight} min={1} />
            </Field>
          </div>
          <Check label="Lock aspect ratio" checked={lock} onChange={setLock} />
          <div className="grid grid-cols-2 items-end gap-3">
            <Field label="Format">
              <Select value={format} onChange={(v) => setFormat(v as ImgFormat)} options={FORMAT_OPTIONS} />
            </Field>
            <Btn onClick={resize}>Resize & Download</Btn>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ----------------------------- Compress ----------------------------- */
export function ImageCompressTool() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [origKB, setOrigKB] = useState(0);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<"jpeg" | "webp">("jpeg");
  const [compKB, setCompKB] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const urlRef = useRef<string | null>(null);

  const recompute = (el: HTMLImageElement, q: number, fmt: string) => {
    const canvas = document.createElement("canvas");
    canvas.width = el.naturalWidth;
    canvas.height = el.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(el, 0, 0);
    canvas.toBlob((b) => {
      if (!b) return;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(b);
      setBlob(b);
      setCompKB(b.size / 1024);
      setPreview(urlRef.current);
    }, mimeOf(fmt), q / 100);
  };

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    const el = await loadImage(f);
    setImg(el);
    setOrigKB(f.size / 1024);
    setQuality(80);
    recompute(el, 80, format);
  };

  const onQuality = (q: number) => {
    setQuality(q);
    if (img) recompute(img, q, format);
  };

  const onFormat = (fmt: string) => {
    const f = fmt as "jpeg" | "webp";
    setFormat(f);
    if (img) recompute(img, quality, f);
  };

  const savedPct =
    compKB !== null && compKB < origKB ? `${((1 - compKB / origKB) * 100).toFixed(1)}%` : "—";

  return (
    <Card>
      <FileDrop accept="image/*" onFiles={onFiles} label="Drop an image here" />
      {img && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Original" value={`${origKB.toFixed(1)} KB`} />
            <Stat label="Compressed" value={compKB !== null ? `${compKB.toFixed(1)} KB` : "—"} />
            <Stat label="Saved" value={savedPct} accent />
          </div>
          <Field label="Quality">
            <Slider value={quality} min={5} max={100} onChange={onQuality} format={(v) => `${v}%`} />
          </Field>
          <div className="grid grid-cols-2 items-end gap-3">
            <Field label="Format">
              <Select
                value={format}
                onChange={onFormat}
                options={[
                  { value: "jpeg", label: "JPEG" },
                  { value: "webp", label: "WebP" },
                ]}
              />
            </Field>
            <Btn
              onClick={() => blob && downloadBlob(blob, `compressed.${format === "jpeg" ? "jpg" : "webp"}`)}
              disabled={!blob}
            >
              Download
            </Btn>
          </div>
          {preview && (
            <div className="rounded-xl border border-gold/25 bg-ink-2/70 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sage/60">Preview</p>
              <img src={preview} alt="Compressed preview" className="max-h-[320px] w-auto rounded-lg" />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/* ----------------------------- Convert ----------------------------- */
export function ImageConvertTool() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [format, setFormat] = useState<ImgFormat>("png");
  const [quality, setQuality] = useState(90);

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setImg(await loadImage(f));
  };

  const convert = () => {
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    canvas.toBlob(
      (b) => {
        if (b) downloadBlob(b, `converted.${format}`);
      },
      mimeOf(format),
      format === "png" ? undefined : quality / 100
    );
  };

  const showQuality = format === "jpg" || format === "webp";

  return (
    <Card>
      <FileDrop accept="image/*" onFiles={onFiles} label="Drop an image here" />
      {img && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-sage">
            {img.naturalWidth} × {img.naturalHeight} px
          </p>
          <Field label="Target format">
            <Select value={format} onChange={(v) => setFormat(v as ImgFormat)} options={FORMAT_OPTIONS} />
          </Field>
          {showQuality && (
            <Field label="Quality">
              <Slider value={quality} min={5} max={100} onChange={setQuality} format={(v) => `${v}%`} />
            </Field>
          )}
          <Btn onClick={convert}>Convert & Download</Btn>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------- Crop ------------------------------- */
type Rect = { x: number; y: number; w: number; h: number };

export function ImageCropTool() {
  const [loaded, setLoaded] = useState(false);
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [sel, setSel] = useState<Rect | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [format, setFormat] = useState<ImgFormat>("png");
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const urlRef = useRef<string | null>(null);

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    await loadImage(f);
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = URL.createObjectURL(f);
    setSrcUrl(urlRef.current);
    setLoaded(true);
    setSel(null);
  };

  const pos = (e: ReactMouseEvent) => {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDown = (e: ReactMouseEvent) => {
    const p = pos(e);
    setDragStart(p);
    setSel({ x: p.x, y: p.y, w: 0, h: 0 });
  };

  const onMove = (e: ReactMouseEvent) => {
    if (!dragStart) return;
    const p = pos(e);
    setSel({
      x: Math.min(dragStart.x, p.x),
      y: Math.min(dragStart.y, p.y),
      w: Math.abs(p.x - dragStart.x),
      h: Math.abs(p.y - dragStart.y),
    });
  };

  const onUp = () => setDragStart(null);

  const crop = () => {
    const el = imgRef.current;
    if (!el || !sel || sel.w < 1 || sel.h < 1) return;
    const sx = el.naturalWidth / el.clientWidth;
    const sy = el.naturalHeight / el.clientHeight;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sel.w * sx));
    canvas.height = Math.max(1, Math.round(sel.h * sy));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(el, sel.x * sx, sel.y * sy, sel.w * sx, sel.h * sy, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((b) => {
      if (b) downloadBlob(b, `cropped.${format}`);
    }, mimeOf(format));
  };

  const hasSel = sel !== null && sel.w >= 1 && sel.h >= 1;

  return (
    <Card>
      <FileDrop accept="image/*" onFiles={onFiles} label="Drop an image here" />
      {loaded && srcUrl && (
        <div className="mt-4 space-y-4">
          <div>
            <div
              ref={boxRef}
              className="relative inline-block cursor-crosshair select-none overflow-hidden rounded-xl border border-gold/25"
              onMouseDown={onDown}
              onMouseMove={onMove}
              onMouseUp={onUp}
              onMouseLeave={onUp}
            >
              <img ref={imgRef} src={srcUrl} alt="Crop source" className="max-h-[480px] w-auto" draggable={false} />
              {hasSel && sel && (
                <div
                  className="pointer-events-none absolute border-2 border-gold bg-gold/20"
                  style={{ left: sel.x, top: sel.y, width: sel.w, height: sel.h }}
                />
              )}
            </div>
            <p className="mt-1 text-xs text-sage/60">Drag on the image to select the crop area.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-44">
              <Field label="Format">
                <Select value={format} onChange={(v) => setFormat(v as ImgFormat)} options={FORMAT_OPTIONS} />
              </Field>
            </div>
            <Btn onClick={crop} disabled={!hasSel}>
              Crop & Download
            </Btn>
            <Btn variant="ghost" onClick={() => setSel(null)}>
              Reset selection
            </Btn>
          </div>
        </div>
      )}
    </Card>
  );
}
