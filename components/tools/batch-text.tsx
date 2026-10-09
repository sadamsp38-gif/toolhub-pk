"use client";

import { useMemo, useState } from "react";
import { Btn, Card, Check, CopyBtn, Field, Notice, NumInput, Select, Tabs, TextArea, TextInput } from "../ui";

/* ============================== Text reverser ============================== */
const REV_MODES = ["Whole text", "Word order", "Each word"];

const reverseText = (t: string, mode: string): string => {
  if (mode === "Word order") {
    const parts = t.split(/(\s+)/);
    const words = parts.filter((p) => !/^\s*$/.test(p)).reverse();
    let wi = 0;
    return parts.map((p) => (/^\s*$/.test(p) ? p : words[wi++])).join("");
  }
  if (mode === "Each word") return t.replace(/\S+/g, (w) => [...w].reverse().join(""));
  return [...t].reverse().join("");
};

export function TextReverserTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState(REV_MODES[0]);
  const output = useMemo(() => reverseText(input, mode), [input, mode]);

  return (
    <Card>
      <div className="mb-4">
        <Tabs tabs={REV_MODES} active={mode} onChange={setMode} />
      </div>
      <Field label="Input text">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type or paste text here…" />
      </Field>
      <div className="mt-4">
        <Field label="Reversed output">
          <TextArea
            value={output}
            readOnly
            placeholder="Reversed text appears here…"
            className="min-h-[160px]"
          />
        </Field>
        <div className="mt-2">
          <CopyBtn text={output} />
        </div>
      </div>
    </Card>
  );
}

/* ============================== Remove extra spaces ============================== */
export function RemoveExtraSpacesTool() {
  const [input, setInput] = useState("");
  const [collapse, setCollapse] = useState(true);
  const [trimLines, setTrimLines] = useState(true);
  const [dropEmpty, setDropEmpty] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [warn, setWarn] = useState(false);

  const clean = () => {
    if (input.trim() === "") {
      setWarn(true);
      setOutput(null);
      return;
    }
    setWarn(false);
    let out = input;
    if (collapse) out = out.replace(/[ \t]+/g, " ");
    if (trimLines) out = out.split("\n").map((l) => l.trim()).join("\n");
    if (dropEmpty) out = out.split("\n").filter((l) => l.trim() !== "").join("\n");
    setOutput(out);
  };

  return (
    <Card>
      <Field label="Messy text">
        <TextArea
          value={input}
          onChange={(e) => { setInput(e.target.value); setWarn(false); }}
          placeholder="Paste text with extra spaces…"
          className="min-h-[160px]"
        />
      </Field>
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <Check label="Collapse multiple spaces" checked={collapse} onChange={setCollapse} />
        <Check label="Trim each line" checked={trimLines} onChange={setTrimLines} />
        <Check label="Remove empty lines" checked={dropEmpty} onChange={setDropEmpty} />
        <Btn onClick={clean}>Clean Up</Btn>
      </div>
      {warn && (
        <div className="mt-3">
          <Notice tone="warn">Paste some text first — there is nothing to clean yet.</Notice>
        </div>
      )}
      {output !== null && (
        <div className="mt-4">
          <Field label="Cleaned text">
            <TextArea value={output} readOnly className="min-h-[160px]" />
          </Field>
          <div className="mt-2">
            <CopyBtn text={output} />
          </div>
        </div>
      )}
    </Card>
  );
}

/* ============================== Sort lines ============================== */
const SORT_MODES = ["A → Z", "Z → A", "Numeric", "By length"];

const sortLines = (lines: string[], mode: string, dropBlank: boolean): string[] => {
  const arr = dropBlank ? lines.filter((l) => l.trim() !== "") : [...lines];
  if (mode === "Z → A") return arr.sort((a, b) => b.localeCompare(a));
  if (mode === "Numeric")
    return arr.sort((a, b) => {
      const x = parseFloat(a);
      const y = parseFloat(b);
      const xn = Number.isNaN(x);
      const yn = Number.isNaN(y);
      if (xn && yn) return a.localeCompare(b);
      if (xn) return 1;
      if (yn) return -1;
      return x - y;
    });
  if (mode === "By length") return arr.sort((a, b) => a.length - b.length || a.localeCompare(b));
  return arr.sort((a, b) => a.localeCompare(b));
};

const shuffleArr = (arr: string[]): string[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function SortLinesTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState(SORT_MODES[0]);
  const [dropBlank, setDropBlank] = useState(true);
  const [shuffled, setShuffled] = useState<string[] | null>(null);

  const sorted = useMemo(
    () => (input.trim() === "" ? [] : sortLines(input.split("\n"), mode, dropBlank)),
    [input, mode, dropBlank]
  );
  const output = shuffled ?? sorted;

  const shuffle = () => {
    if (input.trim() === "") return;
    const lines = dropBlank ? input.split("\n").filter((l) => l.trim() !== "") : input.split("\n");
    setShuffled(shuffleArr(lines));
  };

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={SORT_MODES}
          active={mode}
          onChange={(m) => { setMode(m); setShuffled(null); }}
        />
        <Btn variant="secondary" onClick={shuffle} disabled={input.trim() === ""}>
          Shuffle
        </Btn>
      </div>
      <Field label="Input lines">
        <TextArea
          value={input}
          onChange={(e) => { setInput(e.target.value); setShuffled(null); }}
          placeholder={"banana\napple\ncherry"}
          className="min-h-[150px]"
        />
      </Field>
      <div className="mt-3">
        <Check label="Remove blank lines" checked={dropBlank} onChange={(v) => { setDropBlank(v); setShuffled(null); }} />
      </div>
      <div className="mt-4">
        <Field label={shuffled ? "Shuffled output" : "Sorted output"}>
          <TextArea
            value={output.join("\n")}
            readOnly
            placeholder="Sorted lines appear here…"
            className="min-h-[150px]"
          />
        </Field>
        <div className="mt-2">
          <CopyBtn text={output.join("\n")} />
        </div>
      </div>
    </Card>
  );
}

/* ============================== Number lines ============================== */
const NUM_FORMATS = [
  { value: "dot", label: "1. text" },
  { value: "paren", label: "1) text" },
  { value: "bracket", label: "[1] text" },
  { value: "hash", label: "#1 text" },
];

export function NumberLinesTool() {
  const [input, setInput] = useState("");
  const [fmt, setFmt] = useState(NUM_FORMATS[0].value);
  const [startStr, setStartStr] = useState("1");

  const output = useMemo(() => {
    if (input.trim() === "") return "";
    const start = Math.max(1, parseInt(startStr, 10) || 1);
    return input
      .split("\n")
      .map((l, i) => {
        const n = start + i;
        if (fmt === "paren") return `${n}) ${l}`;
        if (fmt === "bracket") return `[${n}] ${l}`;
        if (fmt === "hash") return `#${n} ${l}`;
        return `${n}. ${l}`;
      })
      .join("\n");
  }, [input, fmt, startStr]);

  return (
    <Card>
      <Field label="Input lines">
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"First item\nSecond item\nThird item"}
          className="min-h-[150px]"
        />
      </Field>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Number format">
          <Select value={fmt} onChange={setFmt} options={NUM_FORMATS} />
        </Field>
        <Field label="Start from">
          <NumInput value={startStr} onChange={setStartStr} min={1} placeholder="1" />
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Numbered output">
          <TextArea
            value={output}
            readOnly
            placeholder="Numbered lines appear here…"
            className="min-h-[150px]"
          />
        </Field>
        <div className="mt-2">
          <CopyBtn text={output} />
        </div>
      </div>
    </Card>
  );
}

/* ============================== Extract emails ============================== */
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;

export function ExtractEmailsTool() {
  const [input, setInput] = useState("");
  const [dedupe, setDedupe] = useState(true);
  const [result, setResult] = useState<{ found: number; shown: number; text: string } | null>(null);

  const extract = () => {
    const matches = input.match(EMAIL_RE) ?? [];
    const list = dedupe ? [...new Set(matches.map((m) => m.toLowerCase()))] : matches;
    setResult({ found: matches.length, shown: list.length, text: list.join("\n") });
  };

  return (
    <Card>
      <Field label="Text to scan">
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste text containing email addresses…"
          className="min-h-[150px]"
        />
      </Field>
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <Check label="Remove duplicates" checked={dedupe} onChange={setDedupe} />
        <Btn onClick={extract} disabled={input.trim() === ""}>Extract Emails</Btn>
      </div>
      {result && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-semibold text-sage">
            Found {result.found} address{result.found === 1 ? "" : "es"}
            {dedupe && result.found !== result.shown ? ` (${result.shown} unique)` : ""}
          </p>
          {result.shown === 0 ? (
            <Notice>No email addresses were found in the text.</Notice>
          ) : (
            <>
              <Field label="Extracted emails">
                <TextArea value={result.text} readOnly className="min-h-[150px]" />
              </Field>
              <div>
                <CopyBtn text={result.text} />
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

/* ============================== Extract URLs ============================== */
const URL_RE = /(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;

const tidyUrl = (u: string): string => u.replace(/[.,;:!?)\]}>]+$/, "");

export function ExtractUrlsTool() {
  const [input, setInput] = useState("");
  const [dedupe, setDedupe] = useState(true);
  const [result, setResult] = useState<{ found: number; shown: number; text: string } | null>(null);

  const extract = () => {
    const matches = (input.match(URL_RE) ?? []).map(tidyUrl).filter((u) => u.length > 0);
    const list = dedupe ? [...new Set(matches)] : matches;
    setResult({ found: matches.length, shown: list.length, text: list.join("\n") });
  };

  return (
    <Card>
      <Field label="Text to scan">
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste text containing links…"
          className="min-h-[150px]"
        />
      </Field>
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <Check label="Remove duplicates" checked={dedupe} onChange={setDedupe} />
        <Btn onClick={extract} disabled={input.trim() === ""}>Extract URLs</Btn>
      </div>
      {result && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-semibold text-sage">
            Found {result.found} link{result.found === 1 ? "" : "s"}
            {dedupe && result.found !== result.shown ? ` (${result.shown} unique)` : ""}
          </p>
          {result.shown === 0 ? (
            <Notice>No URLs were found in the text.</Notice>
          ) : (
            <>
              <Field label="Extracted URLs">
                <TextArea value={result.text} readOnly className="min-h-[150px]" />
              </Field>
              <div>
                <CopyBtn text={result.text} />
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

/* ============================== Strip HTML ============================== */
export function StripHtmlTool() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{ text: string; tags: number } | null>(null);

  const strip = () => {
    if (input.trim() === "") return;
    const doc = new DOMParser().parseFromString(input, "text/html");
    const tags = doc.body.querySelectorAll("*").length;
    const text = (doc.body.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
    setResult({ text, tags });
  };

  return (
    <Card>
      <Field label="HTML input">
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="<p>Paste your <b>HTML</b> here…</p>"
          className="min-h-[150px]"
        />
      </Field>
      <div className="mt-3">
        <Btn onClick={strip} disabled={input.trim() === ""}>Strip HTML Tags</Btn>
      </div>
      {result && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-semibold text-sage">
            Removed {result.tags} HTML tag{result.tags === 1 ? "" : "s"}
          </p>
          <Field label="Plain text">
            <TextArea value={result.text} readOnly className="min-h-[150px]" />
          </Field>
          <div>
            <CopyBtn text={result.text} />
          </div>
        </div>
      )}
    </Card>
  );
}

/* ============================== Text diff ============================== */
type DLKind = "same" | "add" | "del" | "chg";
interface DL {
  kind: DLKind;
  a: string;
  b?: string;
}

const diffLines = (a: string[], b: string[]): DL[] | null => {
  const n = a.length;
  const m = b.length;
  if (n * m > 4000000) return null;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops: DL[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ kind: "same", a: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ kind: "del", a: a[i] });
      i++;
    } else {
      ops.push({ kind: "add", a: b[j] });
      j++;
    }
  }
  while (i < n) {
    ops.push({ kind: "del", a: a[i] });
    i++;
  }
  while (j < m) {
    ops.push({ kind: "add", a: b[j] });
    j++;
  }
  const merged: DL[] = [];
  for (let k = 0; k < ops.length; k++) {
    if (ops[k].kind === "del" && k + 1 < ops.length && ops[k + 1].kind === "add") {
      merged.push({ kind: "chg", a: ops[k].a, b: ops[k + 1].a });
      k++;
    } else {
      merged.push(ops[k]);
    }
  }
  return merged;
};

const DIFF_ROW: Record<DLKind, string> = {
  same: "border-transparent text-sage/70",
  add: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  del: "border-red-500/40 bg-red-500/10 text-red-200",
  chg: "border-amber-500/40 bg-amber-500/10 text-amber-100",
};

const DIFF_GLYPH: Record<DLKind, string> = { same: " ", add: "+", del: "−", chg: "±" };

export function TextDiffTool() {
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [diff, setDiff] = useState<DL[] | "too-big" | null>(null);

  const compare = () => {
    if (textA === "" && textB === "") return;
    const d = diffLines(textA.split("\n"), textB.split("\n"));
    setDiff(d ?? "too-big");
  };

  const adds = diff && diff !== "too-big" ? diff.filter((d) => d.kind === "add").length : 0;
  const dels = diff && diff !== "too-big" ? diff.filter((d) => d.kind === "del").length : 0;
  const chgs = diff && diff !== "too-big" ? diff.filter((d) => d.kind === "chg").length : 0;

  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Original text (A)">
          <TextArea
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            placeholder="Paste the original version…"
            className="min-h-[170px]"
          />
        </Field>
        <Field label="New text (B)">
          <TextArea
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            placeholder="Paste the changed version…"
            className="min-h-[170px]"
          />
        </Field>
      </div>
      <div className="mt-3">
        <Btn onClick={compare} disabled={textA === "" && textB === ""}>Compare Texts</Btn>
      </div>
      {diff === "too-big" && (
        <div className="mt-4">
          <Notice tone="warn">These texts are too large to diff line by line. Try shorter inputs.</Notice>
        </div>
      )}
      {diff && diff !== "too-big" && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-semibold text-sage">
            <span className="text-emerald-300">{adds} added</span>
            {" · "}
            <span className="text-red-300">{dels} removed</span>
            {" · "}
            <span className="text-amber-300">{chgs} changed</span>
          </p>
          <div className="max-h-[380px] overflow-auto rounded-xl border border-gold/25 bg-ink-2/70 p-2 font-mono text-sm">
            {diff.map((d, idx) => (
              <div key={idx} className={`mb-1 rounded-lg border px-3 py-1.5 ${DIFF_ROW[d.kind]}`}>
                <span className="mr-2 inline-block w-4 font-bold">{DIFF_GLYPH[d.kind]}</span>
                {d.kind === "chg" ? (
                  <>
                    <span className="line-through opacity-70">{d.a || " "}</span>
                    <span className="mx-2 text-sage">→</span>
                    <span>{d.b || " "}</span>
                  </>
                ) : (
                  <span className="whitespace-pre-wrap">{d.a || " "}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ============================== Character frequency ============================== */
const FREQ_MODES = ["Characters", "Words"];

const DISPLAY_CHAR: Record<string, string> = { " ": "␣ space", "\t": "⇥ tab", "\n": "↵ newline" };

export function CharFrequencyTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState(FREQ_MODES[0]);
  const [includeWs, setIncludeWs] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(true);

  const rows = useMemo(() => {
    let items: string[];
    if (mode === "Characters") {
      let s = input;
      if (!includeWs) s = s.replace(/\s/g, "");
      if (ignoreCase) s = s.toLowerCase();
      items = [...s];
    } else {
      const words = input.trim().split(/\s+/).filter((w) => w.length > 0);
      items = ignoreCase ? words.map((w) => w.toLowerCase()) : words;
    }
    const counts = new Map<string, number>();
    for (const it of items) counts.set(it, (counts.get(it) ?? 0) + 1);
    return [...counts.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, 100);
  }, [input, mode, includeWs, ignoreCase]);

  const total = rows.reduce((n, [, c]) => n + c, 0);
  const max = rows.length > 0 ? rows[0][1] : 0;

  return (
    <Card>
      <div className="mb-4">
        <Tabs tabs={FREQ_MODES} active={mode} onChange={setMode} />
      </div>
      <Field label="Text to analyse">
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste text to see what appears most often…"
          className="min-h-[140px]"
        />
      </Field>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
        {mode === "Characters" && (
          <Check label="Include whitespace" checked={includeWs} onChange={setIncludeWs} />
        )}
        <Check label="Ignore case" checked={ignoreCase} onChange={setIgnoreCase} />
      </div>
      {input.trim() === "" ? (
        <div className="mt-4">
          <Notice>Paste some text above to see the frequency breakdown.</Notice>
        </div>
      ) : (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-sage">
            {rows.length} unique {mode === "Characters" ? "characters" : "words"} · {total} total
          </p>
          <div className="max-h-[360px] space-y-1.5 overflow-auto rounded-xl border border-gold/25 bg-ink-2/70 p-3">
            {rows.map(([item, count]) => (
              <div key={item} className="flex items-center gap-3 text-sm">
                <code className="w-28 shrink-0 truncate font-mono text-gold-light">
                  {DISPLAY_CHAR[item] ?? item}
                </code>
                <div className="h-4 min-w-0 flex-1 overflow-hidden rounded-full bg-ink">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light"
                    style={{ width: `${max > 0 ? (count / max) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right font-mono text-cream">{count}</span>
                <span className="w-14 shrink-0 text-right font-mono text-sage/70">
                  {total > 0 ? ((count / total) * 100).toFixed(1) : "0.0"}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ============================== Pig Latin ============================== */
const PIG_MODES = ["English → Pig Latin", "Pig Latin → English"];

const encodeWord = (w: string): string => {
  const m = w.match(/^([^A-Za-z]*)([A-Za-z]+)([^A-Za-z]*)$/);
  if (!m) return w;
  const pre = m[1];
  const core = m[2];
  const post = m[3];
  const first = core.charAt(0);
  const cap = first >= "A" && first <= "Z";
  const low = core.toLowerCase();
  let ci = low.search(/[aeiou]/);
  if (ci === -1) {
    const yi = low.indexOf("y");
    ci = yi > 0 ? yi : -1;
  }
  let body: string;
  if (ci <= 0) {
    body = low + (ci === 0 ? "way" : "ay");
  } else {
    let k = ci;
    if (low.charAt(ci - 1) === "q" && low.charAt(ci) === "u") k = ci + 1;
    body = low.slice(k) + low.slice(0, k) + "ay";
  }
  if (cap) body = body.charAt(0).toUpperCase() + body.slice(1);
  return pre + body + post;
};

const decodeWord = (w: string): string => {
  const m = w.match(/^([^A-Za-z]*)([A-Za-z]+)([^A-Za-z]*)$/);
  if (!m) return w;
  const pre = m[1];
  const core = m[2];
  const post = m[3];
  const first = core.charAt(0);
  const cap = first >= "A" && first <= "Z";
  const low = core.toLowerCase();
  let body: string | null = null;
  if (/way$/.test(low) && low.length > 3) {
    const stem = low.slice(0, -3);
    if (/^[aeiou]/.test(stem)) body = stem;
  }
  if (body === null && /ay$/.test(low) && low.length > 2) {
    const stem = low.slice(0, -2);
    const cm = stem.match(/(qu|[bcdfghjklmnpqrstvwxz]+)$/);
    const cl = cm ? cm[0] : "";
    body = cl + stem.slice(0, stem.length - cl.length);
  }
  if (body === null) return w;
  if (cap) body = body.charAt(0).toUpperCase() + body.slice(1);
  return pre + body + post;
};

export function PigLatinTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState(PIG_MODES[0]);

  const output = useMemo(() => {
    const fn = mode === PIG_MODES[0] ? encodeWord : decodeWord;
    return input.replace(/\S+/g, fn);
  }, [input, mode]);

  return (
    <Card>
      <div className="mb-4">
        <Tabs tabs={PIG_MODES} active={mode} onChange={setMode} />
      </div>
      <Field label={mode === PIG_MODES[0] ? "English text" : "Pig Latin text"}>
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === PIG_MODES[0] ? "Hello, how are you?" : "Ellohay, owhay areway ouyay?"}
          className="min-h-[140px]"
        />
      </Field>
      <div className="mt-4">
        <Field label="Translation">
          <TextArea value={output} readOnly placeholder="Translation appears here…" className="min-h-[140px]" />
        </Field>
        <div className="mt-2">
          <CopyBtn text={output} />
        </div>
      </div>
      {mode === PIG_MODES[1] && (
        <div className="mt-3">
          <Notice>Reverse translation is a best-effort guess — Pig Latin is ambiguous, so odd words may decode imperfectly.</Notice>
        </div>
      )}
    </Card>
  );
}

/* ============================== SpongeBob case ============================== */
export function SpongebobCaseTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [warn, setWarn] = useState(false);

  const randomize = () => {
    if (input.trim() === "") {
      setWarn(true);
      setOutput("");
      return;
    }
    setWarn(false);
    const out = [...input]
      .map((ch) =>
        /[a-zA-Z]/.test(ch) ? (Math.random() < 0.5 ? ch.toLowerCase() : ch.toUpperCase()) : ch
      )
      .join("");
    setOutput(out);
  };

  return (
    <Card>
      <Field label="Your sentence">
        <TextArea
          value={input}
          onChange={(e) => { setInput(e.target.value); setWarn(false); }}
          placeholder="i really love this tool…"
          className="min-h-[120px]"
        />
      </Field>
      <div className="mt-3">
        <Btn onClick={randomize}>RaNdOmIzE</Btn>
      </div>
      {warn && (
        <div className="mt-3">
          <Notice tone="warn">Type a sentence first, then hit RaNdOmIzE.</Notice>
        </div>
      )}
      {output !== "" && (
        <div className="mt-4">
          <Field label="MoCkInG oUtPuT">
            <TextArea value={output} readOnly className="min-h-[120px]" />
          </Field>
          <div className="mt-2 flex flex-wrap gap-2">
            <CopyBtn text={output} />
            <Btn variant="secondary" onClick={randomize}>
              Re-roll
            </Btn>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ============================== Whitespace remover ============================== */
const WS_MODES = [
  { value: "all", label: "All whitespace" },
  { value: "breaks", label: "Line breaks only" },
  { value: "tabs", label: "Tabs only" },
  { value: "collapse", label: "Collapse to single spaces" },
  { value: "trimlines", label: "Trim each line" },
];

const stripWhitespace = (t: string, mode: string): string => {
  if (mode === "breaks") return t.replace(/[\r\n]+/g, "");
  if (mode === "tabs") return t.replace(/\t/g, "");
  if (mode === "collapse") return t.replace(/\s+/g, " ");
  if (mode === "trimlines") return t.split("\n").map((l) => l.trim()).join("\n");
  return t.replace(/\s+/g, "");
};

export function WhitespaceRemoverTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState(WS_MODES[0].value);
  const [result, setResult] = useState<{ text: string; removed: number } | null>(null);

  const remove = () => {
    if (input === "") return;
    const out = stripWhitespace(input, mode);
    setResult({ text: out, removed: input.length - out.length });
  };

  return (
    <Card>
      <Field label="Input text">
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste text with whitespace to remove…"
          className="min-h-[140px]"
        />
      </Field>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <Field label="Removal mode">
            <Select value={mode} onChange={setMode} options={WS_MODES} />
          </Field>
        </div>
        <Btn onClick={remove} disabled={input === ""}>Remove</Btn>
      </div>
      {result && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-semibold text-sage">
            Removed {result.removed} whitespace character{result.removed === 1 ? "" : "s"}
          </p>
          <Field label="Output">
            <TextArea value={result.text} readOnly className="min-h-[140px]" />
          </Field>
          <div>
            <CopyBtn text={result.text} />
          </div>
        </div>
      )}
    </Card>
  );
}

/* ============================== Fancy text ============================== */
const shiftAlpha = (s: string, upBase: number, loBase: number, digitBase: number | null): string =>
  [...s]
    .map((ch) => {
      const c = ch.codePointAt(0) ?? 0;
      if (c >= 65 && c <= 90) return String.fromCodePoint(upBase + (c - 65));
      if (c >= 97 && c <= 122) return String.fromCodePoint(loBase + (c - 97));
      if (digitBase !== null && c >= 48 && c <= 57) return String.fromCodePoint(digitBase + (c - 48));
      return ch;
    })
    .join("");

const SCRIPT_UP: Record<string, number> = {
  B: 0x212c, E: 0x2130, F: 0x2131, H: 0x210b, I: 0x2110, L: 0x2112, M: 0x2133, R: 0x211b,
};
const SCRIPT_LO: Record<string, number> = { g: 0x210a, o: 0x2134 };

const toScript = (s: string): string =>
  [...s]
    .map((ch) => {
      const c = ch.codePointAt(0) ?? 0;
      if (c >= 65 && c <= 90) return String.fromCodePoint(SCRIPT_UP[ch] ?? 0x1d49c + (c - 65));
      if (c >= 97 && c <= 122) return String.fromCodePoint(SCRIPT_LO[ch] ?? 0x1d4b6 + (c - 97));
      return ch;
    })
    .join("");

const toCircled = (s: string): string =>
  [...s]
    .map((ch) => {
      const c = ch.codePointAt(0) ?? 0;
      if (c >= 65 && c <= 90) return String.fromCodePoint(0x24b6 + (c - 65));
      if (c >= 97 && c <= 122) return String.fromCodePoint(0x24d0 + (c - 97));
      if (c >= 49 && c <= 57) return String.fromCodePoint(0x245f + (c - 48));
      if (c === 48) return String.fromCodePoint(0x24ea);
      return ch;
    })
    .join("");

const FLIP: Record<string, string> = {
  a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ", i: "ᴉ",
  j: "ɾ", k: "ʞ", l: "l", m: "ɯ", n: "u", o: "o", p: "d", q: "b", r: "ɹ",
  s: "s", t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x", y: "ʎ", z: "z",
  A: "∀", B: "ᗺ", C: "Ɔ", D: "ᗡ", E: "Ǝ", F: "Ⅎ", G: "⅁", H: "H",
  I: "I", J: "ᒿ", K: "ʞ", L: "˥", M: "W", N: "N", O: "O", P: "Ԁ",
  Q: "Ό", R: "ᴚ", S: "S", T: "⊥", U: "∩", V: "Λ", W: "M", X: "X",
  Y: "⅄", Z: "Z",
  "0": "0", "1": "Ɩ", "2": "ᄅ", "3": "Ɛ", "4": "ㄣ", "5": "ϛ",
  "6": "9", "7": "ㄥ", "8": "8", "9": "6",
  ".": "˙", ",": "'", "'": ",", "!": "¡", "?": "¿", "(": ")",
  ")": "(", "[": "]", "]": "[", "{": "}", "}": "{", "<": ">",
  ">": "<", _: "‾", "&": "⅋",
};

const toUpsideDown = (s: string): string =>
  [...s].map((ch) => FLIP[ch] ?? ch).reverse().join("");

const FANCY: { label: string; fn: (s: string) => string }[] = [
  { label: "Bold", fn: (s) => shiftAlpha(s, 0x1d400, 0x1d41a, 0x1d7ce) },
  { label: "Italic", fn: (s) => shiftAlpha(s, 0x1d434, 0x1d44e, null) },
  { label: "Script", fn: toScript },
  { label: "Monospace", fn: (s) => shiftAlpha(s, 0x1d670, 0x1d68a, 0x1d7f6) },
  { label: "Circled", fn: toCircled },
  { label: "Upside down", fn: toUpsideDown },
];

export function FancyTextTool() {
  const [input, setInput] = useState("");

  const styles = useMemo(
    () => FANCY.map((f) => ({ label: f.label, text: f.fn(input) })),
    [input]
  );

  return (
    <Card>
      <Field label="Your text">
        <TextInput value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type something fancy…" />
      </Field>
      {input.trim() === "" ? (
        <div className="mt-4">
          <Notice>Type something above to preview the fancy styles.</Notice>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {styles.map((st) => (
            <div
              key={st.label}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-gold/25 bg-ink-2/70 px-4 py-3"
            >
              <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-widest text-sage">
                {st.label}
              </span>
              <span className="min-w-0 flex-1 break-all text-lg text-cream">{st.text}</span>
              <CopyBtn text={st.text} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
