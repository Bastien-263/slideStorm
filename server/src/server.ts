import { McpServer } from "skybridge/server";
import "dotenv/config";
import { z } from "zod";

const workspaceId = process.env.WORKSPACE_ID;
const apiKey = process.env.API_KEY;

const server = new McpServer(
  {
    name: "SlideStorm MCP Server",
    version: "0.0.1",
  },
  { capabilities: {} },
)
.registerTool(
  "dust_api_call",
  {
    description: "Make API calls to Dust (conversations, files, messages, etc.)",
    inputSchema: {
      endpoint: z.string().describe("API endpoint path (e.g., '/assistant/conversations')"),
      method: z.enum(["GET", "POST"]).default("POST"),
      body: z.any().optional().describe("Request body as JSON"),
    },
  },
  async ({ endpoint, method, body }) => {
    const url = `https://dust.tt/api/v1/w/${workspaceId}${endpoint}`;

    const headers: Record<string, string> = {
      'authorization': `Bearer ${apiKey}`,
      'accept': 'application/json',
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (method === 'POST' && body) {
      headers['content-type'] = 'application/json';
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: data, status: response.status }) }],
        isError: true,
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      isError: false,
    };
  }
)
.registerTool(
  "dust_upload_file",
  {
    description: "Upload a file (PNG image) to Dust",
    inputSchema: {
      fileId: z.string().describe("File ID from Dust file creation"),
      fileData: z.string().describe("Base64 encoded file data"),
      fileName: z.string().describe("Original file name"),
    },
  },
  async ({ fileId, fileData, fileName }) => {
    const url = `https://dust.tt/api/v1/w/${workspaceId}/files/${fileId}`;

    // Decode base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');

    // Create FormData
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', buffer, {
      filename: fileName,
      contentType: 'image/png',
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${apiKey}`,
        ...formData.getHeaders(),
      },
      body: formData as any,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: data, status: response.status }) }],
        isError: true,
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      isError: false,
    };
  }
)
.registerTool(
  "dust_get_file",
  {
    description: "Download a file (TSX) from Dust",
    inputSchema: {
      fileId: z.string().describe("File ID to download"),
    },
  },
  async ({ fileId }) => {
    const url = `https://dust.tt/api/v1/w/${workspaceId}/files/${fileId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'authorization': `Bearer ${apiKey}`,
        'accept': 'text/plain',
      },
    });

    const text = await response.text();

    if (!response.ok) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: text, status: response.status }) }],
        isError: true,
      };
    }

    return {
      content: [{ type: "text", text }],
      isError: false,
    };
  }
)
.registerTool(
  "dust_stream_events",
  {
    description: "Stream conversation events from Dust (waits for agent to finish)",
    inputSchema: {
      conversationId: z.string().describe("Conversation ID to stream"),
    },
  },
  async ({ conversationId }) => {
    const url = `https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations/${conversationId}/events`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'authorization': `Bearer ${apiKey}`,
        'accept': 'text/event-stream',
      },
    });

    if (!response.ok) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: 'Stream failed', status: response.status }) }],
        isError: true,
      };
    }

    // Read the stream until agent is done
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let agentDone = false;

    if (!reader) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: 'No response body' }) }],
        isError: true,
      };
    }

    while (!agentDone) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === 'done') continue;

          try {
            const event = JSON.parse(jsonStr);
            if (event.data?.type === 'agent_message_done') {
              agentDone = true;
              break;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    return {
      content: [{ type: "text", text: JSON.stringify({ done: true }) }],
      isError: false,
    };
  }
)
.registerTool(
  "update_slides",
  {
    description: "Update the presentation slides based on user request. Read the current TSX code from the DataLLM context, apply the requested modifications, and return the complete updated TSX code. The widget will automatically detect this tool call and apply the changes to the iframe.",
    inputSchema: {
      modifiedTsx: z.string().describe("The complete updated TSX code with all requested modifications applied"),
      changesSummary: z.string().describe("Brief summary of changes made (e.g., 'Increased all title font sizes by 50%')")
    },
  },
  async ({ modifiedTsx, changesSummary }) => {
    console.log("🔧 update_slides tool called");
    console.log("   changesSummary:", changesSummary);
    console.log("   modifiedTsx length:", modifiedTsx?.length);
    console.log("   modifiedTsx first 100 chars:", modifiedTsx?.substring(0, 100));

    const response = {
      content: [{
        type: "text" as const,
        text: `✅ Slides updated: ${changesSummary}`
      }],
      structuredContent: {
        modifiedTsx,
        changesSummary
      },
      _meta: {
        timestamp: Date.now(),
        toolName: "update_slides"
      }
    };

    console.log("   📤 Returning response with structuredContent");
    console.log("   📦 Response structure:", JSON.stringify(response, null, 2));
    return response;
  }
)
.registerWidget(
  "create-slides",
  {
    description: "Create beautiful presentation slides from your PDF documents. Upload a PDF and optionally specify slide template preferences to generate interactive 16:9 slides with charts and visualizations.",
    _meta: {
      ui: {
        csp: {
          connectDomains: [
            "https://*.ngrok.io",
            "https://*.ngrok-free.app",
            "https://*.alpic.live",
            "http://localhost:3000"
          ],
        },
      },
    },
  },
  {
    description: "Main entry point for SlideStorm - transforms PDFs into interactive presentation slides. The widget is persistent and listens for update_slides tool calls via useToolInfo.",
  },
  async () => {
    // Widget logic is handled entirely client-side in the React component
    // Widget listens to tool calls via useToolInfo hook
    return {
      content: [{ type: "text", text: "SlideStorm widget loaded" }],
      isError: false,
    };
  }
);

export default server;
export type AppType = typeof server;
