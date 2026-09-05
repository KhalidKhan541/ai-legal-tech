import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const contractReviewSchema = z.object({
  contractId: z.string().min(1, "Contract ID is required"),
  focusAreas: z.array(z.string()).optional(),
});

const RISK_CLAUSES = [
  "indemnification",
  "limitation of liability",
  "warranty",
  "termination",
  "intellectual property",
  "confidentiality",
  "non-compete",
  "governing law",
  "dispute resolution",
  "force majeure",
];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = contractReviewSchema.parse(body);

    const contract = await prisma.contract.findUnique({
      where: { id: validatedData.contractId },
      include: { clauses: true },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const analysis = analyzeContract(contract, validatedData.focusAreas);

    const review = await prisma.contractReview.create({
      data: {
        contractId: validatedData.contractId,
        reviewerId: (session.user as any).id,
        status: "COMPLETED",
        comments: JSON.stringify(analysis),
        score: analysis.overallScore,
      },
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ analysis, review });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST AI contract review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function analyzeContract(contract: any, focusAreas?: string[]) {
  const clauses = contract.clauses || [];
  const content = contract.content || "";

  const clauseAnalysis = clauses.map((clause: any) => {
    const riskLevel = assessClauseRisk(clause);
    const suggestions = generateClauseSuggestions(clause);

    return {
      id: clause.id,
      title: clause.title,
      riskLevel,
      suggestions,
      hasIssues: riskLevel === "high" || riskLevel === "medium",
    };
  });

  const missingClauses = RISK_CLAUSES.filter((rc) => {
    const found = clauses.some((c: any) =>
      c.title.toLowerCase().includes(rc) ||
      c.content?.toLowerCase().includes(rc)
    );
    return !found;
  });

  const overallScore = calculateOverallScore(clauseAnalysis, missingClauses, content);

  return {
    contractId: contract.id,
    contractTitle: contract.title,
    overallScore,
    summary: generateSummary(overallScore, clauseAnalysis, missingClauses),
    clauseAnalysis,
    missingClauses,
    recommendations: generateRecommendations(clauseAnalysis, missingClauses),
    focusAreas: focusAreas || RISK_CLAUSES,
  };
}

function assessClauseRisk(clause: any): string {
  const content = (clause.content || "").toLowerCase();
  const title = (clause.title || "").toLowerCase();

  if (content.includes("unlimited liability") || content.includes("no limitation")) {
    return "high";
  }
  if (content.includes("indemnif") && !content.includes("mutual")) {
    return "medium";
  }
  if (title.includes("termination") && !content.includes("notice")) {
    return "medium";
  }
  return "low";
}

function generateClauseSuggestions(clause: any): string[] {
  const suggestions: string[] = [];
  const content = (clause.content || "").toLowerCase();

  if (content.includes("governing law") && !content.includes("jurisdiction")) {
    suggestions.push("Consider specifying jurisdiction in addition to governing law");
  }
  if (content.includes("confidentiality") && !content.includes("duration")) {
    suggestions.push("Add duration for confidentiality obligations");
  }
  if (content.includes("warranty") && content.includes("as is")) {
    suggestions.push("Review 'as is' warranty limitations carefully");
  }

  return suggestions;
}

function calculateOverallScore(clauseAnalysis: any[], missingClauses: string[], content: string): number {
  let score = 100;

  const highRiskCount = clauseAnalysis.filter((c) => c.riskLevel === "high").length;
  const mediumRiskCount = clauseAnalysis.filter((c) => c.riskLevel === "medium").length;

  score -= highRiskCount * 15;
  score -= mediumRiskCount * 8;
  score -= missingClauses.length * 5;

  if (content.length < 500) score -= 10;
  if (content.length < 200) score -= 10;

  return Math.max(0, Math.min(100, score));
}

function generateSummary(score: number, clauseAnalysis: any[], missingClauses: string[]): string {
  const highRisk = clauseAnalysis.filter((c) => c.riskLevel === "high").length;
  const mediumRisk = clauseAnalysis.filter((c) => c.riskLevel === "medium").length;

  let summary = `Overall contract score: ${score}/100. `;

  if (score >= 80) {
    summary += "This contract appears to be well-structured with manageable risks. ";
  } else if (score >= 60) {
    summary += "This contract has some areas that require attention. ";
  } else {
    summary += "This contract has significant issues that need to be addressed. ";
  }

  summary += `Found ${highRisk} high-risk and ${mediumRisk} medium-risk clauses. `;
  if (missingClauses.length > 0) {
    summary += `Missing important clauses: ${missingClauses.join(", ")}.`;
  }

  return summary;
}

function generateRecommendations(clauseAnalysis: any[], missingClauses: string[]): string[] {
  const recommendations: string[] = [];

  const highRiskClauses = clauseAnalysis.filter((c) => c.riskLevel === "high");
  if (highRiskClauses.length > 0) {
    recommendations.push(`Review ${highRiskClauses.length} high-risk clause(s) immediately`);
  }

  if (missingClauses.includes("limitation of liability")) {
    recommendations.push("Add limitation of liability clause to cap potential damages");
  }
  if (missingClauses.includes("termination")) {
    recommendations.push("Include clear termination provisions with notice periods");
  }
  if (missingClauses.includes("confidentiality")) {
    recommendations.push("Add confidentiality clause to protect sensitive information");
  }
  if (missingClauses.includes("dispute resolution")) {
    recommendations.push("Consider adding dispute resolution mechanism (mediation/arbitration)");
  }

  recommendations.push("Have the contract reviewed by a licensed attorney in the relevant jurisdiction");

  return recommendations;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      capabilities: [
        "Contract clause analysis",
        "Risk assessment",
        "Missing clause identification",
        "Compliance review",
        "Term comparison",
      ],
      riskCategories: RISK_CLAUSES,
    });
  } catch (error) {
    console.error("GET AI contract review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
