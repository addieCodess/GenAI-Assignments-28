import { extractText, getDocumentProxy } from "unpdf";

export async function extractTextFromFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const type = file.type;
  const name = file.name.toLowerCase();

  if (type === "application/pdf" || name.endsWith(".pdf")) {
    const document = await getDocumentProxy(new Uint8Array(buffer));
    const parsed = await extractText(document, { mergePages: true });
    return parsed.text;
  }

  if (type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    return buffer.toString("utf-8");
  }

  throw new Error("Please upload a PDF, TXT, or Markdown file.");
}
