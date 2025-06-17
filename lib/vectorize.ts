import { Configuration, PipelinesApi } from "@vectorize-io/vectorize-client";

interface VectorizeDocument {
  content: string;
  metadata?: Record<string, any>;
  score?: number;
}

interface VectorizeResponse {
  documents: VectorizeDocument[];
}

export class VectorizeService {
  private pipelinesApi: any;
  private organizationId: string;
  private pipelineId: string;

  constructor() {
    const config = new Configuration({
      accessToken: process.env.VECTORIZE_PIPELINE_ACCESS_TOKEN,
      basePath: "https://api.vectorize.io/v1",
    });

    this.pipelinesApi = new PipelinesApi(config);
    this.organizationId = process.env.VECTORIZE_ORGANIZATION_ID!;
    this.pipelineId = process.env.VECTORIZE_PIPELINE_ID!;
  }

  async retrieveDocuments(
    question: string,
    numResults: number = 5
  ): Promise<VectorizeDocument[]> {
    try {
      const response = await this.pipelinesApi.retrieveDocuments({
        organization: this.organizationId,
        pipeline: this.pipelineId,
        retrieveDocumentsRequest: {
          question,
          numResults,
        },
      });

      return response.documents || [];
    } catch (error: any) {
      console.error("Vectorize API Error:", error?.response);
      if (error?.response?.text) {
        console.error("Error details:", await error.response.text());
      }
      throw new Error("Failed to retrieve documents from Vectorize");
    }
  }

  formatDocumentsForContext(documents: VectorizeDocument[]): string {
    if (!documents.length) {
      return "No relevant documents found.";
    }

    return documents
      .map((doc, index) => `Document ${index + 1}:\n${doc.content}`)
      .join("\n\n---\n\n");
  }
}
