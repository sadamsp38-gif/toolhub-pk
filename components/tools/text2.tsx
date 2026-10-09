"use client";

import { useEffect, useMemo, useState } from "react";
import { Btn, Card, Check, CopyBtn, downloadBlob, Field, Notice, Select, Slider, Tabs, TextArea } from "../ui";

/* ============================== Comma adder ============================== */

const SEPARATORS = [
  { value: ", ", label: "Comma" },
  { value: "; ", label: "Semicolon" },
  { value: "\n", label: "New line" },
  { value: " ", label: "Space" },
  { value: " | ", label: "Pipe" },
];

const QUOTES = [
  { value: "none", label: "None" },
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
];

export function CommaAdderTool() {
  const [input, setInput] = useState("");
  const [separator, setSeparator] = useState(SEPARATORS[0].value);
  const [quote, setQuote] = useState(QUOTES[0].value);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [trimWs, setTrimWs] = useState(true);

  const output = useMemo(() => {
    let lines = input.split("\n");
    if (removeEmpty) lines = lines.filter((l) => l.trim().length > 0);
    if (trimWs) lines = lines.map((l) => l.trim());
    const q = quote === "single" ? "'" : quote === "double" ? '"' : "";
    return lines.map((l) => (q ? `${q}${l}${q}` : l)).join(separator);
  }, [input, separator, quote, removeEmpty, trimWs]);

  const download = () => {
    downloadBlob(new Blob([output], { type: "text/plain;charset=utf-8" }), "items.txt");
  };

  return (
    <Card>
      <Field label="One item per line">
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"apple\nbanana\ncherry"}
          className="min-h-[160px]"
        />
      </Field>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Separator">
          <Select value={separator} onChange={setSeparator} options={SEPARATORS} />
        </Field>
        <Field label="Quote">
          <Select value={quote} onChange={setQuote} options={QUOTES} />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        <Check label="Remove empty lines" checked={removeEmpty} onChange={setRemoveEmpty} />
        <Check label="Trim whitespace" checked={trimWs} onChange={setTrimWs} />
      </div>
      <div className="mt-4">
        <Field label="Preview">
          <pre className="min-h-[120px] overflow-auto whitespace-pre-wrap rounded-xl border border-gold/25 bg-ink-2/70 px-4 py-3 font-mono text-sm text-cream">
            {output || <span className="text-sage/50">Your joined list will appear here…</span>}
          </pre>
        </Field>
        <div className="mt-2 flex flex-wrap gap-2">
          <CopyBtn text={output} />
          <Btn variant="secondary" onClick={download} disabled={!output}>
            ⬇ Download .txt
          </Btn>
        </div>
      </div>
    </Card>
  );
}

/* ============================== Morse code ============================== */

const MORSE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....",
  I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.",
  Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....",
  "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "!": "-.-.--", "/": "-..-.",
  "&": ".-...", ":": "---...", ";": "-.-.-.", "=": "-...-", "+": ".-.-.",
  "-": "-....-", _: "..--.-", '"': ".-..-.", $: "...-..-", "@": ".--.-.",
};

const MORSE_REV: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE).map(([k, v]) => [v, k])
);

const MORSE_TABS = ["Text → Morse", "Morse → Text"];

export function MorseCodeTool() {
  const [mode, setMode] = useState<string>(MORSE_TABS[0]);
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (mode === MORSE_TABS[0]) {
      return input
        .toUpperCase()
        .split(" ")
        .map((word) =>
          word
            .split("")
            .map((c) => MORSE[c])
            .filter((m): m is string => Boolean(m))
            .join(" ")
        )
        .filter((w) => w.length > 0)
        .join(" / ");
    }
    return input
      .split("/")
      .map((word) =>
        word
          .trim()
          .split(/\s+/)
          .map((m) => MORSE_REV[m])
          .filter((c): c is string => Boolean(c))
          .join("")
      )
      .join(" ");
  }, [input, mode]);

  const playSound = () => {
    try {
      if (typeof window === "undefined") return;
      const morse = mode === MORSE_TABS[0] ? output : input;
      if (!morse.trim()) return;
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const DOT = 0.12, DASH = 0.36, GAP = 0.12;
      let t = ctx.currentTime + 0.05;
      for (const ch of morse) {
        if (ch === "." || ch === "-") {
          const dur = ch === "." ? DOT : DASH;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = 700;
          osc.connect(gain);
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(0.5, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
          osc.start(t);
          osc.stop(t + dur + 0.02);
          t += dur + GAP;
        } else if (ch === " ") {
          t += GAP * 2;
        } else if (ch === "/") {
          t += GAP * 3;
        }
      }
      setTimeout(() => {
        try { ctx.close(); } catch { /* already closed */ }
      }, Math.ceil((t - ctx.currentTime) * 1000) + 300);
    } catch { /* WebAudio unavailable */ }
  };

  return (
    <Card>
      <Tabs tabs={MORSE_TABS} active={mode} onChange={setMode} />
      <div className="mt-4">
        <Field label="Input">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === MORSE_TABS[0] ? "HELLO WORLD" : "... --- ..."}
            className="min-h-[130px]"
          />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Btn variant="secondary" onClick={playSound} disabled={!(mode === MORSE_TABS[0] ? output : input).trim()}>
          🔊 Play sound
        </Btn>
        <CopyBtn text={output} />
      </div>
      <div className="mt-3">
        <Field label="Translation">
          <pre className="min-h-[120px] overflow-auto whitespace-pre-wrap rounded-xl border border-gold/25 bg-ink-2/70 px-4 py-3 font-mono text-sm text-cream">
            {output || <span className="text-sage/50">Translation appears here…</span>}
          </pre>
        </Field>
      </div>
    </Card>
  );
}

/* ============================== Text to speech ============================== */

export function TextToSpeechTool() {
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceIdx, setVoiceIdx] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => {
      try {
        setVoices(window.speechSynthesis.getVoices());
      } catch { /* unavailable */ }
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      try {
        window.speechSynthesis.onvoiceschanged = null;
      } catch { /* unavailable */ }
    };
  }, []);

  const speak = () => {
    try {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      if (!text.trim()) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const voice = voiceIdx !== "" ? voices[Number(voiceIdx)] : undefined;
      if (voice) u.voice = voice;
      u.rate = rate;
      u.pitch = pitch;
      window.speechSynthesis.speak(u);
    } catch { /* speech unavailable */ }
  };

  const stop = () => {
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch { /* speech unavailable */ }
  };

  const voiceOptions = voices.map((v, i) => ({ value: String(i), label: `${v.name} — ${v.lang}` }));

  return (
    <Card>
      <Field label="Text to speak">
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type something to hear it spoken aloud…"
          className="min-h-[130px]"
        />
      </Field>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Voice" hint={voices.length === 0 ? "No browser voices detected" : undefined}>
          <Select value={voiceIdx} onChange={setVoiceIdx} options={[{ value: "", label: "Default voice" }, ...voiceOptions]} />
        </Field>
        <Field label={`Rate: ${rate.toFixed(1)}`}>
          <Slider value={rate} min={0.5} max={2} step={0.1} onChange={setRate} format={(v) => v.toFixed(1)} />
        </Field>
        <Field label={`Pitch: ${pitch.toFixed(1)}`}>
          <Slider value={pitch} min={0} max={2} step={0.1} onChange={setPitch} format={(v) => v.toFixed(1)} />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Btn onClick={speak} disabled={!text.trim()}>
          🔊 Speak
        </Btn>
        <Btn variant="secondary" onClick={stop}>
          ⏹ Stop
        </Btn>
      </div>
      <div className="mt-4">
        <Notice>Uses your browser&apos;s built-in voices — nothing is uploaded.</Notice>
      </div>
    </Card>
  );
}
