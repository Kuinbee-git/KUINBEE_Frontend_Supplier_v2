"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import { answerDatasetQuestion, getDatasetQuestions, listMyDatasets } from "@/lib/api/datasets";
import type { DatasetQuestion, PublishedDatasetListItem } from "@/types/dataset.types";
import { MessageSquare, Send, CheckCircle2, Clock, Loader2 } from "lucide-react";

type DatasetQuestionBucket = {
  dataset: PublishedDatasetListItem;
  questions: DatasetQuestion[];
};

export default function SupplierQuestionsPage() {
  const tokens = useSupplierTokens();
  const [loading, setLoading] = useState(true);
  const [buckets, setBuckets] = useState<DatasetQuestionBucket[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const datasetsResponse = await listMyDatasets();
      const datasets = datasetsResponse.items;

      const bucketsPromises = datasets.map(async (dataset) => {
        try {
          const questionsResponse = await getDatasetQuestions(dataset.id);
          return {
            dataset,
            questions: questionsResponse.items || []
          };
        } catch (error) {
          console.error(`Failed to fetch questions for dataset ${dataset.id}:`, error);
          return { dataset, questions: [] };
        }
      });

      const allBuckets = await Promise.all(bucketsPromises);
      const filtered = allBuckets.filter((item) => item.questions.length > 0);
      
      setBuckets(filtered);
      if (!selectedDatasetId && filtered.length > 0) {
        setSelectedDatasetId(filtered[0].dataset.id);
      }
    } catch (error) {
      console.error("Failed to fetch questions data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selected = useMemo(
    () => buckets.find((b) => b.dataset.id === selectedDatasetId) || null,
    [buckets, selectedDatasetId]
  );

  // Stats
  const totalQuestions = buckets.reduce((sum, b) => sum + b.questions.length, 0);
  const unansweredCount = buckets.reduce(
    (sum, b) => sum + b.questions.filter((q) => q.answers.length === 0).length,
    0
  );

  const handleAnswer = async (questionId: string) => {
    const answer = (answerDrafts[questionId] || "").trim();
    if (!answer) return;

    try {
      setAnsweringQuestionId(questionId);
      await answerDatasetQuestion(questionId, { answer });
      setAnswerDrafts((prev) => ({ ...prev, [questionId]: "" }));
      await fetchData();
    } finally {
      setAnsweringQuestionId(null);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-7 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold mb-1" style={{ color: tokens.textPrimary }}>
            Questions
          </h1>
          <p className="text-sm" style={{ color: tokens.textSecondary }}>
            Respond to buyer questions across your datasets
          </p>
        </div>
        {!loading && buckets.length > 0 && (
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: tokens.infoBg, border: `1px solid ${tokens.infoBorder}` }}
            >
              <MessageSquare size={14} style={{ color: tokens.textMuted }} />
              <span className="text-xs font-medium" style={{ color: tokens.textSecondary }}>
                {totalQuestions} total
              </span>
            </div>
            {unansweredCount > 0 && (
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: tokens.warningBg, border: `1px solid ${tokens.warningBorder}` }}
              >
                <Clock size={14} style={{ color: tokens.warningText }} />
                <span className="text-xs font-medium" style={{ color: tokens.warningText }}>
                  {unansweredCount} awaiting reply
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <GlassCard className="p-12 flex items-center justify-center">
          <Loader2 className="animate-spin mr-3" size={20} style={{ color: tokens.textMuted }} />
          <span style={{ color: tokens.textMuted }}>Loading questions…</span>
        </GlassCard>
      ) : buckets.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <MessageSquare size={40} className="mx-auto mb-4" style={{ color: tokens.textMuted, opacity: 0.4 }} />
          <p className="text-base font-medium mb-1" style={{ color: tokens.textPrimary }}>
            No questions yet
          </p>
          <p className="text-sm" style={{ color: tokens.textMuted }}>
            Questions from buyers will appear here once your datasets are published
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 h-[calc(100vh-220px)]">
          {/* Dataset Sidebar */}
          <GlassCard className="p-3 overflow-auto">
            <div className="px-1 py-2 mb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: tokens.textMuted }}>
                Datasets ({buckets.length})
              </h2>
            </div>
            <div className="space-y-1.5">
              {buckets.map((bucket) => {
                const isActive = bucket.dataset.id === selectedDatasetId;
                const unanswered = bucket.questions.filter((q) => q.answers.length === 0).length;

                return (
                  <button
                    key={bucket.dataset.id}
                    onClick={() => setSelectedDatasetId(bucket.dataset.id)}
                    className="w-full text-left rounded-lg p-3 transition-all duration-200"
                    style={{
                      background: isActive ? tokens.navItemActive : "transparent",
                      border: `1px solid ${isActive ? tokens.borderDefault : "transparent"}`,
                    }}
                  >
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: tokens.textPrimary }}
                    >
                      {bucket.dataset.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs" style={{ color: tokens.textMuted }}>
                        {bucket.questions.length} question{bucket.questions.length === 1 ? "" : "s"}
                      </span>
                      {unanswered > 0 && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: tokens.warningBg, color: tokens.warningText }}
                        >
                          {unanswered} pending
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Question Detail Panel */}
          <GlassCard className="p-5 overflow-auto">
            {!selected ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm" style={{ color: tokens.textMuted }}>
                  Select a dataset to view questions
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: `1px solid ${tokens.borderSubtle}` }}>
                  <div>
                    <h2 className="text-base font-semibold" style={{ color: tokens.textPrimary }}>
                      {selected.dataset.title}
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: tokens.textMuted }}>
                      {selected.dataset.datasetUniqueId}
                    </p>
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: tokens.infoBg, color: tokens.textSecondary }}
                  >
                    {selected.questions.length} question{selected.questions.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="space-y-5">
                  {selected.questions.map((question) => {
                    const isUnanswered = question.answers.length === 0;

                    return (
                      <div
                        key={question.id}
                        className="rounded-xl p-5 transition-all duration-200"
                        style={{
                          background: tokens.infoBg,
                          border: `1px solid ${isUnanswered ? tokens.warningBorder : tokens.borderSubtle}`,
                        }}
                      >
                        {/* Question */}
                        <div className="flex items-start gap-3">
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5"
                            style={{ background: tokens.glassBg, border: `1px solid ${tokens.borderSubtle}` }}
                          >
                            <MessageSquare size={14} style={{ color: tokens.textSecondary }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-relaxed" style={{ color: tokens.textPrimary }}>
                              {question.question}
                            </p>
                            <p className="text-[11px] mt-1" style={{ color: tokens.textMuted }}>
                              Asked {new Date(question.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          {isUnanswered && (
                            <span
                              className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full shrink-0"
                              style={{ background: tokens.warningBg, color: tokens.warningText }}
                            >
                              Pending
                            </span>
                          )}
                        </div>

                        {/* Existing Answers */}
                        {question.answers.length > 0 && (
                          <div className="mt-4 ml-11 space-y-2.5">
                            {question.answers.map((answer) => (
                              <div
                                key={answer.id}
                                className="rounded-lg p-3.5"
                                style={{
                                  background: tokens.successBg,
                                  border: `1px solid ${tokens.successBorder}`,
                                }}
                              >
                                <div className="flex items-center gap-2 mb-1.5">
                                  <CheckCircle2 size={13} style={{ color: tokens.successText }} />
                                  <span className="text-[11px] font-semibold" style={{ color: tokens.successText }}>
                                    Your Response
                                  </span>
                                  <span className="text-[11px]" style={{ color: tokens.textMuted }}>
                                    · {new Date(answer.createdAt).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm leading-relaxed" style={{ color: tokens.textPrimary }}>
                                  {answer.answer}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Answer Input */}
                        <div className="mt-4 ml-11">
                          <div className="flex gap-2">
                            <input
                              className="flex-1 h-10 px-3.5 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-1"
                              style={{
                                background: tokens.inputBg,
                                border: `1px solid ${tokens.inputBorder}`,
                                color: tokens.textPrimary,
                              }}
                              placeholder={question.answers.length > 0 ? "Add another response…" : "Write your answer…"}
                              value={answerDrafts[question.id] || ""}
                              onChange={(e) =>
                                setAnswerDrafts((prev) => ({ ...prev, [question.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAnswer(question.id);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAnswer(question.id)}
                              disabled={answeringQuestionId === question.id || !(answerDrafts[question.id] || "").trim()}
                              className="h-10 px-4"
                            >
                              {answeringQuestionId === question.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Send size={14} />
                              )}
                              <span className="ml-2">Reply</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
