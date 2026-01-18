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
  "send-message-to-dust",
  {
    description: "Send a message to Dust assistant with optional PNG attachments",
  },
  {
    description: "Allows user to send a message to Dust assistant and optionally attach PNG images.",
    inputSchema: {
      // No required input - widget starts immediately when triggered
    },
  },
  async () => {
    // Return empty content to display the send message interface
    return {
      content: [],
      isError: false,
    };
  },
);

export default server;
export type AppType = typeof server;
