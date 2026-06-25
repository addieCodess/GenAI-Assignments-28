const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const EMBEDDING_MODEL = "gemini-embedding-001";
const CHAT_MODEL = "gemini-2.5-flash-lite";
const EMBEDDING_DIMENSIONS = 1536;

type GeminiEmbeddingResponse = {
  embedding?: {
    values?: number[];
  };
};

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

function getGeminiApiKey() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return process.env.GEMINI_API_KEY;
}

async function geminiRequest<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${GEMINI_API_BASE}/${path}?key=${getGeminiApiKey()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<T>;
}

export async function embedTexts(texts: string[]) {
  const embeddings: number[][] = [];

  for (const text of texts) {
    const response = await geminiRequest<GeminiEmbeddingResponse>(
      `models/${EMBEDDING_MODEL}:embedContent`,
      {
        model: `models/${EMBEDDING_MODEL}`,
        content: {
          parts: [{ text }]
        },
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: EMBEDDING_DIMENSIONS
      }
    );

    const values = response.embedding?.values;

    if (!values?.length) {
      throw new Error("Gemini did not return an embedding.");
    }

    embeddings.push(normalize(values));
  }

  return embeddings;
}

export async function embedQuery(text: string) {
  const response = await geminiRequest<GeminiEmbeddingResponse>(
    `models/${EMBEDDING_MODEL}:embedContent`,
    {
      model: `models/${EMBEDDING_MODEL}`,
      content: {
        parts: [{ text }]
      },
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: EMBEDDING_DIMENSIONS
    }
  );

  const values = response.embedding?.values;

  if (!values?.length) {
    throw new Error("Gemini did not return an embedding.");
  }

  return normalize(values);
}

export async function generateGroundedAnswer(question: string, context: string) {
  const response = await geminiRequest<GeminiGenerateResponse>(
    `models/${CHAT_MODEL}:generateContent`,
    {
      systemInstruction: {
        parts: [
          {
            text:
              "You answer questions using only the provided document context. If the answer is not present in the context, say that the document does not contain enough information. Cite source numbers in the answer."
          }
        ]
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Document context:\n${context}\n\nQuestion: ${question}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1
      }
    }
  );

  return (
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join("\n") ?? "No answer was generated."
  );
}

function normalize(values: number[]) {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));

  if (!magnitude) {
    return values;
  }

  return values.map((value) => value / magnitude);
}
