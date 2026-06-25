import { NextResponse } from "next/server";
import { chunkText } from "@/lib/chunk";
import { extractTextFromFile } from "@/lib/extract";
import { embedTexts } from "@/lib/gemini";
import { ChunkMetadata, getVectorIndex } from "@/lib/vector";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }

    const documentId = crypto.randomUUID();
    const text = await extractTextFromFile(file);
    const chunks = chunkText(text, documentId);

    if (!chunks.length) {
      return NextResponse.json(
        { error: "The uploaded file did not contain readable text." },
        { status: 400 }
      );
    }

    const embeddings = await embedTexts(chunks.map((chunk) => chunk.text));

    await getVectorIndex().upsert(
      chunks.map((chunk, position) => ({
        id: chunk.id,
        vector: embeddings[position],
        metadata: {
          documentId,
          documentName: file.name,
          chunkIndex: chunk.index,
          text: chunk.text
        } satisfies ChunkMetadata
      }))
    );

    return NextResponse.json({
      documentId,
      documentName: file.name,
      chunkCount: chunks.length
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
