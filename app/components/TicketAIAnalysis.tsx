"use client";

import { useEffect, useState } from "react";

type AIAnalysis = {
  id: string;
  summary: string;
  suggestedCategory: string;
  suggestedPriority: string;
  sentiment: string;
  suggestedResponse: string;
  model: string;
  createdAt: string;
};

type TicketAIAnalysisProps = {
  ticketId: string;
};

export default function TicketAIAnalysis({
  ticketId,
}: TicketAIAnalysisProps) {
  const [analysis, setAnalysis] =
    useState<AIAnalysis | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] =
    useState(true);

  const [applying, setApplying] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  /*
   * Load previously saved AI analysis.
   */
  useEffect(() => {
    async function loadExistingAnalysis() {
      try {
        setLoadingExisting(true);
        setError("");

        const response = await fetch(
          `/api/tickets/${ticketId}/ai`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to load AI analysis"
          );
        }

        if (data.analysis) {
          setAnalysis(data.analysis);
        }
      } catch (error) {
        console.error(
          "Failed to load existing AI analysis:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load AI analysis"
        );
      } finally {
        setLoadingExisting(false);
      }
    }

    loadExistingAnalysis();
  }, [ticketId]);

  /*
   * Generate a new AI analysis.
   */
  async function analyzeTicket() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setCopied(false);

      const response = await fetch(
        `/api/tickets/${ticketId}/ai`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to analyze ticket"
        );
      }

      setAnalysis(data.analysis);

      setSuccess(
        "AI analysis generated successfully."
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to analyze ticket"
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Apply AI suggested category and priority.
   */
  async function applySuggestions() {
    if (!analysis) {
      return;
    }

    try {
      setApplying(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/tickets/${ticketId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category:
              analysis.suggestedCategory,
            priority:
              analysis.suggestedPriority,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to apply AI suggestions"
        );
      }

      setSuccess(
        "AI suggestions applied successfully."
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to apply AI suggestions"
      );
    } finally {
      setApplying(false);
    }
  }

  /*
   * Copy suggested response.
   */
  async function copyResponse() {
    if (!analysis?.suggestedResponse) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        analysis.suggestedResponse
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Failed to copy response:",
        error
      );

      setError(
        "Unable to copy response. Please copy it manually."
      );
    }
  }

  return (
    <section className="mt-8 border-t border-slate-800 pt-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            AI Ticket Analysis
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Use AI to analyze this customer support ticket.
          </p>
        </div>

        <button
          type="button"
          onClick={analyzeTicket}
          disabled={
            loading || loadingExisting
          }
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Analyzing..."
            : analysis
              ? "Analyze Again"
              : "Analyze with AI"}
        </button>
      </div>

      {/* Loading */}
      {loadingExisting && (
        <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">
            Loading previous AI analysis...
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-lg border border-red-900 bg-red-950/30 p-5">
          <p className="text-sm text-red-400">
            {error}
          </p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mt-5 rounded-lg border border-green-900 bg-green-950/30 p-5">
          <p className="text-sm text-green-400">
            {success}
          </p>
        </div>
      )}

      {/* Analysis */}
      {!loadingExisting && analysis && (
        <div className="mt-6 space-y-5">
          {/* AI values */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-5">
              <p className="text-xs text-slate-500">
                Suggested Category
              </p>

              <p className="mt-2 font-semibold text-white">
                {analysis.suggestedCategory}
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-5">
              <p className="text-xs text-slate-500">
                Suggested Priority
              </p>

              <p className="mt-2 font-semibold text-white">
                {analysis.suggestedPriority}
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-5">
              <p className="text-xs text-slate-500">
                Customer Sentiment
              </p>

              <p className="mt-2 font-semibold text-white">
                {analysis.sentiment}
              </p>
            </div>
          </div>

          {/* Apply suggestions */}
          <div className="rounded-lg border border-blue-900/50 bg-blue-950/20 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-white">
                  Apply AI Suggestions
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Update this ticket's category and
                  priority using the AI recommendations.
                </p>
              </div>

              <button
                type="button"
                onClick={applySuggestions}
                disabled={applying}
                className="shrink-0 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {applying
                  ? "Applying..."
                  : "Apply Suggestions"}
              </button>
            </div>
          </div>

          {/* Summary */}
          <div>
            <p className="text-sm text-slate-400">
              Summary
            </p>

            <div className="mt-3 rounded-lg bg-slate-800 p-5 text-slate-200">
              {analysis.summary}
            </div>
          </div>

          {/* Suggested response */}
          <div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-slate-400">
                Suggested Response
              </p>

              <button
                type="button"
                onClick={copyResponse}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
              >
                {copied
                  ? "✓ Copied"
                  : "Copy Response"}
              </button>
            </div>

            <div className="mt-3 rounded-lg bg-slate-800 p-5 text-slate-200">
              {analysis.suggestedResponse}
            </div>
          </div>

          {/* Metadata */}
          <p className="text-xs text-slate-600">
            Generated by {analysis.model} ·{" "}
            {new Date(
              analysis.createdAt
            ).toLocaleString()}
          </p>
        </div>
      )}

      {/* No analysis */}
      {!loadingExisting &&
        !analysis &&
        !error && (
          <div className="mt-6 rounded-lg border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center">
            <p className="text-sm text-slate-500">
              No AI analysis has been generated
              for this ticket yet.
            </p>
          </div>
        )}
    </section>
  );
}