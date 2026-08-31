import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateData = {
  status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category?:
    | "ACCOUNT"
    | "BILLING"
    | "PAYMENT"
    | "TECHNICAL"
    | "DELIVERY"
    | "REFUND"
    | "OTHER";
  assignedAgentId?: string | null;
  resolvedAt?: Date | null;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const {
      status,
      priority,
      category,
      assignedAgentId,
    } = body;

    const existingTicket =
      await prisma.ticket.findUnique({
        where: {
          id,
        },
      });

    if (!existingTicket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    const updateData: UpdateData = {};

    const activityLogs: {
      action:
        | "STATUS_CHANGED"
        | "PRIORITY_CHANGED"
        | "TICKET_ASSIGNED"
        | "TICKET_UPDATED";
      metadata: Record<string, string | null>;
    }[] = [];

    /*
     * STATUS
     */
    if (
      status === "OPEN" ||
      status === "IN_PROGRESS" ||
      status === "RESOLVED" ||
      status === "CLOSED"
    ) {
      if (status !== existingTicket.status) {
        updateData.status = status;

        activityLogs.push({
          action: "STATUS_CHANGED",
          metadata: {
            from: existingTicket.status,
            to: status,
          },
        });
      }

      if (status === "RESOLVED") {
        updateData.resolvedAt =
          existingTicket.resolvedAt ??
          new Date();
      } else {
        updateData.resolvedAt = null;
      }
    }

    /*
     * PRIORITY
     */
    if (
      priority === "LOW" ||
      priority === "MEDIUM" ||
      priority === "HIGH" ||
      priority === "CRITICAL"
    ) {
      if (priority !== existingTicket.priority) {
        updateData.priority = priority;

        activityLogs.push({
          action: "PRIORITY_CHANGED",
          metadata: {
            from: existingTicket.priority,
            to: priority,
          },
        });
      }
    }

    /*
     * CATEGORY
     */
    if (
      category === "ACCOUNT" ||
      category === "BILLING" ||
      category === "PAYMENT" ||
      category === "TECHNICAL" ||
      category === "DELIVERY" ||
      category === "REFUND" ||
      category === "OTHER"
    ) {
      if (category !== existingTicket.category) {
        updateData.category = category;

        activityLogs.push({
          action: "TICKET_UPDATED",
          metadata: {
            field: "category",
            from: existingTicket.category,
            to: category,
          },
        });
      }
    }

    /*
     * ASSIGNED AGENT
     */
    if (
      assignedAgentId === null ||
      typeof assignedAgentId === "string"
    ) {
      const newAgentId =
        assignedAgentId || null;

      if (
        newAgentId !==
        existingTicket.assignedAgentId
      ) {
        updateData.assignedAgentId =
          newAgentId;

        activityLogs.push({
          action: "TICKET_ASSIGNED",
          metadata: {
            from:
              existingTicket.assignedAgentId,
            to: newAgentId,
          },
        });
      }
    }

    /*
     * Nothing changed
     */
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        existingTicket
      );
    }

    /*
     * Update ticket
     */
    const updatedTicket =
      await prisma.ticket.update({
        where: {
          id,
        },
        data: updateData,
      });

    /*
     * Create activity logs
     */
    if (activityLogs.length > 0) {
      await prisma.activityLog.createMany({
        data: activityLogs.map((log) => ({
          ticketId: id,
          userId: session.user.id,
          action: log.action,
          metadata: log.metadata,
        })),
      });
    }

    return NextResponse.json(
      updatedTicket
    );
  } catch (error) {
    console.error(
      "PATCH /api/tickets/[id] error:"
    );

    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update ticket",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE - Delete a ticket
|--------------------------------------------------------------------------
*/

export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    // --------------------------------------------------
    // 1. Check authentication
    // --------------------------------------------------

    const session = await getServerSession(
      authOptions
    );

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // --------------------------------------------------
    // 2. Get ticket ID
    // --------------------------------------------------

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Ticket ID is required",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 3. Check ticket exists
    // --------------------------------------------------

    const existingTicket =
      await prisma.ticket.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          title: true,
        },
      });

    if (!existingTicket) {
      return NextResponse.json(
        {
          error: "Ticket not found",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------------
    // 4. Delete ticket
    // --------------------------------------------------

    await prisma.ticket.delete({
      where: {
        id,
      },
    });

    // --------------------------------------------------
    // 5. Return success
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Ticket deleted successfully",
        ticketId: id,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "DELETE /api/tickets/[id] error:"
    );

    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete ticket",
      },
      {
        status: 500,
      }
    );
  }
}