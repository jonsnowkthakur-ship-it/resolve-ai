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

    const agents = await prisma.user.findMany({
      where: {
        role: "AGENT",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(agents);
  } catch (error) {
    console.error("GET /api/agents error:", error);

    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}