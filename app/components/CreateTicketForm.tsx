"use client";

import { useEffect, useState } from "react";

type Agent = {
  id: string;
  name: string;
  email: string;
};

export default function CreateTicketForm() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [category, setCategory] = useState("");
  const [assignedAgentId, setAssignedAgentId] =
    useState("");

  useEffect(() => {
    async function loadAgents() {
      try {
        const response = await fetch("/api/agents");

        if (!response.ok) {
          throw new Error("Failed to load agents");
        }

        const data = await response.json();

        setAgents(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load agents.");
      } finally {
        setLoadingAgents(false);
      }
    }

    loadAgents();
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          customerName,
          customerEmail,
          priority,
          category: category || null,
          assignedAgentId:
            assignedAgentId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create ticket"
        );
      }

      setSuccess("Ticket created successfully.");

      setTitle("");
      setDescription("");
      setCustomerName("");
      setCustomerEmail("");
      setPriority("MEDIUM");
      setCategory("");
      setAssignedAgentId("");

      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create ticket"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/30 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-900 bg-green-950/30 p-4 text-sm text-green-400">
          {success}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Customer Name
          </label>

          <input
            required
            value={customerName}
            onChange={(event) =>
              setCustomerName(event.target.value)
            }
            placeholder="John Doe"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Customer Email
          </label>

          <input
            required
            type="email"
            value={customerEmail}
            onChange={(event) =>
              setCustomerEmail(event.target.value)
            }
            placeholder="john@example.com"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Ticket Title
        </label>

        <input
          required
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder="Describe the customer's issue"
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Description
        </label>

        <textarea
          required
          rows={5}
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          placeholder="Provide detailed information about the issue..."
          className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Category
          </label>

          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
          >
            <option value="">
              Select category
            </option>

            <option value="PAYMENT">
              Payment
            </option>

            <option value="ACCOUNT">
              Account
            </option>

            <option value="REFUND">
              Refund
            </option>

            <option value="TECHNICAL">
              Technical
            </option>

            <option value="GENERAL">
              General
            </option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Priority
          </label>

          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value)
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Assign Agent
          </label>

          <select
            value={assignedAgentId}
            onChange={(event) =>
              setAssignedAgentId(event.target.value)
            }
            disabled={loadingAgents}
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

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? "Creating..."
            : "Create Ticket"}
        </button>
      </div>
    </form>
  );
}