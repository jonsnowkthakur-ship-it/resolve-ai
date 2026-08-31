import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

import TicketTable from "@/app/components/TicketTable";
import CreateTicketForm from "@/app/components/CreateTicketForm";
import SignOutButton from "@/app/components/SignOutButton";

export default async function DashboardPage() {
  const session = await getServerSession(
    authOptions
  );

  if (!session?.user) {
    redirect("/login");
  }

  const isAgent =
    session.user.role === "AGENT";

  const ticketFilter = isAgent
    ? {
        assignedAgentId: session.user.id,
      }
    : {};

  const [
    totalTickets,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    closedTickets,
    criticalTickets,
    resolvedTicketData,
  ] = await Promise.all([
    prisma.ticket.count({
      where: ticketFilter,
    }),

    prisma.ticket.count({
      where: {
        ...ticketFilter,
        status: "OPEN",
      },
    }),

    prisma.ticket.count({
      where: {
        ...ticketFilter,
        status: "IN_PROGRESS",
      },
    }),

    prisma.ticket.count({
      where: {
        ...ticketFilter,
        status: "RESOLVED",
      },
    }),

    prisma.ticket.count({
      where: {
        ...ticketFilter,
        status: "CLOSED",
      },
    }),

    prisma.ticket.count({
      where: {
        ...ticketFilter,
        priority: "CRITICAL",
      },
    }),

    prisma.ticket.findMany({
      where: {
        ...ticketFilter,
        resolvedAt: {
          not: null,
        },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    }),
  ]);

  let averageResolutionHours = 0;

  if (resolvedTicketData.length > 0) {
    const totalResolutionMilliseconds =
      resolvedTicketData.reduce(
        (total, ticket) => {
          if (!ticket.resolvedAt) {
            return total;
          }

          return (
            total +
            (ticket.resolvedAt.getTime() -
              ticket.createdAt.getTime())
          );
        },
        0
      );

    const averageResolutionMilliseconds =
      totalResolutionMilliseconds /
      resolvedTicketData.length;

    averageResolutionHours =
      averageResolutionMilliseconds /
      (1000 * 60 * 60);
  }

  const formattedAverageResolution =
    averageResolutionHours < 1
      ? `${Math.round(
          averageResolutionHours * 60
        )} min`
      : `${averageResolutionHours.toFixed(
          1
        )} hrs`;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <div>
            <a
              href="/dashboard"
              className="text-xl font-bold text-white transition hover:text-blue-400"
            >
              ResolveAI
            </a>

            <p className="text-sm text-slate-400">
              Support Management Dashboard
            </p>
          </div>

          {/* Navigation + User */}
          <div className="flex items-center gap-6">
            <nav className="hidden items-center gap-5 md:flex">
              <a
                href="/dashboard"
                className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
              >
                Dashboard
              </a>

              <a
                href="/dashboard"
                className="text-sm font-medium text-slate-400 transition hover:text-white"
              >
                Tickets
              </a>
            </nav>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-white">
                {session.user.name}
              </p>

              <p className="text-xs text-slate-400">
                {session.user.role}
              </p>
            </div>

            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Welcome */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">
              Welcome back,{" "}
              {session.user.name}
            </h2>

            <p className="mt-2 text-slate-400">
              Here&apos;s what&apos;s happening
              with your customer support
              tickets.
            </p>
          </div>

          {session.user.role ===
            "ADMIN" && (
            <a
              href="#create-ticket"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              + New Ticket
            </a>
          )}
        </div>

        {/* Statistics */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Total Tickets
            </p>

            <p className="mt-2 text-3xl font-bold text-white">
              {totalTickets}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              {isAgent
                ? "Tickets assigned to you"
                : "All tickets"}
            </p>
          </div>

          {/* Open */}
          <div className="rounded-xl border border-blue-900/50 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Open Tickets
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-400">
              {openTickets}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Awaiting action
            </p>
          </div>

          {/* In Progress */}
          <div className="rounded-xl border border-purple-900/50 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              In Progress
            </p>

            <p className="mt-2 text-3xl font-bold text-purple-400">
              {inProgressTickets}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Currently being handled
            </p>
          </div>

          {/* Resolved */}
          <div className="rounded-xl border border-green-900/50 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Resolved
            </p>

            <p className="mt-2 text-3xl font-bold text-green-400">
              {resolvedTickets}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Successfully resolved
            </p>
          </div>

          {/* Closed */}
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Closed Tickets
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-200">
              {closedTickets}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Completed tickets
            </p>
          </div>

          {/* Critical */}
          <div className="rounded-xl border border-red-900/50 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Critical Tickets
            </p>

            <p className="mt-2 text-3xl font-bold text-red-400">
              {criticalTickets}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Require immediate attention
            </p>
          </div>

          {/* Average Resolution */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-slate-400">
              Average Resolution Time
            </p>

            <p className="mt-2 text-3xl font-bold text-white">
              {resolvedTicketData.length >
              0
                ? formattedAverageResolution
                : "—"}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Based on tickets with a resolution
              date
            </p>
          </div>
        </section>

        {/* Create Ticket */}
        {session.user.role ===
          "ADMIN" && (
          <section
            id="create-ticket"
            className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white">
                Create New Ticket
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Create a customer support
                ticket and assign it to an
                agent.
              </p>
            </div>

            <CreateTicketForm />
          </section>
        )}

        {/* Tickets */}
        <TicketTable />
      </div>
    </main>
  );
}