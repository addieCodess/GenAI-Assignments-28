import { Index } from "@upstash/vector";

export type ChunkMetadata = {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  text: string;
};

let client: Index | null = null;

export function getVectorIndex() {
  if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
    throw new Error("Upstash Vector credentials are not configured.");
  }

  client ??= new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN
  });

  return client;
}
