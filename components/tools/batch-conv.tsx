"use client";

import { useState } from "react";
import { Btn, Card, Check, CopyBtn, Field, Notice, NumInput, Select, Slider, Stat, Tabs, TextArea, TextInput, downloadBlob } from "../ui";

/* ============================== CSV → JSON ============================== */

type DelimKey = "comma" | "semicolon" | "tab";
const DELIMS: Record<DelimKey, { label: string; char: string }> = {
  comma: { label: "Comma (,)", char: "," },
  semicolon: { label: "Semicolon (;)", char: ";" },
  tab: { label: "Tab", char: "\t" },
};

/** Minimal RFC-4180 style CSV parser: handles quoted fields and escaped quotes. */
function parseCsv(input: string, delim: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      row.push(field); field = "";
    } else if (ch === "\r") {
      /* ignore carriage returns */
    } else if (ch === "\n") {
      row.push(field); field = ""; rows.push(row); row = [];
    } else field += ch;
  }
  if (inQuotes) throw new Error('Unclosed quotation mark — a field is missing its closing ".');
  if (field !== "" || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

export function CsvToJsonTool() {
  const [input, setInput] = useState('name,age,city\nAyesha,24,Karachi\nBilal,31,Lahore\n"Sana, Jr.",28,Islamabad');
  const [delim, setDelim] = useState<DelimKey>("comma");
  const [hasHeader, setHasHeader] = useState(true);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ rows: number; cols: number } | null>(null);

  const convert = () => {
    try {
      const rows = parseCsv(input, DELIMS[delim].char).filter((r) => r.some((c) => c.trim() !== ""));
      if (rows.length === 0) throw new Error("No data found — paste some CSV text first.");
      const head = hasHeader ? rows[0] : rows[0].map((_, i) => `col${i + 1}`);
      const dataRows = hasHeader ? rows.slice(1) : rows;
      if (dataRows.length === 0) throw new Error("Only a header row was found — add at least one data row.");
      const uneven = dataRows.some((r) => r.length !== head.length);
      const json = dataRows.map((r) => {
        const obj: Record<string, string> = {};
        head.forEach((h, i) => { obj[h.trim() || `col${i + 1}`] = r[i] ?? ""; });
        return obj;
      });
      setOutput(JSON.stringify(json, null, 2));
      setStats({ rows: json.length, cols: head.length });
      setError(uneven ? "Some rows had a different field count than the header — missing fields were filled with empty strings." : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not parse the CSV input.");
      setOutput("");
      setStats(null);
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Delimiter">
            <Select value={delim} onChange={(v) => setDelim(v as DelimKey)}
              options={Object.entries(DELIMS).map(([k, d]) => ({ value: k, label: d.label }))} />
          </Field>
          <div className="flex items-end pb-3">
            <Check label="First row contains headers" checked={hasHeader} onChange={setHasHeader} />
          </div>
        </div>
        <Field label="CSV input">
          <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={7} placeholder="name,age,city&#10;Ayesha,24,Karachi" />
        </Field>
        <Btn onClick={convert}>Convert to JSON</Btn>
        {error && <Notice tone="warn">{error}</Notice>}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Objects" value={String(stats.rows)} />
            <Stat label="Fields each" value={String(stats.cols)} />
          </div>
        )}
        {output && (
          <>
            <Field label="JSON output">
              <TextArea value={output} readOnly rows={9} />
            </Field>
            <div className="flex flex-wrap gap-2">
              <CopyBtn text={output} label="Copy JSON" />
              <Btn variant="secondary" onClick={() => downloadBlob(new Blob([output], { type: "application/json" }), "converted.json")}>
                Download .json
              </Btn>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

/* ============================== JSON → CSV ============================== */

function csvEscape(field: string, delim: string): string {
  return field.includes(delim) || /["\n\r]/.test(field) ? `"${field.replace(/"/g, '""')}"` : field;
}

export function JsonToCsvTool() {
  const [input, setInput] = useState('[\n  {"name": "Ayesha", "age": 24, "tags": ["admin", "pk"]},\n  {"name": "Bilal", "age": 31, "city": "Lahore"}\n]');
  const [delim, setDelim] = useState<DelimKey>("comma");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const convert = () => {
    try {
      const parsed: unknown = JSON.parse(input);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      if (arr.length === 0) throw new Error("The array is empty — nothing to convert.");
      if (arr.some((v) => v === null || typeof v !== "object" || Array.isArray(v))) {
        throw new Error("Every item must be an object, e.g. [{\"a\": 1}, {\"a\": 2}].");
      }
      const keys: string[] = [];
      const flat = (arr as Record<string, unknown>[]).map((obj) => {
        const row: Record<string, string> = {};
        for (const [k, v] of Object.entries(obj)) {
          if (!keys.includes(k)) keys.push(k);
          row[k] = v !== null && typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
        }
        return row;
      });
      const d = DELIMS[delim].char;
      const lines = [keys.map((k) => csvEscape(k, d)).join(d)];
      for (const row of flat) lines.push(keys.map((k) => csvEscape(row[k] ?? "", d)).join(d));
      setOutput(lines.join("\n"));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON input.");
      setOutput("");
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Delimiter">
          <Select value={delim} onChange={(v) => setDelim(v as DelimKey)}
            options={Object.entries(DELIMS).map(([k, d]) => ({ value: k, label: d.label }))} />
        </Field>
        <Field label="JSON input (array of objects)" hint="Nested objects become JSON strings inside their cell.">
          <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={7} placeholder='[{"a": 1}, {"a": 2}]' />
        </Field>
        <Btn onClick={convert}>Convert to CSV</Btn>
        {error && <Notice tone="warn">{error}</Notice>}
        {output && (
          <>
            <Field label="CSV output">
              <TextArea value={output} readOnly rows={7} />
            </Field>
            <div className="flex flex-wrap gap-2">
              <CopyBtn text={output} label="Copy CSV" />
              <Btn variant="secondary" onClick={() => downloadBlob(new Blob([output], { type: "text/csv" }), "converted.csv")}>
                Download .csv
              </Btn>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

/* ============================== XML Formatter ============================== */

function prettyXml(src: string, unit: string): string {
  const tokens = src.match(/<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<[^>]+>|[^<]+/g) ?? [];
  const stack: string[] = [];
  const out: string[] = [];
  let depth = 0;
  let rootClosed = false;
  for (const raw of tokens) {
    const t = raw.trim();
    if (!t) continue;
    if (t.startsWith("<!--") || t.startsWith("<?") || t.startsWith("<!")) {
      out.push(unit.repeat(depth) + t);
    } else if (t.startsWith("</")) {
      const name = t.slice(2, -1).trim().split(/\s+/)[0] ?? "";
      const open = stack.pop();
      if (!open) throw new Error(`Closing tag </${name}> has no matching opening tag.`);
      if (open !== name) throw new Error(`Mismatched tags: expected </${open}> but found </${name}>.`);
      depth = Math.max(0, depth - 1);
      out.push(unit.repeat(depth) + t);
      if (stack.length === 0) rootClosed = true;
    } else if (t.startsWith("<")) {
      if (!t.endsWith(">")) throw new Error("A tag is missing its closing > — check for a truncated tag.");
      const selfClosing = t.endsWith("/>");
      const name = t.slice(1).trim().split(/[\s/>]/)[0] ?? "";
      if (!name) throw new Error("An empty tag name was found (a lone < or <>).");
      if (stack.length === 0 && rootClosed) throw new Error("Multiple root elements detected — XML needs a single root element.");
      out.push(unit.repeat(depth) + t);
      if (!selfClosing) { stack.push(name); depth++; }
    } else {
      out.push(unit.repeat(depth) + t);
    }
  }
  if (stack.length > 0) throw new Error(`Unclosed tag(s): <${stack.join(">, <")}> — each needs a closing tag.`);
  if (out.length === 0) throw new Error("No XML content found — paste some XML first.");
  return out.join("\n");
}

export function XmlFormatterTool() {
  const [input, setInput] = useState('<catalog><book id="1"><title>Sample</title><price>299</price></book><book id="2"><title>Another</title><price>499</price></book></catalog>');
  const [indent, setIndent] = useState("2");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const format = () => {
    try {
      const unit = indent === "tab" ? "\t" : " ".repeat(Number(indent));
      setOutput(prettyXml(input, unit));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not format the XML.");
      setOutput("");
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Indent style">
          <Select value={indent} onChange={setIndent} options={[
            { value: "2", label: "2 spaces" },
            { value: "4", label: "4 spaces" },
            { value: "tab", label: "Tab" },
          ]} />
        </Field>
        <Field label="XML input">
          <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={7} placeholder="<root><item>…</item></root>" />
        </Field>
        <Btn onClick={format}>Format XML</Btn>
        {error && <Notice tone="warn">{error}</Notice>}
        {output && (
          <>
            <Field label="Formatted XML">
              <TextArea value={output} readOnly rows={10} />
            </Field>
            <CopyBtn text={output} label="Copy XML" />
          </>
        )}
      </div>
    </Card>
  );
}

/* ============================== Text ↔ Binary ============================== */

function textToBinary(s: string): string {
  const bytes = new TextEncoder().encode(s);
  return Array.from(bytes).map((b) => b.toString(2).padStart(8, "0")).join(" ");
}

function binaryToText(s: string): string {
  const clean = s.replace(/[^01]/g, "");
  if (!clean) throw new Error("No binary digits found — type some 0s and 1s first.");
  if (clean.length % 8 !== 0) {
    throw new Error(`Length ${clean.length} is not a multiple of 8 — each character needs exactly 8 bits.`);
  }
  const bytes = new Uint8Array(clean.length / 8);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.slice(i * 8, i * 8 + 8), 2);
  return new TextDecoder().decode(bytes);
}

export function BinaryTextTool() {
  const [mode, setMode] = useState("Text → Binary");
  const [input, setInput] = useState("Hello");
  const [error, setError] = useState<string | null>(null);

  const toBinary = mode === "Text → Binary";
  let output = "";
  if (toBinary) {
    output = textToBinary(input);
  } else {
    try {
      output = binaryToText(input);
      if (error) setError(null);
    } catch (e) {
      output = "";
      const msg = e instanceof Error ? e.message : "Invalid binary input.";
      if (msg !== error) setError(msg);
    }
  }

  return (
    <Card>
      <div className="space-y-4">
        <Tabs tabs={["Text → Binary", "Binary → Text"]} active={mode} onChange={(t) => { setMode(t); setError(null); }} />
        <Field label={toBinary ? "Text input" : "Binary input"} hint={toBinary ? "Each character becomes one 8-bit group (UTF-8)." : "Spaces and line breaks are ignored; groups of 8 bits."}>
          <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={5}
            placeholder={toBinary ? "Type text here…" : "01001000 01100101 01101100 01101100 01101111"} />
        </Field>
        {error && <Notice tone="warn">{error}</Notice>}
        {output && (
          <>
            <Field label="Output">
              <TextArea value={output} readOnly rows={5} />
            </Field>
            <CopyBtn text={output} label={toBinary ? "Copy binary" : "Copy text"} />
          </>
        )}
      </div>
    </Card>
  );
}

/* ============================== Cooking Converter ============================== */

const COOK_UNITS: Record<string, { label: string; toMl: number }> = {
  cup: { label: "Cups", toMl: 236.5882365 },
  tbsp: { label: "Tablespoons (tbsp)", toMl: 14.78676478125 },
  tsp: { label: "Teaspoons (tsp)", toMl: 4.92892159375 },
  floz: { label: "Fluid ounces (fl oz)", toMl: 29.5735295625 },
  ml: { label: "Milliliters (ml)", toMl: 1 },
  l: { label: "Liters", toMl: 1000 },
};

const INGREDIENTS: Record<string, { label: string; density: number }> = {
  water: { label: "Water / milk", density: 1 },
  flour: { label: "All-purpose flour", density: 0.51 },
  sugar: { label: "Granulated sugar", density: 0.85 },
  butter: { label: "Butter", density: 0.96 },
  oil: { label: "Vegetable oil", density: 0.92 },
};

function fmtCook(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n !== 0 && (Math.abs(n) >= 1e9 || Math.abs(n) < 1e-6)) return n.toExponential(3);
  return String(parseFloat(n.toPrecision(6)));
}

export function CookingConverterTool() {
  const [value, setValue] = useState("1");
  const [from, setFrom] = useState("cup");
  const [to, setTo] = useState("ml");
  const [ingredient, setIngredient] = useState("flour");

  const num = parseFloat(value);
  const fromU = COOK_UNITS[from];
  const toU = COOK_UNITS[to];
  const ml = !isNaN(num) && fromU && toU ? num * fromU.toMl : null;
  const converted = ml !== null && toU ? ml / toU.toMl : null;
  const grams = ml !== null ? ml * INGREDIENTS[ingredient].density : null;

  const unitOpts = Object.entries(COOK_UNITS).map(([k, u]) => ({ value: k, label: u.label }));
  const swap = () => { setFrom(to); setTo(from); };

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Ingredient (for weight estimate)">
          <Select value={ingredient} onChange={setIngredient}
            options={Object.entries(INGREDIENTS).map(([k, v]) => ({ value: k, label: v.label }))} />
        </Field>
        <Field label="Amount">
          <NumInput value={value} onChange={setValue} placeholder="1" min="0" />
        </Field>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <Field label="From">
            <Select value={from} onChange={setFrom} options={unitOpts} />
          </Field>
          <Btn variant="secondary" onClick={swap} className="!px-3" aria-label="Swap units">⇄</Btn>
          <Field label="To">
            <Select value={to} onChange={setTo} options={unitOpts} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Stat label="Converted" accent
            value={converted !== null ? `${fmtCook(converted)} ${toU.label.match(/\(([^)]+)\)/)?.[1] ?? toU.label}` : "—"} />
          <Stat label={`≈ Weight (${INGREDIENTS[ingredient].label})`}
            value={grams !== null ? `${fmtCook(grams)} g` : "—"} />
        </div>
        <Notice>Weight estimates use average densities — spooned flour packs differently than sifted, so treat grams as approximate.</Notice>
      </div>
    </Card>
  );
}

/* ============================== Data Size Converter ============================== */

const DATA_UNITS: Record<string, { label: string; toBits: number }> = {
  bit: { label: "Bits (b)", toBits: 1 },
  byte: { label: "Bytes (B)", toBits: 8 },
  kb: { label: "Kilobytes (KB)", toBits: 8 * 1024 },
  mb: { label: "Megabytes (MB)", toBits: 8 * 1024 ** 2 },
  gb: { label: "Gigabytes (GB)", toBits: 8 * 1024 ** 3 },
  tb: { label: "Terabytes (TB)", toBits: 8 * 1024 ** 4 },
  pb: { label: "Petabytes (PB)", toBits: 8 * 1024 ** 5 },
};

function fmtData(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n !== 0 && (Math.abs(n) >= 1e12 || Math.abs(n) < 1e-9)) return n.toExponential(3);
  return String(parseFloat(n.toPrecision(8)));
}

export function DataSizeTool() {
  const [value, setValue] = useState("1");
  const [from, setFrom] = useState("gb");
  const [to, setTo] = useState("mb");

  const num = parseFloat(value);
  const fromU = DATA_UNITS[from];
  const toU = DATA_UNITS[to];
  const bits = !isNaN(num) && fromU ? num * fromU.toBits : null;
  const converted = bits !== null && toU ? bits / toU.toBits : null;

  const unitOpts = Object.entries(DATA_UNITS).map(([k, u]) => ({ value: k, label: u.label }));
  const swap = () => { setFrom(to); setTo(from); };

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Value">
          <NumInput value={value} onChange={setValue} placeholder="1" min="0" />
        </Field>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <Field label="From">
            <Select value={from} onChange={setFrom} options={unitOpts} />
          </Field>
          <Btn variant="secondary" onClick={swap} className="!px-3" aria-label="Swap units">⇄</Btn>
          <Field label="To">
            <Select value={to} onChange={setTo} options={unitOpts} />
          </Field>
        </div>
        <Stat label="Result" accent
          value={converted !== null && toU ? `${fmtData(converted)} ${toU.label.match(/\(([^)]+)\)/)?.[1] ?? to}` : "—"} />
        {bits !== null && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(DATA_UNITS).map(([k, u]) => (
              <div key={k} className="rounded-lg border border-gold/20 bg-ink-2/70 px-3 py-2">
                <div className="text-[11px] font-medium uppercase tracking-wider text-sage">{u.label.match(/\(([^)]+)\)/)?.[1] ?? k}</div>
                <div className="font-mono text-sm text-cream">{fmtData(bits / u.toBits)}</div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-sage/70">Uses 1 KB = 1024 bytes (binary units), the standard for file sizes and memory.</p>
      </div>
    </Card>
  );
}

/* ============================== Shoe Size Converter ============================== */

function roundHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

type ShoeRow = { us: number; uk: number; eu: number; cm: string };

/** Build a chart row: `base` converts US → foot inches (men/youth 22, women 20.5). */
function chartRow(us: number, base: number, ukOffset: number): ShoeRow {
  const cm = ((us + base) / 3) * 2.54;
  return { us, uk: roundHalf(us + ukOffset), eu: Math.round((cm + 1) * 1.5), cm: cm.toFixed(1) };
}

const MEN_CHART: ShoeRow[] = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12, 13].map((u) => chartRow(u, 22, -0.5));
const WOMEN_CHART: ShoeRow[] = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 11].map((u) => chartRow(u, 20.5, -2));
const KIDS_CHART: ShoeRow[] = [10, 11, 12, 13, 1, 2, 3, 4, 5, 6].map((u) => chartRow(u, 22, -0.5));

function ShoeTable({ rows }: { rows: ShoeRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gold/20">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gold/10 text-left text-xs uppercase tracking-widest text-gold-light">
            <th className="px-3 py-2">Foot (cm)</th>
            <th className="px-3 py-2">US</th>
            <th className="px-3 py-2">UK</th>
            <th className="px-3 py-2">EU</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.us} className={i % 2 ? "bg-ink-2/50" : ""}>
              <td className="px-3 py-1.5 font-mono text-cream">{r.cm}</td>
              <td className="px-3 py-1.5 text-cream">{r.us}</td>
              <td className="px-3 py-1.5 text-cream">{r.uk}</td>
              <td className="px-3 py-1.5 text-cream">{r.eu}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ShoeSizeTool() {
  const [tab, setTab] = useState("Find my size");
  const [cm, setCm] = useState("26");

  const num = parseFloat(cm);
  const men = !isNaN(num) ? chartRow(roundHalf((3 * (num / 2.54)) - 22), 22, -0.5) : null;
  const women = !isNaN(num) ? chartRow(roundHalf((3 * (num / 2.54)) - 20.5), 20.5, -2) : null;
  const kids = !isNaN(num) ? chartRow(roundHalf((3 * (num / 2.54)) - 22), 22, -0.5) : null;

  return (
    <Card>
      <div className="space-y-4">
        <Tabs tabs={["Find my size", "Men's chart", "Women's chart", "Kids' chart"]} active={tab} onChange={setTab} />
        {tab === "Find my size" ? (
          <>
            <Field label="Foot length (cm)" hint="Measure your foot heel-to-toe in the evening, standing.">
              <NumInput value={cm} onChange={setCm} placeholder="26" min="10" max="35" step="0.1" />
            </Field>
            {!men || !women || !kids ? (
              <Notice tone="warn">Enter your foot length in centimeters.</Notice>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {[{ label: "Men's", r: men }, { label: "Women's", r: women }, { label: "Kids'", r: kids }].map(({ label, r }) => (
                  <div key={label} className="rounded-xl border border-gold/25 bg-ink-2/70 p-4">
                    <div className="text-xs font-medium uppercase tracking-widest text-sage">{label}</div>
                    <div className="mt-2 space-y-1 text-sm text-cream">
                      <div className="flex justify-between"><span>US</span><span className="font-bold text-gold-light">{r.us}</span></div>
                      <div className="flex justify-between"><span>UK</span><span className="font-bold text-gold-light">{r.uk}</span></div>
                      <div className="flex justify-between"><span>EU</span><span className="font-bold text-gold-light">{r.eu}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : tab === "Men's chart" ? (
          <ShoeTable rows={MEN_CHART} />
        ) : tab === "Women's chart" ? (
          <ShoeTable rows={WOMEN_CHART} />
        ) : (
          <ShoeTable rows={KIDS_CHART} />
        )}
        <Notice>Sizes are approximate conversions — brands and styles vary, so try shoes on or check the brand's own chart.</Notice>
      </div>
    </Card>
  );
}

/* ============================== HEX ↔ RGB ============================== */

function expandHex(hex: string): string | null {
  const h = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]+$/.test(h)) return null;
  if (h.length === 3) return h.split("").map((c) => c + c).join("");
  if (h.length === 6 || h.length === 8) return h;
  return null;
}

function hexToRgbParts(hex6or8: string): { r: number; g: number; b: number; a: number } {
  const r = parseInt(hex6or8.slice(0, 2), 16);
  const g = parseInt(hex6or8.slice(2, 4), 16);
  const b = parseInt(hex6or8.slice(4, 6), 16);
  const a = hex6or8.length === 8 ? parseInt(hex6or8.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

function rgbToHex(r: number, g: number, b: number, a: number): string {
  const p = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0").toUpperCase();
  return a >= 1 ? `#${p(r)}${p(g)}${p(b)}` : `#${p(r)}${p(g)}${p(b)}${p(a * 255)}`;
}

export function HexRgbTool() {
  const [mode, setMode] = useState("HEX → RGB");
  const [hex, setHex] = useState("#C9A227");
  const [r, setR] = useState("201");
  const [g, setG] = useState("162");
  const [b, setB] = useState("39");
  const [alpha, setAlpha] = useState(1);

  const toRgb = mode === "HEX → RGB";
  const expanded = expandHex(hex);
  const parts = expanded ? hexToRgbParts(expanded) : null;
  const css = parts ? (parts.a >= 1 ? `rgb(${parts.r}, ${parts.g}, ${parts.b})` : `rgba(${parts.r}, ${parts.g}, ${parts.b}, ${parseFloat(parts.a.toFixed(2))})`) : null;
  const preview = parts ? `#${expanded}` : "transparent";

  const rn = parseFloat(r), gn = parseFloat(g), bn = parseFloat(b);
  const rgbValid = [rn, gn, bn].every((n) => !isNaN(n) && n >= 0 && n <= 255);
  const hexOut = rgbValid ? rgbToHex(rn, gn, bn, alpha) : null;

  return (
    <Card>
      <div className="space-y-4">
        <Tabs tabs={["HEX → RGB", "RGB → HEX"]} active={mode} onChange={setMode} />
        {toRgb ? (
          <>
            <Field label="HEX color">
              <TextInput value={hex} onChange={(e) => setHex(e.target.value)} placeholder="#C9A227" className="font-mono" />
            </Field>
            {parts && css ? (
              <div className="flex flex-wrap items-center gap-4">
                <div className="h-20 w-20 rounded-xl border border-gold/40 shadow-lg shadow-black/40" style={{ backgroundColor: preview }} />
                <div className="space-y-2">
                  <div className="font-mono text-lg text-cream">{css}</div>
                  <div className="flex gap-2">
                    <CopyBtn text={css} label="Copy CSS" />
                    <CopyBtn text={`#${expanded}`} label="Copy HEX" />
                  </div>
                </div>
              </div>
            ) : (
              <Notice tone="warn">Enter a valid HEX color: 3, 6 or 8 hex digits, e.g. #C9A, #C9A227 or #C9A227FF.</Notice>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Red (0–255)"><NumInput value={r} onChange={setR} min="0" max="255" /></Field>
              <Field label="Green (0–255)"><NumInput value={g} onChange={setG} min="0" max="255" /></Field>
              <Field label="Blue (0–255)"><NumInput value={b} onChange={setB} min="0" max="255" /></Field>
            </div>
            <Field label="Opacity">
              <Slider value={alpha} min={0} max={1} step={0.01} onChange={setAlpha} format={(v) => `${Math.round(v * 100)}%`} />
            </Field>
            {rgbValid && hexOut ? (
              <div className="flex flex-wrap items-center gap-4">
                <div className="h-20 w-20 rounded-xl border border-gold/40 shadow-lg shadow-black/40" style={{ backgroundColor: hexOut }} />
                <div className="space-y-2">
                  <div className="font-mono text-lg text-cream">{hexOut}</div>
                  <CopyBtn text={hexOut} label="Copy HEX" />
                </div>
              </div>
            ) : (
              <Notice tone="warn">Each channel must be a number between 0 and 255.</Notice>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
