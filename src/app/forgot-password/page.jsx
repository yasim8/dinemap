"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Logo, Btn, Input, ChevronLeft } from "@/components/ui";

// ─── Password reset request page ──────────────────────────────────────────────
// Placeholder flow (no backend yet): collects an email and shows a confirmation.
export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 40, background: "var(--surface-card)" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ marginBottom: 28 }}><Link href="/" style={{ textDecoration: "none" }}><Logo size={28} /></Link></div>

        {sent ? (
          <>
            <h2 className="dm-h2" style={{ marginBottom: 6 }}>Check your inbox</h2>
            <p className="dm-small" style={{ marginBottom: 24 }}>If an account exists for that email, we&apos;ve sent a link to reset your password.</p>
          </>
        ) : (
          <>
            <h2 className="dm-h2" style={{ marginBottom: 6 }}>Reset your password</h2>
            <p className="dm-small" style={{ marginBottom: 20 }}>Enter your email and we&apos;ll send you a reset link.</p>
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Input label="Email" type="email" placeholder="you@restaurant.pk" autoComplete="email" required />
              <Btn variant="primary" full type="submit">Send reset link</Btn>
            </form>
          </>
        )}

        <div style={{ marginTop: 20 }}>
          <Link href="/login?mode=login" className="dm-small" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <ChevronLeft size={16} /> Back to log in
          </Link>
        </div>
      </div>
    </div>
  );
}
