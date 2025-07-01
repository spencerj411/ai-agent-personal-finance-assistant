import { Agent, Runner, MCPServerStreamableHttp, AgentInputItem } from "@openai/agents";
import { openai } from "@ai-sdk/openai";
import { aisdk } from "@openai/agents-extensions";

interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

let personalFinanceMcpServer: MCPServerStreamableHttp | null = null;
let thread: AgentInputItem[] = [];

async function getOrCreateMcpServer() {
  if (!personalFinanceMcpServer) {
    personalFinanceMcpServer = new MCPServerStreamableHttp({
      url: 'http://localhost:3000/mcp',
      name: 'Personal Finance Assistant MCP Server',
    });
    await personalFinanceMcpServer.connect();
    console.log('MCP server connected');
  }
  return personalFinanceMcpServer;
}

export async function POST(req: Request) {
  try {
    const mcpServer = await getOrCreateMcpServer();

    const { messages }: { messages: AgentMessage[] } = await req.json();
    const model = aisdk(openai("gpt-4o"));

    const agent = new Agent({
      name: "Personal Finance Agent",
      instructions: `You are a helpful personal finance assistant that keeps track of the user's income budget, goals and expenses. 
      
      When users ask questions:
      1. Use available tools to assist in anything personal finance related.
      2. Provide comprehensive but concise answers based on the data retrieved.
      3. If the user asks questions not relevant to personal finance, be clear and polite about how your only job is to assist with personal finance`,
      model,
      mcpServers: [mcpServer],
    });

    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.role !== "user") {
      return Response.json(
        { error: "Invalid message format" },
        { status: 400 }
      );
    }

    const runner = new Runner({ model });
    const stream = await runner.run(
      agent,
      thread.concat({ role: 'user', content: latestMessage.content }),
      { stream: true }
    );

    thread = stream.history;

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const textStream = stream.toTextStream({
            compatibleWithNodeStreams: false,
          });
          
          for await (const chunk of textStream) {
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          await stream.completed;
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in agents SDK endpoint:", error);
    return Response.json(
      { error: "Failed to process request with Agents SDK" },
      { status: 500 }
    );
  }
}