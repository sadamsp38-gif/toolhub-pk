"use client";

import { useState } from "react";
import { PDFDocument, PDFImage, PDFFont, degrees, rgb, StandardFonts } from "pdf-lib";
import {
  Card, Field, Stat, TextInput, NumInput, TextArea, Select, Slider, Check,
  Btn, CopyBtn, downloadBlob, FileDrop, Tabs, Notice,
} from "../ui";

const kb = (n: number) => (n / 1024).toFixed(1);
const mb = (n: number) => (n / 1024 / 1024).toFixed(2);

function baseName(name: string): string {
  const b = name.replace(/\.[^.]+$/, "");
  return b || "document";
}

/** Parse "1-3, 5" into sorted zero-based page indices, or null when invalid. */
function parsePageSpec(spec: string, count: number): number[] | null {
  const parts = spec.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const idxs = new Set<number>();
  for (const part of parts) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!m) return null;
    const a = parseInt(m[1], 10);
    const b = m[2] !== undefined ? parseInt(m[2], 10) : a;
    if (a < 1 || b > count || a > b) return null;
    for (let p = a; p <= b; p++) idxs.add(p - 1);
  }
  return [...idxs].sort((x, y) => x - y);
}

async function loadPdf(file: File): Promise<PDFDocument> {
  return PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
}

/* ------------------------------ Rotate ------------------------------ */
export function PdfRotateTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [angle, setAngle] = useState("90");
  const [scope, setScope] = useState("all");
  const [spec, setSpec] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setPageCount(null);
    try {
      setPageCount((await loadPdf(f)).getPageCount());
    } catch {
      setError("Could not read this PDF — it may be corrupted or encrypted.");
    }
  };

  const rotate = async () => {
    if (!file || pageCount === null || busy) return;
    const idxs = scope === "all" ? Array.from({ length: pageCount }, (_, i) => i) : parsePageSpec(spec, pageCount);
    if (!idxs || idxs.length === 0) {
      setError('Invalid page selection. Use e.g. "1, 3, 5-7".');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const doc = await loadPdf(file);
      const add = parseInt(angle, 10);
      for (const i of idxs) {
        const page = doc.getPage(i);
        page.setRotation(degrees((page.getRotation().angle + add) % 360));
      }
      const bytes = await doc.save();
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), `${baseName(file.name)}-rotated.pdf`);
    } catch {
      setError("Rotating failed — the file may be corrupted.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <FileDrop accept="application/pdf" onFiles={onFiles} label="Drop a PDF here" />
      {file && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-sage">
            <span className="font-semibold text-cream">{file.name}</span> ·{" "}
            {pageCount === null ? "reading…" : `${pageCount} pages`}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rotate by">
              <Select
                value={angle}
                onChange={setAngle}
                options={[
                  { value: "90", label: "90° clockwise" },
                  { value: "180", label: "180°" },
                  { value: "270", label: "270° clockwise (90° counter-clockwise)" },
                ]}
              />
            </Field>
            <Field label="Pages">
              <Select
                value={scope}
                onChange={setScope}
                options={[
                  { value: "all", label: "All pages" },
                  { value: "custom", label: "Selected pages" },
                ]}
              />
            </Field>
          </div>
          {scope === "custom" && (
            <Field label="Page selection" hint='Comma-separated, e.g. "1, 3, 5-7"'>
              <TextInput value={spec} onChange={(e) => setSpec(e.target.value)} placeholder="1, 3, 5-7" />
            </Field>
          )}
          {error && <Notice tone="warn">{error}</Notice>}
          <Btn onClick={rotate} disabled={pageCount === null || busy}>
            {busy ? "Rotating…" : "Rotate PDF"}
          </Btn>
        </div>
      )}
    </Card>
  );
}

/* ---------------------------- Extract pages ---------------------------- */
export function PdfExtractPagesTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [ranges, setRanges] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setPageCount(null);
    try {
      setPageCount((await loadPdf(f)).getPageCount());
    } catch {
      setError("Could not read this PDF — it may be corrupted or encrypted.");
    }
  };

  const extract = async () => {
    if (!file || pageCount === null || busy) return;
    const idxs = parsePageSpec(ranges, pageCount);
    if (!idxs || idxs.length === 0) {
      setError(`Invalid ranges. Use e.g. "1-3, 5" with pages between 1 and ${pageCount}.`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const src = await loadPdf(file);
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, idxs);
      pages.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), `${baseName(file.name)}-extracted.pdf`);
    } catch {
      setError("Extraction failed — the file may be corrupted.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <FileDrop accept="application/pdf" onFiles={onFiles} label="Drop a PDF here" />
      {file && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-sage">
            <span className="font-semibold text-cream">{file.name}</span> ·{" "}
            {pageCount === null ? "reading…" : `${pageCount} pages`}
          </p>
          <Field label="Pages to extract" hint='Comma-separated ranges, e.g. "1-3, 5, 8-10". Order is kept as typed.'>
            <TextInput
              value={ranges}
              onChange={(e) => setRanges(e.target.value)}
              placeholder="1-3, 5, 8-10"
              disabled={pageCount === null}
            />
          </Field>
          {error && <Notice tone="warn">{error}</Notice>}
          <Btn onClick={extract} disabled={pageCount === null || busy}>
            {busy ? "Extracting…" : "Extract pages"}
          </Btn>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------ Watermark ------------------------------ */
const WM_COLORS: Record<string, [number, number, number]> = {
  gold: [0.83, 0.69, 0.22],
  grey: [0.5, 0.53, 0.55],
  red: [0.85, 0.28, 0.28],
  blue: [0.28, 0.47, 0.85],
};

export function PdfWatermarkTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [text, setText] = useState("DRAFT");
  const [opacity, setOpacity] = useState(25);
  const [fontSize, setFontSize] = useState(64);
  const [color, setColor] = useState("gold");
  const [repeat, setRepeat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setPageCount(null);
    try {
      setPageCount((await loadPdf(f)).getPageCount());
    } catch {
      setError("Could not read this PDF — it may be corrupted or encrypted.");
    }
  };

  const apply = async () => {
    if (!file || pageCount === null || busy) return;
    if (!text.trim()) {
      setError("Enter some watermark text first.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const doc = await loadPdf(file);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const [r, g, b] = WM_COLORS[color] ?? WM_COLORS.gold;
      const tw = font.widthOfTextAtSize(text, fontSize);
      const rad = (45 * Math.PI) / 180;
      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const draw = (x: number, y: number) =>
          page.drawText(text, {
            x, y, size: fontSize, font,
            color: rgb(r, g, b), opacity: opacity / 100, rotate: degrees(45),
          });
        if (repeat) {
          for (let gx = 30; gx < width; gx += tw * 0.85) {
            for (let gy = 50; gy < height; gy += fontSize * 3.1) draw(gx, gy);
          }
        } else {
          draw(width / 2 - (tw * Math.cos(rad)) / 2, height / 2 - (tw * Math.sin(rad)) / 2 - fontSize * 0.25);
        }
      }
      const bytes = await doc.save();
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), `${baseName(file.name)}-watermarked.pdf`);
    } catch {
      setError("Adding the watermark failed — the file may be corrupted.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <FileDrop accept="application/pdf" onFiles={onFiles} label="Drop a PDF here" />
      {file && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-sage">
            <span className="font-semibold text-cream">{file.name}</span> ·{" "}
            {pageCount === null ? "reading…" : `${pageCount} pages`}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Watermark text">
              <TextInput value={text} onChange={(e) => setText(e.target.value)} placeholder="CONFIDENTIAL" maxLength={40} />
            </Field>
            <Field label="Colour">
              <Select
                value={color}
                onChange={setColor}
                options={[
                  { value: "gold", label: "Gold" },
                  { value: "grey", label: "Grey" },
                  { value: "red", label: "Red" },
                  { value: "blue", label: "Blue" },
                ]}
              />
            </Field>
          </div>
          <Field label="Opacity">
            <Slider value={opacity} min={5} max={90} onChange={setOpacity} format={(v) => `${v}%`} />
          </Field>
          <Field label="Font size">
            <Slider value={fontSize} min={24} max={144} onChange={setFontSize} format={(v) => `${v} pt`} />
          </Field>
          <Check label="Repeat the watermark across the whole page" checked={repeat} onChange={setRepeat} />
          {error && <Notice tone="warn">{error}</Notice>}
          <Btn onClick={apply} disabled={pageCount === null || busy}>
            {busy ? "Stamping…" : "Add watermark"}
          </Btn>
        </div>
      )}
    </Card>
  );
}

/* ---------------------------- Page numbers ---------------------------- */
export function PdfPageNumbersTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [position, setPosition] = useState("bottom-center");
  const [start, setStart] = useState("1");
  const [fontSize, setFontSize] = useState(11);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setPageCount(null);
    try {
      setPageCount((await loadPdf(f)).getPageCount());
    } catch {
      setError("Could not read this PDF — it may be corrupted or encrypted.");
    }
  };

  const apply = async () => {
    if (!file || pageCount === null || busy) return;
    const startNum = parseInt(start, 10);
    if (Number.isNaN(startNum) || startNum < 1) {
      setError("Start number must be 1 or higher.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const doc = await loadPdf(file);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const margin = 36;
      pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        const label = `Page ${startNum + i} of ${startNum + pageCount - 1}`;
        const tw = font.widthOfTextAtSize(label, fontSize);
        let x = (width - tw) / 2;
        let y = margin - fontSize;
        if (position.startsWith("bottom-right")) x = width - tw - margin;
        else if (position.startsWith("bottom-left")) x = margin;
        else if (position === "top-center") y = height - margin;
        else if (position === "top-right") { x = width - tw - margin; y = height - margin; }
        page.drawText(label, { x, y, size: fontSize, font, color: rgb(0.35, 0.37, 0.4) });
      });
      const bytes = await doc.save();
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), `${baseName(file.name)}-numbered.pdf`);
    } catch {
      setError("Numbering failed — the file may be corrupted.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <FileDrop accept="application/pdf" onFiles={onFiles} label="Drop a PDF here" />
      {file && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-sage">
            <span className="font-semibold text-cream">{file.name}</span> ·{" "}
            {pageCount === null ? "reading…" : `${pageCount} pages`}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Position">
              <Select
                value={position}
                onChange={setPosition}
                options={[
                  { value: "bottom-center", label: "Bottom centre" },
                  { value: "bottom-left", label: "Bottom left" },
                  { value: "bottom-right", label: "Bottom right" },
                  { value: "top-center", label: "Top centre" },
                  { value: "top-right", label: "Top right" },
                ]}
              />
            </Field>
            <Field label="Start numbering at">
              <NumInput value={start} onChange={setStart} min={1} placeholder="1" />
            </Field>
            <Field label="Font size">
              <Slider value={fontSize} min={8} max={20} onChange={setFontSize} format={(v) => `${v} pt`} />
            </Field>
          </div>
          {error && <Notice tone="warn">{error}</Notice>}
          <Btn onClick={apply} disabled={pageCount === null || busy}>
            {busy ? "Numbering…" : "Add page numbers"}
          </Btn>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------ Metadata ------------------------------ */
export function PdfMetadataTool() {
  const [file, setFile] = useState<File | null>(null);
  const [tab, setTab] = useState("View");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [keywords, setKeywords] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setFile(f);
    setError(null);
    try {
      const doc = await loadPdf(f);
      setTitle(doc.getTitle() ?? "");
      setAuthor(doc.getAuthor() ?? "");
      setSubject(doc.getSubject() ?? "");
      setKeywords(doc.getKeywords() ?? "");
    } catch {
      setError("Could not read this PDF — it may be corrupted or encrypted.");
    }
  };

  const save = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    try {
      const doc = await loadPdf(file);
      doc.setTitle(title);
      doc.setAuthor(author);
      doc.setSubject(subject);
      doc.setKeywords(keywords.split(",").map((k) => k.trim()).filter(Boolean));
      const bytes = await doc.save();
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), `${baseName(file.name)}-metadata.pdf`);
    } catch {
      setError("Saving metadata failed — the file may be corrupted.");
    } finally {
      setBusy(false);
    }
  };

  const rows: [string, string][] = [
    ["Title", title || "—"],
    ["Author", author || "—"],
    ["Subject", subject || "—"],
    ["Keywords", keywords || "—"],
  ];

  return (
    <Card>
      <FileDrop accept="application/pdf" onFiles={onFiles} label="Drop a PDF here" />
      {file && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-sage">
            <span className="font-semibold text-cream">{file.name}</span>
          </p>
          <Tabs tabs={["View", "Edit"]} active={tab} onChange={setTab} />
          {tab === "View" ? (
            <dl className="space-y-2">
              {rows.map(([k, v]) => (
                <div key={k} className="flex gap-3 rounded-xl border border-gold/20 bg-ink-2/70 px-3 py-2.5">
                  <dt className="w-24 shrink-0 text-xs font-semibold uppercase tracking-widest text-sage">{k}</dt>
                  <dd className="min-w-0 flex-1 break-words text-sm text-cream">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="space-y-4">
              <Field label="Title"><TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" /></Field>
              <Field label="Author"><TextInput value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" /></Field>
              <Field label="Subject"><TextInput value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" /></Field>
              <Field label="Keywords" hint="Separate keywords with commas.">
                <TextInput value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="report, 2026, finance" />
              </Field>
              {error && <Notice tone="warn">{error}</Notice>}
              <Btn onClick={save} disabled={busy}>
                {busy ? "Saving…" : "Save & download"}
              </Btn>
            </div>
          )}
          {tab === "View" && error && <Notice tone="warn">{error}</Notice>}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------- Info -------------------------------- */
interface PdfInfo {
  version: string;
  encrypted: boolean;
  pages: number;
  sizes: { label: string; count: number }[];
  created?: string;
  modified?: string;
}

function guessPaper(w: number, h: number): string {
  const key = `${Math.round(w)}×${Math.round(h)}`;
  const known: Record<string, string> = {
    "595×842": "A4", "842×1191": "A3", "420×595": "A5", "612×792": "Letter",
    "612×1008": "Legal", "841×595": "A4 landscape", "792×612": "Letter landscape",
  };
  return known[key] ? `${key} pt (${known[key]})` : `${key} pt`;
}

export function PdfInfoTool() {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<PdfInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setFile(f);
    setInfo(null);
    setError(null);
    setBusy(true);
    try {
      const buf = await f.arrayBuffer();
      const head = new TextDecoder().decode(new Uint8Array(buf).slice(0, 16));
      const vm = /%PDF-(\d\.\d)/.exec(head);
      let doc: PDFDocument;
      let encrypted = false;
      try {
        doc = await PDFDocument.load(buf);
      } catch (e) {
        if (/encrypt/i.test(String(e))) {
          encrypted = true;
          doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        } else {
          throw e;
        }
      }
      const sizeMap = new Map<string, number>();
      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const key = guessPaper(width, height);
        sizeMap.set(key, (sizeMap.get(key) ?? 0) + 1);
      }
      const created = doc.getCreationDate();
      const modified = doc.getModificationDate();
      setInfo({
        version: vm ? vm[1] : "unknown",
        encrypted,
        pages: doc.getPageCount(),
        sizes: [...sizeMap.entries()].map(([label, count]) => ({ label, count })),
        created: created ? created.toLocaleDateString() : undefined,
        modified: modified ? modified.toLocaleDateString() : undefined,
      });
    } catch {
      setError("Could not read this PDF — it may be corrupted.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <FileDrop accept="application/pdf" onFiles={onFiles} label="Drop a PDF here" />
      {error && <div className="mt-4"><Notice tone="warn">{error}</Notice></div>}
      {busy && <p className="mt-4 text-sm text-sage">Analysing…</p>}
      {file && info && (
        <div className="mt-4 space-y-4">
          <p className="truncate text-sm text-sage">
            <span className="font-semibold text-cream">{file.name}</span>
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Pages" value={String(info.pages)} />
            <Stat label="File size" value={file.size > 1048576 ? `${mb(file.size)} MB` : `${kb(file.size)} KB`} />
            <Stat label="PDF version" value={info.version} />
            <Stat label="Encrypted" value={info.encrypted ? "Yes" : "No"} accent={info.encrypted} />
          </div>
          <div className="space-y-2">
            {info.sizes.map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-xl border border-gold/20 bg-ink-2/70 px-3 py-2.5 text-sm">
                <span className="text-cream">{s.label}</span>
                <span className="text-sage">{s.count} page{s.count === 1 ? "" : "s"}</span>
              </div>
            ))}
          </div>
          {(info.created || info.modified) && (
            <p className="text-xs text-sage/70">
              {info.created && <>Created: {info.created}</>}
              {info.created && info.modified && " · "}
              {info.modified && <>Modified: {info.modified}</>}
            </p>
          )}
          <Notice>This is a read-only report — the file itself is never changed.</Notice>
        </div>
      )}
    </Card>
  );
}

/* ---------------------------- Images to PDF ---------------------------- */
interface ImgItem {
  file: File;
  url: string;
}

const PAGE_SIZES: Record<string, [number, number] | null> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  fit: null, // page matches each image
};

function loadImageEl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = url;
  });
}

async function embedFile(out: PDFDocument, f: File): Promise<PDFImage> {
  const buf = new Uint8Array(await f.arrayBuffer());
  if (f.type === "image/jpeg" || /\.jpe?g$/i.test(f.name)) return out.embedJpg(buf);
  if (f.type === "image/png" || /\.png$/i.test(f.name)) return out.embedPng(buf);
  // other formats (e.g. webp) → rasterise to PNG via canvas
  const url = URL.createObjectURL(new Blob([buf as BlobPart], { type: f.type || "image/png" }));
  try {
    const img = await loadImageEl(url);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(img, 0, 0);
    const b64 = canvas.toDataURL("image/png").split(",")[1] ?? "";
    return out.embedPng(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ImagesToPdfTool() {
  const [items, setItems] = useState<ImgItem[]>([]);
  const [pageSize, setPageSize] = useState("a4");
  const [mode, setMode] = useState("fit");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const addFiles = (incoming: File[]) => {
    const imgs = incoming.filter((f) => f.type.startsWith("image/"));
    if (imgs.length < incoming.length) setError("Only image files were kept — non-images were skipped.");
    else setError(null);
    setItems((prev) => [...prev, ...imgs.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  };

  const removeAt = (idx: number) => {
    setItems((prev) => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const build = async () => {
    if (items.length === 0 || busy) return;
    setError(null);
    setBusy(true);
    try {
      const out = await PDFDocument.create();
      for (const { file } of items) {
        const embedded = await embedFile(out, file);
        const { width: iw, height: ih } = embedded.scale(1);
        const fixed = PAGE_SIZES[pageSize] ?? null;
        const [pw, ph] = fixed ?? [iw, ih];
        const page = out.addPage([pw, ph]);
        const s = mode === "fit" ? Math.min(pw / iw, ph / ih) : Math.max(pw / iw, ph / ih);
        const dw = iw * s;
        const dh = ih * s;
        page.drawImage(embedded, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
      }
      const bytes = await out.save();
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), "images.pdf");
    } catch {
      setError("Building the PDF failed — one of the images may be unreadable.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <FileDrop accept="image/*" multiple onFiles={addFiles} label="Drop images here" />
      {items.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((it, i) => (
            <div key={`${it.file.name}-${i}`} className="relative overflow-hidden rounded-xl border border-gold/25">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.url} alt={it.file.name} className="h-24 w-full object-cover" />
              <button
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 rounded-lg bg-ink/80 px-2 py-0.5 text-xs font-bold text-red-400 hover:bg-ink"
                aria-label={`Remove ${it.file.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      {items.length > 0 && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Page size">
              <Select
                value={pageSize}
                onChange={setPageSize}
                options={[
                  { value: "a4", label: "A4" },
                  { value: "letter", label: "US Letter" },
                  { value: "fit", label: "Match each image" },
                ]}
              />
            </Field>
            <Field label="Image sizing" hint={pageSize === "fit" ? "Page matches each image, so sizing is automatic." : "Fit shows the whole photo; fill crops to cover the page."}>
              <Select
                value={mode}
                onChange={setMode}
                options={[
                  { value: "fit", label: "Fit (no cropping)" },
                  { value: "fill", label: "Fill (crop to page)" },
                ]}
              />
            </Field>
          </div>
          {error && <Notice tone="warn">{error}</Notice>}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-sage">
              {items.length} image{items.length === 1 ? "" : "s"} → 1 PDF
            </p>
            <Btn onClick={build} disabled={busy}>
              {busy ? "Building…" : "Create PDF"}
            </Btn>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------ Text to PDF ------------------------------ */
function wrapText(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(t, size) <= maxW || !cur) {
      cur = t;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.length > 0 ? lines : [""];
}

export function TextToPdfTool() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [fontSize, setFontSize] = useState(12);
  const [margin, setMargin] = useState(50);
  const [pages, setPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  const generate = async () => {
    if (!body.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const bold = await doc.embedFont(StandardFonts.HelveticaBold);
      const PW = 595.28;
      const PH = 841.89;
      const maxW = PW - margin * 2;
      const lineH = fontSize * 1.5;
      const ink = rgb(0.16, 0.17, 0.18);
      let page = doc.addPage([PW, PH]);
      let y = PH - margin;
      const newPage = () => {
        page = doc.addPage([PW, PH]);
        y = PH - margin;
      };
      const write = (txt: string, f: PDFFont, s: number) => {
        for (const line of wrapText(txt, f, s, maxW)) {
          if (y - s < margin) newPage();
          page.drawText(line, { x: margin, y: y - s, size: s, font: f, color: ink });
          y -= lineH;
        }
      };
      if (title.trim()) {
        write(title.trim(), bold, fontSize + 5);
        y -= lineH * 0.6;
      }
      for (const para of body.split("\n")) write(para, font, fontSize);
      setPages(doc.getPageCount());
      const bytes = await doc.save();
      downloadBlob(
        new Blob([bytes as BlobPart], { type: "application/pdf" }),
        `${baseName(title.trim()) || "document"}.pdf`
      );
    } catch {
      setError("Could not generate the PDF.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Title (optional)">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My document" />
        </Field>
        <Field label="Text">
          <TextArea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type or paste your text here…"
            rows={10}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Font size">
            <Slider value={fontSize} min={10} max={24} onChange={setFontSize} format={(v) => `${v} pt`} />
          </Field>
          <Field label="Page margins">
            <Slider value={margin} min={20} max={100} onChange={setMargin} format={(v) => `${v} pt`} />
          </Field>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-sage">
            {words} word{words === 1 ? "" : "s"}
            {pages !== null && ` · ${pages} page${pages === 1 ? "" : "s"} generated`}
          </p>
          <Btn onClick={generate} disabled={!body.trim() || busy}>
            {busy ? "Generating…" : "Download PDF"}
          </Btn>
        </div>
        {error && <Notice tone="warn">{error}</Notice>}
      </div>
    </Card>
  );
}

/* ------------------------------ PDF to text ------------------------------ */
/* pdfjs-dist is installed separately by the build coordinator (do not npm install). */
export function PdfToTextTool() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFiles = (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setFile(f);
    setText("");
    setError(null);
  };

  const extract = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    setText("");
    try {
      // @ts-ignore — pdfjs-dist types resolve once the package is installed
      const pdfjs = await import("pdfjs-dist");
      // @ts-ignore — worker module resolves once the package is installed
      const workerMod = await import("pdfjs-dist/build/pdf.worker.min.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = workerMod;
      const data = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjs.getDocument({ data }).promise;
      const n: number = pdf.numPages;
      let out = "";
      for (let i = 1; i <= n; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        let prevY: number | null = null;
        let pageText = "";
        for (const raw of content.items) {
          const it = raw as { str?: string; transform?: number[] };
          const s = it.str ?? "";
          if (!s) continue;
          const y = it.transform ? it.transform[5] : null;
          if (prevY !== null && y !== null && Math.abs(y - prevY) > 1) {
            pageText += "\n";
          } else if (pageText && !pageText.endsWith("\n")) {
            pageText += " ";
          }
          pageText += s;
          prevY = y;
        }
        out += `----- Page ${i} of ${n} -----\n${pageText.trim()}\n\n`;
      }
      const finalText = out.trim();
      setText(finalText);
      if (!finalText) setError("No extractable text found — this PDF may be made of scanned images.");
    } catch {
      setError("Text extraction failed. If the pdfjs-dist package is not installed in the project, this tool cannot run.");
    } finally {
      setBusy(false);
    }
  };

  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;

  return (
    <Card>
      <FileDrop accept="application/pdf" onFiles={onFiles} label="Drop a PDF here" />
      {file && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-sage">
            <span className="font-semibold text-cream">{file.name}</span>
          </p>
          <Btn onClick={extract} disabled={busy}>
            {busy ? "Extracting…" : "Extract text"}
          </Btn>
          {error && <Notice tone="warn">{error}</Notice>}
          {text && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-sage">
                  {text.length.toLocaleString()} characters · {words.toLocaleString()} words
                </p>
                <div className="flex gap-2">
                  <CopyBtn text={text} label="Copy text" />
                  <Btn
                    variant="secondary"
                    onClick={() => downloadBlob(new Blob([text], { type: "text/plain" }), `${baseName(file.name)}.txt`)}
                  >
                    Download .txt
                  </Btn>
                </div>
              </div>
              <TextArea value={text} readOnly rows={14} />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
