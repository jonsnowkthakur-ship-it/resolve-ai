"use client";

import { useEffect, useState } from "react";

type Agent = {
  id: string;
  name: string;
  email: string;
};

type TicketControlsProps = {
  ticketId: string;
  initialStatus: string;
  initialPriority: string;
  initialAgentId: string | null;
};

export default function TicketControls({
  ticketId,
  initialStatus,
  initialPriority,
  initialAgentId,
}: TicketControlsProps) {
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] =
    useState(initialPriority);

  const [assignedAgentId, setAssignedAgentId] =
    useState(initialAgentId ?? "");

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] =
    useState(true);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  useEffect(() => {
    async function loadAgents() {
      try {
        const response = await fetch("/api/agents");

        if (!response.ok) {
          throw new Error(
            "Failed to load agents"
          );
        }

        const data = await response.json();

        setAgents(data);
      } catch (error) {
        console.error(error);

        setError("Unable to load agents.");
      } finally {
        setLoadingAgents(false);
      }
    }

    loadAgents();
  }, []);

  async function updateTicket(
    newStatus: string,
    newPriority: string,
    newAgentId: string
  ) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/tickets/${ticketId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            priority: newPriority,
            assignedAgentId:
              newAgentId || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update ticket"
        );
      }

      setStatus(newStatus);
      setPriority(newPriority);
      setAssignedAgentId(newAgentId);

      setMessage(
        "Ticket updated successfully."
      );

      window.location.reload();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update ticket."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleStatusChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    updateTicket(
      event.target.value,
      priority,
      assignedAgentId
    );
  }

  function handlePriorityChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    updateTicket(
      status,
      event.target.value,
      assignedAgentId
    );
  }

  function handleAgentChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    updateTicket(
      status,
      priority,
      event.target.value
    );
  }

  async function deleteTicket() {
    try {
      setDeleting(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/tickets/${ticketId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete ticket"
        );
      }

      setMessage(
        "Ticket deleted successfully."
      );

      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete ticket."
      );

      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div className="mt-8 border-t border-slate-800 pt-8">
      <h2 className="text-lg font-semibold text-white">
        Ticket Controls
      </h2>

      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        {/* Status */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Status
          </label>

          <select
            value={status}
            onChange={handleStatusChange}
            disabled={saving || deleting}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
          >
            <option value="OPEN">
              Open
            </option>

            <option value="IN_PROGRESS">
              In Progress
            </option>

            <option value="RESOLVED">
              Resolved
            </option>

            <option value="CLOSED">
              Closed
            </option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Priority
          </label>

          <select
            value={priority}
            onChange={handlePriorityChange}
            disabled={saving || deleting}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
          >
            <option value="LOW">
              Low
            </option>

            <option value="MEDIUM">
              Medium
            </option>

            <option value="HIGH">
              High
            </option>

            <option value="CRITICAL">
              Critical
            </option>
          </select>
        </div>

        {/* Agent */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Assign Agent
          </label>

          <select
            value={assignedAgentId}
            onChange={handleAgentChange}
            disabled={
              saving ||
              deleting ||
              loadingAgents
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
          >
            <option value="">
              {loadingAgents
                ? "Loading agents..."
                : "Unassigned"}
            </option>

            {agents.map((agent) => (
              <option
                key={agent.id}
                value={agent.id}
              >
                {agent.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Saving message */}
      {saving && (
        <p className="mt-4 text-sm text-slate-400">
          Updating ticket...
        </p>
      )}

      {/* Deleting message */}
      {deleting && (
        <p className="mt-4 text-sm text-red-400">
          Deleting ticket...
        </p>
      )}

      {/* Success */}
      {message && !saving && !deleting && (
        <p className="mt-4 text-sm text-green-400">
          {message}
        </p>
      )}

      {/* Error */}
      {error && !deleting && (
        <p className="mt-4 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Delete section */}
      <div className="mt-8 border-t border-slate-800 pt-6">
        <h3 className="text-sm font-semibold text-white">
          Danger Zone
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Deleting a ticket permanently removes the
          ticket and its related comments, AI analysis,
          and activity history.
        </p>

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() =>
              setShowDeleteConfirm(true)
            }
            disabled={saving || deleting}
            className="mt-4 rounded-lg border border-red-900 bg-red-950/40 px-5 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete Ticket
          </button>
        ) : (
          <div className="mt-4 rounded-lg border border-red-900 bg-red-950/20 p-5">
            <p className="font-medium text-red-300">
              Are you sure you want to delete this
              ticket?
            </p>

            <p className="mt-1 text-sm text-red-400/80">
              This action cannot be undone.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={deleteTicket}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Yes, Delete Ticket"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowDeleteConfirm(false)
                }
                disabled={deleting}
                className="rounded-lg border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}