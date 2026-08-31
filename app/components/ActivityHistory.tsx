"use client";

import { useEffect, useState } from "react";

type Activity = {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: {
    name: string;
    role: string;
  } | null;
};

type ActivityHistoryProps = {
  ticketId: string;
};

function formatValue(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function getActivityText(activity: Activity) {
  const metadata = activity.metadata;

  switch (activity.action) {
    case "TICKET_CREATED":
      return "Ticket created";

    case "TICKET_ASSIGNED": {
      const fromAgentName =
        typeof metadata?.fromAgentName === "string"
          ? metadata.fromAgentName
          : null;

      const toAgentName =
        typeof metadata?.toAgentName === "string"
          ? metadata.toAgentName
          : null;

      const from =
        fromAgentName ||
        (typeof metadata?.from === "string"
          ? metadata.from
          : "Unassigned");

      const to =
        toAgentName ||
        (typeof metadata?.to === "string"
          ? metadata.to
          : "Unassigned");

      if (
        from === "Unassigned" &&
        to !== "Unassigned"
      ) {
        return `Ticket assigned to ${to}`;
      }

      if (to === "Unassigned") {
        return `Ticket unassigned from ${from}`;
      }

      return `Ticket reassigned from ${from} to ${to}`;
    }

    case "STATUS_CHANGED": {
      const from =
        typeof metadata?.from === "string"
          ? metadata.from
          : "Unknown";

      const to =
        typeof metadata?.to === "string"
          ? metadata.to
          : "Unknown";

      return `Status changed from ${formatValue(
        from
      )} to ${formatValue(to)}`;
    }

    case "PRIORITY_CHANGED": {
      const from =
        typeof metadata?.from === "string"
          ? metadata.from
          : "Unknown";

      const to =
        typeof metadata?.to === "string"
          ? metadata.to
          : "Unknown";

      return `Priority changed from ${formatValue(
        from
      )} to ${formatValue(to)}`;
    }

    case "TICKET_UPDATED": {
      const field =
        typeof metadata?.field === "string"
          ? metadata.field
          : null;

      const from =
        typeof metadata?.from === "string"
          ? metadata.from
          : "Unknown";

      const to =
        typeof metadata?.to === "string"
          ? metadata.to
          : "Unknown";

      if (field === "category") {
        return `Category changed from ${formatValue(
          from
        )} to ${formatValue(to)}`;
      }

      if (field === "title") {
        return "Ticket title updated";
      }

      if (field === "description") {
        return "Ticket description updated";
      }

      if (field) {
        return `${formatValue(
          field
        )} changed from ${formatValue(
          from
        )} to ${formatValue(to)}`;
      }

      return "Ticket updated";
    }

    case "COMMENT_ADDED":
      return "Comment added";

    case "AI_ANALYSIS_GENERATED":
      return "AI analysis generated";

    case "TICKET_DELETED":
      return "Ticket deleted";

    default:
      return formatValue(activity.action);
  }
}

function getActivityIcon(action: string) {
  switch (action) {
    case "TICKET_CREATED":
      return "+";

    case "TICKET_ASSIGNED":
      return "→";

    case "STATUS_CHANGED":
      return "●";

    case "PRIORITY_CHANGED":
      return "▲";

    case "COMMENT_ADDED":
      return "C";

    case "AI_ANALYSIS_GENERATED":
      return "AI";

    case "TICKET_UPDATED":
      return "✎";

    case "TICKET_DELETED":
      return "×";

    default:
      return "•";
  }
}

export default function ActivityHistory({
  ticketId,
}: ActivityHistoryProps) {
  const [activities, setActivities] = useState<
    Activity[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadActivities() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/tickets/${ticketId}/activity`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load activity history"
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "Invalid activity data received"
          );
        }

        setActivities(data);
      } catch (error) {
        console.error(
          "Failed to load activity history:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load activity history."
        );
      } finally {
        setLoading(false);
      }
    }

    loadActivities();
  }, [ticketId]);

  return (
    <section className="mt-8 border-t border-slate-800 pt-8">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">
          Activity History
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          A record of changes and actions on this
          ticket.
        </p>
      </div>

      {loading && (
        <div className="rounded-lg bg-slate-800 p-5">
          <p className="text-sm text-slate-400">
            Loading activity...
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/30 p-5">
          <p className="text-sm text-red-400">
            {error}
          </p>
        </div>
      )}

      {!loading &&
        !error &&
        activities.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center">
            <p className="text-sm text-slate-400">
              No activity recorded yet.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        activities.length > 0 && (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex gap-4 rounded-lg border border-slate-800 bg-slate-800/50 p-5 transition hover:bg-slate-800"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-950 text-xs font-semibold text-blue-400">
                  {getActivityIcon(
                    activity.action
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">
                    {getActivityText(activity)}
                  </p>

                  <div className="mt-2 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      {activity.user?.name ||
                        "System"}

                      {activity.user?.role
                        ? ` · ${activity.user.role}`
                        : ""}
                    </span>

                    <span>
                      {new Date(
                        activity.createdAt
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </section>
  );
}