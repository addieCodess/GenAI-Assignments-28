"use client";

import { FormEvent, useMemo, useState } from "react";
import { FileText, Loader2, Send, UploadCloud } from "lucide-react";

type DocumentState = {
  documentId: string;
  documentName: string;
  chunkCount: number;
};

type Source = {
  text: string;
  documentName: string;
  chunkIndex: number;
  score: number;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [documentState, setDocumentState] = useState<DocumentState | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState("");

  const readyLabel = useMemo(() => {
    if (!documentState) return "No document indexed";
    return `${documentState.chunkCount} chunks indexed`;
  }, [documentState]);

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError("");
    setMessages([]);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/documents", {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    setIsUploading(false);

    if (!response.ok) {
      setError(data.error ?? "Upload failed.");
      return;
    }

    setDocumentState(data);
  }

  async function askQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!documentState || !question.trim()) return;

    const currentQuestion = question.trim();
    setQuestion("");
    setError("");
    setIsAsking(true);
    setMessages((previous) => [...previous, { role: "user", content: currentQuestion }]);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId: documentState.documentId,
        question: currentQuestion
      })
    });

    const data = await response.json();
    setIsAsking(false);

    if (!response.ok) {
      setError(data.error ?? "Question failed.");
      return;
    }

    setMessages((previous) => [
      ...previous,
      { role: "assistant", content: data.answer, sources: data.sources }
    ]);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <section className="brand">
          <h1>NotebookLM RAG</h1>
          <p>Upload a PDF or text file, index it, then ask questions grounded only in that document.</p>
        </section>

        <form className="upload-box" onSubmit={uploadDocument}>
          <label className="file-input">
            <span>Document</span>
            <input
              type="file"
              accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <button className="primary-button" type="submit" disabled={!file || isUploading}>
            {isUploading ? <Loader2 size={18} /> : <UploadCloud size={18} />}
            {isUploading ? "Indexing..." : "Index document"}
          </button>
          <span className="helper">{readyLabel}</span>
          {documentState ? (
            <span className="meta">
              Active file: <strong>{documentState.documentName}</strong>
            </span>
          ) : null}
          {error ? <span className="error">{error}</span> : null}
        </form>

        <section className="notes">
          <h2>Pipeline</h2>
          <ul>
            <li>Extract text from PDF, TXT, or Markdown.</li>
            <li>Chunk with 1,200 characters and 180-character overlap.</li>
            <li>Embed chunks with Gemini and store them in Upstash Vector.</li>
            <li>Retrieve top chunks and answer with cited context.</li>
          </ul>
        </section>
      </aside>

      <section className="chat-area">
        <div className="chat-main">
          <header className="chat-header">
            <div>
              <h2>Document chat</h2>
              <span className="helper">Answers are restricted to retrieved context.</span>
            </div>
            <span className="status-pill">
              <FileText size={16} />
              {documentState ? "Ready" : "Upload first"}
            </span>
          </header>

          <div className="messages">
            {messages.length === 0 ? (
              <article className="message assistant">
                <div className="bubble">
                  Upload a document to start. Once it is indexed, ask a question like
                  “What are the main requirements?” or “Summarize the grading criteria.”
                </div>
              </article>
            ) : null}

            {messages.map((message, index) => (
              <article className={`message ${message.role}`} key={`${message.role}-${index}`}>
                <div className="bubble">{message.content}</div>
                {message.sources?.length ? (
                  <div className="sources">
                    <h3>Retrieved sources</h3>
                    {message.sources.map((source, sourceIndex) => (
                      <div className="source-card" key={`${source.chunkIndex}-${sourceIndex}`}>
                        <div className="source-title">
                          <span>Source {sourceIndex + 1}: chunk {source.chunkIndex}</span>
                          <span>{source.score.toFixed(3)}</span>
                        </div>
                        <p className="source-text">{source.text.slice(0, 420)}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          <form className="composer" onSubmit={askQuestion}>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={
                documentState
                  ? "Ask about the uploaded document..."
                  : "Upload and index a document first..."
              }
              disabled={!documentState || isAsking}
            />
            <button
              className="send-button"
              type="submit"
              disabled={!documentState || !question.trim() || isAsking}
              aria-label="Send question"
            >
              {isAsking ? <Loader2 size={18} /> : <Send size={18} />}
              {isAsking ? "Thinking" : "Ask"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
