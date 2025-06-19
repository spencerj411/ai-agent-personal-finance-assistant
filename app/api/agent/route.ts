import { ToolInvocation, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { RetrievalService } from "@/lib/retrieval";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolInvocations?: ToolInvocation[];
}

function getLocation() {
  return { lat: 37.7749, lon: -122.4194 };
}

function getWeather({
  lat,
  lon,
  unit,
}: {
  lat: number;
  lon: number;
  unit: "C" | "F";
}) {
  return { value: 25, description: "Sunny" };
}

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system: "You are a helpful assistant.",
    messages,
    onStepFinish(result) {
      console.log(result);
    },
    tools: {
      getLocation: {
        description: "Get the location of the user",
        parameters: z.object({}),
        execute: async () => {
          const { lat, lon } = getLocation();
          return `Your location is at latitude ${lat} and longitude ${lon}`;
        },
      },
      getWeather: {
        description: "Get the weather for a location",
        parameters: z.object({
          lat: z.number().describe("The latitude of the location"),
          lon: z.number().describe("The longitude of the location"),
          unit: z
            .enum(["C", "F"])
            .describe("The unit to display the temperature in"),
        }),
        execute: async ({ lat, lon, unit }) => {
          const { value, description } = getWeather({ lat, lon, unit });
          return `It is currently ${value}°${unit} and ${description}!`;
        },
      },
      getSources: {
        description: "This will pull information from your proprietary sources",
        parameters: z.object({
          query: z
            .string()
            .describe("The search query to find relevant documents"),
        }),
        execute: async ({ query }) => {
          const retrievalService = new RetrievalService();
          const documents = await retrievalService.searchDocuments(query);
          return documents;
        },
      },
    },
  });

  return result.toDataStreamResponse();
}
