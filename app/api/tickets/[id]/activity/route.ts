import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
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

    const ticket = await prisma.ticket.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    const activities = await prisma.activityLog.findMany({
      where: {
        ticketId: id,
      },
      include: {
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error(
      "GET /api/tickets/[id]/activity error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to load activity history" },
      { status: 500 }
    );
  }
}