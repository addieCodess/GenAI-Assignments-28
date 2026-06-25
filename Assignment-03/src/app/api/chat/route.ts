import { NextResponse } from "next/server";
import { embedQuery, generateGroundedAnswer } from "@/lib/gemini";
import { ChunkMetadata, getVectorIndex } from "@/lib/vector";

export const runtime = "nodejs";

type ChatRequest = {
  documentId?: string;
  question?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    const documentId = body.documentId?.trim();
    const question = body.question?.trim();

    if (!documentId || !question) {
      return NextResponse.json(
        { error: "A document and question are required." },
        { status: 400 }
      );
    }

    const queryEmbedding = await embedQuery(question);
    const matches = await getVectorIndex().query<ChunkMetadata>({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
      filter: `documentId = '${documentId}'`
    });

    const sources = matches
      .filter((match) => match.metadata?.text)
      .map((match) => ({
        text: match.metadata!.text,
        documentName: match.metadata!.documentName,
        chunkIndex: match.metadata!.chunkIndex,
        score: match.score
      }));

    if (!sources.length) {
      return NextResponse.json({
        answer: "I could not find relevant context in the uploaded document.",
        sources: []
      });
    }

    const context = sources
      .map(
        (source, index) =>
          `[Source ${index + 1} | chunk ${source.chunkIndex} | score ${source.score.toFixed(3)}]\n${source.text}`
      )
      .join("\n\n");

    const answer = await generateGroundedAnswer(question, context);

    return NextResponse.json({
      answer,
      sources
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to answer question.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
