import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json(
        { error: "ticketId is required" },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        ticketId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error(
      "GET /api/tickets/comments error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to load comments" },
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

    const body = await request.json();

    const ticketId =
      typeof body.ticketId === "string"
        ? body.ticketId
        : "";

    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : "";

    if (!ticketId) {
      return NextResponse.json(
        { error: "ticketId is required" },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "Comment cannot be empty" },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: {
        id: ticketId,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        ticketId,
        userId: session.user.id,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(comment, {
      status: 201,
    });
  } catch (error) {
    console.error(
      "POST /api/tickets/comments error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}