import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

const API_URL = (process.env.BEYOND_API_URL || "http://localhost:3001").replace(/\/$/, "");
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

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Beyond CRM MCP server running...");
