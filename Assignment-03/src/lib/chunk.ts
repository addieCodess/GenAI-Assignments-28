export type TextChunk = {
  id: string;
  text: string;
  index: number;
};

const TARGET_CHARS = 1200;
const OVERLAP_CHARS = 180;

export function chunkText(text: string, documentId: string): TextChunk[] {
  const normalized = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();

  if (!normalized) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < normalized.length) {
    const targetEnd = Math.min(start + TARGET_CHARS, normalized.length);
    const end = findNaturalBreak(normalized, start, targetEnd);
    const chunk = normalized.slice(start, end).trim();

    if (chunk) {
      chunks.push({
        id: `${documentId}-chunk-${chunks.length}`,
        text: chunk,
        index: chunks.length
      });
    }

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(end - OVERLAP_CHARS, start + 1);
  }

  return chunks;
}

function findNaturalBreak(text: string, start: number, targetEnd: number) {
  if (targetEnd >= text.length) {
    return text.length;
  }

  const window = text.slice(start, targetEnd);
  const paragraphBreak = window.lastIndexOf("\n\n");

  if (paragraphBreak > TARGET_CHARS * 0.55) {
    return start + paragraphBreak;
  }

  const sentenceBreak = Math.max(
    window.lastIndexOf(". "),
    window.lastIndexOf("? "),
    window.lastIndexOf("! ")
  );

  if (sentenceBreak > TARGET_CHARS * 0.55) {
    return start + sentenceBreak + 1;
  }

  const wordBreak = window.lastIndexOf(" ");
  return wordBreak > 0 ? start + wordBreak : targetEnd;
}
