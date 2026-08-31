import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

import TicketControls from "@/app/components/TicketControls";
import TicketComments from "@/app/components/TicketComments";
import ActivityHistory from "@/app/components/ActivityHistory";
import TicketAIAnalysis from "@/app/components/TicketAIAnalysis";
import SignOutButton from "@/app/components/SignOutButton";

type TicketDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getStatusClass(status: string) {
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

function getPriorityClass(priority: string) {
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

function formatValue(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default async function TicketDetailsPage({
  params,
}: TicketDetailsPageProps) {
  const session = await getServerSession(
    authOptions
  );

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      title: true,
      description: true,
      customerName: true,
      customerEmail: true,
      status: true,
      priority: true,
      category: true,

      assignedAgent: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      createdAt: true,
      resolvedAt: true,
    },
  });

  if (!ticket) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <div className="mx-auto max-w-4xl">
          <a
            href="/dashboard/tickets"
            className="text-sm text-blue-400 transition hover:text-blue-300"
          >
            ← Back to Tickets
          </a>

          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-8">
            <h1 className="text-2xl font-bold">
              Ticket not found
            </h1>

            <p className="mt-2 text-slate-400">
              The ticket you are looking for
              does not exist or may have been
              removed.
            </p>

            <a
              href="/dashboard/tickets"
              className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              View All Tickets
            </a>
          </div>
        </div>
      </main>
    );
  }

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
            <nav className="hidden items-center gap-5 sm:flex">
              <a
                href="/dashboard"
                className="text-sm font-medium text-slate-400 transition hover:text-white"
              >
                Dashboard
              </a>

              <a
                href="/dashboard/tickets"
                className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
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
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Back navigation */}
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
          <a
            href="/dashboard"
            className="text-slate-500 transition hover:text-white"
          >
            Dashboard
          </a>

          <span className="text-slate-700">
            /
          </span>

          <a
            href="/dashboard/tickets"
            className="text-slate-500 transition hover:text-white"
          >
            Tickets
          </a>

          <span className="text-slate-700">
            /
          </span>

          <span className="text-slate-400">
            Ticket Details
          </span>
        </div>

        {/* Ticket Card */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          {/* Ticket Header */}
          <div className="border-b border-slate-800 p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm text-slate-500">
                  Ticket #{ticket.id}
                </p>

                <h1 className="mt-2 text-3xl font-bold text-white">
                  {ticket.title}
                </h1>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusClass(
                    ticket.status
                  )}`}
                >
                  {formatValue(ticket.status)}
                </span>

                <span
                  className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${getPriorityClass(
                    ticket.priority
                  )}`}
                >
                  {formatValue(ticket.priority)}
                </span>
              </div>
            </div>
          </div>

          {/* Ticket Information */}
          <div className="p-8">
            <h2 className="text-lg font-semibold text-white">
              Ticket Information
            </h2>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {/* Customer Name */}
              <div>
                <p className="text-sm text-slate-400">
                  Customer Name
                </p>

                <p className="mt-1 font-medium text-white">
                  {ticket.customerName}
                </p>
              </div>

              {/* Customer Email */}
              <div>
                <p className="text-sm text-slate-400">
                  Customer Email
                </p>

                <p className="mt-1 break-all font-medium text-white">
                  {ticket.customerEmail}
                </p>
              </div>

              {/* Status */}
              <div>
                <p className="text-sm text-slate-400">
                  Status
                </p>

                <p className="mt-1 font-medium text-white">
                  {formatValue(ticket.status)}
                </p>
              </div>

              {/* Priority */}
              <div>
                <p className="text-sm text-slate-400">
                  Priority
                </p>

                <p className="mt-1 font-medium text-white">
                  {formatValue(ticket.priority)}
                </p>
              </div>

              {/* Category */}
              <div>
                <p className="text-sm text-slate-400">
                  Category
                </p>

                <p className="mt-1 font-medium text-white">
                  {ticket.category
                    ? formatValue(
                        ticket.category
                      )
                    : "Not specified"}
                </p>
              </div>

              {/* Assigned Agent */}
              <div>
                <p className="text-sm text-slate-400">
                  Assigned Agent
                </p>

                {ticket.assignedAgent ? (
                  <>
                    <p className="mt-1 font-medium text-white">
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
                  <p className="mt-1 font-medium text-slate-500">
                    Unassigned
                  </p>
                )}
              </div>

              {/* Created */}
              <div>
                <p className="text-sm text-slate-400">
                  Created
                </p>

                <p className="mt-1 font-medium text-white">
                  {ticket.createdAt.toLocaleString()}
                </p>
              </div>

              {/* Resolved */}
              <div>
                <p className="text-sm text-slate-400">
                  Resolved
                </p>

                <p className="mt-1 font-medium text-white">
                  {ticket.resolvedAt
                    ? ticket.resolvedAt.toLocaleString()
                    : "Not resolved"}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mt-8 border-t border-slate-800 pt-8">
              <p className="text-sm text-slate-400">
                Description
              </p>

              <div className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-700 bg-slate-800 p-5 leading-7 text-slate-200">
                {ticket.description}
              </div>
            </div>

            {/* Ticket Controls */}
            <TicketControls
              ticketId={ticket.id}
              initialStatus={ticket.status}
              initialPriority={ticket.priority}
              initialAgentId={
                ticket.assignedAgent?.id ??
                null
              }
            />

            {/* Comments */}
            <TicketComments
              ticketId={ticket.id}
            />

            {/* AI Analysis */}
            <TicketAIAnalysis
              ticketId={ticket.id}
            />

            {/* Activity History */}
            <ActivityHistory
              ticketId={ticket.id}
            />
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="mt-6">
          <a
            href="/dashboard/tickets"
            className="inline-flex items-center text-sm font-medium text-blue-400 transition hover:text-blue-300"
          >
            ← Back to All Tickets
          </a>
        </div>
      </div>
    </main>
  );
}