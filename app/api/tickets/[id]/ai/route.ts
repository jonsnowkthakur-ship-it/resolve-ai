import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { GoogleGenAI, Type } from "@google/genai";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type AnalysisResult = {
  summary: string;

  suggestedCategory:
    | "ACCOUNT"
    | "BILLING"
    | "PAYMENT"
    | "TECHNICAL"
    | "DELIVERY"
    | "REFUND"
    | "OTHER";

  suggestedPriority:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

  sentiment:
    | "POSITIVE"
    | "NEUTRAL"
    | "NEGATIVE";

  suggestedResponse: string;
};

/*
|--------------------------------------------------------------------------
| GET - Load the latest saved AI analysis
|--------------------------------------------------------------------------
*/

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    // --------------------------------------------------
    // 1. Check authentication
    // --------------------------------------------------

    const session = await getServerSession(authOptions);

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
    // 3. Check that ticket exists
    // --------------------------------------------------

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
        {
          error: "Ticket not found",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------------
    // 4. Get latest AI analysis
    // --------------------------------------------------

    const analysis =
      await prisma.aIAnalysis.findFirst({
        where: {
          ticketId: id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    // --------------------------------------------------
    // 5. Return analysis
    // --------------------------------------------------

    return NextResponse.json(
      {
        analysis,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET /api/tickets/[id]/ai error:"
    );

    console.error(error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      {
        error: errorMessage,
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST - Generate a new AI analysis
|--------------------------------------------------------------------------
*/

export async function POST(
  _request: Request,
  { params }: RouteContext
) {
  try {
    // --------------------------------------------------
    // 1. Check authentication
    // --------------------------------------------------

    const session = await getServerSession(authOptions);

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
    // 2. Check Gemini API key
    // --------------------------------------------------

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Gemini API key is not configured. Add GEMINI_API_KEY to .env and restart the development server.",
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------------
    // 3. Create Gemini client
    // --------------------------------------------------

    const ai = new GoogleGenAI({
      apiKey,
    });

    // --------------------------------------------------
    // 4. Get ticket ID
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
    // 5. Find ticket
    // --------------------------------------------------

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
      },
    });

    if (!ticket) {
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
    // 6. Create AI prompt
    // --------------------------------------------------

    const prompt = `
You are an expert customer support AI assistant.

Analyze the following customer support ticket.

Return ONLY valid JSON with exactly these fields:

{
  "summary": "A concise summary of the customer's issue",
  "suggestedCategory": "ACCOUNT | BILLING | PAYMENT | TECHNICAL | DELIVERY | REFUND | OTHER",
  "suggestedPriority": "LOW | MEDIUM | HIGH | CRITICAL",
  "sentiment": "POSITIVE | NEUTRAL | NEGATIVE",
  "suggestedResponse": "A professional response that a support agent can send to the customer"
}

Ticket information:

Title:
${ticket.title}

Description:
${ticket.description}

Customer:
${ticket.customerName}

Customer Email:
${ticket.customerEmail}

Current Status:
${ticket.status}

Current Priority:
${ticket.priority}

Current Category:
${ticket.category}

Important rules:

- Do not invent facts.
- Base the analysis only on the ticket information.
- The suggested response should be professional, concise and helpful.
- Return JSON only.
`;

    // --------------------------------------------------
    // 7. Select Gemini model
    // --------------------------------------------------

    const model =
      process.env.GEMINI_MODEL ||
      "gemini-3.6-flash";

    // --------------------------------------------------
    // 8. Ask Gemini
    // --------------------------------------------------

    const response =
      await ai.models.generateContent({
        model,
        contents: prompt,

        config: {
          responseMimeType: "application/json",

          responseSchema: {
            type: Type.OBJECT,

            properties: {
              summary: {
                type: Type.STRING,
              },

              suggestedCategory: {
                type: Type.STRING,
                enum: [
                  "ACCOUNT",
                  "BILLING",
                  "PAYMENT",
                  "TECHNICAL",
                  "DELIVERY",
                  "REFUND",
                  "OTHER",
                ],
              },

              suggestedPriority: {
                type: Type.STRING,
                enum: [
                  "LOW",
                  "MEDIUM",
                  "HIGH",
                  "CRITICAL",
                ],
              },

              sentiment: {
                type: Type.STRING,
                enum: [
                  "POSITIVE",
                  "NEUTRAL",
                  "NEGATIVE",
                ],
              },

              suggestedResponse: {
                type: Type.STRING,
              },
            },

            required: [
              "summary",
              "suggestedCategory",
              "suggestedPriority",
              "sentiment",
              "suggestedResponse",
            ],
          },
        },
      });

    // --------------------------------------------------
    // 9. Get Gemini response
    // --------------------------------------------------

    const text = response.text;

    if (!text) {
      return NextResponse.json(
        {
          error: "Gemini returned an empty response.",
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------------
    // 10. Parse JSON
    // --------------------------------------------------

    let analysis: AnalysisResult;

    try {
      analysis = JSON.parse(text) as AnalysisResult;
    } catch (parseError) {
      console.error(
        "Gemini returned invalid JSON:",
        text
      );

      console.error(
        "JSON parse error:",
        parseError
      );

      return NextResponse.json(
        {
          error: "Gemini returned invalid JSON.",
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------------
    // 11. Save AI analysis to database
    // --------------------------------------------------

    const savedAnalysis =
      await prisma.aIAnalysis.create({
        data: {
          ticketId: ticket.id,

          summary: analysis.summary,

          suggestedCategory:
            analysis.suggestedCategory,

          suggestedPriority:
            analysis.suggestedPriority,

          sentiment: analysis.sentiment,

          suggestedResponse:
            analysis.suggestedResponse,

          model,
        },
      });

    // --------------------------------------------------
    // 12. Create activity log
    // --------------------------------------------------

    await prisma.activityLog.create({
      data: {
        ticketId: ticket.id,

        userId: session.user.id,

        action: "AI_ANALYSIS_GENERATED",

        metadata: {
          analysisId: savedAnalysis.id,
          model,
        },
      },
    });

    // --------------------------------------------------
    // 13. Return result
    // --------------------------------------------------

    return NextResponse.json(
      {
        analysis: savedAnalysis,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    // --------------------------------------------------
    // REAL ERROR HANDLING
    // --------------------------------------------------

    console.error(
      "POST /api/tickets/[id]/ai error:"
    );

    console.error(error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      {
        error: errorMessage,
      },
      {
        status: 500,
      }
    );
  }
}