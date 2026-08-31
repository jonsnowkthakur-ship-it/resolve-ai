"use client";

import { FormEvent, useEffect, useState } from "react";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

type TicketCommentsProps = {
  ticketId: string;
};

export default function TicketComments({
  ticketId,
}: TicketCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadComments() {
    try {
      setError("");

      const response = await fetch(
        `/api/tickets/comments?ticketId=${ticketId}`
      );

      if (!response.ok) {
        throw new Error("Failed to load comments");
      }

      const data = await response.json();

      setComments(data);
    } catch (error) {
      console.error(error);
      setError("Unable to load comments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComments();
  }, [ticketId]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        "/api/tickets/comments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ticketId,
            content: trimmedContent,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to add comment"
        );
      }

      setContent("");

      await loadComments();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to add comment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-8 border-t border-slate-800 pt-8">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">
          Comments
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Communication and updates for this ticket.
        </p>
      </div>

      {loading ? (
        <div className="rounded-lg bg-slate-800 p-5 text-sm text-slate-400">
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center">
          <p className="text-sm text-slate-400">
            No comments yet.
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Add the first comment below.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-slate-800 bg-slate-800/60 p-5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-white">
                    {comment.user.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {comment.user.role}
                  </p>
                </div>

                <p className="text-xs text-slate-500">
                  {new Date(
                    comment.createdAt
                  ).toLocaleString()}
                </p>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-900 bg-red-950/30 p-4">
          <p className="text-sm text-red-400">
            {error}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-5"
      >
        <label
          htmlFor="ticket-comment"
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          Add Comment
        </label>

        <textarea
          id="ticket-comment"
          value={content}
          onChange={(event) =>
            setContent(event.target.value)
          }
          placeholder="Write an update or response..."
          rows={4}
          disabled={submitting}
          className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500 disabled:opacity-50"
        />

        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={
              submitting || !content.trim()
            }
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Adding..."
              : "Add Comment"}
          </button>
        </div>
      </form>
    </section>
  );
}