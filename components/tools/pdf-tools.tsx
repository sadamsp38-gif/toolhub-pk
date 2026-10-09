"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Card, Field, Stat, TextInput, Btn, downloadBlob, FileDrop, Notice } from "../ui";

const kb = (n: number) => (n / 1024).toFixed(1);

/* ------------------------------ Merge ------------------------------ */
export function PdfMergeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageCounts, setPageCounts] = useState<(number | null)[]>([]);
  const [busy, setBusy] = useState(false);

  const addFiles = (incoming: File[]) => {
    const base = files.length;
    setFiles((prev) => [...prev, ...incoming]);
    setPageCounts((prev) => [...prev, ...incoming.map(() => null)]);
    incoming.forEach((f, i) => {
      f.arrayBuffer()
        .then((buf) => PDFDocument.load(buf, { ignoreEncryption: true }))
        .then((doc) => {
          setPageCounts((prev) => {
            const copy = [...prev];
            copy[base + i] = doc.getPageCount();
            return copy;
          });
        })
        .catch(() => {
          setPageCounts((prev) => {
            const copy = [...prev];
            copy[base + i] = -1;
            return copy;
          });
        });
    });
  };

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= files.length) return;
    const nf = [...files];
    [nf[idx], nf[j]] = [nf[j], nf[idx]];
    setFiles(nf);
    const np = [...pageCounts];
    [np[idx], np[j]] = [np[j], np[idx]];
    setPageCounts(np);
  };

  const removeAt = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPageCounts((prev) => prev.filter((_, i) => i !== idx));
  };

  const merge = async () => {
    if (files.length === 0 || busy) return;
    setBusy(true);
    try {
      const out = await PDFDocument.create();
      for (const f of files) {
        const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
        const pages = await out.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      const bytes = await out.save();
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), "merged.pdf");
    } finally {
      setBusy(false);
    }
  };

  const totalPages = pageCounts.reduce<number>((a, p) => a + (p !== null && p > 0 ? p : 0), 0);

  return (
    <Card>
      <FileDrop accept="application/pdf" multiple onFiles={addFiles} label="Drop PDF files here" />
      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-gold/25 bg-ink-2/70 px-3 py-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-sm font-bold text-gold-light">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-cream">{f.name}</p>
                <p className="text-xs text-sage/60">
                  {kb(f.size)} KB ·{" "}
                  {pageCounts[i] === null ? "reading…" : pageCounts[i] === -1 ? "unreadable" : `${pageCounts[i]} pages`}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Btn variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} className="px-3 py-1.5">↑</Btn>
                <Btn variant="ghost" onClick={() => move(i, 1)} disabled={i === files.length - 1} className="px-3 py-1.5">↓</Btn>
                <Btn variant="ghost" onClick={() => removeAt(i)} className="px-3 py-1.5 text-red-600">✕</Btn>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-sage">
          {files.length} file{files.length === 1 ? "" : "s"} · {totalPages} pages
        </p>
        <Btn onClick={merge} disabled={files.length === 0 || busy}>
          {busy ? "Merging…" : "Merge PDFs"}
        </Btn>
      </div>
    </Card>
  );
}

/* ------------------------------ Split ------------------------------ */
export function PdfSplitTool() {
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
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
    } catch {
      setError("Could not read this PDF — it may be corrupted or encrypted.");
    }
  };

  /** Parse "1-3, 5, 8-10" into zero-based page-index groups, or null if invalid. */
  const parseRanges = (): number[][] | null => {
    if (pageCount === null) return null;
    const parts = ranges.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return null;
    const out: number[][] = [];
    for (const part of parts) {
      const m = /^(\d+)(?:-(\d+))?$/.exec(part);
      if (!m) return null;
      const a = parseInt(m[1], 10);
      const b = m[2] !== undefined ? parseInt(m[2], 10) : a;
      if (a < 1 || b > pageCount || a > b) return null;
      const idxs: number[] = [];
      for (let p = a; p <= b; p++) idxs.push(p - 1);
      out.push(idxs);
    }
    return out;
  };

  const split = async () => {
    if (!file || pageCount === null || busy) return;
    const parts = parseRanges();
    if (!parts) {
      setError(`Invalid ranges. Use e.g. "1-3, 5, 8-10" with pages between 1 and ${pageCount}.`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      let i = 1;
      for (const idxs of parts) {
        const doc = await PDFDocument.create();
        const pages = await doc.copyPages(src, idxs);
        pages.forEach((p) => doc.addPage(p));
        const bytes = await doc.save();
        downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), `split-part-${i}.pdf`);
        i += 1;
      }
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
            <span className="font-semibold">{file.name}</span> · {pageCount === null ? "reading…" : `${pageCount} pages`}
          </p>
          <Field label="Page ranges" hint='Comma-separated, e.g. "1-3, 5, 8-10"'>
            <TextInput
              value={ranges}
              onChange={(e) => setRanges(e.target.value)}
              placeholder="1-3, 5, 8-10"
              disabled={pageCount === null}
            />
          </Field>
          {error && <Notice tone="warn">{error}</Notice>}
          <Btn onClick={split} disabled={pageCount === null || busy}>
            {busy ? "Splitting…" : "Split"}
          </Btn>
        </div>
      )}
    </Card>
  );
}

/* ---------------------------- Compress ---------------------------- */
export function PdfCompressTool() {
  const [file, setFile] = useState<File | null>(null);
  const [after, setAfter] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const onFiles = (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setFile(f);
    setAfter(null);
  };

  const compress = async () => {
    if (!file || busy) return;
    setBusy(true);
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const bytes = await doc.save({ useObjectStreams: true });
      setAfter(bytes.length);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), "compressed.pdf");
    } finally {
      setBusy(false);
    }
  };

  const saved = file && after !== null && after < file.size ? ((1 - after / file.size) * 100).toFixed(1) : null;

  return (
    <Card>
      <FileDrop accept="application/pdf" onFiles={onFiles} label="Drop a PDF here" />
      <div className="mt-4">
        <Notice>Re-saves with object streams; text stays perfect.</Notice>
      </div>
      {file && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Before" value={`${kb(file.size)} KB`} />
            <Stat label="After" value={after !== null ? `${kb(after)} KB` : "—"} />
            <Stat label="Saved" value={saved !== null ? `${saved}%` : "—"} accent />
          </div>
          <Btn onClick={compress} disabled={busy}>
            {busy ? "Compressing…" : "Compress"}
          </Btn>
        </div>
      )}
    </Card>
  );
}
