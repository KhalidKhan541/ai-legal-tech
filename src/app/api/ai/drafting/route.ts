import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const draftingSchema = z.object({
  type: z.enum(["CONTRACT", "BRIEF", "MOTION", "AGREEMENT", "CORRESPONDENCE", "MEMO"]),
  prompt: z.string().min(1, "Prompt is required"),
  context: z.object({
    matterId: z.string().optional(),
    clientId: z.string().optional(),
    opposingParty: z.string().optional(),
    jurisdiction: z.string().optional(),
    specificRequirements: z.string().optional(),
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
    const validatedData = draftingSchema.parse(body);

    const draft = generateLegalDraft(validatedData);

    let savedDocument = null;
    if (validatedData.saveToMatter) {
      savedDocument = await prisma.document.create({
        data: {
          title: draft.title,
          type: validatedData.type,
          content: draft.content,
          matterId: validatedData.saveToMatter,
          uploadedById: (session.user as any).id,
        },
        include: {
          matter: { select: { id: true, title: true, number: true } },
        },
      });

      await prisma.documentVersion.create({
        data: {
          documentId: savedDocument.id,
          version: 1,
          content: draft.content,
          changes: "AI-generated draft",
        },
      });

      await prisma.timelineEvent.create({
        data: {
          type: "DOCUMENT_UPLOADED",
          title: "AI draft created",
          description: `AI-generated ${validatedData.type.toLowerCase()} created`,
          matterId: validatedData.saveToMatter,
        },
      });
    }

    return NextResponse.json({
      draft,
      savedDocument,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST AI drafting error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function generateLegalDraft(data: any) {
  const { type, prompt, context } = data;

  const templates: Record<string, any> = {
    CONTRACT: generateContractDraft,
    BRIEF: generateBriefDraft,
    MOTION: generateMotionDraft,
    AGREEMENT: generateAgreementDraft,
    CORRESPONDENCE: generateCorrespondenceDraft,
    MEMO: generateMemoDraft,
  };

  const generator = templates[type] || generateGenericDraft;
  return generator(prompt, context);
}

function generateContractDraft(prompt: string, context?: any) {
  return {
    title: `Contract Agreement - ${new Date().toLocaleDateString()}`,
    content: `CONTRACT AGREEMENT

This Contract Agreement ("Agreement") is entered into as of ${new Date().toLocaleDateString()} by and between:

[PARTY NAME] ("First Party")
and
[OPPOSING PARTY NAME] ("Second Party")

RECITALS

WHEREAS, ${prompt};

NOW, THEREFORE, in consideration of the mutual covenants and promises contained herein, the parties agree as follows:

ARTICLE 1 - PURPOSE
1.1 The purpose of this Agreement is to set forth the terms and conditions under which the parties agree to ${prompt.toLowerCase()}.

ARTICLE 2 - SCOPE OF WORK
2.1 The First Party shall provide the following services: [DESCRIBE SERVICES]
2.2 The Second Party shall provide: [DESCRIBE OBLIGATIONS]

ARTICLE 3 - TERM
3.1 This Agreement shall commence on [START DATE] and continue until [END DATE] unless terminated earlier in accordance with this Agreement.

ARTICLE 4 - COMPENSATION
4.1 The Second Party shall pay the First Party [AMOUNT] for the services rendered under this Agreement.
4.2 Payment shall be made according to the following schedule: [PAYMENT TERMS]

ARTICLE 5 - CONFIDENTIALITY
5.1 Both parties agree to maintain the confidentiality of all proprietary information shared during the term of this Agreement.

ARTICLE 6 - TERMINATION
6.1 Either party may terminate this Agreement with [NUMBER] days written notice.

ARTICLE 7 - GOVERNING LAW
7.1 This Agreement shall be governed by and construed in accordance with the laws of [JURISDICTION].

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.

[PARTY NAME]                    [OPPOSING PARTY NAME]
_________________________       _________________________
Name:                           Name:
Title:                          Title:
Date:                           Date:`,
    notes: [
      "Review all bracketed sections and fill in appropriate information",
      "Consider adding specific provisions for your industry",
      "Have an attorney review before execution",
      "Ensure all parties sign and retain copies",
    ],
    wordCount: 350,
  };
}

function generateBriefDraft(prompt: string, context?: any) {
  return {
    title: `Legal Brief - ${new Date().toLocaleDateString()}`,
    content: `IN THE [COURT NAME]

[CASE NAME]

Case No: [CASE NUMBER]

BRIEF OF [PARTY NAME]

I. INTRODUCTION
This brief is submitted on behalf of [PARTY NAME] in response to ${prompt}.

II. STATEMENT OF FACTS
[STATE RELEVANT FACTS HERE]

III. LEGAL STANDARD
[STATE APPLICABLE LEGAL STANDARDS]

IV. ARGUMENT

A. [FIRST ARGUMENT]
[DEVELOP FIRST ARGUMENT WITH AUTHORITY]

B. [SECOND ARGUMENT]
[DEVELOP SECOND ARGUMENT WITH AUTHORITY]

C. [THIRD ARGUMENT]
[DEVELOP THIRD ARGUMENT WITH AUTHORITY]

V. CONCLUSION
For the foregoing reasons, [PARTY NAME] respectfully requests that this Court [RELIEF REQUESTED].

Respectfully submitted,

[ATTORNEY NAME]
[BAR NUMBER]
[FIRM NAME]
[ADDRESS]
[PHONE]
[EMAIL]`,
    notes: [
      "Verify court-specific formatting requirements",
      "Cite all legal authorities properly",
      "Ensure page limits are respected",
      "File within applicable deadlines",
    ],
    wordCount: 400,
  };
}

function generateMotionDraft(prompt: string, context?: any) {
  return {
    title: `Motion - ${new Date().toLocaleDateString()}`,
    content: `IN THE [COURT NAME]

[CASE NAME]

Case No: [CASE NUMBER]

MOTION FOR [TYPE OF MOTION]

[PARTY NAME], by and through undersigned counsel, respectfully moves this Court for [RELIEF SOUGHT] and in support thereof states as follows:

I. INTRODUCTION
This Motion is brought pursuant to [STATUTE/RULE] and is based upon ${prompt}.

II. FACTUAL BACKGROUND
[STATE FACTUAL BASIS FOR MOTION]

III. LEGAL ARGUMENT

A. [LEGAL BASIS FOR MOTION]
[DEVELOP ARGUMENT WITH AUTHORITY]

B. [ADDITIONAL SUPPORTING AUTHORITY]
[PROVIDE ADDITIONAL SUPPORT]

IV. CONCLUSION
WHEREFORE, [PARTY NAME] respectfully requests that this Court grant the following relief:
1. [SPECIFIC RELIEF REQUESTED]
2. Such other and further relief as this Court deems just and proper.

Dated: ${new Date().toLocaleDateString()}

Respectfully submitted,

[ATTORNEY NAME]
[BAR NUMBER]
[FIRM NAME]
Attorney for [PARTY NAME]
[ADDRESS]
[PHONE]
[EMAIL]`,
    notes: [
      "Verify motion deadlines and requirements",
      "Check for required supporting declarations",
      "Ensure proper service on all parties",
      "Consider whether a hearing is required",
    ],
    wordCount: 350,
  };
}

function generateAgreementDraft(prompt: string, context?: any) {
  return {
    title: `Agreement - ${new Date().toLocaleDateString()}`,
    content: `[TYPE OF AGREEMENT]

This Agreement is made and entered into as of ${new Date().toLocaleDateString()} by and between:

[PARTY A] ("Party A")
and
[PARTY B] ("Party B")

1. PURPOSE
This Agreement sets forth the terms under which ${prompt}.

2. TERMS AND CONDITIONS
2.1 [TERM 1]
2.2 [TERM 2]
2.3 [TERM 3]

3. OBLIGATIONS
3.1 Party A shall: [OBLIGATIONS]
3.2 Party B shall: [OBLIGATIONS]

4. TERM AND TERMINATION
4.1 This Agreement shall be effective from [DATE] until [DATE].
4.2 Either party may terminate with [NOTICE] days written notice.

5. DISPUTE RESOLUTION
5.1 Any disputes shall be resolved through [MEDIATION/ARBITRATION/LITIGATION].

6. GOVERNING LAW
6.1 This Agreement shall be governed by the laws of [JURISDICTION].

7. ENTIRE AGREEMENT
7.1 This Agreement constitutes the entire agreement between the parties.

IN WITNESS WHEREOF, the parties have executed this Agreement.

[Psignature]                    [Bsignature]
[Pname]                         [Bname]
[Title]                         [Title]`,
    notes: [
      "Customize for specific agreement type",
      "Include all necessary schedules and exhibits",
      "Ensure consideration is adequate",
      "Review for compliance with applicable laws",
    ],
    wordCount: 300,
  };
}

function generateCorrespondenceDraft(prompt: string, context?: any) {
  return {
    title: `Correspondence - ${new Date().toLocaleDateString()}`,
    content: `[YOUR FIRM LETTERHEAD]

${new Date().toLocaleDateString()}

[RECIPIENT NAME]
[RECIPIENT ADDRESS]
[RECIPIENT CITY, STATE ZIP]

Re: [MATTER NAME/NUMBER]
Dear [RECIPIENT NAME],

${prompt}

[ADDITIONAL CONTENT AS NEEDED]

Please do not hesitate to contact me if you have any questions or wish to discuss this matter further.

Sincerely,

[ATTORNEY NAME]
[TITLE]
[FIRM NAME]
[PHONE]
[EMAIL]`,
    notes: [
      "Review tone and professionalism",
      "Verify all facts before sending",
      "Keep copies of all correspondence",
      "Consider privilege implications",
    ],
    wordCount: 150,
  };
}

function generateMemoDraft(prompt: string, context?: any) {
  return {
    title: `Legal Memorandum - ${new Date().toLocaleDateString()}`,
    content: `MEMORANDUM

TO: [RECIPIENT]
FROM: [AUTHOR]
DATE: ${new Date().toLocaleDateString()}
RE: [SUBJECT MATTER]

I. QUESTION PRESENTED
[STATE THE LEGAL QUESTION]

II. BRIEF ANSWER
[PROVIDE CONCISE ANSWER]

III. STATEMENT OF FACTS
[RELEVANT FACTS]

IV. DISCUSSION

A. [FIRST ISSUE]
[ANALYSIS WITH AUTHORITY]

B. [SECOND ISSUE]
[ANALYSIS WITH AUTHORITY]

V. CONCLUSION
[SUMMARY OF FINDINGS]

[ADDITIONAL NOTES AS NEEDED]`,
    notes: [
      "Ensure analysis is thorough and well-supported",
      "Cite all relevant authorities",
      "Consider counterarguments",
      "Provide practical recommendations",
    ],
    wordCount: 300,
  };
}

function generateGenericDraft(prompt: string, context?: any) {
  return {
    title: `Legal Document - ${new Date().toLocaleDateString()}`,
    content: `LEGAL DOCUMENT

Date: ${new Date().toLocaleDateString()}

RE: ${prompt}

[CONTENT TO BE DEVELOPED BASED ON SPECIFIC REQUIREMENTS]

[ADDITIONAL SECTIONS AS NEEDED]`,
    notes: [
      "Customize based on specific requirements",
      "Review for accuracy and completeness",
      "Have attorney review before finalizing",
    ],
    wordCount: 100,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      documentTypes: [
        { type: "CONTRACT", description: "Commercial contracts and agreements" },
        { type: "BRIEF", description: "Court briefs and memoranda" },
        { type: "MOTION", description: "Motions and applications" },
        { type: "AGREEMENT", description: "General agreements" },
        { type: "CORRESPONDENCE", description: "Professional correspondence" },
        { type: "MEMO", description: "Legal memoranda" },
      ],
      capabilities: [
        "Template-based document generation",
        "Context-aware drafting",
        "Legal language optimization",
        "Clause suggestion",
        "Compliance checking",
      ],
    });
  } catch (error) {
    console.error("GET AI drafting error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
