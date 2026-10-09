"use client";

import { useState } from "react";
import { Btn, Card, Check, CopyBtn, Field, Slider, Stat, Tabs, TextArea, TextInput } from "../ui";

/* ---------------- Word counter ---------------- */
const fmtReading = (words: number): string => {
  const secs = Math.round((words / 200) * 60);
  if (secs < 60) return `${secs} sec`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s === 0 ? `${m} min` : `${m} min ${s} sec`;
};

export function WordCounterTool() {
  const [text, setText] = useState("");

  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, "").length;
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0).length;
  const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 0).length;

  return (
    <Card>
      <Field label="Your text">
        <TextArea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste text here…" />
      </Field>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Words" value={words.toLocaleString("en-PK")} accent />
        <Stat label="Characters" value={chars.toLocaleString("en-PK")} />
        <Stat label="Characters (no spaces)" value={charsNoSpaces.toLocaleString("en-PK")} />
        <Stat label="Sentences" value={String(sentences)} />
        <Stat label="Paragraphs" value={String(paragraphs)} />
        <Stat label="Reading time" value={fmtReading(words)} />
      </div>
    </Card>
  );
}

/* ---------------- Case converter ---------------- */
const toTitle = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const toSentence = (s: string) => s.toLowerCase().replace(/(^\s*[a-z])|([.!?]\s*[a-z])/g, (m) => m.toUpperCase());
const toAlternating = (s: string) => {
  let i = 0;
  return s
    .split("")
    .map((c) => {
      if (!/[a-zA-Z]/.test(c)) return c;
      const out = i % 2 === 0 ? c.toLowerCase() : c.toUpperCase();
      i += 1;
      return out;
    })
    .join("");
};

export function CaseConverterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const apply = (fn: (s: string) => string) => setOutput(fn(input));
  const btnCls = "px-3 py-1.5 text-sm";

  return (
    <Card>
      <Field label="Input text">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type or paste text here…" />
      </Field>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Btn variant="secondary" className={btnCls} onClick={() => apply((s) => s.toUpperCase())}>
          UPPER
        </Btn>
        <Btn variant="secondary" className={btnCls} onClick={() => apply((s) => s.toLowerCase())}>
          lower
        </Btn>
        <Btn variant="secondary" className={btnCls} onClick={() => apply(toTitle)}>
          Title
        </Btn>
        <Btn variant="secondary" className={btnCls} onClick={() => apply(toSentence)}>
          Sentence
        </Btn>
        <Btn variant="secondary" className={btnCls} onClick={() => apply(toAlternating)}>
          aLtErNaTiNg
        </Btn>
        <CopyBtn text={output} />
      </div>
      <div className="mt-3">
        <Field label="Output">
          <TextArea value={output} readOnly placeholder="Converted text appears here…" />
        </Field>
      </div>
    </Card>
  );
}

/* ---------------- Lorem ipsum ---------------- */
const LOREM: string[] = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
  "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.",
  "Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.",
  "Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.",
];

const buildLorem = (kind: string, count: number): string => {
  if (kind === "Paragraphs") {
    const out: string[] = [];
    for (let i = 0; i < count; i++) out.push(LOREM[i % LOREM.length]);
    return out.join("\n\n");
  }
  const sentences = LOREM.flatMap((p) => p.match(/[^.!?]+[.!?]+/g) ?? [p]);
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(sentences[i % sentences.length].trim());
  return out.join(" ");
};

const LOREM_TABS = ["Paragraphs", "Sentences"];

export function LoremIpsumTool() {
  const [kind, setKind] = useState<string>(LOREM_TABS[0]);
  const [count, setCount] = useState(3);
  const [output, setOutput] = useState(() => buildLorem(LOREM_TABS[0], 3));

  const changeKind = (k: string) => {
    setKind(k);
    const max = k === "Paragraphs" ? 20 : 50;
    const c = Math.min(Math.max(count, 1), max);
    setCount(c);
    setOutput(buildLorem(k, c));
  };

  const max = kind === "Paragraphs" ? 20 : 50;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={LOREM_TABS} active={kind} onChange={changeKind} />
        <Btn onClick={() => setOutput(buildLorem(kind, count))}>Generate</Btn>
      </div>
      <div className="mt-4">
        <Field label={`Count: ${count} ${kind.toLowerCase()}`}>
          <Slider value={count} min={1} max={max} step={1} onChange={setCount} format={(v) => String(v)} />
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Output">
          <TextArea value={output} readOnly className="min-h-[220px]" />
        </Field>
        <div className="mt-2">
          <CopyBtn text={output} />
        </div>
      </div>
    </Card>
  );
}

/* ---------------- Slug generator ---------------- */
export function SlugGenTool() {
  const [input, setInput] = useState("");

  const slug = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return (
    <Card>
      <Field label="Title / phrase">
        <TextInput value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. Best Mobile Prices in Pakistan 2026" />
      </Field>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 break-all rounded-xl border border-gold/25 bg-ink-2/70 px-4 py-3 font-mono text-sm text-cream">
          {slug || "your-slug-appears-here"}
        </code>
        <CopyBtn text={slug} />
      </div>
    </Card>
  );
}

/* ---------------- Dedup lines ---------------- */
export function DedupLinesTool() {
  const [input, setInput] = useState("");
  const [trimWs, setTrimWs] = useState(true);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [sortAZ, setSortAZ] = useState(false);
  const [result, setResult] = useState<{ lines: number; unique: number; text: string } | null>(null);

  const dedup = () => {
    const lines = input.split("\n");
    const seen = new Set<string>();
    const kept: string[] = [];
    for (const raw of lines) {
      const line = trimWs ? raw.trim() : raw;
      const key = ignoreCase ? line.toLowerCase() : line;
      if (!seen.has(key)) {
        seen.add(key);
        kept.push(line);
      }
    }
    if (sortAZ) kept.sort((a, b) => a.localeCompare(b));
    setResult({ lines: lines.length, unique: kept.length, text: kept.join("\n") });
  };

  return (
    <Card>
      <Field label="Input lines">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} placeholder={"apple\nbanana\napple\ncherry"} />
      </Field>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Check label="Trim whitespace" checked={trimWs} onChange={setTrimWs} />
        <Check label="Ignore case" checked={ignoreCase} onChange={setIgnoreCase} />
        <Check label="Sort A–Z" checked={sortAZ} onChange={setSortAZ} />
        <Btn onClick={dedup}>Remove Duplicates</Btn>
      </div>
      {result && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-semibold text-sage">
            {result.lines} lines → {result.unique} unique
          </p>
          <Field label="Unique lines">
            <TextArea value={result.text} readOnly />
          </Field>
          <div>
            <CopyBtn text={result.text} />
          </div>
        </div>
      )}
    </Card>
  );
}
