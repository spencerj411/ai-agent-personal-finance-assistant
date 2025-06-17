import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { VectorizeService } from "@/lib/vectorize";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const userMessage = messages[messages.length - 1];
    let contextDocuments = "";

    if (userMessage?.role === "user" && userMessage?.content) {
      try {
        const vectorizeService = new VectorizeService();
        const documents = await vectorizeService.retrieveDocuments(
          userMessage.content
        );
        contextDocuments =
          vectorizeService.formatDocumentsForContext(documents);
      } catch (vectorizeError) {
        console.error("Vectorize retrieval failed:", vectorizeError);
        contextDocuments =
          "Unable to retrieve relevant documents at this time.";
      }
    }

    const systemPrompt = `You are a helpful AI assistant that specializes in answering questions user have based on sources.

When answering questions, use the following context documents to provide accurate and relevant information:

=== CONTEXT DOCUMENTS ===
${contextDocuments}
=== END CONTEXT DOCUMENTS ===

Please base your responses on the context provided above when relevant. If the context doesn't contain information to answer the question, acknowledge this and provide general knowledge while being clear about what information comes from the context vs. your general knowledge.`;

    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: systemPrompt,
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
