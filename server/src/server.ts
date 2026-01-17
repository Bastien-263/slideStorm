import { McpServer } from "skybridge/server";
import { z } from "zod";
import "dotenv/config";

const apiKey = process.env.API_KEY;
const agentId = process.env.ID_AGENT;
const spaceId = process.env.ID_SPACED;

const Answers = [
  "As I see it, yes",
  "Don't count on it",
  "It is certain",
  "It is decidedly so",
  "Most likely",
  "My reply is no",
  "My sources say no",
  "Outlook good",
  "Outlook not so good",
  "Signs point to yes",
  "Very doubtful",
  "Without a doubt",
  "Yes definitely",
  "Yes",
  "You may rely on it",
];

const server = new McpServer(
  {
    name: "Premier Server mcp",
    version: "0.0.1",
  },
  { capabilities: {} },
).registerWidget(
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
      const url = 'https://dust.tt/api/v1/w/'+spaceId+'/assistant/conversations';
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
            content: 'salut'
          }
        })
      };
      var answer = "aaaaaaa";
      try {
        const res = await fetch(url, options);
        const json = await res.json();
        answer = JSON.stringify(json, null, 2);
        console.log(answer);
      } catch (err) {
        console.error(err);
      }
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
);

export default server;
export type AppType = typeof server;
