import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Starting database seed...");

  // Remove existing demo data
  await prisma.activityLog.deleteMany();
  await prisma.aIAnalysis.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  // Hash demo passwords
  const adminPassword = await bcrypt.hash("Admin@12345", 12);
  const agentPassword = await bcrypt.hash("Agent@12345", 12);

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      name: "ResolveAI Admin",
      email: "admin@resolveai.local",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  // Create Agent
  const agent = await prisma.user.create({
    data: {
      name: "Support Agent",
      email: "agent@resolveai.local",
      passwordHash: agentPassword,
      role: "AGENT",
    },
  });

  // Create second Agent
  const agent2 = await prisma.user.create({
    data: {
      name: "Sarah Wilson",
      email: "sarah@resolveai.local",
      passwordHash: agentPassword,
      role: "AGENT",
    },
  });

  // Ticket 1
  const ticket1 = await prisma.ticket.create({
    data: {
      title: "Payment deducted but order not created",
      description:
        "The customer was charged ₹2,499 but the order was not created. They have shared the transaction reference and are requesting an immediate resolution.",
      customerName: "Rahul Sharma",
      customerEmail: "rahul@example.com",
      status: "OPEN",
      priority: "HIGH",
      category: "PAYMENT",
      assignedAgentId: agent.id,
    },
  });

  // Ticket 2
  const ticket2 = await prisma.ticket.create({
    data: {
      title: "Unable to reset account password",
      description:
        "Customer is not receiving the password reset email even after requesting it multiple times.",
      customerName: "Priya Mehta",
      customerEmail: "priya@example.com",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      category: "ACCOUNT",
      assignedAgentId: agent2.id,
    },
  });

  // Ticket 3
  const ticket3 = await prisma.ticket.create({
    data: {
      title: "Refund has not been received",
      description:
        "Customer requested a refund seven business days ago and has still not received the money in their account.",
      customerName: "Amit Verma",
      customerEmail: "amit@example.com",
      status: "RESOLVED",
      priority: "LOW",
      category: "REFUND",
      assignedAgentId: agent.id,
      resolvedAt: new Date(),
    },
  });

  // Comments
  await prisma.comment.create({
    data: {
      content:
        "I have checked the transaction reference and escalated this to the payments team.",
      ticketId: ticket1.id,
      userId: agent.id,
    },
  });

  await prisma.comment.create({
    data: {
      content:
        "Password reset emails appear to be delayed. Checking the email delivery logs.",
      ticketId: ticket2.id,
      userId: agent2.id,
    },
  });

  // Activity history
  await prisma.activityLog.createMany({
    data: [
      {
        ticketId: ticket1.id,
        userId: admin.id,
        action: "TICKET_CREATED",
      },
      {
        ticketId: ticket1.id,
        userId: admin.id,
        action: "TICKET_ASSIGNED",
      },
      {
        ticketId: ticket2.id,
        userId: admin.id,
        action: "TICKET_CREATED",
      },
      {
        ticketId: ticket2.id,
        userId: agent2.id,
        action: "STATUS_CHANGED",
      },
      {
        ticketId: ticket3.id,
        userId: admin.id,
        action: "TICKET_CREATED",
      },
      {
        ticketId: ticket3.id,
        userId: agent.id,
        action: "STATUS_CHANGED",
      },
    ],
  });

  console.log("");
  console.log("Database seed completed successfully!");
  console.log("");
  console.log("Demo accounts:");
  console.log("Admin: admin@resolveai.local / Admin@12345");
  console.log("Agent: agent@resolveai.local / Agent@12345");
  console.log("Agent 2: sarah@resolveai.local / Agent@12345");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });