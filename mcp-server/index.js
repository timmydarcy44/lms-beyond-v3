import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

const API_URL = (process.env.BEYOND_API_URL || "http://localhost:3000").replace(/\/$/, "");
const API_KEY = process.env.BEYOND_MCP_API_KEY;

const headers = {
  "Content-Type": "application/json",
  "x-api-key": API_KEY || "",
};

async function api(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
  return json;
}

/** @returns {Server} */
function createBeyondCrmServer() {
  const server = new Server({ name: "beyond-crm", version: "1.0.0" }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "list_prospects",
        description:
          "Lister les prospects du pipeline BTOB Beyond avec filtres optionnels (priorité, secteur, statut).",
        inputSchema: {
          type: "object",
          properties: {
            priority: { type: "string", enum: ["haute", "moyenne", "standard"] },
            sector: { type: "string" },
            status: { type: "string" },
            limit: { type: "number" },
          },
        },
      },
      {
        name: "create_prospect",
        description: "Créer un prospect BTOB (company_name requis). source=claude appliqué automatiquement.",
        inputSchema: {
          type: "object",
          properties: {
            company_name: { type: "string" },
            contact_name: { type: "string" },
            contact_role: { type: "string" },
            sector: { type: "string" },
            priority: { type: "string" },
            why_target: { type: "string" },
            training_needs: { type: "array", items: { type: "string" } },
            next_action: { type: "string" },
            next_action_date: { type: "string" },
          },
          required: ["company_name"],
        },
      },
      {
        name: "update_prospect",
        description: "Mettre à jour un prospect existant (partial update).",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            stage_slug: { type: "string" },
            priority: { type: "string" },
            engagement_score: { type: "number" },
            next_action: { type: "string" },
            next_action_date: { type: "string" },
            notes: { type: "string" },
          },
          required: ["id"],
        },
      },
      {
        name: "get_pipeline_summary",
        description: "Résumé chiffré du pipeline BTOB (priorités, statuts, actions en retard).",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "bulk_create_prospects",
        description: "Créer plusieurs prospects en une opération.",
        inputSchema: {
          type: "object",
          properties: {
            prospects: { type: "array", items: { type: "object" } },
          },
          required: ["prospects"],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === "list_prospects") {
        const params = new URLSearchParams();
        if (args?.priority) params.set("priority", String(args.priority));
        if (args?.sector) params.set("sector", String(args.sector));
        if (args?.status) params.set("status", String(args.status));
        if (args?.limit) params.set("limit", String(args.limit));
        const q = params.toString();
        const data = await api(`/api/mcp/pipeline-btob${q ? `?${q}` : ""}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      if (name === "create_prospect") {
        const data = await api("/api/mcp/pipeline-btob", {
          method: "POST",
          body: JSON.stringify({ ...args, source: "claude" }),
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      if (name === "update_prospect") {
        const id = String(args?.id ?? "");
        const { id: _id, ...patch } = args ?? {};
        const data = await api(`/api/mcp/pipeline-btob/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      if (name === "get_pipeline_summary") {
        const data = await api("/api/mcp/pipeline-btob/summary");
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      if (name === "bulk_create_prospects") {
        const list = Array.isArray(args?.prospects) ? args.prospects : [];
        const results = [];
        let errors = 0;
        for (const item of list) {
          try {
            const data = await api("/api/mcp/pipeline-btob", {
              method: "POST",
              body: JSON.stringify({ ...item, source: "claude" }),
            });
            results.push({ ok: true, prospect: data.prospect });
          } catch (e) {
            errors += 1;
            results.push({ ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ created: results.filter((r) => r.ok).length, errors, results }, null, 2),
            },
          ],
        };
      }

      return { content: [{ type: "text", text: `Outil inconnu: ${name}` }], isError: true };
    } catch (e) {
      return {
        content: [{ type: "text", text: e instanceof Error ? e.message : String(e) }],
        isError: true,
      };
    }
  });

  return server;
}

const app = express();
app.use(express.json({ limit: "4mb" }));

/** @type {Record<string, SSEServerTransport>} */
const transports = {};

app.get("/sse", async (req, res) => {
  try {
    const transport = new SSEServerTransport("/messages", res);
    const sessionId = transport.sessionId;
    transports[sessionId] = transport;
    transport.onclose = () => {
      delete transports[sessionId];
    };

    const server = createBeyondCrmServer();
    await server.connect(transport);
    console.error(`Beyond CRM MCP — session SSE établie (${sessionId})`);
  } catch (error) {
    console.error("Erreur établissement SSE:", error);
    if (!res.headersSent) {
      res.status(500).send("Error establishing SSE stream");
    }
  }
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId) {
    res.status(400).send("Missing sessionId parameter");
    return;
  }

  const transport = transports[String(sessionId)];
  if (!transport) {
    res.status(404).send("Session not found");
    return;
  }

  try {
    await transport.handlePostMessage(req, res, req.body);
  } catch (error) {
    console.error("Erreur POST /messages:", error);
    if (!res.headersSent) {
      res.status(500).send("Error handling request");
    }
  }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "beyond-crm-mcp" });
});

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, "0.0.0.0", (error) => {
  if (error) {
    console.error("Échec démarrage serveur:", error);
    process.exit(1);
  }
  console.error(`Beyond CRM MCP (SSE) — http://0.0.0.0:${PORT} — GET /sse, POST /messages`);
});

process.on("SIGINT", async () => {
  for (const sessionId of Object.keys(transports)) {
    try {
      await transports[sessionId].close();
    } catch (error) {
      console.error(`Fermeture session ${sessionId}:`, error);
    }
    delete transports[sessionId];
  }
  process.exit(0);
});
