"use client";

import { useEffect, useRef, useState } from "react";
import { Btn, Card, Field, Notice, NumInput, Stat } from "../ui";

/* ---------- shared helpers ---------- */

function fmtStopwatch(ms: number): string {
  const cs = Math.floor(ms / 10) % 100;
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function fmtHMS(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** Play a short beep pattern through WebAudio. Only call from handlers/effects. */
function playBeeps(times = 3) {
  try {
    if (typeof window === "undefined") return;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    for (let i = 0; i < times; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      const start = ctx.currentTime + i * 0.25;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.5, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
      osc.start(start);
      osc.stop(start + 0.2);
    }
  } catch {
    /* audio unavailable */
  }
}

/* ============================== Stopwatch ============================== */

export function StopwatchTool() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<number[]>([]); // totals, newest first
  const startRef = useRef(0);
  const accRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed(accRef.current + (performance.now() - startRef.current));
    }, 47);
    return () => clearInterval(id);
  }, [running]);

  const toggle = () => {
    if (running) {
      accRef.current += performance.now() - startRef.current;
      setRunning(false);
    } else {
      startRef.current = performance.now();
      setRunning(true);
    }
  };

  const addLap = () => {
    if (!running) return;
    const now = accRef.current + (performance.now() - startRef.current);
    setElapsed(now);
    setLaps((l) => [now, ...l]);
  };

  const reset = () => {
    setRunning(false);
    setElapsed(0);
    setLaps([]);
    accRef.current = 0;
  };

  return (
    <Card>
      <div className="space-y-4">
        <div className="rounded-xl border border-gold/30 bg-ink-2/70 px-4 py-6 text-center">
          <div className="font-display text-5xl font-bold tabular-nums text-gold-light">{fmtStopwatch(elapsed)}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={toggle}>{running ? "Stop" : "Start"}</Btn>
          <Btn variant="secondary" onClick={addLap} disabled={!running}>
            Lap
          </Btn>
          <Btn variant="ghost" onClick={reset}>
            Reset
          </Btn>
        </div>
        {laps.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-cream">Laps</div>
            <ul className="max-h-56 space-y-1.5 overflow-y-auto">
              {laps.map((total, i) => {
                const lapMs = total - (laps[i + 1] ?? 0);
                const lapNo = laps.length - i;
                return (
                  <li
                    key={`${lapNo}-${total}`}
                    className="flex items-center justify-between rounded-lg border border-gold/20 bg-ink-2/60 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-sage">Lap {lapNo}</span>
                    <span className="tabular-nums text-cream">
                      <span className="text-gold-light">{fmtStopwatch(lapMs)}</span>
                      <span className="text-sage/60"> · {fmtStopwatch(total)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ============================== Countdown Timer ============================== */

export function CountdownTimerTool() {
  const [hours, setHours] = useState("0");
  const [mins, setMins] = useState("5");
  const [secs, setSecs] = useState("0");
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (remaining === 0 && running) {
      setRunning(false);
      setDone(true);
      playBeeps(3);
    }
  }, [remaining, running]);

  const startPause = () => {
    if (running) {
      setRunning(false);
      return;
    }
    if (remaining > 0) {
      setDone(false);
      setRunning(true);
      return;
    }
    const t =
      Math.max(0, parseInt(hours, 10) || 0) * 3600 +
      Math.max(0, parseInt(mins, 10) || 0) * 60 +
      Math.max(0, parseInt(secs, 10) || 0);
    if (t <= 0) return;
    setTotal(t);
    setRemaining(t);
    setDone(false);
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setDone(false);
    setRemaining(total);
  };

  const progress = total > 0 ? (1 - remaining / total) * 100 : 0;

  return (
    <Card>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Hours">
            <NumInput value={hours} onChange={setHours} min={0} max={99} disabled={running} />
          </Field>
          <Field label="Minutes">
            <NumInput value={mins} onChange={setMins} min={0} max={59} disabled={running} />
          </Field>
          <Field label="Seconds">
            <NumInput value={secs} onChange={setSecs} min={0} max={59} disabled={running} />
          </Field>
        </div>
        <div className="rounded-xl border border-gold/30 bg-ink-2/70 px-4 py-6 text-center">
          <div className="font-display text-5xl font-bold tabular-nums text-gold-light">{fmtHMS(remaining)}</div>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-ink">
          <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        {done && <Notice>⏰ Time&apos;s up!</Notice>}
        <div className="flex flex-wrap gap-2">
          <Btn onClick={startPause}>{running ? "Pause" : remaining > 0 && !done ? "Resume" : "Start"}</Btn>
          <Btn variant="secondary" onClick={reset}>
            Reset
          </Btn>
        </div>
      </div>
    </Card>
  );
}

/* ============================== Pomodoro ============================== */

type Phase = "focus" | "short" | "long";

const PHASE_LABEL: Record<Phase, string> = {
  focus: "Focus",
  short: "Short break",
  long: "Long break",
};

export function PomodoroTool() {
  const [workMin, setWorkMin] = useState("25");
  const [shortMin, setShortMin] = useState("5");
  const [longMin, setLongMin] = useState("15");
  const [phase, setPhase] = useState<Phase>("focus");
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);

  const phaseSeconds: Record<Phase, number> = {
    focus: Math.max(1, parseInt(workMin, 10) || 25) * 60,
    short: Math.max(1, parseInt(shortMin, 10) || 5) * 60,
    long: Math.max(1, parseInt(longMin, 10) || 15) * 60,
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running || seconds > 0) return;
    playBeeps(2);
    if (phase === "focus") {
      const c = completed + 1;
      setCompleted(c);
      const next: Phase = c % 4 === 0 ? "long" : "short";
      setPhase(next);
      setSeconds(phaseSeconds[next]);
    } else {
      setPhase("focus");
      setSeconds(phaseSeconds.focus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, running, phase, completed]);

  const startPause = () => {
    if (running) {
      setRunning(false);
      return;
    }
    if (seconds <= 0) setSeconds(phaseSeconds[phase]);
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setPhase("focus");
    setCompleted(0);
    setSeconds(phaseSeconds.focus);
  };

  const cycleDone = completed % 4;
  const filled = completed > 0 && cycleDone === 0 ? 4 : cycleDone;

  return (
    <Card>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Focus (min)">
            <NumInput value={workMin} onChange={setWorkMin} min={1} max={120} disabled={running} />
          </Field>
          <Field label="Short break (min)">
            <NumInput value={shortMin} onChange={setShortMin} min={1} max={60} disabled={running} />
          </Field>
          <Field label="Long break (min)">
            <NumInput value={longMin} onChange={setLongMin} min={1} max={90} disabled={running} />
          </Field>
        </div>
        <div className="rounded-xl border border-gold/30 bg-ink-2/70 px-4 py-6 text-center">
          <div className="text-sm font-semibold uppercase tracking-widest text-sage">{PHASE_LABEL[phase]}</div>
          <div className="mt-1 font-display text-5xl font-bold tabular-nums text-gold-light">{fmtHMS(seconds)}</div>
          <div className="mt-2 flex items-center justify-center gap-2 text-xl" aria-label={`${filled} of 4 sessions done`}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={i < filled ? "text-gold-light" : "text-sage/40"}>
                ●
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={startPause}>{running ? "Pause" : "Start"}</Btn>
          <Btn variant="secondary" onClick={reset}>
            Reset
          </Btn>
        </div>
        <Stat label="Completed focus sessions" value={String(completed)} />
      </div>
    </Card>
  );
}
