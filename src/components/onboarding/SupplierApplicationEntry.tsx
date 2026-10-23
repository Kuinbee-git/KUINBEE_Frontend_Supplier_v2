"use client";

import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { DashboardButton } from "@/components/dashboard/ui/dashboard-button";
import {
  DashboardInput,
  DashboardField,
} from "@/components/dashboard/ui/dashboard-form";
import { onboardingRequest } from "@/lib/api/supplier-onboarding";
import { SupplierOnboardingShell } from "./SupplierOnboardingShell";
import styles from "./supplier-onboarding.module.css";

export function SupplierApplicationEntry({
  status = false,
}: {
  status?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return (
    <SupplierOnboardingShell>
      <section className={`${styles.panel} ${styles.narrow}`}>
        <p className={styles.eyebrow}>Supplier applications</p>
        <h1 className={styles.title}>
          {status ? "Check your application" : "Become a supplier"}
        </h1>
        <p className={styles.intro}>
          Enter your email for a secure link to{" "}
          {status
            ? "check your status and pick up where you left off"
            : "start and save your application"}
          .
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            setMessage("");
            try {
              const params = new URLSearchParams(window.location.search);
              const result = await onboardingRequest<{ message: string }>(
                "/start",
                {
                  email,
                  source: params.get("source") || "supplier-site",
                  requirementRef:
                    params.get("requirementRef") ||
                    params.get("requirement") ||
                    "",
                }
              );
              setMessage(result.message);
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Could not send your link"
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <DashboardField
            label="Email address"
            description="Use the email you’ll manage your supplier account with."
          >
            {(props) => (
              <DashboardInput
                {...props}
                autoComplete="email"
                type="email"
                value={email}
                placeholder="you@company.com"
                onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
                required
                disabled={busy}
              />
            )}
          </DashboardField>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          {message && (
            <p role="status" className={styles.notice}>
              <Mail className="mr-2 inline size-4" aria-hidden="true" />
              {message}
            </p>
          )}
          <div className={styles.actions}>
            <DashboardButton type="submit" disabled={busy} className="w-full">
              {busy ? "Sending…" : "Email me a secure link"}
              <ArrowRight aria-hidden="true" />
            </DashboardButton>
          </div>
        </form>
        <hr className={styles.divider} />
        <p className={styles.muted}>
          Already have a buyer account? Use a separate supplier email.
        </p>
      </section>
    </SupplierOnboardingShell>
  );
}
