"use client";

import { useMemo, useState } from "react";
import { Btn, Card, CopyBtn, Field, Notice, Tabs, TextArea } from "../ui";

/* ============================== JSON Formatter ============================== */

export function JsonFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const run = (mode: "format" | "minify" | "validate") => {
    setError("");
    try {
      const parsed = JSON.parse(input);
      if (mode === "format") setOutput(JSON.stringify(parsed, null, 2));
      else if (mode === "minify") setOutput(JSON.stringify(parsed));
      else setOutput("✅ Valid JSON");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setOutput("");
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        <Field label="JSON input">
          <TextArea value={input} onChange={(e) => setInput(e.target.value)} placeholder='{"hello": "world"}' className="min-h-[160px]" />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => run("format")}>Format</Btn>
          <Btn variant="secondary" onClick={() => run("minify")}>
            Minify
          </Btn>
          <Btn variant="secondary" onClick={() => run("validate")}>
            Validate
          </Btn>
          {output && <CopyBtn text={output} />}
        </div>
        {error && <Notice tone="warn">⚠ {error}</Notice>}
        {output && (
          <Field label="Output">
            <TextArea value={output} readOnly className="min-h-[160px]" />
          </Field>
        )}
      </div>
    </Card>
  );
}

/* ============================== Base64 ============================== */

export function Base64Tool() {
  const [tab, setTab] = useState("Encode");
  const [input, setInput] = useState("");

  const { output, error } = useMemo(() => {
    if (tab === "Encode") {
      return { output: btoa(unescape(encodeURIComponent(input))), error: "" };
    }
    if (!input) return { output: "", error: "" };
    try {
      return { output: decodeURIComponent(escape(atob(input))), error: "" };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : "Invalid Base64 input" };
    }
  }, [tab, input]);

  return (
    <Card>
      <div className="space-y-4">
        <Tabs tabs={["Encode", "Decode"]} active={tab} onChange={setTab} />
        <Field label="Input">
          <TextArea value={input} onChange={(e) => setInput(e.target.value)} placeholder={tab === "Encode" ? "Text to encode…" : "Base64 to decode…"} />
        </Field>
        {error && <Notice tone="warn">⚠ {error}</Notice>}
        <Field label="Output">
          <TextArea value={output} readOnly />
        </Field>
        {output && <CopyBtn text={output} />}
      </div>
    </Card>
  );
}

/* ============================== URL Encoder ============================== */

export function UrlEncoderTool() {
  const [tab, setTab] = useState("Encode");
  const [input, setInput] = useState("");

  const { output, error } = useMemo(() => {
    if (tab === "Encode") {
      return { output: encodeURIComponent(input), error: "" };
    }
    if (!input) return { output: "", error: "" };
    try {
      return { output: decodeURIComponent(input), error: "" };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : "Invalid URL-encoded input" };
    }
  }, [tab, input]);

  return (
    <Card>
      <div className="space-y-4">
        <Tabs tabs={["Encode", "Decode"]} active={tab} onChange={setTab} />
        <Field label="Input">
          <TextArea value={input} onChange={(e) => setInput(e.target.value)} placeholder={tab === "Encode" ? "Text to encode…" : "URL-encoded text to decode…"} />
        </Field>
        {error && <Notice tone="warn">⚠ {error}</Notice>}
        <Field label="Output">
          <TextArea value={output} readOnly />
        </Field>
        {output && <CopyBtn text={output} />}
      </div>
    </Card>
  );
}
