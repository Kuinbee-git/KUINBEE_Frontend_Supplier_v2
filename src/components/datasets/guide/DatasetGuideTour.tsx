"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ClipboardList,
  FileSpreadsheet,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { DashboardButton, DashboardCard } from "@/components/dashboard";
import { ProposalGuideVisual } from "./ProposalGuideVisuals";
import { CatalogueGuideScreen } from "./CatalogueGuideScreens";
import {
  IMPORT_GUIDE_SCENES,
  PROPOSAL_GUIDE_SCENES,
  guideSelection,
  type GuideFlow,
  type GuideScene,
} from "@/lib/datasets/guide-tour";
import {
  PROPOSAL_DATA_TYPE_GUIDANCE,
  PROPOSAL_SCREEN_WALKTHROUGH,
} from "@/lib/datasets/proposal-guidance";

function subscribeNavigation(listener: () => void) {
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  return () => {
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
  };
}
const readHash = () => window.location.hash;
const serverHash = () => "";

function ScreenIllustration({
  flow,
  index,
  action,
  playing,
}: {
  flow: GuideFlow;
  index: number;
  action: number;
  playing: boolean;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [bounds, setBounds] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  useEffect(() => {
    const root = frame.current;
    const region = root?.querySelector<HTMLElement>(
      `[data-guide-target="${action + 1}"]`
    )?.parentElement;
    if (!root || !region) return;
    const update = () => {
      const outer = root.getBoundingClientRect(),
        inner = region.getBoundingClientRect();
      const next = {
        x: inner.left - outer.left - 5,
        y: inner.top - outer.top - 5,
        width: inner.width + 10,
        height: inner.height + 10,
      };
      setBounds((previous) =>
        previous &&
        Object.keys(next).every(
          (key) =>
            Math.abs(
              previous[key as keyof typeof next] -
                next[key as keyof typeof next]
            ) < 0.5
        )
          ? previous
          : next
      );
    };
    const observer = new ResizeObserver(update);
    observer.observe(root);
    observer.observe(region);
    const raf = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
    };
  }, [action, flow, index]);
  return (
    <div
      ref={frame}
      className="relative min-w-0"
      data-guide-illustration="true"
    >
      {flow === "import" ? (
        <CatalogueGuideScreen step={index} action={action} />
      ) : (
        <ProposalGuideVisual step={index} />
      )}
      {bounds && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <motion.div
            className="absolute rounded-lg border-2 border-[var(--dashboard-action)] shadow-[0_0_0_3px_var(--dashboard-glass-background-soft)]"
            data-guide-spotlight={action + 1}
            animate={{
              left: bounds.x,
              top: bounds.y,
              width: bounds.width,
              height: bounds.height,
            }}
            transition={{ duration: reduced ? 0 : 0.32, ease: "easeInOut" }}
          />
          <motion.div
            data-guide-cursor={action + 1}
            className="absolute z-10 flex items-end"
            animate={{
              left: Math.max(
                10,
                Math.min(
                  bounds.x + bounds.width - 32,
                  bounds.width > 300
                    ? bounds.x + bounds.width * 0.78
                    : bounds.x + bounds.width - 32
                )
              ),
              top: bounds.y + Math.min(bounds.height - 15, 50),
            }}
            transition={{ duration: reduced ? 0 : 0.45, ease: "easeInOut" }}
          >
            <motion.svg
              width="28"
              height="34"
              viewBox="0 0 28 34"
              fill="none"
              animate={{ scale: playing && !reduced ? [1, 0.88, 1] : 1 }}
              transition={{ duration: 0.5 }}
            >
              <path
                d="M4 2L24 21L15 22L20 31L15 33L10 24L4 30V2Z"
                fill="var(--dashboard-action)"
                stroke="var(--dashboard-action-foreground)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </motion.svg>
            <span className="-ml-1 mb-0.5 rounded-full bg-[var(--dashboard-action)] px-2 py-0.5 text-[10px] font-bold text-[var(--dashboard-action-foreground)]">
              {action + 1}
            </span>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function SceneReference({ flow, index }: { flow: GuideFlow; index: number }) {
  if (flow === "import")
    return (
      <a
        href="#template-reference"
        className="inline-flex min-h-10 items-center gap-2 text-sm font-medium underline underline-offset-4"
      >
        <BookOpen className="size-4" />
        Template format and import help
      </a>
    );
  return (
    <details
      className="group min-w-0 rounded-xl border border-border"
      id="screen-reference"
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        Field-by-field help for this screen
        <ChevronDown
          className="size-4 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="divide-y divide-border px-4">
        {PROPOSAL_SCREEN_WALKTHROUGH[index].fields.map(
          ([field, instruction, example]) => (
            <div
              key={field}
              className="grid gap-2 py-4 text-sm sm:grid-cols-[11rem_minmax(0,1fr)]"
            >
              <h3 className="font-semibold">{field}</h3>
              <div>
                <p>{instruction}</p>
                <p className="mt-2 text-muted-foreground">Example: {example}</p>
              </div>
            </div>
          )
        )}
        {index === 2 && (
          <div className="py-4">
            <h3 className="mb-3 text-sm font-semibold">
              Information to prepare for each data type
            </h3>
            <dl className="space-y-3 text-sm">
              {PROPOSAL_DATA_TYPE_GUIDANCE.map(([type, detail]) => (
                <div key={type}>
                  <dt className="font-medium">{type}</dt>
                  <dd className="mt-1 text-muted-foreground">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </details>
  );
}

function GuidedScene({
  flow,
  index,
  scene,
}: {
  flow: GuideFlow;
  index: number;
  scene: GuideScene;
}) {
  const [action, setAction] = useState(0),
    [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (action === scene.actions.length - 1) setPlaying(false);
      else setAction(action + 1);
    }, 3600);
    return () => window.clearTimeout(timer);
  }, [playing, action, scene.actions.length]);
  function select(next: number) {
    setPlaying(false);
    setAction(next);
  }
  return (
    <>
      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <aside
          className="order-first min-w-0 space-y-4 border-b border-border bg-[var(--dashboard-glass-background-soft)] p-4 sm:p-5 lg:order-last lg:border-b-0 lg:border-l"
          aria-label="Cursor walkthrough"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Follow the cursor
            </p>
            <div className="flex gap-1">
              <DashboardButton
                size="compact"
                variant="ghost"
                aria-label={
                  playing
                    ? "Pause cursor walkthrough"
                    : "Play cursor walkthrough"
                }
                aria-pressed={playing}
                onClick={() => {
                  if (!playing && action === scene.actions.length - 1)
                    setAction(0);
                  setPlaying(!playing);
                }}
              >
                {playing ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
                {playing ? "Pause" : "Play"}
              </DashboardButton>
              <DashboardButton
                size="compact"
                variant="ghost"
                aria-label="Replay this screen"
                onClick={() => {
                  setAction(0);
                  setPlaying(true);
                }}
              >
                <RotateCcw className="size-4" />
              </DashboardButton>
            </div>
          </div>
          <ol
            aria-label="Actions on this screen"
            className="grid grid-cols-4 gap-2 lg:grid-cols-1"
          >
            {scene.actions.map(([title], i) => (
              <li key={title}>
                <button
                  type="button"
                  aria-label={`Action ${i + 1}: ${title}`}
                  aria-current={action === i ? "step" : undefined}
                  onClick={() => select(i)}
                  className={`flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border p-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)] lg:justify-start lg:p-3 ${action === i ? "border-[var(--dashboard-action)] bg-[var(--dashboard-control-background)] font-semibold" : "border-transparent text-muted-foreground hover:bg-[var(--dashboard-control-background)]"}`}
                >
                  <span
                    className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs ${action === i ? "bg-[var(--dashboard-action)] text-[var(--dashboard-action-foreground)]" : "border border-border"}`}
                  >
                    {i + 1}
                  </span>
                  <span className="hidden lg:block">{title}</span>
                </button>
              </li>
            ))}
          </ol>
          <div
            aria-live="polite"
            aria-atomic="true"
            data-guide-story-action={action + 1}
            className="space-y-2 lg:min-h-36"
          >
            <p className="text-xs text-muted-foreground">
              Action {action + 1} of {scene.actions.length}
            </p>
            <h3 className="text-sm font-semibold lg:hidden">
              {scene.actions[action][0]}
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              {scene.actions[action][1]}
            </p>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3 lg:hidden">
            <DashboardButton
              size="compact"
              variant="ghost"
              disabled={action === 0}
              onClick={() => select(action - 1)}
              aria-label="Previous action"
            >
              <ArrowLeft className="size-4" />
              Action
            </DashboardButton>
            <DashboardButton
              size="compact"
              variant="ghost"
              disabled={action === scene.actions.length - 1}
              onClick={() => select(action + 1)}
              aria-label="Next action"
            >
              Action
              <ArrowRight className="size-4" />
            </DashboardButton>
          </div>
        </aside>
        <div className="order-last min-w-0 p-4 sm:p-6 lg:order-first">
          <ScreenIllustration
            flow={flow}
            index={index}
            action={action}
            playing={playing}
          />
        </div>
      </div>
      <div className="space-y-4 border-t border-border px-4 py-4 sm:px-6">
        <p className="border-l-2 border-[var(--dashboard-action)] pl-3 text-sm leading-6 text-muted-foreground">
          {scene.takeaway}
        </p>
        <SceneReference flow={flow} index={index} />
      </div>
    </>
  );
}

export function DatasetGuideTour({ children }: { children: ReactNode }) {
  const hash = useSyncExternalStore(subscribeNavigation, readHash, serverHash);
  const { flow, index } = guideSelection(hash);
  const scenes =
    flow === "import" ? IMPORT_GUIDE_SCENES : PROPOSAL_GUIDE_SCENES;
  const scene = scenes[index];
  const reduced = useReducedMotion();
  const [direction, setDirection] = useState(1);
  const focusRequested = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const id = hash.replace(/^#/, "");
    if (
      ![
        "template-reference",
        "prepare",
        "review-process",
        "common-questions",
      ].includes(id)
    )
      return;
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(id);
      if (target instanceof HTMLDetailsElement) {
        target.open = true;
        target.scrollIntoView({
          block: "start",
          behavior: reduced ? "instant" : "smooth",
        });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [hash, reduced]);
  function navigate(nextFlow: GuideFlow, nextIndex: number) {
    setDirection(nextFlow !== flow || nextIndex > index ? 1 : -1);
    focusRequested.current = true;
    const next = (
      nextFlow === "import" ? IMPORT_GUIDE_SCENES : PROPOSAL_GUIDE_SCENES
    )[nextIndex];
    const url = new URL(window.location.href);
    url.hash = next.id;
    window.history.pushState(window.history.state, "", url);
    window.dispatchEvent(new Event("hashchange"));
  }
  return (
    <div className="space-y-8" data-dataset-guide-tour="true">
      <section aria-label="Guided walkthrough" className="space-y-5">
        <div
          role="group"
          aria-label="Choose a walkthrough"
          className="grid gap-3 sm:grid-cols-2"
        >
          {(
            [
              {
                flow: "import",
                title: "Import a catalogue",
                subtitle: "3 screens · Excel or CSV",
                Icon: FileSpreadsheet,
              },
              {
                flow: "proposal",
                title: "Create one proposal",
                subtitle: "4 screens · files and metadata",
                Icon: ClipboardList,
              },
            ] as const
          ).map((item) => (
            <button
              key={item.flow}
              type="button"
              aria-pressed={flow === item.flow}
              onClick={() => navigate(item.flow, 0)}
              className={`flex min-h-18 items-center gap-3 rounded-xl border px-4 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)] ${flow === item.flow ? "border-[var(--dashboard-action)] bg-[var(--dashboard-control-background)]" : "border-border bg-[var(--dashboard-glass-background-soft)] hover:bg-[var(--dashboard-control-background)]"}`}
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${flow === item.flow ? "border-[var(--dashboard-action)] text-[var(--dashboard-action)]" : "border-border text-muted-foreground"}`}
              >
                <item.Icon className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold">
                  {item.title}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {item.subtitle}
                </span>
              </span>
              <span
                className={`ml-auto size-2 shrink-0 rounded-full ${flow === item.flow ? "bg-[var(--dashboard-action)]" : "bg-transparent"}`}
              />
            </button>
          ))}
        </div>
        <nav aria-label="Guide screens">
          <ol
            className={`grid overflow-hidden rounded-xl border border-border ${flow === "import" ? "grid-cols-3" : "grid-cols-4"}`}
          >
            {scenes.map((item, i) => (
              <li
                key={item.id}
                className="min-w-0 border-r border-border last:border-r-0"
              >
                <button
                  type="button"
                  aria-current={i === index ? "step" : undefined}
                  onClick={() => navigate(flow, i)}
                  className={`flex min-h-16 w-full flex-col items-center justify-center gap-1 px-2 py-3 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--dashboard-focus-ring)] sm:flex-row sm:gap-3 ${i === index ? "bg-[var(--dashboard-control-background)] font-semibold" : "text-muted-foreground hover:bg-[var(--dashboard-glass-background-soft)]"}`}
                >
                  <span
                    className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs ${i === index ? "bg-[var(--dashboard-action)] text-[var(--dashboard-action-foreground)]" : "border border-border"}`}
                  >
                    {i + 1}
                  </span>
                  <span className="text-[11px] leading-4 sm:text-sm">
                    {item.shortTitle}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <div className="relative isolate px-0 pb-3 pt-1 sm:px-2">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-5 bottom-0 top-6 -z-10 rounded-2xl border border-border bg-[var(--dashboard-glass-background-soft)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-3 bottom-1.5 top-4 -z-10 rounded-2xl border border-border bg-[var(--dashboard-glass-background-soft)]"
          />
          <DashboardCard
            className="min-w-0 scroll-mt-24 overflow-hidden !p-0"
            data-guide-deck="true"
          >
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.section
                key={scene.id}
                custom={direction}
                data-guide-screen={scene.id}
                aria-labelledby="guide-screen-title"
                initial={{
                  opacity: 0,
                  x: reduced ? 0 : 18 * direction,
                }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: reduced ? 0 : -12 * direction }}
                transition={{ duration: reduced ? 0 : 0.2 }}
                onAnimationComplete={(definition) => {
                  if (
                    typeof definition === "object" &&
                    "opacity" in definition &&
                    definition.opacity === 1 &&
                    focusRequested.current
                  ) {
                    heading.current?.focus({ preventScroll: true });
                    heading.current
                      ?.closest("[data-guide-deck]")
                      ?.scrollIntoView({
                        block: "start",
                        behavior: reduced ? "instant" : "smooth",
                      });
                    focusRequested.current = false;
                  }
                }}
              >
                <header className="space-y-2 border-b border-border px-4 py-5 sm:px-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {flow === "import"
                      ? "Catalogue import"
                      : "Create a proposal"}{" "}
                    · screen {index + 1} of {scenes.length}
                  </p>
                  <h2
                    id="guide-screen-title"
                    ref={heading}
                    tabIndex={-1}
                    className="text-xl font-semibold tracking-tight outline-none sm:text-2xl"
                  >
                    {scene.title}
                  </h2>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    {scene.goal}
                  </p>
                </header>
                <GuidedScene
                  key={scene.id}
                  flow={flow}
                  index={index}
                  scene={scene}
                />
              </motion.section>
            </AnimatePresence>
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-[var(--dashboard-glass-background-soft)] px-4 py-4 sm:px-6">
              <DashboardButton
                variant="outline"
                disabled={index === 0}
                onClick={() => navigate(flow, index - 1)}
              >
                <ArrowLeft className="size-4" />
                Previous screen
              </DashboardButton>
              <span
                role="status"
                className="order-last w-full text-center text-xs text-muted-foreground sm:order-none sm:w-auto"
              >
                Screen {index + 1} of {scenes.length} · example only
              </span>
              {index < scenes.length - 1 ? (
                <DashboardButton onClick={() => navigate(flow, index + 1)}>
                  Next screen
                  <ArrowRight className="size-4" />
                </DashboardButton>
              ) : (
                <DashboardButton asChild>
                  <Link
                    href={
                      flow === "import"
                        ? "/dashboard/datasets/import"
                        : "/dashboard/datasets/create"
                    }
                  >
                    {flow === "import"
                      ? "Open Import catalogue"
                      : "Create my proposal"}
                    <ArrowRight className="size-4" />
                  </Link>
                </DashboardButton>
              )}
            </footer>
          </DashboardCard>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          This walkthrough uses example content. Follow along here; make changes
          in your own workspace when you are ready.
        </p>
      </section>
      {children}
    </div>
  );
}
