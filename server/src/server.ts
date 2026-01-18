import { McpServer } from "skybridge/server";
import { z } from "zod";
import "dotenv/config";

const apiKey = process.env.API_KEY;
const agentId = process.env.AGENT_ID;
const workspaceId = process.env.WORKSPACE_ID;

const server = new McpServer(
  {
    name: "SlideStorm MCP Server",
    version: "0.0.1",
  },
  { capabilities: {} },
)
.registerWidget(
  "magic-8-ball",
  {
    description: "server appelant dust",
  },
  {
    description: "Server allant taper un agent dust spécifique pour de la génération de powerpoint.",
    inputSchema: {
      question: z.string().describe("The user description of the powerpoint that he wants."),
    },
  },
  async ({ question }) => {
    try {
      const url = 'https://dust.tt/api/v1/w/'+workspaceId+'/assistant/conversations';
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: 'Bearer '+apiKey
        },
        body: JSON.stringify({
          message: {
            mentions: [{configurationId: agentId}],
            context: {username: 'slide', timezone: 'Europe/Paris'},
            content: question
          }
        })
      };
      const res = await fetch(url, options);
      const json = await res.json();
      const answer = JSON.stringify(json, null, 2);
      console.log(answer);

      return {
        structuredContent: { answer },
        content: [],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }
  },
)
.registerWidget(
  "pdf-uploader",
  {
    description: "Upload and convert PDF files to PNG images",
  },
  {
    description: "Allows user to upload a PDF from their computer and converts it to PNG images.",
    inputSchema: {
      // No required input - widget starts immediately when triggered
    },
  },
  async () => {
    // Return empty content to display the upload interface
    return {
      content: [],
      isError: false,
    };
  },
)
.registerWidget(
  "carousel",
  {
    description: "Upload and convert PDF files to PNG images",
  },
  {
    description: "test de carousel",
    inputSchema: {
      // No required input - widget starts immediately when triggered
    },
  },
  async () => {
    // Return empty content to display the upload interface
    return {
      content: [],
      isError: false,
    };
  },
);

export default server;
export type AppType = typeof server;
