"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  KeyRound,
  LogOut,
  Mail,
  ShieldCheck,
} from "lucide-react";

import {
  DashboardButton,
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardDialog,
  DashboardDialogClose,
  DashboardDialogContent,
  DashboardErrorState,
  DashboardFormLayout,
  DashboardInlineAlert,
  DashboardLoadingState,
  DashboardPage,
  DashboardPageHeader,
  DashboardProgress,
  DashboardStatusBadge,
  type DashboardTone,
} from "@/components/dashboard";
import { getOnboardingStatus } from "@/lib/api";
import type {
  OnboardingStatusResponse,
  VerificationStatus,
} from "@/types/onboarding.types";
import { PanVerificationHistory } from "./PanVerificationHistory";

interface SupplierAccountProps {
  fallbackEmail?: string;
  onLogout?: () => void;
}

interface AccountStep {
  description: string;
  label: string;
  status: string;
  tone: DashboardTone;
  complete: boolean;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Failed to load account status.";
}

function verificationTone(status: VerificationStatus): DashboardTone {
  if (status === "VERIFIED") return "success";
  if (status === "FAILED") return "danger";
  if (status === "PENDING") return "warning";
  return "neutral";
}

function accountStatusTone(status: string): DashboardTone {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED" || status === "DELETED") return "danger";
  return "warning";
}

function buildAccountSteps(status: OnboardingStatusResponse): AccountStep[] {
  const { steps } = status.onboarding;
  const items: AccountStep[] = [
    {
      label: "Supplier type",
      description: status.onboarding.supplierType
        ? `${status.onboarding.supplierType.toLowerCase()} account selected`
        : "Account type has not been selected",
      status: steps.supplierTypeSelected ? "Complete" : "Pending",
      tone: steps.supplierTypeSelected ? "success" : "warning",
      complete: steps.supplierTypeSelected,
    },
    {
      label: "Email verification",
      description: steps.emailOtpVerified
        ? "The account email is verified"
        : "Email verification is still required",
      status: steps.emailOtpVerified ? "Verified" : "Pending",
      tone: steps.emailOtpVerified ? "success" : "warning",
      complete: steps.emailOtpVerified,
    },
  ];

  if (steps.individualPan?.required) {
    items.push({
      label: "PAN verification",
      description:
        steps.individualPan.lastErrorCode &&
        steps.individualPan.status === "FAILED"
          ? `Latest error: ${steps.individualPan.lastErrorCode}`
          : "Identity verification for the individual supplier",
      status: steps.individualPan.status.replaceAll("_", " "),
      tone: verificationTone(steps.individualPan.status),
      complete: steps.individualPan.status === "VERIFIED",
    });
  }

  if (steps.manualKyc) {
    items.push({
      label: "Manual verification",
      description: steps.manualKyc.rejectionReason
        ? `Review note: ${steps.manualKyc.rejectionReason}`
        : "Administrative verification of supplier documents",
      status: steps.manualKyc.status,
      tone:
        steps.manualKyc.status === "VERIFIED"
          ? "success"
          : steps.manualKyc.status === "REJECTED"
            ? "danger"
            : "warning",
      complete: steps.manualKyc.status === "VERIFIED",
    });
  }

  items.push({
    label: "Supplier profile",
    description: steps.profileCompleted
      ? "Required supplier details are complete"
      : "The supplier profile still needs information",
    status: steps.profileCompleted ? "Complete" : "Pending",
    tone: steps.profileCompleted ? "success" : "warning",
    complete: steps.profileCompleted,
  });

  return items;
}

export function SupplierAccount({
  fallbackEmail,
  onLogout,
}: SupplierAccountProps) {
  const [onboardingStatus, setOnboardingStatus] =
    React.useState<OnboardingStatusResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const logoutButtonRef = React.useRef<HTMLButtonElement>(null);

  const loadOnboardingStatus = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setOnboardingStatus(await getOnboardingStatus());
    } catch (requestError) {
      console.error("Failed to load onboarding status:", requestError);
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadOnboardingStatus();
  }, [loadOnboardingStatus]);

  if (isLoading) {
    return (
      <DashboardPage width="standard">
        <DashboardPageHeader
          title="Account"
          description="Review account readiness, verification, and session security."
        />
        <DashboardLoadingState label="Loading account settings" />
      </DashboardPage>
    );
  }

  if (error || !onboardingStatus) {
    return (
      <DashboardPage width="standard">
        <DashboardPageHeader
          title="Account"
          description="Review account readiness, verification, and session security."
        />
        <DashboardErrorState
          title="Account status could not be loaded"
          message={error ?? "Account data was not returned."}
          onRetry={() => void loadOnboardingStatus()}
        />
      </DashboardPage>
    );
  }

  const steps = buildAccountSteps(onboardingStatus);
  const completedSteps = steps.filter((step) => step.complete).length;
  const email = onboardingStatus.supplier.email || fallbackEmail;
  const onboardingComplete = onboardingStatus.onboarding.nextStep === "DONE";

  const accountAside = (
    <>
      <DashboardCard>
        <DashboardCardHeader>
          <DashboardCardTitle>Account summary</DashboardCardTitle>
          <DashboardCardDescription>
            Live status returned for this supplier session.
          </DashboardCardDescription>
        </DashboardCardHeader>
        <DashboardCardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Account</span>
            <DashboardStatusBadge
              tone={accountStatusTone(onboardingStatus.supplier.status)}
            >
              {onboardingStatus.supplier.status.replaceAll("_", " ")}
            </DashboardStatusBadge>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Onboarding</span>
            <DashboardStatusBadge
              tone={onboardingComplete ? "success" : "warning"}
            >
              {onboardingComplete ? "Complete" : "In progress"}
            </DashboardStatusBadge>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">User type</span>
            <span className="text-sm font-medium text-foreground">
              {onboardingStatus.supplier.userType}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Session</span>
            <DashboardStatusBadge tone="success">Active</DashboardStatusBadge>
          </div>
        </DashboardCardContent>
      </DashboardCard>

      <DashboardCard>
        <DashboardCardHeader>
          <DashboardCardTitle>Sign out</DashboardCardTitle>
          <DashboardCardDescription>
            End the current supplier session on this device.
          </DashboardCardDescription>
        </DashboardCardHeader>
        <DashboardCardContent>
          <DashboardButton
            ref={logoutButtonRef}
            variant="outline"
            className="w-full"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut aria-hidden="true" />
            Sign out
          </DashboardButton>
        </DashboardCardContent>
      </DashboardCard>
    </>
  );

  return (
    <DashboardPage width="standard">
      <DashboardPageHeader
        title="Account"
        description="Review account readiness, verification, and session security."
        meta={
          <DashboardStatusBadge
            icon={ShieldCheck}
            tone={onboardingComplete ? "success" : "warning"}
          >
            {onboardingComplete ? "Onboarding complete" : "Action required"}
          </DashboardStatusBadge>
        }
      />

      <DashboardFormLayout aside={accountAside} stickyAside>
        <DashboardCard>
          <DashboardCardHeader>
            <DashboardCardTitle>Onboarding readiness</DashboardCardTitle>
            <DashboardCardDescription>
              Required verification and profile steps for this supplier account.
            </DashboardCardDescription>
          </DashboardCardHeader>
          <DashboardCardContent className="space-y-5">
            <DashboardProgress
              label="Onboarding progress"
              value={completedSteps}
              max={steps.length}
            />
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {steps.map((step) => (
                <div
                  key={step.label}
                  className="flex flex-col gap-3 bg-card/35 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {step.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  <DashboardStatusBadge
                    tone={step.tone}
                    icon={step.complete ? CheckCircle2 : undefined}
                  >
                    {step.status}
                  </DashboardStatusBadge>
                </div>
              ))}
            </div>
          </DashboardCardContent>
        </DashboardCard>

        {onboardingStatus.onboarding.supplierType === "INDIVIDUAL" &&
        onboardingStatus.onboarding.steps.individualPan?.required ? (
          <PanVerificationHistory />
        ) : null}

        <DashboardCard>
          <DashboardCardHeader>
            <DashboardCardTitle>Email address</DashboardCardTitle>
            <DashboardCardDescription>
              The email attached to this supplier account.
            </DashboardCardDescription>
          </DashboardCardHeader>
          <DashboardCardContent>
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card/35 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <Mail className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-foreground">
                    {email ?? "Email unavailable"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Used for sign-in and supplier notifications.
                  </p>
                </div>
              </div>
              <DashboardStatusBadge
                tone={
                  onboardingStatus.supplier.emailVerified
                    ? "success"
                    : "warning"
                }
              >
                {onboardingStatus.supplier.emailVerified
                  ? "Verified"
                  : "Not verified"}
              </DashboardStatusBadge>
            </div>
          </DashboardCardContent>
        </DashboardCard>

        <DashboardCard>
          <DashboardCardHeader>
            <DashboardCardTitle>Password and security</DashboardCardTitle>
            <DashboardCardDescription>
              Recover access securely without showing a false password-update
              state.
            </DashboardCardDescription>
          </DashboardCardHeader>
          <DashboardCardContent className="space-y-4">
            <DashboardInlineAlert
              tone="info"
              icon={KeyRound}
              title="Password changes are handled through account recovery"
              message="A direct password-change action is not currently available in the supplier workspace. Use the verified recovery flow if you need a new password."
            />
            <DashboardButton asChild variant="outline">
              <Link href="/auth/forgot-password">Reset password securely</Link>
            </DashboardButton>
          </DashboardCardContent>
        </DashboardCard>
      </DashboardFormLayout>

      <DashboardDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
      >
        <DashboardDialogContent
          size="sm"
          title="Sign out of the supplier portal?"
          description="You will need to sign in again to access datasets, proposals, and account settings."
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            logoutButtonRef.current?.focus();
          }}
          footer={
            <>
              <DashboardDialogClose asChild>
                <DashboardButton variant="outline">Cancel</DashboardButton>
              </DashboardDialogClose>
              <DashboardButton variant="destructive" onClick={onLogout}>
                <LogOut aria-hidden="true" />
                Sign out
              </DashboardButton>
            </>
          }
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Unsaved work on other open supplier pages may be lost.
          </p>
        </DashboardDialogContent>
      </DashboardDialog>
    </DashboardPage>
  );
}
