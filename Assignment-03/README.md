# Assignment 03 — Google NotebookLM RAG

A simple NotebookLM-style RAG app. Users upload a PDF, TXT, or Markdown document, the app chunks and embeds the text, stores vectors in Upstash Vector, retrieves relevant chunks for each question, and asks a Gemini chat model to answer using only the retrieved context.

## Features

- PDF, TXT, and Markdown upload
- Text extraction and chunking
- Gemini embeddings with `gemini-embedding-001`
- Upstash Vector database storage and retrieval
- Grounded answer generation with `gemini-2.5-flash-lite`
- Retrieved source chunks shown under each answer

## RAG Pipeline

1. **Ingestion:** `/api/documents` accepts a file upload.
2. **Extraction:** PDFs are parsed with `pdf-parse`; text files are read as UTF-8.
3. **Chunking:** `src/lib/chunk.ts` creates chunks of about 1,200 characters with a 180-character overlap. It prefers paragraph and sentence boundaries before falling back to a word boundary. The overlap helps preserve context across chunk borders.
4. **Embedding:** Each chunk is embedded with Gemini `gemini-embedding-001` at 1,536 dimensions.
5. **Storage:** Vectors and metadata are upserted into Upstash Vector. Metadata includes `documentId`, `documentName`, `chunkIndex`, and original chunk text.
6. **Retrieval:** `/api/chat` embeds the user question, queries the top 5 chunks for the active document, and passes those chunks as context.
7. **Generation:** The LLM is instructed to answer only from retrieved document context and to say when the document does not contain enough information.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add these values to `.env.local`:

```bash
GEMINI_API_KEY=...
UPSTASH_VECTOR_REST_URL=...
UPSTASH_VECTOR_REST_TOKEN=...
```

Open `http://localhost:3000`.

## Upstash Vector Setup

Create an Upstash Vector index with dimension `1536`, because this app asks Gemini for 1536-dimensional embeddings.

## Deployment

Deploy the folder to Vercel or any Next.js-compatible host. Add the same environment variables in the hosting dashboard. The live link should be publicly accessible for submission.

## Submission Checklist

- Public GitHub repository link
- Live deployed project link
- `.env.local` must not be committed
