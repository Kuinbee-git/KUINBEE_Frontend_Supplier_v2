import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  Database,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  DashboardButton,
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardInlineAlert,
  DashboardPage,
  DashboardPageHeader,
  DashboardSection,
  DashboardStatusBadge,
} from "@/components/dashboard";

const workspaceGuides = [
  {
    href: "/dashboard/profile",
    title: "Supplier profile",
    description:
      "Review business identity, contact details, contract status, and marketplace logo.",
    icon: UserRound,
  },
  {
    href: "/dashboard/datasets/create",
    title: "Create a dataset proposal",
    description:
      "Start a structured proposal and prepare dataset details for marketplace review.",
    icon: Database,
  },
  {
    href: "/dashboard/account",
    title: "Account and verification",
    description:
      "Check onboarding progress, account state, email verification, and session security.",
    icon: ShieldCheck,
  },
  {
    href: "/dashboard/discount-campaigns",
    title: "Dataset promotions",
    description:
      "Review eligible datasets and manage approved marketplace promotions.",
    icon: BadgePercent,
  },
];

export default function SupportPage() {
  return (
    <DashboardPage width="standard">
      <DashboardPageHeader
        title="Support"
        description="Get help with the supplier portal through verified Kuinbee support channels."
        meta={
          <DashboardStatusBadge tone="success">
            Verified contact details
          </DashboardStatusBadge>
        }
      />

      <DashboardInlineAlert
        tone="info"
        title="Include useful context"
        message="When contacting support, include your supplier email, the affected dataset or proposal ID, and a short description of what you expected to happen. Do not send passwords or OTP codes."
      />

      <DashboardSection
        surface="plain"
        title="Contact Kuinbee"
        description="Use email for detailed requests or call during business hours for urgent account and security issues."
      >
        <div className="grid gap-[var(--dashboard-grid-gap)] md:grid-cols-2">
          <DashboardCard>
            <DashboardCardHeader className="sm:flex-row sm:items-start sm:justify-between">
              <div>
                <DashboardCardTitle>Email support</DashboardCardTitle>
                <DashboardCardDescription>
                  Best for account, dataset, proposal, and technical questions.
                </DashboardCardDescription>
              </div>
              <span className="dashboard-tone-info flex size-10 shrink-0 items-center justify-center rounded-lg border">
                <Mail className="size-5" aria-hidden="true" />
              </span>
            </DashboardCardHeader>
            <DashboardCardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  support@kuinbee.com
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Email responses are generally provided within 24 hours.
                </p>
              </div>
              <DashboardButton asChild>
                <a href="mailto:support@kuinbee.com?subject=Supplier%20portal%20support">
                  <Mail aria-hidden="true" />
                  Email support
                </a>
              </DashboardButton>
            </DashboardCardContent>
          </DashboardCard>

          <DashboardCard>
            <DashboardCardHeader className="sm:flex-row sm:items-start sm:justify-between">
              <div>
                <DashboardCardTitle>Phone support</DashboardCardTitle>
                <DashboardCardDescription>
                  Verified UK and India contact numbers for urgent help.
                </DashboardCardDescription>
              </div>
              <span className="dashboard-tone-neutral flex size-10 shrink-0 items-center justify-center rounded-lg border">
                <Phone className="size-5" aria-hidden="true" />
              </span>
            </DashboardCardHeader>
            <DashboardCardContent className="space-y-4">
              <div className="space-y-1 text-sm">
                <p className="text-foreground">UK: +44 7825 600683</p>
                <p className="text-foreground">India: +91 77961 37098</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <DashboardButton asChild variant="outline">
                  <a href="tel:+447825600683">Call UK</a>
                </DashboardButton>
                <DashboardButton asChild variant="outline">
                  <a href="tel:+917796137098">Call India</a>
                </DashboardButton>
              </div>
            </DashboardCardContent>
          </DashboardCard>
        </div>
      </DashboardSection>

      <DashboardSection
        surface="plain"
        title="Workspace guides"
        description="Go directly to the part of the supplier portal related to your question."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {workspaceGuides.map((guide) => {
            const Icon = guide.icon;
            return (
              <Link
                key={guide.href}
                href={guide.href}
                className="dashboard-glass-card group flex min-w-0 items-start gap-4 rounded-xl border border-border p-4 outline-none transition-[background-color,border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-[var(--dashboard-control-border-strong)] hover:shadow-[var(--dashboard-card-hover-shadow)] focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none motion-reduce:transition-none"
              >
                <span className="dashboard-tone-neutral flex size-10 shrink-0 items-center justify-center rounded-lg border">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">
                    {guide.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {guide.description}
                  </span>
                </span>
                <ArrowRight
                  className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      </DashboardSection>

      <DashboardCard>
        <DashboardCardHeader>
          <DashboardCardTitle>Before you contact support</DashboardCardTitle>
          <DashboardCardDescription>
            A few details help the team diagnose an issue faster.
          </DashboardCardDescription>
        </DashboardCardHeader>
        <DashboardCardContent>
          <ul className="grid gap-3 text-sm leading-6 text-muted-foreground sm:grid-cols-2">
            <li className="rounded-lg border border-border bg-card/35 px-4 py-3">
              Copy the dataset, proposal, campaign, or requirement reference.
            </li>
            <li className="rounded-lg border border-border bg-card/35 px-4 py-3">
              Note the page and the action that failed.
            </li>
            <li className="rounded-lg border border-border bg-card/35 px-4 py-3">
              Include the exact error message and when it occurred.
            </li>
            <li className="rounded-lg border border-border bg-card/35 px-4 py-3">
              Remove passwords, OTPs, and sensitive dataset content.
            </li>
          </ul>
        </DashboardCardContent>
      </DashboardCard>
    </DashboardPage>
  );
}
