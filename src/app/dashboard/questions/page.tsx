"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
} from "lucide-react";

import {
  DashboardButton,
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardEmptyState,
  DashboardErrorState,
  DashboardField,
  DashboardInlineAlert,
  DashboardLoadingState,
  DashboardMetricCard,
  DashboardPage,
  DashboardPageHeader,
  DashboardStatusBadge,
  DashboardTextarea,
} from "@/components/dashboard";
import {
  answerDatasetQuestion,
  getDatasetQuestions,
  listMyDatasets,
} from "@/lib/api/datasets";
import { cn } from "@/lib/utils";
import type {
  DatasetQuestion,
  PublishedDatasetListItem,
} from "@/types/dataset.types";

type DatasetQuestionBucket = {
  dataset: PublishedDatasetListItem;
  questions: DatasetQuestion[];
};

type ReplyFeedback = {
  message: string;
  tone: "danger" | "success";
};

const FETCH_PAGE_SIZE = 100;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function fetchAllSupplierDatasets() {
  const datasets: PublishedDatasetListItem[] = [];
  let page = 1;
  let fetched = 0;
  let total = 0;

  do {
    const response = await listMyDatasets({
      page,
      pageSize: FETCH_PAGE_SIZE,
      status: "PUBLISHED",
      visibility: "PUBLIC",
    });
    const items = response.items ?? [];
    datasets.push(...items);
    fetched += items.length;
    total = response.total ?? 0;
    if (items.length === 0) break;
    page += 1;
  } while (fetched < total);

  return datasets;
}

async function fetchAllDatasetQuestions(datasetId: string) {
  const questions: DatasetQuestion[] = [];
  let page = 1;
  let fetched = 0;
  let total = 0;

  do {
    const response = await getDatasetQuestions(datasetId, {
      page,
      pageSize: FETCH_PAGE_SIZE,
    });
    const items = response.items ?? [];
    questions.push(...items);
    fetched += items.length;
    total = response.total ?? 0;
    if (items.length === 0) break;
    page += 1;
  } while (fetched < total);

  return questions;
}

export default function SupplierQuestionsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [partialFailureCount, setPartialFailureCount] = useState(0);
  const [buckets, setBuckets] = useState<DatasetQuestionBucket[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(
    null
  );
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(
    null
  );
  const [replyFeedback, setReplyFeedback] = useState<
    Record<string, ReplyFeedback>
  >({});

  const loadQuestions = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") {
      setLoading(true);
      setLoadError(null);
    } else {
      setRefreshing(true);
      setRefreshError(null);
    }
    setPartialFailureCount(0);

    try {
      const datasets = await fetchAllSupplierDatasets();
      const results = await Promise.allSettled(
        datasets.map(async (dataset) => ({
          dataset,
          questions: await fetchAllDatasetQuestions(dataset.id),
        }))
      );
      const failedCount = results.filter(
        (result) => result.status === "rejected"
      ).length;

      if (datasets.length > 0 && failedCount === datasets.length) {
        throw new Error("Questions could not be loaded for your datasets.");
      }

      const nextBuckets = results
        .filter(
          (result): result is PromiseFulfilledResult<DatasetQuestionBucket> =>
            result.status === "fulfilled" && result.value.questions.length > 0
        )
        .map((result) => result.value);

      setBuckets(nextBuckets);
      setPartialFailureCount(failedCount);
      setSelectedDatasetId((current) => {
        if (
          current &&
          nextBuckets.some(({ dataset }) => dataset.id === current)
        ) {
          return current;
        }
        return nextBuckets[0]?.dataset.id ?? null;
      });
    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        "Buyer questions could not be loaded."
      );
      if (mode === "initial") setLoadError(message);
      else setRefreshError(message);
    } finally {
      if (mode === "initial") setLoading(false);
      else setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadQuestions("initial");
  }, [loadQuestions]);

  const selected = useMemo(
    () =>
      buckets.find(({ dataset }) => dataset.id === selectedDatasetId) ?? null,
    [buckets, selectedDatasetId]
  );

  const totalQuestions = useMemo(
    () => buckets.reduce((sum, bucket) => sum + bucket.questions.length, 0),
    [buckets]
  );
  const unansweredCount = useMemo(
    () =>
      buckets.reduce(
        (sum, bucket) =>
          sum +
          bucket.questions.filter((question) => question.answers.length === 0)
            .length,
        0
      ),
    [buckets]
  );
  const answeredCount = totalQuestions - unansweredCount;

  const handleAnswer = async (
    event: FormEvent<HTMLFormElement>,
    questionId: string
  ) => {
    event.preventDefault();
    const answer = (answerDrafts[questionId] ?? "").trim();

    if (!answer) {
      setReplyFeedback((current) => ({
        ...current,
        [questionId]: {
          tone: "danger",
          message: "Enter a reply before sending it.",
        },
      }));
      return;
    }

    setAnsweringQuestionId(questionId);
    setReplyFeedback((current) => {
      const next = { ...current };
      delete next[questionId];
      return next;
    });

    try {
      const response = await answerDatasetQuestion(questionId, { answer });
      setBuckets((current) =>
        current.map((bucket) => ({
          ...bucket,
          questions: bucket.questions.map((question) =>
            question.id === questionId
              ? {
                  ...question,
                  answers: [...question.answers, response.answer],
                }
              : question
          ),
        }))
      );
      setAnswerDrafts((current) => ({ ...current, [questionId]: "" }));
      setReplyFeedback((current) => ({
        ...current,
        [questionId]: {
          tone: "success",
          message: "Your response was posted.",
        },
      }));
    } catch (error: unknown) {
      setReplyFeedback((current) => ({
        ...current,
        [questionId]: {
          tone: "danger",
          message: getErrorMessage(error, "Your response could not be posted."),
        },
      }));
    } finally {
      setAnsweringQuestionId(null);
    }
  };

  return (
    <DashboardPage width="wide">
      <DashboardPageHeader
        title="Questions"
        description="Respond to buyer questions across your marketplace datasets."
        actions={
          <DashboardButton
            variant="outline"
            onClick={() => void loadQuestions("refresh")}
            disabled={loading || refreshing}
          >
            <RefreshCw
              className={cn(
                refreshing && "animate-spin motion-reduce:animate-none"
              )}
              aria-hidden="true"
            />
            Refresh
          </DashboardButton>
        }
      />

      {loadError ? (
        <DashboardErrorState
          title="Questions could not be loaded"
          message={loadError}
          onRetry={() => void loadQuestions("initial")}
        />
      ) : loading ? (
        <DashboardLoadingState
          label="Loading buyer questions"
          variant="skeleton"
          rows={6}
        />
      ) : buckets.length === 0 && partialFailureCount > 0 ? (
        <DashboardErrorState
          title="Questions are temporarily unavailable"
          message={`Questions from ${partialFailureCount} ${partialFailureCount === 1 ? "dataset could" : "datasets could"} not be checked.`}
          onRetry={() => void loadQuestions("initial")}
        />
      ) : buckets.length === 0 ? (
        <DashboardEmptyState
          icon={MessageSquare}
          title="No questions yet"
          description="Buyer questions will appear here after they are submitted on your marketplace datasets."
        />
      ) : (
        <>
          <section
            aria-label="Question summary"
            className="grid gap-4 sm:grid-cols-3"
          >
            <DashboardMetricCard
              label="Total questions"
              value={totalQuestions}
              supportingText={`Across ${buckets.length} ${buckets.length === 1 ? "dataset" : "datasets"}`}
            />
            <DashboardMetricCard
              label="Awaiting reply"
              value={unansweredCount}
              supportingText="Buyer questions needing attention"
              status={unansweredCount > 0 ? "Action needed" : "All clear"}
              statusTone={unansweredCount > 0 ? "warning" : "success"}
            />
            <DashboardMetricCard
              label="Answered"
              value={answeredCount}
              supportingText="Questions with at least one response"
            />
          </section>

          {refreshError ? (
            <DashboardInlineAlert
              tone="danger"
              title="Questions could not be refreshed"
              message={refreshError}
              action={
                <DashboardButton
                  variant="outline"
                  size="compact"
                  onClick={() => void loadQuestions("refresh")}
                >
                  Try again
                </DashboardButton>
              }
            />
          ) : null}

          {partialFailureCount > 0 ? (
            <DashboardInlineAlert
              tone="warning"
              title="Some datasets could not be checked"
              message={`Questions from ${partialFailureCount} ${partialFailureCount === 1 ? "dataset are" : "datasets are"} temporarily unavailable.`}
              action={
                <DashboardButton
                  variant="outline"
                  size="compact"
                  onClick={() => void loadQuestions("refresh")}
                  disabled={refreshing}
                >
                  Retry
                </DashboardButton>
              }
            />
          ) : null}

          <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <DashboardCard className="min-w-0 lg:sticky lg:top-6">
              <DashboardCardHeader>
                <DashboardCardTitle>Datasets</DashboardCardTitle>
                <DashboardCardDescription>
                  Choose a dataset to review its conversations.
                </DashboardCardDescription>
              </DashboardCardHeader>
              <DashboardCardContent className="grid gap-2 p-3 md:p-3">
                {buckets.map((bucket) => {
                  const active = bucket.dataset.id === selectedDatasetId;
                  const pending = bucket.questions.filter(
                    (question) => question.answers.length === 0
                  ).length;

                  return (
                    <button
                      key={bucket.dataset.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedDatasetId(bucket.dataset.id)}
                      className={cn(
                        "rounded-lg border px-3 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)] motion-reduce:transition-none",
                        active
                          ? "border-[var(--dashboard-control-border-strong)] bg-muted text-foreground"
                          : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/55 hover:text-foreground"
                      )}
                    >
                      <span className="block truncate text-sm font-semibold">
                        {bucket.dataset.title}
                      </span>
                      <span className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs">
                          {bucket.questions.length} question
                          {bucket.questions.length === 1 ? "" : "s"}
                        </span>
                        {pending > 0 ? (
                          <DashboardStatusBadge tone="warning">
                            {pending} pending
                          </DashboardStatusBadge>
                        ) : (
                          <DashboardStatusBadge tone="success">
                            Answered
                          </DashboardStatusBadge>
                        )}
                      </span>
                    </button>
                  );
                })}
              </DashboardCardContent>
            </DashboardCard>

            {selected ? (
              <DashboardCard className="min-w-0">
                <DashboardCardHeader className="sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <DashboardCardTitle className="truncate">
                      {selected.dataset.title}
                    </DashboardCardTitle>
                    <DashboardCardDescription className="mt-1 font-mono">
                      {selected.dataset.datasetUniqueId}
                    </DashboardCardDescription>
                  </div>
                  <DashboardStatusBadge tone="neutral">
                    {selected.questions.length} question
                    {selected.questions.length === 1 ? "" : "s"}
                  </DashboardStatusBadge>
                </DashboardCardHeader>
                <DashboardCardContent className="grid gap-4">
                  {selected.questions.map((question) => {
                    const unanswered = question.answers.length === 0;
                    const feedback = replyFeedback[question.id];
                    const answering = answeringQuestionId === question.id;

                    return (
                      <article
                        key={question.id}
                        className="rounded-xl border border-border bg-card/65 p-4 shadow-sm dark:shadow-none md:p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MessageSquare
                                className="size-3.5"
                                aria-hidden="true"
                              />
                              <span>
                                Asked {formatDateTime(question.createdAt)}
                              </span>
                            </div>
                            <h3 className="mt-2 text-sm font-semibold leading-6 text-foreground">
                              {question.question}
                            </h3>
                          </div>
                          <DashboardStatusBadge
                            tone={unanswered ? "warning" : "success"}
                            icon={unanswered ? Clock3 : CheckCircle2}
                          >
                            {unanswered ? "Awaiting reply" : "Answered"}
                          </DashboardStatusBadge>
                        </div>

                        {question.answers.length > 0 ? (
                          <div className="mt-4 grid gap-3 border-l-2 border-border pl-4">
                            {question.answers.map((answer) => (
                              <div
                                key={answer.id}
                                className="rounded-lg bg-muted/45 p-3.5"
                              >
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                  <span className="font-semibold text-foreground">
                                    Your response
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <time dateTime={answer.createdAt}>
                                    {formatDateTime(answer.createdAt)}
                                  </time>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                                  {answer.answer}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <form
                          className="mt-5 grid gap-3 border-t border-border pt-4"
                          onSubmit={(event) =>
                            void handleAnswer(event, question.id)
                          }
                        >
                          {feedback?.tone === "success" ? (
                            <DashboardInlineAlert
                              tone="success"
                              live="polite"
                              message={feedback.message}
                            />
                          ) : null}
                          <DashboardField
                            id={`question-reply-${question.id}`}
                            label={
                              unanswered ? "Your reply" : "Add another response"
                            }
                            error={
                              feedback?.tone === "danger"
                                ? feedback.message
                                : undefined
                            }
                            required
                          >
                            {(controlProps) => (
                              <DashboardTextarea
                                {...controlProps}
                                value={answerDrafts[question.id] ?? ""}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  setAnswerDrafts((current) => ({
                                    ...current,
                                    [question.id]: value,
                                  }));
                                  if (replyFeedback[question.id]) {
                                    setReplyFeedback((current) => {
                                      const next = { ...current };
                                      delete next[question.id];
                                      return next;
                                    });
                                  }
                                }}
                                placeholder="Write a clear response for the buyer"
                                disabled={answering}
                                rows={3}
                              />
                            )}
                          </DashboardField>
                          <div className="flex justify-end">
                            <DashboardButton
                              type="submit"
                              disabled={
                                answering ||
                                !(answerDrafts[question.id] ?? "").trim()
                              }
                            >
                              {answering ? (
                                <Loader2
                                  className="animate-spin motion-reduce:animate-none"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Send aria-hidden="true" />
                              )}
                              {answering ? "Posting…" : "Post response"}
                            </DashboardButton>
                          </div>
                        </form>
                      </article>
                    );
                  })}
                </DashboardCardContent>
              </DashboardCard>
            ) : (
              <DashboardEmptyState
                title="Select a dataset"
                description="Choose a dataset to view its buyer questions."
              />
            )}
          </div>
        </>
      )}
    </DashboardPage>
  );
}
