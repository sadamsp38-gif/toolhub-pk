"use client";

import { useMemo, useRef, useState } from "react";
import { Card, Field, TextInput, NumInput, Stat, Notice, Tabs, Slider, CopyBtn, Btn, Select } from "../ui";

/* ---------- shared helpers ---------- */
const pkr = (n: number) => "Rs " + Number(n).toLocaleString("en-PK", { maximumFractionDigits: 0 });

const num2 = (v: number) => (Math.round(v * 100) / 100).toLocaleString("en-US", { maximumFractionDigits: 2 });

function fmtSmart(v: number): string {
  if (!Number.isFinite(v)) return "—";
  if (Number.isInteger(v) && Math.abs(v) < 1e15) return v.toLocaleString("en-US");
  const r = Math.round(v * 1e6) / 1e6;
  return r.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** minutes (any range) -> "h:MM AM/PM" */
function fmtClock(totalMins: number): string {
  const m = ((Math.round(totalMins) % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const ap = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad2(mm)} ${ap}`;
}

/** seconds -> "H:MM:SS" (with sign for negatives) */
function fmtHMS(totalSecs: number): string {
  const sign = totalSecs < 0 ? "-" : "";
  const s = Math.round(Math.abs(totalSecs));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${sign}${h}:${pad2(m)}:${pad2(sec)}`;
}

/* ---------------- 1. SIP calculator ---------------- */
export function SipCalcTool() {
  const [monthly, setMonthly] = useState("10000");
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  const calc = useMemo(() => {
    const m = parseFloat(monthly);
    if (!Number.isFinite(m) || m < 0) return null;
    if (years < 1) return null;
    const r = rate / 1200;
    const rows: { year: number; invested: number; growth: number; value: number }[] = [];
    for (let y = 1; y <= years; y++) {
      const n = y * 12;
      const pow = Math.pow(1 + r, n);
      const value = r === 0 ? m * n : m * ((pow - 1) / r) * (1 + r);
      const invested = m * n;
      rows.push({ year: y, invested, growth: value - invested, value });
    }
    const last = rows[rows.length - 1];
    return { rows, total: last.value, invested: last.invested, growth: last.growth };
  }, [monthly, rate, years]);

  return (
    <Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Monthly investment (Rs)">
          <NumInput value={monthly} onChange={setMonthly} placeholder="0" min="0" />
        </Field>
        <Field label="Expected annual return">
          <Slider value={rate} min={0} max={24} step={0.5} onChange={setRate} format={(v) => `${v} %`} />
        </Field>
        <Field label="Investment period">
          <Slider value={years} min={1} max={30} step={1} onChange={setYears} format={(v) => `${v} yrs`} />
        </Field>
      </div>
      <div className="mt-4">
        {calc === null ? (
          <Notice tone="warn">Enter a valid monthly investment (0 or more).</Notice>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Stat label="Projected value" value={pkr(calc.total)} accent />
              <Stat label="Total invested" value={pkr(calc.invested)} />
              <Stat label="Estimated growth" value={pkr(calc.growth)} />
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-gold/25">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="bg-gold/10 text-left">
                    {["Year", "Invested", "Growth", "Value"].map((h) => (
                      <th key={h} className="px-3 py-2 font-display text-xs font-bold uppercase tracking-widest text-gold-light">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {calc.rows.map((r) => (
                    <tr key={r.year} className="border-t border-gold/15 odd:bg-ink-2/50">
                      <td className="px-3 py-2 font-bold text-cream">{r.year}</td>
                      <td className="px-3 py-2 text-sage">{pkr(r.invested)}</td>
                      <td className="px-3 py-2 text-sage">{pkr(r.growth)}</td>
                      <td className="px-3 py-2 font-semibold text-cream">{pkr(r.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-sage/70">Projection only — actual returns vary with the market. Contributions are assumed at the start of each month.</p>
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------------- 2. Zakat calculator ---------------- */
const ZAKAT_PRESETS = [
  { value: "220000", label: "Silver-based nisab (example: Rs 220,000)" },
  { value: "2360000", label: "Gold-based nisab (example: Rs 2,360,000)" },
  { value: "custom", label: "Custom amount…" },
];

export function ZakatCalcTool() {
  const [cash, setCash] = useState("50000");
  const [bank, setBank] = useState("200000");
  const [goldVal, setGoldVal] = useState("0");
  const [silverVal, setSilverVal] = useState("0");
  const [invest, setInvest] = useState("0");
  const [owed, setOwed] = useState("0");
  const [debts, setDebts] = useState("0");
  const [preset, setPreset] = useState(ZAKAT_PRESETS[0].value);
  const [nisab, setNisab] = useState(ZAKAT_PRESETS[0].value);

  const pickPreset = (v: string) => {
    setPreset(v);
    if (v !== "custom") setNisab(v);
  };

  const calc = useMemo(() => {
    const vals = [cash, bank, goldVal, silverVal, invest, owed, debts, nisab].map(parseFloat);
    if (vals.some((v) => !Number.isFinite(v) || v < 0)) return null;
    const [c, b, g, s, inv, ow, db, nb] = vals as number[];
    const assets = c + b + g + s + inv + ow;
    const net = assets - db;
    const aboveNisab = nb > 0 && net >= nb;
    return { assets, net, nb, aboveNisab, zakat: aboveNisab ? net * 0.025 : 0 };
  }, [cash, bank, goldVal, silverVal, invest, owed, debts, nisab]);

  const moneyField = (label: string, value: string, onChange: (v: string) => void) => (
    <Field label={label}>
      <NumInput value={value} onChange={onChange} placeholder="0" min="0" />
    </Field>
  );

  return (
    <Card>
      <Notice>
        <span className="font-semibold text-gold-light">Estimate only.</span> Zakat rules differ between schools of thought and asset types — treat this as a guide and consult a scholar for your situation.
      </Notice>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {moneyField("Cash in hand (Rs)", cash, setCash)}
        {moneyField("Bank balances (Rs)", bank, setBank)}
        {moneyField("Gold — market value (Rs)", goldVal, setGoldVal)}
        {moneyField("Silver — market value (Rs)", silverVal, setSilverVal)}
        {moneyField("Investments / stocks (Rs)", invest, setInvest)}
        {moneyField("Money owed to you (Rs)", owed, setOwed)}
        {moneyField("Debts & liabilities (Rs)", debts, setDebts)}
        <div>
          <Field label="Nisab basis">
            <Select value={preset} onChange={pickPreset} options={ZAKAT_PRESETS} />
          </Field>
          <div className="mt-2">
            <Field label="Nisab threshold (Rs)" hint="Editable — update with current gold/silver prices">
              <NumInput value={nisab} onChange={(v) => { setNisab(v); setPreset("custom"); }} placeholder="0" min="0" />
            </Field>
          </div>
        </div>
      </div>
      <div className="mt-4">
        {calc === null ? (
          <Notice tone="warn">All amounts must be valid numbers (0 or more).</Notice>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Stat label="Total zakatable assets" value={pkr(calc.assets)} />
              <Stat label="Net after debts" value={pkr(calc.net)} />
              <Stat label="Zakat due (2.5%)" value={pkr(calc.zakat)} accent />
            </div>
            {!calc.aboveNisab && (
              <p className="mt-3 text-sm text-sage">
                Net assets are below the nisab threshold ({pkr(calc.nb)}), so no Zakat is due on this estimate.
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------------- 3. Electricity bill (Pakistan, indicative) ---------------- */
const ELE_SLABS: { upto: number; rate: number }[] = [
  { upto: 50, rate: 4.82 },
  { upto: 100, rate: 6.37 },
  { upto: 200, rate: 9.53 },
  { upto: 300, rate: 13.01 },
  { upto: 400, rate: 14.92 },
  { upto: 500, rate: 18.01 },
  { upto: 600, rate: 21.11 },
  { upto: 700, rate: 22.93 },
  { upto: Infinity, rate: 26.48 },
];

export function ElectricityBillTool() {
  const [units, setUnits] = useState("250");

  const calc = useMemo(() => {
    const u = parseFloat(units);
    if (!Number.isFinite(u) || u < 0) return null;
    let remaining = u;
    let prev = 0;
    const rows: { label: string; units: number; rate: number; cost: number }[] = [];
    for (const s of ELE_SLABS) {
      if (remaining <= 0) break;
      const inSlab = Math.min(remaining, s.upto - prev);
      if (inSlab > 0) {
        rows.push({
          label: prev === 0 ? `1–${s.upto === Infinity ? "above" : s.upto}` : `${prev + 1}–${s.upto === Infinity ? "above" : s.upto}`,
          units: inSlab,
          rate: s.rate,
          cost: inSlab * s.rate,
        });
      }
      remaining -= inSlab;
      prev = s.upto;
    }
    const total = rows.reduce((a, r) => a + r.cost, 0);
    return { rows, total, avg: u === 0 ? 0 : total / u };
  }, [units]);

  return (
    <Card>
      <Notice tone="warn">
        Indicative rates only — they change with NEPRA revisions and differ for protected / lifeline consumers.
        Verify against your DISCO bill. Fixed charges, taxes and fuel adjustments are not included.
      </Notice>
      <div className="mt-4">
        <Field label="Monthly units consumed (kWh)" hint="Check your last bill for the units figure">
          <NumInput value={units} onChange={setUnits} placeholder="0" min="0" />
        </Field>
      </div>
      <div className="mt-4">
        {calc === null ? (
          <Notice tone="warn">Enter a valid number of units (0 or more).</Notice>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Stat label="Estimated bill" value={pkr(calc.total)} accent />
              <Stat label="Units" value={Number(units).toLocaleString("en-PK")} />
              <Stat label="Avg rate / unit" value={`Rs ${num2(calc.avg)}`} />
            </div>
            {calc.rows.length > 0 && (
              <div className="mt-4 overflow-x-auto rounded-xl border border-gold/25">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="bg-gold/10 text-left">
                      {["Slab (units)", "Units", "Rate (Rs)", "Cost (Rs)"].map((h) => (
                        <th key={h} className="px-3 py-2 font-display text-xs font-bold uppercase tracking-widest text-gold-light">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calc.rows.map((r) => (
                      <tr key={r.label} className="border-t border-gold/15 odd:bg-ink-2/50">
                        <td className="px-3 py-2 font-bold text-cream">{r.label}</td>
                        <td className="px-3 py-2 text-sage">{num2(r.units)}</td>
                        <td className="px-3 py-2 text-sage">{num2(r.rate)}</td>
                        <td className="px-3 py-2 font-semibold text-cream">{pkr(r.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------------- 4. Salary → hourly ---------------- */
export function SalaryHourlyTool() {
  const [salary, setSalary] = useState("150000");
  const [days, setDays] = useState(22);
  const [hours, setHours] = useState(8);

  const calc = useMemo(() => {
    const s = parseFloat(salary);
    if (!Number.isFinite(s) || s < 0) return null;
    const hourly = s / (days * hours);
    return { hourly, daily: hourly * hours, monthly: s, annual: s * 12 };
  }, [salary, days, hours]);

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Monthly salary (Rs)">
          <NumInput value={salary} onChange={setSalary} placeholder="0" min="0" />
        </Field>
        <Field label="Work days per month">
          <Slider value={days} min={20} max={30} step={1} onChange={setDays} format={(v) => `${v} days`} />
        </Field>
        <Field label="Work hours per day">
          <Slider value={hours} min={4} max={14} step={0.5} onChange={setHours} format={(v) => `${v} hrs`} />
        </Field>
      </div>
      <div className="mt-4">
        {calc === null ? (
          <Notice tone="warn">Enter a valid monthly salary.</Notice>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Hourly rate" value={pkr(calc.hourly)} accent />
            <Stat label="Daily rate" value={pkr(calc.daily)} />
            <Stat label="Monthly" value={pkr(calc.monthly)} />
            <Stat label="Annual" value={pkr(calc.annual)} />
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------------- 5. GPA calculator ---------------- */
const GPA_GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"] as const;
const GPA_POINTS: Record<string, number> = {
  "A+": 4.0, A: 4.0, "A-": 3.67, "B+": 3.33, B: 3.0, "B-": 2.67,
  "C+": 2.33, C: 2.0, "C-": 1.67, "D+": 1.33, D: 1.0, F: 0.0,
};

interface Course { id: number; name: string; credits: string; grade: string; }

export function GpaCalcTool() {
  const [courses, setCourses] = useState<Course[]>([
    { id: 1, name: "Course 1", credits: "3", grade: "A" },
    { id: 2, name: "Course 2", credits: "3", grade: "B+" },
    { id: 3, name: "Course 3", credits: "4", grade: "A-" },
  ]);
  const nextId = useRef(4);

  const update = (id: number, patch: Partial<Course>) =>
    setCourses((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id: number) => setCourses((cs) => (cs.length > 1 ? cs.filter((c) => c.id !== id) : cs));
  const add = () => {
    const id = nextId.current++;
    setCourses((cs) => [...cs, { id, name: `Course ${id}`, credits: "3", grade: "B" }]);
  };

  const calc = useMemo(() => {
    let points = 0;
    let credits = 0;
    for (const c of courses) {
      const ch = parseFloat(c.credits);
      const gp = GPA_POINTS[c.grade];
      if (!Number.isFinite(ch) || ch <= 0 || gp === undefined) return null;
      points += gp * ch;
      credits += ch;
    }
    if (credits === 0) return null;
    const gpa = points / credits;
    const standing =
      gpa >= 3.5 ? "Excellent — Dean's List territory" :
      gpa >= 3.0 ? "Good standing" :
      gpa >= 2.0 ? "Satisfactory" : "Below satisfactory — talk to your advisor";
    return { gpa, credits, points, standing };
  }, [courses]);

  return (
    <Card>
      <div className="space-y-3">
        {courses.map((c) => (
          <div key={c.id} className="grid grid-cols-12 items-end gap-2 rounded-xl border border-gold/15 bg-ink-2/50 p-3">
            <div className="col-span-12 sm:col-span-5">
              <Field label="Course">
                <TextInput value={c.name} onChange={(e) => update(c.id, { name: e.target.value })} placeholder="Course name" />
              </Field>
            </div>
            <div className="col-span-5 sm:col-span-3">
              <Field label="Credit hrs">
                <NumInput value={c.credits} onChange={(v) => update(c.id, { credits: v })} placeholder="3" min="0" step="0.5" />
              </Field>
            </div>
            <div className="col-span-5 sm:col-span-3">
              <Field label="Grade">
                <Select value={c.grade} onChange={(v) => update(c.id, { grade: v })} options={GPA_GRADES.map((g) => ({ value: g, label: g }))} />
              </Field>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Btn variant="ghost" onClick={() => remove(c.id)} className="w-full !px-2" aria-label={`Remove ${c.name}`}>✕</Btn>
            </div>
          </div>
        ))}
      </div>
      <Btn variant="secondary" onClick={add} className="mt-3">+ Add course</Btn>
      <div className="mt-4">
        {calc === null ? (
          <Notice tone="warn">Credit hours must be positive numbers for every course.</Notice>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Stat label="GPA" value={calc.gpa.toFixed(2)} accent />
              <Stat label="Total credit hours" value={String(calc.credits)} />
              <Stat label="Quality points" value={num2(calc.points)} />
            </div>
            <p className="mt-3 text-sm text-sage">{calc.standing}</p>
            <p className="mt-1 text-xs text-sage/60">4.0 scale: A+/A = 4.0, A− = 3.67, B+ = 3.33, B = 3.0 … F = 0.0</p>
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------------- 6. Grade calculator ---------------- */
interface GradeCat { id: number; name: string; weight: string; score: string; }

const letterOf = (pct: number): string =>
  pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 70 ? "C" : pct >= 60 ? "D" : "F";

export function GradeCalcTool() {
  const [cats, setCats] = useState<GradeCat[]>([
    { id: 1, name: "Assignments", weight: "30", score: "85" },
    { id: 2, name: "Midterm", weight: "30", score: "78" },
    { id: 3, name: "Final exam", weight: "40", score: "90" },
  ]);
  const nextId = useRef(4);

  const update = (id: number, patch: Partial<GradeCat>) =>
    setCats((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id: number) => setCats((cs) => (cs.length > 1 ? cs.filter((c) => c.id !== id) : cs));
  const add = () => {
    const id = nextId.current++;
    setCats((cs) => [...cs, { id, name: `Category ${id}`, weight: "10", score: "80" }]);
  };

  const calc = useMemo(() => {
    let weighted = 0;
    let totalW = 0;
    for (const c of cats) {
      const w = parseFloat(c.weight);
      const s = parseFloat(c.score);
      if (!Number.isFinite(w) || !Number.isFinite(s) || w < 0 || s < 0 || s > 100) return null;
      weighted += (w / 100) * s;
      totalW += w;
    }
    return { final: weighted, totalW, letter: letterOf(weighted) };
  }, [cats]);

  return (
    <Card>
      <div className="space-y-3">
        {cats.map((c) => (
          <div key={c.id} className="grid grid-cols-12 items-end gap-2 rounded-xl border border-gold/15 bg-ink-2/50 p-3">
            <div className="col-span-12 sm:col-span-5">
              <Field label="Category">
                <TextInput value={c.name} onChange={(e) => update(c.id, { name: e.target.value })} placeholder="e.g. Assignments" />
              </Field>
            </div>
            <div className="col-span-5 sm:col-span-3">
              <Field label="Weight %">
                <NumInput value={c.weight} onChange={(v) => update(c.id, { weight: v })} placeholder="0" min="0" max="100" />
              </Field>
            </div>
            <div className="col-span-5 sm:col-span-3">
              <Field label="Score %">
                <NumInput value={c.score} onChange={(v) => update(c.id, { score: v })} placeholder="0" min="0" max="100" />
              </Field>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Btn variant="ghost" onClick={() => remove(c.id)} className="w-full !px-2" aria-label={`Remove ${c.name}`}>✕</Btn>
            </div>
          </div>
        ))}
      </div>
      <Btn variant="secondary" onClick={add} className="mt-3">+ Add category</Btn>
      <div className="mt-4">
        {calc === null ? (
          <Notice tone="warn">Weights must be 0–100 and scores must be 0–100 for every category.</Notice>
        ) : (
          <>
            {Math.abs(calc.totalW - 100) > 0.001 && (
              <Notice tone="warn" >
                <span className="mb-3 block">Weights add up to {num2(calc.totalW)}% — they should total 100% for an accurate grade.</span>
              </Notice>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Stat label="Final score" value={`${calc.final.toFixed(1)} %`} accent />
              <Stat label="Letter grade" value={calc.letter} />
              <Stat label="Total weight" value={`${num2(calc.totalW)} %`} />
            </div>
            <p className="mt-3 text-xs text-sage/60">Letter scale: A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, F &lt; 60</p>
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------------- 7. BMR / TDEE ---------------- */
const ACTIVITY_LEVELS = [
  { value: "1.2", label: "Sedentary — little or no exercise" },
  { value: "1.375", label: "Light — 1–3 days of exercise/week" },
  { value: "1.55", label: "Moderate — 3–5 days of exercise/week" },
  { value: "1.725", label: "Active — 6–7 days of exercise/week" },
  { value: "1.9", label: "Very active — physical job or heavy training" },
];

export function BmrTdeeTool() {
  const [sex, setSex] = useState("Male");
  const [weight, setWeight] = useState("70");
  const [height, setHeight] = useState("175");
  const [age, setAge] = useState("25");
  const [activity, setActivity] = useState("1.55");

  const calc = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);
    const mult = parseFloat(activity);
    if (![w, h, a, mult].every((v) => Number.isFinite(v)) || w <= 0 || h <= 0 || a <= 0) return null;
    const bmr = 10 * w + 6.25 * h - 5 * a + (sex === "Male" ? 5 : -161);
    const tdee = bmr * mult;
    return { bmr, tdee, lose: tdee - 500, maintain: tdee, gain: tdee + 300 };
  }, [sex, weight, height, age, activity]);

  const kcal = (v: number) => `${Math.round(v).toLocaleString("en-US")} kcal`;

  return (
    <Card>
      <Tabs tabs={["Male", "Female"]} active={sex} onChange={setSex} />
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Weight (kg)">
          <NumInput value={weight} onChange={setWeight} placeholder="0" min="0" step="any" />
        </Field>
        <Field label="Height (cm)">
          <NumInput value={height} onChange={setHeight} placeholder="0" min="0" step="any" />
        </Field>
        <Field label="Age (years)">
          <NumInput value={age} onChange={setAge} placeholder="0" min="0" step="1" />
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Activity level">
          <Select value={activity} onChange={setActivity} options={ACTIVITY_LEVELS} />
        </Field>
      </div>
      <div className="mt-4">
        {calc === null ? (
          <Notice tone="warn">Enter positive numbers for weight, height and age.</Notice>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="BMR" value={kcal(calc.bmr)} accent />
              <Stat label="TDEE" value={kcal(calc.tdee)} accent />
              <Stat label="Lose weight" value={kcal(calc.lose)} />
              <Stat label="Gain weight" value={kcal(calc.gain)} />
            </div>
            <p className="mt-3 text-xs text-sage/70">
              Uses the Mifflin–St Jeor equation. Targets are rough guides (≈500 kcal deficit/surplus per day) — not medical advice.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------------- 8. Sleep cycle ---------------- */
const SLEEP_TABS = ["Wake at a time", "Sleep now"];

export function SleepCycleTool() {
  const [mode, setMode] = useState(SLEEP_TABS[0]);
  const [wakeAt, setWakeAt] = useState("07:00");
  const [wakeTimes, setWakeTimes] = useState<string[] | null>(null);

  const bedtimes = useMemo(() => {
    if (mode !== SLEEP_TABS[0]) return null;
    const m = wakeAt.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h > 23 || min > 59) return null;
    const wake = h * 60 + min;
    return [6, 5, 4].map((cycles) => ({
      cycles,
      hours: (cycles * 90) / 60,
      at: fmtClock(wake - (cycles * 90 + 15)),
    }));
  }, [mode, wakeAt]);

  const sleepNow = () => {
    const now = new Date();
    const fallAsleep = now.getHours() * 60 + now.getMinutes() + 15;
    setWakeTimes([5, 4, 3].map((cycles) => fmtClock(fallAsleep + cycles * 90)));
  };

  return (
    <Card>
      <Tabs tabs={SLEEP_TABS} active={mode} onChange={setMode} />
      <p className="mt-3 text-sm text-sage">
        Sleep runs in ~90-minute cycles. Waking at the end of a cycle feels easier than waking mid-cycle — plus ~15 minutes to fall asleep.
      </p>
      {mode === SLEEP_TABS[0] ? (
        <div className="mt-4">
          <Field label="I want to wake up at">
            <TextInput type="time" value={wakeAt} onChange={(e) => setWakeAt(e.target.value)} />
          </Field>
          <div className="mt-4">
            {bedtimes === null ? (
              <Notice tone="warn">Enter a valid wake-up time.</Notice>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {bedtimes.map((b) => (
                  <Stat key={b.cycles} label={`${b.cycles} cycles · ${b.hours}h sleep`} value={b.at} accent={b.cycles === 5} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <Btn onClick={sleepNow}>Calculate wake-up times</Btn>
          <div className="mt-4">
            {wakeTimes === null ? (
              <Notice>Press the button to get wake-up times based on the current time.</Notice>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[{ cycles: 5 }, { cycles: 4 }, { cycles: 3 }].map((c, i) => (
                  <Stat key={c.cycles} label={`${c.cycles} cycles · ${(c.cycles * 90) / 60}h sleep`} value={wakeTimes[i]} accent={c.cycles === 5} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ---------------- 9. Water intake ---------------- */
const WATER_LEVELS = [
  { value: "30", label: "Sedentary — desk work, little exercise" },
  { value: "35", label: "Moderately active — regular exercise" },
  { value: "40", label: "Very active — daily intense exercise" },
  { value: "45", label: "Athlete — heavy training / hot climate" },
];

export function WaterIntakeTool() {
  const [weight, setWeight] = useState("70");
  const [level, setLevel] = useState("35");

  const calc = useMemo(() => {
    const w = parseFloat(weight);
    const f = parseFloat(level);
    if (!Number.isFinite(w) || !Number.isFinite(f) || w <= 0) return null;
    const ml = w * f;
    return { ml, litres: ml / 1000, glasses: ml / 250 };
  }, [weight, level]);

  return (
    <Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Body weight (kg)">
          <NumInput value={weight} onChange={setWeight} placeholder="0" min="0" step="any" />
        </Field>
        <Field label="Activity level">
          <Select value={level} onChange={setLevel} options={WATER_LEVELS} />
        </Field>
      </div>
      <div className="mt-4">
        {calc === null ? (
          <Notice tone="warn">Enter a valid body weight.</Notice>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Stat label="Daily target" value={`${Math.round(calc.ml).toLocaleString("en-US")} ml`} accent />
              <Stat label="In litres" value={`${num2(calc.litres)} L`} />
              <Stat label="Glasses (250 ml)" value={num2(calc.glasses)} />
            </div>
            <p className="mt-3 text-xs text-sage/70">General guide based on body weight and activity — food, climate and health conditions change your needs.</p>
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------------- 10. Pace calculator ---------------- */
const PACE_MODES = ["Find pace", "Find time", "Find distance"];

function fmtPace(mins: number): string {
  let m = Math.floor(mins);
  let s = Math.round((mins - m) * 60);
  if (s === 60) { m += 1; s = 0; }
  return `${m}:${pad2(s)} /km`;
}

export function PaceCalcTool() {
  const [mode, setMode] = useState(PACE_MODES[0]);
  const [dist, setDist] = useState("5");
  const [th, setTh] = useState("0");
  const [tm, setTm] = useState("25");
  const [ts, setTs] = useState("0");
  const [pm, setPm] = useState("5");
  const [ps, setPs] = useState("0");

  const calc = useMemo(() => {
    const d = parseFloat(dist);
    const timeMin = parseFloat(th) * 60 + parseFloat(tm) + parseFloat(ts) / 60;
    const paceMin = parseFloat(pm) + parseFloat(ps) / 60;
    const nums = [d, timeMin, paceMin];
    if (nums.some((v) => !Number.isFinite(v) || v < 0)) return null;
    if (mode === PACE_MODES[0]) {
      if (d <= 0 || timeMin <= 0) return null;
      const p = timeMin / d;
      return { kind: "pace", pace: fmtPace(p), kmh: d / (timeMin / 60) } as const;
    }
    if (mode === PACE_MODES[1]) {
      if (d <= 0 || paceMin <= 0) return null;
      const tMin = paceMin * d;
      return { kind: "time", time: fmtHMS(tMin * 60), kmh: 60 / paceMin } as const;
    }
    if (timeMin <= 0 || paceMin <= 0) return null;
    const dd = timeMin / paceMin;
    return { kind: "distance", distance: `${num2(dd)} km`, kmh: 60 / paceMin } as const;
  }, [mode, dist, th, tm, ts, pm, ps]);

  const timeInputs = (
    <div className="grid grid-cols-3 gap-2">
      <Field label="Hours"><NumInput value={th} onChange={setTh} min="0" step="1" /></Field>
      <Field label="Minutes"><NumInput value={tm} onChange={setTm} min="0" max="59" step="1" /></Field>
      <Field label="Seconds"><NumInput value={ts} onChange={setTs} min="0" max="59" step="1" /></Field>
    </div>
  );
  const paceInputs = (
    <div className="grid grid-cols-2 gap-2">
      <Field label="Pace min"><NumInput value={pm} onChange={setPm} min="0" step="1" /></Field>
      <Field label="Pace sec"><NumInput value={ps} onChange={setPs} min="0" max="59" step="1" /></Field>
    </div>
  );

  return (
    <Card>
      <Tabs tabs={PACE_MODES} active={mode} onChange={setMode} />
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {mode !== PACE_MODES[2] && (
          <Field label="Distance (km)">
            <NumInput value={dist} onChange={setDist} placeholder="0" min="0" step="any" />
          </Field>
        )}
        {mode === PACE_MODES[0] && <div>{timeInputs}</div>}
        {mode === PACE_MODES[1] && <div>{paceInputs}</div>}
        {mode === PACE_MODES[2] && (
          <>
            <div>{timeInputs}</div>
            <div>{paceInputs}</div>
          </>
        )}
      </div>
      <div className="mt-4">
        {calc === null ? (
          <Notice tone="warn">Enter valid positive numbers for the two known values.</Notice>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Stat
              label={calc.kind === "pace" ? "Pace" : calc.kind === "time" ? "Time" : "Distance"}
              value={calc.kind === "pace" ? calc.pace : calc.kind === "time" ? calc.time : calc.distance}
              accent
            />
            <Stat label="Speed" value={`${num2(calc.kmh)} km/h`} />
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------------- 11. One-rep max ---------------- */
export function OneRepMaxTool() {
  const [weight, setWeight] = useState("60");
  const [reps, setReps] = useState("8");

  const calc = useMemo(() => {
    const w = parseFloat(weight);
    const r = Math.floor(parseFloat(reps));
    if (!Number.isFinite(w) || !Number.isFinite(r) || w <= 0 || r < 1) return null;
    const epley = w * (1 + r / 30);
    const brzycki = r >= 37 ? null : (w * 36) / (37 - r);
    return { epley, brzycki, r };
  }, [weight, reps]);

  const percents = [95, 90, 85, 80, 75, 70, 65, 60, 55];

  return (
    <Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Weight lifted (kg)">
          <NumInput value={weight} onChange={setWeight} placeholder="0" min="0" step="any" />
        </Field>
        <Field label="Repetitions" hint="Use a set of 1–10 reps for best accuracy">
          <NumInput value={reps} onChange={setReps} placeholder="0" min="1" step="1" />
        </Field>
      </div>
      <div className="mt-4">
        {calc === null ? (
          <Notice tone="warn">Enter a positive weight and at least 1 rep.</Notice>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Stat label="Epley 1RM" value={`${num2(calc.epley)} kg`} accent />
              <Stat
                label="Brzycki 1RM"
                value={calc.brzycki === null ? "—" : `${num2(calc.brzycki)} kg`}
              />
            </div>
            {calc.brzycki === null && (
              <p className="mt-2 text-xs text-sage/70">Brzycki needs fewer than 37 reps.</p>
            )}
            <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-widest text-sage">Training loads (% of Epley 1RM)</p>
            <div className="overflow-x-auto rounded-xl border border-gold/25">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="bg-gold/10">
                    {percents.map((p) => (
                      <th key={p} className="px-2 py-2 font-display text-xs font-bold text-gold-light">{p}%</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-center">
                    {percents.map((p) => (
                      <td key={p} className="border-t border-gold/15 px-2 py-2 font-semibold text-cream">
                        {num2((calc.epley * p) / 100)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-sage/70">Estimates for programming training — test your true 1RM only with proper safety measures.</p>
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------------- 12. Time duration add/subtract ---------------- */
function parseDuration(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const parts = t.split(":");
  if (parts.length > 3) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return null;
  if (parts.length === 1) return (nums[0] as number) * 60;
  if (parts.length === 2) return (nums[0] as number) * 3600 + (nums[1] as number) * 60;
  return (nums[0] as number) * 3600 + (nums[1] as number) * 60 + (nums[2] as number);
}

const DUR_OPS = ["Add", "Subtract"];

export function TimeDurationTool() {
  const [d1, setD1] = useState("01:30:00");
  const [d2, setD2] = useState("00:45:30");
  const [op, setOp] = useState(DUR_OPS[0]);

  const calc = useMemo(() => {
    const a = parseDuration(d1);
    const b = parseDuration(d2);
    if (a === null || b === null) return null;
    return op === DUR_OPS[0] ? a + b : a - b;
  }, [d1, d2, op]);

  return (
    <Card>
      <Tabs tabs={DUR_OPS} active={op} onChange={setOp} />
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Duration 1" hint="HH:MM:SS or HH:MM">
          <TextInput value={d1} onChange={(e) => setD1(e.target.value)} placeholder="01:30:00" className="font-mono" />
        </Field>
        <Field label="Duration 2" hint="HH:MM:SS or HH:MM">
          <TextInput value={d2} onChange={(e) => setD2(e.target.value)} placeholder="00:45:30" className="font-mono" />
        </Field>
      </div>
      <div className="mt-4">
        {calc === null ? (
          <Notice tone="warn">Use the format HH:MM:SS (or HH:MM) with non-negative numbers.</Notice>
        ) : (
          <>
            <Stat label="Result" value={fmtHMS(calc)} accent />
            <p className="mt-2 text-sm text-sage">
              That&apos;s <span className="font-bold text-cream">{num2(calc / 3600)} hours</span>
              {" "}or <span className="font-bold text-cream">{num2(calc / 60)} minutes</span>.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------------- 13. Speed / distance / time ---------------- */
const SDT_MODES = ["Find speed", "Find distance", "Find time"];

export function SpeedDistTimeTool() {
  const [mode, setMode] = useState(SDT_MODES[0]);
  const [dist, setDist] = useState("120");
  const [speed, setSpeed] = useState("60");
  const [th, setTh] = useState("2");
  const [tm, setTm] = useState("0");
  const [ts, setTs] = useState("0");

  const calc = useMemo(() => {
    const d = parseFloat(dist);
    const s = parseFloat(speed);
    const timeH = parseFloat(th) + parseFloat(tm) / 60 + parseFloat(ts) / 3600;
    if ([d, s, timeH].some((v) => !Number.isFinite(v) || v < 0)) return null;
    if (mode === SDT_MODES[0]) {
      if (timeH <= 0) return null;
      return { kind: "speed", text: `${num2(d / timeH)} km/h` } as const;
    }
    if (mode === SDT_MODES[1]) {
      return { kind: "distance", text: `${num2(s * timeH)} km` } as const;
    }
    if (s <= 0) return null;
    return { kind: "time", text: fmtHMS((d / s) * 3600) } as const;
  }, [mode, dist, speed, th, tm, ts]);

  const timeInputs = (
    <div className="grid grid-cols-3 gap-2">
      <Field label="Hours"><NumInput value={th} onChange={setTh} min="0" step="1" /></Field>
      <Field label="Minutes"><NumInput value={tm} onChange={setTm} min="0" max="59" step="1" /></Field>
      <Field label="Seconds"><NumInput value={ts} onChange={setTs} min="0" max="59" step="1" /></Field>
    </div>
  );

  return (
    <Card>
      <Tabs tabs={SDT_MODES} active={mode} onChange={setMode} />
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {mode !== SDT_MODES[1] && (
          <Field label="Distance (km)">
            <NumInput value={dist} onChange={setDist} placeholder="0" min="0" step="any" />
          </Field>
        )}
        {mode !== SDT_MODES[0] && (
          <Field label="Speed (km/h)">
            <NumInput value={speed} onChange={setSpeed} placeholder="0" min="0" step="any" />
          </Field>
        )}
        {mode !== SDT_MODES[2] && <div>{timeInputs}</div>}
        {mode === SDT_MODES[2] && <div>{timeInputs}</div>}
      </div>
      <div className="mt-4">
        {calc === null ? (
          <Notice tone="warn">Enter valid numbers — time and speed must be greater than zero.</Notice>
        ) : (
          <Stat label={mode === SDT_MODES[0] ? "Speed" : mode === SDT_MODES[1] ? "Distance" : "Time"} value={calc.text} accent />
        )}
      </div>
    </Card>
  );
}

/* ---------------- 14. Retirement calculator ---------------- */
export function RetirementCalcTool() {
  const [current, setCurrent] = useState("500000");
  const [monthly, setMonthly] = useState("20000");
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(10);

  const calc = useMemo(() => {
    const c = parseFloat(current);
    const m = parseFloat(monthly);
    if (!Number.isFinite(c) || !Number.isFinite(m) || c < 0 || m < 0) return null;
    if (years < 1) return null;
    const i = rate / 1200;
    const n = years * 12;
    const grow = Math.pow(1 + i, n);
    const fvCurrent = c * grow;
    const fvMonthly = i === 0 ? m * n : m * ((grow - 1) / i) * (1 + i);
    const corpus = fvCurrent + fvMonthly;
    const contributed = c + m * n;
    return { corpus, contributed, growth: corpus - contributed };
  }, [current, monthly, years, rate]);

  return (
    <Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Current savings (Rs)">
          <NumInput value={current} onChange={setCurrent} placeholder="0" min="0" />
        </Field>
        <Field label="Monthly contribution (Rs)">
          <NumInput value={monthly} onChange={setMonthly} placeholder="0" min="0" />
        </Field>
      </div>
      <div className="mt-4 space-y-4">
        <Field label="Years until retirement">
          <Slider value={years} min={1} max={40} step={1} onChange={setYears} format={(v) => `${v} yrs`} />
        </Field>
        <Field label="Expected annual return">
          <Slider value={rate} min={0} max={15} step={0.5} onChange={setRate} format={(v) => `${v} %`} />
        </Field>
      </div>
      <div className="mt-4">
        {calc === null ? (
          <Notice tone="warn">Enter valid savings and contribution amounts (0 or more).</Notice>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Stat label="Projected retirement corpus" value={pkr(calc.corpus)} accent />
              <Stat label="Total contributed" value={pkr(calc.contributed)} />
              <Stat label="Growth" value={pkr(calc.growth)} />
            </div>
            <p className="mt-3 text-xs text-sage/70">Simple projection — ignores inflation, taxes and fees. Real purchasing power will be lower.</p>
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------------- 15. Loan compare ---------------- */
interface LoanInput { amount: string; rate: string; years: string; }

function loanMath(p: number, annual: number, yrs: number) {
  const r = annual / 1200;
  const n = yrs * 12;
  const emi = r === 0 ? p / n : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return { emi, total: emi * n, interest: emi * n - p };
}

const loanField = (label: string, value: string, onChange: (v: string) => void, step = "any") => (
  <Field label={label}>
    <NumInput value={value} onChange={onChange} placeholder="0" min="0" step={step} />
  </Field>
);

export function LoanCompareTool() {
  const [a, setA] = useState<LoanInput>({ amount: "1000000", rate: "18", years: "5" });
  const [b, setB] = useState<LoanInput>({ amount: "1000000", rate: "21", years: "3" });

  const calc = useMemo(() => {
    const pa = parseFloat(a.amount), ra = parseFloat(a.rate), ya = parseFloat(a.years);
    const pb = parseFloat(b.amount), rb = parseFloat(b.rate), yb = parseFloat(b.years);
    const vals = [pa, ra, ya, pb, rb, yb];
    if (vals.some((v) => !Number.isFinite(v) || v < 0)) return null;
    if (ya <= 0 || yb <= 0 || pa <= 0 || pb <= 0) return null;
    const la = loanMath(pa, ra, ya);
    const lb = loanMath(pb, rb, yb);
    const cheaper: "A" | "B" | "tie" = la.interest < lb.interest ? "A" : lb.interest < la.interest ? "B" : "tie";
    return { la, lb, cheaper, diff: Math.abs(la.interest - lb.interest) };
  }, [a, b]);

  const loanCard = (title: string, v: LoanInput, set: (x: LoanInput) => void, highlight: boolean) => (
    <div className={`rounded-xl border p-4 ${highlight ? "border-gold/60 bg-gold/10" : "border-gold/20 bg-ink-2/60"}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-cream">{title}</h3>
        {highlight && <span className="rounded-full bg-gold px-3 py-0.5 text-xs font-bold text-ink">CHEAPER</span>}
      </div>
      <div className="space-y-3">
        {loanField("Loan amount (Rs)", v.amount, (x) => set({ ...v, amount: x }))}
        {loanField("Annual interest rate %", v.rate, (x) => set({ ...v, rate: x }))}
        {loanField("Tenure (years)", v.years, (x) => set({ ...v, years: x }), "1")}
      </div>
    </div>
  );

  return (
    <Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {loanCard("Loan A", a, setA, calc !== null && calc.cheaper === "A")}
        {loanCard("Loan B", b, setB, calc !== null && calc.cheaper === "B")}
      </div>
      <div className="mt-4">
        {calc === null ? (
          <Notice tone="warn">Enter valid amounts, rates and tenures (amounts and tenures must be positive).</Notice>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="A · Monthly EMI" value={pkr(calc.la.emi)} accent={calc.cheaper === "A"} />
              <Stat label="A · Total interest" value={pkr(calc.la.interest)} accent={calc.cheaper === "A"} />
              <Stat label="B · Monthly EMI" value={pkr(calc.lb.emi)} accent={calc.cheaper === "B"} />
              <Stat label="B · Total interest" value={pkr(calc.lb.interest)} accent={calc.cheaper === "B"} />
            </div>
            <div className="mt-3">
              {calc.cheaper === "tie" ? (
                <Notice>Both loans cost the same in total interest.</Notice>
              ) : (
                <Notice>
                  <span className="font-bold text-gold-light">Loan {calc.cheaper} is cheaper</span> — it costs {pkr(calc.diff)} less in total interest.
                </Notice>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------------- 16. Safe math expression evaluator ---------------- */
type Tok =
  | { k: "num"; v: number }
  | { k: "op"; v: string }
  | { k: "id"; v: string }
  | { k: "lp" }
  | { k: "rp" }
  | { k: "comma" };

function tokenize(src: string): { toks: Tok[] } | { err: string } {
  const toks: Tok[] = [];
  let i = 0;
  const isDigit = (c: string) => c >= "0" && c <= "9";
  const isAlpha = (c: string) => (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
  while (i < src.length) {
    const c = src[i];
    if (c === " " || c === "\t") { i++; continue; }
    if (isDigit(c) || (c === "." && isDigit(src[i + 1] ?? ""))) {
      let j = i;
      while (j < src.length && (isDigit(src[j]) || src[j] === ".")) j++;
      const v = parseFloat(src.slice(i, j));
      if (!Number.isFinite(v)) return { err: `Bad number near "${src.slice(i, j)}"` };
      toks.push({ k: "num", v });
      i = j;
      continue;
    }
    if (isAlpha(c)) {
      let j = i;
      while (j < src.length && (isAlpha(src[j]) || isDigit(src[j]))) j++;
      toks.push({ k: "id", v: src.slice(i, j).toLowerCase() });
      i = j;
      continue;
    }
    if (c === "+" || c === "-" || c === "*" || c === "/" || c === "%" || c === "^") {
      toks.push({ k: "op", v: c });
      i++;
      continue;
    }
    if (c === "(") { toks.push({ k: "lp" }); i++; continue; }
    if (c === ")") { toks.push({ k: "rp" }); i++; continue; }
    if (c === ",") { toks.push({ k: "comma" }); i++; continue; }
    return { err: `Invalid character "${c}" — only digits, + - * / % ^ ( ) , and functions allowed` };
  }
  return { toks };
}

const MATH_FUNCS: Record<string, (a: number, b?: number) => number> = {
  sqrt: (a) => {
    if (a < 0) throw new Error("sqrt() of a negative number");
    return Math.sqrt(a);
  },
  pow: (a, b = 2) => Math.pow(a, b),
  abs: (a) => Math.abs(a),
  floor: (a) => Math.floor(a),
  ceil: (a) => Math.ceil(a),
  round: (a) => Math.round(a),
  sin: (a) => Math.sin(a),
  cos: (a) => Math.cos(a),
  tan: (a) => Math.tan(a),
};

const MATH_CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E };

/** Parses and evaluates a math expression with a hand-written recursive-descent parser. No eval/Function. */
function evaluateExpr(src: string): { value: number } | { err: string } {
  const r = tokenize(src);
  if ("err" in r) return r;
  const toks = r.toks;
  if (toks.length === 0) return { err: "Type an expression to evaluate." };
  let pos = 0;
  const peek = (): Tok | undefined => toks[pos];

  function expr(): number {
    let v = term();
    for (;;) {
      const t = peek();
      if (t && t.k === "op" && (t.v === "+" || t.v === "-")) {
        pos++;
        const rhs = term();
        v = t.v === "+" ? v + rhs : v - rhs;
      } else return v;
    }
  }
  function term(): number {
    let v = factor();
    for (;;) {
      const t = peek();
      if (t && t.k === "op" && (t.v === "*" || t.v === "/" || t.v === "%")) {
        pos++;
        const rhs = factor();
        if (t.v === "*") v = v * rhs;
        else if (t.v === "/") {
          if (rhs === 0) throw new Error("Division by zero");
          v = v / rhs;
        } else v = v % rhs;
      } else return v;
    }
  }
  function factor(): number {
    const v = unary();
    const t = peek();
    if (t && t.k === "op" && t.v === "^") {
      pos++;
      return Math.pow(v, factor());
    }
    return v;
  }
  function unary(): number {
    const t = peek();
    if (t && t.k === "op" && (t.v === "-" || t.v === "+")) {
      pos++;
      const v = unary();
      return t.v === "-" ? -v : v;
    }
    return primary();
  }
  function primary(): number {
    const t = peek();
    if (!t) throw new Error("Unexpected end of expression");
    if (t.k === "num") { pos++; return t.v; }
    if (t.k === "lp") {
      pos++;
      const v = expr();
      const c = peek();
      if (!c || c.k !== "rp") throw new Error("Missing closing parenthesis");
      pos++;
      return v;
    }
    if (t.k === "id") {
      pos++;
      if (t.v in MATH_CONSTS) return MATH_CONSTS[t.v] as number;
      const f = MATH_FUNCS[t.v];
      if (!f) throw new Error(`Unknown function "${t.v}" — try sqrt, pow, abs, floor, ceil, round, sin, cos or tan`);
      const open = peek();
      if (!open || open.k !== "lp") throw new Error(`"${t.v}" must be followed by parentheses`);
      pos++;
      const a = expr();
      let b: number | undefined;
      const n = peek();
      if (n && n.k === "comma") { pos++; b = expr(); }
      const close = peek();
      if (!close || close.k !== "rp") throw new Error("Missing closing parenthesis");
      pos++;
      return f(a, b);
    }
    throw new Error(t.k === "op" ? `Unexpected "${t.v}"` : "Unexpected token");
  }

  try {
    const v = expr();
    if (pos < toks.length) throw new Error("Extra characters after the expression");
    if (!Number.isFinite(v)) throw new Error("Result is not a finite number");
    return { value: v };
  } catch (e) {
    return { err: e instanceof Error ? e.message : "Could not evaluate this expression" };
  }
}

export function MathEvaluatorTool() {
  const [expr, setExpr] = useState("(12 + 8) * 3 / 4");

  const result = useMemo(() => evaluateExpr(expr), [expr]);

  const insert = (snippet: string) => setExpr((e) => e + snippet);

  return (
    <Card>
      <Field label="Expression" hint="Supports + − × ÷ % ^, parentheses, sqrt(), pow(a,b), abs(), floor(), ceil(), round(), sin(), cos(), tan(), and constants pi, e">
        <TextInput value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="(12 + 8) * 3 / 4" className="font-mono text-lg" />
      </Field>
      <div className="mt-3 flex flex-wrap gap-2">
        {["sqrt(", "pow(", "abs(", "pi", "^", "%"].map((s) => (
          <button key={s} onClick={() => insert(s)}
            className="rounded-lg border border-gold/25 bg-ink-2/60 px-3 py-1 font-mono text-sm text-gold-light transition hover:border-gold/60 hover:bg-gold/10">
            {s}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {"err" in result ? (
          <Notice tone="warn">{result.err}</Notice>
        ) : (
          <div className="flex items-end justify-between gap-3">
            <Stat label="Result" value={fmtSmart(result.value)} accent />
            <CopyBtn text={String(result.value)} />
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-sage/60">Runs entirely in your browser with a purpose-built parser — your input is never executed as code.</p>
    </Card>
  );
}
