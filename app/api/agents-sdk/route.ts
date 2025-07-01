import { Agent, Runner, tool, MCPServerStreamableHttp } from "@openai/agents";
import { openai } from "@ai-sdk/openai";
import { aisdk } from "@openai/agents-extensions";
import { z } from "zod";

interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  try {
    // const dateTimeMcpServer = new MCPServerStreamableHttp({
    //   url: 'https://server.smithery.ai/@chirag127/date-and-time-mcp-server/mcp?api_key=802a7544-1363-4daf-ba0e-d17558b20cf5&profile=evil-mole-5KxwUV',
    //   name: 'Date and Time MCP Server',
    // });

    const personalFinanceMcpServer = new MCPServerStreamableHttp({
      url: 'http://localhost:3000/mcp',
      name: 'Personal Finance Assistant MCP Server',
    });

    const { messages }: { messages: AgentMessage[] } = await req.json();

    const model = aisdk(openai("gpt-4o"));

    const agent = new Agent({
      name: "AI SDK Agent Assistant",
      instructions: `You are a helpful personal finance assistant that keeps track of the user's income budget, goals and expenses. 
      
      When users ask questions:
      1. Use available tools to gather relevant information
      2. Provide comprehensive answers based on the data retrieved
      3. Be clear about what information comes from which sources`,
      model,
      mcpServers: [ personalFinanceMcpServer ],
    });

    // await dateTimeMcpServer.connect();
    await personalFinanceMcpServer.connect();
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.role !== "user") {
      return Response.json(
        { error: "Invalid message format" },
        { status: 400 }
      );
    }

    const runner = new Runner({
      model,
    });

    const stream = await runner.run(agent, latestMessage.content, {
      stream: true,
    });


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
          // await dateTimeMcpServer.close();
          await personalFinanceMcpServer.close();
        } catch (error) {
          console.error("Streaming error:", error);
          // await dateTimeMcpServer.close();
          await personalFinanceMcpServer.close();
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
