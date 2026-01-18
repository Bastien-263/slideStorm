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
.registerWidget(
  "pdf-uploader",
  {
    description: "Upload PDF and send to Dust assistant",
  },
  {
    description: "Upload PDF pages (as base64 PNG images) and send them to Dust assistant for slide generation.",
    inputSchema: {
      message: z.string().describe("Description of the slides to generate"),
      pngPages: z.array(z.object({
        data: z.string().describe("Base64 encoded PNG image data"),
        filename: z.string().describe("Original filename (e.g., 'page_1.png')"),
      })).describe("Array of PNG pages from the PDF"),
    },
  },
  async ({ message, pngPages }) => {
    try {
      const agentId = process.env.AGENT_ID;

      // Step 1: Create conversation
      const convResponse = await fetch(`https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations`, {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          visibility: 'unlisted',
          title: null,
        }),
      });
      const convJson = await convResponse.json();
      const convId = convJson.conversation?.sId;

      if (!convId) {
        return {
          content: [{ type: "text", text: "Failed to create conversation" }],
          isError: true,
        };
      }

      // Step 2: Upload each PNG page
      for (const page of pngPages) {
        // Create file entry
        const fileCreateResponse = await fetch(`https://dust.tt/api/v1/w/${workspaceId}/files`, {
          method: 'POST',
          headers: {
            'authorization': `Bearer ${apiKey}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            contentType: 'image/png',
            fileName: page.filename,
            fileSize: Buffer.from(page.data, 'base64').length,
            useCase: 'conversation',
            useCaseMetadata: { conversationId: convId },
          }),
        });
        const fileCreateJson = await fileCreateResponse.json();
        const fileId = fileCreateJson.file?.sId;

        if (!fileId) continue;

        // Upload file
        const buffer = Buffer.from(page.data, 'base64');
        const FormData = (await import('form-data')).default;
        const formData = new FormData();
        formData.append('file', buffer, {
          filename: page.filename,
          contentType: 'image/png',
        });

        await fetch(`https://dust.tt/api/v1/w/${workspaceId}/files/${fileId}`, {
          method: 'POST',
          headers: {
            'authorization': `Bearer ${apiKey}`,
            ...formData.getHeaders(),
          },
          body: formData as any,
        });

        // Create content fragment
        await fetch(`https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations/${convId}/content_fragments`, {
          method: 'POST',
          headers: {
            'authorization': `Bearer ${apiKey}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            title: page.filename,
            fileId,
          }),
        });
      }

      // Step 3: Send message to agent
      await fetch(`https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations/${convId}/messages`, {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          content: message,
          mentions: agentId ? [{ configurationId: agentId }] : [],
          context: { username: 'slidestorm', timezone: 'Europe/Paris' },
        }),
      });

      // Step 4: Stream events and wait for agent to finish
      const streamResponse = await fetch(`https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations/${convId}/events`, {
        method: 'GET',
        headers: {
          'authorization': `Bearer ${apiKey}`,
          'accept': 'text/event-stream',
        },
      });

      if (streamResponse.body) {
        const reader = streamResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let agentDone = false;

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
      }

      // Step 5: Get conversation details to retrieve TSX file
      const convDetailsResponse = await fetch(`https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations/${convId}`, {
        method: 'GET',
        headers: {
          'authorization': `Bearer ${apiKey}`,
          'accept': 'application/json',
        },
      });
      const convDetails = await convDetailsResponse.json();

      // Find TSX file in agent actions
      const agentMessages = convDetails.conversation?.content?.flat().filter((item: any) => item.type === 'agent_message') || [];

      for (const msg of agentMessages) {
        for (const action of msg.actions || []) {
          if (action.functionCallName === 'interactive_content__create_interactive_content_file' && action.generatedFiles?.length > 0) {
            const file = action.generatedFiles[0];
            const fileId = file.fileId || file.sId;
            const fileName = file.title || 'generated.tsx';

            // Download TSX file
            const fileResponse = await fetch(`https://dust.tt/api/v1/w/${workspaceId}/files/${fileId}`, {
              method: 'GET',
              headers: {
                'authorization': `Bearer ${apiKey}`,
                'accept': 'text/plain',
              },
            });
            const fileContent = await fileResponse.text();

            return {
              structuredContent: {
                tsxCode: fileContent,
                fileName,
                conversationId: convId,
              },
              content: [
                { type: "text", text: `✅ Slides generated successfully!\n\nFile: ${fileName}\nConversation: https://dust.tt/w/${workspaceId}/assistant/${convId}\n\n${fileContent}` }
              ],
              isError: false,
            };
          }
        }
      }

      return {
        content: [{ type: "text", text: "Agent finished but no TSX file was generated." }],
        isError: true,
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
);

export default server;
export type AppType = typeof server;
