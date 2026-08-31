"use client";

import { useEffect, useState } from "react";

type Ticket = {
  id: string;
  title: string;
  description: string;
  customerName: string;
  customerEmail: string;
  status: string;
  priority: string;
  category: string | null;
  createdAt: string;
  assignedAgent: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type SortOption =
  | "NEWEST"
  | "OLDEST"
  | "PRIORITY_HIGH"
  | "PRIORITY_LOW";

const priorityRank: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export default function TicketTable() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");
  const [priorityFilter, setPriorityFilter] =
    useState("ALL");
  const [categoryFilter, setCategoryFilter] =
    useState("ALL");

  const [sortBy, setSortBy] =
    useState<SortOption>("NEWEST");

  useEffect(() => {
    async function loadTickets() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/tickets",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load tickets"
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "Invalid ticket data received"
          );
        }

        setTickets(data);
      } catch (err) {
        console.error(
          "Load tickets error:",
          err
        );

        setError(
          "Unable to load tickets."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, []);

  /*
   * Filter tickets
   */
  const filteredTickets = tickets.filter(
    (ticket) => {
      const searchText =
        search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        ticket.title
          .toLowerCase()
          .includes(searchText) ||
        ticket.customerName
          .toLowerCase()
          .includes(searchText) ||
        ticket.customerEmail
          .toLowerCase()
          .includes(searchText) ||
        ticket.description
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "ALL" ||
        ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" ||
        ticket.priority === priorityFilter;

      const matchesCategory =
        categoryFilter === "ALL" ||
        ticket.category === categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory
      );
    }
  );

  /*
   * Sort filtered tickets
   */
  const sortedTickets = [
    ...filteredTickets,
  ].sort((a, b) => {
    if (
      sortBy === "NEWEST"
    ) {
      return (
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
      );
    }

    if (
      sortBy === "OLDEST"
    ) {
      return (
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
      );
    }

    if (
      sortBy === "PRIORITY_HIGH"
    ) {
      return (
        (priorityRank[b.priority] ?? 0) -
        (priorityRank[a.priority] ?? 0)
      );
    }

    if (
      sortBy === "PRIORITY_LOW"
    ) {
      return (
        (priorityRank[a.priority] ?? 0) -
        (priorityRank[b.priority] ?? 0)
      );
    }

    return 0;
  });

  /*
   * Clear filters
   */
  function clearFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setCategoryFilter("ALL");
  }

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    categoryFilter !== "ALL";

  /*
   * Priority badge
   */
  function getPriorityClass(
    priority: string
  ) {
    switch (priority) {
      case "CRITICAL":
        return "border-red-900 bg-red-950 text-red-400";

      case "HIGH":
        return "border-orange-900 bg-orange-950 text-orange-400";

      case "MEDIUM":
        return "border-yellow-900 bg-yellow-950 text-yellow-400";

      case "LOW":
        return "border-green-900 bg-green-950 text-green-400";

      default:
        return "border-slate-700 bg-slate-800 text-slate-400";
    }
  }

  /*
   * Status badge
   */
  function getStatusClass(
    status: string
  ) {
    switch (status) {
      case "OPEN":
        return "border-blue-900 bg-blue-950 text-blue-400";

      case "IN_PROGRESS":
        return "border-purple-900 bg-purple-950 text-purple-400";

      case "RESOLVED":
        return "border-green-900 bg-green-950 text-green-400";

      case "CLOSED":
        return "border-slate-600 bg-slate-800 text-slate-300";

      default:
        return "border-slate-700 bg-slate-800 text-slate-400";
    }
  }

  /*
   * Format status
   */
  function formatStatus(
    status: string
  ) {
    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  /*
   * Format category
   */
  function formatCategory(
    category: string | null
  ) {
    if (!category) {
      return "Uncategorized";
    }

    return category
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
        <p className="text-slate-400">
          Loading tickets...
        </p>
      </div>
    );
  }

  /*
   * Error
   */
  if (error) {
    return (
      <div className="mt-8 rounded-xl border border-red-900 bg-red-950/30 p-6">
        <p className="text-red-400">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            window.location.reload()
          }
          className="mt-4 rounded-lg bg-red-900/50 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-900"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <section className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-800 p-6">
        <div className="flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Tickets
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Showing{" "}
                <span className="font-medium text-slate-300">
                  {sortedTickets.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-slate-300">
                  {tickets.length}
                </span>{" "}
                ticket
                {tickets.length !== 1
                  ? "s"
                  : ""}
              </p>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div>
              <label
                htmlFor="ticket-search"
                className="sr-only"
              >
                Search tickets
              </label>

              <input
                id="ticket-search"
                type="text"
                placeholder="Search tickets..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status-filter"
                className="sr-only"
              >
                Filter by status
              </label>

              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500"
              >
                <option value="ALL">
                  All Statuses
                </option>

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
              <label
                htmlFor="priority-filter"
                className="sr-only"
              >
                Filter by priority
              </label>

              <select
                id="priority-filter"
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500"
              >
                <option value="ALL">
                  All Priorities
                </option>

                <option value="CRITICAL">
                  Critical
                </option>

                <option value="HIGH">
                  High
                </option>

                <option value="MEDIUM">
                  Medium
                </option>

                <option value="LOW">
                  Low
                </option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category-filter"
                className="sr-only"
              >
                Filter by category
              </label>

              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500"
              >
                <option value="ALL">
                  All Categories
                </option>

                <option value="ACCOUNT">
                  Account
                </option>

                <option value="BILLING">
                  Billing
                </option>

                <option value="PAYMENT">
                  Payment
                </option>

                <option value="TECHNICAL">
                  Technical
                </option>

                <option value="DELIVERY">
                  Delivery
                </option>

                <option value="REFUND">
                  Refund
                </option>

                <option value="OTHER">
                  Other
                </option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label
                htmlFor="sort-filter"
                className="sr-only"
              >
                Sort tickets
              </label>

              <select
                id="sort-filter"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target
                      .value as SortOption
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500"
              >
                <option value="NEWEST">
                  Newest First
                </option>

                <option value="OLDEST">
                  Oldest First
                </option>

                <option value="PRIORITY_HIGH">
                  Highest Priority
                </option>

                <option value="PRIORITY_LOW">
                  Lowest Priority
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-950/50">
            <tr>
              <th className="px-6 py-4 font-medium text-slate-400">
                Ticket
              </th>

              <th className="px-6 py-4 font-medium text-slate-400">
                Customer
              </th>

              <th className="px-6 py-4 font-medium text-slate-400">
                Status
              </th>

              <th className="px-6 py-4 font-medium text-slate-400">
                Priority
              </th>

              <th className="px-6 py-4 font-medium text-slate-400">
                Category
              </th>

              <th className="px-6 py-4 font-medium text-slate-400">
                Assigned Agent
              </th>

              <th className="px-6 py-4 font-medium text-slate-400">
                Created
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {sortedTickets.map(
              (ticket) => (
                <tr
                  key={ticket.id}
                  className="transition hover:bg-slate-800/50"
                >
                  {/* Ticket */}
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <a
                        href={`/dashboard/tickets/${ticket.id}`}
                        className="font-medium text-white transition hover:text-blue-400 hover:underline"
                      >
                        {ticket.title}
                      </a>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {ticket.description}
                      </p>
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="px-6 py-4">
                    <p className="text-slate-300">
                      {ticket.customerName}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {ticket.customerEmail}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClass(
                        ticket.status
                      )}`}
                    >
                      {formatStatus(
                        ticket.status
                      )}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getPriorityClass(
                        ticket.priority
                      )}`}
                    >
                      {formatStatus(
                        ticket.priority
                      )}
                    </span>
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4 text-slate-300">
                    {formatCategory(
                      ticket.category
                    )}
                  </td>

                  {/* Agent */}
                  <td className="px-6 py-4">
                    {ticket.assignedAgent ? (
                      <>
                        <p className="text-slate-300">
                          {
                            ticket
                              .assignedAgent
                              .name
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {
                            ticket
                              .assignedAgent
                              .email
                          }
                        </p>
                      </>
                    ) : (
                      <span className="text-slate-500">
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* Created */}
                  <td className="whitespace-nowrap px-6 py-4 text-slate-400">
                    {new Date(
                      ticket.createdAt
                    ).toLocaleDateString()}
                  </td>
                </tr>
              )
            )}

            {/* Empty state */}
            {sortedTickets.length ===
              0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-14 text-center"
                >
                  <p className="text-base font-medium text-slate-300">
                    No tickets found
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    {hasActiveFilters
                      ? "Try changing or clearing your filters."
                      : "There are no tickets available yet."}
                  </p>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={
                        clearFilters
                      }
                      className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                    >
                      Clear Filters
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}