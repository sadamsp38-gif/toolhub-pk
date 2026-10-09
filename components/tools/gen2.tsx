"use client";

import { useMemo, useRef, useState } from "react";
import { Btn, Card, Check, CopyBtn, Field, Notice, NumInput, Select, Stat, Tabs, TextArea } from "../ui";

/* ============================== Random number ============================== */

export function RandomNumberTool() {
  const [minS, setMinS] = useState("1");
  const [maxS, setMaxS] = useState("100");
  const [countS, setCountS] = useState("10");
  const [noDup, setNoDup] = useState(false);
  const [sorted, setSorted] = useState(false);
  const [results, setResults] = useState<number[] | null>(null);
  const [warn, setWarn] = useState("");

  const generate = () => {
    const rawMin = parseInt(minS, 10);
    const rawMax = parseInt(maxS, 10);
    const rawCount = parseInt(countS, 10);
    if (Number.isNaN(rawMin) || Number.isNaN(rawMax) || Number.isNaN(rawCount)) {
      setWarn("Please enter valid numbers for min, max and count.");
      setResults(null);
      return;
    }
    const lo = Math.min(rawMin, rawMax);
    const hi = Math.max(rawMin, rawMax);
    const count = Math.min(Math.max(rawCount, 1), 1000);
    const range = hi - lo + 1;

    if (noDup && count > range) {
      setWarn(`Cannot pick ${count} unique numbers from a range of only ${range} (from ${lo} to ${hi}). Increase the range or turn off “No duplicates”.`);
      setResults(null);
      return;
    }

    setWarn("");
    let nums: number[];
    if (noDup) {
      const pool = new Set<number>();
      while (pool.size < count) pool.add(lo + Math.floor(Math.random() * range));
      nums = Array.from(pool);
    } else {
      nums = Array.from({ length: count }, () => lo + Math.floor(Math.random() * range));
    }
    if (sorted) nums.sort((a, b) => a - b);
    setResults(nums);
  };

  return (
    <Card>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Min">
          <NumInput value={minS} onChange={setMinS} />
        </Field>
        <Field label="Max">
          <NumInput value={maxS} onChange={setMaxS} />
        </Field>
        <Field label="Count" hint="1–1000">
          <NumInput value={countS} onChange={setCountS} min={1} max={1000} />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <Check label="No duplicates" checked={noDup} onChange={setNoDup} />
        <Check label="Sort results" checked={sorted} onChange={setSorted} />
        <Btn onClick={generate}>🎲 Generate</Btn>
      </div>
      {warn && (
        <div className="mt-4">
          <Notice tone="warn">{warn}</Notice>
        </div>
      )}
      {results && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Generated" value={String(results.length)} accent />
          </div>
          <div className="flex max-h-64 flex-wrap gap-2 overflow-auto rounded-xl border border-gold/25 bg-ink-2/70 p-4 font-mono text-sm">
            {results.map((n, i) => (
              <span key={i} className="rounded-lg border border-gold/25 bg-ink/80 px-2.5 py-1 text-cream">
                {n.toLocaleString("en-PK")}
              </span>
            ))}
          </div>
          <div>
            <CopyBtn text={results.join(" ")} label="Copy (space-separated)" />
          </div>
        </div>
      )}
    </Card>
  );
}

/* ============================== Dice roller ============================== */

const DIE_OPTIONS = [
  { value: "d4", label: "d4" },
  { value: "d6", label: "d6" },
  { value: "d8", label: "d8" },
  { value: "d10", label: "d10" },
  { value: "d12", label: "d12" },
  { value: "d20", label: "d20" },
  { value: "coin", label: "Coin flip" },
];

type Roll = { id: number; label: string; faces: string[]; total: string };

export function DiceRollerTool() {
  const [die, setDie] = useState("d6");
  const [countS, setCountS] = useState("1");
  const [history, setHistory] = useState<Roll[]>([]);
  const idRef = useRef(0);

  const roll = () => {
    const count = Math.min(Math.max(parseInt(countS, 10) || 1, 1), 10);
    const isCoin = die === "coin";
    const sides = isCoin ? 2 : parseInt(die.slice(1), 10);
    const faces: string[] = [];
    for (let i = 0; i < count; i++) {
      const v = 1 + Math.floor(Math.random() * sides);
      faces.push(isCoin ? (v === 1 ? "H" : "T") : String(v));
    }
    const total = isCoin
      ? `${faces.filter((f) => f === "H").length} heads`
      : String(faces.reduce((a, f) => a + Number(f), 0));
    idRef.current += 1;
    const entry: Roll = {
      id: idRef.current,
      label: isCoin ? `${count} coin flip${count > 1 ? "s" : ""}` : `${count}${die}`,
      faces,
      total,
    };
    setHistory((h) => [entry, ...h].slice(0, 20));
  };

  const current = history[0];

  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Die">
          <Select value={die} onChange={setDie} options={DIE_OPTIONS} />
        </Field>
        <Field label="Number of dice" hint="1–10">
          <NumInput value={countS} onChange={setCountS} min={1} max={10} />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Btn onClick={roll}>🎲 Roll</Btn>
        {history.length > 0 && (
          <Btn variant="secondary" onClick={() => setHistory([])}>
            Clear history
          </Btn>
        )}
      </div>
      {current && (
        <div className="mt-4 rounded-xl border border-gold/25 bg-ink-2/70 p-6 text-center">
          <div className="text-xs font-medium uppercase tracking-widest text-sage">{current.label}</div>
          <div className="mt-2 font-display text-5xl font-bold text-gold-light">{current.total}</div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {current.faces.map((f, i) => (
              <span key={i} className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/40 bg-ink/80 font-mono text-base font-bold text-cream">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
      {history.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <div className="text-sm font-semibold text-cream">Roll history</div>
          {history.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-ink-2/60 px-3 py-1.5 text-sm">
              <span className="text-sage">{r.label}</span>
              <span className="font-mono text-cream">{r.faces.join(" · ")}</span>
              <span className="font-bold text-gold-light">{r.total}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ============================== SHA generator ============================== */

const SHA_TABS = ["SHA-256", "SHA-512", "SHA-1"];

export function ShaGeneratorTool() {
  const [input, setInput] = useState("");
  const [algo, setAlgo] = useState<string>(SHA_TABS[0]);
  const [hash, setHash] = useState("");
  const [uppercase, setUppercase] = useState(false);
  const [breaks, setBreaks] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setError("");
    try {
      const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(input));
      setHash(
        Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      );
    } catch {
      setError("Hashing failed — your browser may not support WebCrypto for this algorithm.");
    }
  };

  const display = useMemo(() => {
    let h = uppercase ? hash.toUpperCase() : hash;
    if (breaks && h) h = h.match(/.{1,64}/g)?.join("\n") ?? h;
    return h;
  }, [hash, uppercase, breaks]);

  return (
    <Card>
      <Tabs tabs={SHA_TABS} active={algo} onChange={setAlgo} />
      <div className="mt-4">
        <Field label="Text to hash">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste text here…"
            className="min-h-[110px]"
          />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <Check label="Uppercase" checked={uppercase} onChange={setUppercase} />
        <Check label="Line breaks every 64 chars" checked={breaks} onChange={setBreaks} />
        <Btn onClick={generate} disabled={!input}># Generate hash</Btn>
      </div>
      {error && (
        <div className="mt-4">
          <Notice tone="warn">{error}</Notice>
        </div>
      )}
      {display && (
        <div className="mt-4">
          <Field label={`${algo} digest`}>
            <pre className="overflow-auto whitespace-pre-wrap break-all rounded-xl border border-gold/25 bg-ink-2/70 px-4 py-3 font-mono text-sm text-cream">
              {display}
            </pre>
          </Field>
          <div className="mt-2">
            <CopyBtn text={display} />
          </div>
        </div>
      )}
      <div className="mt-4">
        <Notice>Hashed locally with WebCrypto — your text never leaves the browser.</Notice>
      </div>
    </Card>
  );
}

/* ============================== Fake data ============================== */

const FIRST_NAMES = ["Ahmed", "Ali", "Bilal", "Fatima", "Ayesha", "Usman", "Sana", "Hassan", "Zainab", "Imran", "Maryam", "Danish", "Hira", "Kamran", "Sadia"];
const LAST_NAMES = ["Khan", "Malik", "Sheikh", "Ahmed", "Raza", "Siddiqui", "Qureshi", "Butt", "Chaudhry", "Hussain", "Iqbal", "Farooq"];
const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Hyderabad", "Sialkot", "Sukkur", "Gujranwala"];
const STREETS = ["Gulberg", "Model Town", "DHA Phase 5", "Bahria Town", "Cantt", "Satellite Town", "Johar Town", "F-10", "Clifton", "Gulshan-e-Iqbal"];

type FakePerson = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal: string;
};

const pick = (arr: string[]): string => arr[Math.floor(Math.random() * arr.length)];
const digit = (): string => String(Math.floor(Math.random() * 10));

function makePerson(): FakePerson {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const city = pick(CITIES);
  const street = pick(STREETS);
  const house = 1 + Math.floor(Math.random() * 499);
  const emailName = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "");
  return {
    name: `${first} ${last}`,
    email: `${emailName}${Math.floor(Math.random() * 99)}@example.com`,
    phone: `+92 3${digit()}${digit()} ${digit()}${digit()}${digit()}${digit()}${digit()}${digit()}${digit()}`,
    address: `House ${house}, ${street}`,
    city,
    postal: `${digit()}${digit()}${digit()}${digit()}${digit()}`,
  };
}

export function FakeDataTool() {
  const [person, setPerson] = useState<FakePerson | null>(null);

  const rows = person
    ? [
        { label: "Full name", value: person.name },
        { label: "Email", value: person.email },
        { label: "Phone", value: person.phone },
        { label: "Address", value: person.address },
        { label: "City", value: person.city },
        { label: "Postal code", value: person.postal },
      ]
    : [];

  return (
    <Card>
      <Notice tone="warn">
        Sample data for testing only — these details are randomly generated and do not belong to any real person.
      </Notice>
      <div className="mt-4">
        <Btn onClick={() => setPerson(makePerson())}>
          {person ? "🔄 Regenerate" : "🎲 Generate sample person"}
        </Btn>
      </div>
      {person && (
        <div className="mt-4 space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-wrap items-center gap-3 rounded-xl border border-gold/25 bg-ink-2/70 px-4 py-2.5">
              <span className="w-28 text-xs font-bold uppercase tracking-wide text-sage">{row.label}</span>
              <code className="min-w-0 flex-1 break-all font-mono text-sm font-semibold text-cream">{row.value}</code>
              <CopyBtn text={row.value} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
