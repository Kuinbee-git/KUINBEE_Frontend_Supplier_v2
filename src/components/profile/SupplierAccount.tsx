"use client";
import { useState } from "react";
import Link from "next/link";
import { changeSupplierPassword } from "@/lib/api/auth";
import { supplierSignOut } from "@/lib/api/supplier-onboarding";
import { reloadAt } from "@/lib/utils/reload-navigation";
import styles from "@/components/onboarding/supplier-onboarding.module.css";

export function SupplierAccount({fallbackEmail, onLogout}: {fallbackEmail?: string; onLogout?: () => void | Promise<void>}) {
  const [currentPassword, setCurrentPassword] = useState(""); const [newPassword, setNewPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  return <div className="max-w-4xl mx-auto p-5 md:p-8 space-y-6"><h1 className="text-3xl font-semibold">Account & security</h1><p className={styles.muted}>{fallbackEmail}</p>
    <section className={styles.panel}><h2 className={styles.sectionTitle}>Supplier profile and verification</h2><p className={styles.muted}>Your full identity, capabilities, private documents and review history are in your supplier profile. Sensitive changes are submitted for review.</p><div className={styles.actions}><Link className={styles.secondary} href="/dashboard/profile">View complete own profile</Link></div></section>
    <section className={styles.panel}><h2 className={styles.sectionTitle}>Change password</h2><form onSubmit={async e => {e.preventDefault();setError("");setNotice("");if (newPassword !== confirm) {setError("The new passwords do not match.");return;}setBusy(true);try {await changeSupplierPassword({currentPassword,newPassword});setCurrentPassword("");setNewPassword("");setConfirm("");setNotice("Password changed.");} catch (err) {setError(err instanceof Error ? err.message : "Could not change password");}finally {setBusy(false);}}}>
      <div className="space-y-5 max-w-md mt-6"><label className={styles.field}>Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required maxLength={128}/></label><label className={styles.field}>New password<input type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={12} maxLength={128}/></label><label className={styles.field}>Confirm new password<input type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={12} maxLength={128}/></label></div>
      <div className={styles.actions}><button disabled={busy} className={styles.button}>{busy ? "Saving…" : "Change password"}</button></div>
    </form></section>
    {error && <p role="alert" className={styles.error}>{error}</p>}{notice && <p role="status" className={styles.notice}>{notice}</p>}
    <button disabled={busy} className={styles.secondary} onClick={async () => {setBusy(true);try {if (onLogout) await onLogout();else {await supplierSignOut();reloadAt("/auth/login");}} catch (err) {setError(err instanceof Error ? err.message : "Could not sign out");setBusy(false);}}}>Sign out</button>
  </div>;
}
