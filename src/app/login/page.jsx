"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo, Btn, Input, X } from "@/components/ui";
import { setAuthed } from "@/lib/auth";

// ─── Dedicated full-page Login / Sign up route ────────────────────────────────
// Replaces the old in-page auth modal. Has a real URL (/login) so it can be
// bookmarked, shared, and navigated back to. Supports two query params:
//   ?mode=login|signup  — which tab to open on
//   ?redirect=<path>    — where to send the user after a successful auth
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");

  // Read params after mount (avoids hydration mismatch and a Suspense boundary).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "signup") setMode("signup");
  }, []);

  const finish = () => {
    setAuthed(true);
    const redirect = new URLSearchParams(window.location.search).get("redirect");
    router.replace(redirect && redirect.startsWith("/") ? redirect : "/");
  };

  return (
    <div className="dm-auth-page" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "var(--surface-card)" }}>
      {/* Brand panel */}
      <div className="dm-auth-brand" style={{ background: "var(--grad-navy)", padding: "56px 56px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
        <Link href="/" style={{ textDecoration: "none" }}><Logo light size={28} /></Link>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 700, color: "#fff", lineHeight: 1.1, marginBottom: 16 }}>Design menus worth <span className="dm-brush" style={{ color: "#fff" }}>framing</span>.</h1>
          <p className="dm-body-lg" style={{ color: "var(--text-on-dark)", opacity: 0.7, maxWidth: 360 }}>Browse menus, save favourites, and discover bank discounts across Lahore.</p>
          <div style={{ display: "flex", gap: 20, marginTop: 28, flexWrap: "wrap" }}>
            {[["📍", "Find nearby restaurants"], ["💳", "Bank card deals"], ["❤️", "Save favourites"]].map(([ic, t]) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-on-dark)", opacity: 0.85, fontSize: 12, fontFamily: "var(--font-display)", fontWeight: 600 }}>{ic} {t}</div>
            ))}
          </div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Browsing is always free — no account needed.</div>
        <div style={{ position: "absolute", right: -80, bottom: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,43,0.25), transparent 70%)" }} />
      </div>

      {/* Form panel */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, position: "relative" }}>
        <Link href="/" aria-label="Back to home" style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex" }}><X size={22} /></Link>
        <div style={{ width: "100%", maxWidth: 380 }}>
          {/* Logo for mobile, where the brand panel is hidden */}
          <div className="dm-auth-mobile-logo" style={{ display: "none", marginBottom: 28 }}><Link href="/" style={{ textDecoration: "none" }}><Logo size={28} /></Link></div>

          <div style={{ display: "flex", gap: 4, background: "var(--surface-muted)", borderRadius: "var(--radius-md)", padding: 4, marginBottom: 24 }}>
            {[["signup", "Sign up"], ["login", "Log in"]].map(([id, label]) => (
              <button key={id} onClick={() => setMode(id)} style={{ flex: 1, padding: "10px", border: "none", cursor: "pointer", borderRadius: 9, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, background: mode === id ? "var(--white)" : "transparent", color: mode === id ? "var(--brand)" : "var(--text-secondary)", boxShadow: mode === id ? "var(--shadow-card)" : "none" }}>{label}</button>
            ))}
          </div>

          <h2 className="dm-h2" style={{ marginBottom: 6 }}>{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
          <p className="dm-small" style={{ marginBottom: 20 }}>{mode === "signup" ? "Join Lahore's best food community." : "Log in to manage your menus and favourites."}</p>

          <form onSubmit={(e) => { e.preventDefault(); finish(); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "signup" && <Input label="Full name" placeholder="Hamza Sheikh" autoComplete="name" />}
            <Input label="Email or phone" placeholder="you@restaurant.pk" autoComplete="username" />
            <Input label="Password" type="password" placeholder="••••••••" autoComplete={mode === "signup" ? "new-password" : "current-password"} hint={mode === "signup" ? "At least 8 characters, including a number" : undefined} />
            {mode === "login" && (
              <div style={{ textAlign: "right", marginTop: -4 }}>
                <Link href="/forgot-password" className="dm-small" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>Forgot password?</Link>
              </div>
            )}
            <Btn variant="primary" full type="submit">{mode === "signup" ? "Create account" : "Log in"}</Btn>
          </form>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, color: "var(--text-secondary)", fontSize: 13 }}>
              <div style={{ flex: 1, height: 1, background: "var(--divider)" }} /> or <div style={{ flex: 1, height: 1, background: "var(--divider)" }} />
            </div>
            <button type="button" style={{ width: "100%", padding: "12px 20px", borderRadius: "var(--radius-md)", border: "2px solid var(--border)", background: "var(--white)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }} onClick={finish}>
              <span style={{ fontSize: 18 }}>G</span> Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
