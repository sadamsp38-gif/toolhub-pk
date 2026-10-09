"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Field, Notice, NumInput, Slider, Stat, Tabs, TextInput } from "../ui";

const pkr = (n: number) => "Rs " + Number(n).toLocaleString("en-PK", { maximumFractionDigits: 0 });

const num2 = (v: number) => (Math.round(v * 100) / 100).toLocaleString("en-US", { maximumFractionDigits: 2 });

const shortRs = (v: number) => {
  const t = (x: number) => x.toFixed(1).replace(/\.0$/, "");
  if (v >= 10_000_000) return `Rs ${t(v / 10_000_000)}Cr`;
  if (v >= 100_000) return `Rs ${t(v / 100_000)}L`;
  if (v >= 1000) return `Rs ${t(v / 1000)}K`;
  return `Rs ${v}`;
};

/* ---------------- Age calculator ---------------- */
export function AgeCalcTool() {
  const [dob, setDob] = useState("");
  // "today" is read client-side only (Next.js forbids new Date() during prerender)
  const [todayStr, setTodayStr] = useState("2026-10-09");
  useEffect(() => {
    setTodayStr(new Date().toISOString().slice(0, 10));
  }, []);

  const calc = useMemo(() => {
    if (!dob) return null;
    const b = new Date(dob + "T00:00:00");
    if (isNaN(b.getTime())) return null;
    const t = new Date(todayStr + "T00:00:00");
    t.setHours(0, 0, 0, 0);
    if (b.getTime() > t.getTime()) return "future" as const;

    let years = t.getFullYear() - b.getFullYear();
    let months = t.getMonth() - b.getMonth();
    let days = t.getDate() - b.getDate();
    if (days < 0) {
      months -= 1;
      days += new Date(t.getFullYear(), t.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    const totalDays = Math.floor((t.getTime() - b.getTime()) / 86400000);
    return {
      years,
      months,
      days,
      totalDays,
      totalWeeks: Math.floor(totalDays / 7),
      totalMonths: years * 12 + months,
      weekday: b.toLocaleDateString("en-US", { weekday: "long" }),
    };
  }, [dob, todayStr]);

  return (
    <Card>
      <Field label="Date of birth">
        <TextInput type="date" value={dob} max={todayStr} onChange={(e) => setDob(e.target.value)} />
      </Field>
      <div className="mt-4">
        {calc === null && <Notice>Pick your date of birth to see your exact age.</Notice>}
        {calc === "future" && <Notice tone="warn">Date of birth can&apos;t be in the future.</Notice>}
        {calc !== null && calc !== "future" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Years" value={String(calc.years)} accent />
            <Stat label="Months" value={String(calc.months)} />
            <Stat label="Days" value={String(calc.days)} />
            <Stat label="Total days" value={calc.totalDays.toLocaleString("en-PK")} />
            <Stat label="Total weeks" value={calc.totalWeeks.toLocaleString("en-PK")} />
            <Stat label="Total months" value={calc.totalMonths.toLocaleString("en-PK")} />
            <Stat label="Born on" value={calc.weekday} />
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------------- Percentage calculator ---------------- */
const PCT_MODES = ["X% of Y", "X is what % of Y", "% Change"] as const;

export function PercentCalcTool() {
  const [mode, setMode] = useState<string>(PCT_MODES[0]);
  const [a, setA] = useState("20");
  const [b, setB] = useState("150");

  const labels: Record<string, [string, string]> = {
    "X% of Y": ["Percentage (X)", "Value (Y)"],
    "X is what % of Y": ["X", "Y"],
    "% Change": ["Old value", "New value"],
  };

  const result = useMemo(() => {
    const x = parseFloat(a);
    const y = parseFloat(b);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    if (mode === "X% of Y") return num2((x / 100) * y);
    if (mode === "X is what % of Y") return y === 0 ? "undefined" : num2((x / y) * 100) + " %";
    return x === 0 ? "undefined" : num2(((y - x) / x) * 100) + " %";
  }, [mode, a, b]);

  return (
    <Card>
      <Tabs tabs={[...PCT_MODES]} active={mode} onChange={setMode} />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label={labels[mode][0]}>
          <NumInput value={a} onChange={setA} placeholder="0" />
        </Field>
        <Field label={labels[mode][1]}>
          <NumInput value={b} onChange={setB} placeholder="0" />
        </Field>
      </div>
      <div className="mt-4">
        <Stat label="Result" value={result ?? "—"} accent />
      </div>
    </Card>
  );
}

/* ---------------- EMI calculator ---------------- */
export function EmiCalcTool() {
  const [amount, setAmount] = useState(2_000_000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(5);

  const { emi, totalInterest, totalPayment } = useMemo(() => {
    const r = rate / 1200;
    const n = years * 12;
    const pow = Math.pow(1 + r, n);
    const m = r === 0 ? amount / n : (amount * r * pow) / (pow - 1);
    const total = m * n;
    return { emi: m, totalPayment: total, totalInterest: total - amount };
  }, [amount, rate, years]);

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Loan amount">
          <Slider value={amount} min={50_000} max={10_000_000} step={50_000} onChange={setAmount} format={shortRs} />
        </Field>
        <Field label="Interest rate (% p.a.)">
          <Slider value={rate} min={1} max={30} step={0.5} onChange={setRate} format={(v) => `${v} %`} />
        </Field>
        <Field label="Tenure (years)">
          <Slider value={years} min={1} max={25} step={1} onChange={setYears} format={(v) => `${v} yrs`} />
        </Field>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Monthly EMI" value={pkr(emi)} accent />
        <Stat label="Total interest" value={pkr(totalInterest)} />
        <Stat label="Total payment" value={pkr(totalPayment)} />
      </div>
    </Card>
  );
}

/* ---------------- BMI calculator ---------------- */
type BmiCat = { label: string; cls: string };

const bmiCategory = (bmi: number): BmiCat => {
  if (bmi < 18.5) return { label: "Underweight", cls: "text-blue-700" };
  if (bmi < 25) return { label: "Normal", cls: "text-green-700" };
  if (bmi < 30) return { label: "Overweight", cls: "text-amber-700" };
  return { label: "Obese", cls: "text-red-700" };
};

export function BmiCalcTool() {
  const [height, setHeight] = useState("170");
  const [weight, setWeight] = useState("65");

  const bmi = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) return null;
    return w / Math.pow(h / 100, 2);
  }, [height, weight]);

  const cat = bmi === null ? null : bmiCategory(bmi);

  return (
    <Card>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Height (cm)">
          <NumInput value={height} onChange={setHeight} placeholder="170" min="0" />
        </Field>
        <Field label="Weight (kg)">
          <NumInput value={weight} onChange={setWeight} placeholder="65" min="0" />
        </Field>
      </div>
      <div className="mt-4 space-y-3">
        {bmi === null || cat === null ? (
          <Notice>Enter a valid height and weight to compute your BMI.</Notice>
        ) : (
          <>
            <Stat label="Your BMI" value={bmi.toFixed(1)} accent />
            <Notice tone={bmi < 25 ? "info" : "warn"}>
              Category: <span className={`font-bold ${cat.cls}`}>{cat.label}</span>
              <span className="text-sage"> — healthy range is 18.5–24.9</span>
            </Notice>
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------------- Discount calculator ---------------- */
export function DiscountCalcTool() {
  const [price, setPrice] = useState("1000");
  const [disc, setDisc] = useState("20");

  const calc = useMemo(() => {
    const p = parseFloat(price);
    const d = Math.min(100, Math.max(0, parseFloat(disc)));
    if (!Number.isFinite(p) || !Number.isFinite(d) || p < 0) return null;
    const save = (p * d) / 100;
    return { final: p - save, save, pct: d };
  }, [price, disc]);

  return (
    <Card>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Original price (Rs)">
          <NumInput value={price} onChange={setPrice} placeholder="0" min="0" />
        </Field>
        <Field label="Discount (%)">
          <NumInput value={disc} onChange={setDisc} placeholder="0" min="0" max="100" />
        </Field>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {calc === null ? (
          <div className="sm:col-span-3">
            <Notice tone="warn">Enter a valid price and discount.</Notice>
          </div>
        ) : (
          <>
            <Stat label="Final price" value={pkr(calc.final)} accent />
            <Stat label="You save" value={pkr(calc.save)} />
            <Stat label="Discount" value={`${num2(calc.pct)} %`} />
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------------- Pakistan income tax (FY2025-26, indicative) ---------------- */
const pakTax = (annual: number): number => {
  if (annual <= 600_000) return 0;
  if (annual <= 1_200_000) return (annual - 600_000) * 0.01;
  if (annual <= 2_200_000) return 6_000 + (annual - 1_200_000) * 0.11;
  if (annual <= 3_200_000) return 116_000 + (annual - 2_200_000) * 0.23;
  if (annual <= 4_100_000) return 346_000 + (annual - 3_200_000) * 0.3;
  return 616_000 + (annual - 4_100_000) * 0.35;
};

export function PakTaxCalcTool() {
  const [salary, setSalary] = useState("150000");

  const calc = useMemo(() => {
    const m = parseFloat(salary);
    if (!Number.isFinite(m) || m < 0) return null;
    const annual = m * 12;
    const tax = pakTax(annual);
    return { tax, monthlyDed: tax / 12, takeHome: m - tax / 12 };
  }, [salary]);

  return (
    <Card>
      <Field label="Monthly gross salary (Rs)" hint="Salaried individual, FY 2025–26 slabs">
        <NumInput value={salary} onChange={setSalary} placeholder="0" min="0" />
      </Field>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {calc === null ? (
          <div className="sm:col-span-3">
            <Notice tone="warn">Enter a valid monthly salary.</Notice>
          </div>
        ) : (
          <>
            <Stat label="Annual tax" value={pkr(calc.tax)} />
            <Stat label="Monthly deduction" value={pkr(calc.monthlyDed)} />
            <Stat label="Take-home / month" value={pkr(calc.takeHome)} accent />
          </>
        )}
      </div>
      <div className="mt-4">
        <Notice tone="warn">Indicative only — slabs change with each budget. Verify with FBR.</Notice>
      </div>
    </Card>
  );
}
