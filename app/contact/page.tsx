"use client";

import { useState } from "react";
import { Card, Field, TextInput, TextArea, Btn, Notice } from "@/components/ui";

export default function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Contact</p>
      <h1 className="mt-3 font-display text-4xl font-bold text-cream">Contact Us</h1>
      <p className="mt-2 text-sage">Questions, feedback or a tool request? Send us a message.</p>
      <div className="gold-divider mt-6" />
      <Card className="mt-6">
        {sent ? (
          <Notice>Thanks for your message! (Demo form — connect a backend or Formspree to receive messages.)</Notice>
        ) : (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            <Field label="Name"><TextInput required placeholder="Your name" /></Field>
            <Field label="Email"><TextInput required type="email" placeholder="you@example.com" /></Field>
            <Field label="Message"><TextArea required placeholder="How can we help?" /></Field>
            <Btn>Send Message</Btn>
            <p className="text-xs text-sage/60">Demo form — wire it to Formspree or your backend before launch.</p>
          </form>
        )}
      </Card>
    </div>
  );
}
