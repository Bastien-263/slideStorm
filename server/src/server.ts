import { McpServer } from "skybridge/server";
import "dotenv/config";

const server = new McpServer(
  {
    name: "SlideStorm MCP Server",
    version: "0.0.1",
  },
  { capabilities: {} },
)
.registerWidget(
  "pdf-uploader",
  {
    description: "Upload PDF and send to Dust assistant",
  },
  {
    description: "Upload a PDF, convert it to PNG images, and automatically send them to Dust assistant.",
    inputSchema: {
      // No required input - widget starts immediately when triggered
    },
  },
  async () => {
    return {
      content: [],
      isError: false,
    };
  },
);

export default server;
export type AppType = typeof server;
