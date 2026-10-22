"use client";
import { useState } from "react";
import { onboardingRequest } from "@/lib/api/supplier-onboarding";
import { SupplierOnboardingShell } from "./SupplierOnboardingShell";
import styles from "./supplier-onboarding.module.css";

export function SupplierApplicationEntry({status = false}: {status?: boolean}) {
  const [email, setEmail] = useState(""); const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(""); const [error, setError] = useState("");
  return <SupplierOnboardingShell><section className={`${styles.panel} ${styles.narrow}`}>
    <p className={styles.eyebrow}>Supplier applications</p><h1 className={styles.title}>{status ? "Check your application" : "Become a supplier"}</h1>
    <p className={styles.intro}>Start with your email. We’ll send a secure link to {status ? "see your status and continue where you left off" : "save your details and tell us about your data capabilities"}.</p>
    <form onSubmit={async e => {e.preventDefault(); setBusy(true); setError(""); try {
      const params = new URLSearchParams(window.location.search);
      const result = await onboardingRequest<{message: string}>("/start", {email, source: params.get("source") || "supplier-site", requirementRef: params.get("requirementRef") || params.get("requirement") || ""});
      setMessage(result.message);
    } catch (err) {setError(err instanceof Error ? err.message : "Could not send your link");} finally {setBusy(false);}}}>
      <label className={styles.field}>Email address<input autoComplete="email" type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={254} required/></label>
      {error && <p role="alert" className={styles.error}>{error}</p>}{message && <p role="status" className={styles.notice}>{message}</p>}
      <div className={styles.actions}><button className={styles.button} disabled={busy}>{busy ? "Sending…" : "Email me a secure link"}</button></div>
    </form><p className={`${styles.muted} mt-6`}>Already have a buyer account? Use a separate supplier email. Your buyer account and orders stay intact.</p>
  </section></SupplierOnboardingShell>;
}
