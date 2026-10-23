"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DashboardButton } from "@/components/dashboard/ui/dashboard-button";
import { DashboardInput } from "@/components/dashboard/ui/dashboard-form";
import { reloadAt } from "@/lib/utils/reload-navigation";
import {
  onboardingRequest,
  supplierSignOut,
} from "@/lib/api/supplier-onboarding";
import { SupplierOnboardingShell } from "./SupplierOnboardingShell";
import styles from "./supplier-onboarding.module.css";

interface Invitation {
  email: string;
  existingAccount: boolean;
  expiresAt: string;
}
export function SupplierInvitation() {
  const [data, setData] = useState<Invitation | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useRef<Promise<Invitation> | null>(null);
  useEffect(() => {
    if (!load.current)
      load.current = (async () => {
        const token = new URLSearchParams(window.location.hash.slice(1)).get(
          "token"
        );
        if (token) {
          window.history.replaceState(null, "", window.location.pathname);
          await onboardingRequest("/exchange", { token });
        }
        return onboardingRequest<Invitation>("/invitation");
      })();
    let active = true;
    load.current
      .then((value) => {
        if (active) setData(value);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <SupplierOnboardingShell>
      <section className={`${styles.panel} ${styles.narrow}`}>
        <p className={styles.eyebrow}>Secure supplier invitation</p>
        <h1 className={styles.title}>
          {loading ? "Checking invitation…" : "You’re invited"}
        </h1>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        {data && (
          <>
            <p className={styles.intro}>
              Continue as <strong>{data.email}</strong>. Your application
              details will be prefilled. The next step is verification and final
              admin approval.
            </p>
            <p className={styles.muted}>
              Expires {new Date(data.expiresAt).toLocaleDateString()}.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError("");
                if (!data.existingAccount && password !== confirm) {
                  setError("The passwords do not match.");
                  return;
                }
                setBusy(true);
                try {
                  await onboardingRequest(
                    "/invitation/accept",
                    data.existingAccount ? {} : { password }
                  );
                  reloadAt("/onboarding/workspace");
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Unable to accept invitation"
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {data.existingAccount ? (
                <p className={`${styles.notice} mt-6`}>
                  Use your existing supplier account. Sign in first if you
                  haven’t already, then accept the invitation.
                </p>
              ) : (
                <div className="space-y-5 mt-6">
                  <label className={styles.field}>
                    Set a password
                    <DashboardInput
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={12}
                      maxLength={128}
                      required
                    />
                    <small>Use at least 12 characters.</small>
                  </label>
                  <label className={styles.field}>
                    Confirm password
                    <DashboardInput
                      type="password"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      minLength={12}
                      maxLength={128}
                      required
                    />
                  </label>
                </div>
              )}
              <div className={styles.actions}>
                {data.existingAccount && (
                  <DashboardButton asChild variant="outline">
                    <Link href="/auth/login?returnTo=%2Finvitation">
                      Sign in
                    </Link>
                  </DashboardButton>
                )}
                <DashboardButton type="submit" disabled={busy}>
                  {busy
                    ? "Continuing…"
                    : data.existingAccount
                      ? "Accept invitation"
                      : "Activate account"}
                </DashboardButton>
              </div>
            </form>
          </>
        )}
        <div className={styles.actions}>
          <Link className={styles.textButton} href="/application/status">
            Request application status
          </Link>
          <button
            className={styles.textButton}
            onClick={async () => {
              try {
                await supplierSignOut();
                reloadAt("/invitation");
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Unable to sign out"
                );
              }
            }}
          >
            Sign out of current account
          </button>
        </div>
      </section>
    </SupplierOnboardingShell>
  );
}
