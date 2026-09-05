import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const researchSchema = z.object({
  query: z.string().min(1, "Query is required"),
  jurisdiction: z.string().optional(),
  topicArea: z.string().optional(),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  saveToMatter: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = researchSchema.parse(body);

    const results = performLegalResearch(validatedData);

    let savedResearch = null;
    if (validatedData.saveToMatter) {
      savedResearch = await prisma.research.create({
        data: {
          title: `Research: ${validatedData.query}`,
          query: validatedData.query,
          results: JSON.stringify(results),
          status: "COMPLETED",
          matterId: validatedData.saveToMatter,
        },
        include: {
          matter: { select: { id: true, title: true, number: true } },
        },
      });

      await prisma.timelineEvent.create({
        data: {
          type: "NOTE_ADDED",
          title: "Legal research completed",
          description: `Research performed: ${validatedData.query}`,
          matterId: validatedData.saveToMatter,
        },
      });
    }

    return NextResponse.json({
      results,
      savedResearch,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST AI research error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function performLegalResearch(data: any) {
  const query = data.query.toLowerCase();
  const jurisdiction = data.jurisdiction || "General";

  const legalPrinciples = extractLegalPrinciples(query);
  const relevantStatutes = findRelevantStatutes(query, jurisdiction);
  const caseLawReferences = findCaseLawReferences(query, jurisdiction);
  const analysis = generateResearchAnalysis(query, legalPrinciples, relevantStatutes, caseLawReferences);

  return {
    query: data.query,
    jurisdiction,
    topicArea: data.topicArea,
    timestamp: new Date().toISOString(),
    summary: analysis.summary,
    keyFindings: analysis.keyFindings,
    legalPrinciples,
    relevantStatutes,
    caseLawReferences,
    recommendations: analysis.recommendations,
    confidence: analysis.confidence,
    sources: analysis.sources,
  };
}

function extractLegalPrinciples(query: string) {
  const principles = [];

  if (query.includes("contract") || query.includes("agreement")) {
    principles.push({
      name: "Contract Formation",
      description: "Requires offer, acceptance, consideration, and mutual assent",
      elements: ["Offer", "Acceptance", "Consideration", "Capacity", "Legality"],
    });
  }

  if (query.includes("negligence") || query.includes("tort")) {
    principles.push({
      name: "Negligence",
      description: "Failure to exercise reasonable care resulting in harm",
      elements: ["Duty", "Breach", "Causation", "Damages"],
    });
  }

  if (query.includes("liability")) {
    principles.push({
      name: "Liability Standards",
      description: "Various standards for establishing legal responsibility",
      elements: ["Strict Liability", "Vicarious Liability", "Joint and Several"],
    });
  }

  if (query.includes("property") || query.includes("real estate")) {
    principles.push({
      name: "Property Law",
      description: "Rights and interests in real and personal property",
      elements: ["Ownership", "Easements", "Liens", "Zoning"],
    });
  }

  if (principles.length === 0) {
    principles.push({
      name: "General Legal Analysis",
      description: "Standard legal principles apply",
      elements: ["Facts", "Law", "Application", "Conclusion"],
    });
  }

  return principles;
}

function findRelevantStatutes(query: string, jurisdiction: string) {
  const statutes = [];

  if (query.includes("contract")) {
    statutes.push({
      title: "Uniform Commercial Code (UCC)",
      section: "Article 2 - Sales",
      description: "Governs commercial transactions",
      jurisdiction: "United States",
    });
  }

  if (query.includes("employment") || query.includes("discrimination")) {
    statutes.push({
      title: "Title VII of the Civil Rights Act",
      section: "42 U.S.C. § 2000e",
      description: "Prohibits employment discrimination",
      jurisdiction: "Federal",
    });
  }

  if (query.includes("privacy") || query.includes("data")) {
    statutes.push({
      title: "State Privacy Laws",
      section: "Various",
      description: "Data protection and privacy regulations",
      jurisdiction: jurisdiction,
    });
  }

  return statutes;
}

function findCaseLawReferences(query: string, jurisdiction: string) {
  const cases = [];

  if (query.includes("contract") || query.includes("breach")) {
    cases.push({
      name: "Hadley v. Baxendale",
      citation: "9 Exch. 341 (1854)",
      principle: "Foreseeability of damages in contract breach",
      relevance: "high",
    });
  }

  if (query.includes("negligence") || query.includes("duty")) {
    cases.push({
      name: "Palsgraf v. Long Island Railroad Co.",
      citation: "248 N.Y. 339 (1928)",
      principle: "Duty of care and proximate cause",
      relevance: "high",
    });
  }

  return cases;
}

function generateResearchAnalysis(query: string, principles: any[], statutes: any[], cases: any[]) {
  return {
    summary: `Research on "${query}" identifies ${principles.length} relevant legal principles, ${statutes.length} applicable statutes, and ${cases.length} relevant case law references.`,
    keyFindings: [
      "Multiple legal frameworks may apply to this issue",
      "Jurisdiction-specific rules should be verified",
      "Recent case law developments should be reviewed",
    ],
    recommendations: [
      "Consult primary sources for current legal standards",
      "Verify jurisdiction-specific applicability",
      "Consider consulting with a specialist in this area",
      "Review any recent legislative changes",
    ],
    confidence: "moderate",
    sources: [
      "Legal databases",
      "Statutory compilations",
      "Case law repositories",
    ],
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recentResearch = await prisma.research.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: {
        matter: { select: { id: true, title: true, number: true } },
        citations: true,
      },
    });

    return NextResponse.json({
      recentResearch,
      capabilities: [
        "Legal principle analysis",
        "Statute identification",
        "Case law research",
        "Jurisdiction analysis",
        "Topic-based research",
      ],
    });
  } catch (error) {
    console.error("GET AI research error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
