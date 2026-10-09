"use client";

import { useEffect, useRef, useState } from "react";
import { Btn, Card, CopyBtn, Field, Notice, NumInput, Stat, Tabs, TextArea, downloadBlob } from "../ui";

/* ============================== Magic 8-Ball ============================== */

const EIGHT_BALL_ANSWERS = [
  "It is certain",
  "Without a doubt",
  "Yes, definitely",
  "You may rely on it",
  "As I see it, yes",
  "Most likely",
  "Outlook good",
  "Signs point to yes",
  "All signs say yes",
  "Absolutely",
  "Reply hazy, try again",
  "Ask again later",
  "Better not tell you now",
  "Cannot predict now",
  "Concentrate and ask again",
  "Don't count on it",
  "My reply is no",
  "My sources say no",
  "Outlook not so good",
  "Very doubtful",
];

export function Magic8BallTool() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const ask = () => {
    if (!question.trim() || shaking) return;
    setShaking(true);
    setAnswer(null);
    const picked = EIGHT_BALL_ANSWERS[Math.floor(Math.random() * EIGHT_BALL_ANSWERS.length)];
    timerRef.current = window.setTimeout(() => {
      setAnswer(picked);
      setShaking(false);
    }, 750);
  };

  return (
    <Card>
      <style>{`@keyframes fh-ball-shake{0%,100%{transform:rotate(0deg)}20%{transform:rotate(-10deg)}40%{transform:rotate(9deg)}60%{transform:rotate(-7deg)}80%{transform:rotate(5deg)}}.fh-shake{animation:fh-ball-shake .75s ease-in-out}`}</style>
      <Field label="Ask the Magic 8-Ball a yes-or-no question">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="Will I pass my exam?"
          className="w-full rounded-xl border border-gold/25 bg-ink/80 px-3.5 py-2.5 text-cream placeholder:text-sage/50 outline-none transition focus:border-gold/70 focus:ring-2 focus:ring-gold/20"
        />
      </Field>
      <div className="mt-4">
        <Btn onClick={ask} disabled={!question.trim() || shaking}>
          🔮 Shake the ball
        </Btn>
      </div>
      <div className="mt-6 flex justify-center">
        <div
          className={`flex h-52 w-52 items-center justify-center rounded-full bg-gradient-to-br from-ink-2 via-ink to-black shadow-2xl shadow-black/60 ring-4 ring-gold/30 ${shaking ? "fh-shake" : ""}`}
        >
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-ink-2/90 p-3 text-center shadow-inner ring-1 ring-gold/40">
            {answer ? (
              <span className="font-display text-base font-bold leading-tight text-gold-light">{answer}</span>
            ) : (
              <span className="font-display text-4xl font-bold text-cream/70">8</span>
            )}
          </div>
        </div>
      </div>
      {answer && (
        <p className="mt-4 text-center text-sm text-sage">
          The ball has spoken. Ask another question anytime.
        </p>
      )}
      <div className="mt-4">
        <Notice>Just for fun — the 8-ball knows nothing about your future.</Notice>
      </div>
    </Card>
  );
}

/* ============================== Love calculator ============================== */

function loveScore(a: string, b: string): number {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (!x || !y) return -1;
  if (x === y) return 100;
  const [s1, s2] = [x, y].sort();
  const seed = `${s1}|${s2}`;
  let h = 7;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) % 1000003;
  }
  return h % 101;
}

function loveVerdict(score: number): string {
  if (score >= 90) return "A legendary match! The stars are cheering for you two.";
  if (score >= 75) return "Strong sparks! This pair has serious potential.";
  if (score >= 60) return "Good vibes — worth a second look and a long chat.";
  if (score >= 40) return "Decent chemistry. Friendship material, at least!";
  if (score >= 20) return "A slow burn — opposites can still attract.";
  return "Uh oh… maybe just stay good friends.";
}

export function LoveCalcTool() {
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [score, setScore] = useState<number | null>(null);

  const calculate = () => {
    const s = loveScore(nameA, nameB);
    setScore(s >= 0 ? s : null);
  };

  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name">
          <input
            value={nameA}
            onChange={(e) => setNameA(e.target.value)}
            placeholder="e.g. Sadam"
            className="w-full rounded-xl border border-gold/25 bg-ink/80 px-3.5 py-2.5 text-cream placeholder:text-sage/50 outline-none transition focus:border-gold/70 focus:ring-2 focus:ring-gold/20"
          />
        </Field>
        <Field label="Their name">
          <input
            value={nameB}
            onChange={(e) => setNameB(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && calculate()}
            placeholder="e.g. Mehwish"
            className="w-full rounded-xl border border-gold/25 bg-ink/80 px-3.5 py-2.5 text-cream placeholder:text-sage/50 outline-none transition focus:border-gold/70 focus:ring-2 focus:ring-gold/20"
          />
        </Field>
      </div>
      <div className="mt-4">
        <Btn onClick={calculate} disabled={!nameA.trim() || !nameB.trim()}>
          💘 Calculate compatibility
        </Btn>
      </div>
      {score !== null && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-gold/40 bg-gold/5 p-6 text-center">
            <div className="font-display text-7xl font-bold text-gold-light">
              {score}
              <span className="text-3xl">%</span>
            </div>
            <p className="mt-3 font-semibold text-cream">
              {nameA.trim()} ♥ {nameB.trim()}
            </p>
            <p className="mt-1 text-sm text-sage">{loveVerdict(score)}</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-ink-2">
              <div className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold-light transition-all" style={{ width: `${score}%` }} />
            </div>
          </div>
          <Stat label="Compatibility" value={`${score}%`} accent />
        </div>
      )}
      <div className="mt-4">
        <Notice tone="warn">
          <strong>Just for fun — not real.</strong> The score is a playful formula on the two names; it predicts nothing about real relationships.
        </Notice>
      </div>
    </Card>
  );
}

/* ============================== Rock–paper–scissors ============================== */

const RPS_CHOICES = ["rock", "paper", "scissors"] as const;
type RpsChoice = (typeof RPS_CHOICES)[number];
const RPS_ICON: Record<RpsChoice, string> = { rock: "✊", paper: "✋", scissors: "✌️" };
const RPS_BEATS: Record<RpsChoice, RpsChoice> = { rock: "scissors", paper: "rock", scissors: "paper" };

type RpsRound = { player: RpsChoice; comp: RpsChoice; result: "win" | "lose" | "draw" };

export function RpsTool() {
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [draws, setDraws] = useState(0);
  const [history, setHistory] = useState<RpsRound[]>([]);
  const [lastComp, setLastComp] = useState<RpsChoice | null>(null);

  const play = (player: RpsChoice) => {
    const comp = RPS_CHOICES[Math.floor(Math.random() * 3)];
    const result: RpsRound["result"] = player === comp ? "draw" : RPS_BEATS[player] === comp ? "win" : "lose";
    setLastComp(comp);
    if (result === "win") setWins((w) => w + 1);
    else if (result === "lose") setLosses((l) => l + 1);
    else setDraws((d) => d + 1);
    setHistory((h) => [{ player, comp, result }, ...h].slice(0, 10));
  };

  const reset = () => {
    setWins(0);
    setLosses(0);
    setDraws(0);
    setHistory([]);
    setLastComp(null);
  };

  const last = history[0];

  return (
    <Card>
      <p className="text-sm font-semibold text-cream">Choose your move:</p>
      <div className="mt-2 flex flex-wrap gap-3">
        {RPS_CHOICES.map((c) => (
          <button
            key={c}
            onClick={() => play(c)}
            className="flex flex-col items-center gap-1 rounded-2xl border border-gold/25 bg-ink-2/70 px-6 py-4 transition hover:border-gold/60 hover:bg-gold/10 active:scale-95"
          >
            <span className="text-4xl">{RPS_ICON[c]}</span>
            <span className="text-xs font-bold uppercase tracking-widest text-sage">{c}</span>
          </button>
        ))}
      </div>
      {last && (
        <div className="mt-4 rounded-xl border border-gold/30 bg-ink-2/70 p-4 text-center">
          <div className="flex items-center justify-center gap-6 text-3xl">
            <span title="You">{RPS_ICON[last.player]}</span>
            <span className="text-lg font-bold text-sage">VS</span>
            <span title="Computer">{RPS_ICON[last.comp]}</span>
          </div>
          <p className={`mt-2 font-display text-xl font-bold ${last.result === "win" ? "text-gold-light" : last.result === "lose" ? "text-red-300" : "text-sage"}`}>
            {last.result === "win" ? "You win! 🎉" : last.result === "lose" ? "Computer wins 😅" : "It's a draw 🤝"}
          </p>
        </div>
      )}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Wins" value={String(wins)} accent />
        <Stat label="Losses" value={String(losses)} />
        <Stat label="Draws" value={String(draws)} />
      </div>
      {history.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-cream">Round history</div>
            <button onClick={reset} className="text-xs font-semibold text-gold-light hover:underline">
              Reset score
            </button>
          </div>
          {history.map((r, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-ink-2/60 px-3 py-1.5 text-sm">
              <span className="text-xl">{RPS_ICON[r.player]}</span>
              <span className="text-sage">vs</span>
              <span className="text-xl">{RPS_ICON[r.comp]}</span>
              <span className={`ml-auto font-bold ${r.result === "win" ? "text-gold-light" : r.result === "lose" ? "text-red-300" : "text-sage"}`}>
                {r.result.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
      {lastComp === null && history.length === 0 && (
        <p className="mt-4 text-sm text-sage">The computer picks randomly each round. First to bragging rights wins.</p>
      )}
    </Card>
  );
}

/* ============================== Number guessing ============================== */

function hotCold(diff: number): string {
  if (diff === 0) return "correct";
  if (diff <= 5) return "🔥 Burning hot!";
  if (diff <= 12) return "🌡️ Warm…";
  if (diff <= 25) return "❄️ Cold…";
  return "🧊 Freezing!";
}

export function GuessingTool() {
  const [target, setTarget] = useState<number | null>(null);
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState("");
  const [won, setWon] = useState(false);
  const [best, setBest] = useState<number | null>(null);
  const [lastGuess, setLastGuess] = useState<number | null>(null);

  const startGame = () => {
    setTarget(1 + Math.floor(Math.random() * 100));
    setGuess("");
    setAttempts(0);
    setHint("I'm thinking of a number between 1 and 100. Take a guess!");
    setWon(false);
    setLastGuess(null);
  };

  useEffect(() => {
    startGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = () => {
    if (target === null || won) return;
    const g = parseInt(guess, 10);
    if (Number.isNaN(g) || g < 1 || g > 100) {
      setHint("Enter a whole number between 1 and 100.");
      return;
    }
    const n = attempts + 1;
    setAttempts(n);
    setLastGuess(g);
    setGuess("");
    if (g === target) {
      setWon(true);
      setHint(`🎉 Correct! The number was ${target}. You got it in ${n} ${n === 1 ? "try" : "tries"}.`);
      setBest((b) => (b === null || n < b ? n : b));
    } else {
      setHint(`${hotCold(Math.abs(g - target))} — try ${g < target ? "higher ⬆️" : "lower ⬇️"}.`);
    }
  };

  return (
    <Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Attempts" value={String(attempts)} />
        <Stat label="Best score" value={best === null ? "—" : String(best)} accent />
        <Stat label="Last guess" value={lastGuess === null ? "—" : String(lastGuess)} />
      </div>
      <div className="mt-4 rounded-xl border border-gold/25 bg-ink-2/70 p-4">
        <p className="font-semibold text-cream">{hint}</p>
        {won && best !== null && attempts === best && attempts > 0 && (
          <p className="mt-1 text-sm font-semibold text-gold-light">🏆 New personal best!</p>
        )}
      </div>
      {!won ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="min-w-[140px] flex-1">
            <NumInput
              value={guess}
              onChange={setGuess}
              min={1}
              max={100}
              placeholder="1–100"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <Btn onClick={submit}>🎯 Guess</Btn>
        </div>
      ) : (
        <div className="mt-4">
          <Btn onClick={startGame}>🔄 Play again</Btn>
        </div>
      )}
      <div className="mt-4">
        <Notice>Hints use a hot/cold scale: within 5 is “burning hot”, over 25 is “freezing”.</Notice>
      </div>
    </Card>
  );
}

/* ============================== Tic-tac-toe ============================== */

type Mark = "X" | "O" | "";

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(b: Mark[]): Mark | "draw" | null {
  for (const [a, c, d] of WIN_LINES) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return b.every((cell) => cell) ? "draw" : null;
}

function bestAiMove(b: Mark[]): number {
  const empty = b.map((v, i) => (v === "" ? i : -1)).filter((i) => i >= 0);
  // 1. win if possible
  for (const i of empty) {
    const t = [...b];
    t[i] = "O";
    if (checkWinner(t) === "O") return i;
  }
  // 2. block the player
  for (const i of empty) {
    const t = [...b];
    t[i] = "X";
    if (checkWinner(t) === "X") return i;
  }
  // 3. take centre, then a corner, then random
  if (b[4] === "") return 4;
  const corners = [0, 2, 6, 8].filter((i) => b[i] === "");
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  return empty[Math.floor(Math.random() * empty.length)];
}

export function TicTacToeTool() {
  const [board, setBoard] = useState<Mark[]>(Array(9).fill(""));
  const [score, setScore] = useState({ you: 0, ai: 0, draws: 0 });
  const [over, setOver] = useState<string>("");

  const finish = (b: Mark[]) => {
    const w = checkWinner(b);
    if (w === "X") {
      setScore((s) => ({ ...s, you: s.you + 1 }));
      setOver("🎉 You win!");
    } else if (w === "O") {
      setScore((s) => ({ ...s, ai: s.ai + 1 }));
      setOver("🤖 Computer wins!");
    } else if (w === "draw") {
      setScore((s) => ({ ...s, draws: s.draws + 1 }));
      setOver("🤝 It's a draw!");
    }
    return w !== null;
  };

  const tap = (i: number) => {
    if (board[i] !== "" || over) return;
    const b = [...board];
    b[i] = "X";
    if (finish(b)) {
      setBoard(b);
      return;
    }
    b[bestAiMove(b)] = "O";
    finish(b);
    setBoard(b);
  };

  const newRound = () => {
    setBoard(Array(9).fill(""));
    setOver("");
  };

  const resetAll = () => {
    newRound();
    setScore({ you: 0, ai: 0, draws: 0 });
  };

  return (
    <Card>
      <div className="mx-auto grid max-w-[280px] grid-cols-3 gap-2">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => tap(i)}
            disabled={cell !== "" || !!over}
            className={`flex h-20 items-center justify-center rounded-xl border text-4xl font-bold transition ${
              cell === "X"
                ? "border-gold/60 bg-gold/10 text-gold-light"
                : cell === "O"
                ? "border-gold/30 bg-ink-2/80 text-cream"
                : "border-gold/25 bg-ink-2/60 hover:border-gold/60 hover:bg-gold/5"
            }`}
          >
            {cell}
          </button>
        ))}
      </div>
      {over && <p className="mt-4 text-center font-display text-xl font-bold text-cream">{over}</p>}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Btn onClick={newRound} variant="secondary">
          {over ? "▶️ Next round" : "↺ Restart round"}
        </Btn>
        <Btn onClick={resetAll} variant="ghost">
          Reset score
        </Btn>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="You (X)" value={String(score.you)} accent />
        <Stat label="Draws" value={String(score.draws)} />
        <Stat label="Computer (O)" value={String(score.ai)} />
      </div>
      <p className="mt-4 text-center text-sm text-sage">
        You are <span className="font-bold text-gold-light">X</span> and move first. The computer blocks and grabs wins when it can.
      </p>
    </Card>
  );
}

/* ============================== Typing test ============================== */

const TYPING_PARAGRAPH =
  "The little garden behind the house woke up before everyone else. Sunlight slid across the roses while birds traded quick notes from the branches, and the old wooden gate creaked open in the morning breeze. Somewhere nearby a kettle began to sing, and the day started with the simple promise of warm tea and quiet pages.";

const TEST_SECONDS = 30;

export function TypingTestTool() {
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TEST_SECONDS);
  const [done, setDone] = useState(false);
  const timerRef = useRef<number | null>(null);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => stopTimer(), []);

  const start = () => {
    setStarted(true);
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stopTimer();
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const onType = (v: string) => {
    if (done) return;
    const val = v.slice(0, TYPING_PARAGRAPH.length);
    if (!started && val.length > 0) start();
    setInput(val);
  };

  const reset = () => {
    stopTimer();
    setInput("");
    setStarted(false);
    setTimeLeft(TEST_SECONDS);
    setDone(false);
  };

  const typedLen = input.length;
  let correct = 0;
  for (let i = 0; i < typedLen; i++) {
    if (input[i] === TYPING_PARAGRAPH[i]) correct++;
  }
  const elapsed = TEST_SECONDS - timeLeft;
  const minutes = Math.max(elapsed, 1) / 60;
  const wpm = Math.round(correct / 5 / minutes);
  const accuracy = typedLen === 0 ? 100 : Math.round((correct / typedLen) * 100);

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Time" value={`${timeLeft}s`} accent={!done} />
          <Stat label="WPM" value={String(wpm)} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
        </div>
        <Btn onClick={reset} variant="secondary">
          ↺ Restart
        </Btn>
      </div>
      {!done ? (
        <>
          <div className="mt-4 rounded-xl border border-gold/25 bg-ink-2/70 p-5 font-mono text-lg leading-relaxed">
            {TYPING_PARAGRAPH.split("").map((ch, i) => {
              const typed = i < typedLen;
              const ok = typed && input[i] === ch;
              return (
                <span
                  key={i}
                  className={
                    !typed
                      ? "text-sage/60"
                      : ok
                      ? "text-gold-light"
                      : "rounded bg-red-500/30 text-red-200"
                  }
                >
                  {ch}
                </span>
              );
            })}
          </div>
          <div className="mt-3">
            <textarea
              value={input}
              onChange={(e) => onType(e.target.value)}
              placeholder="Start typing here — the timer begins with your first keystroke…"
              rows={3}
              className="w-full rounded-xl border border-gold/25 bg-ink/80 px-3.5 py-2.5 font-mono text-cream placeholder:text-sage/50 outline-none transition focus:border-gold/70 focus:ring-2 focus:ring-gold/20"
            />
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-gold/40 bg-gold/5 p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-sage">Time's up — your result</p>
          <div className="mt-2 flex items-center justify-center gap-8">
            <div>
              <div className="font-display text-5xl font-bold text-gold-light">{wpm}</div>
              <div className="text-xs uppercase tracking-widest text-sage">WPM</div>
            </div>
            <div>
              <div className="font-display text-5xl font-bold text-cream">{accuracy}%</div>
              <div className="text-xs uppercase tracking-widest text-sage">Accuracy</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-sage">
            {typedLen} characters typed, {correct} correct.
          </p>
          <div className="mt-4">
            <Btn onClick={reset}>⌨️ Try again</Btn>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ============================== Reaction test ============================== */

type ReactionPhase = "idle" | "waiting" | "ready" | "result" | "early";

export function ReactionTool() {
  const [phase, setPhase] = useState<ReactionPhase>("idle");
  const [lastMs, setLastMs] = useState<number | null>(null);
  const [times, setTimes] = useState<number[]>([]);
  const startRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const begin = () => {
    setLastMs(null);
    setPhase("waiting");
    timeoutRef.current = window.setTimeout(
      () => {
        startRef.current = performance.now();
        setPhase("ready");
      },
      1200 + Math.random() * 2800
    );
  };

  const clickPad = () => {
    if (phase === "waiting") {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      setPhase("early");
    } else if (phase === "ready") {
      const ms = Math.round(performance.now() - startRef.current);
      setLastMs(ms);
      setTimes((t) => [...t, ms].slice(-5));
      setPhase("result");
    }
  };

  const resetAll = () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    setPhase("idle");
    setLastMs(null);
    setTimes([]);
  };

  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
  const best = times.length ? Math.min(...times) : null;

  const padTone =
    phase === "ready"
      ? "border-green-400/70 bg-green-500/20"
      : phase === "waiting"
      ? "border-red-400/60 bg-red-500/10"
      : "border-gold/30 bg-ink-2/70";

  const padText =
    phase === "idle"
      ? "Press Start, then wait…"
      : phase === "waiting"
      ? "Wait for green…"
      : phase === "ready"
      ? "CLICK!"
      : phase === "early"
      ? "Too soon! Click “Try again”."
      : `${lastMs} ms`;

  return (
    <Card>
      <button
        onClick={clickPad}
        className={`flex h-48 w-full cursor-pointer items-center justify-center rounded-2xl border-2 transition ${padTone}`}
      >
        <span className={`font-display text-3xl font-bold ${phase === "ready" ? "text-green-200" : phase === "waiting" ? "text-red-200" : "text-cream"}`}>
          {padText}
        </span>
      </button>
      <div className="mt-4 flex flex-wrap gap-2">
        {(phase === "idle" || phase === "result" || phase === "early") && (
          <Btn onClick={begin}>{times.length ? "▶️ Next round" : "▶️ Start"}</Btn>
        )}
        {(times.length > 0 || phase !== "idle") && (
          <Btn onClick={resetAll} variant="secondary">
            Reset
          </Btn>
        )}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Last" value={lastMs === null ? "—" : `${lastMs} ms`} accent />
        <Stat label="Best of 5" value={best === null ? "—" : `${best} ms`} />
        <Stat label="Average" value={avg === null ? "—" : `${avg} ms`} />
      </div>
      {times.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {times.map((t, i) => (
            <span key={i} className="rounded-lg border border-gold/25 bg-ink/80 px-2.5 py-1 font-mono text-sm text-cream">
              {t} ms
            </span>
          ))}
        </div>
      )}
      <div className="mt-4">
        <Notice>Click the pad only when it turns green. Clicking early voids the round. Your best and average of the last 5 rounds are shown.</Notice>
      </div>
    </Card>
  );
}

/* ============================== Coin flip ============================== */

export function CoinFlipTool() {
  const [result, setResult] = useState<"heads" | "tails" | null>(null);
  const [heads, setHeads] = useState(0);
  const [tails, setTails] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const flip = () => {
    if (flipping) return;
    setFlipping(true);
    const r = Math.random() < 0.5 ? "heads" : "tails";
    timerRef.current = window.setTimeout(() => {
      setResult(r);
      if (r === "heads") setHeads((h) => h + 1);
      else setTails((t) => t + 1);
      setFlipping(false);
    }, 900);
  };

  const total = heads + tails;

  return (
    <Card>
      <style>{`@keyframes fh-coin-flip{0%{transform:rotateY(0)}100%{transform:rotateY(1440deg)}}.fh-flip{animation:fh-coin-flip .9s ease-out}`}</style>
      <div className="flex justify-center">
        <div
          className={`flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-gold-light via-gold to-amber-700 shadow-xl shadow-gold/20 ring-4 ring-gold/40 ${flipping ? "fh-flip" : ""}`}
        >
          <div className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-dashed border-ink/40">
            <span className="font-display text-xl font-bold uppercase tracking-wider text-ink">
              {flipping ? "?" : result ? result : "Flip"}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-5 text-center">
        <Btn onClick={flip} disabled={flipping}>
          🪙 {flipping ? "Flipping…" : "Flip the coin"}
        </Btn>
        {total > 0 && (
          <button onClick={() => { setHeads(0); setTails(0); setResult(null); }} className="ml-3 text-sm font-semibold text-gold-light hover:underline">
            Reset tally
          </button>
        )}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Heads" value={String(heads)} accent={result === "heads"} />
        <Stat label="Tails" value={String(tails)} accent={result === "tails"} />
        <Stat label="Total flips" value={String(total)} />
      </div>
      {total > 0 && (
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-ink-2">
          <div className="h-full bg-gold transition-all" style={{ width: `${(heads / total) * 100}%` }} />
        </div>
      )}
    </Card>
  );
}

/* ============================== Notepad ============================== */

const NOTEPAD_KEY = "toolhub-notepad";

export function NotepadTool() {
  const [text, setText] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(NOTEPAD_KEY);
      if (v !== null) setText(v);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const onChange = (v: string) => {
    setText(v);
    try {
      window.localStorage.setItem(NOTEPAD_KEY, v);
      setSavedFlash(true);
    } catch {
      /* storage unavailable */
    }
  };

  useEffect(() => {
    if (!savedFlash) return;
    const t = window.setTimeout(() => setSavedFlash(false), 1200);
    return () => window.clearTimeout(t);
  }, [savedFlash]);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const lines = text ? text.split("\n").length : 0;

  const download = () => {
    downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), "notepad.txt");
  };

  const clear = () => {
    onChange("");
  };

  return (
    <Card>
      <TextArea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing — your notes save automatically in this browser…"
        className="min-h-[220px]"
      />
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Stat label="Words" value={String(words)} />
        <Stat label="Characters" value={String(chars)} />
        <Stat label="Lines" value={String(lines)} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Btn onClick={download} disabled={!text} variant="secondary">
          ⬇️ Download .txt
        </Btn>
        <Btn onClick={clear} variant="ghost" disabled={!text}>
          Clear
        </Btn>
        <span className="ml-auto text-xs text-sage">
          {savedFlash ? "✓ Saved" : text ? "Auto-saves as you type" : "Empty note"}
        </span>
      </div>
      <div className="mt-4">
        <Notice>Notes are stored only in your browser's local storage — they never leave your device. Clearing browser data will erase them, so download important notes.</Notice>
      </div>
    </Card>
  );
}

/* ============================== Todo list ============================== */

const TODOS_KEY = "toolhub-todos";
const TODO_FILTERS = ["All", "Active", "Done"];

type TodoTask = { id: number; text: string; done: boolean };

export function TodoListTool() {
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TODOS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as TodoTask[];
        if (Array.isArray(parsed)) setTasks(parsed);
      }
    } catch {
      /* storage unavailable or corrupt */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(TODOS_KEY, JSON.stringify(tasks));
    } catch {
      /* storage unavailable */
    }
  }, [tasks, loaded]);

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    setTasks((ts) => [...ts, { id: Date.now() + Math.random(), text: t, done: false }]);
    setDraft("");
  };

  const toggle = (id: number) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const remove = (id: number) => setTasks((ts) => ts.filter((t) => t.id !== id));

  const clearDone = () => setTasks((ts) => ts.filter((t) => !t.done));

  const visible = tasks.filter((t) =>
    filter === "All" ? true : filter === "Active" ? !t.done : t.done
  );
  const activeCount = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.length - activeCount;

  return (
    <Card>
      <div className="flex flex-wrap gap-2">
        <div className="min-w-[180px] flex-1">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add a new task and press Enter…"
            className="w-full rounded-xl border border-gold/25 bg-ink/80 px-3.5 py-2.5 text-cream placeholder:text-sage/50 outline-none transition focus:border-gold/70 focus:ring-2 focus:ring-gold/20"
          />
        </div>
        <Btn onClick={add} disabled={!draft.trim()}>
          ➕ Add
        </Btn>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Tabs tabs={TODO_FILTERS} active={filter} onChange={setFilter} />
        <span className="text-xs text-sage">
          {activeCount} active · {doneCount} done
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {visible.length === 0 && (
          <p className="rounded-xl border border-dashed border-gold/25 bg-ink-2/60 p-6 text-center text-sm text-sage">
            {tasks.length === 0 ? "No tasks yet — add your first one above." : "Nothing matches this filter."}
          </p>
        )}
        {visible.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 transition ${
              t.done ? "border-gold/15 bg-ink-2/50" : "border-gold/25 bg-ink-2/70"
            }`}
          >
            <button
              onClick={() => toggle(t.id)}
              aria-label={t.done ? "Mark as active" : "Mark as done"}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                t.done ? "border-gold bg-gold text-ink" : "border-gold/40 text-transparent hover:border-gold"
              }`}
            >
              <span className="text-sm font-bold">✓</span>
            </button>
            <span className={`min-w-0 flex-1 text-sm ${t.done ? "text-sage/60 line-through" : "text-cream"}`}>
              {t.text}
            </span>
            <button onClick={() => remove(t.id)} aria-label="Delete task" className="shrink-0 text-sage/60 transition hover:text-red-300">
              ✕
            </button>
          </div>
        ))}
      </div>
      {doneCount > 0 && (
        <div className="mt-4">
          <Btn onClick={clearDone} variant="ghost">
            🧹 Clear completed
          </Btn>
        </div>
      )}
    </Card>
  );
}

/* ============================== My IP ============================== */

export function MyIpTool() {
  const [ip, setIp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchIp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { ip?: string };
      if (data.ip) {
        setIp(data.ip);
      } else {
        throw new Error("empty response");
      }
    } catch {
      setError(
        "Could not reach the IP lookup service. Check your internet connection and try again — your real IP is never stored by this tool."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card>
      {loading && ip === null ? (
        <p className="py-8 text-center text-sage">Looking up your IP address…</p>
      ) : error ? (
        <div>
          <Notice tone="warn">{error}</Notice>
          <div className="mt-4">
            <Btn onClick={fetchIp}>🔄 Try again</Btn>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gold/40 bg-gold/5 p-6 text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-sage">Your public IP address</div>
            <div className="mt-2 font-mono text-4xl font-bold text-gold-light">{ip}</div>
            <div className="mt-4 flex justify-center gap-2">
              <CopyBtn text={ip ?? ""} label="Copy IP" />
              <Btn onClick={fetchIp} variant="secondary" disabled={loading}>
                🔄 Refresh
              </Btn>
            </div>
          </div>
          <Notice>
            This is the address websites see when you visit them. If you use a VPN, this shows the VPN server's address, not your home one.
          </Notice>
        </div>
      )}
    </Card>
  );
}

/* ============================== Screen info ============================== */

type ScreenInfo = {
  screenW: number;
  screenH: number;
  viewW: number;
  viewH: number;
  depth: number;
  dpr: number;
  ua: string;
  platform: string;
  language: string;
  touch: boolean;
};

export function ScreenInfoTool() {
  const [info, setInfo] = useState<ScreenInfo | null>(null);

  useEffect(() => {
    const read = () => {
      try {
        setInfo({
          screenW: window.screen.width,
          screenH: window.screen.height,
          viewW: window.innerWidth,
          viewH: window.innerHeight,
          depth: window.screen.colorDepth,
          dpr: window.devicePixelRatio || 1,
          ua: navigator.userAgent,
          platform: navigator.platform || "Unknown",
          language: navigator.language || "Unknown",
          touch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
        });
      } catch {
        /* browser API unavailable */
      }
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  if (!info) {
    return (
      <Card>
        <p className="py-8 text-center text-sage">Reading your device info…</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Screen resolution" value={`${info.screenW}×${info.screenH}`} accent />
        <Stat label="Viewport" value={`${info.viewW}×${info.viewH}`} />
        <Stat label="Color depth" value={`${info.depth}-bit`} />
        <Stat label="Pixel ratio" value={`${info.dpr}x`} />
        <Stat label="Platform" value={info.platform} />
        <Stat label="Language" value={info.language} />
      </div>
      <div className="mt-4">
        <Field label="User agent">
          <pre className="overflow-auto whitespace-pre-wrap break-all rounded-xl border border-gold/25 bg-ink-2/70 px-4 py-3 font-mono text-xs text-cream">
            {info.ua}
          </pre>
        </Field>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <CopyBtn text={info.ua} label="Copy user agent" />
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${info.touch ? "border-gold/40 bg-gold/10 text-gold-light" : "border-gold/20 text-sage"}`}>
            {info.touch ? "Touch supported" : "No touch detected"}
          </span>
        </div>
      </div>
      <div className="mt-4">
        <Notice>Everything is read locally from your browser — nothing is sent anywhere. The viewport updates live when you resize the window.</Notice>
      </div>
    </Card>
  );
}
