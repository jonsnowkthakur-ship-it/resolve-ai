import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const isAgent = session.user.role === "AGENT";

    const tickets = await prisma.ticket.findMany({
      where: isAgent
        ? {
            assignedAgentId: session.user.id,
          }
        : undefined,

      include: {
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("GET /api/tickets error:", error);

    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Only admins can create tickets",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      title,
      description,
      customerName,
      customerEmail,
      priority,
      category,
      assignedAgentId,
    } = body;

    if (
      !title ||
      !description ||
      !customerName ||
      !customerEmail
    ) {
      return NextResponse.json(
        {
          error:
            "Title, description, customer name and customer email are required",
        },
        { status: 400 }
      );
    }

    const ticketData = {
      title: String(title),
      description: String(description),
      customerName: String(customerName),
      customerEmail: String(customerEmail),
      status: "OPEN" as const,
      priority: priority
        ? (String(priority) as any)
        : undefined,
      category: category
        ? (String(category) as any)
        : undefined,
      assignedAgentId: assignedAgentId
        ? String(assignedAgentId)
        : undefined,
    };

    const ticket = await prisma.ticket.create({
      data: ticketData,
      include: {
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(ticket, {
      status: 201,
    });
  } catch (error) {
    console.error("POST /api/tickets error:", error);

    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}