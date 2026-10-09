"use client";

import { useMemo, useState } from "react";
import { Card, Field, TextInput, NumInput, Stat, Notice, Tabs, Slider, CopyBtn } from "../ui";

const pkr = (n: number) => "Rs " + Number(n).toLocaleString("en-PK", { maximumFractionDigits: 0 });

const num2 = (v: number) => (Math.round(v * 100) / 100).toLocaleString("en-US", { maximumFractionDigits: 2 });

const fmtBig = (v: number): string => {
  if (!Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a !== 0 && (a >= 1e15 || a < 1e-6)) return v.toExponential(4);
  return num2(v);
};

const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
const sup = (n: number) => String(n).split("").map((c) => SUP[c] ?? c).join("");

/* ---------------- Compound interest ---------------- */
export function CompoundInterestTool() {
  const [principal, setPrincipal] = useState("100000");
  const [monthly, setMonthly] = useState("10000");
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(10);

  const calc = useMemo(() => {
    const P = parseFloat(principal);
    const PMT = parseFloat(monthly);
    if (!Number.isFinite(P) || !Number.isFinite(PMT) || P < 0 || PMT < 0) return null;
    const r = rate / 1200; // monthly rate
    const rows: { year: number; start: number; contrib: number; interest: number; end: number }[] = [];
    for (let y = 1; y <= years; y++) {
      const start = y === 1 ? P : rows[y - 2].end;
      const m = y * 12;
      const pow = Math.pow(1 + r, m);
      const end = r === 0 ? P + PMT * m : P * pow + PMT * ((pow - 1) / r);
      const contrib = PMT * 12;
      rows.push({ year: y, start, contrib, interest: end - start - contrib, end });
    }
    const futureValue = rows.length ? rows[rows.length - 1].end : P;
    const totalContrib = P + PMT * 12 * years;
    return { rows, futureValue, totalContrib, interestEarned: futureValue - totalContrib };
  }, [principal, monthly, rate, years]);

  return (
    <Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Initial principal (Rs)">
          <NumInput value={principal} onChange={setPrincipal} placeholder="0" min="0" />
        </Field>
        <Field label="Monthly contribution (Rs)">
          <NumInput value={monthly} onChange={setMonthly} placeholder="0" min="0" />
        </Field>
      </div>
      <div className="mt-4 space-y-4">
        <Field label="Annual interest rate">
          <Slider value={rate} min={0} max={20} step={0.5} onChange={setRate} format={(v) => `${v} %`} />
        </Field>
        <Field label="Years">
          <Slider value={years} min={1} max={40} step={1} onChange={setYears} format={(v) => `${v} yrs`} />
        </Field>
      </div>
      <div className="mt-4">
        {calc === null ? (
          <Notice tone="warn">Enter a valid principal and monthly contribution (0 or more).</Notice>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Stat label="Future value" value={pkr(calc.futureValue)} accent />
              <Stat label="Total contributions" value={pkr(calc.totalContrib)} />
              <Stat label="Interest earned" value={pkr(calc.interestEarned)} />
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-gold/25">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="bg-gold/10 text-left">
                    {["Year", "Start", "Contributions", "Interest", "End"].map((h) => (
                      <th key={h} className="px-3 py-2 font-display text-xs font-bold uppercase tracking-widest text-gold-light">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {calc.rows.map((r) => (
                    <tr key={r.year} className="border-t border-gold/15 odd:bg-ink-2/50">
                      <td className="px-3 py-2 font-bold text-cream">{r.year}</td>
                      <td className="px-3 py-2 text-sage">{pkr(r.start)}</td>
                      <td className="px-3 py-2 text-sage">{pkr(r.contrib)}</td>
                      <td className="px-3 py-2 text-sage">{pkr(r.interest)}</td>
                      <td className="px-3 py-2 font-semibold text-cream">{pkr(r.end)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------------- Root / power ---------------- */
const ROOT_MODES = ["Root", "Power"];

export function RootCalcTool() {
  const [mode, setMode] = useState<string>(ROOT_MODES[0]);
  const [xStr, setXStr] = useState("16");
  const [degStr, setDegStr] = useState("2");

  const calc = useMemo(() => {
    const x = parseFloat(xStr);
    const n = Math.round(parseFloat(degStr));
    if (!Number.isFinite(x)) return null;
    if (!Number.isFinite(n) || n < 2 || n > 10) return { kind: "bad-deg" } as const;
    if (mode === "Root") {
      if (x < 0 && n % 2 === 0) return { kind: "bad-root" } as const;
      const root = x < 0 ? -Math.pow(-x, 1 / n) : Math.pow(x, 1 / n);
      return { kind: "root", root, n, x } as const;
    }
    return {
      kind: "power",
      sq: Math.pow(x, 2),
      cu: Math.pow(x, 3),
      pn: Math.pow(x, n),
      n,
      x,
    } as const;
  }, [mode, xStr, degStr]);

  return (
    <Card>
      <Tabs tabs={[...ROOT_MODES]} active={mode} onChange={setMode} />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Number (x)">
          <NumInput value={xStr} onChange={setXStr} placeholder="0" />
        </Field>
        <Field label="Degree (n)" hint="Whole number from 2 to 10">
          <NumInput value={degStr} onChange={setDegStr} placeholder="2" min="2" max="10" step="1" />
        </Field>
      </div>
      <div className="mt-4">
        {calc === null && <Notice>Enter a number to calculate.</Notice>}
        {calc !== null && calc.kind === "bad-deg" && (
          <Notice tone="warn">Degree must be a whole number from 2 to 10.</Notice>
        )}
        {calc !== null && calc.kind === "bad-root" && (
          <Notice tone="warn">Even-degree roots of negative numbers are not real — use an odd degree instead.</Notice>
        )}
        {calc !== null && calc.kind === "root" && (
          <Stat
            label={calc.n === 2 ? "Square root" : calc.n === 3 ? "Cube root" : `${calc.n}th root of ${num2(calc.x)}`}
            value={fmtBig(calc.root)}
            accent
          />
        )}
        {calc !== null && calc.kind === "power" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="x²" value={fmtBig(calc.sq)} accent />
            <Stat label="x³" value={fmtBig(calc.cu)} />
            <Stat label={`x^${calc.n}`} value={fmtBig(calc.pn)} />
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------------- Binary / decimal / hex / octal converter ---------------- */
const BASES = ["Binary", "Decimal", "Hex", "Octal"] as const;

function parseBigInt(s: string, base: (typeof BASES)[number]): bigint | null {
  const t = s.trim();
  if (!t) return null;
  const patterns: Record<string, RegExp> = {
    Binary: /^[01]+$/,
    Decimal: /^-?\d+$/,
    Hex: /^[0-9a-fA-F]+$/,
    Octal: /^[0-7]+$/,
  };
  if (!patterns[base].test(t)) return null;
  try {
    if (base === "Decimal") return BigInt(t);
    if (base === "Hex") return BigInt("0x" + t);
    if (base === "Octal") return BigInt("0o" + t);
    return BigInt("0b" + t);
  } catch {
    return null;
  }
}

export function BinaryConverterTool() {
  const [base, setBase] = useState<string>(BASES[0]);
  const [raw, setRaw] = useState("1010");

  const calc = useMemo(() => {
    if (raw.trim() === "") return { kind: "empty" } as const;
    let v: bigint | null = null;
    try {
      v = parseBigInt(raw, base as (typeof BASES)[number]);
    } catch {
      v = null;
    }
    if (v === null) return { kind: "invalid" } as const;
    return {
      kind: "ok",
      bin: v.toString(2),
      dec: v.toString(10),
      hex: v.toString(16).toUpperCase(),
      oct: v.toString(8),
    } as const;
  }, [raw, base]);

  const reps = [
    { label: "Binary", value: "bin" as const },
    { label: "Decimal", value: "dec" as const },
    { label: "Hexadecimal", value: "hex" as const },
    { label: "Octal", value: "oct" as const },
  ];

  return (
    <Card>
      <Tabs tabs={[...BASES]} active={base} onChange={setBase} />
      <div className="mt-4">
        <Field label={`Enter a ${base.toLowerCase()} value`}>
          <TextInput
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={base === "Hex" ? "1F" : base === "Binary" ? "1010" : base === "Octal" ? "12" : "42"}
            className="font-mono"
          />
        </Field>
      </div>
      <div className="mt-4 space-y-3">
        {calc !== null && calc.kind === "empty" && <Notice>Type a value above to convert.</Notice>}
        {calc !== null && calc.kind === "invalid" && (
          <Notice tone="warn">
            “{raw.trim()}” is not a valid {base.toLowerCase()} number.
            {base === "Binary" && " Use only 0 and 1."}
            {base === "Octal" && " Use only digits 0–7."}
            {base === "Hex" && " Use digits 0–9 and letters A–F."}
          </Notice>
        )}
        {calc !== null && calc.kind === "ok" &&
          reps.map((r) => (
            <div key={r.label} className="rounded-xl border border-gold/20 bg-ink-2/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-medium uppercase tracking-widest text-sage">{r.label}</div>
                <CopyBtn text={calc[r.value]} />
              </div>
              <div className="mt-1 break-all font-mono text-lg font-bold text-cream">
                {calc[r.value]}
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
}

/* ---------------- Decimal <-> fraction ---------------- */
const FRAC_MODES = ["Decimal → Fraction", "Fraction → Decimal"];

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a;
}

function repeatingDecimal(n: number, d: number): string {
  const sign = n * d < 0 ? "-" : "";
  const nn = Math.abs(n);
  const dd = Math.abs(d);
  const intPart = Math.floor(nn / dd);
  let rem = nn % dd;
  if (rem === 0) return sign + String(intPart);
  const seen = new Map<number, number>();
  let digits = "";
  while (rem !== 0 && !seen.has(rem)) {
    seen.set(rem, digits.length);
    rem *= 10;
    digits += Math.floor(rem / dd);
    rem = rem % dd;
  }
  if (rem === 0) return sign + `${intPart}.${digits}`;
  const idx = seen.get(rem)!;
  const rep = digits.slice(idx);
  const nonRep = digits.slice(0, idx);
  return sign + `${intPart}.${nonRep}(${rep}) — repeating`;
}

export function DecimalFractionTool() {
  const [mode, setMode] = useState<string>(FRAC_MODES[0]);
  const [dec, setDec] = useState("0.75");
  const [numStr, setNumStr] = useState("3");
  const [denStr, setDenStr] = useState("4");

  const result = useMemo(() => {
    if (mode === FRAC_MODES[0]) {
      const v = parseFloat(dec);
      if (!Number.isFinite(v)) return null;
      const sign = v < 0 ? "-" : "";
      const a = Math.abs(v);
      const str = a.toString();
      const parts = str.split(".");
      const places = Math.min(9, (parts[1] ?? "").length);
      const den = Math.pow(10, places);
      const num = Math.round(a * den);
      const g = gcd(num, den) || 1;
      const sn = num / g;
      const sd = den / g;
      if (sd === 1) return { kind: "text", text: sign + String(sn) } as const;
      if (sn < sd) return { kind: "text", text: `${sign}${sn}/${sd}` } as const;
      const whole = Math.floor(sn / sd);
      const rem = sn - whole * sd;
      return { kind: "text", text: rem === 0 ? sign + String(whole) : `${sign}${whole} ${rem}/${sd}` } as const;
    }
    const n = parseInt(numStr, 10);
    const d = parseInt(denStr, 10);
    if (!Number.isFinite(n) || !Number.isFinite(d)) return null;
    if (d === 0) return { kind: "div-zero" } as const;
    return { kind: "decimal", text: repeatingDecimal(n, d), plain: n / d } as const;
  }, [mode, dec, numStr, denStr]);

  return (
    <Card>
      <Tabs tabs={[...FRAC_MODES]} active={mode} onChange={setMode} />
      {mode === FRAC_MODES[0] ? (
        <div className="mt-4">
          <Field label="Decimal number">
            <NumInput value={dec} onChange={setDec} placeholder="0.75" step="any" />
          </Field>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Numerator">
            <NumInput value={numStr} onChange={setNumStr} placeholder="3" step="1" />
          </Field>
          <Field label="Denominator">
            <NumInput value={denStr} onChange={setDenStr} placeholder="4" step="1" />
          </Field>
        </div>
      )}
      <div className="mt-4">
        {result === null && <Notice>Enter a valid number to convert.</Notice>}
        {result !== null && result.kind === "div-zero" && (
          <Notice tone="warn">Denominator can&apos;t be zero — division by zero is undefined.</Notice>
        )}
        {result !== null && (result.kind === "text" || result.kind === "decimal") && (
          <Stat label="Result" value={result.text} accent />
        )}
        {result !== null && result.kind === "decimal" && Number.isFinite(result.plain) && (
          <p className="mt-2 text-sm text-sage">
            Decimal value: <span className="font-mono font-bold text-cream">{num2(result.plain)}</span>
          </p>
        )}
      </div>
    </Card>
  );
}

/* ---------------- Prime checker ---------------- */
function factorize(n: number): [number, number][] {
  const out: [number, number][] = [];
  let m = n;
  for (let p = 2; p * p <= m; p++) {
    if (m % p === 0) {
      let e = 0;
      while (m % p === 0) {
        m /= p;
        e++;
      }
      out.push([p, e]);
    }
  }
  if (m > 1) out.push([m, 1]);
  return out;
}

function primeCountUpTo(limit: number): number {
  const sieve = new Uint8Array(limit + 1);
  let count = 0;
  for (let i = 2; i <= limit; i++) {
    if (!sieve[i]) {
      count++;
      if (i * i <= limit) {
        for (let j = i * i; j <= limit; j += i) sieve[j] = 1;
      }
    }
  }
  return count;
}

export function PrimeCheckerTool() {
  const [raw, setRaw] = useState("84");

  const calc = useMemo(() => {
    if (raw.trim() === "") return null;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n)) return null;
    if (n < 2) return { kind: "too-small", n } as const;
    const factors = factorize(n);
    const isPrime = factors.length === 1 && factors[0][1] === 1 && factors[0][0] === n;
    const breakdown =
      n +
      " = " +
      factors.map(([p, e]) => (e === 1 ? String(p) : `${p}${sup(e)}`)).join(" × ");
    const capped = n > 100000;
    const primeCount = primeCountUpTo(capped ? 100000 : n);
    return { kind: "ok", n, isPrime, breakdown, primeCount, capped } as const;
  }, [raw]);

  return (
    <Card>
      <Field label="Integer" hint="Whole number, 2 or greater">
        <NumInput value={raw} onChange={setRaw} placeholder="84" min="0" step="1" />
      </Field>
      <div className="mt-4 space-y-3">
        {calc === null && <Notice>Enter an integer to check.</Notice>}
        {calc !== null && calc.kind === "too-small" && (
          <Notice tone="warn">Prime numbers start at 2 — enter a number of 2 or more.</Notice>
        )}
        {calc !== null && calc.kind === "ok" && (
          <>
            <Stat label={`${calc.n.toLocaleString("en-PK")} is`} value={calc.isPrime ? "Prime ✓" : "Not prime"} accent={calc.isPrime} />
            <div className="rounded-xl border border-gold/20 bg-ink-2/70 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-widest text-sage">Prime factorization</div>
              <div className="mt-1 break-all font-mono text-lg font-bold text-cream">{calc.breakdown}</div>
            </div>
            {calc.capped && (
              <Notice tone="warn">Counting capped at 100,000 — {calc.n.toLocaleString("en-PK")} is too large to sieve quickly.</Notice>
            )}
            <Stat
              label={calc.capped ? "Primes up to 100,000" : `Primes up to ${calc.n.toLocaleString("en-PK")}`}
              value={calc.primeCount.toLocaleString("en-PK")}
            />
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------------- Tip calculator ---------------- */
export function TipCalcTool() {
  const [bill, setBill] = useState("2500");
  const [tipPct, setTipPct] = useState(10);
  const [people, setPeople] = useState("2");

  const calc = useMemo(() => {
    const b = parseFloat(bill);
    const p = parseInt(people, 10);
    if (!Number.isFinite(b) || b < 0) return null;
    if (!Number.isFinite(p) || p < 1) return { kind: "bad-people" } as const;
    const tip = (b * tipPct) / 100;
    const total = b + tip;
    return { kind: "ok", tip, total, perPerson: total / p } as const;
  }, [bill, tipPct, people]);

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Bill amount (Rs)">
          <NumInput value={bill} onChange={setBill} placeholder="0" min="0" />
        </Field>
        <Field label="Tip percentage">
          <Slider value={tipPct} min={0} max={30} step={1} onChange={setTipPct} format={(v) => `${v} %`} />
        </Field>
        <Field label="Split between (people)">
          <NumInput value={people} onChange={setPeople} placeholder="1" min="1" step="1" />
        </Field>
      </div>
      <div className="mt-4">
        {calc === null && <Notice>Enter a valid bill amount.</Notice>}
        {calc !== null && calc.kind === "bad-people" && (
          <Notice tone="warn">Number of people must be at least 1.</Notice>
        )}
        {calc !== null && calc.kind === "ok" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Tip amount" value={pkr(calc.tip)} />
            <Stat label="Total bill" value={pkr(calc.total)} />
            <Stat label="Per person" value={pkr(calc.perPerson)} accent />
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------------- Days between dates ---------------- */
export function DaysBetweenTool() {
  const [d1, setD1] = useState("");
  const [d2, setD2] = useState("");

  const calc = useMemo(() => {
    if (!d1 || !d2) return null;
    const a = new Date(d1 + "T00:00:00");
    const b = new Date(d2 + "T00:00:00");
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return { kind: "invalid" } as const;
    const days = Math.round((b.getTime() - a.getTime()) / 86400000);
    if (days < 0) return { kind: "reversed" } as const;
    return {
      kind: "ok",
      days,
      weeks: days / 7,
      months: days / 30.4375,
      years: days / 365.25,
      weekday1: a.toLocaleDateString("en-US", { weekday: "long" }),
      weekday2: b.toLocaleDateString("en-US", { weekday: "long" }),
    };
  }, [d1, d2]);

  return (
    <Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Start date">
          <TextInput type="date" value={d1} onChange={(e) => setD1(e.target.value)} />
        </Field>
        <Field label="End date">
          <TextInput type="date" value={d2} onChange={(e) => setD2(e.target.value)} />
        </Field>
      </div>
      <div className="mt-4">
        {calc === null && <Notice>Pick both dates to see the time between them.</Notice>}
        {calc !== null && calc.kind === "invalid" && (
          <Notice tone="warn">One of the dates is invalid — pick again.</Notice>
        )}
        {calc !== null && calc.kind === "reversed" && (
          <Notice tone="warn">End date is before the start date. Swap the two dates.</Notice>
        )}
        {calc !== null && calc.kind === "ok" && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Days" value={calc.days.toLocaleString("en-PK")} accent />
              <Stat label="Weeks" value={num2(calc.weeks)} />
              <Stat label="Months" value={num2(calc.months)} />
              <Stat label="Years" value={num2(calc.years)} />
            </div>
            <p className="mt-3 text-sm text-sage">
              Start date falls on <span className="font-bold text-cream">{calc.weekday1}</span>, end date on{" "}
              <span className="font-bold text-cream">{calc.weekday2}</span>.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------------- Fuel cost ---------------- */
export function FuelCostTool() {
  const [distance, setDistance] = useState("500");
  const [mileage, setMileage] = useState("12");
  const [price, setPrice] = useState("260");

  const calc = useMemo(() => {
    const d = parseFloat(distance);
    const m = parseFloat(mileage);
    const p = parseFloat(price);
    if (!Number.isFinite(d) || !Number.isFinite(p) || d < 0 || p < 0) return null;
    if (!Number.isFinite(m) || m <= 0) return { kind: "bad-mileage" } as const;
    const litres = d / m;
    const cost = litres * p;
    return { kind: "ok", litres, cost, perKm: d === 0 ? 0 : cost / d } as const;
  }, [distance, mileage, price]);

  return (
    <Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Distance (km)">
          <NumInput value={distance} onChange={setDistance} placeholder="0" min="0" />
        </Field>
        <Field label="Mileage (km/litre)">
          <NumInput value={mileage} onChange={setMileage} placeholder="0" min="0" step="any" />
        </Field>
        <Field label="Fuel price (Rs/litre)">
          <NumInput value={price} onChange={setPrice} placeholder="0" min="0" />
        </Field>
      </div>
      <div className="mt-4">
        {calc === null && <Notice>Enter a valid distance and fuel price.</Notice>}
        {calc !== null && calc.kind === "bad-mileage" && (
          <Notice tone="warn">Mileage must be greater than zero.</Notice>
        )}
        {calc !== null && calc.kind === "ok" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Fuel needed" value={`${num2(calc.litres)} L`} />
            <Stat label="Total fuel cost" value={pkr(calc.cost)} accent />
            <Stat label="Cost per km" value={pkr(calc.perKm)} />
          </div>
        )}
      </div>
    </Card>
  );
}
