import { Agent, Runner, MCPServerStdio } from "@openai/agents";
import { openai } from "@ai-sdk/openai";
import { aisdk } from "@openai/agents-extensions";
import { z } from "zod";

interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: AgentMessage[] } = await req.json();

    const model = aisdk(openai("gpt-4o"));

    const personalFinanceMcpServer = new MCPServerStdio({
      name: "Personal Finance MCP Server",
      fullCommand: "/Users/darramos/.nvm/versions/node/v24.3.0/bin/npx -y mcp-remote http://localhost:3000/mcp",
    });

    await personalFinanceMcpServer.connect();

    try {
      const agent = new Agent({
        name: "AI SDK Agent Assistant",
        instructions: `You are a personal finance assistant. Before the user can log or view expenses, they must complete their setup using the 'user_setup' tool. The tool requires:
        - annual_income: a number (e.g., 50000)
        - goals: a string (e.g., "save 10000 by year-end")
        - budgets: a JSON string of category-amount pairs (e.g., '{"needs": 1000, "wants": 1000}')
        
        Parse the user's input to extract these values. For example, from "50,000 a year, save 10,000 by the end of the year and 1000 a month for both needs and wants," extract:
        - annual_income: 50000
        - goals: "save 10000 by the end of the year"
        - budgets: '{"needs": 1000, "wants": 1000}'
        
        If the input is unclear, ask the user to provide the required details. If the tool fails due to an invalid budgets format, respond with: "Invalid budgets format. Please provide a valid JSON string, like '{\"needs\": 1000, \"wants\": 1000}'." For unrelated requests, say: "I only handle expense tracking and setup."`,
        model,
        mcpServers: [personalFinanceMcpServer],
      });

      const runner = new Runner({ model });

      const fullContext = messages.map(m => `${m.role}: ${m.content}`).join("\n");
      const stream = await runner.run(agent, fullContext, { stream: true });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            const textStream = stream.toTextStream({ compatibleWithNodeStreams: false });
            for await (const chunk of textStream) {
              const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
            await stream.completed;
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } catch (error) {
            console.error("Streaming error:", error);
            controller.error(error);
          } finally {
            await personalFinanceMcpServer.close();
            controller.close();
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
      return Response.json({ error: "Failed to process request with Agents SDK" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in agents SDK endpoint:", error);
    return Response.json({ error: "Failed to process request with Agents SDK" }, { status: 500 });
  }
}
