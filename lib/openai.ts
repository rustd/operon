type JsonSchemaInstruction = {
  name: string;
  schema: Record<string, unknown>;
};

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function extractText(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    throw new Error("Unexpected OpenAI payload");
  }

  const data = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }

  const text = data.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("No text content found in OpenAI response");
  }

  return text;
}

function extractJsonBlock(text: string): string {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return text.slice(start, end + 1);
  }

  const arrayStart = text.indexOf("[");
  const arrayEnd = text.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return text.slice(arrayStart, arrayEnd + 1);
  }

  throw new Error("Could not extract JSON from model response");
}

async function postStructuredResponse({
  apiKey,
  baseUrl,
  model,
  system,
  user,
  schema,
  retry
}: {
  apiKey: string;
  baseUrl: string;
  model: string;
  system: string;
  user: string;
  schema: JsonSchemaInstruction;
  retry: boolean;
}) {
  const response = await fetch(`${baseUrl}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: retry ? `${system}\n\nReturn valid JSON only. No markdown. No prose.` : system
            }
          ]
        },
        { role: "user", content: [{ type: "input_text", text: user }] }
      ],
      text: {
        format: {
          type: "json_schema",
          name: schema.name,
          schema: schema.schema,
          strict: true
        }
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI request failed with status ${response.status}: ${body}`);
  }

  return (await response.json()) as unknown;
}

export async function callOpenAIJson<T>({
  system,
  user,
  schema,
  model
}: {
  system: string;
  user: string;
  schema: JsonSchemaInstruction;
  model: string;
}): Promise<{ data: T; provider: string; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = normalizeBaseUrl(process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1");

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  let lastError: Error | null = null;

  for (const retry of [false, true]) {
    try {
      const payload = await postStructuredResponse({
        apiKey,
        baseUrl,
        model,
        system,
        user,
        schema,
        retry
      });
      const text = extractText(payload);
      return {
        data: JSON.parse(extractJsonBlock(text)) as T,
        provider: "OpenAI",
        model
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown OpenAI error");
    }
  }

  throw lastError ?? new Error("Unknown OpenAI error");
}
