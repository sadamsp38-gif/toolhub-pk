"use client";

import { useEffect, useState } from "react";
import { Btn, Card, Field, Notice, NumInput, Select, Stat } from "../ui";

/* ============================== Unit Converter ============================== */

type UnitDef = { label: string; toBase: number };
type TempUnit = "C" | "F" | "K";

const CATEGORIES: Record<string, { label: string; base: string; units: Record<string, UnitDef> }> = {
  length: {
    label: "Length",
    base: "m",
    units: {
      km: { label: "Kilometers (km)", toBase: 1000 },
      m: { label: "Meters (m)", toBase: 1 },
      cm: { label: "Centimeters (cm)", toBase: 0.01 },
      mm: { label: "Millimeters (mm)", toBase: 0.001 },
      mi: { label: "Miles (mi)", toBase: 1609.344 },
      yd: { label: "Yards (yd)", toBase: 0.9144 },
      ft: { label: "Feet (ft)", toBase: 0.3048 },
      in: { label: "Inches (in)", toBase: 0.0254 },
    },
  },
  weight: {
    label: "Weight",
    base: "kg",
    units: {
      t: { label: "Tonnes (t)", toBase: 1000 },
      kg: { label: "Kilograms (kg)", toBase: 1 },
      g: { label: "Grams (g)", toBase: 0.001 },
      lb: { label: "Pounds (lb)", toBase: 0.45359237 },
      oz: { label: "Ounces (oz)", toBase: 0.028349523 },
    },
  },
  temperature: {
    label: "Temperature",
    base: "°C",
    units: {
      C: { label: "Celsius (°C)", toBase: 1 },
      F: { label: "Fahrenheit (°F)", toBase: 1 },
      K: { label: "Kelvin (K)", toBase: 1 },
    },
  },
  area: {
    label: "Area",
    base: "m²",
    units: {
      km2: { label: "Square kilometers (km²)", toBase: 1e6 },
      ha: { label: "Hectares (ha)", toBase: 10000 },
      acre: { label: "Acres", toBase: 4046.8564224 },
      m2: { label: "Square meters (m²)", toBase: 1 },
      yd2: { label: "Square yards (yd²)", toBase: 0.83612736 },
      ft2: { label: "Square feet (ft²)", toBase: 0.09290304 },
    },
  },
  speed: {
    label: "Speed",
    base: "m/s",
    units: {
      ms: { label: "Meters/sec (m/s)", toBase: 1 },
      kmh: { label: "Kilometers/hr (km/h)", toBase: 1 / 3.6 },
      mph: { label: "Miles/hr (mph)", toBase: 0.44704 },
      knot: { label: "Knots (kn)", toBase: 0.514444 },
    },
  },
};

function toCelsius(v: number, from: TempUnit): number {
  if (from === "C") return v;
  if (from === "F") return ((v - 32) * 5) / 9;
  return v - 273.15;
}

function fromCelsius(v: number, to: TempUnit): number {
  if (to === "C") return v;
  if (to === "F") return (v * 9) / 5 + 32;
  return v + 273.15;
}

export function UnitConverterTool() {
  const [category, setCategory] = useState("length");
  const [value, setValue] = useState("1");
  const [from, setFrom] = useState("km");
  const [to, setTo] = useState("m");

  const cat = CATEGORIES[category];
  const unitKeys = Object.keys(cat.units);

  const setCategoryAndReset = (c: string) => {
    setCategory(c);
    const keys = Object.keys(CATEGORIES[c].units);
    setFrom(keys[0]);
    setTo(keys.length > 1 ? keys[1] : keys[0]);
  };

  const num = parseFloat(value);
  let result: string | null = null;
  if (!isNaN(num) && cat.units[from] && cat.units[to]) {
    let r: number;
    if (category === "temperature") {
      r = fromCelsius(toCelsius(num, from as TempUnit), to as TempUnit);
    } else {
      r = (num * cat.units[from].toBase) / cat.units[to].toBase;
    }
    result = Number.isFinite(r) ? String(parseFloat(r.toPrecision(6))) : null;
  }

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const opts = unitKeys.map((k) => ({ value: k, label: cat.units[k].label }));

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Category">
          <Select
            value={category}
            onChange={setCategoryAndReset}
            options={Object.entries(CATEGORIES).map(([k, c]) => ({ value: k, label: c.label }))}
          />
        </Field>
        <Field label="Value">
          <NumInput value={value} onChange={setValue} placeholder="Enter a number" />
        </Field>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <Field label="From">
            <Select value={from} onChange={setFrom} options={opts} />
          </Field>
          <Btn variant="secondary" onClick={swap} className="!px-3" aria-label="Swap units">
            ⇄
          </Btn>
          <Field label="To">
            <Select value={to} onChange={setTo} options={opts} />
          </Field>
        </div>
        <Stat
          label="Result"
          accent
          value={result !== null ? `${result} ${cat.units[to].label.match(/\(([^)]+)\)/)?.[1] ?? to}` : "—"}
        />
      </div>
    </Card>
  );
}

/* ============================== Currency Converter ============================== */

const CURRENCIES = ["PKR", "USD", "EUR", "GBP", "AED", "SAR", "CNY", "INR", "JPY", "CAD", "AUD", "TRY", "QAR", "KWD"];

type RatesResponse = { rates: Record<string, number>; date: string };

export function CurrencyConverterTool() {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("PKR");
  const [to, setTo] = useState("USD");
  const [rates, setRates] = useState<RatesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`https://api.frankfurter.app/latest?from=${from}`)
      .then((res) => {
        if (!res.ok) throw new Error("rate fetch failed");
        return res.json() as Promise<RatesResponse>;
      })
      .then((json) => {
        if (!cancelled) {
          setRates(json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [from]);

  const amt = parseFloat(amount);
  const rate = rates?.rates[to];
  const converted = !isNaN(amt) && rate !== undefined ? amt * rate : null;

  const curOpts = CURRENCIES.map((c) => ({ value: c, label: c }));

  return (
    <Card>
      <div className="space-y-4">
        <Field label="Amount">
          <NumInput value={amount} onChange={setAmount} placeholder="100" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From">
            <Select value={from} onChange={setFrom} options={curOpts} />
          </Field>
          <Field label="To">
            <Select value={to} onChange={setTo} options={curOpts} />
          </Field>
        </div>
        {loading && <Notice>Fetching live rates…</Notice>}
        {error && !rates && (
          <Notice tone="warn">Live rates unavailable (offline?). Try again later.</Notice>
        )}
        {converted !== null && rate !== undefined ? (
          <>
            <Stat label={`${amount || "0"} ${from} =`} accent value={`${parseFloat(converted.toPrecision(6))} ${to}`} />
            <p className="text-sm text-sage">
              1 {from} = {rate} {to}
              {rates?.date ? ` · rates as of ${rates.date}` : ""}
            </p>
          </>
        ) : (
          !loading && <Notice tone="warn">Enter an amount to convert.</Notice>
        )}
      </div>
    </Card>
  );
}
