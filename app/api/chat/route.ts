import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI assistant that specializes in vectorization and embeddings. You can help users understand vector databases, similarity search, and RAG (Retrieval Augmented Generation) systems.",
        },
        ...messages,
      ],
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in chat:", error);
    return Response.json({ error: "Failed to process chat" }, { status: 500 });
  }
}
