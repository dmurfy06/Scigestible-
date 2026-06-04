import { NextRequest, NextResponse } from 'next/server';
import { PaperAnalysis } from '@/lib/types';
import OpenAI from 'openai';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn(
    'Warning: OPENAI_API_KEY is not set. Paper analysis will not work. Please set the environment variable.'
  );
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function analyzePaperContent(paperText: string): Promise<PaperAnalysis> {
  const truncatedText = paperText.substring(0, 20000);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a science communicator who explains specific research papers to first-year university students with no specialist background.

STRICT RULES — violating any of these is a failure:
1. Every sentence must be grounded in something actually stated or shown in this paper. No generic statements that could apply to any paper.
2. Use real numbers, names, organisms, drugs, genes, diseases, or locations from the paper whenever possible.
3. Never use vague filler phrases like "the researchers investigated", "this study explores", "shedding light on", "plays a crucial role", "paving the way", "groundbreaking", "novel approach", or "further research is needed".
4. Write as if explaining to a smart 18-year-old who has never read a science paper — short sentences, concrete comparisons, zero jargon unless you define it immediately.
5. If something is not clear from the text, say what the paper actually says rather than guessing.`,
      },
      {
        role: 'user',
        content: `Here is the research paper to analyze:

---
${truncatedText}
---

Return ONLY a JSON object with this exact structure (no extra keys, no markdown):
{
  "studyObjective": {
    "points": ["objective 1", "objective 2"]
  },
  "plainEnglishSummary": {
    "text": "summary here"
  },
  "keyFindings": [
    { "text": "finding 1" },
    { "text": "finding 2" }
  ],
  "methodsOverview": {
    "text": "methods explanation here"
  },
  "limitations": [
    { "text": "limitation 1" },
    { "text": "limitation 2" }
  ],
  "glossary": [
    { "term": "Term", "definition": "definition" }
  ],
  "citationData": {
    "authors": ["Lastname, Firstname Middlename", "Lastname, Firstname"],
    "year": "2023",
    "title": "Full title of the paper exactly as it appears",
    "journal": "Full journal or conference name",
    "volume": "15",
    "issue": "3",
    "pages": "123-145",
    "doi": "10.1234/example.2023.001",
    "publisher": null,
    "placeOfPublication": null
  }
}

Field-by-field instructions:

studyObjective (2–4 points):
- State the specific problem this paper addresses — name the disease, species, chemical, phenomenon, etc.
- Explain why this specific problem matters in one concrete sentence (e.g. "X affects N million people" or "Y causes Z% of crop failures").
- State what the researchers actually did to investigate it (the core experiment or analysis).

plainEnglishSummary (150–250 words):
- Open with one sentence saying exactly what the paper did and what it found.
- Then explain the approach using a real-world analogy if helpful.
- Include the main result with actual numbers or effect sizes from the paper.
- End with one sentence on what this means practically — not "more research is needed".

keyFindings (4–7 items):
- Each finding must include a specific result: a number, a comparison, a statistic, a named outcome.
- Bad example: "The treatment improved patient outcomes."
- Good example: "Patients given 10mg of Drug X showed a 34% reduction in symptom severity after 8 weeks compared to placebo."

methodsOverview:
- Name the actual techniques used (e.g. PCR, fMRI, randomised controlled trial, meta-analysis of N studies).
- Describe the sample: how many participants/animals/cells, key characteristics (age, sex, condition).
- Explain what was measured and how in plain terms.

limitations (3–5 items):
- Be specific: name the actual constraint (e.g. "only 42 participants", "all participants were male", "conducted in mice not humans", "self-reported data").
- Explain why each limitation matters for interpreting the results.

glossary (5–12 terms):
- Only include terms that actually appear in this paper.
- Definitions must be one or two plain sentences that would make sense to someone who just heard the term for the first time.

citationData:
- Extract from the paper's header, title page, or references section.
- authors: list each author as "Lastname, Firstname Middlename" (full names, not initials, if available). If only initials appear in the paper, use those (e.g. "Smith, J. D.").
- year: four-digit publication year. If not found, use "n.d."
- title: exact full title of this paper as it appears in the document.
- journal: full journal name, conference name, or book title. Use null if a book chapter and put the book title in publisher instead.
- volume, issue, pages: as they appear. Use null if not found.
- doi: the DOI string only (no "https://doi.org/" prefix). Use null if not found.
- publisher, placeOfPublication: only for books/reports. Use null for journal articles.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response received from OpenAI');
  }

  try {
    return JSON.parse(content) as PaperAnalysis;
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    throw new Error('Failed to parse analysis results from AI');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { paperText, filename } = await request.json();

    if (!paperText || paperText.trim().length === 0) {
      return NextResponse.json({ error: 'Paper text is empty' }, { status: 400 });
    }

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const analysis = await analyzePaperContent(paperText);

    // Save to Supabase
    const { data: saved, error: dbError } = await supabase
      .from('papers')
      .insert({ user_id: user.id, filename, analysis })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to save paper to database:', dbError);
      throw new Error('Analysis complete but failed to save. Check your Supabase table setup.');
    }

    // Return full Paper object matching the frontend type
    return NextResponse.json({
      id: saved.id,
      filename: saved.filename,
      analysis: saved.analysis,
      uploadedAt: new Date(saved.uploaded_at).getTime(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Analysis error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
