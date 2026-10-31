import Link from "next/link";
import { DATASET_PREPARATION_ENABLED } from "@/lib/dataset-preparation-environment";
import { PROPOSAL_GUIDE_PATH } from "@/lib/datasets/proposal-guidance";
import { CATALOGUE_IMPORT_GUIDE_PATH } from "@/lib/datasets/catalogue-import-guidance";
import {
  ArrowRight,
  BadgePercent,
  Database,
  FileUp,
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
  DashboardRegion,
  DashboardWorkspace,
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
    href: DATASET_PREPARATION_ENABLED
      ? PROPOSAL_GUIDE_PATH
      : "/dashboard/datasets/create",
    title: DATASET_PREPARATION_ENABLED
      ? "Dataset proposal guide"
      : "Create a dataset proposal",
    description: DATASET_PREPARATION_ENABLED
      ? "Learn what to prepare, how to save and upload, and what happens during review and publication."
      : "Start a structured proposal and prepare dataset details for marketplace review.",
    icon: Database,
  },
  {
    href: CATALOGUE_IMPORT_GUIDE_PATH,
    title: "Excel and CSV import guide",
    description:
      "Follow the template, match existing collections, preview changes and save private drafts.",
    icon: FileUp,
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
      <DashboardWorkspace>
        <DashboardRegion>
          <DashboardInlineAlert
            tone="info"
            title="Include useful context"
            message="When contacting support, include your supplier email, the affected dataset or proposal ID, and a short description of what you expected to happen. Do not send passwords or OTP codes."
          />
        </DashboardRegion>

        <DashboardSection
          surface="plain"
          className="px-4 py-5 md:px-6"
          title="Contact Kuinbee"
          description="Use email for detailed requests or call during business hours for urgent account and security issues."
        >
          <div className="grid gap-[var(--dashboard-grid-gap)] md:grid-cols-2">
            <DashboardCard className="rounded-none border-0">
              <DashboardCardHeader className="sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <DashboardCardTitle>Email support</DashboardCardTitle>
                  <DashboardCardDescription>
                    Best for account, dataset, proposal, and technical
                    questions.
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

            <DashboardCard className="rounded-none border-0">
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
          className="px-4 py-5 md:px-6"
          title="Workspace guides"
          description="Go directly to the part of the supplier portal related to your question."
        >
          <div className="grid gap-x-6 md:grid-cols-2">
            {workspaceGuides.map((guide) => {
              const Icon = guide.icon;
              return (
                <Link
                  key={guide.href}
                  href={guide.href}
                  className="group flex min-w-0 items-start gap-4 border-b border-border py-4 outline-none transition-colors duration-150 hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
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

        <DashboardCard className="rounded-none border-0">
          <DashboardCardHeader>
            <DashboardCardTitle>Before you contact support</DashboardCardTitle>
            <DashboardCardDescription>
              A few details help the team diagnose an issue faster.
            </DashboardCardDescription>
          </DashboardCardHeader>
          <DashboardCardContent>
            <ul className="grid list-disc gap-x-8 gap-y-3 pl-4 text-sm leading-6 text-muted-foreground sm:grid-cols-2">
              <li>
                Copy the dataset, proposal, campaign, or requirement reference.
              </li>
              <li>Note the page and the action that failed.</li>
              <li>Include the exact error message and when it occurred.</li>
              <li>Remove passwords, OTPs, and sensitive dataset content.</li>
            </ul>
          </DashboardCardContent>
        </DashboardCard>
      </DashboardWorkspace>
    </DashboardPage>
  );
}
